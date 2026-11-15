// Almacén — v41: IndexedDB (almacenamiento real del dispositivo) con
// migración automática desde localStorage y fallback si IndexedDB falla.
//
// POR QUÉ: el DB completo (incluidas las fotos de las reparaciones en
// base64) vivía en localStorage, que en Android Chrome tiene un tope
// duro de ~5 MB aunque el teléfono tenga 128 GB libres. Resultado:
// "Almacenamiento lleno" con el móvil vacío y datos perdidos en silencio.
// IndexedDB usa la cuota real del origen (~GB) y junto con
// navigator.storage.persist() Android no la borra bajo presión.
//
// API pública idéntica a la v1 (DB.save, DB.repairs, ...): ni views.js
// ni sync.js cambian. Las funciones son síncronas igual que antes —
// el guardado físico a IndexedDB es async en segundo plano, y la
// fuente de verdad inmediata es `data` en memoria: un fallo de disco
// nunca pierde el dato de la sesión actual, se reintenta en el
// siguiente save().
const DB = (() => {
  const KEY = 'taller_db_v1';
  const IDB_NAME = 'taller-db';
  const IDB_STORE = 'kv';
  const SCHEMA_VERSION = 9;
  const DEFAULT_DEVICES = [
    'Televisor','Smart TV','Monitor','Laptop','PC de escritorio','Tablet',
    'Teléfono móvil','Impresora','Microondas','Lavadora','Refrigerador',
    'Aire acondicionado','Cocina eléctrica','Equipo de sonido','Cámara',
    'Consola de videojuegos','Router / Módem','Cargador','Batería','Otro'
  ];
  const DEFAULT_PRODUCTS = [
    'Cargador','Cable USB','Cable Tipo C','Cable Lightning','Cable HDMI',
    'Mica protectora','Protector de pantalla','Funda / Estuche','MicroSD','Memoria USB',
    'Adaptador OTG','Adaptador','Teléfono','Pantalla','Batería','Pila',
    'Micrófono','Botones','Auriculares','Audífonos','Bocina / Parlante',
    'Tarjeta SIM','Soporte','Control remoto','Mouse','Teclado',
    'Webcam','Lector de tarjetas','Hub USB','Fuente de poder','Herramientas',
    'Pegamento','Cinta','Tornillos','Conectores','Otro'
  ];
  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      appName: 'Taller',
      logo: null,
      logoPreset: 'tools',
      requirePassword: true,
      passwordHash: null,
      securityQuestions: [],
      deviceTypes: DEFAULT_DEVICES.slice(),
      productTypes: DEFAULT_PRODUCTS.slice(),
      defaultWarrantyDays: 30,
      productMinStock: {},
      creator: { phone: '', whatsapp: '' },
      github: {
        enabled: false, user: '', repo: '', branch: 'main',
        path: 'taller-data.json', token: '',
        autoSync: true, lastSyncAt: null, lastSha: null
      }
    },
    repairs: [],
    transactions: [],
    counter: 1,
    txCounter: 1
  };

  // ---- Estado ----
  let data = loadInitial();        // fuente de verdad inmediata (RAM)
  let backend = 'idb';             // 'idb' | 'local' — cuál se usa de verdad
  let idbReady = null;             // promesa de la conexión IndexedDB
  let flushing = false;            // hay un guardado físico en curso
  let flushScheduled = false;      // hay uno programado
  let lastPersistFail = 0;         // anti-spam del banner de error

  // ---------- Motor IndexedDB ----------
  function idb(){
    if(idbReady) return idbReady;
    idbReady = new Promise((resolve,reject)=>{
      let req;
      try{ req = indexedDB.open(IDB_NAME, 1); }
      catch(e){ reject(e); return; }
      req.onupgradeneeded = ()=>{ req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = ()=>resolve(req.result);
      req.onerror = ()=>reject(req.error || new Error('IndexedDB error'));
      req.onblocked = ()=>reject(new Error('IndexedDB bloqueada'));
    });
    idbReady.catch(()=>{ idbReady = null; });
    return idbReady;
  }
  function idbGet(key){
    return idb().then(db=>new Promise((res,rej)=>{
      const tx = db.transaction(IDB_STORE,'readonly');
      const rq = tx.objectStore(IDB_STORE).get(key);
      rq.onsuccess = ()=>res(rq.result);
      rq.onerror = ()=>rej(rq.error);
    }));
  }
  function idbPut(key, val){
    return idb().then(db=>new Promise((res,rej)=>{
      const tx = db.transaction(IDB_STORE,'readwrite');
      const rq = tx.objectStore(IDB_STORE).put(val, key);
      rq.onsuccess = ()=>res(true);
      rq.onerror = ()=>rej(rq.error);
    }));
  }

  // ---------- Carga inicial ----------
  // Orden: IndexedDB (nuevo) → localStorage (migración) → defaults.
  // En el arranque real esto es síncrono desde localStorage (instantáneo)
  // y, si hay datos más nuevos en IndexedDB, se aplican en cuanto llega.
  function loadInitial(){
    // 1) si localStorage ya tiene datos, partir de ahí (arranque síncrono)
    let ls = null;
    try{ ls = localStorage.getItem(KEY); }catch(_){}
    if(ls){
      try{
        const p = JSON.parse(ls);
        if(p && typeof p === 'object' && (p.repairs || p.settings)) return deepMerge(structuredClone(defaults), p);
      }catch(_){}
    }
    // 2) sin localStorage: defaults vacíos; IndexedDB puede traer datos después
    return structuredClone(defaults);
  }

  // Migración inicial localStorage → IndexedDB (una sola vez):
  // si IndexedDB está vacía y localStorage tiene datos, se copian y se
  // marca la migración. El borrado de localStorage se hace solo cuando
  // IndexedDB ya confirmó el guardado (nunca antes).
  async function migrateInitial(){
    let idbData = null;
    try{ idbData = await idbGet(KEY); }catch(_){ backend = 'local'; }
    if(idbData && typeof idbData === 'object'){
      // IndexedDB ya tiene datos: es la fuente de verdad (es más grande
      // que localStorage: contiene fotos que localStorage no pudo guardar).
      data = deepMerge(structuredClone(defaults), idbData);
      backend = 'idb';
      migrate();
      return;
    }
    // IndexedDB vacía: si localStorage tenía datos, migrarlos.
    let ls = null;
    try{ ls = localStorage.getItem(KEY); }catch(_){}
    if(ls && backend === 'idb'){
      try{
        const p = JSON.parse(ls);
        if(p && typeof p === 'object' && (p.repairs || p.settings)){
          const ok = await idbPut(KEY, p).catch(()=>false);
          if(ok){
            backend = 'idb';
            // localStorage se limpia SOLO tras confirmar IndexedDB.
            try{ localStorage.removeItem(KEY); }catch(_){}
          }
        }
      }catch(_){}
    }
    // Pedir almacenamiento persistente: Android no podrá borrar los
    // datos de la app bajo presión de espacio (el aviso "liberar espacio"
    // de Chrome ya no la incluye).
    try{
      if(navigator.storage && navigator.storage.persist){
        navigator.storage.persist().then(()=>{}).catch(()=>{});
      }
    }catch(_){}
  }

  // ---------- Guardado ----------
  // Guarda siempre en RAM (fuente de verdad inmediata) y programa el
  // guardado físico. sync/push usa RAM: la subida nunca se bloquea por
  // el estado del disco.
  function save(triggerSync=true){
    // 1) RAM: inmediato e infalible.
    // 2) Físico: programado con debounce (mínimo 300ms tras el último cambio).
    scheduleFlush();
    if(triggerSync && window.GitSync && DB.settings.github.enabled && DB.settings.github.autoSync){
      window.GitSync.schedulePush();
    }
    if(window.LocalFile && window.LocalFile.hasHandle()){
      window.LocalFile.scheduleWrite();
    }
  }

  function scheduleFlush(){
    if(backend === 'local'){
      // Modo fallback (sin IndexedDB): guardar directo a localStorage.
      flushToLocal();
      return;
    }
    if(flushing){
      flushScheduled = true;
      return;
    }
    flushing = true;
    setTimeout(()=>doFlush(), 300);
  }
  async function doFlush(){
    flushScheduled = false;
    const snapshot = JSON.stringify(data);
    try{
      await idbPut(KEY, snapshot);
      flushing = false;
      if(flushScheduled) scheduleFlush();
    }catch(e){
      flushing = false;
      // IndexedDB falló: probar localStorage como salvavidas.
      const lsOk = flushToLocal();
      if(!lsOk) showStorageBanner(e);
      if(flushScheduled) scheduleFlush();
    }
  }
  function flushToLocal(){
    try{ localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch(e){ return false; }
  }

  function showStorageBanner(err){
    // Anti-spam: un aviso por minuto como máximo.
    const now = Date.now();
    if(now - lastPersistFail < 60000) return;
    lastPersistFail = now;
    console.warn('Error guardando en disco', err);
    try{
      const banner = document.getElementById('storageWarn');
      if(!banner){
        const b = document.createElement('div');
        b.id = 'storageWarn';
        b.className = 'storage-warn';
        b.innerHTML = '⚠ <b>No se pudo guardar en el dispositivo</b> — los datos siguen activos en memoria y la sincronización con la nube no se ha detenido. '
          + 'Exporta una copia (Administración → Copia local) mientras revisas el almacenamiento del navegador.';
        (document.body || document.documentElement).appendChild(b);
      }
    }catch(_){}
  }

  // ---------- persist() + aviso de quota real ----------
  // Se ejecuta tras el login (no en cada save): pide almacenamiento
  // persistente y, si el navegador lo deniega y la cuota libre es
  // realmente pequeña, muestra el aviso — no antes, no con 128 GB libres.
  async function ensurePersistent(){
    try{
      if(navigator.storage && navigator.storage.persist){
        await navigator.storage.persist();
      }
    }catch(_){}
    // Diagnóstico (visible en la consola y en Administración):
    try{
      if(navigator.storage && navigator.storage.estimate){
        const est = await navigator.storage.estimate();
        DB.storageInfo = {
          usage: est.usage || 0,
          quota: est.quota || 0,
          usageMB: +(est.usage/1048576).toFixed(1),
          quotaGB: +(est.quota/1073741824).toFixed(1),
          persistent: !!(navigator.storage && navigator.storage.persisted && navigator.storage.persisted())
        };
      }
    }catch(_){}
    return DB.storageInfo || null;
  }

  // Arranque: migrar IndexedDB/localStorage en cuanto el módulo carga.
  // La UI no espera esto: parte de loadInitial() (síncrono) y los datos
  // de IndexedDB (si son más frescos) se aplican en milisegundos.
  migrateInitial();
  if(data && data.repairs) migrate();

  function migrate(){
    let changed = false;
    for(const r of data.repairs){
      if(r.devicePhoto && !r.devicePhotos){ r.devicePhotos = [r.devicePhoto]; changed = true; }
      if(!r.devicePhotos) r.devicePhotos = [];
      if(!r.naFields) r.naFields = [];
      if(!Array.isArray(r.clientPhones)){
        r.clientPhones = r.clientPhone ? [r.clientPhone] : [];
        changed = true;
      }
      if(r.clientAddress === undefined) r.clientAddress = null;
      if(r.clientIdNumber === undefined) r.clientIdNumber = null;
      if(r.status === 'awaiting'){ r.status = 'in_progress'; changed = true; }
      if(r.warrantyDays === undefined){ r.warrantyDays = null; changed = true; }
      if(r.deliveredAt === undefined){
        r.deliveredAt = r.status === 'delivered' ? (r.updatedAt || r.createdAt || null) : null;
        changed = true;
      }
      if(!Array.isArray(r.parts)){ r.parts = []; changed = true; }
    }
    if(!Array.isArray(data.transactions)){ data.transactions = []; changed = true; }
    if(typeof data.txCounter !== 'number'){ data.txCounter = 1; changed = true; }
    for(const t of data.transactions){
      if(t.unitCost === undefined){ t.unitCost = null; changed = true; }
      if(t.costTotal === undefined){ t.costTotal = null; changed = true; }
    }
    if(!Array.isArray(data.settings.deviceTypes) || !data.settings.deviceTypes.length){
      data.settings.deviceTypes = DEFAULT_DEVICES.slice(); changed = true;
    }
    if(!Array.isArray(data.settings.productTypes) || !data.settings.productTypes.length){
      data.settings.productTypes = DEFAULT_PRODUCTS.slice(); changed = true;
    }
    if(data.settings.defaultWarrantyDays == null){ data.settings.defaultWarrantyDays = 30; changed = true; }
    if(!data.settings.productMinStock || typeof data.settings.productMinStock!=='object'){
      data.settings.productMinStock = {}; changed = true;
    }
    if(!data.settings.creator){ data.settings.creator = { phone:'', whatsapp:'' }; changed = true; }
    if(data.settings.logo === undefined){ data.settings.logo = null; changed = true; }
    if(!data.settings.logoPreset){ data.settings.logoPreset = 'tools'; changed = true; }
    if(!Array.isArray(data.settings.securityQuestions)){ data.settings.securityQuestions = []; changed = true; }
    if(!data.settings.githubShared || typeof data.settings.githubShared!=='object'){
      data.settings.githubShared = null; changed = true;
    }
    data.schemaVersion = SCHEMA_VERSION;
    if(changed) save(false);
  }

  async function sha256(text){
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  // Normaliza: minúsculas + sin acentos + colapsa espacios. Para búsquedas robustas.
  function norm(s){
    if(s==null) return '';
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ').trim();
  }
  async function normAns(s){ return DB._normAnsImpl ? DB._normAnsImpl(s) : sha256(norm(s)); }

  return {
    DEFAULT_DEVICES, DEFAULT_PRODUCTS,
    get all(){ return data; },
    get settings(){ return data.settings; },
    get repairs(){ return data.repairs; },
    get transactions(){ return data.transactions; },
    get backend(){ return backend; },           // 'idb' | 'local'
    storageInfo: null,                          // lo llena ensurePersistent()
    ensurePersistent,
    save, sha256, norm,
    async hashAnswer(ans){ return sha256(norm(ans)); },
    setSecurityQuestions(list){
      data.settings.securityQuestions = Array.isArray(list)?list:[];
      save();
    },
    replaceAll(newData){
      data = deepMerge(structuredClone(defaults), newData);
      migrate();
      save(false);
    },
    updateSettings(patch){
      Object.assign(data.settings, patch);
      save();
    },
    updateCreator(patch){
      data.settings.creator = { ...data.settings.creator, ...patch };
      save(false);
    },
    updateGithub(patch){
      data.settings.github = { ...data.settings.github, ...patch };
      save(false);
    },
    setGithubShared(shared){
      data.settings.githubShared = shared || null;
      data.settings.githubSharedAt = shared ? (data.settings.githubSharedAt || Date.now()) : null;
      save(false);
    },
    get githubShared(){ return data.settings.githubShared || null; },
    // RESET TOTAL — restaura TODO el sistema a su estado inicial de fábrica.
    // Borra las claves de localStorage, el DB de IndexedDB y reconstruye
    // los valores por defecto.
    resetAll({ keepDeviceId = false } = {}){
      const devId = keepDeviceId ? localStorage.getItem('taller_device_id') : null;
      const keys = [
        'taller_db_v1','taller_gh_hashes','taller_gh_dirty_repairs','taller_gh_dirty_tx',
        'taller_gh_deleted','taller_gh_deleted_tx','taller_device_id',
        'taller_repair_draft_v1','taller_session','taller_handles'
      ];
      for(const k of keys){
        try{ localStorage.removeItem(k); }catch(_){}
      }
      // IndexedDB también (v41): datos y eventual residuo de migración.
      try{
        idb().then(db=>new Promise(res=>{
          const tx = db.transaction(IDB_STORE,'readwrite');
          const rq = tx.objectStore(IDB_STORE).clear();
          rq.onsuccess = ()=>res(true);
          rq.onerror = ()=>res(false);
        })).catch(()=>{});
      }catch(_){}
      data = structuredClone(defaults);
      data.schemaVersion = SCHEMA_VERSION;
      if(devId){ try{ localStorage.setItem('taller_device_id', devId); }catch(_){} }
      scheduleFlush();
      // Notificar al módulo de sincronización para que olvide hashes/tombstones
      if(window.GitSync && typeof window.GitSync.resetCaches === 'function'){
        try{ window.GitSync.resetCaches(); }catch(_){}
      }
      return true;
    },
    addDeviceType(name){
      name = (name||'').trim();
      if(!name) return false;
      if(data.settings.deviceTypes.some(d=>d.toLowerCase()===name.toLowerCase())) return false;
      data.settings.deviceTypes.push(name);
      data.settings.deviceTypes.sort((a,b)=>a.localeCompare(b,'es'));
      save();
      return true;
    },
    removeDeviceType(name){
      data.settings.deviceTypes = data.settings.deviceTypes.filter(d=>d!==name);
      save();
    },
    addProductType(name){
      name = (name||'').trim();
      if(!name) return false;
      if(data.settings.productTypes.some(d=>d.toLowerCase()===name.toLowerCase())) return false;
      data.settings.productTypes.push(name);
      data.settings.productTypes.sort((a,b)=>a.localeCompare(b,'es'));
      save();
      return true;
    },
    removeProductType(name){
      data.settings.productTypes = data.settings.productTypes.filter(d=>d!==name);
      save();
    },
    addRepair(r){
      const localSuffix = (()=>{
        try{
          let v = localStorage.getItem('taller_device_id');
          if(!v){ v = Math.random().toString(36).slice(2,6).toUpperCase(); localStorage.setItem('taller_device_id', v); }
          return v;
        }catch(_){ return Math.random().toString(36).slice(2,6).toUpperCase(); }
      })();
      r.id = 'R' + String(data.counter++).padStart(4,'0') + '-' + localSuffix;
      r.createdAt = Date.now();
      r.updatedAt = Date.now();
      if(r.status === 'delivered' && !r.deliveredAt) r.deliveredAt = Date.now();
      data.repairs.unshift(r);
      save();
      try{ window.GitSync && window.GitSync.markDirty && window.GitSync.markDirty(r.id); }catch(e){}
      return r;
    },
    updateRepair(id, patch){
      const r = data.repairs.find(x=>x.id===id);
      if(!r) return null;
      const prevStatus = r.status;
      Object.assign(r, patch, { updatedAt: Date.now() });
      if(r.status === 'delivered' && !r.deliveredAt) r.deliveredAt = Date.now();
      if(prevStatus === 'delivered' && r.status !== 'delivered') r.deliveredAt = null;
      save();
      try{ window.GitSync && window.GitSync.markDirty && window.GitSync.markDirty(id); }catch(e){}
      return r;
    },
    deleteRepair(id){
      data.repairs = data.repairs.filter(r=>r.id!==id);
      try{ window.GitSync && window.GitSync.markDeleted && window.GitSync.markDeleted(id); }catch(e){}
      save();
    },
    findRepair(id){ return data.repairs.find(r=>r.id===id); },
    // === Transacciones (ventas y compras) ===
    addTransaction(t){
      let id = (t && typeof t.id === 'string' && t.id) ? t.id : null;
      const taken = new Set(data.transactions.map(x=>x.id));
      if(id && taken.has(id)) id = null;
      if(!id){
        do { id = 'T' + String(data.txCounter++).padStart(4,'0'); }
        while(taken.has(id));
      }
      t.id = id;
      t.createdAt = t.createdAt || Date.now();
      t.updatedAt = t.updatedAt || Date.now();
      if(!t.date) t.date = t.createdAt;
      data.transactions.unshift(t);
      save();
      try{ window.GitSync && window.GitSync.markDirtyTx && window.GitSync.markDirtyTx(t.id); }catch(e){}
      return t;
    },
    updateTransaction(id, patch){
      const t = data.transactions.find(x=>x.id===id);
      if(!t) return null;
      Object.assign(t, patch, { updatedAt: Date.now() });
      save();
      try{ window.GitSync && window.GitSync.markDirtyTx && window.GitSync.markDirtyTx(id); }catch(e){}
      return t;
    },
    deleteTransaction(id){
      data.transactions = data.transactions.filter(t=>t.id!==id);
      try{ window.GitSync && window.GitSync.markDeletedTx && window.GitSync.markDeletedTx(id); }catch(e){}
      save();
    },
    findTransaction(id){ return data.transactions.find(t=>t.id===id); },
    searchTransactions(q){
      const nq = norm(q);
      if(!nq) return data.transactions;
      return data.transactions.filter(t => {
        const hay = [
          t.id, t.product, t.counterparty, t.notes, t.type,
          t.type==='sale'?'venta ingreso':'compra gasto',
          t.quantity, t.unitPrice, t.unitCost, t.costTotal, t.total,
          t.date?new Date(t.date).toLocaleDateString('es-ES'):''
        ].map(x=>norm(x)).join(' ');
        return hay.includes(nq);
      });
    },
    search(q){
      const nq = norm(q);
      if(!nq) return data.repairs;
      const statusMap = {pending:'pendiente',in_progress:'en proceso proceso',completed:'completada',delivered:'entregada',cancelled:'cancelada'};
      return data.repairs.filter(r => {
        const phones = (r.clientPhones||[]).join(' ');
        const partsTxt = (r.parts||[]).map(p=>`${p.name||''} ${p.qty||''} ${p.unitCost||''}`).join(' ');
        const hay = [
          r.id, r.clientName, phones, r.clientPhone, r.clientAddress, r.clientIdNumber,
          r.device, r.brand, r.model, r.serial, r.issue, r.notes,
          statusMap[r.status]||r.status, partsTxt,
          r.price, r.deposit, r.warrantyDays,
          r.dueDate?new Date(r.dueDate).toLocaleDateString('es-ES'):'',
          r.createdAt?new Date(r.createdAt).toLocaleDateString('es-ES'):'',
          r.deliveredAt?new Date(r.deliveredAt).toLocaleDateString('es-ES'):''
        ].map(x=>norm(x)).join(' ');
        return hay.includes(nq);
      });
    },
    byStatus(s){ return data.repairs.filter(r=>r.status===s); },
    todayPending(){
      const t = new Date(); t.setHours(0,0,0,0);
      const end = t.getTime() + 86400000;
      return data.repairs.filter(r =>
        (r.status==='pending'||r.status==='in_progress') &&
        r.dueDate && new Date(r.dueDate).getTime() < end
      );
    },
    // === Stock ===
    setProductMinStock(name, qty){
      const n = String(name||'').trim(); if(!n) return;
      data.settings.productMinStock = data.settings.productMinStock || {};
      const v = parseInt(qty,10);
      if(isNaN(v) || v<=0) delete data.settings.productMinStock[n];
      else data.settings.productMinStock[n] = v;
      save();
    },
    // Devuelve mapa { nombre: { purchased, sold, usedInRepairs, stock, min, invested, earned } }
    productStats(){
      const map = {};
      function key(n){ return String(n||'').trim(); }
      function ensure(n){
        if(!map[n]) map[n] = { name:n, purchased:0, sold:0, usedInRepairs:0, invested:0, earned:0, stock:0, min:0 };
        return map[n];
      }
      for(const t of data.transactions){
        const n = key(t.product); if(!n) continue;
        const q = Number(t.quantity||0);
        const total = Number(t.total||0);
        if(t.type==='purchase'){
          const m = ensure(n);
          m.purchased += q;
          m.invested += total;
        } else if(t.type==='sale'){
          const m = ensure(n);
          m.sold += q;
          const cost = t.costTotal!=null ? Number(t.costTotal) : 0;
          m.earned += (total - cost);
          m.invested += cost;
        }
      }
      for(const r of data.repairs){
        for(const p of (r.parts||[])){
          const n = key(p.name); if(!n) continue;
          const q = Number(p.qty||0);
          const c = Number(p.unitCost||0);
          const m = ensure(n);
          m.usedInRepairs += q;
          m.invested += c*q;
        }
      }
      const mins = data.settings.productMinStock||{};
      for(const n in map){
        map[n].stock = map[n].purchased - map[n].sold - map[n].usedInRepairs;
        map[n].min = mins[n]||0;
      }
      for(const n in mins){ ensure(n).min = mins[n]; }
      return map;
    },
    exportBlob(){
      return new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    },
    exportJson(){
      const url = URL.createObjectURL(this.exportBlob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `taller-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importJson(json){
      try{
        const p = typeof json==='string' ? JSON.parse(json) : json;
        if(!p.repairs) throw new Error('Formato inválido');
        this.replaceAll(p);
        return true;
      }catch(e){ console.warn(e); return false; }
    },
    mergeJson(json){
      try{
        const p = typeof json==='string' ? JSON.parse(json) : json;
        if(!p || (!Array.isArray(p.repairs) && !Array.isArray(p.transactions))){
          throw new Error('Formato inválido');
        }
        const added = { repairs: 0, transactions: 0 };
        const repIds = new Set(data.repairs.map(r=>r.id));
        for(const r of (p.repairs||[])){
          if(r && r.id && !repIds.has(r.id)){
            data.repairs.push(r);
            repIds.add(r.id);
            added.repairs++;
          }
        }
        const txIds = new Set((data.transactions||[]).map(t=>t.id));
        for(const t of (p.transactions||[])){
          if(t && t.id && !txIds.has(t.id)){
            data.transactions.push(t);
            txIds.add(t.id);
            added.transactions++;
          }
        }
        // Ajustar contadores para no chocar con ids existentes
        const maxRep = data.repairs.reduce((m,r)=>{
          const match = String(r.id||'').match(/^R(\d+)/i);
          const n = match ? parseInt(match[1],10) : NaN;
          return isFinite(n)&&n>m ? n : m;
        }, 0);
        if(maxRep+1 > (data.counter||1)) data.counter = maxRep+1;
        const maxTx = (data.transactions||[]).reduce((m,t)=>{
          const n = parseInt(String(t.id||'').replace(/\D/g,''),10);
          return isFinite(n)&&n>m ? n : m;
        }, 0);
        if(maxTx+1 > (data.txCounter||1)) data.txCounter = maxTx+1;
        if(p.settings){
          if(Array.isArray(p.settings.deviceTypes)){
            for(const d of p.settings.deviceTypes){
              if(d && !data.settings.deviceTypes.some(x=>x.toLowerCase()===d.toLowerCase())){
                data.settings.deviceTypes.push(d);
              }
            }
            data.settings.deviceTypes.sort((a,b)=>a.localeCompare(b,'es'));
          }
          if(Array.isArray(p.settings.productTypes)){
            for(const d of p.settings.productTypes){
              if(d && !data.settings.productTypes.some(x=>x.toLowerCase()===d.toLowerCase())){
                data.settings.productTypes.push(d);
              }
            }
            data.settings.productTypes.sort((a,b)=>a.localeCompare(b,'es'));
          }
        }
        migrate();
        save();
        return { ok:true, added };
      }catch(e){ console.warn(e); return { ok:false, error:e.message }; }
    }
  };

  function deepMerge(target, src){
    for(const k in src){
      if(src[k] && typeof src[k]==='object' && !Array.isArray(src[k])){
        target[k] = deepMerge(target[k]||{}, src[k]);
      } else if(src[k] !== undefined){
        target[k] = src[k];
      }
    }
    return target;
  }
})();

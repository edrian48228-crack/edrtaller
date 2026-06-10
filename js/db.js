// Almacén con localStorage + migración compatible hacia adelante.
const DB = (() => {
  const KEY = 'taller_db_v1';
  const SCHEMA_VERSION = 3;
  const DEFAULT_DEVICES = [
    'Televisor','Smart TV','Monitor','Laptop','PC de escritorio','Tablet',
    'Teléfono móvil','Impresora','Microondas','Lavadora','Refrigerador',
    'Aire acondicionado','Cocina eléctrica','Equipo de sonido','Cámara',
    'Consola de videojuegos','Router / Módem','Cargador','Batería','Otro'
  ];
  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      appName: 'Taller',
      requirePassword: true,
      passwordHash: null,
      deviceTypes: DEFAULT_DEVICES.slice(),
      github: {
        enabled: false,
        user: '',
        repo: '',
        branch: 'main',
        path: 'taller-data.json',
        token: '',
        autoSync: true,
        lastSyncAt: null,
        lastSha: null
      }
    },
    repairs: [],
    counter: 1
  };
  let data = load();
  migrate();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return structuredClone(defaults);
      const p = JSON.parse(raw);
      return deepMerge(structuredClone(defaults), p);
    }catch(e){ return structuredClone(defaults); }
  }
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
  function migrate(){
    // v1 -> v2+: devicePhoto (string) -> devicePhotos (array)
    let changed = false;
    for(const r of data.repairs){
      if(r.devicePhoto && !r.devicePhotos){
        r.devicePhotos = [r.devicePhoto];
        changed = true;
      }
      if(!r.devicePhotos) r.devicePhotos = [];
      if(!r.naFields) r.naFields = [];
    }
    // Lista de equipos: si quedó vacía, restaurar predeterminada
    if(!Array.isArray(data.settings.deviceTypes) || !data.settings.deviceTypes.length){
      data.settings.deviceTypes = DEFAULT_DEVICES.slice();
      changed = true;
    }
    data.schemaVersion = SCHEMA_VERSION;
    if(changed) save(false);
  }
  function save(triggerSync=true){
    try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){
      console.warn('localStorage lleno', e);
    }
    if(triggerSync && window.GitSync && DB.settings.github.enabled && DB.settings.github.autoSync){
      window.GitSync.schedulePush();
    }
    if(window.LocalFile && window.LocalFile.hasHandle()){
      window.LocalFile.scheduleWrite();
    }
  }

  async function sha256(text){
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  return {
    DEFAULT_DEVICES,
    get all(){ return data; },
    get settings(){ return data.settings; },
    get repairs(){ return data.repairs; },
    save, sha256,
    replaceAll(newData){
      data = deepMerge(structuredClone(defaults), newData);
      migrate();
      save(false);
    },
    updateSettings(patch){
      Object.assign(data.settings, patch);
      save();
    },
    updateGithub(patch){
      data.settings.github = { ...data.settings.github, ...patch };
      save(false); // los cambios de config no disparan push
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
    addRepair(r){
      r.id = 'R' + String(data.counter++).padStart(4,'0');
      r.createdAt = Date.now();
      r.updatedAt = Date.now();
      data.repairs.unshift(r);
      save();
      return r;
    },
    updateRepair(id, patch){
      const r = data.repairs.find(x=>x.id===id);
      if(!r) return null;
      Object.assign(r, patch, { updatedAt: Date.now() });
      save();
      return r;
    },
    deleteRepair(id){
      data.repairs = data.repairs.filter(r=>r.id!==id);
      save();
    },
    findRepair(id){ return data.repairs.find(r=>r.id===id); },
    search(q){
      q = (q||'').toLowerCase().trim();
      if(!q) return data.repairs;
      return data.repairs.filter(r =>
        (r.clientName||'').toLowerCase().includes(q) ||
        (r.clientPhone||'').toLowerCase().includes(q) ||
        (r.device||'').toLowerCase().includes(q) ||
        (r.brand||'').toLowerCase().includes(q) ||
        (r.id||'').toLowerCase().includes(q) ||
        (r.issue||'').toLowerCase().includes(q)
      );
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
    }
  };
})();

// GitHub Sync via Contents API + File System Access API para guardar local.
// v18: aislamiento por usuario (scope) + registro de actividad en vivo.
const GitSync = (() => {
  let pushTimer = null;
  let busy = false;
  let lastError = null;
  const logs = [];       // {t:ts, level:'info|ok|err|warn', msg}
  const listeners = new Set();
  const MAX_LOGS = 80;

  function emit(level, msg){
    const entry = { t: Date.now(), level, msg: String(msg) };
    logs.unshift(entry);
    if(logs.length > MAX_LOGS) logs.length = MAX_LOGS;
    if(level === 'err') lastError = msg; else if(level === 'ok') lastError = null;
    listeners.forEach(fn => { try{ fn(entry, logs); }catch(_){} });
  }
  function onLog(fn){ listeners.add(fn); return ()=> listeners.delete(fn); }
  function getLogs(){ return logs.slice(); }
  function getStatus(){
    return { busy, lastError, lastSyncAt: DB.settings.github.lastSyncAt };
  }
  function clearLogs(){ logs.length = 0; listeners.forEach(fn=>{ try{ fn(null, logs); }catch(_){} }); }

  // Sanitiza scope para usarlo como segmento de ruta
  function sanitizeScope(s){
    return String(s||'').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
  }
  // Devuelve la ruta efectiva en el repo (con prefijo de usuario si aplica)
  function effectivePath(g){
    g = g || DB.settings.github;
    const base = (g.path||'taller-data.json').replace(/^\/+/,'');
    const scope = sanitizeScope(g.scope || g.user || '');
    if(!scope) return base;
    // Evita doble prefijo si el usuario ya lo escribió
    if(base.startsWith(`users/${scope}/`)) return base;
    return `users/${scope}/${base}`;
  }

  function api(path, init={}){
    const cfg = DB.settings.github;
    return fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        'Accept':'application/vnd.github+json',
        'Authorization':`token ${cfg.token}`,
        'Content-Type':'application/json',
        ...(init.headers||{})
      }
    });
  }
  function cfgOk(){
    const g = DB.settings.github;
    return g.enabled && g.token && g.user && g.repo && g.path;
  }
  function b64encode(str){ return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b64){ return decodeURIComponent(escape(atob(b64.replace(/\n/g,'')))); }

  async function getRemoteSha(){
    const g = DB.settings.github;
    const p = effectivePath(g);
    const r = await api(`/repos/${g.user}/${g.repo}/contents/${encodeURIComponent(p)}?ref=${encodeURIComponent(g.branch||'main')}`);
    if(r.status===404) return { sha:null, content:null };
    if(!r.ok) throw new Error('GitHub '+r.status);
    const j = await r.json();
    return { sha:j.sha, content: b64decode(j.content) };
  }

  async function push(){
    if(!cfgOk()){ emit('err','Configuración incompleta'); throw new Error('Configuración incompleta'); }
    busy = true;
    const g = DB.settings.github;
    const p = effectivePath(g);
    emit('info', `Subiendo a ${g.user}/${g.repo}@${g.branch||'main'} → ${p}`);
    try{
      let sha = g.lastSha;
      try{
        const remote = await getRemoteSha();
        sha = remote.sha;
        if(sha) emit('info','Detectada versión remota previa, se actualizará');
        else emit('info','No existía archivo remoto, se creará');
      }catch(e){ emit('warn','No se pudo leer SHA remoto: '+e.message); }
      const body = {
        message: `taller: backup ${new Date().toISOString()}`,
        content: b64encode(JSON.stringify(DB.all, null, 2)),
        branch: g.branch || 'main'
      };
      if(sha) body.sha = sha;
      const r = await api(`/repos/${g.user}/${g.repo}/contents/${encodeURIComponent(p)}`, {
        method:'PUT', body: JSON.stringify(body)
      });
      if(!r.ok){
        const t = await r.text();
        emit('err', `Push falló (${r.status}): ${t.slice(0,160)}`);
        throw new Error('Push falló: '+r.status);
      }
      const j = await r.json();
      DB.updateGithub({ lastSha: j.content.sha, lastSyncAt: Date.now() });
      emit('ok', `Subida completada · ${new Date().toLocaleTimeString()}`);
      return true;
    } finally { busy = false; }
  }

  async function pull(){
    if(!cfgOk()){ emit('err','Configuración incompleta'); throw new Error('Configuración incompleta'); }
    busy = true;
    const g = DB.settings.github;
    emit('info', `Descargando de ${g.user}/${g.repo} → ${effectivePath(g)}`);
    try{
      const remote = await getRemoteSha();
      if(!remote.content){ emit('err','No hay archivo remoto aún'); throw new Error('No hay archivo remoto aún'); }
      const ok = DB.importJson(remote.content);
      if(!ok){ emit('err','JSON remoto inválido'); throw new Error('JSON remoto inválido'); }
      DB.updateGithub({ lastSha: remote.sha, lastSyncAt: Date.now() });
      emit('ok','Datos descargados y aplicados localmente');
      return true;
    } finally { busy = false; }
  }

  async function test(){
    if(!cfgOk()){ emit('err','Completa todos los campos'); throw new Error('Completa todos los campos'); }
    busy = true;
    const g = DB.settings.github;
    emit('info', `Probando conexión con ${g.user}/${g.repo}…`);
    try{
      const r = await api(`/repos/${g.user}/${g.repo}`);
      if(!r.ok){ emit('err','No se pudo acceder al repo ('+r.status+')'); throw new Error('No se pudo acceder al repo ('+r.status+')'); }
      const j = await r.json();
      emit('ok',`Repo accesible · rama por defecto: ${j.default_branch}`);
      // verifica rama
      const br = await api(`/repos/${g.user}/${g.repo}/branches/${encodeURIComponent(g.branch||'main')}`);
      if(br.ok) emit('ok',`Rama "${g.branch||'main'}" verificada`);
      else emit('warn',`La rama "${g.branch||'main'}" no existe aún (se creará al subir)`);
      // intenta listar el archivo
      try{
        const rs = await getRemoteSha();
        if(rs.sha) emit('ok',`Archivo remoto encontrado · ${effectivePath(g)}`);
        else emit('info',`Aún no hay archivo en ${effectivePath(g)} (se creará al subir)`);
      }catch(e){ emit('warn','No se pudo leer el archivo: '+e.message); }
      return true;
    } finally { busy = false; }
  }

  function schedulePush(){
    clearTimeout(pushTimer);
    pushTimer = setTimeout(()=>{
      emit('info','Auto-sincronización iniciada por cambios locales');
      push().then(()=>UI.toast('Sincronizado con GitHub'))
            .catch(e=>UI.toast('Sync error: '+e.message));
    }, 1500);
  }

  return { push, pull, test, schedulePush, cfgOk, onLog, getLogs, getStatus, clearLogs, effectivePath, sanitizeScope };
})();
window.GitSync = GitSync;

// File System Access — guardar JSON en una ubicación elegida por el usuario.
const LocalFile = (() => {
  const DB_NAME = 'taller_handles';
  const STORE = 'kv';
  let cachedHandle = null;
  let writeTimer = null;

  function idb(){
    return new Promise((res, rej)=>{
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = ()=> req.result.createObjectStore(STORE);
      req.onsuccess = ()=> res(req.result);
      req.onerror = ()=> rej(req.error);
    });
  }
  async function setHandle(h){
    cachedHandle = h;
    const db = await idb();
    await new Promise((r,j)=>{
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(h, 'fileHandle');
      tx.oncomplete = r; tx.onerror = ()=>j(tx.error);
    });
  }
  async function loadHandle(){
    if(cachedHandle) return cachedHandle;
    try{
      const db = await idb();
      cachedHandle = await new Promise((r,j)=>{
        const tx = db.transaction(STORE,'readonly');
        const req = tx.objectStore(STORE).get('fileHandle');
        req.onsuccess = ()=> r(req.result||null);
        req.onerror = ()=> j(req.error);
      });
    }catch(e){ cachedHandle = null; }
    return cachedHandle;
  }
  async function clearHandle(){
    cachedHandle = null;
    try{
      const db = await idb();
      await new Promise((r,j)=>{
        const tx = db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).delete('fileHandle');
        tx.oncomplete = r; tx.onerror = ()=>j(tx.error);
      });
    }catch(e){}
  }
  function isSupported(){ return 'showSaveFilePicker' in window; }
  function hasHandle(){ return !!cachedHandle; }
  async function pickLocation(){
    if(!isSupported()) throw new Error('Tu navegador no soporta elegir ubicación. Usa exportar manual.');
    const h = await window.showSaveFilePicker({
      suggestedName: 'taller-data.json',
      types: [{ description:'JSON', accept:{ 'application/json':['.json'] } }]
    });
    await setHandle(h);
    await write();
    return h;
  }
  async function ensurePermission(h){
    const opts = { mode:'readwrite' };
    if((await h.queryPermission(opts)) === 'granted') return true;
    return (await h.requestPermission(opts)) === 'granted';
  }
  async function write(){
    if(!cachedHandle) return false;
    try{
      if(!(await ensurePermission(cachedHandle))) return false;
      const w = await cachedHandle.createWritable();
      await w.write(new Blob([JSON.stringify(DB.all,null,2)],{type:'application/json'}));
      await w.close();
      return true;
    }catch(e){ console.warn('LocalFile write', e); return false; }
  }
  function scheduleWrite(){
    clearTimeout(writeTimer);
    writeTimer = setTimeout(()=>{ write(); }, 800);
  }
  async function loadFromFile(){
    if(!cachedHandle) return false;
    if(!(await ensurePermission(cachedHandle))) return false;
    const f = await cachedHandle.getFile();
    const text = await f.text();
    return DB.importJson(text);
  }
  // Inicializa el handle al cargar
  loadHandle();
  return { isSupported, hasHandle, pickLocation, clearHandle, write, scheduleWrite, loadFromFile, loadHandle };
})();
window.LocalFile = LocalFile;

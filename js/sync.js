// GitHub Sync via Contents API + File System Access API para guardar local.
const GitSync = (() => {
  let pushTimer = null;
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
  function b64encode(str){
    // unicode-safe base64
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64decode(b64){
    return decodeURIComponent(escape(atob(b64.replace(/\n/g,''))));
  }
  async function getRemoteSha(){
    const g = DB.settings.github;
    const r = await api(`/repos/${g.user}/${g.repo}/contents/${encodeURIComponent(g.path)}?ref=${encodeURIComponent(g.branch||'main')}`);
    if(r.status===404) return { sha:null, content:null };
    if(!r.ok) throw new Error('GitHub '+r.status);
    const j = await r.json();
    return { sha:j.sha, content: b64decode(j.content) };
  }
  async function push(){
    if(!cfgOk()) throw new Error('Configuración incompleta');
    const g = DB.settings.github;
    let sha = g.lastSha;
    try{
      const remote = await getRemoteSha();
      sha = remote.sha;
    }catch(e){ /* primer push */ }
    const body = {
      message: `taller: backup ${new Date().toISOString()}`,
      content: b64encode(JSON.stringify(DB.all, null, 2)),
      branch: g.branch || 'main'
    };
    if(sha) body.sha = sha;
    const r = await api(`/repos/${g.user}/${g.repo}/contents/${encodeURIComponent(g.path)}`, {
      method:'PUT', body: JSON.stringify(body)
    });
    if(!r.ok){
      const t = await r.text();
      throw new Error('Push falló: '+r.status+' '+t.slice(0,200));
    }
    const j = await r.json();
    DB.updateGithub({ lastSha: j.content.sha, lastSyncAt: Date.now() });
    return true;
  }
  async function pull(){
    if(!cfgOk()) throw new Error('Configuración incompleta');
    const remote = await getRemoteSha();
    if(!remote.content) throw new Error('No hay archivo remoto aún');
    const ok = DB.importJson(remote.content);
    if(!ok) throw new Error('JSON remoto inválido');
    DB.updateGithub({ lastSha: remote.sha, lastSyncAt: Date.now() });
    return true;
  }
  async function test(){
    if(!cfgOk()) throw new Error('Completa todos los campos');
    const r = await api(`/repos/${DB.settings.github.user}/${DB.settings.github.repo}`);
    if(!r.ok) throw new Error('No se pudo acceder al repo ('+r.status+')');
    return true;
  }
  function schedulePush(){
    clearTimeout(pushTimer);
    pushTimer = setTimeout(()=>{
      push().then(()=>UI.toast('Sincronizado con GitHub'))
            .catch(e=>UI.toast('Sync error: '+e.message));
    }, 1500);
  }
  return { push, pull, test, schedulePush, cfgOk };
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

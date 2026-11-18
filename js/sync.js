// =============================================================
// Sincronización GitHub — v19 (motor anti-pérdida de datos)
//
// CORRECCIONES CLAVE RESPECTO A v18 (bug: al restaurar la
// conexión se perdían los datos guardados offline):
//
// 1) PRIORIDAD PUSH > PULL. Al reconectar, primero se suben los
//    cambios locales pendientes y solo después se baja lo remoto.
//    El índice remoto viejo ya no puede pisar los datos nuevos.
// 2) getRemoteText() usa Accept raw para archivos > 1 MB. La API
//    de contents (JSON) devuelve content:"" y encoding:"none" para
//    archivos entre 1MB y 100MB — eso hacía "desaparecer"
//    reparaciones con fotos grandes al descargarlas.
// 3) Huerfanos auto-adoptados: si un archivo repairs/<id>.json
//    existe en el repo pero index.json no lo lista (índice viejo),
//    la reparación SE ADOPTA igualmente. Nunca se descarta.
// 4) pullAll ya no degrada settings locales: token, autoSync y
//    catálogos se preservan/mergean; las transacciones nuevas se
//    marcan dirty (knownDirtyTx) para que se suban, no solo el
//    índice.
// 5) pushAll tolerante: cada archivo se intenta con reintentos y
//    refresco de SHA ante 409/422 (conflicto); un fallo no aborta
//    el resto. Los contadores suben como max(local, remoto).
// 6) Al guardar offline se marca dirty de inmediato y el push se
//    reintenta automáticamente al detectar conexión (online/focus/
//    visibility), además del arranque.
// =============================================================

// =============================================================
// CryptoCfg v54 — cifrado de la configuración compartida.
// AES-GCM-256 con clave derivada PBKDF2-SHA256 (210.000
// iteraciones, salt aleatorio por archivo; recomendación OWASP
// para PBKDF2-SHA256). Formato: "EDR-ENC1:<ivB64>:<saltB64>:<ctB64>"
// La GCM aporta integridad autenticada: una letra mal escrita en
// la frase produce error de descifrado, no basura legible.
// =============================================================
const CryptoCfg = (() => {
  const ITER = 210000;
  const PREFIX = 'EDR-ENC1';
  const te = new TextEncoder();

  async function deriveKey(phrase, saltRaw){
    const base = await crypto.subtle.importKey(
      'raw', te.encode(phrase), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name:'PBKDF2', hash:'SHA-256', salt: saltRaw, iterations: ITER },
      base, { name:'AES-GCM', length: 256 }, false, ['encrypt','decrypt']
    );
  }

  async function encrypt(plainText, phrase){
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(phrase, salt);
    const ct   = await crypto.subtle.encrypt(
      { name:'AES-GCM', iv }, key, te.encode(plainText)
    );
    const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `${PREFIX}:${b64(iv)}:${b64(salt)}:${b64(ct)}`;
  }

  async function decrypt(payload, phrase){
    const parts = String(payload||'').split(':');
    if(parts.length !== 4 || parts[0] !== PREFIX){
      throw new Error('Formato de configuración cifrada no reconocido');
    }
    const un64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
    const key = await deriveKey(phrase, un64(parts[2]));
    const pt  = await crypto.subtle.decrypt(
      { name:'AES-GCM', iv: un64(parts[1]) }, key, un64(parts[3])
    );
    return new TextDecoder().decode(pt);
  }

  function isEncrypted(txt){
    return typeof txt === 'string' && txt.startsWith(PREFIX + ':');
  }

  return { encrypt, decrypt, isEncrypted, PREFIX };
})();
window.CryptoCfg = CryptoCfg;

const GitLog = (() => {
  const MAX = 300;
  const entries = [];
  const subs = new Set();
  function emit(){ subs.forEach(fn => { try{ fn(entries); }catch(e){} }); }
  function add(level, tag, msg){
    const e = { t: Date.now(), level, tag, msg: String(msg||'') };
    entries.push(e);
    if(entries.length > MAX) entries.splice(0, entries.length - MAX);
    // eslint-disable-next-line no-console
    try{ console[level==='err'?'error':level==='warn'?'warn':'log'](`[gh:${tag}]`, e.msg); }catch(_){}
    emit();
    return e;
  }
  return {
    info: (tag,msg)=>add('info',tag,msg),
    ok:   (tag,msg)=>add('ok',tag,msg),
    warn: (tag,msg)=>add('warn',tag,msg),
    err:  (tag,msg)=>add('err',tag,msg),
    net:  (tag,msg)=>add('net',tag,msg),
    all:  ()=> entries.slice(),
    clear(){ entries.length = 0; emit(); },
    subscribe(fn){ subs.add(fn); fn(entries); return ()=>subs.delete(fn); }
  };
})();
window.GitLog = GitLog;

const GitSync = (() => {
  let pushTimer = null;
  let busy = false;
  let lastHashes = {}; // id -> hash de su JSON (para detectar cambios)
  let knownDirty = new Set(); // reparaciones guardadas localmente pendientes de confirmar en servidor
  let knownDeleted = new Set();
  let knownDirtyTx = new Set(); // transacciones nuevas/editadas sin confirmar en servidor
  // Tombstones de transacciones (las transacciones viven dentro de index.json,
  // así que necesitamos recordar localmente cuáles borramos para que no
  // reaparezcan si otro dispositivo sube un index.json antiguo antes que
  // nosotros podamos subir el nuestro.)
  let knownDeletedTx = new Set();

  // ---------- Configuración ----------
  function g(){ return DB.settings.github; }
  function cfgOk(){
    const c = g();
    return !!(c.enabled && c.token && c.user && c.repo);
  }
  function basePath(){
    // Acepta tanto rutas tipo "carpeta" como rutas con .json (legado).
    const raw = (g().path || 'taller-data').trim().replace(/^\/+|\/+$/g,'');
    if(/\.json$/i.test(raw)){
      // Legado: usamos la carpeta padre + nombre sin extensión como base
      const noExt = raw.replace(/\.json$/i,'');
      return noExt || 'taller-data';
    }
    return raw || 'taller-data';
  }
  function indexFile(){ return basePath() + '/index.json'; }
  function repairFile(id){ return basePath() + '/repairs/' + id + '.json'; }
  function repairsDir(){ return basePath() + '/repairs'; }

  // ---------- Util base64 unicode-safe ----------
  function b64encode(str){
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for(const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  function b64decode(b64){
    const bin = atob((b64||'').replace(/\n/g,''));
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  async function sha256(str){
    const buf = new TextEncoder().encode(str);
    const h = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  // ---------- HTTP base ----------
  // Backoff ante rate-limit (403/429 con "rate limit" en el cuerpo):
  // la API REST de GitHub permite 5000 req/h con token. El polling
  // normal no se acerca, pero un error de red que fuerce reintentos
  // en cascada sí podría. Al detectarlo pausamos el auto-sync hasta
  // pasado el reset.
  let rateLimitedUntil = 0;
  async function api(path, init={}){
    const c = g();
    const url = `https://api.github.com${path}`;
    const method = (init.method || 'GET').toUpperCase();
    if(rateLimitedUntil > Date.now()){
      const wait = Math.ceil((rateLimitedUntil - Date.now())/1000);
      throw new Error(`Límite de peticiones de GitHub alcanzado. Reintenta en ${wait}s.`);
    }
    GitLog.net(method, path);
    let resp;
    try{
      resp = await fetch(url, {
        ...init,
        headers: {
          'Accept':'application/vnd.github+json',
          'Authorization': `token ${c.token}`,
          'Content-Type':'application/json',
          'X-GitHub-Api-Version':'2022-11-28',
          ...(init.headers||{})
        }
      });
    }catch(netErr){
      GitLog.err('red', 'Sin conexión: '+netErr.message);
      throw netErr;
    }
    if(!resp.ok && resp.status !== 404){
      let txt = ''; try{ txt = (await resp.text()).slice(0,200); }catch(_){}
      GitLog.err(String(resp.status), `${method} ${path} → ${resp.status} ${txt}`);
      if(resp.status === 403 || resp.status === 429){
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '0', 10);
        // x-ratelimit-reset viene en epoch-seconds
        const reset = parseInt(resp.headers.get('x-ratelimit-reset') || '0', 10);
        let until = Date.now() + Math.max(60, retryAfter || 0) * 1000;
        if(reset > 0) until = Math.max(until, reset * 1000 + 2000);
        if(/rate limit|abuse|secondary rate/i.test(txt) || retryAfter || reset){
          rateLimitedUntil = until;
          GitLog.warn('rate-limit', `Cuota de la API de GitHub agotada. Auto-sync en pausa hasta ${new Date(until).toLocaleTimeString('es-ES')}.`);
        }
      }
    }
    return resp;
  }

  // ---------- Operaciones primitivas ----------
  async function getFile(path){
    // Devuelve { sha, content, size }. Usa el endpoint JSON normal
    // (<=1MB). Para archivos mayores la API devuelve content:""
    // con encoding:"none" — en ese caso reintentamos con media
    // type raw, que SÍ devuelve los bytes hasta 100MB.
    const c = g();
    const r = await api(`/repos/${c.user}/${c.repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(c.branch||'main')}`);
    if(r.status === 404) return { sha:null, content:null, size:0 };
    if(!r.ok) throw new Error('GET '+path+' '+r.status);
    const j = await r.json();
    let content = b64decode(j.content||'');
    const size = (j.size!=null) ? Number(j.size) : (content ? content.length : 0);
    if((j.encoding==='none' || j.size > 1000000) && !content){
      const raw = await getRaw(path, j.sha);
      if(raw!=null) content = raw;
    }
    return { sha:j.sha, content, size };
  }
  async function getRaw(path, sha){
    // Descarga el blob en crudo (raw media type). Funciona para
    // archivos de 1MB a 100MB donde el JSON devuelve content vacío.
    const c = g();
    const q = sha ? '' : `?ref=${encodeURIComponent(c.branch||'main')}`;
    const r = await api(`/repos/${c.user}/${c.repo}/contents/${encodeURI(path)}${q}`, {
      headers: { 'Accept':'application/vnd.github.raw' }
    });
    if(!r.ok) return null;
    return await r.text();
  }
  async function putFile(path, content, sha, msg, attempt=0){
    const c = g();
    const body = {
      message: msg || `taller: ${path}`,
      content: b64encode(content),
      branch: c.branch || 'main'
    };
    if(sha) body.sha = sha;
    const r = await api(`/repos/${c.user}/${c.repo}/contents/${encodeURI(path)}`, {
      method:'PUT', body: JSON.stringify(body)
    });
    if(!r.ok){
      const t = await r.text();
      // 409/422 = conflicto de SHA (otro dispositivo subió antes):
      // refrescamos el SHA del archivo y reintentamos una vez.
      if((r.status===409 || r.status===422) && attempt < 2){
        GitLog.warn('conflicto', `${path} → ${r.status}, refrescando SHA y reintentando…`);
        const remote = await getFile(path);
        return putFile(path, content, remote.sha, msg, attempt+1);
      }
      throw new Error('PUT '+path+' '+r.status+' '+t.slice(0,160));
    }
    const j = await r.json();
    return j.content.sha;
  }
  async function deleteFile(path, sha){
    const c = g();
    const body = {
      message: `taller: borrar ${path}`,
      sha, branch: c.branch || 'main'
    };
    const r = await api(`/repos/${c.user}/${c.repo}/contents/${encodeURI(path)}`, {
      method:'DELETE', body: JSON.stringify(body)
    });
    if(!r.ok && r.status !== 404){
      const t = await r.text();
      throw new Error('DELETE '+path+' '+r.status+' '+t.slice(0,160));
    }
  }
  async function listDir(path){
    const c = g();
    const r = await api(`/repos/${c.user}/${c.repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(c.branch||'main')}`);
    if(r.status === 404) return [];
    if(!r.ok) throw new Error('LIST '+path+' '+r.status);
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  }
  async function getRepo(){
    const c = g();
    const r = await api(`/repos/${c.user}/${c.repo}`);
    if(!r.ok) throw new Error(
      r.status === 404 ? `El repositorio «${c.user}/${c.repo}» no existe (o el token no tiene acceso a él). Revisa usuario y repositorio`
      : r.status === 401 ? 'Token inválido o caducado (401)'
      : 'No se pudo leer el repositorio ('+r.status+')'
    );
    return r.json();
  }
  async function getUser(){
    const r = await api(`/user`);
    if(!r.ok) throw new Error(
      r.status === 401 ? 'Token inválido o caducado (401): genera uno nuevo en GitHub → Settings → Developer settings → Fine-grained tokens, con permiso Contents: read/write en tu repositorio'
      : r.status === 403 ? 'Acceso denegado (403): el token no tiene permiso sobre este repositorio'
      : 'No se pudo autenticar ('+r.status+')'
    );
    return r.json();
  }

  // ---------- Hashes y deltas ----------
  function loadHashCache(){
    try{ lastHashes = JSON.parse(localStorage.getItem('taller_gh_hashes')||'{}'); }
    catch(_){ lastHashes = {}; }
    try{ knownDirty = new Set(JSON.parse(localStorage.getItem('taller_gh_dirty_repairs')||'[]')); }
    catch(_){ knownDirty = new Set(); }
    try{ knownDirtyTx = new Set(JSON.parse(localStorage.getItem('taller_gh_dirty_tx')||'[]')); }
    catch(_){ knownDirtyTx = new Set(); }
  }
  function saveHashCache(){
    try{ localStorage.setItem('taller_gh_hashes', JSON.stringify(lastHashes)); }catch(_){}
    try{ localStorage.setItem('taller_gh_dirty_repairs', JSON.stringify([...knownDirty])); }catch(_){}
    try{ localStorage.setItem('taller_gh_dirty_tx', JSON.stringify([...knownDirtyTx])); }catch(_){}
  }
  function loadDeleted(){
    try{ knownDeleted = new Set(JSON.parse(localStorage.getItem('taller_gh_deleted')||'[]')); }
    catch(_){ knownDeleted = new Set(); }
    try{ knownDeletedTx = new Set(JSON.parse(localStorage.getItem('taller_gh_deleted_tx')||'[]')); }
    catch(_){ knownDeletedTx = new Set(); }
  }
  function saveDeleted(){
    try{ localStorage.setItem('taller_gh_deleted', JSON.stringify([...knownDeleted])); }catch(_){}
    try{ localStorage.setItem('taller_gh_deleted_tx', JSON.stringify([...knownDeletedTx])); }catch(_){}
  }
  function markDeleted(id){
    knownDeleted.add(id);
    saveDeleted();
    GitLog.info('marca', `Reparación ${id} pendiente de eliminar en GitHub`);
    schedulePush();
  }
  function markDeletedTx(id){
    knownDeletedTx.add(id);
    saveDeleted();
    GitLog.info('marca', `Transacción ${id} pendiente de eliminar en GitHub`);
    schedulePush();
  }
  function markDirty(id){
    if(!id) return;
    knownDirty.add(id);
    saveHashCache();
    GitLog.info('local', `Reparación ${id} guardada localmente y pendiente de subir`);
    schedulePush();
  }
  function markDirtyTx(id){
    if(!id) return;
    knownDirtyTx.add(id);
    saveHashCache();
    GitLog.info('local', `Transacción ${id} guardada localmente y pendiente de subir`);
    schedulePush();
  }

  loadHashCache();
  loadDeleted();

  // ---------- Payloads ----------
  // NOTA: los payloads NO incluyen timestamps de generación (savedAt).
  // Un payload con Date.now() cambia en cada push aunque el contenido sea
  // idéntico → el hash nunca coincide → se re-suben TODAS las reparaciones
  // en cada push. La deduplicación por hash exige un payload determinista:
  // mismo contenido = mismo string = mismo hash.
  function buildRepairPayload(r){
    return JSON.stringify({ kind:'repair', schema:1, repair: r }, null, 2);
  }
  function buildIndexPayload(){
    const d = DB.all;
    const ids = (d.repairs||[]).map(r=>r.id);
    return JSON.stringify({
      kind:'index', schema:1,
      schemaVersion: d.schemaVersion,
      counter: d.counter, txCounter: d.txCounter,
      settings: {
        ...d.settings,
        // v53 — la contraseña y las preguntas de seguridad son del
        // DISPOSITIVO, no del repo: nunca viajan (ni el hash). Así cada
        // instalación mantiene su propia clave y un repo comprometido no
        // expone material de autenticación.
        passwordHash: null,
        securityQuestions: [],
        // Nunca viajan por el repo:
        //  - token: credencial del dispositivo (secreto)
        //  - lastSyncAt/lastSha: estado operativo local que cambia en cada
        //    push; si viajaran, el hash del índice cambiaría siempre y se
        //    re-subiría en cada sincronización.
        //  - github (bloque local del PC) es config DEL dispositivo; en su
        //    lugar viaja githubShared (sin token) para que otros móviles se
        //    conecten sin teclear nada.
        github: { ...d.settings.github, token:'', lastSyncAt:null, lastSha:null },
        // v54: githubShared viaja, pero SIN la frase secreta ni el flag de
        // token (esos dos solo existen dentro del config.json CIFRADO).
        githubShared: (()=>{ const sh = d.settings.githubShared; if(!sh) return null;
          const { phrase, shareToken, ...safe } = sh; return safe; })()
      },
      transactions: d.transactions || [],
      repairIds: ids
    }, null, 2);
  }
  // Archivo de configuración publicado para el bootstrap de otros
  // dispositivos: se sirve por GitHub Pages (público, sin token) en
  // <user>.github.io/<repo>/<path>/config.json.
  //
  // v54 — CONFIG CIFRADA servidor→cliente: el JSON ya NO viaja en claro
  // por Pages (cualquiera con la URL podía leer usuario/repositorio/carpeta
  // y el WhatsApp). Ahora viaja AES-GCM-256; la clave se deriva con
  // PBKDF2-SHA256 (210.000 iteraciones, recomendación OWASP 2023+) de una
  // FRASE SECRETA DEL TALLER que el dueño define al activar "compartir".
  // Los móviles que la conozcan descifran y AUTORRELLENAN los cuadros de
  // Administración (usuario/repo/rama/carpeta e incluso el token si el
  // dueño decidió compartirlo) — ya nadie rellena nada a mano.
  // Retrocompatible: si el archivo aún es JSON plano (kind taller-config),
  // se lee como antes y el próximo push lo re-publica cifrado.
  function buildConfigPayload(){
    const d = DB.all;
    const sh = d.settings.githubShared || {};
    const gh = d.settings.github || {};
    const plain = {
      kind:'taller-config', schema:2,
      user: sh.user || '', repo: sh.repo || '',
      branch: sh.branch || 'main', path: sh.path || '',
      whatsapp: sh.whatsapp || '',
      // v54: con consentimiento explícito, el token del PC viaja DENTRO del
      // cifrado (nunca en claro) para que los móviles del taller puedan
      // editar sin crear el suyo. Es un repo privado del taller: quien tenga
      // la frase secreta es de confianza.
      token: (sh.shareToken && gh.token) ? gh.token : '',
      createdAt: d.settings.githubSharedAt || null
    };
    const phrase = sh.phrase || '';
    if(!phrase){
      // Sin frase configurada: publicar el formato clásico (plain) para
      // no romper móviles antiguos; la UI pide activar la frase.
      return JSON.stringify(plain, null, 2);
    }
    return 'EDR-ENC1:' + CryptoCfg.encrypt(JSON.stringify(plain), phrase);
  }

  // ---------- Detección de cambios (deltas) ----------
  async function getPendingPush(){
    // No requiere red: solo compara hashes locales con el caché de la última subida.
    const repairs = DB.repairs.slice();
    const modified = [];
    for(const r of repairs){
      const txt = buildRepairPayload(r);
      const h = await sha256(txt);
      if(knownDirty.has(r.id) || !lastHashes['sha:'+r.id] || lastHashes['r:'+r.id] !== h) modified.push(r.id);
    }
    const idxTxt = buildIndexPayload();
    const idxH = await sha256(idxTxt);
    const indexChanged = lastHashes['idx'] !== idxH;
    return {
      modified,
      deleted: [...knownDeleted],
      deletedTx: [...knownDeletedTx],
      indexChanged,
      total: modified.length + knownDeleted.size + knownDeletedTx.size + (indexChanged?1:0)
    };
  }

  async function getPendingPull(){
    // Consulta GitHub solo para listar y comparar SHAs (no descarga contenidos).
    if(!cfgOk()) throw new Error('Configuración incompleta');
    const out = { changed: [], created: [], removed: [], indexChanged: false, total: 0 };
    // index
    const idxRemote = await getFile(indexFile());
    if(idxRemote.sha && idxRemote.sha !== lastHashes['idxRemoteSha']) out.indexChanged = true;
    if(!idxRemote.sha) out.indexChanged = false;
    // repairs/
    const files = await listDir(repairsDir());
    const jsonFiles = files.filter(f => f.type==='file' && /\.json$/i.test(f.name));
    const localIds = new Set(DB.repairs.map(r=>r.id));
    const remoteIds = new Set();
    for(const f of jsonFiles){
      const id = f.name.replace(/\.json$/i,'');
      remoteIds.add(id);
      const cachedSha = lastHashes['sha:'+id];
      if(!localIds.has(id)) out.created.push(id);
      else if(cachedSha !== f.sha) out.changed.push(id);
    }
    for(const id of localIds){
      if(!remoteIds.has(id)) out.removed.push(id);
    }
    out.total = out.changed.length + out.created.length + out.removed.length + (out.indexChanged?1:0);
    // Nota: "removed" son reparaciones locales que no existen en GitHub todavía
    // (pendientes de subir). NO deben disparar un pull; solo se incluyen en
    // el total para diagnóstico. El autoPullTick solo actúa si hay cambios remotos.
    const remotePendingTotal = out.changed.length + out.created.length + (out.indexChanged?1:0);
    out.remotePendingTotal = remotePendingTotal;
    return out;
  }

  // ---------- Operaciones de alto nivel ----------
  async function testConnection(){
    // v57 — diagnóstico claro: decir QUÉ falta en vez de un error genérico.
    const c = g();
    if(!c.user)   throw new Error('Falta el usuario / organización (campo Usuario / org)');
    if(!c.repo)   throw new Error('Falta el repositorio (campo Repositorio)');
    if(!c.token)  throw new Error('Falta el token (campo Token · github_pat_…)');
    if(!c.enabled) throw new Error('La sincronización está apagada: enciéndela con el interruptor de arriba');
    GitLog.info('test', 'Probando conexión…');
    const u = await getUser();
    GitLog.ok('user', `Autenticado como ${u.login}`);
    const r = await getRepo();
    GitLog.ok('repo', `Repo accesible: ${r.full_name} · rama por defecto: ${r.default_branch}`);
    // v57 — verificar también la RAMA configurada (antes solo se comprobaba
    // la default: un typo en la rama daba errores confusos al sincronizar).
    const branch = c.branch || 'main';
    if(branch && branch !== r.default_branch){
      const br = await api(`/repos/${c.user}/${c.repo}/branches/${encodeURIComponent(branch)}`);
      if(br.status === 404) throw new Error(`La rama «${branch}» no existe en el repo (la default es «${r.default_branch}»)`);
      if(!br.ok) throw new Error('Rama '+br.status);
      GitLog.ok('branch', `Rama «${branch}» accesible`);
    }
    GitLog.info('ruta', `Base de datos: ${basePath()}/  (index.json + repairs/Rxxxx.json)`);
    return true;
  }

  // ---------- RESET: olvidar cachés de sincronización ----------
  // Lo llama DB.resetAll(). Deja el módulo como recién cargado:
  // sin hashes, sin dirty, sin tombstones (en memoria Y en localStorage).
  function resetCaches(){
    lastHashes = {}; knownDirty = new Set(); knownDeleted = new Set();
    knownDirtyTx = new Set(); knownDeletedTx = new Set();
    rateLimitedUntil = 0;
    pushRetries = 0;
    if(pushRetryTimer){ clearTimeout(pushRetryTimer); pushRetryTimer = null; }
    try{
      localStorage.removeItem('taller_gh_hashes');
      localStorage.removeItem('taller_gh_dirty_repairs');
      localStorage.removeItem('taller_gh_dirty_tx');
      localStorage.removeItem('taller_gh_deleted');
      localStorage.removeItem('taller_gh_deleted_tx');
      // v51: el arranque tras el reset NO re-baja la nube (autoPull
      // traería de vuelta todo lo que el usuario acaba de reiniciar).
      // Se consume una sola vez en Bootstrap.run().
      localStorage.setItem('taller_skip_bootstrap_once', '1');
    }catch(_){}
    GitLog.clear();
    GitLog.warn('reset', 'Cachés de sincronización reiniciadas en este dispositivo');
  }

  // ---------- RESET: borrar TODO el contenido de la nube ----------
  // Elimina index.json, config.json y todos los repairs/*.json de la
  // carpeta base. NO toca el código de la app (Pages) ni nada fuera de
  // basePath(). Requiere token con permiso Contents:read/write.
  async function wipeRemote(onProgress = ()=>{}){
    if(!cfgOk()) throw new Error('Configura la conexión (usuario, repo y token) para borrar la nube');
    GitLog.warn('wipe', 'Borrando TODA la base de datos del repositorio…');
    // 1) Listar todo bajo la carpeta base (recursivo por seguridad extra:
    //    solo borramos archivos, no carpetas de la app).
    const seen = new Set();
    const targets = [];
    const roots = [basePath()];
    let guard = 0;
    while(roots.length && guard++ < 10){
      const dir = roots.shift();
      const items = await listDir(dir);
      for(const it of items){
        const p = (dir.replace(/\/$/,'') + '/' + it.name);
        if(it.type === 'dir'){
          // GitHub devuelve "dir" solo con ?ref= ; listDir lo maneja
          if(!seen.has(p)){ seen.add(p); roots.push(p); }
        } else if(it.type === 'file'){
          if(!seen.has(p)){ seen.add(p); targets.push(p); }
        }
      }
    }
    // 2) index.json y config.json viven directamente en la base
    for(const extra of [indexFile(), basePath()+'/config.json']){
      if(!targets.includes(extra)) targets.push(extra);
    }
    GitLog.info('wipe', `${targets.length} archivo(s) para eliminar en ${basePath()}/`);
    let done = 0, failed = 0;
    for(const path of targets){
      const f = await getFile(path);
      if(!f.sha){ done++; onProgress(done, targets.length, path); continue; } // ya no existe
      try{
        await deleteFile(path, f.sha);
        done++;
      }catch(e){
        GitLog.warn('wipe', path+' → '+e.message);
        failed++;
      }
      onProgress(done, targets.length, path);
    }
    // 3) Olvidar estado local de sincronización (sin tocar DB)
    resetCaches();
    GitLog.ok('wipe', `Nube vaciada: ${done} eliminado(s)${failed?`, ${failed} fallo(s)`:''}`);
    return { deleted: done, failed };
  }

  async function pushAll(opts={}){
    if(!cfgOk()) throw new Error('Configuración incompleta');
    if(busy) { GitLog.warn('cola','Operación en curso, omitida'); return; }
    busy = true;
    const c2 = g();   // captura de configuración para el paso de compartir
    const onProgress = opts.onProgress || (()=>{});
    try{
      const repairs = DB.repairs.slice();
      let pending = [];
      for(const r of repairs){
        const txt = buildRepairPayload(r);
        const h = await sha256(txt);
        if(knownDirty.has(r.id) || !lastHashes['sha:'+r.id] || lastHashes['r:'+r.id] !== h) pending.push({ r, txt, h });
      }
      const deletes = [...knownDeleted];
      const total = pending.length + deletes.length + 1; // +1 index
      let done = 0;
      const tick = (msg)=>{ done++; onProgress(done,total,msg); };

      GitLog.info('plan', `${pending.length} reparación(es) modificadas · ${deletes.length} a eliminar`);

      // 1) Subir cada reparación cambiada (tolerante a fallos:
      //    un error en un archivo NO aborta los demás)
      let reallyPushed = 0, skippedSame = 0, failed = 0;
      for(const it of pending){
        const path = repairFile(it.r.id);
        try{
          const remote = await getFile(path);
          // Comprobación remota: si el contenido en GitHub ya es idéntico
          // a lo que íbamos a subir, NO lo volvemos a subir. Solo
          // actualizamos el caché local para no volver a comprobarlo.
          if(remote.content){
            const remoteH = await sha256(remote.content);
            if(remoteH === it.h){
              lastHashes['r:'+it.r.id] = it.h;
              lastHashes['sha:'+it.r.id] = remote.sha;
              knownDirty.delete(it.r.id);
              saveHashCache();
              GitLog.info('skip', `${it.r.id} ya está actualizado en GitHub`);
              skippedSame++;
              tick(it.r.id);
              continue;
            }
          }
          const newSha = await putFile(path, it.txt, remote.sha,
            remote.sha ? `taller: actualizar ${it.r.id}` : `taller: crear ${it.r.id}`);
          lastHashes['r:'+it.r.id] = it.h;
          lastHashes['sha:'+it.r.id] = newSha;
          knownDirty.delete(it.r.id);
          saveHashCache();
          GitLog.ok(remote.sha?'update':'create', `${it.r.id} → ${path}`);
          reallyPushed++;
        }catch(e){
          // Un fallo puntual NO aborta el push completo: queda dirty
          // y el siguiente intento lo reintenta.
          failed++;
          GitLog.err('push', `${it.r.id}: ${e.message} — se reintentará`);
        }
        tick(it.r.id);
      }
      if(skippedSame) GitLog.info('delta', `${skippedSame} reparación(es) ya estaban iguales en GitHub, omitidas`);

      // 2) Borrar los marcados como eliminados
      for(const id of deletes){
        try{
          const path = repairFile(id);
          const remote = await getFile(path);
          if(remote.sha){
            await deleteFile(path, remote.sha);
            GitLog.ok('delete', `${id} eliminado en GitHub`);
          }else{
            GitLog.info('skip', `${id} ya no existía en GitHub`);
          }
          delete lastHashes['r:'+id];
          delete lastHashes['sha:'+id];
          knownDirty.delete(id);
          saveHashCache();
          knownDeleted.delete(id);
          saveDeleted();
        }catch(e){
          GitLog.err('delete', `${id}: ${e.message}`);
        }
        tick(id);
      }

      // 3) Subir el índice
      const idxTxt = buildIndexPayload();
      const idxPath = indexFile();
      const idxRemote = await getFile(idxPath);
      let idxSha = idxRemote.sha;
      const idxH = await sha256(idxTxt);
      const remoteIdxH = idxRemote.content ? await sha256(idxRemote.content) : null;
      if(remoteIdxH === idxH){
        // Remoto ya idéntico: no subimos nada, solo refrescamos caché.
        lastHashes['idx'] = idxH;
        lastHashes['idxRemoteSha'] = idxRemote.sha;
        saveHashCache();
        GitLog.info('index', 'index.json ya está idéntico en GitHub, omitido');
      } else {
        // Siempre subimos si difiere (aunque el hash local coincida: el
        // remoto puede contener un índice VIEJO que no lista reparaciones
        // nuevas — subiendo siempre reparamos índices huérfanos).
        idxSha = await putFile(idxPath, idxTxt, idxRemote.sha, 'taller: actualizar index.json');
        lastHashes['idx'] = idxH;
        lastHashes['idxRemoteSha'] = idxSha;
        saveHashCache();
        GitLog.ok('index', 'index.json subido');
      }
      DB.updateGithub({ lastSha: idxSha, lastSyncAt: Date.now() });
      tick('index');

      // 4) Tombstones de transacciones: si el index remoto resultante ya no
      // contiene una transacción borrada, podemos olvidarla con seguridad.
      // (Las transacciones viven dentro de index.json, así que en el momento
      // en que subimos un índice sin esos IDs, la eliminación está propagada.)
      if(knownDeletedTx.size){
        try{
          const parsed = JSON.parse(idxTxt);
          const remainIds = new Set((parsed.transactions||[]).map(t=>t.id));
          let cleared = 0;
          for(const id of [...knownDeletedTx]){
            if(!remainIds.has(id)){ knownDeletedTx.delete(id); cleared++; }
          }
          if(cleared){ saveDeleted(); GitLog.info('tx-tomb', `${cleared} tombstone(s) de transacción liberada(s)`); }
        }catch(_){}
      }
      // Igual para transacciones dirty confirmadas: el índice ya las contiene.
      if(knownDirtyTx.size){
        try{
          const parsed = JSON.parse(idxTxt);
          const remainIds = new Set((parsed.transactions||[]).map(t=>t.id));
          let cleared = 0;
          for(const id of [...knownDirtyTx]){
            if(remainIds.has(id)){ knownDirtyTx.delete(id); cleared++; }
          }
          if(cleared){ saveHashCache(); GitLog.info('tx-dirty', `${cleared} transacción(es) confirmada(s) en el índice`); }
        }catch(_){}
      }

      // 5) Publicar config.json para el bootstrap de otros dispositivos.
      // v48: si este dispositivo tiene conexión completa y aún NO comparte,
      // se activa el compartir automáticamente tras un push exitoso — así
      // cualquier dispositivo nuevo se conecta sin teclear nada (el token
      // NUNCA viaja aquí). Se puede desactivar en Administración.
      let shared = DB.settings.githubShared;
      if(!shared && c2 && c2.user && c2.repo){
        try{
          DB.setGithubShared({
            user: c2.user, repo: c2.repo, branch: c2.branch || 'main',
            path: basePath(), whatsapp: ''
          });
          shared = DB.settings.githubShared;
          GitLog.ok('config', 'Configuración compartida automáticamente: otros dispositivos podrán conectarse sin teclear nada');
        }catch(e){ GitLog.warn('config', 'No se pudo activar compartir: '+e.message); }
      }
      if(shared && shared.user && shared.repo){
        try{
          const cfgTxt = buildConfigPayload();
          const cfgPath = basePath() + '/config.json';
          const cfgRemote = await getFile(cfgPath);
          const cfgH = await sha256(cfgTxt);
          const remoteCfgH = cfgRemote.content ? await sha256(cfgRemote.content) : null;
          if(remoteCfgH !== cfgH){
            await putFile(cfgPath, cfgTxt, cfgRemote.sha, 'taller: publicar config.json para nuevos dispositivos');
            GitLog.ok('config', 'config.json publicado para nuevos dispositivos');
          }
        }catch(e){
          GitLog.warn('config', 'No se pudo publicar config.json: '+e.message);
        }
      }

      GitLog.ok('done', `Sincronización completa: ${reallyPushed} subida(s), ${deletes.length} eliminada(s)${failed?`, ${failed} fallida(s) (se reintentarán)`:''}`);
      return { pushed: reallyPushed+skippedSame, deleted: deletes.length, failed };
    } finally {
      busy = false;
    }
  }

  // ---------- Pull READ-ONLY sin token (bootstrap móvil) ----------
  // Descarga index.json + repairs/*.json desde raw.githubusercontent.com
  // (repo público, sin autenticación). No usa la API REST → no gasta cuota
  // ni requiere token. El autoPull normal seguirá usando la API cuando
  // haya token; sin token, este modo es la única fuente de descarga.
  //
  // ANTI-PÉRDIDA (v48): este pull aplica las MISMAS protecciones que
  // pullAll — antes sustituía las transacciones locales por las del
  // índice remoto (perdiendo ventas/compras sin subir de este
  // dispositivo), ignoraba los tombstones (lo borrado reaparecía) y
  // pisaba contraseña/settings locales con los del repo.
  async function pullReadOnly(){
    const c = g();
    if(!c.user || !c.repo) throw new Error('Falta usuario/repositorio');
    const branch = c.branch || 'main';
    const base = (c.path||'taller-data').replace(/^\/+|\/+$/g,'').replace(/\.json$/i,'');
    const raw = p => `https://raw.githubusercontent.com/${c.user}/${c.repo}/${branch}/${base}/${p}`;
    GitLog.info('pull-ro', `Descarga sin token desde raw.githubusercontent.com (${base})…`);
    // 1) index.json
    let idxData = null;
    try{
      const r = await fetch(raw('index.json'), { cache:'no-store' });
      if(r.ok){
        idxData = await r.json();
        GitLog.ok('pull-ro', 'index.json descargado');
      } else {
        GitLog.info('pull-ro', 'index.json → ' + r.status + ' (¿primera vez?)');
        return { pulled: 0 };
      }
    }catch(e){ throw new Error('Sin conexión con raw.githubusercontent: ' + (e.message||e)); }
    if(!idxData || !Array.isArray(idxData.repairIds)) return { pulled: 0 };
    // 2) repairs/ — en modo lectura inicial solo bajamos las que no
    //    tenemos localmente (o todas si no hay ninguna). El polling
    //    posterior reutiliza el mismo mecanismo pero por SHAs de la API
    //    cuando hay token; sin token, comparamos por id.
    //    TOMBSTONES: lo borrado en este dispositivo NUNCA se vuelve a
    //    descargar aunque el índice remoto (viejo) aún lo liste.
    const localIds = new Set(DB.repairs.map(r=>r.id));
    const toFetch = idxData.repairIds.filter(id => !localIds.has(id) && !knownDeleted.has(id));
    let fetched = 0;
    const remoteRepairs = [];
    for(const id of toFetch){
      try{
        const r = await fetch(raw('repairs/' + encodeURIComponent(id) + '.json'), { cache:'no-store' });
        if(!r.ok){ GitLog.warn('pull-ro', id + ' → ' + r.status); continue; }
        const parsed = await r.json();
        if(parsed && parsed.repair) remoteRepairs.push(parsed.repair);
        else fetched++; // descargada pero inválida: no se adopta
      }catch(e){ GitLog.warn('pull-ro', id + ': ' + (e.message||e)); }
    }
    fetched += remoteRepairs.length;
    // 3) TRANSACCIONES: fusión no destructiva por id (igual que pullAll).
    //    Las locales SIEMPRE se conservan (el remoto no conoce las que
    //    aún no subimos) y las borradas aquí (tombstones) no reaparecen.
    //    v48 ANTI-COLISIÓN: id local == id remoto con contenido distinto →
    //    la local se renombra con sufijo, nunca se pisa (pérdida cero).
    let pulledTx = Array.isArray(idxData.transactions) ? idxData.transactions.slice() : [];
    const remoteTxMap = new Map(pulledTx.map(t=>[t.id, t]));
    for(const t of DB.transactions){
      if(knownDeletedTx.has(t.id)) continue;
      const clash = remoteTxMap.get(t.id);
      if(!clash){
        pulledTx.push(t);
        if(!knownDirtyTx.has(t.id)) knownDirtyTx.add(t.id); // asegurar su subida
      } else {
        const same = (clash.createdAt === t.createdAt)
          && (String(clash.product||'') === String(t.product||''))
          && (Number(clash.total||0) === Number(t.total||0));
        if(same) continue; // ya está en el repo idéntica
        const suffix = (()=>{
          try{ return localStorage.getItem('taller_device_id') || 'DV'; }
          catch(_){ return 'DV'; }
        })();
        let newId = t.id + '-' + suffix;
        const allIds = new Set(pulledTx.map(x=>x.id));
        let n = 2;
        while(allIds.has(newId)){ newId = t.id + '-' + suffix + n; n++; }
        t.id = newId;
        pulledTx.push(t);
        knownDirtyTx.add(newId);
        GitLog.warn('tx-clash', `Transacción local ${t.id} renombrada para no pisar la remota con mismo id`);
      }
    }
    pulledTx = pulledTx.filter(t => !knownDeletedTx.has(t.id));
    // 4) Aplicar: fusión no destructiva — las locales NUNCA se borran aquí
    //    (mismo criterio anti-pérdida que pullAll: lo local pendiente gana).
    //    Ediciones locales más nuevas que el remoto ganan (updatedAt).
    const localById = new Map(DB.repairs.map(r=>[r.id,r]));
    let keptLocal = 0;
    const mergedRepairs = remoteRepairs.map(rr=>{
      const loc = localById.get(rr.id);
      if(loc && (knownDirty.has(rr.id) || (loc.updatedAt||0) > (rr.updatedAt||0))){ keptLocal++; return loc; }
      return rr;
    });
    // Locales no presentes en el remoto (nuevas o borradas allá y no aquí):
    // se conservan SIEMPRE (pendiente de subir). Excepto tombstones.
    const remoteIdsNow = new Set(remoteRepairs.map(r=>r.id));
    let addedLocal = 0;
    for(const [id, loc] of localById){
      if(!remoteIdsNow.has(id) && !knownDeleted.has(id)){ mergedRepairs.push(loc); addedLocal++; }
    }
    // Settings: el remoto pisa catálogos/ajustes compartidos, pero la
    // contraseña, preguntas y la config de GitHub son de ESTE dispositivo.
    const localSettings = DB.settings;
    const localGithub = { ...(localSettings.github||{}) };
    const localShared = localSettings.githubShared || null;
    const localCatalogs = {
      deviceTypes: localSettings.deviceTypes || [],
      productTypes: localSettings.productTypes || []
    };
    if(remoteRepairs.length || idxData.repairIds.length || localIds.size === 0){
      DB.replaceAll({
        schemaVersion: Math.max(idxData.schemaVersion||1, DB.all.schemaVersion||1),
        settings: { ...(idxData.settings||{}), github: localGithub, githubShared: (idxData.settings && idxData.settings.githubShared) ? idxData.settings.githubShared : localShared },
        transactions: pulledTx,
        counter: Math.max(idxData.counter||1, DB.all.counter||1),
        txCounter: Math.max(idxData.txCounter||1, DB.all.txCounter||1),
        repairs: mergedRepairs
      });
      // Restaurar settings puramente locales que el repo no debe pisar
      // (una config remota "sin contraseña" no desactiva la de este móvil).
      DB.updateSettings({
        passwordHash: DB.settings.passwordHash || localSettings.passwordHash,
        requirePassword: DB.settings.requirePassword !== undefined ? DB.settings.requirePassword : localSettings.requirePassword,
        securityQuestions: (DB.settings.securityQuestions && DB.settings.securityQuestions.length)
          ? DB.settings.securityQuestions : localSettings.securityQuestions
      });
      // Catálogos: fusión local ∪ remoto (igual que pullAll)
      const s = DB.settings;
      DB.updateSettings({
        deviceTypes: [...new Set([...(s.deviceTypes||[]), ...localCatalogs.deviceTypes, ...((idxData.settings&&idxData.settings.deviceTypes)||[])])].sort((a,b)=>a.localeCompare(b,'es')),
        productTypes: [...new Set([...(s.productTypes||[]), ...localCatalogs.productTypes, ...((idxData.settings&&idxData.settings.productTypes)||[])])].sort((a,b)=>a.localeCompare(b,'es'))
      });
    }
    if(keptLocal>0 || addedLocal>0 || knownDirtyTx.size>0){
      GitLog.info('pull-ro', `Conservadas ${keptLocal+addedLocal} reparación(es) local(es) pendientes de subir`);
    }
    // 5) Caché de hashes: sin SHA remoto no podemos marcarlas como
    //    sincronizadas — quedarán "dirty" para el próximo push CON token,
    //    que es lo correcto (así el token nuevo las confirma en el repo).
    saveHashCache();
    GitLog.ok('pull-ro', `Modo lectura: ${fetched} reparación(es) descargada(s), ${pulledTx.length} transacción(es) en el índice`);
    return { pulled: fetched };
  }

  async function pullAll(opts={}){
    if(!cfgOk()) throw new Error('Configuración incompleta');
    if(busy) { GitLog.warn('cola','Operación en curso, omitida'); return; }
    busy = true;
    const onProgress = opts.onProgress || (()=>{});
    try{
      GitLog.info('pull', 'Descargando datos desde GitHub…');

      // 1) Intentar índice
      let idxData = null;
      const idxRemote = await getFile(indexFile());
      if(idxRemote.content){
        try{ idxData = JSON.parse(idxRemote.content); }
        catch(e){ GitLog.warn('index','index.json corrupto, se reconstruirá'); }
      } else {
        GitLog.info('index', 'No hay index.json todavía');
      }

      // 1b) Compatibilidad: si la ruta antigua era un archivo .json único
      if(!idxData){
        const legacyPath = (g().path||'').trim();
        if(legacyPath && /\.json$/i.test(legacyPath)){
          const legacy = await getFile(legacyPath);
          if(legacy.content){
            try{
              const parsed = JSON.parse(legacy.content);
              if(parsed && Array.isArray(parsed.repairs)){
                GitLog.warn('legado','Archivo único detectado, migrando a formato por reparación');
                // Importar todo y luego forzar pushAll
                DB.replaceAll(parsed);
                lastHashes = {}; saveHashCache();
                knownDeleted.clear(); saveDeleted();
                DB.updateGithub({ lastSyncAt: Date.now() });
                GitLog.ok('migrar','Datos legados cargados. Pulsa "Subir todo" para reorganizar.');
                return { pulled: parsed.repairs.length, migrated:true };
              }
            }catch(e){ GitLog.err('legado', e.message); }
          }
        }
      }

      // 2) Listar repairs/
      const files = await listDir(repairsDir());
      const jsonFiles = files.filter(f => f.type==='file' && /\.json$/i.test(f.name));
      GitLog.info('lista', `${jsonFiles.length} reparación(es) en el repositorio`);

      const total = jsonFiles.length + 1;
      let done = 0;
      const tick = (msg)=>{ done++; onProgress(done,total,msg); };

      const remoteRepairs = [];
      const localById = new Map(DB.repairs.map(r=>[r.id, r]));
      let skipped = 0, fetched = 0;
      for(const f of jsonFiles){
        const id = f.name.replace(/\.json$/i,'');
        const cachedSha = lastHashes['sha:'+id];
        if(cachedSha === f.sha && localById.has(id)){
          // Sin cambios remotos: reutilizamos la copia local.
          remoteRepairs.push({ raw: localById.get(id), sha: f.sha, body: null });
          skipped++;
          tick(f.name);
          continue;
        }
        const remote = await getFile(basePath()+'/repairs/'+f.name);
        if(!remote.content){ tick(f.name); continue; }
        try{
          const parsed = JSON.parse(remote.content);
          if(parsed && parsed.repair){
            remoteRepairs.push({ raw: parsed.repair, sha: f.sha, body: remote.content });
            fetched++;
            GitLog.ok('get', `${parsed.repair.id}  (${(remote.content.length/1024).toFixed(1)} KB)`);
          }
        }catch(e){ GitLog.err('parse', f.name+': '+e.message); }
        tick(f.name);
      }
      GitLog.info('delta', `Descargadas ${fetched} reparación(es) nueva(s)/cambiada(s), ${skipped} omitida(s) sin cambios`);

      // 3) Componer dataset final
      let pulledRepairs = remoteRepairs.map(x=>x.raw);
      let pulledTx = idxData ? (idxData.transactions || []) : [];

      // --- Preservar transacciones locales no subidas ---
      // Las transacciones viven en index.json. Si hay transacciones locales nuevas
      // que aún no se subieron, el index.json remoto no las tiene. Las fusionamos.
      // v48 ANTI-COLISIÓN: si una local tiene el MISMO id que una remota pero
      // contenido distinto (dos dispositivos generaron "T0001" antes del fix
      // de sufijo), la local se RENOMBRA con sufijo nuevo en vez de ser pisada
      // — nunca se pierde una venta/compra por choque de IDs.
      if(pulledTx.length > 0 || DB.transactions.length > 0){
        const remoteTxMap = new Map(pulledTx.map(t=>[t.id, t]));
        const keptLocal = [];
        for(const t of DB.transactions){
          if(knownDeletedTx.has(t.id)) continue;
          const clash = remoteTxMap.get(t.id);
          if(!clash){
            pulledTx.push(t);
            if(!knownDirtyTx.has(t.id)) knownDirtyTx.add(t.id); // asegurar su subida
          } else {
            // ¿La remota es EXACTAMENTE esta misma tx (ya subida)? → la remota manda.
            const same = (clash.createdAt === t.createdAt)
              && (String(clash.product||'') === String(t.product||''))
              && (Number(clash.total||0) === Number(t.total||0));
            if(same) continue;
            // Colisión real: renombrar la local con sufijo de dispositivo.
            const suffix = (()=>{
              try{ return localStorage.getItem('taller_device_id') || 'DV'; }
              catch(_){ return 'DV'; }
            })();
            let newId = t.id + '-' + suffix;
            const allIds = new Set([...pulledTx.map(x=>x.id), ...keptLocal.map(x=>x.id)]);
            let n = 2;
            while(allIds.has(newId)){ newId = t.id + '-' + suffix + n; n++; }
            t.id = newId;
            pulledTx.push(t);
            knownDirtyTx.add(newId); // subirá con su nuevo id
            GitLog.warn('tx-clash', `Transacción local ${t.id} renombrada para no pisar la remota con mismo id`);
          }
        }
      } else {
        pulledTx = DB.transactions.filter(t => !knownDeletedTx.has(t.id));
      }

      // --- Protección contra "datos eliminados que reaparecen" ---
      // Si tenemos tombstones locales (cosas borradas en este dispositivo
      // pero que el otro dispositivo aún no ha visto), las filtramos del
      // dataset que vamos a aplicar y dejamos que el siguiente push las
      // limpie en GitHub. NO borramos los tombstones aquí — eso solo se
      // hace cuando confirmamos que la eliminación se subió.
      let filteredOut = 0;
      if(knownDeleted.size){
        const before = pulledRepairs.length;
        pulledRepairs = pulledRepairs.filter(r => !knownDeleted.has(r.id));
        filteredOut += before - pulledRepairs.length;
      }
      if(knownDeletedTx.size){
        const before = pulledTx.length;
        pulledTx = pulledTx.filter(t => !knownDeletedTx.has(t.id));
        filteredOut += before - pulledTx.length;
      }
      if(filteredOut > 0){
        GitLog.warn('tombstone', `Ignorando ${filteredOut} elemento(s) borrado(s) localmente que aún existen en GitHub. Se subirá su borrado.`);
      }

      // --- Protección contra "ediciones locales pisadas por el pull" ---
      // Si una reparación local tiene cambios sin subir (updatedAt mayor que
      // el de la versión remota), conservamos la versión local.
      const localByIdNow = new Map(DB.repairs.map(r=>[r.id, r]));
      let keptLocal = 0;
      pulledRepairs = pulledRepairs.map(r => {
        const loc = localByIdNow.get(r.id);
        if(loc && (knownDirty.has(r.id) || (loc.updatedAt||0) > (r.updatedAt||0))){
          keptLocal++;
          return loc;
        }
        return r;
      });
      if(keptLocal > 0){
        GitLog.warn('local-edit', `Conservando ${keptLocal} reparación(es) con ediciones locales más nuevas que el remoto.`);
      }

      // --- Protección contra "reparaciones nuevas locales perdidas en el pull" ---
      // Las reparaciones que existen localmente pero NO en GitHub (aún no subidas)
      // deben mantenerse en el dataset final. Sin esto, un pull automático al
      // detectar conexión borraría la reparación recién registrada en este dispositivo.
      const remoteIds = new Set(remoteRepairs.map(x=>x.raw.id));
      let addedLocal = 0;
      // v55b — BORRADO REMOTO ADOPTADO: distingue dos casos que antes eran
      // iguales ("la local no aparece en el repo"):
      //   1) NUNCA subida (sin sha en caché) → conservar (anti-pérdida).
      //   2) YA subida antes (sha en caché) y el archivo YA NO está en el
      //      repo → OTRO dispositivo la borró y subió un index sin ella:
      //      adoptar el borrado y limpiar su caché. Sin esto, la reparación
      //      "resucitaba" en el siguiente push (re-subida + re-listada en
      //      el index del remoto, borrado invertido en el dispositivo PC).
      let remoteDeleted = 0;
      for(const [id, loc] of localByIdNow){
        if(!remoteIds.has(id) && !knownDeleted.has(id)){
          const wasPushed = !!lastHashes['sha:'+id];
          if(wasPushed){
            // El index remoto tampoco la lista (borrado confirmado por el
            // otro dispositivo): solo se adopta si estamos viendo un index
            // remoto válido; sin index, la conservamos (cauta).
            const idxKnowsIt = idxData ? (idxData.repairIds||[]).includes(id) : null;
            if(idxData && idxKnowsIt === false){
              remoteDeleted++;
              delete lastHashes['r:'+id];
              delete lastHashes['sha:'+id];
              continue; // NO se añade al dataset final: adopta el borrado
            }
          }
          pulledRepairs.push(loc);
          addedLocal++;
        }
      }
      if(remoteDeleted > 0){
        saveHashCache();
        GitLog.warn('remote-del', `${remoteDeleted} reparación(es) borrada(s) en otro dispositivo — borrado adoptado.`);
      }
      if(addedLocal > 0){
        GitLog.warn('local-new', `Conservando ${addedLocal} reparación(es) local(es) aún no subida(s) a GitHub.`);
      }

      // --- HUÉRFANOS: archivos en el repo que index.json no lista ---
      // (índice viejo subido por otro dispositivo). Como el archivo
      // individual es la fuente de verdad de cada reparación, lo
      // ADOPTAMOS: la reparación entra al dataset local aunque el
      // índice no la liste. El push posterior reparará el índice.
      const idxIds = new Set((idxData && idxData.repairIds) || []);
      let adopted = 0;
      for(const x of remoteRepairs){
        if(idxData && !idxIds.has(x.raw.id)) adopted++;
      }
      if(adopted > 0){
        GitLog.warn('huérfanos', `${adopted} reparación(es) encontrada(s) en el repo que el index.json no lista — adoptada(s) y el índice se reparará al subir.`);
      }

      // --- Contadores: máximo entre remoto y local (nunca hacia atrás) ---
      // v55b — INDEX CORRUPTO/AUSENTE: si idxData es null (JSON inválido o
      // aún sin index en el repo), la rama antigua hacía replaceAll SIN
      // settings → la configuración local (garantía, appName, logo, WhatsApp,
      // catálogos, creador) volvía a FÁBRICA y el push siguiente propagaba
      // los defaults a la nube (pérdida real de settings). Ahora, sin
      // índice válido, se conservan los settings LOCALES completos.
      const base = idxData ? {
        schemaVersion: Math.max(idxData.schemaVersion||0, DB.all.schemaVersion||0),
        settings: idxData.settings || {},
        transactions: pulledTx,
        // Usar el mayor entre remoto y local para no perder IDs de reparaciones
        // nuevas registradas localmente que aún no se han subido al índice.
        counter: Math.max(idxData.counter || 1, DB.all.counter || 1),
        txCounter: Math.max(idxData.txCounter || 1, DB.all.txCounter || 1),
        repairs: pulledRepairs
      } : {
        schemaVersion: DB.all.schemaVersion || 1,
        // Índice corrupto/ausente: settings locales intactos (con transacciones
        // fusionadas; github se restaura igual debajo por ser config de
        // dispositivo).
        settings: (DB.all.settings || {}),
        transactions: pulledTx,
        counter: DB.all.counter || 1,
        txCounter: DB.all.txCounter || 1,
        repairs: pulledRepairs
      };

      // --- Settings: la configuración de GitHub es del DISPOSITIVO, no
      // del repo (token nunca viaja; user/repo/branch/path/autoSync son
      // de este equipo). Se captura ANTES del replaceAll y se restaura
      // SIEMPRE después, venga o no bloque github en el remoto.
      const localSettings = DB.settings;
      const localGithub = { ...(localSettings.github || {}) };
      const localShared = localSettings.githubShared || null;
      const localCatalogs = {
        deviceTypes: localSettings.deviceTypes || [],
        productTypes: localSettings.productTypes || []
      };
      DB.replaceAll(base);
      // Merge no destructivo de catálogos (local ∪ remoto) y restauración
      // de settings puramente locales que el repo no debe pisar.
      DB.updateSettings({
        passwordHash: DB.settings.passwordHash || localSettings.passwordHash,
        requirePassword: DB.settings.requirePassword !== undefined ? DB.settings.requirePassword : localSettings.requirePassword,
        securityQuestions: (DB.settings.securityQuestions && DB.settings.securityQuestions.length)
          ? DB.settings.securityQuestions : localSettings.securityQuestions
      });
      const mergedDevices = new Set([...(DB.settings.deviceTypes||[]), ...localCatalogs.deviceTypes]);
      const mergedProducts = new Set([...(DB.settings.productTypes||[]), ...localCatalogs.productTypes]);
      DB.updateSettings({
        deviceTypes: [...mergedDevices].sort((a,b)=>a.localeCompare(b,'es')),
        productTypes: [...mergedProducts].sort((a,b)=>a.localeCompare(b,'es')),
        // githubShared: gana el que exista. Prioridad: remoto (fue subido
        // por el PC que comparte) → local (este dispositivo comparte).
        // Si ninguno comparte, null. Es lo que permite que un dispositivo
        // nuevo se conecte sin teclear nada.
        githubShared: (DB.settings.githubShared || localShared),
        githubSharedAt: DB.settings.githubSharedAt || localSettings.githubSharedAt || null
      });
      // Restaurar la configuración de GitHub COMPLETA de este dispositivo
      // (el remoto nunca la debe pisar: token y datos de conexión son locales).
      DB.updateGithub({ ...localGithub, lastSyncAt: Date.now(), lastSha: idxRemote.sha });

      // Recalcular hashes
      // IMPORTANTE: para reparaciones que conservamos en versión local (keptLocal o addedLocal),
      // usamos la reparación tal como quedó en DB (la local), NO la remota.
      // Si están en knownDirty o no tienen SHA remoto, NO guardamos r:<id> como sincronizado;
      // así el siguiente getPendingPush() las detecta como pendientes y las sube.
      lastHashes = {};
      // Índice remoto
      lastHashes['idxRemoteSha'] = idxRemote.sha || null;
      if(idxRemote.content){ try{ lastHashes['idx'] = await sha256(idxRemote.content); }catch(_){} }
      // Primero volcar los SHAs remotos conocidos (para las que sí bajamos igual)
      for(const it of remoteRepairs){
        lastHashes['sha:'+it.raw.id] = it.sha;
      }
      // Recalcular hash de contenido desde DB (que puede ser local para keptLocal/addedLocal)
      for(const r of DB.repairs){
        const txt = buildRepairPayload(r);
        if(!knownDirty.has(r.id) && lastHashes['sha:'+r.id]){
          lastHashes['r:'+r.id] = await sha256(txt);
        } else {
          delete lastHashes['r:'+r.id];
        }
        // sha: del remoto ya fue puesto arriba; si no existe o quedó dirty se fuerza push
      }
      saveHashCache();
      // IMPORTANTE: NO borramos los tombstones aquí. Solo se eliminan tras
      // confirmarse el borrado en GitHub dentro de pushAll(). De lo
      // contrario, una eliminación local podría perderse si el autoPull
      // se ejecuta antes que el autoPush.
      if(filteredOut > 0 || keptLocal > 0 || addedLocal > 0 || adopted > 0 || knownDirtyTx.size > 0){
        try{ schedulePush(); }catch(_){}
      }
      tick('index');

      GitLog.ok('done', `Descargadas ${remoteRepairs.length} reparación(es)${adopted?` (${adopted} huérfana(s) adoptada(s))`:''}`);
      return { pulled: remoteRepairs.length, adopted };
    } finally {
      busy = false;
    }
  }

  // ---------- Auto-sync ----------
  function toast(msg){
    try{ if(window.UI && UI.toast) UI.toast(msg); }catch(_){}
  }
  // v51 — reintentos persistentes: si un push automático falla (sin red,
  // error de GitHub, o estaba busy otra operación), NO se pierde: se
  // reprograma con backoff creciente (2,5s → 5s → 10s → 20s → 40s máx)
  // hasta que logra subir. Así, cualquier cambio hecho offline se ejecuta
  // en el servidor apenas se restablece la conexión, sin esperar a que
  // el usuario toque algo.
  let pushRetries = 0;
  let pushRetryTimer = null;
  function retryPushSoon(reason){
    if(pushRetryTimer) clearTimeout(pushRetryTimer);
    const delay = Math.min(2500 * Math.pow(2, pushRetries), 40000);
    pushRetries++;
    GitLog.info('retry', `Subida reintentará en ${(delay/1000).toFixed(1)}s (${reason})`);
    pushRetryTimer = setTimeout(async ()=>{
      pushRetryTimer = null;
      if(!cfgOk() || !g().autoSync){ pushRetries = 0; return; }
      try{
        const res = await pushAll();
        pushRetries = 0; // éxito: el ciclo de reintentos se reinicia
        if(res && (res.pushed>0 || res.deleted>0)){
          toast(`✓ Cambios subidos a la nube (${res.pushed} subida(s), ${res.deleted} borrada(s))`);
        }
      }catch(e){
        GitLog.warn('retry', e.message || String(e));
        retryPushSoon('fallo del reintento');
      }
    }, delay);
  }
  function schedulePush(){
    if(!cfgOk()){
      GitLog.warn('auto','Configuración de GitHub incompleta — los cambios NO se subirán');
      return;
    }
    if(!g().autoSync){
      GitLog.warn('auto','Sincronización automática desactivada — los cambios NO se subirán');
      return;
    }
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async ()=>{
      // GitHub exige PUT/DELETE EN SERIE: si hay un push/pull en curso
      // (busy), se aplaza este intento en lugar de solaparlo (evita los
      // conflictos 409/422 que la API devuelve con operaciones paralelas).
      if(busy){
        GitLog.info('auto','Operación en curso — subida aplazada 2,5 s');
        clearTimeout(pushTimer);
        pushTimer = setTimeout(async ()=>{ await pushAll(); }, 2500);
        return;
      }
      try{
        toast('Subiendo cambios a la nube…');
        const res = await pushAll();
        if(res && (res.pushed>0 || res.deleted>0)){
          toast(`✓ Cambios subidos a la nube (${res.pushed} subida(s), ${res.deleted} borrada(s))`);
        }else{
          toast('✓ Todo sincronizado con la nube');
        }
      }catch(e){
        GitLog.err('auto', e.message);
        toast('⚠ Sin conexión — se reintentará automáticamente');
        retryPushSoon('sin conexión');
      }
    }, 1800);
  }

  // ---------- Auto-pull (polling de cambios remotos) ----------
  // 60s en lugar de 12s: con 2 requests por tick (index + listado) eran
  // ~600 req/h contra una cuota de 5000/h — sin margen para pushes ni
  // para otro dispositivo. Con 60s son ~120 req/h, y el pull también se
  // dispara al enfocar/visibilizar la app, que es cuando de verdad importa.
  let pullTimer = null;
  let pullInFlight = false;
  let pullListenersBound = false;
  const PULL_INTERVAL_MS = 60000;
  function scheduleNextPull(){
    clearTimeout(pullTimer);
    pullTimer = setTimeout(async ()=>{
      await autoPullTick();
      scheduleNextPull();
    }, PULL_INTERVAL_MS);
  }
  function viewIsSafeToRefresh(){
    // No refrescar la vista si el usuario está capturando/editando:
    // un App.refresh() aquí borraría todo lo tecleado sin guardar.
    try{
      const form = document.getElementById('repairForm');
      if(form) return false;
      const modal = document.getElementById('modal');
      if(modal && !modal.classList.contains('hidden')) return false;
      return true;
    }catch(_){ return true; }
  }
  async function autoPullTick(){
    if(pullInFlight) return;
    if(!cfgOk() || !g().autoSync) return;
    if(busy) return;
    if(rateLimitedUntil > Date.now()) return;
    if(typeof document !== 'undefined' && document.hidden) return;
    // v51 — tras "Reiniciar todo el sistema" NO bajamos la nube en este
    // arranque: traería de vuelta todo lo que el usuario acaba de borrar.
    // La clave la consume Bootstrap.run() y este tick (una sola vez).
    let skipPullOnce = false;
    try{
      if(localStorage.getItem('taller_skip_bootstrap_once') === '1'){
        skipPullOnce = true;
        localStorage.removeItem('taller_skip_bootstrap_once');
        GitLog.info('auto-pull', 'Pull inicial omitido: sistema recién reiniciado');
      }
    }catch(_){}
    if(skipPullOnce) return;
    pullInFlight = true;
    try{
      // ANTI-PÉRDIDA: si hay cambios locales pendientes de subir, el pull
      // espera. Primero se sube (push), luego se baja. Así el índice
      // remoto viejo jamás pisa datos nuevos.
      const pend = await getPendingPush();
      if(pend && pend.total > 0){
        GitLog.info('auto-push', `Pendientes locales: ${pend.total}. Subiendo antes de bajar…`);
        schedulePush();
        return; // tras el push, el siguiente tick reintenta el pull
      }
      const pending = await getPendingPull();
      if(pending && pending.remotePendingTotal > 0){
        GitLog.info('auto-pull', `Cambios remotos detectados: ${pending.remotePendingTotal}. Descargando…`);
        toast('Bajando cambios desde la nube…');
        await pullAll();
        if(viewIsSafeToRefresh()){
          try{ if(window.App && typeof App.refresh === 'function') App.refresh(); }catch(_){}
        } else {
          GitLog.info('vista', 'Cambios bajados. La vista no se refrescó porque estás editando un formulario.');
          toast('✓ Datos actualizados desde la nube');
        }
        if(viewIsSafeToRefresh()) toast(`✓ ${pending.remotePendingTotal} cambio(s) recibido(s) desde la nube`);
      }
    }catch(e){
      GitLog.warn('auto-pull', e.message || String(e));
    }finally{
      pullInFlight = false;
    }
  }
  function startAutoPull(){
    stopAutoPull();
    // Al iniciar: PRIORIDAD PUSH — primero subimos los cambios locales
    // pendientes (protege los datos capturados offline), y solo después
    // de que el push termine bajamos los cambios remotos.
    setTimeout(async ()=>{
      // v51 — tras reset total: el usuario decide también sobre la nube;
      // este dispositivo arranca limpio y NO re-descarga el repositorio
      // en este arranque (la clave la consume Bootstrap.run() o el tick).
      try{
        if(localStorage.getItem('taller_skip_bootstrap_once') === '1'){
          localStorage.removeItem('taller_skip_bootstrap_once');
          GitLog.info('auto-push-init', 'Arranque limpio tras reinicio: sin descarga de la nube en esta sesión');
          return;
        }
      }catch(_){}
      try{
        if(cfgOk() && g().autoSync){
          const pend = await getPendingPush();
          if(pend && pend.total > 0){
            GitLog.info('auto-push-init', `Pendientes locales: ${pend.total}. Subiendo primero…`);
            try{
              await pushAll();
              toast('✓ Datos offline pendientes subidos a la nube');
            }catch(e){
              GitLog.err('auto-push-init', e.message);
            }
          }
        }
      }catch(_){}
      await autoPullTick();
    }, 1500);
    scheduleNextPull();
    if(!pullListenersBound){
      pullListenersBound = true;
      document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) autoPullTick(); });
      window.addEventListener('online', ()=>{
        // Reconexión: subir lo pendiente INMEDIATAMENTE, sin esperar al tick.
        rateLimitedUntil = 0; // nueva conexión: reintenta
        pushRetries = 0;      // ciclo de reintentos desde cero (conexión nueva)
        if(cfgOk() && g().autoSync) schedulePush();
        autoPullTick();
      });
      window.addEventListener('focus', ()=> autoPullTick());
    }
  }
  function stopAutoPull(){
    clearTimeout(pullTimer);
    pullTimer = null;
  }

  return {
    cfgOk, basePath, isBusy: ()=>busy,
    test: testConnection,
    push: pushAll, pull: pullAll, schedulePush, markDirty, markDirtyTx,
    getPendingPush, getPendingPull,
    markDeleted, markDeletedTx,
    startAutoPull, stopAutoPull, autoPullNow: autoPullTick,
    // Reset total (v5):
    resetCaches, wipeRemote,
    // Bootstrap móvil (v5):
    pullReadOnly,
    // Compatibilidad con código viejo:
    pushLegacy: pushAll
  };
})();
window.GitSync = GitSync;

// =============================================================
// File System Access — guardar JSON en una ubicación local
// =============================================================
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
    try{
      if((await h.queryPermission(opts)) === 'granted') return true;
      return (await h.requestPermission(opts)) === 'granted';
    }catch(_){
      // v57 — handle corrupto/serializado sin métodos (prueba o migración
      // antigua): se trata como SIN permiso y el flujo muestra el mensaje
      // claro de re-elegir ubicación.
      return false;
    }
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
  async function readText(){
    if(!cachedHandle) return null;
    if(!(await ensurePermission(cachedHandle))) return null;
    try{
      const f = await cachedHandle.getFile();
      return await f.text();
    }catch(e){
      // v57 — archivo movido/borrado o permiso caído: mensaje claro y
      // recuperable (re-elegir la ubicación) en vez de un error críptico.
      console.warn('LocalFile readText', e);
      return null;
    }
  }
  async function loadFromFile(){
    // v56 — esta API ya no reemplaza datos sin preguntar: si hay datos
    // locales, devuelve el texto para que la UI (askImportMode) decida el
    // modo; solo auto-importa cuando el dispositivo está VACÍO (primer uso).
    const text = await readText();
    if(text==null) return false;
    const empty = !(DB.repairs && DB.repairs.length);
    if(empty) return DB.importJson(text);
    return text; // el llamador debe pasarlo por askImportMode
  }
  loadHandle();
  // v57 — «Cargar desde el archivo» no funcionaba: loadHandle() es async y
  // se llamaba sin esperar → al pintar Administración hasHandle() seguía
  // false (handle aún no cargado de IndexedDB) y el botón salía deshabilitado
  // con «sin configurar» aunque hubiera ubicación guardada. Se avisa cuando
  // el handle ya está disponible para que la UI se repinte con el estado real.
  loadHandle().then(()=>{ try{ window.dispatchEvent(new Event('localfile-ready')); }catch(_){} });
  return { isSupported, hasHandle, pickLocation, clearHandle, write, scheduleWrite, loadFromFile, readText, loadHandle };

})();
window.LocalFile = LocalFile;

// =============================================================
// Bootstrap v5 — conexión automática en dispositivos nuevos
//
// El PC "publica" su configuración (usuario/repo/rama/carpeta) en
// <base>/config.json, servida por GitHub Pages. Un móvil NUEVO que
// abre la app por primera vez:
//   1. Lee config.json desde la propia URL de Pages (mismo origen,
//      sin token y sin API: 1 GET público).
//   2. Pregunta UNA vez: "¿Conectar este dispositivo con la nube
//      del taller?".
//   3. Si acepta: adopta user/repo/branch/path (token vacío → modo
//      solo lectura vía Pages/raw) y sincroniza.
// Con eso el usuario del móvil no teclea NADA en Admin. Cuando
// quiera editar datos, crea su propio token y lo pega; hasta
// entonces todo le llega como lectura.
// =============================================================
const Bootstrap = (() => {
  const ASKED_KEY = 'taller_bootstrap_asked';
  const CONFIG_URL = 'taller-data/config.json'; // relativa al despliegue

  function alreadyConfigured(){
    const gh = DB.settings.github || {};
    return !!(gh.user && gh.repo && (gh.token || gh.enabled));
  }
  function wasAsked(){
    try{ return localStorage.getItem(ASKED_KEY) === '1'; }catch(_){ return true; }
  }
  function markAsked(){
    try{ localStorage.setItem(ASKED_KEY, '1'); }catch(_){}
  }

  // Descubre el config.json publicado. Probamos la ruta relativa al
  // despliegue actual (GitHub Pages sirve el repo tal cual), con un
  // par de variantes por si la app está en / o en /<repo>/.
  // v54: el archivo puede llegar CIFRADO (EDR-ENC1). Se devuelve
  // {cfg, encrypted}: si viene cifrado se resuelve después de pedir la
  // frase al usuario (askPassphrase) — flujo de un solo paso.
  async function fetchSharedConfig(){
    const paths = [
      CONFIG_URL,
      './' + CONFIG_URL
    ];
    for(const p of paths){
      try{
        GitLog.info('boot', 'Buscando configuración compartida: ' + p);
        const resp = await fetch(p, { cache:'no-store' });
        if(!resp.ok){ GitLog.info('boot', p + ' → ' + resp.status); continue; }
        const txt = await resp.text();
        if(CryptoCfg.isEncrypted(txt)){
          return { encrypted:true, raw:txt };
        }
        const cfg = JSON.parse(txt);
        if(cfg && cfg.kind === 'taller-config' && cfg.user && cfg.repo){
          return { encrypted:false, cfg };
        }
      }catch(e){
        GitLog.info('boot', p + ' no disponible (' + (e.message||e) + ')');
      }
    }
    return null;
  }

  // v54 — Frase secreta del taller guardada en ESTE dispositivo.
  // Si ya se conoce (la escribió el dueño en Admin o en un arranque
  // anterior), se descifra sin preguntar. Si no, se pide UNA vez.
  const PHRASE_KEY = 'taller_cfg_phrase';
  function savedPhrase(){
    try{ return localStorage.getItem(PHRASE_KEY) || ''; }catch(_){ return ''; }
  }
  function savePhrase(p){
    try{ localStorage.setItem(PHRASE_KEY, String(p||'').trim()); }catch(_){}
  }
  function askPassphrase(){
    return new Promise(resolve=>{
      const wrap = document.createElement('div');
      wrap.className = 'confirm-overlay';
      wrap.innerHTML = `
        <div class="confirm-card" role="dialog" aria-modal="true">
          <h3>🔐 Frase secreta del taller</h3>
          <p style="line-height:1.55">La configuración de la nube viaja
          <b>cifrada</b>. Escribe la frase secreta que definió el dueño
          del taller para descifrarla y conectar automáticamente.</p>
          <div class="form-group" style="margin:0 0 12px">
            <input type="password" id="edrPhrase" placeholder="Frase secreta" autocomplete="off" style="width:100%;box-sizing:border-box">
          </div>
          <div class="btn-row">
            <button class="btn-secondary" data-act="no">Cancelar</button>
            <button class="btn-primary" data-act="yes">Descifrar</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const inp = wrap.querySelector('#edrPhrase');
      if(inp) setTimeout(()=>{ try{ inp.focus(); }catch(_){} }, 50);
      const close = v => { wrap.remove(); resolve(v); };
      wrap.addEventListener('click', e=>{
        if(e.target===wrap){ close(null); return; }
        const act = e.target.closest('[data-act]')?.dataset.act;
        if(act==='yes') close(inp ? inp.value.trim() : '');
        if(act==='no') close(null);
      });
      wrap.addEventListener('keydown', e=>{
        if(e.key==='Enter'){
          e.preventDefault();
          close(inp ? inp.value.trim() : '');
        }
      });
    });
  }

  // v54 — Descifra el config con la frase (guardada o preguntada).
  // Devuelve el objeto cfg o null si se canceló. La frase correcta se
  // recuerda para no volver a pedirla en cada arranque.
  async function decryptConfig(raw){
    let phrase = savedPhrase();
    let cfg = null;
    for(let attempt=0; attempt<2 && !cfg; attempt++){
      if(!phrase){
        phrase = await askPassphrase();
        if(phrase == null) return null; // cancelado
      }
      try{
        cfg = JSON.parse(await CryptoCfg.decrypt(raw, phrase));
        savePhrase(phrase);
      }catch(e){
        // Frase incorrecta (GCM autenticado: falla limpio)
        GitLog.warn('boot', 'Frase incorrecta o archivo corrupto');
        phrase = '';
        if(attempt === 0){
          try{ UI.toast('Frase secreta incorrecta'); }catch(_){}
        }
      }
    }
    if(!cfg) return null;
    if(cfg && cfg.kind === 'taller-config'){
      // Recordar también la frase correcta en settings (alias práctico
      // para re-publicar desde este dispositivo si el dueño lo permite).
      return cfg;
    }
    return null;
  }

  function askAdopt(cfg){
    return new Promise(resolve=>{
      const wrap = document.createElement('div');
      wrap.className = 'confirm-overlay';
      wrap.innerHTML = `
        <div class="confirm-card" role="dialog" aria-modal="true">
          <h3>☁️ Conectar con la nube del taller</h3>
          <p style="line-height:1.55">
            Este dispositivo puede sincronizarse con los datos del taller
            <b>${UI.escape(cfg.user)}/${UI.escape(cfg.repo)}</b>.<br><br>
            Se descargarán todas las reparaciones, fotos, audios y movimientos
            y se mantendrán actualizados automáticamente.<br><br>
            <span class="muted small">${cfg.token
              ? 'La configuración llegó cifrada e incluye el token del taller: este dispositivo podrá editar desde ya.'
              : 'Podrás editarlos cuando añades tu propio token de GitHub (Administración → Sincronización GitHub). Sin token, este dispositivo funciona en modo lectura.'}</span>
          </p>
          <div class="btn-row">
            <button class="btn-secondary" data-act="no">No, usar por separado</button>
            <button class="btn-primary" data-act="yes">Sí, sincronizar ahora</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const close = v => { wrap.remove(); resolve(v); };
      wrap.addEventListener('click', e=>{
        if(e.target===wrap){ close(false); return; }
        const act = e.target.closest('[data-act]')?.dataset.act;
        if(act==='yes') close(true);
        if(act==='no') close(false);
      });
    });
  }

  async function run(){
    // Solo en el primer arranque, sin configuración propia.
    if(alreadyConfigured() || wasAsked()) return;
    // (window.Auth se asigna en js/auth.js desde v5.)
    if(!Auth.isLoggedIn()) return; // tras el login, en el init de App
    // v51 — ANTI-RESURRECCIÓN tras "Reiniciar todo el sistema": si el
    // dispositivo acaba de hacer reset local, Bootstrap NO debe volver a
    // bajar la nube automáticamente (el usuario decidió empezar de cero).
    // La clave 'taller_bootstrap_asked' se borra en DB.resetAll() solo
    // para restaurar el borrado de fábrica COMPLETO; aquí evitamos que
    // ese borrado re-descargue datos: el reset marca la sesión de forma
    // que el bootstrap se salta hasta el próximo arranque limpio.
    try{
      if(localStorage.getItem('taller_skip_bootstrap_once') === '1'){
        localStorage.removeItem('taller_skip_bootstrap_once');
        markAsked(); // no volver a preguntar en este arranque
        GitLog.info('boot', 'Bootstrap omitido: el sistema acaba de reiniciarse');
        return;
      }
    }catch(_){}
    try{
      const found = await fetchSharedConfig();
      if(!found){ markAsked(); return; }
      let cfg;
      if(found.encrypted){
        cfg = await decryptConfig(found.raw);
        if(!cfg){ markAsked(); return; } // canceló la frase
      } else {
        cfg = found.cfg;
      }
      markAsked();
      GitLog.ok('boot', 'Configuración del taller detectada: ' + cfg.user + '/' + cfg.repo);
      const adopt = await askAdopt(cfg);
      if(!adopt) return;
      // Adoptar la configuración compartida. v54: si el dueño incluyó el
      // token dentro del cifrado, este dispositivo ya puede EDITAR desde
      // el primer minuto (no solo lectura).
      DB.updateGithub({
        enabled: true,
        user: cfg.user, repo: cfg.repo,
        branch: cfg.branch || 'main',
        path: cfg.path || 'taller-data',
        token: cfg.token || '', autoSync: true
      });
      DB.setGithubShared({
        user: cfg.user, repo: cfg.repo, branch: cfg.branch || 'main',
        path: cfg.path || 'taller-data', whatsapp: cfg.whatsapp || ''
      });
      GitLog.ok('boot', cfg.token
        ? 'Dispositivo conectado con permisos de edición (token incluido en el cifrado)'
        : 'Dispositivo conectado en modo lectura. Bajando datos…');
      try{ UI.toast('Conectado con la nube del taller. Descargando datos…', 3500); }catch(_){}
      // Descarga inicial: GitHub Pages sirve el repo estático. Para el
      // índice y las reparaciones usamos raw.githubusercontent (público,
      // sin token) — pullReadOnly() ya lo maneja.
      await GitSync.pullReadOnly();
      try{ App.refresh(); }catch(_){}
    }catch(e){
      GitLog.warn('boot', 'Bootstrap: ' + (e.message||e));
    }
  }

  return { run };
})();
window.Bootstrap = Bootstrap;

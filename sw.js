// =============================================================
// Service Worker — v52 (auto-actualización robusta)
//
// - Precarga individual (no addAll todo-o-nada): un 404 puntual
//   (p. ej. un screenshot) ya no tumba la actualización entera.
// - skipWaiting + clients.claim: la nueva versión se activa en
//   cuanto llega, sin esperar a cerrar todas las pestañas.
// - activate borra TODAS las cachés viejas.
// - GET_VERSION responde la versión activa (para el aviso "app
//   actualizada" del cliente).
// - fetch: HTML/JS/CSS network-first con ignoreSearch, para que
//   las peticiones con ?v= encuentren su copia offline aunque
//   la caché la guardara sin query.
// =============================================================
const CACHE = 'taller-v52';
const VERSION = '52';
const ASSETS = [
  './','./index.html','./manifest.json',
  './css/styles.css',
  './js/db.js','./js/sync.js','./js/auth.js','./js/install.js','./js/ui.js','./js/views.js','./js/app.js',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/maskable-192.png','./icons/maskable-512.png',
  './icons/favicon-32.png',
  './screenshots/narrow-1.png','./screenshots/narrow-2.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>
      // Una por una: los fallos puntuales no bloquean la instalación
      // (con el viejo addAll, un solo 404 tumbaba la actualización).
      Promise.all(ASSETS.map(a=>
        fetch(new Request(a, {cache:'reload'}))
          .then(r=> r.ok ? c.put(a, r) : null)
          .catch(()=>null)
      ))
    ).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message', e=>{
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION'){
    // Responde al cliente qué versión está activa.
    e.source && e.source.postMessage({type:'VERSION', v:VERSION});
  }
});

// Network-first para HTML/JS/CSS — siempre ves los cambios; cae a cache si offline
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  if(e.request.url.includes('api.github.com')) return;
  if(e.request.url.includes('raw.githubusercontent.com')) return;
  const url = new URL(e.request.url);
  // taller-data/ son DATOS de sincronización servidos por Pages: siempre
  // red primero (nunca cache) para que el bootstrap y el pull read-only
  // lean la última versión publicada por el PC.
  if(url.pathname.includes('/taller-data/')){
    e.respondWith(
      fetch(e.request).catch(()=>caches.match(e.request, {ignoreSearch:true}))
    );
    return;
  }
  const isShell = /\.(html|js|css)$/.test(url.pathname) || url.pathname.endsWith('/') || e.request.mode === 'navigate';
  if(isShell){
    e.respondWith(
      fetch(e.request).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
        return resp;
      }).catch(()=> caches.match(e.request, {ignoreSearch:true}).then(r=> r || caches.match('./index.html', {ignoreSearch:true})))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch:true}).then(r=>
      r || fetch(e.request).catch(()=>caches.match('./index.html', {ignoreSearch:true}))
    )
  );
});

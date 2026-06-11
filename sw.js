const CACHE = 'taller-v4';
const ASSETS = [
  './','./index.html','./manifest.json',
  './css/styles.css',
  './js/db.js','./js/sync.js','./js/auth.js','./js/ui.js','./js/views.js','./js/app.js',
  './icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  // No cachear llamadas a la API de GitHub
  if(e.request.url.includes('api.github.com')) return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))));
});

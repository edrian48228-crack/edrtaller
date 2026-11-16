// =============================================================
// Instalación PWA — v1
//
// - Captura beforeinstallprompt (Android/Chrome/Edge/Samsung)
//   y muestra un botón "Instalar app" en el dashboard.
// - Detecta iOS (Safari no dispara beforeinstallprompt) y muestra
//   la guía de "Compartir → Añadir a pantalla de inicio".
// - Detecta si ya está instalada (display-mode standalone o
//   getInstalledRelatedApps) y entonces no muestra nada.
// - Procesa parámetros de los shortcuts del manifest:
//   ?v=new | ?v=sale | ?v=search
// =============================================================
const Install = (() => {
  let deferredPrompt = null;
  let seen = false;

  function isStandalone(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true
      || (window.location.search||'').includes('source=pwa');
  }
  function isIOS(){
    if(!/iphone|ipad|ipod/i.test(navigator.userAgent)){
      // iPadOS 13+ se identifica como Mac con pantalla táctil
      return /macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
    }
    return true;
  }

  window.addEventListener('beforeinstallprompt', e=>{
    e.preventDefault();
    deferredPrompt = e;
    if(!seen){ seen = true; renderInstallCard(); }
  });
  window.addEventListener('appinstalled', ()=>{
    deferredPrompt = null;
    const card = document.getElementById('installCard');
    if(card) card.remove();
    try{ UI.toast('✓ App instalada en tu dispositivo'); }catch(_){}
  });

  async function promptInstall(){
    if(!deferredPrompt){
      // Firefox / navegadores sin soporte: guía manual
      openInstallGuide();
      return;
    }
    deferredPrompt.prompt();
    try{
      const choice = await deferredPrompt.userChoice;
      if(choice && choice.outcome === 'accepted'){
        const card = document.getElementById('installCard');
        if(card) card.remove();
      }
    }catch(_){}
    deferredPrompt = null;
  }

  // Icono (trazos del mismo estilo que los logos de la app)
  const PHONE_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="6.5" y="2.5" width="11" height="19" rx="3"/>
  <path d="M10.5 18.5h3"/>
  <path d="M12 7.2v5.3"/>
  <path d="M9.8 10.3 12 12.5l2.2-2.2"/>
  <path d="M9.8 15.2h4.4"/>
</svg>`.trim();

  function openInstallGuide(){
    const ios = isIOS();
    const steps = ios ? [
      { t:'Abre esta página en <b>Safari</b>', d:'Si la abriste en otro navegador, copia la dirección y ábrela en Safari.' },
      { t:'Pulsa el botón <b>Compartir</b>', d:'El cuadrado con la flecha hacia arriba, en el centro abajo.' },
      { t:'Toca <b>«Añadir a pantalla de inicio»</b>', d:'Baja en la lista hasta encontrarlo.' },
      { t:'Confirma con <b>«Añadir»</b>', d:'El icono quedará junto al resto de tus apps.' }
    ] : [
      { t:'Abre el <b>menú del navegador</b>', d:'Los tres puntos ⋮ (arriba a la derecha en Chrome).' },
      { t:'Toca <b>«Instalar aplicación»</b>', d:'O «Añadir a pantalla de inicio», según el navegador.' },
      { t:'Confirma con <b>«Instalar»</b>', d:'Se abrirá a pantalla completa, sin barra del navegador.' }
    ];
    const rows = steps.map((s,i)=>`
      <div class="istep">
        <span class="istep-n">${i+1}</span>
        <div class="istep-body">
          <div class="istep-t">${s.t}</div>
          <div class="istep-d">${s.d}</div>
        </div>
      </div>`).join('');
    UI.openModal(`
      <div class="ihead">
        <div class="ihead-ico">${PHONE_SVG}</div>
        <h2>Instalar en tu móvil</h2>
        <p class="ihead-sub"><b>${ios ? 'iPhone · Safari' : 'Android · Chrome y similares'}</b> — una vez instalada funciona <b>sin conexión</b> y se actualiza sola cuando haya internet. Tus datos se guardan en el dispositivo y se sincronizan con GitHub automáticamente.</p>
      </div>
      <div class="isteps">${rows}</div>
      <button class="btn-primary btn-install" id="installGo" style="width:100%;margin-top:14px">Entendido</button>`);
    document.getElementById('installGo').onclick = ()=> UI.closeModal();
  }

  function renderInstallCard(){
    if(isStandalone()) return;
    const view = document.getElementById('view');
    if(!view) return;
    const ios = isIOS();
    const existing = document.getElementById('installCard');
    if(existing) existing.remove();
    const card = document.createElement('div');
    card.id = 'installCard';
    card.className = 'admin-card install-card';
    // Tarjeta centrada (v39): icono → título → subtítulo → botón ancho → enlace
    card.innerHTML = `
      <div class="install-hero">
        <div class="ih-ico">${PHONE_SVG}</div>
        <h3 class="ih-title">${ios ? 'Instalar en tu iPhone' : 'Instalar la app'}</h3>
        <p class="ih-sub">${ios
          ? 'Añádela a tu pantalla de inicio para usarla sin navegador y sin conexión.'
          : 'Icono propio, pantalla completa y uso <b>sin conexión</b>.'}</p>
        <button class="btn-primary btn-install" id="installBtn">Instalar ahora</button>
        <button class="install-how" id="installHow">¿Cómo se instala? — paso a paso</button>
      </div>`;
    view.prepend(card);
    const btn = document.getElementById('installBtn');
    if(btn) btn.onclick = ()=>{ if(deferredPrompt) promptInstall(); else openInstallGuide(); };
    const how = document.getElementById('installHow');
    if(how) how.onclick = openInstallGuide;
  }

  // Shortcuts del manifest: ?v=new | ?v=sale | ?v=search
  function processShortcut(){
    try{
      const v = new URLSearchParams(window.location.search).get('v');
      if(!v) return;
      if(!Auth.isLoggedIn()) return; // aún no entró: el login es lo primero
      if(v === 'new') App.go('chooser');
      else if(v === 'sale'){ App.go('sales'); Views.newTransaction('sale'); }
      else if(v === 'search') App.go('search');
      // limpiar el parámetro para no repetirlo al refrescar
      try{ history.replaceState(null, '', window.location.pathname); }catch(_){}
    }catch(_){}
  }

  function init(){
    // Mostrar la tarjeta si el navegador permite instalar y aún no está instalada.
    if(!isStandalone()){
      // beforeinstallprompt puede llegar tarde: ventana de gracia
      setTimeout(()=>{ if(!deferredPrompt && !seen) renderInstallCard(); }, 2500);
    }
    processShortcut();
  }

  return { init, promptInstall, openInstallGuide, isStandalone, isIOS, renderInstallCard };
})();
window.Install = Install;
// v53 — arranque rápido: este archivo se carga como <script defer>. Si App.init()
// ya corrió antes (los script normales se ejecutan antes que los defer), la llamada
// original Install.init() se perdió → auto-iniciar aquí una única vez.
(function(){
  let ran = false;
  function boot(){
    if(ran) return; ran = true;
    try{ Install.init(); }catch(_){}
  }
  if(window.__appInitDone) boot();
  else window.addEventListener('__appReady', boot, { once:true });
})();

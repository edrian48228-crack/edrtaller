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

  function openInstallGuide(){
    const ios = isIOS();
    const steps = ios ? `
      <ol class="install-steps">
        <li>Abre esta página en <b>Safari</b> si no lo estás usando.</li>
        <li>Pulsa el botón <b>Compartir</b> <span class="ios-share">(cuadrado con flecha hacia arriba)</span>.</li>
        <li>Baja y toca <b>“Añadir a pantalla de inicio”</b>.</li>
        <li>Confirma con <b>“Añadir”</b>. El ícono aparecerá como una app más.</li>
      </ol>` : `
      <ol class="install-steps">
        <li>Abre el <b>menú del navegador</b> (⋮ o ⋮ según el navegador).</li>
        <li>Toca <b>“Instalar aplicación”</b> o <b>“Añadir a pantalla de inicio”</b>.</li>
        <li>Confirma. La app se abrirá a pantalla completa, sin barra del navegador.</li>
      </ol>`;
    UI.openModal(`
      <h2 style="margin:0 0 6px;font-size:20px">Instalar en el móvil</h2>
      <p class="muted small" style="margin:0 0 12px">Una vez instalada funciona <b>sin conexión</b> y se actualiza sola cuando haya internet. Tus datos se guardan en el dispositivo y se sincronizan con GitHub automáticamente.</p>
      ${steps}
      <div class="btn-row" style="margin-top:14px">
        <button class="btn-primary" id="installGo">Entendido</button>
      </div>`);
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
    card.innerHTML = `
      <div class="row-between">
        <div style="flex:1;min-width:0">
          <h3>📲 Instalar la app</h3>
          <p>${ios
            ? 'Instálala en tu pantalla de inicio para usarla sin navegador y sin conexión.'
            : 'Instálala como aplicación: icono propio, pantalla completa y uso <b>offline</b>.'}</p>
        </div>
        <button class="btn-primary btn-install" id="installBtn">Instalar</button>
      </div>
      <button class="install-how" id="installHow">¿Cómo se instala${ios?' en iPhone':''}?</button>`;
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

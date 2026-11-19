// v53 — SPLASH: hitos de progreso real durante el arranque. El splash vive
// inline en index.html y se pinta antes de bajar nada; aquí solo avanzamos
// la barra y lo retiramos con fade cuando la interfaz YA está renderizada.
const Splash = (() => {
  const el = document.getElementById('edrSplash');
  const ring = document.getElementById('spRing');
  const pctEl = document.getElementById('spPct');
  const msg = document.getElementById('spMsg');
  let pct = 0;
  function progress(p, m){
    pct = Math.max(pct, Math.min(100, Math.round(p)));
    // v54 — anillo circular conic-gradient: el CSS lee --sp
    if(ring) ring.style.setProperty('--sp', pct);
    if(pctEl) pctEl.textContent = pct + '%';
    if(m && msg) msg.textContent = m;
  }
  function done(){
    if(!el || el.classList.contains('done')) return;
    el.classList.add('done');
    // retirar del DOM tras el fade para no ensuciar accesibilidad/DOM
    setTimeout(()=>{ try{ el.remove(); }catch(_){} }, 500);
  }
  return { progress, done };
})();

const App = (() => {
  let current = 'dashboard';
  let currentArg = null;
  // v53 — hash de fábrica de 'taller48228' (mismo valor precargado en
  // db.js defaults). Sirve para mostrar la pista solo mientras la clave
  // no se ha cambiado.
  const FACTORY_HASH = 'ff00c1b79696c240ddb8d79beeb2f0f86a914e4f3552b287d453b87971d0635b';

  // Logos: trazos refinados, geometría centrada, estética premium
  const LOGO_PRESETS = [
    { key:'phoenix', name:'Fénix', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lg-ph" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="currentColor" stop-opacity=".95"/>
    <stop offset="1" stop-color="currentColor" stop-opacity=".5"/>
  </linearGradient></defs>
  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 8 C 20 18 18 30 26 38 L 22 44 C 30 42 34 38 36 32 C 38 38 42 42 50 44 L 46 38 C 54 30 52 18 40 10 C 38 16 36 20 32 22 C 30 18 30 12 32 8 Z" fill="url(#lg-ph)" fill-opacity=".25"/>
    <path d="M24 48 L40 48 M22 54 L42 54" stroke-width="2.4"/>
  </g>
</svg>`.trim() },
    { key:'tools', name:'Herramientas', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="32" cy="32" r="26" stroke-opacity=".25"/>
    <path d="M16 48 L36 28" />
    <path d="M14 50 a4 4 0 1 1 5 -5" />
    <path d="M44 22 a8 8 0 1 0 -12 -8 l6 6 -4 4 -6 -6 a8 8 0 0 0 12 8 z" fill="currentColor" fill-opacity=".2"/>
    <path d="M50 14 L30 34" />
    <path d="M52 12 l4 4 -4 4 -4 -4 z" fill="currentColor" fill-opacity=".3"/>
  </g>
</svg>`.trim() },
    { key:'gear', name:'Engranaje', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 6 L35 12 L41.5 11 L43 17.5 L49 19.5 L48 26 L53 30 L50 35.5 L52 41.5 L46 44 L44 50 L37.5 50 L34 55.5 L28 53.5 L22 55 L19 49.5 L13 47.5 L13 41 L8 36.5 L11.5 31 L10 25 L15 22 L16.5 15.5 L23 14.5 L27 9 Z" fill="currentColor" fill-opacity=".14"/>
    <circle cx="32" cy="32" r="9" fill="currentColor" fill-opacity=".22"/>
    <circle cx="32" cy="32" r="3.4" fill="currentColor"/>
  </g>
</svg>`.trim() },
    { key:'shield', name:'Garantía', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 6 L52 14 L52 32 C52 44 42 54 32 58 C22 54 12 44 12 32 L12 14 Z" fill="currentColor" fill-opacity=".15"/>
    <path d="M22 32 L29 39 L43 24" stroke-width="3.2"/>
  </g>
</svg>`.trim() },
    { key:'circuit', name:'Circuito', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="12" y="12" width="40" height="40" rx="6" fill="currentColor" fill-opacity=".08"/>
    <path d="M22 22 h8 v8 h-8z M34 22 h10 M34 30 h10 M22 38 h22 M22 46 h8 M34 46 h10"/>
    <circle cx="44" cy="22" r="2.6" fill="currentColor"/>
    <circle cx="44" cy="30" r="2.6" fill="currentColor"/>
    <circle cx="30" cy="46" r="2.6" fill="currentColor"/>
  </g>
</svg>`.trim() },
    { key:'bolt', name:'Energía', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lg-bl" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="currentColor" stop-opacity=".95"/>
    <stop offset="1" stop-color="currentColor" stop-opacity=".5"/>
  </linearGradient></defs>
  <path d="M36 4 L14 36 h12 L22 60 L50 26 H38 z" fill="url(#lg-bl)" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
</svg>`.trim() },
    { key:'diamond', name:'Diamante', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M14 24 L24 10 L40 10 L50 24 L32 56 Z" fill="currentColor" fill-opacity=".18"/>
    <path d="M14 24 H50 M24 10 L32 24 L40 10 M14 24 L32 24 L50 24"/>
  </g>
</svg>`.trim() },
    { key:'wrench', name:'Llave', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M44 8a12 12 0 0 0-11 16L10 47a4 4 0 0 0 0 6l1 1a4 4 0 0 0 6 0l23-23a12 12 0 0 0 14-15l-7 7-6-1-1-6z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
</svg>`.trim() }
  ];

  // Compatibilidad con presets antiguos guardados en DB
  const LOGO_ALIASES = { screwdriver:'tools' };

  function logoHtml(){
    const custom = DB.settings.logo;
    if(custom) return `<img src="${custom}" alt="logo">`;
    let key = DB.settings.logoPreset || 'phoenix';
    if(LOGO_ALIASES[key]) key = LOGO_ALIASES[key];
    const p = LOGO_PRESETS.find(x=>x.key===key) || LOGO_PRESETS[0];
    return p.svg;
  }
  function getPresets(){ return LOGO_PRESETS; }

  function applyBrand(){
    const name = DB.settings.appName || 'Taller';
    const html = UI.renderBrand(name);
    const app = document.getElementById('appTitle');
    const login = document.getElementById('loginTitle');
    if(app) app.innerHTML = html;
    if(login) login.innerHTML = html;
    document.title = name;
    const lh = logoHtml();
    const al = document.getElementById('appLogo');
    const ll = document.getElementById('loginLogo');
    if(al) al.innerHTML = lh;
    if(ll) ll.innerHTML = lh;
    renderCreatorChips();
  }

  function renderCreatorChips(){
    const box = document.getElementById('creatorContacts');
    if(!box) return;
    const c = (DB.settings.creator || {});
    const tel = UI.phoneClean(c.phone);
    const sms = UI.phoneSms(c.phone);
    const ICON_PHONE = '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1l-2.23 2.2z" fill="currentColor"/></svg>';
    const ICON_SMS = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" fill="currentColor"/></svg>';
    const parts = [];
    if(tel) parts.push(`<a class="creator-chip tel icon-only" href="tel:${UI.escape(tel)}" title="Llamar al creador" aria-label="Llamar">${ICON_PHONE}</a>`);
    if(sms) parts.push(`<a class="creator-chip sms icon-only" href="sms:${UI.escape(sms)}" title="Enviar SMS al creador" aria-label="SMS">${ICON_SMS}</a>`);
    box.innerHTML = parts.join('');
  }

  function showLogin(){
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
  function showApp(){
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    go('dashboard');
    // Auditoría automática al entrar: avisa si algo no cuadra
    setTimeout(()=>{ if(window.Views && Views.autoAuditOnLoad) Views.autoAuditOnLoad(); }, 600);
    // Iniciar sincronización automática (descarga) desde GitHub
    try{ if(window.GitSync && GitSync.startAutoPull) GitSync.startAutoPull(); }catch(_){}
    // Bootstrap v5: si este dispositivo NO tiene configuración propia y el
    // taller publicó config.json (GitHub Pages), preguntar una única vez
    // si desea conectarse y descargar todo sin teclear nada.
    try{ if(window.Bootstrap && Bootstrap.run) setTimeout(()=>Bootstrap.run(), 900); }catch(_){}
  }
  function go(v, arg, extra){
    // Si salimos del formulario "nuevo/editar", limpiar la guardia de back-navigation
    if(current === 'new' && v !== 'new'){
      try{ if(window.__formGuardCleanup) window.__formGuardCleanup(); }catch(_){}
    }
    current = v; currentArg = arg;
    document.querySelectorAll('.tab').forEach(t=>{
      t.classList.toggle('active', t.dataset.view === v);
    });
    if(v==='dashboard') Views.dashboard();
    else if(v==='repairs') Views.repairsList(arg);
    else if(v==='new') Views.newRepair(extra);
    else if(v==='sales') Views.sales(arg);
    else if(v==='summary') Views.summary();
    else if(v==='chooser') Views.newChooser();
    else if(v==='search') Views.search();
    else if(v==='admin') Views.admin();
    else if(v==='pendings') Views.pendings(arg);
    else if(v==='pendingForm') Views.pendingForm(extra);
    // La vista se re-renderiza entera (innerHTML): la tarjeta de instalación
    // debe re-insertarse en cada dashboard mientras no esté instalada.
    if(v==='dashboard'){
      // v53: install.js es defer — puede que aún no exista. Auto-boot de
      // install.js escucha __appReady y se encarga; aquí solo si ya cargó.
      try{ if(window.Install && Install.renderInstallCard) Install.renderInstallCard(); }catch(_){}
    }
    window.scrollTo(0,0);
    // v54 — la vista nueva puede ser más alta/ baja: re-evaluar el botón
    try{ const jb = document.getElementById('edrJump'); if(jb) jb.dispatchEvent(new Event('__check')); }catch(_){}
    setTimeout(()=>{ try{ const jb = document.getElementById('edrJump'); if(jb) jb.dispatchEvent(new Event('__check')); }catch(_){} }, 120);
  }
  function refresh(){ go(current, currentArg); }

  // v54 — Navegación rápida arriba/abajo. Un solo botón flotante:
  // ↓ "ir al final" mientras estás arriba; ↑ "volver arriba" cuando ya
  // estás abajo (o a media página con scroll > 1 pantalla). Suave
  // (smooth), respeta prefers-reduced-motion y NO ocupa alto de layout.
  function initJumpNav(){
    if(document.getElementById('edrJump')) return;
    const btn = document.createElement('button');
    btn.id = 'edrJump';
    btn.className = 'top-jump';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Ir al final de la página');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" class="j-down" fill="currentColor"><path d="M12 16l-6-6 1.4-1.4L12 13.2l4.6-4.6L18 10z"/></svg>
      <svg viewBox="0 0 24 24" class="j-up" fill="currentColor" style="display:none"><path d="M12 8l6 6-1.4 1.4L12 10.8l-4.6 4.6L6 14z"/></svg>`;
    document.body.appendChild(btn);
    const down = btn.querySelector('.j-down');
    const up   = btn.querySelector('.j-up');
    let atEnd = false;
    function setMode(isEnd){
      atEnd = isEnd;
      down.style.display = isEnd ? 'none' : '';
      up.style.display   = isEnd ? '' : 'none';
      btn.setAttribute('aria-label', isEnd ? 'Volver arriba' : 'Ir al final de la página');
    }
    function onScroll(){
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight || 1;
      // Mostrar solo cuando la página es más larga que la pantalla
      const docH = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight
      );
      const longEnough = docH > vh * 1.6;
      btn.classList.toggle('show', longEnough);
      const nearEnd = y + vh >= docH - 80;
      setMode(nearEnd);
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    // v54 — re-chequeo cuando el App.go renderiza una vista nueva
    btn.addEventListener('__check', onScroll);
    setTimeout(onScroll, 60);
    btn.addEventListener('click', ()=>{
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const y = window.scrollY || 0;
      const target = atEnd ? 0 : docH;
      window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    });
    onScroll();
  }

  function init(){
    Splash.progress(25, 'Leyendo almacenamiento…');
    applyBrand();
    document.getElementById('loginBtn').addEventListener('click', tryLogin);
    document.getElementById('loginPass').addEventListener('keydown', e=>{
      if(e.key==='Enter') tryLogin();
    });
    const fb = document.getElementById('forgotBtn');
    if(fb) fb.addEventListener('click', openForgotFlow);
    document.getElementById('logoutBtn').addEventListener('click', async ()=>{
      // v54 — Salir SIEMPRE con confirmación (antes cerraba de golpe y era
      // fácil tocarlo sin querer perdiendo la vista activa).
      const ok = await UI.confirmDialog({
        title:'Salir del sistema',
        message:'¿Cerrar Taller? Tus datos quedan guardados en el dispositivo y en la nube.',
        okText:'Sí, salir', cancelText:'Cancelar'
      });
      if(!ok) return;
      Auth.logout();
      // v57 — CIERRE REAL: salir no vuelve a enseñar el login en la misma
      // página (antes parecía "no salir"). Se intenta cerrar la pestaña
      // (cuando el navegador lo permite); si no se puede, se muestra una
      // pantalla final de sesión cerrada con reingreso manual voluntario.
      // Los datos NUNCA se tocan: IndexedDB/localStorage quedan intactos.
      try{ window.close(); }catch(_){}
      // Algunos navegadores ignoran window.close() (no la abrió un script).
      // Pantalla de cierre definitiva:
      document.getElementById('app').classList.add('hidden');
      const ls = document.getElementById('loginScreen');
      ls.classList.add('hidden');
      const bye = document.createElement('div');
      bye.id = 'closedScreen';
      bye.style.cssText = 'min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center';
      bye.innerHTML = `
        <div style="font-size:44px">🔒</div>
        <h2 style="margin:0">Sesión cerrada</h2>
        <p style="margin:0;max-width:420px;color:var(--muted)">
          Saliste del sistema. Tus datos quedan guardados en este dispositivo y en la nube.<br>
          Vuelve a entrar abriendo la app de nuevo.
        </p>
        <button class="btn-primary" id="reenterBtn" style="margin-top:8px">Volver a entrar</button>`;
      document.body.appendChild(bye);
      const re = bye.querySelector('#reenterBtn');
      if(re) re.onclick = ()=>{ bye.remove(); location.reload(); };
    });
    document.getElementById('modalClose').addEventListener('click', UI.closeModal);
    document.getElementById('modal').addEventListener('click', e=>{
      if(e.target.id==='modal') UI.closeModal();
    });
    document.querySelectorAll('.tab').forEach(t=>{
      t.addEventListener('click', ()=>{
        const v = t.dataset.view;
        if(v==='chooser'){ Views.newChooser(); return; }
        go(v);
      });
    });
    const sb = document.getElementById('headerSearchBtn');
    if(sb) sb.addEventListener('click', ()=> go('search'));
    // v63 — PENDIENTES: botón junto al de buscar (topbar). Abre la lista de
    // pendientes (citas/trabajos por hacer).
    const pb = document.getElementById('headerPendBtn');
    if(pb) pb.addEventListener('click', ()=> go('pendings'));
    try{ updatePendBadge(); }catch(_){}
    // v54 — NAVEGACIÓN RÁPIDA: botón flotante "ir al final" que se convierte
    // en "volver arriba" al llegar abajo. No cambia el alto de la topbar ni
    // del contenido (flota a la derecha, sobre la app, encima del tabbar).
    try{ initJumpNav(); }catch(_){}
    // Inicializar el módulo de instalación PWA (shortcuts del manifest,
    // detección de beforeinstallprompt y guía iOS). v53: install.js es defer;
    // si aún no cargó, su auto-boot escucha __appReady.
    try{ if(window.Install && Install.init) Install.init(); }catch(_){}
    Splash.progress(55, 'Cargando tus datos…');
    // v53 — SIN CONTRASEÑA configurada (requirePassword=false): entrar
    // DIRECTO, jamás mostrar la pantalla de login. isLoggedIn() ya devuelve
    // true en ese caso; el viejo código igualmente pasaba por showLogin si no
    // había hash, cosa que no debe ocurrir cuando se desactivó la contraseña.
    if(Auth.isLoggedIn()){
      showApp();
      // v41: sesión viva (app ya abierta) → asegurar almacenamiento persistente.
      try{ if(DB.ensurePersistent) DB.ensurePersistent(); }catch(_){}
      // v61 — aviso de equipos estancados también en arranque con sesión viva.
      try{ setTimeout(()=>notifyStaleOnce(), 600); }catch(_){}
    } else {
      // v53 — El hash de fábrica (taller48228) ya viene precargado, así que
      // "Primer acceso: define tu contraseña" solo aplica si por migración
      // antigua siguiera sin hash (ese caso define la primera tecleada).
      // Si la clave sigue SIENDO la de fábrica, se lo recordamos con una
      // pista discreta; apenas el usuario la cambia, la pista desaparece.
      const isFactory = DB.settings.passwordHash === FACTORY_HASH;
      const hint = document.querySelector('#loginScreen .muted');
      if(!DB.settings.passwordHash){
        if(hint) hint.textContent = 'Primer acceso: define tu contraseña';
      } else if(isFactory && hint){
        hint.innerHTML = 'Contraseña de fábrica: <b>taller48228</b> · cámbiala en Admin';
      }
      showLogin();
    }
    // v53: arranque terminado — splash fuera, primera vista ya en pantalla.
    // ?debug=1 congela el splash (inspección visual/diagnóstico de arranque).
    if(new URLSearchParams(location.search).get('debug') === '1'){
      Splash.progress(100, 'Listo (modo debug)');
      window.__appInitDone = true;
      window.dispatchEvent(new Event('__appReady'));
      return;
    }
    Splash.progress(100, 'Listo');
    Splash.done();
    window.__appInitDone = true;
    window.dispatchEvent(new Event('__appReady'));
  }
  async function tryLogin(){
    const pass = document.getElementById('loginPass').value;
    const err = document.getElementById('loginError');
    if(await Auth.login(pass)){
      err.classList.add('hidden');
      document.getElementById('loginPass').value = '';
      applyBrand();
      showApp();
      // v53: entrar con contraseña también despacha __appReady (install.js
      // defer podría estar esperándolo si App.init ya había corrido sin login).
      window.__appInitDone = true;
      window.dispatchEvent(new Event('__appReady'));
      // v41: pedir almacenamiento persistente tras entrar (IndexedDB ya no
      // aparece en "liberar espacio" de Android y refresca el diagnóstico).
      try{ if(DB.ensurePersistent) DB.ensurePersistent(); }catch(_){}
      // v61 — AVISO AL ENTRAR: equipos nuevos en las listas de estancamiento
      // (>30 días / sin devolución) o con recargo activo que no se habían
      // notificado antes. Se recuerda lo ya visto en localStorage para no
      // repetir el toast en cada entrada.
      try{ notifyStaleOnce(); }catch(_){}
    } else {
      err.classList.remove('hidden');
    }
  }

  // v61 — Notificación de equipos estancados NUEVOS (una vez por equipo).
  // Compara los IDs actuales de las listas con los ya notificados.
  function notifyStaleOnce(){
    if(typeof DB === 'undefined' || !DB.staleCompute) return;
    const st = DB.staleCompute();
    const cur = new Set([
      ...st.list30.filter(x=>!(x.r.staleDismissed&&x.r.staleDismissed.s30)).map(x=>x.r.id),
      ...st.listND.filter(x=>!(x.r.staleDismissed&&x.r.staleDismissed.nd)).map(x=>x.r.id)
    ]);
    let seen = [];
    try{ seen = JSON.parse(localStorage.getItem('taller_stale_seen') || '[]'); }catch(_){}
    const seenSet = new Set(seen);
    const fresh = [...cur].filter(id=>!seenSet.has(id));
    if(fresh.length){
      const ndNew = st.listND.filter(x=>!(x.r.staleDismissed&&x.r.staleDismissed.nd)).filter(x=>fresh.includes(x.r.id)).length;
      const s30New = fresh.length - ndNew;
      const parts = [];
      if(s30New>0) parts.push(`${s30New} equipo(s) llevan más de 30 días sin entregarse`);
      if(ndNew>0) parts.push(`${ndNew} equipo(s) pasaron a «sin devolución»`);
      UI.toast('⏱ ' + parts.join(' y ') + ' · míralos en Resumen', 5200);
    }
    try{ localStorage.setItem('taller_stale_seen', JSON.stringify([...cur])); }catch(_){}
  }
  function openForgotFlow(){
    const qs = Auth.getQuestions();
    if(!qs.length){
      UI.toast('No hay preguntas configuradas. Pide ayuda al administrador.');
      return;
    }
    const rows = qs.map((q,i)=>`
      <div class="form-group">
        <label>${UI.escape(q)}</label>
        <input type="text" data-ans="${i}" autocomplete="off">
      </div>`).join('');
    UI.openModal(`
      <h2 style="margin:0 0 6px;font-size:20px">Recuperar contraseña</h2>
      <p class="muted small" style="margin:0 0 12px">Responde las preguntas que configuraste. No distinguen mayúsculas ni acentos.</p>
      <form id="forgotForm">
        ${rows}
        <button type="submit" class="btn-primary">Verificar respuestas</button>
      </form>
    `);
    document.getElementById('forgotForm').addEventListener('submit', async e=>{
      e.preventDefault();
      const answers = Array.from(document.querySelectorAll('[data-ans]')).map(i=>i.value);
      const ok = await Auth.verifyAnswers(answers);
      if(!ok){ UI.toast('Respuestas incorrectas'); return; }
      UI.openModal(`
        <h2 style="margin:0 0 6px;font-size:20px">Nueva contraseña</h2>
        <p class="muted small" style="margin:0 0 12px">Define una nueva contraseña de acceso.</p>
        <form id="newPassForm">
          <div class="form-group"><input type="password" id="np1" placeholder="Nueva contraseña" required></div>
          <div class="form-group"><input type="password" id="np2" placeholder="Repetir contraseña" required></div>
          <button type="submit" class="btn-primary">Guardar contraseña</button>
        </form>
      `);
      document.getElementById('newPassForm').addEventListener('submit', async ev=>{
        ev.preventDefault();
        const a = document.getElementById('np1').value;
        const b = document.getElementById('np2').value;
        if(a.length<3){ UI.toast('Mínimo 3 caracteres'); return; }
        if(a!==b){ UI.toast('No coinciden'); return; }
        await Auth.setPassword(a);
        UI.closeModal();
        UI.toast('Contraseña actualizada. Ya puedes entrar.');
      });
    });
  }
  // v63 — badge de pendientes en la topbar: número de pendientes activos
  // (los hechos no cuentan). Se llama al entrar, al cambiar la lista y tras
  // cada pull que traiga pendings nuevos.
  function updatePendBadge(){
    const el = document.getElementById('pendBadge');
    if(!el) return;
    let n = 0;
    try{ n = (DB.pendings||[]).filter(p=>!p.done).length; }catch(_){}
    if(n>0){ el.hidden = false; el.textContent = n>99?'99+':String(n); }
    else { el.hidden = true; el.textContent = ''; }
  }
  return { init, go, refresh, applyBrand, getPresets, Splash, updatePendBadge,
    // v53 — migrateInitial (IndexedDB) terminó DESPUÉS del init(): los datos
    // reales del disco ya están en RAM. Si el estado de login cambió con
    // ellos (p. ej. requirePassword=false guardado solo en IDB), corregir
    // la pantalla ahora: sin este gancho, quien desactivó la contraseña
    // seguía viendo el login tras recargar.
    onStorageReady(){
      try{
        if(Auth.isLoggedIn() && document.getElementById('app').classList.contains('hidden')){
          applyBrand();
          showApp();
          try{ if(DB.ensurePersistent) DB.ensurePersistent(); }catch(_){}
        }
      }catch(_){}
    }
  };
})();
// v53 — ARRANQUE INMEDIATO: los <script> clásicos al final del body ya tienen
// el DOM disponible (readyState !== 'loading'). No esperamos DOMContentLoaded:
// eso recortaba ~40-80 ms en móviles (parseo JS de ~300 KB + evento posterior).
// El splash inline ya está pintado desde <head>; App.init oculta todo al final.
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
// v53 — exponer App en window (como Auth/GitLog): db.js (cargado antes)
// necesita App.onStorageReady tras terminar migrateInitial, cuando el
// binding léxico global de const aún no existía para él.
window.App = App;

const App = (() => {
  let current = 'dashboard';
  let currentArg = null;

  // SVG logo por defecto: llave + destornillador cruzados
  const BRAND_LOGO_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 50 L36 28" />
    <path d="M12 52 a4 4 0 1 1 5 -5" />
    <path d="M40 24 a8 8 0 1 0 -10 -10 l5 5 -3 3 -5 -5 a8 8 0 0 0 10 10 z" fill="currentColor" fill-opacity=".18"/>
    <path d="M50 14 L30 34" />
    <path d="M52 12 l4 4 -4 4 -4 -4 z" fill="currentColor" fill-opacity=".25"/>
    <path d="M30 34 L26 38 L22 34 L26 30 Z" fill="currentColor" fill-opacity=".25"/>
  </g>
</svg>`.trim();

  const LOGO_PRESETS = [
    { key:'tools', name:'Herramientas', svg: BRAND_LOGO_SVG },
    { key:'gear', name:'Engranaje', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 6v6 M32 52v6 M6 32h6 M52 32h6 M14 14l4 4 M46 46l4 4 M14 50l4-4 M46 18l4-4" />
    <circle cx="32" cy="32" r="14" fill="currentColor" fill-opacity=".15"/>
    <circle cx="32" cy="32" r="5" fill="currentColor"/>
  </g>
</svg>`.trim() },
    { key:'wrench', name:'Llave', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M44 8a12 12 0 0 0-11 16L10 47a4 4 0 0 0 0 6l1 1a4 4 0 0 0 6 0l23-23a12 12 0 0 0 14-15l-7 7-6-1-1-6z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
</svg>`.trim() },
    { key:'circuit', name:'Circuito', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="14" y="14" width="36" height="36" rx="4" fill="currentColor" fill-opacity=".1"/>
    <path d="M22 22h8v8h-8z M34 22h8 M34 30h8 M22 38h20 M22 46h8 M34 46h8"/>
    <circle cx="42" cy="22" r="2.4" fill="currentColor"/>
    <circle cx="42" cy="30" r="2.4" fill="currentColor"/>
    <circle cx="30" cy="46" r="2.4" fill="currentColor"/>
  </g>
</svg>`.trim() },
    { key:'bolt', name:'Energía', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path d="M36 4 L14 36 h12 L22 60 L50 26 H38 z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`.trim() },
    { key:'screwdriver', name:'Destornillador', svg: `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M44 6 L58 20 L40 38 L26 24 z" fill="currentColor" fill-opacity=".22"/>
    <path d="M26 24 L8 42 a4 4 0 0 0 0 6 l8 8 a4 4 0 0 0 6 0 L40 38" />
  </g>
</svg>`.trim() }
  ];


  function logoHtml(){
    const custom = DB.settings.logo;
    if(custom) return `<img src="${custom}" alt="logo">`;
    const key = DB.settings.logoPreset || 'tools';
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
    // logos
    const lh = logoHtml();
    const al = document.getElementById('appLogo');
    const ll = document.getElementById('loginLogo');
    if(al) al.innerHTML = lh;
    if(ll) ll.innerHTML = lh;
    // creator contacts
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
  }
  function go(v, arg, extra){
    current = v; currentArg = arg;
    document.querySelectorAll('.tab').forEach(t=>{
      t.classList.toggle('active', t.dataset.view === v);
    });
    if(v==='dashboard') Views.dashboard();
    else if(v==='repairs') Views.repairsList(arg);
    else if(v==='new') Views.newRepair(extra);
    else if(v==='sales') Views.sales(arg);
    else if(v==='chooser') Views.newChooser();
    else if(v==='search') Views.search();
    else if(v==='admin') Views.admin();
    window.scrollTo(0,0);
  }
  function refresh(){ go(current, currentArg); }

  function init(){
    applyBrand();
    document.getElementById('loginBtn').addEventListener('click', tryLogin);
    document.getElementById('loginPass').addEventListener('keydown', e=>{
      if(e.key==='Enter') tryLogin();
    });
    const fb = document.getElementById('forgotBtn');
    if(fb) fb.addEventListener('click', openForgotFlow);
    document.getElementById('logoutBtn').addEventListener('click', ()=>{
      Auth.logout();
      showLogin();
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
    if(Auth.isLoggedIn()) showApp();
    else {
      if(!DB.settings.passwordHash){
        document.querySelector('#loginScreen .muted').textContent = 'Primer acceso: define tu contraseña';
      }
      showLogin();
    }
  }
  async function tryLogin(){
    const pass = document.getElementById('loginPass').value;
    const err = document.getElementById('loginError');
    if(await Auth.login(pass)){
      err.classList.add('hidden');
      document.getElementById('loginPass').value = '';
      applyBrand();
      showApp();
    } else {
      err.classList.remove('hidden');
    }
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
  return { init, go, refresh, applyBrand, getPresets };
})();
document.addEventListener('DOMContentLoaded', App.init);

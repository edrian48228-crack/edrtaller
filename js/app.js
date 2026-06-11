const App = (() => {
  let current = 'dashboard';
  let currentArg = null;

  // SVG logo: cautín + multímetro estilizado, grueso, sin fondo
  const BRAND_LOGO_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    <!-- Cautín (soldador) -->
    <path d="M9 55 L20 44" />
    <path d="M19 45 L28 36 L36 44 L27 53 Z" fill="currentColor" fill-opacity=".15"/>
    <path d="M35 43 L46 32" />
    <path d="M45 33 L51 27 L55 31 L49 37 Z" fill="currentColor" fill-opacity=".25"/>
    <!-- Punta caliente -->
    <path d="M53 29 L58 24" stroke-width="3.8"/>
    <circle cx="59" cy="23" r="2" fill="currentColor" stroke="none"/>
    <!-- Cable rizado -->
    <path d="M11 49 C 6 49 6 43 11 43 C 16 43 16 37 11 37" stroke-width="2.6"/>
    <!-- Multímetro / destornillador en cruz arriba -->
    <path d="M40 9 L50 9 L50 19 L40 19 Z" />
    <path d="M42 13 H 48" stroke-width="2.4"/>
    <path d="M45 22 L45 27" stroke-width="2.6"/>
  </g>
</svg>`.trim();

  function applyBrand(){
    const name = DB.settings.appName || 'Taller';
    const html = UI.renderBrand(name);
    const app = document.getElementById('appTitle');
    const login = document.getElementById('loginTitle');
    if(app) app.innerHTML = html;
    if(login) login.innerHTML = html;
    document.title = name;
    // logos
    const al = document.getElementById('appLogo');
    const ll = document.getElementById('loginLogo');
    if(al) al.innerHTML = BRAND_LOGO_SVG;
    if(ll) ll.innerHTML = BRAND_LOGO_SVG;
    // creator contacts
    renderCreatorChips();
  }

  function renderCreatorChips(){
    const box = document.getElementById('creatorContacts');
    if(!box) return;
    const c = (DB.settings.creator || {});
    const tel = UI.phoneClean(c.phone);
    const wa = UI.phoneWa(c.whatsapp);
    const ICON_PHONE = '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1l-2.23 2.2z" fill="currentColor"/></svg>';
    const ICON_WA = '<svg viewBox="0 0 32 32"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.7 1.9 6.7L3 29l7-1.8a12.5 12.5 0 0 0 6 1.5c7 0 12.5-5.5 12.5-12.5S23 3 16 3zm6.9 17.5c-.3.8-1.7 1.6-2.4 1.6-.6.1-1.4.1-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.2-5.3-6.4-5.6-.2-.2-1.5-2-1.5-3.9 0-1.8.9-2.7 1.3-3.1.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .8.6.3.7 1 2.5 1.1 2.6.1.2.2.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.5-.5.6-.2.2-.4.4-.2.7.2.3 1 1.6 2.1 2.6 1.5 1.3 2.7 1.7 3 1.9.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.3.7-.2.3.1 2 1 2.4 1.2.4.2.6.3.7.4 0 .1 0 .8-.3 1.6z" fill="currentColor"/></svg>';
    const parts = [];
    if(tel) parts.push(`<a class="creator-chip tel" href="tel:${UI.escape(tel)}" title="Llamar al creador">${ICON_PHONE}<span>Tel</span></a>`);
    if(wa) parts.push(`<a class="creator-chip wa" href="https://wa.me/${UI.escape(wa)}" target="_blank" rel="noopener" title="WhatsApp del creador">${ICON_WA}<span>WhatsApp</span></a>`);
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
    document.getElementById('logoutBtn').addEventListener('click', ()=>{
      Auth.logout();
      showLogin();
    });
    document.getElementById('modalClose').addEventListener('click', UI.closeModal);
    document.getElementById('modal').addEventListener('click', e=>{
      if(e.target.id==='modal') UI.closeModal();
    });
    document.querySelectorAll('.tab').forEach(t=>{
      t.addEventListener('click', ()=> go(t.dataset.view));
    });
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
  return { init, go, refresh, applyBrand };
})();
document.addEventListener('DOMContentLoaded', App.init);

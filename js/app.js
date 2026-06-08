const App = (() => {
  let current = 'dashboard';
  let currentArg = null;

  function applyTitle(){
    document.getElementById('appTitle').textContent = DB.settings.appName;
    document.getElementById('loginTitle').textContent = DB.settings.appName;
    document.title = DB.settings.appName;
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
    applyTitle();
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
      applyTitle();
      showApp();
    } else {
      err.classList.remove('hidden');
    }
  }
  return { init, go, refresh };
})();
document.addEventListener('DOMContentLoaded', App.init);
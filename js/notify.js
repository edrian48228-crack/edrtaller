// ============================================================
// v64 — notify.js — MOTOR DE NOTIFICACIONES DEL TALLER
// Tres canales, con permiso y preferencias por tipo:
//  A) Notificación del sistema (Notification API + Service Worker):
//     tipo push real en el móvil/PC, funciona con la app abierta y,
//     con la PWA instalada, también llega cuando el navegador la
//     re-despierta (evento periodicSync/sw message).
//  B) Mensaje directo (WhatsApp): botón en cada aviso y en el resumen
//     del taller; usa wa.me con el teléfono del cliente.
//  C) Aviso interno (toast + tarjeta en el Resumen) siempre visible
//     aunque el permiso de notificaciones esté denegado.
// Dispara para: equipos PENDIENTES (por recoger/activos), equipos
// >30 días en el taller y equipos SIN DEVOLUCIÓN (>60 días).
// Anti-spam: cada aviso se firma en localStorage y no se repite
// hasta que cambie (más días, otro estado) o pasen 3 días.
// ============================================================
(function(){
  const LS_KEY = 'taller_notified_v1';
  const REPEAT_DAYS = 3;          // re-avisar a los 3 días si sigue igual
  const TYPES = {
    pending:  { title:'Equipos pendientes',  icon:'🔔' },
    d30:      { title:'Equipo más de 30 días', icon:'⏰' },
    nodev:    { title:'Equipo sin devolución', icon:'🚨' }
  };

  function state(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); }
    catch(_){ return {}; }
  }
  function saveState(s){ try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); }catch(_){} }
  function sig(item){ return item.days + '|' + (item.r.status||'') + '|' + (item.r.id||''); }
  function shouldFire(item, which){
    const s = state();
    const k = which + ':' + item.r.id;
    const prev = s[k];
    if(!prev) return true;
    if(prev.sig !== sig(item)) return true;             // cambió (más días)
    if(Date.now() - prev.at > REPEAT_DAYS*86400000) return true; // re-aviso
    return false;
  }
  function markFired(item, which){
    const s = state();
    s[which + ':' + item.r.id] = { at: Date.now(), sig: sig(item) };
    // limpieza: entradas de reparaciones ya inexistentes
    const ids = new Set(DB.repairs.map(r=>r.id));
    for(const k of Object.keys(s)) if(!ids.has(k.slice(k.indexOf(':')+1))) delete s[k];
    saveState(s);
  }

  // ---------- Canal A: Notification API ----------
  function perm(){ 
    try{ return (typeof Notification !== 'undefined') ? Notification.permission : 'unsupported'; 
    }catch(_){ return 'unsupported'; }
  }
  async function askPermission(){
    if(perm() === 'default'){
      try{ await Notification.requestPermission(); }catch(_){}
    }
    return perm();
  }
  async function systemNotify(title, body, tag){
    const p = perm();
    if(p !== 'granted') return false;
    try{
      // vía Service Worker (móviles) con fallback directo (desktop)
      if('serviceWorker' in navigator && navigator.serviceWorker.controller){
        navigator.serviceWorker.controller.postMessage({ type:'NOTIFY', title, body, tag });
        return true;
      }
      new Notification(title, { body, tag, icon:'icons/icon-192.png', badge:'icons/icon-96.png' });
      return true;
    }catch(_){
      try{ new Notification(title, { body, tag }); return true; }catch(e){ return false; }
    }
  }

  // ---------- Canal B: WhatsApp ----------
  function waLink(phone, text){
    const raw = String(phone||'').replace(/[^\d+]/g,'');
    const digits = raw.replace(/\D/g,'');
    // WhatsApp exige código de país: si el número viene corto (local),
    // se asume Cuba (+53) como los enlaces del taller ya lo hacen.
    const full = (digits.length <= 8) ? ('53' + digits) : digits;
    return 'https://wa.me/' + full + '?text=' + encodeURIComponent(text);
  }
  function messageFor(item, which){
    const r = item.r;
    const who = r.clientName || 'cliente';
    const dev = [r.device, r.brand, r.model].filter(Boolean).join(' ') || 'equipo';
    const id = r.id;
    if(which === 'pending'){
      return `Hola ${who}, su ${dev} (orden ${id}) está pendiente en el taller. Le avisamos para que esté al tanto. Saludos.`;
    }
    if(which === 'd30'){
      return `Hola ${who}, su ${dev} (orden ${id}) lleva más de ${item.days} días en nuestro taller. Le invitamos a pasar por él para coordinar la entrega. Saludos.`;
    }
    return `Hola ${who}, su ${dev} (orden ${id}) lleva más de ${item.days} días en el taller sin haber sido recogido. Por favor coordine con nosotros para su entrega o disposición. Saludos.`;
  }
  function notifyWa(item, which){
    const phones = (r2 => ((r2.clientPhones||[]).filter(Boolean).length ? r2.clientPhones.filter(Boolean) : (r2.clientPhone ? [r2.clientPhone] : [])))(item.r);
    if(!phones.length){ UI.toast('Este cliente no tiene teléfono guardado'); return; }
    const url = waLink(phones[0], messageFor(item, which));
    window.open(url, '_blank');
  }

  // ---------- Motor: calcula y dispara ----------
  // Devuelve { pending:[{r,days}], d30:[…], nodev:[…], fired:bool }
  function scan(){
    const st = (DB.staleCompute ? DB.staleCompute() : { list30:[], listND:[], fee30:[] });
    const out = {
      pending: [], d30: st.list30 || [], nodev: st.listND || []
    };
    // Equipos pendientes: activos sin entregar (pendiente/en proceso/completada)
    for(const r of DB.repairs){
      if(r.status==='pending' || r.status==='in_progress' || r.status==='completed'){
        const days = Math.floor((Date.now()-(r.createdAt||Date.now()))/86400000);
        out.pending.push({ r, days });
      }
    }
    return out;
  }

  let lastScan = null;
  function fire(opts){
    const o = opts || {};
    if(!DB || !DB.repairs) return Promise.resolve(null);
    const out = scan();
    lastScan = out;
    let firedCount = 0;
    // respetar descartes manuales del Resumen (staleDismissed)
    const dismissed = (x, w)=> !!(x.r.staleDismissed && x.r.staleDismissed[w]);
    const fireOne = (item, which)=>{
      const t = TYPES[which];
      const who = item.r.clientName || 'cliente';
      const dev = [item.r.device, item.r.brand, item.r.model].filter(Boolean).join(' ') || 'equipo';
      const body = `${t.icon} ${who} · ${dev} · ${item.days} día(s)`;
      markFired(item, which);
      firedCount++;
      // A) sistema
      if(o.system !== false) systemNotify(t.title, body, 'taller-'+which);
      return { which, item, title: t.title, body, wa: !!((item.r.clientPhones||[]).filter(Boolean).length || item.r.clientPhone) };
    };
    const fired = [];
    for(const item of out.nodev) if(!dismissed(item,'nd') && shouldFire(item,'nodev')) fired.push(fireOne(item,'nodev'));
    for(const item of out.d30)   if(!dismissed(item,'s30') && shouldFire(item,'d30'))   fired.push(fireOne(item,'d30'));
    if(fired.length && o.toast !== false){
      UI.toast(`🔔 ${fired.length} aviso(s) de equipos sin recoger`, 2600);
    }
    return Promise.resolve({ ...out, fired, firedCount });
  }

  // ---------- Permisos + preferencias ----------
  function prefs(){
    try{ return JSON.parse(localStorage.getItem('taller_notify_prefs')||'{"system":true,"pendBadge":true}'); }
    catch(_){ return { system:true, pendBadge:true }; }
  }
  function savePrefs(p){ try{ localStorage.setItem('taller_notify_prefs', JSON.stringify(p)); }catch(_){} }

  // ---------- API pública ----------
  window.Notify = {
    perm, askPermission, systemNotify,
    fire, scan, waLink, messageFor, notifyWa, prefs, savePrefs,
    lastResult: ()=> lastScan
  };
})();

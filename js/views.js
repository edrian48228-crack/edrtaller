const Views = (() => {
  const { escape, fmtDate, fmtDateTime, fmtDateInput, statusLabel } = UI;
  const view = () => document.getElementById('view');

  const ICONS = {
    device: '<svg viewBox="0 0 24 24" class="ico"><path d="M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm-5 21a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5-4H7V4h10v14z"/></svg>',
    person: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.7-8 6v2h16v-2c0-3.3-3.6-6-8-6z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h5v-2h-4V6h-2v7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    box: '<svg viewBox="0 0 24 24" class="ico"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8zm-9 12l-7-4V9.5l7 3.9 7-3.9V16l-7 4z"/></svg>',
    search: '<svg viewBox="0 0 24 24" class="ico"><path d="M21 20l-5.6-5.6a8 8 0 1 0-1.4 1.4L19.6 21.4 21 20zM4 10a6 6 0 1 1 12 0 6 6 0 0 1-12 0z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 3l-2 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3l-2-2H9zm3 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 17.2V21h3.8L17.8 9.9l-3.8-3.8L3 17.2zM20.7 7.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L15 4.9l3.8 3.8 1.9-1.4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 6h12v12H6z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" class="ico"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" class="ico"><path d="M19 18H6a4 4 0 0 1-.5-7.97A6 6 0 0 1 17 9a4 4 0 0 1 2 9z"/></svg>',
    save: '<svg viewBox="0 0 24 24" class="ico"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" class="ico"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1l-2.23 2.2z"/></svg>',
    wa: '<svg viewBox="0 0 32 32" class="ico"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.7 1.9 6.7L3 29l7-1.8a12.5 12.5 0 0 0 6 1.5c7 0 12.5-5.5 12.5-12.5S23 3 16 3zm6.9 17.5c-.3.8-1.7 1.6-2.4 1.6-.6.1-1.4.1-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.2-5.3-6.4-5.6-.2-.2-1.5-2-1.5-3.9 0-1.8.9-2.7 1.3-3.1.3-.3.7-.4 1-.4h.7c.2 0 .5 0 .8.6.3.7 1 2.5 1.1 2.6.1.2.2.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.5-.5.6-.2.2-.4.4-.2.7.2.3 1 1.6 2.1 2.6 1.5 1.3 2.7 1.7 3 1.9.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.3.7-.2.3.1 2 1 2.4 1.2.4.2.6.3.7.4 0 .1 0 .8-.3 1.6z"/></svg>',
    sms: '<svg viewBox="0 0 24 24" class="ico"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>',
    upload: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 16V10H5l7-7 7 7h-4v6H9zm-4 4v-2h14v2H5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" class="ico"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    cancel: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 14.6L16.6 18 12 13.4 7.4 18 6 16.6 10.6 12 6 7.4 7.4 6 12 10.6 16.6 6 18 7.4 13.4 12 18 16.6z"/></svg>',
    print: '<svg viewBox="0 0 24 24" class="ico"><path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 3H6v4h12V3z"/></svg>',
    duplicate: '<svg viewBox="0 0 24 24" class="ico dup-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };

  const STATUS_KEYS = ['pending','in_progress','completed','delivered','cancelled','no_devolution'];
  const FILTERS = [
    {k:'all',label:'Todas'},
    {k:'pending',label:'Pendientes'},
    {k:'in_progress',label:'En proceso'},
    {k:'completed',label:'Completadas'},
    {k:'delivered',label:'Entregadas'},
    {k:'cancelled',label:'Canceladas'},
    {k:'no_devolution',label:'Sin devolución'}
  ];

  function emptyState(t,s){
    return `<div class="empty">${ICONS.box.replace('class="ico"','class="ico lg"')}<h3>${escape(t)}</h3><p>${escape(s)}</p></div>`;
  }

  // Cabecera con líneas (reutilizable para listas y formulario)
  function sectionDivider(label, count){
    const c = count!=null ? `<span class="dg-count">${count}</span>` : '';
    return `<div class="group-divider">
      <span class="dg-line"></span>
      <span class="dg-label">${escape(label)}</span>
      ${c}
      <span class="dg-line right"></span>
    </div>`;
  }

  function repairCard(r){
    // Foto del cliente como thumb (no la del equipo)
    const cover = r.clientPhoto;
    const thumb = cover ? `<img src="${cover}" alt="">` : ICONS.person;
    const phones = (r.clientPhones && r.clientPhones.length)
      ? r.clientPhones.filter(Boolean)
      : (r.clientPhone ? [r.clientPhone] : []);
    let phoneHtml = '';
    if(phones.length){
      if(phones.length === 1){
        const tel = UI.phoneClean(phones[0]);
        const sms = UI.phoneSms(phones[0]);
        phoneHtml = `<div class="card-phones">
          <a class="mini-action call" href="tel:${escape(tel)}" data-stop="1">${ICONS.phone}<span>${escape(phones[0])}</span></a>
          <a class="mini-action sms" href="sms:${escape(sms)}" data-stop="1">${ICONS.sms}<span>SMS</span></a>
        </div>`;
      } else {
        phoneHtml = `<div class="card-phones">
          <button class="mini-action call" data-pick-phone="${escape(r.id)}" data-stop="1">${ICONS.phone}<span>${phones.length} teléfonos</span></button>
        </div>`;
      }
    }
    // v68 — botón DUPLICAR en cada tarjeta de la lista: duplicar
    // CUALQUIER reparación directamente desde ahí (mismo flujo con
    // confirmación + selección de datos a vaciar que el detalle).
    // Icono NUEVO: dos hojas superpuestas (símbolo universal de «copia»),
    // reemplaza al «+» genérico que apenas se distinguía de los demás.
    const dupBtn = `<button class="mini-action dup" data-dup-id="${escape(r.id)}" data-stop="1" title="Duplicar reparación (${escape(r.id)})" aria-label="Duplicar reparación"><span class="dup-ico">${ICONS.duplicate}</span><span>Copiar</span></button>`;
    const delBtn = `<button class="mini-action delete" data-del-id="${escape(r.id)}" data-stop="1" title="Eliminar reparación" aria-label="Eliminar">${ICONS.trash}</button>`;
    const inner = phoneHtml ? phoneHtml.replace(/^<div class="card-phones">/,'').replace(/<\/div>\s*$/,'') : '';
    const actionsRow = `<div class="card-phones bottom-row">${inner}${dupBtn}${delBtn}</div>`;
    return `
      <div class="repair-card" data-id="${r.id}">
        <div class="thumb">${thumb}</div>
        <div class="repair-info">
          <h3>${escape(r.clientName||'Cliente')}</h3>
          <p>${escape(r.device||'Equipo')}${r.brand?' · '+escape(r.brand):''} · ${escape(r.id)}</p>
          <span class="status ${r.status}">${statusLabel(r.status)}</span>
          ${actionsRow}
        </div>
      </div>`;
  }
  function bindRepairCards(){
    view().querySelectorAll('.repair-card').forEach(c=>{
      c.addEventListener('click', e=>{
        // No abrir detalle si se pulsó un botón de teléfono o eliminar
        if(e.target.closest('[data-stop]')) return;
        showRepair(c.dataset.id);
      });
    });
    view().querySelectorAll('[data-pick-phone]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.preventDefault(); e.stopPropagation();
        openPhonePicker(b.dataset.pickPhone);
      });
    });
    // v64 — duplicar CUALQUIER reparación desde su tarjeta de la lista
    view().querySelectorAll('[data-dup-id]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.preventDefault(); e.stopPropagation();
        duplicateRepairDialog(b.dataset.dupId);
      });
    });
    view().querySelectorAll('[data-del-id]').forEach(b=>{
      b.addEventListener('click', async e=>{
        e.preventDefault(); e.stopPropagation();
        const id = b.dataset.delId;
        const r = DB.findRepair(id);
        // v64 — el ID de una copia duplicada no se puede eliminar
        if(r && r.duplicatedFrom){
          UI.toast('🔒 El ID '+id+' es una copia generada por duplicación y no se puede eliminar. Puedes vaciar sus datos editándola.');
          return;
        }
        const ok = await UI.confirmDialog({
          title:'Eliminar reparación',
          message:`¿Eliminar definitivamente la reparación ${id}${r&&r.clientName?' de '+r.clientName:''}? Esta acción no se puede deshacer.`,
          okText:'Eliminar', cancelText:'Cancelar', danger:true
        });
        if(!ok) return;
        DB.deleteRepair(id);
        UI.toast('Reparación eliminada');
        App.refresh();
      });
    });
  }

  function openPhonePicker(id){
    const r = DB.findRepair(id); if(!r) return;
    const phones = (r.clientPhones||[]).filter(Boolean);
    const rows = phones.map(p=>{
      const tel = UI.phoneClean(p); const sms = UI.phoneSms(p);
      return `<div class="pp-row">
        <span class="pp-num">${escape(p)}</span>
        <div class="pp-actions">
          <a class="call" href="tel:${escape(tel)}" title="Llamar">${ICONS.phone}</a>
          <a class="sms" href="sms:${escape(sms)}" title="SMS">${ICONS.sms}</a>
        </div>
      </div>`;
    }).join('');
    UI.openModal(`<h2 style="margin:0 0 4px;font-size:18px">${escape(r.clientName||'Cliente')}</h2>
      <p class="muted small" style="margin:0 0 8px">Elige un número para llamar o enviar SMS.</p>
      <div class="phone-picker">${rows}</div>`);
  }

  function groupByDate(list){
    const now = new Date();
    const today0 = new Date(now); today0.setHours(0,0,0,0);
    const yest0 = new Date(today0); yest0.setDate(yest0.getDate()-1);
    const wd = (today0.getDay()+6)%7;
    const week0 = new Date(today0); week0.setDate(week0.getDate()-wd);
    const month0 = new Date(today0.getFullYear(), today0.getMonth(), 1);
    const lastMonth0 = new Date(today0.getFullYear(), today0.getMonth()-1, 1);
    const year0 = new Date(today0.getFullYear(), 0, 1);

    const groups = [
      {key:'today', label:'Hoy', items:[]},
      {key:'yest', label:'Ayer', items:[]},
      {key:'week', label:'Esta semana', items:[]},
      {key:'month', label:'Este mes', items:[]},
      {key:'lmonth', label:'Mes pasado', items:[]},
      {key:'year', label:'Este año', items:[]},
      {key:'old', label:'Años anteriores', items:[]}
    ];
    for(const r of list){
      const t = r.createdAt || 0;
      if(t >= today0.getTime()) groups[0].items.push(r);
      else if(t >= yest0.getTime()) groups[1].items.push(r);
      else if(t >= week0.getTime()) groups[2].items.push(r);
      else if(t >= month0.getTime()) groups[3].items.push(r);
      else if(t >= lastMonth0.getTime()) groups[4].items.push(r);
      else if(t >= year0.getTime()) groups[5].items.push(r);
      else groups[6].items.push(r);
    }
    return groups.filter(g=>g.items.length);
  }

  // ============= DASHBOARD =============
  // Opciones de ordenación reutilizables (dashboard, lista y búsqueda)
  const SORT_OPTIONS = [
    {k:'recent',     label:'Más recientes',     fn:(a,b)=>(b.createdAt||0)-(a.createdAt||0)},
    {k:'oldest',     label:'Más antiguas',      fn:(a,b)=>(a.createdAt||0)-(b.createdAt||0)},
    {k:'dueSoon',    label:'Entrega próxima',   fn:(a,b)=>(a.dueDate||Infinity)-(b.dueDate||Infinity)},
    {k:'id',         label:'Identificación (ID)', fn:(a,b)=>String(a.id).localeCompare(String(b.id),'es')},
    {k:'client',     label:'Cliente (A‑Z)',     fn:(a,b)=>String(a.clientName||'').localeCompare(String(b.clientName||''),'es')},
    {k:'device',     label:'Equipo (A‑Z)',      fn:(a,b)=>String(a.device||'').localeCompare(String(b.device||''),'es')},
    {k:'identity',   label:'Nº de identidad',   fn:(a,b)=>String(a.clientIdNumber||'').localeCompare(String(b.clientIdNumber||''),'es')}
  ];
  function applySort(list, sortKey){
    const opt = SORT_OPTIONS.find(o=>o.k===sortKey) || SORT_OPTIONS[0];
    return list.slice().sort(opt.fn);
  }
  function sortSelectHtml(id, current){
    const opts = SORT_OPTIONS.map(o=>`<option value="${o.k}" ${o.k===current?'selected':''}>Ordenar: ${escape(o.label)}</option>`).join('');
    return `<div class="select-elegant"><select id="${id}" aria-label="Ordenar">${opts}</select></div>`;
  }

  function dashboard(){
    const repairs = DB.repairs;
    const pending = DB.byStatus('pending').length;
    const inProgress = DB.byStatus('in_progress').length;
    const completed = DB.byStatus('completed').length;
    const delivered = DB.byStatus('delivered').length;
    const cancelled = DB.byStatus('cancelled').length;
    const noDev = DB.byStatus('no_devolution').length;
    // v61 — equipos estancados (regla del taller) para el aviso del Inicio:
    const staleNow = DB.staleCompute();
    const stale30 = staleNow.list30.filter(x=>!(x.r.staleDismissed&&x.r.staleDismissed.s30)).length;
    const staleND = staleNow.listND.filter(x=>!(x.r.staleDismissed&&x.r.staleDismissed.nd)).length;
    const staleFeeN = staleNow.fee30.length;
    const todayPending = DB.todayPending().length;
    const sortKey = Views._dashSort || 'recent';
    const recent = applySort(repairs, sortKey).slice(0,5);

    view().innerHTML = `
      <div class="greeting">Bienvenido al <span>${escape(DB.settings.appName)}</span></div>
      <div class="dash-counter" style="margin:-6px 4px 14px">
        <span class="dash-counter-lbl">Reparaciones registradas en el sistema</span>
        <span class="dash-counter-num">${repairs.length}</span>
      </div>
      ${(stale30+staleND+staleFeeN)>0 ? `
        <div class="admin-card" style="border-left:3px solid #e05555;background:linear-gradient(90deg,rgba(224,85,85,.1),var(--surface))">
          <div class="row-between"><div>
            <h3>⏱ Equipos demorados en el taller</h3>
            <p>${staleFeeN>0?`<b>${staleFeeN}</b> con recargo acumulándose ($ 100/día tras 15 días en Completada). `:''}${stale30>0?`<b>${stale30}</b> llevan <b>más de 30 días</b> sin entregarse. `:''}${staleND>0?`<b>${staleND}</b> pasaron a <b>sin devolución</b> (60 días). `:''}Ábrelos en <b>Resumen</b> para ver todos los datos.</p>
          </div>${ICONS.clock}</div>
        </div>` : ''}
      ${window.__v57_movedCompleted ? `
        <div class="admin-card" style="border-left:3px solid var(--gold-glow);background:linear-gradient(90deg,rgba(232,196,106,.08),var(--surface))">
          <div class="row-between"><div>
            <h3>Estados corregidos automáticamente</h3>
            <p><b>${window.__v57_movedCompleted}</b> reparación(es) que estaban en <b>Completada</b> (equipo ya entregado pero sin foto de firma) pasaron a <b>Entregadas</b> y ya se cuentan en la ganancia del Resumen. La garantía arranca desde su última actualización.</p>
          </div>${ICONS.check}</div>
        </div>` : ''}
      ${todayPending>0 ? `
        <div class="admin-card" style="border-left:3px solid #ff7b6b;background:linear-gradient(90deg,rgba(255,123,107,.1),var(--surface))">
          <div class="row-between"><div>
            <h3>Reparaciones para hoy</h3>
            <p>Tienes <b>${todayPending}</b> reparación(es) con entrega para hoy o vencidas</p>
          </div>${ICONS.clock}</div>
        </div>` : ''}
      <div class="stats-grid three">
        <div class="stat-card pending" data-go="repairs:pending" title="Sin empezar">${ICONS.clock}<div class="stat-num">${pending}</div><div class="stat-lbl">Pendientes</div></div>
        <div class="stat-card inprogress" data-go="repairs:in_progress" title="En proceso de reparación">${ICONS.edit}<div class="stat-num">${inProgress}</div><div class="stat-lbl">En proceso</div></div>
        <div class="stat-card success" data-go="repairs:completed" title="Listas para entregar">${ICONS.check}<div class="stat-num">${completed}</div><div class="stat-lbl">Completadas</div></div>
        <div class="stat-card delivered" data-go="repairs:delivered" title="Entregadas al cliente">${ICONS.box}<div class="stat-num">${delivered}</div><div class="stat-lbl">Entregadas</div></div>
        <div class="stat-card cancelled" data-go="repairs:cancelled" title="Reparaciones canceladas">${ICONS.cancel}<div class="stat-num">${cancelled}</div><div class="stat-lbl">Canceladas</div></div>
        ${noDev>0 || stale30>0 ? `
        <div class="stat-card cancelled" data-go="summary" title="Equipos completados más de 30 días sin recoger (ver Resumen)">${ICONS.clock}<div class="stat-num">${stale30}</div><div class="stat-lbl">+30 días taller</div></div>
        <div class="stat-card cancelled" data-go="summary" title="Equipos completados sin devolución por el cliente (ver Resumen)">${ICONS.box}<div class="stat-num">${noDev}</div><div class="stat-lbl">Sin devolución</div></div>` : ''}
      </div>
      ${sectionDivider('Recientes', recent.length||0)}
      ${sortSelectHtml('dashSort', sortKey)}
      ${recent.length ? recent.map(repairCard).join('') : emptyState('Aún no hay reparaciones','Pulsa el botón + para registrar la primera')}
    `;
    view().querySelectorAll('[data-go]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const [v, f] = el.dataset.go.split(':'); App.go(v, f);
      });
    });
    const ds = document.getElementById('dashSort');
    if(ds) ds.addEventListener('change', e=>{ Views._dashSort = e.target.value; dashboard(); });
    bindRepairCards();
  }

  // ============= LISTA =============
  function repairsList(filter){
    let list = DB.repairs;
    const active = filter || 'all';
    if(active!=='all') list = list.filter(r=>r.status===active);

    const sortKey = Views._listSort || 'recent';
    list = applySort(list, sortKey);

    const groups = groupByDate(list);
    const grouped = groups.map(g=>`
      ${sectionDivider(g.label, g.items.length)}
      ${g.items.map(repairCard).join('')}
    `).join('');

    const opts = FILTERS.map(f=>`<option value="${f.k}" ${f.k===active?'selected':''}>${f.label}</option>`).join('');

    const totalAll = DB.repairs.length;
    // v65 — filtro «Entregadas»: banda con el DINERO COBRADO entre todas
    // las reparaciones entregadas (encima de la lista, como pide el taller):
    // suma el precio de cada entregada + los recargos ya cobrados.
    let deliveredBanner = '';
    if(active === 'delivered'){
      const allDelivered = DB.repairs.filter(r=>r.status==='delivered');
      const money = allDelivered.reduce((acc,r)=> acc + Number(r.price||0) + Number(r.lateFeeCharged||0), 0);
      const avg = allDelivered.length ? money/allDelivered.length : 0;
      deliveredBanner = `
        <div class="delivered-money-banner">
          <span class="dmb-icon">${ICONS.box}</span>
          <div class="dmb-txt">
            <span class="dmb-title">Dinero cobrado · Entregadas</span>
            <span class="dmb-amount">$ ${money.toFixed(2)}</span>
            <span class="dmb-sub">${allDelivered.length} reparación(es) entregada(s) · promedio $ ${avg.toFixed(2)}</span>
          </div>
        </div>`;
    }
    const banner = `<div class="repairs-total-banner">
      <span>Reparaciones totales <b>${totalAll}</b></span>
      <span class="rtb-mini">
        <span>Mostradas<b>${list.length}</b></span>
        <span>Filtro<b>${escape((FILTERS.find(f=>f.k===active)||{label:'Todas'}).label)}</b></span>
      </span>
    </div>`;
    view().innerHTML = `
      ${banner}
      ${deliveredBanner}
      <div class="filter-bar">
        <div class="select-elegant">
          <select id="repairsFilter" aria-label="Filtrar reparaciones">${opts}</select>
        </div>
        ${sortSelectHtml('repairsSort', sortKey)}
      </div>
      ${list.length ? grouped : emptyState('Sin reparaciones','No hay registros en esta categoría')}
    `;
    document.getElementById('repairsFilter').addEventListener('change', e=> repairsList(e.target.value));
    document.getElementById('repairsSort').addEventListener('change', e=>{
      Views._listSort = e.target.value; repairsList(active);
    });
    bindRepairCards();
  }


  // ============= NUEVA / EDITAR =============
  function naWrap(fieldKey, label, inputHtml, naFields){
    const isNa = naFields.includes(fieldKey);
    return `<div class="form-group na-group ${isNa?'is-na':''}" data-na-group="${fieldKey}">
      <div class="label-row">
        <label>${label}</label>
        <button type="button" class="na-pill" data-na="${fieldKey}" aria-pressed="${isNa?'true':'false'}">
          <span class="dot"></span><span class="txt">${isNa?'Sin datos':'Marcar sin datos'}</span>
        </button>
      </div>
      <div class="na-input">${inputHtml}</div>
      <div class="na-placeholder">Sin datos asignados</div>
    </div>`;
  }

  function newRepair(existing){
    const DRAFT_KEY = 'taller_repair_draft_v1';
    let r = existing || {};
    if(!existing){
      try{
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
        if(draft && draft.savedAt && (Date.now() - draft.savedAt) < 7*86400000){
          r = draft.data || {};
        }
      }catch(_){}
    }
    // === Guardar progreso ante "atrás" del navegador / Android ===
    // Empuja un estado falso para capturar la primera "atrás" y preguntar.
    try{
      if(!window.__formGuardActive){
        window.__formGuardActive = true;
        history.pushState({ formGuard:true, at: Date.now() }, '');
        const handler = async (ev)=>{
          if(window.__formGuardActive){
            window.__formGuardActive = false;
            window.removeEventListener('popstate', handler);
            window.removeEventListener('beforeunload', beforeUnload);
            const ok = await UI.confirmDialog({
              title:'¿Salir sin guardar?',
              message:'Tienes una reparación a medio capturar. Si sales perderás los datos no guardados. ¿Seguro que quieres salir?',
              okText:'Sí, salir', cancelText:'Seguir editando', danger:true
            });
            if(ok){
              App.go(existing ? 'repairs' : 'dashboard');
            } else {
              // Re-empujar estado para mantener el guardia
              window.__formGuardActive = true;
              history.pushState({ formGuard:true, at: Date.now() }, '');
              window.addEventListener('popstate', handler);
              window.addEventListener('beforeunload', beforeUnload);
            }
          }
        };
        const beforeUnload = (e)=>{ e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('popstate', handler);
        window.addEventListener('beforeunload', beforeUnload);
        // Limpieza cuando el form se submitee o cierre limpiamente.
        // NO llamamos history.back() aquí: si el formulario era la primera
        // entrada del historial (PWA / pestaña recién abierta), un back()
        // saca al usuario de la app. La entrada extra del guard es inocua.
        window.__formGuardCleanup = ()=>{
          window.__formGuardActive = false;
          window.removeEventListener('popstate', handler);
          window.removeEventListener('beforeunload', beforeUnload);
        };
      }
    }catch(e){ console.warn('form guard fail', e); }

    const photos = { device: (r.devicePhotos||[]).slice(), client: Array.isArray(r.clientPhotos) ? r.clientPhotos.slice() : (r.clientPhoto ? [r.clientPhoto] : []) };
    let acceptAudio = r.acceptAudio || null;
    const naFields = (r.naFields||[]).slice();
    const parts = (r.parts||[]).map(p=>({ name:p.name||'', qty:p.qty||1, unitCost:p.unitCost!=null?p.unitCost:'' }));
    const phones = (r.clientPhones && r.clientPhones.length)
      ? r.clientPhones.slice()
      : (r.clientPhone ? [r.clientPhone] : ['']);
    if(!phones.length) phones.push('');

    const deviceOptions = DB.settings.deviceTypes.map(d=>`<option value="${escape(d)}">`).join('');

    view().innerHTML = `
      <button type="button" class="form-close" id="formCloseTop" title="Cerrar">${ICONS.close}</button>

      <h2 style="margin:0 0 16px;font-size:20px;padding-right:50px">${existing?'Editar reparación':'Nueva reparación'}</h2>
      <form id="repairForm" novalidate>

        ${sectionDivider('Cliente')}
        <div class="form-group">
          <label>Nombre del cliente *</label>
          <input name="clientName" id="clientNameInput" required autocapitalize="words" value="${escape(r.clientName||'')}">
        </div>
        <div class="form-group">
          <label>Foto(s) del cliente <span class="muted small" id="clientPhotoCount"></span></label>
          <p class="muted xsmall" style="margin:0 0 8px">Puedes añadir varias: foto del cliente y carné de identidad por delante y por detrás.</p>
          <div id="clientPhotoWrap" class="client-photo-wrap"></div>
          <div class="photo-add-row" id="clientPhotoAdd">
            <label class="photo-add-btn cam">
              ${ICONS.camera}<span>Tomar foto</span>
              <input type="file" accept="image/*" capture="user" id="clientPhotoCam">
            </label>
            <label class="photo-add-btn gal">
              ${ICONS.upload}<span>Galería (varias)</span>
              <input type="file" accept="image/*" multiple id="clientPhotoInput">
            </label>
          </div>
          <div class="client-audio-inline" id="audioBox" style="margin-top:14px"></div>
        </div>

        <div class="form-group na-group ${naFields.includes('clientPhones')?'is-na':''}" data-na-group="clientPhones">
          <div class="label-row">
            <label>Teléfonos</label>
            <button type="button" class="na-pill" data-na="clientPhones" aria-pressed="${naFields.includes('clientPhones')?'true':'false'}">
              <span class="dot"></span><span class="txt">${naFields.includes('clientPhones')?'Sin datos':'Marcar sin datos'}</span>
            </button>
          </div>
          <div class="na-input">
            <div id="phonesList" class="phones-list"></div>
            <button type="button" class="btn-secondary btn-inline" id="addPhoneBtn">${ICONS.plus} Añadir otro número</button>
          </div>
          <div class="na-placeholder">Sin datos asignados</div>
        </div>

        ${naWrap('clientAddress','Dirección',`<textarea name="clientAddress" rows="2">${escape(r.clientAddress||'')}</textarea>`,naFields)}
        ${naWrap('clientIdNumber','Nº de identidad',`<input name="clientIdNumber" value="${escape(r.clientIdNumber||'')}">`,naFields)}

        ${sectionDivider('Equipo')}
        <div class="form-group">
          <label>Equipo *</label>
          <input name="device" list="deviceTypesList" required placeholder="Selecciona o escribe" value="${escape(r.device||'')}">
          <datalist id="deviceTypesList">${deviceOptions}</datalist>
        </div>
        ${naWrap('brand','Marca',`<input name="brand" value="${escape(r.brand||'')}">`,naFields)}
        ${naWrap('model','Modelo',`<input name="model" value="${escape(r.model||'')}">`,naFields)}
        ${naWrap('serial','Nº de serie',`<input name="serial" value="${escape(r.serial||'')}">`,naFields)}

        <div class="form-group">
          <label>Fotos del equipo</label>
          <div id="devicePhotos" class="multi-photo-grid"></div>
          <div class="photo-add-row">
            <label class="photo-add-btn cam">
              ${ICONS.camera}<span>Tomar foto</span>
              <input type="file" accept="image/*" capture="environment" id="addDevicePhotoCam">
            </label>
            <label class="photo-add-btn gal">
              ${ICONS.upload}<span>Galería</span>
              <input type="file" accept="image/*" id="addDevicePhoto" multiple>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>Falla reportada *</label>
          <textarea name="issue" required>${escape(r.issue||'')}</textarea>
        </div>

        ${sectionDivider('Detalles')}
        <div class="form-row">
          <div class="form-group">
            <label>Estado</label>
            <div class="select-elegant">
              <select name="status">
                ${STATUS_KEYS.filter(s=> !(s==='delivered' && !existing)).map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label>Fecha de entrada</label><input name="createdAt" id="createdAtInput" type="date" value="${fmtDateInput(r.createdAt || Date.now())}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Fecha de entrega</label><input name="dueDate" id="dueDateInput" type="date" value="${fmtDateInput(r.dueDate)}"></div>
          <div class="form-group">
            <label>Garantía (días desde la entrega)</label>
            <input name="warrantyDays" id="warrantyDaysInput" type="number" min="0" step="1" inputmode="numeric"
              placeholder="Ej: 7" value="${r.warrantyDays!=null?r.warrantyDays:(existing?'':(DB.settings.defaultWarrantyDays||''))}">
          </div>
        </div>
        <p class="muted small" id="warrantyHint" style="margin:-4px 2px 10px">La garantía comienza el día que marques el equipo como <b>Entregado</b>.</p>
        ${naWrap('price','Precio',`<input name="price" type="number" step="0.01" inputmode="decimal" value="${r.price!=null?r.price:''}">`,naFields)}
        ${naWrap('deposit','Anticipo',`<input name="deposit" type="number" step="0.01" inputmode="decimal" value="${r.deposit!=null?r.deposit:''}">`,naFields)}
        ${naWrap('notes','Notas',`<textarea name="notes">${escape(r.notes||'')}</textarea>`,naFields)}

        ${sectionDivider('Piezas a sustituir')}
        <p class="muted small" style="margin:-4px 2px 10px">Selecciona la pieza que cambiaste (puerto, mica, batería, etc.). Solo aparecen las piezas que has <b>comprado</b> en <b>Compra/Venta</b>. El costo unitario se toma automáticamente de tus compras. Si no cambiaste ninguna pieza, deja la lista vacía.</p>
        <p class="muted xsmall" style="margin:-6px 2px 10px">Quitar una pieza aquí <b>solo la saca de esta reparación</b>: la compra y el inventario de <b>Compra/Venta</b> no se tocan.</p>
        <div id="partsList" class="parts-list"></div>
        <button type="button" class="btn-secondary btn-inline" id="addPartBtn">${ICONS.plus} Añadir pieza</button>
        <div id="partsNoStock" class="muted small" style="margin-top:8px"></div>
        <div id="partsSummary" class="parts-summary hidden"></div>



        <button type="submit" class="btn-primary" style="margin-top:8px">${existing?'Guardar cambios':'Registrar reparación'}</button>
        <button type="button" class="btn-primary btn-cancel" id="cancelRepairBtn" style="margin-top:10px">
          ${ICONS.cancel} Cancelar reparación
        </button>
      </form>
    `;

    // Cerrar (arriba)
    document.getElementById('formCloseTop').onclick = async ()=>{
      const ok = await UI.confirmDialog({
        title:'¿Salir sin guardar?',
        message:'Si sales ahora se perderán los datos no guardados.',
        okText:'Sí, salir', cancelText:'Seguir editando', danger:true
      });
      if(!ok) return;
      try{ if(rec) rec.cancel(); }catch(e){}
      if(!existing) try{ localStorage.removeItem(DRAFT_KEY); }catch(_){}
      try{ if(window.__formGuardCleanup) window.__formGuardCleanup(); }catch(_){}
      App.go(existing ? 'repairs' : 'dashboard');
    };
    // Cancelar reparación (abajo)
    document.getElementById('cancelRepairBtn').onclick = async ()=>{
      const ok = await UI.confirmDialog({
        title: existing ? 'Cancelar reparación' : 'Cancelar y salir',
        message: existing
          ? '¿Cancelar esta reparación? Se marcará como cancelada.'
          : '¿Cancelar y salir? Se perderán los datos no guardados.',
        okText:'Sí, cancelar', cancelText:'Volver', danger:true
      });
      if(!ok) return;
      try{ if(rec) rec.cancel(); }catch(e){}
      try{ if(window.__formGuardCleanup) window.__formGuardCleanup(); }catch(_){}
      if(existing){
        DB.updateRepair(existing.id, { status: 'cancelled' });
        try{ if(window.__formGuardCleanup) window.__formGuardCleanup(); }catch(_){}
        UI.toast('Reparación cancelada');
        App.go('repairs');
      } else {
        try{ localStorage.removeItem(DRAFT_KEY); }catch(_){}
        App.go('dashboard');
      }
    };

    UI.attachAutoCapitalize(document.getElementById('clientNameInput'));

    // Teléfonos
    function renderPhones(){
      const wrap = document.getElementById('phonesList');
      wrap.innerHTML = phones.map((p,i)=>`
        <div class="phone-row">
          <input type="tel" inputmode="tel" placeholder="Número ${i+1}" value="${escape(p||'')}" data-phone-idx="${i}">
          ${phones.length>1?`<button type="button" class="icon-btn-sm" data-rm-phone="${i}" aria-label="Quitar">${ICONS.trash}</button>`:''}
        </div>
      `).join('');
      wrap.querySelectorAll('input[data-phone-idx]').forEach(inp=>{
        inp.addEventListener('input', e=>{ phones[+inp.dataset.phoneIdx] = e.target.value; });
      });
      wrap.querySelectorAll('[data-rm-phone]').forEach(b=>{
        b.onclick = ()=>{ phones.splice(+b.dataset.rmPhone,1); if(!phones.length) phones.push(''); renderPhones(); };
      });
    }
    renderPhones();
    document.getElementById('addPhoneBtn').onclick = ()=>{ phones.push(''); renderPhones(); };

    // N/A toggles
    function applyNaState(group, isNa){
      group.classList.toggle('is-na', isNa);
      const btn = group.querySelector('.na-pill');
      btn.setAttribute('aria-pressed', isNa?'true':'false');
      btn.querySelector('.txt').textContent = isNa ? 'Sin datos' : 'Marcar sin datos';
      group.querySelectorAll('.na-input input, .na-input textarea, .na-input button').forEach(el=>{
        el.disabled = isNa;
      });
    }
    view().querySelectorAll('.na-pill').forEach(btn=>{
      const key = btn.dataset.na;
      const group = btn.closest('[data-na-group]');
      applyNaState(group, naFields.includes(key));
      btn.addEventListener('click', ()=>{
        const idx = naFields.indexOf(key);
        if(idx>=0){ naFields.splice(idx,1); applyNaState(group,false); }
        else { naFields.push(key); applyNaState(group,true); }
      });
    });

    // Fotos equipo
    function renderDevicePhotos(){
      const wrap = document.getElementById('devicePhotos');
      if(!photos.device.length){ wrap.innerHTML = '<p class="muted small">Aún no hay fotos del equipo.</p>'; return; }
      wrap.innerHTML = photos.device.map((src,i)=>`
        <div class="photo-item">
          <img src="${src}" data-view-dev="${i}">
          <button type="button" class="photo-remove" data-rm-dev="${i}">${ICONS.trash}</button>
        </div>
      `).join('');
      wrap.querySelectorAll('[data-rm-dev]').forEach(b=>{
        b.onclick = e=>{ e.preventDefault(); e.stopPropagation(); photos.device.splice(+b.dataset.rmDev,1); renderDevicePhotos(); };
      });
      wrap.querySelectorAll('[data-view-dev]').forEach(img=>{
        img.onclick = ()=> UI.openImageViewer(photos.device, +img.dataset.viewDev);
      });
    }
    renderDevicePhotos();
    async function handleDevicePhotoInput(e){
      for(const f of Array.from(e.target.files||[])){
        try{ photos.device.push(await UI.resizeImage(f)); }catch(err){ UI.toast('Error con imagen'); }
      }
      e.target.value = '';
      renderDevicePhotos();
    }
    document.getElementById('addDevicePhoto').addEventListener('change', handleDevicePhotoInput);
    const _devCam = document.getElementById('addDevicePhotoCam');
    if(_devCam) _devCam.addEventListener('change', handleDevicePhotoInput);

    // Foto(s) cliente — v56: varias fotos (carné delante/detrás) con el
    // mismo patrón probado de las fotos del equipo: miniaturas en rejilla,
    // borrado individual, visor ampliado al tocarlas y contador.
    const MAX_CLIENT_PHOTOS = 8;
    async function onPickClient(e){
      const files = Array.from(e.target.files||[]);
      for(const f of files){
        if(photos.client.length >= MAX_CLIENT_PHOTOS){
          UI.toast(`Máximo ${MAX_CLIENT_PHOTOS} fotos del cliente`); break;
        }
        try{ photos.client.push(await UI.resizeImage(f)); }catch(err){ UI.toast('Error con imagen'); }
      }
      e.target.value = '';
      renderClient();
    }
    function renderClient(){
      const wrap = document.getElementById('clientPhotoWrap');
      if(!wrap) return;
      const cnt = document.getElementById('clientPhotoCount');
      if(cnt) cnt.textContent = photos.client.length ? `${photos.client.length} foto${photos.client.length>1?'s':''}` : '';
      if(photos.client.length){
        wrap.innerHTML = `
          <div class="multi-photo-grid">
            ${photos.client.map((p,i)=>`
              <div class="photo-item">
                <img src="${p}" data-view-cli="${i}" alt="Foto del cliente ${i+1}">
                <button type="button" class="photo-remove" data-rm-cli="${i}" title="Quitar foto">${ICONS.trash}</button>
              </div>`).join('')}
          </div>`;
        wrap.querySelectorAll('[data-rm-cli]').forEach(btn=>{
          btn.onclick = ev=>{
            ev.preventDefault(); ev.stopPropagation();
            photos.client.splice(+btn.dataset.rmCli, 1);
            renderClient();
          };
        });
        wrap.querySelectorAll('[data-view-cli]').forEach(img=>{
          img.onclick = ()=> UI.openImageViewer(photos.client, +img.dataset.viewCli);
        });
      } else {
        wrap.innerHTML = `
          <div class="client-photo-preview empty">
            ${ICONS.person}
            <span class="muted small">Aún no hay fotos del cliente</span>
          </div>`;
      }
      // Re-enganchar inputs por si el DOM se reemplazó
      const inp = document.getElementById('clientPhotoInput');
      if(inp) inp.onchange = onPickClient;
      const cam = document.getElementById('clientPhotoCam');
      if(cam) cam.onchange = onPickClient;
    }
    renderClient();

    // AUDIO (bajo la foto del cliente)
    let rec = null;
    function renderAudio(){
      const box = document.getElementById('audioBox');
      if(acceptAudio){
        // v54: reproductor propio — la barra empieza en 0 y se puede
        // retroceder/adelantar con precisión (el control nativo dibujaba la
        // barra corrida: "empezaba después de la mitad" en móviles).
        box.innerHTML = `
          <p class="muted small" style="margin:0">Audio de aceptación</p>
          ${UI.audioPlayerHtml('apForm')}
          <button type="button" class="btn-secondary btn-inline" id="rmAudio">${ICONS.trash} Eliminar</button>`;
        UI.bindAudioPlayer('apForm', acceptAudio);
        document.getElementById('rmAudio').onclick = ()=>{ acceptAudio = null; renderAudio(); };
      } else {
        box.innerHTML = `
          <p class="muted small" style="margin:0">Grabar al cliente aceptando</p>
          <div class="audio-controls">
            <button type="button" class="btn-primary btn-inline" id="recStart">${ICONS.mic} Empezar a grabar</button>
            <button type="button" class="btn-secondary btn-inline" id="recStop" style="display:none">${ICONS.stop} Detener</button>
            <span id="recTimer" class="muted small"></span>
            <span id="recDot" class="rec-pulse" style="display:none"></span>
          </div>
          <label class="file-pill" for="audioFile">${ICONS.upload}<span>Subir archivo</span></label>
          <input type="file" accept="audio/*" id="audioFile" hidden>
        `;
        const recStart = document.getElementById('recStart');
        const recStop = document.getElementById('recStop');
        const recDot = document.getElementById('recDot');
        recStart.onclick = async ()=>{
          try{
            rec = UI.createRecorder();
            await rec.start(s=>{ const t = document.getElementById('recTimer'); if(t) t.textContent = `${s}s`; });
            recStart.style.display = 'none';
            recStop.style.display = '';
            recDot.style.display = '';
          }catch(e){ UI.toast('No se pudo acceder al micrófono'); }
        };
        recStop.onclick = async ()=>{
          try{
            acceptAudio = await rec.stop();
            rec = null;
            renderAudio();
          }catch(e){ UI.toast('Error al detener'); }
        };
        document.getElementById('audioFile').onchange = async e=>{
          const f = e.target.files[0]; if(!f) return;
          acceptAudio = await UI.blobToDataUrl(f); renderAudio();
        };
      }
    }
    renderAudio();
    // v55 — AUTO-GRABACIÓN: al abrir un registro NUEVO (no al editar) la
    // grabación del audio de aceptación arranca sola; el técnico ya no
    // pulsa "Empezar a grabar". Si el micrófono no está disponible
    // (permiso denegado/navegador sin soporte) seguimos manual sin bloquear.
    if(!existing && !acceptAudio && document.getElementById('recStart')){
      setTimeout(async ()=>{
        const btn = document.getElementById('recStart');
        if(btn && btn.style.display !== 'none' && !rec){
          btn.click();
        }
      }, 350);
    }
    // v55 — Cancelar el grabador activo si se abandona el formulario
    // (salir sin guardar): libera el micrófono inmediatamente.
    const prevGuardCleanup = window.__formGuardCleanup;
    window.__formGuardCleanup = ()=>{
      try{ if(rec && rec.isRecording()) rec.cancel(); }catch(_){}
      try{ if(prevGuardCleanup) prevGuardCleanup(); }catch(_){}
    };

    // === PIEZAS (lista de compras, costo fijado por Compra/Venta) ===
    function computePurchasedCatalog(){
      // Recorre transacciones de compra para calcular costo promedio y unidades disponibles
      const map = {};
      for(const t of DB.transactions){
        if(t.type!=='purchase') continue;
        const n = String(t.product||'').trim(); if(!n) continue;
        const q = Number(t.quantity||0);
        const tot = Number(t.total||0);
        if(!map[n]) map[n] = { name:n, qty:0, invested:0 };
        map[n].qty += q; map[n].invested += tot;
      }
      // Resta unidades ya vendidas o usadas en otras reparaciones
      const stats = DB.productStats();
      for(const n in map){
        const s = stats[n];
        const used = s ? (s.sold + s.usedInRepairs) : 0;
        map[n].available = Math.max(0, map[n].qty - used);
        map[n].avgCost = map[n].qty>0 ? (map[n].invested/map[n].qty) : 0;
      }
      return map;
    }

    function partUsedInCurrent(name, idxExcept){
      // Suma cantidades ya añadidas en esta misma reparación (para no contar 2 veces)
      let s = 0;
      parts.forEach((p,i)=>{
        if(i===idxExcept) return;
        if((p.name||'').toLowerCase()===String(name||'').toLowerCase()) s += Number(p.qty||0);
      });
      return s;
    }

    function renderParts(){
      const wrap = document.getElementById('partsList');
      const sum = document.getElementById('partsSummary');
      const noStock = document.getElementById('partsNoStock');
      if(!wrap) return;
      const catalog = computePurchasedCatalog();
      const catalogNames = Object.keys(catalog).sort((a,b)=>a.localeCompare(b,'es'));

      if(!catalogNames.length && !parts.length){
        wrap.innerHTML = '<p class="muted small parts-empty">No tienes piezas compradas todavía. Ve a <b>Compra/Venta</b> y registra una compra antes de añadirlas aquí.</p>';
        sum.classList.add('hidden');
        if(noStock) noStock.textContent = '';
        return;
      }
      if(!parts.length){
        wrap.innerHTML = '<p class="muted small parts-empty">Reparación sin cambio de pieza.</p>';
        sum.classList.add('hidden');
        if(noStock) noStock.textContent = '';
        return;
      }

      wrap.innerHTML = parts.map((p,i)=>{
        // Opciones: catálogo + el nombre actual si no está en catálogo (compatibilidad)
        const currentName = p.name||'';
        const names = catalogNames.slice();
        if(currentName && !names.some(n=>n.toLowerCase()===currentName.toLowerCase())) names.unshift(currentName);
        const opts = ['<option value="">— Selecciona pieza —</option>']
          .concat(names.map(n=>{
            const info = catalog[n];
            const avail = info ? Math.max(0, info.available - partUsedInCurrent(n,i)) : 0;
            const cost = info ? info.avgCost : Number(p.unitCost||0);
            const tag = info ? `  (stock ${avail} · $ ${cost.toFixed(2)})` : '  (no comprada)';
            const sel = currentName.toLowerCase()===n.toLowerCase() ? ' selected' : '';
            return `<option value="${escape(n)}"${sel}>${escape(n)}${escape(tag)}</option>`;
          })).join('');
        const info = catalog[currentName];
        const cost = info ? info.avgCost : Number(p.unitCost||0);
        const avail = info ? Math.max(0, info.available - partUsedInCurrent(currentName,i)) : 0;
        const overWarn = (info && Number(p.qty||0) > avail + Number(p.qty||0)) ? '' : ''; // handled below
        return `
        <div class="part-row stock-row" data-pi="${i}">
          <div class="pr-main">
            <div class="select-elegant">
              <select class="pr-name" data-pf="name" data-pi="${i}">${opts}</select>
            </div>
            <div class="pr-nums">
              <input class="pr-qty" type="number" min="1" step="1" inputmode="numeric" placeholder="Cant." value="${p.qty||1}" data-pf="qty" data-pi="${i}" title="Cantidad de esta pieza">
              <input class="pr-cost" type="number" step="0.01" value="${cost.toFixed(2)}" data-pf="unitCost" data-pi="${i}" readonly title="Costo unitario tomado de tus compras">
            </div>
            ${currentName && info ? `<p class="muted xsmall" style="margin:4px 2px 0">Disponible tras esta reparación: <b>${Math.max(0, avail - Number(p.qty||0))}</b> · costo unit. $ ${cost.toFixed(2)}</p>` : (currentName ? '<p class="muted xsmall" style="margin:4px 2px 0;color:#ff9b8b">⚠️ Esta pieza no figura en tus compras. Regístrala en Compra/Venta.</p>' : '')}
            <button type="button" class="pr-del" data-rm-part="${i}" aria-label="Quitar de esta reparación" title="Quita esta pieza de la reparación. No borra la pieza de Compra/Venta ni del inventario.">${ICONS.trash}<span>Quitar de esta reparación</span></button>
          </div>
          <button type="button" class="icon-btn-sm pr-rm" data-rm-part="${i}" aria-label="Quitar de esta reparación" title="Quitar de esta reparación (no borra la pieza de Compra/Venta)">${ICONS.trash}</button>
        </div>`;
      }).join('');

      wrap.querySelectorAll('select[data-pi], input[data-pi]').forEach(inp=>{
        inp.addEventListener('input', e=>{
          const i = +inp.dataset.pi; const f = inp.dataset.pf;
          if(f==='qty') parts[i].qty = parseInt(inp.value,10)||0;
          else if(f==='unitCost') parts[i].unitCost = inp.value;
          else {
            parts[i].name = inp.value;
            // refrescar costo desde catálogo
            const info = catalog[parts[i].name];
            parts[i].unitCost = info ? Number(info.avgCost.toFixed(2)) : '';
            renderParts(); return;
          }
          updatePartsSummary();
        });
      });
      wrap.querySelectorAll('[data-rm-part]').forEach(b=>{
        b.onclick = ()=>{ parts.splice(+b.dataset.rmPart,1); renderParts(); };
      });
      // Aviso global si alguna pieza supera el stock
      const issues = [];
      parts.forEach((p,i)=>{
        if(!p.name) return;
        const info = catalog[p.name]; if(!info) return;
        const avail = info.available - partUsedInCurrent(p.name,i);
        if(Number(p.qty||0) > avail) issues.push(`${p.name}: pides ${p.qty}, disponibles ${Math.max(0,avail)}`);
      });
      if(noStock) noStock.innerHTML = issues.length ? `<span style="color:#ff9b8b">⚠️ Stock insuficiente — ${issues.map(escape).join(' · ')}</span>` : '';
      updatePartsSummary();
    }
    function updatePartsSummary(){
      const sum = document.getElementById('partsSummary');
      if(!sum) return;
      const valid = parts.filter(p=>p.name && Number(p.qty)>0);
      if(!valid.length){ sum.classList.add('hidden'); return; }
      const inv = valid.reduce((a,p)=> a + (Number(p.unitCost||0)*Number(p.qty||0)), 0);
      sum.classList.remove('hidden');
      sum.innerHTML = `<span>Piezas: <b>${valid.length}</b></span><span>Costo en piezas: <b>$ ${inv.toFixed(2)}</b></span>`;
    }
    document.getElementById('addPartBtn').onclick = ()=>{
      // Pre-rellenar con la primera pieza disponible si existe
      const cat = computePurchasedCatalog();
      const names = Object.keys(cat).filter(n=> (cat[n].available - partUsedInCurrent(n,-1)) > 0).sort((a,b)=>a.localeCompare(b,'es'));
      const first = names[0];
      const cost = first ? Number(cat[first].avgCost.toFixed(2)) : '';
      parts.push({ name: first||'', qty:1, unitCost: cost });
      renderParts();
    };
    renderParts();

    // ===== Lógica de garantía dependiente de la fecha de entrega =====
    function syncWarrantyAvailability(){
      const dueEl = document.getElementById('dueDateInput');
      const wEl = document.getElementById('warrantyDaysInput');
      const hint = document.getElementById('warrantyHint');
      if(!dueEl || !wEl || !hint) return;
      wEl.disabled = false;
      wEl.placeholder = 'Ej: 30';
      hint.innerHTML = 'La garantía comienza el día que marques el equipo como <b>Entregado</b>, sin importar la fecha de entrega prevista.';
      hint.style.color = '';
    }
    const dueEl = document.getElementById('dueDateInput');
    if(dueEl) dueEl.addEventListener('change', syncWarrantyAvailability);
    syncWarrantyAvailability();

    function collectRepairDataFromForm(){
      const form = document.getElementById('repairForm');
      if(!form) return null;
      const fd = new FormData(form);
      const data = {};
      ['clientName','clientAddress','clientIdNumber','device','brand','model','serial','issue','status','notes'].forEach(k=>{
        const v = fd.get(k);
        data[k] = naFields.includes(k) ? null : (v != null ? String(v).trim() || null : null);
      });
      data.clientName = (fd.get('clientName')||'').trim();
      data.device = fd.get('device');
      data.issue = fd.get('issue');
      data.status = fd.get('status');
      // v57 — El alta/editar acepta Entregada directamente: la regla
      // anterior (degradar a Completada sin firma) dejó estados atascados
      // que ocultaban la ganancia del Resumen. La firma se puede añadir
      // después desde el detalle.
      const cleanPhones = naFields.includes('clientPhones') ? [] : phones.map(p=>String(p||'').trim()).filter(Boolean);
      data.clientPhones = cleanPhones;
      data.clientPhone = cleanPhones[0] || null;
      const due = fd.get('dueDate');
      data.dueDate = due ? UI.localNoon(due) : null;
      const cAt = fd.get('createdAt');
      if(cAt){ data.createdAt = UI.localNoon(cAt); }
      const price = fd.get('price'); const dep = fd.get('deposit');
      data.price = naFields.includes('price') ? null : (price ? parseFloat(price) : null);
      data.deposit = naFields.includes('deposit') ? null : (dep ? parseFloat(dep) : null);
      const wd = fd.get('warrantyDays');
      data.warrantyDays = (wd!=null && String(wd).trim()!=='') ? Math.max(0, parseInt(wd,10)||0) : null;
      data.devicePhotos = photos.device;
      data.devicePhoto = photos.device[0] || null;
      data.clientPhotos = photos.client.slice();
      data.clientPhoto = photos.client[0] || null;
      data.acceptAudio = acceptAudio;
      data.naFields = naFields.slice();
      data.parts = parts.map(p=>({ name:p.name||'', qty:p.qty||1, unitCost:p.unitCost!=null?p.unitCost:'' }));
      return data;
    }
    function saveDraft(){
      if(existing) return;
      try{
        const data = collectRepairDataFromForm();
        if(data) localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), data }));
      }catch(_){}
    }
    const draftTimer = !existing ? setInterval(saveDraft, 1200) : null;
    document.getElementById('repairForm').addEventListener('input', saveDraft);
    document.getElementById('repairForm').addEventListener('change', saveDraft);
    const prevFormCleanup = window.__formGuardCleanup;
    window.__formGuardCleanup = ()=>{
      if(draftTimer) clearInterval(draftTimer);
      try{ if(prevFormCleanup) prevFormCleanup(); }catch(_){}
    };





    // Submit
    document.getElementById('repairForm').addEventListener('submit', e=>{
      e.preventDefault();
      const doSave = async ()=>{
        let fd_pre = new FormData(e.target);
        if(!existing){
          const idn = (fd_pre.get('clientIdNumber')||'').trim();
          if(idn && !naFields.includes('clientIdNumber')){
            const dup = DB.repairs.find(x => (x.clientIdNumber||'').trim().toLowerCase() === idn.toLowerCase());
            if(dup){
              const ok = await UI.confirmDialog({
                title:'Cliente ya existe',
                message:`Ya existe un cliente con la identidad ${idn} (${dup.clientName||'sin nombre'}). ¿Crear otra reparación para el mismo cliente? Se usarán sus datos para no duplicar información.`,
                okText:'Sí, usar mismo cliente', cancelText:'Cancelar'
              });
              if(!ok) return;
              const cn = document.getElementById('clientNameInput');
              if(cn && !cn.value.trim()) cn.value = dup.clientName||'';
              const addrEl = document.querySelector('[name=clientAddress]');
              if(addrEl && !addrEl.value.trim() && dup.clientAddress) addrEl.value = dup.clientAddress;
              if(!photos.client.length && (dup.clientPhotos||[]).length){
                (dup.clientPhotos||[]).forEach(x=>photos.client.push(x)); renderClient();
              }else if(!photos.client.length && dup.clientPhoto){
                photos.client.push(dup.clientPhoto); renderClient();
              }
              if((!phones.length || phones.every(x=>!x)) && (dup.clientPhones||[]).length){
                phones.length = 0; (dup.clientPhones||[]).forEach(x=>phones.push(x));
              }
              fd_pre = new FormData(e.target);
            }
          }
        }
        const fd = fd_pre;
        const data = {};
        ['clientName','clientAddress','clientIdNumber','device','brand','model','serial','issue','status','notes'].forEach(k=>{
          const v = fd.get(k);
          data[k] = naFields.includes(k) ? null : (v != null ? String(v).trim() || null : null);
        });
        data.clientName = (fd.get('clientName')||'').trim();
        data.device = fd.get('device');
        data.issue = fd.get('issue');
        data.status = fd.get('status');
        // v57 — La edición acepta Entregada directamente (sin degradar):
        // la firma se puede añadir después desde el detalle.
        const cleanPhones = naFields.includes('clientPhones') ? [] : phones.map(p=>String(p||'').trim()).filter(Boolean);
        data.clientPhones = cleanPhones;
        data.clientPhone = cleanPhones[0] || null;
        const due = fd.get('dueDate');
        data.dueDate = due ? UI.localNoon(due) : null;
        const cAt = fd.get('createdAt');
        if(cAt){
          // Conservar hora original si existe, si no usar mediodía local
          const orig = r.createdAt ? new Date(r.createdAt) : null;
          const nd = new Date(cAt+'T12:00:00');
          if(orig){ nd.setHours(orig.getHours(), orig.getMinutes(), orig.getSeconds(), 0); }
          data.createdAt = nd.getTime();
        }
        const price = fd.get('price'); const dep = fd.get('deposit');
        data.price = naFields.includes('price') ? null : (price ? parseFloat(price) : null);
        data.deposit = naFields.includes('deposit') ? null : (dep ? parseFloat(dep) : null);
        const wd = fd.get('warrantyDays');
        data.warrantyDays = (wd!=null && String(wd).trim()!=='') ? Math.max(0, parseInt(wd,10)||0) : null;
        data.devicePhotos = photos.device;
        data.devicePhoto = photos.device[0] || null;
        data.clientPhotos = photos.client.slice();
      data.clientPhoto = photos.client[0] || null;
        data.acceptAudio = acceptAudio;
        data.naFields = naFields;
        data.parts = parts
          .map(p=>({
            name: String(p.name||'').trim(),
            qty: Math.max(0, parseInt(p.qty,10)||0),
            unitCost: (p.unitCost!=='' && p.unitCost!=null) ? Math.max(0, parseFloat(p.unitCost)||0) : 0
          }))
          .filter(p=> p.name && p.qty>0);
        // Auto-añadir piezas nuevas al catálogo de productos
        for(const p of data.parts){
          if(!DB.settings.productTypes.some(x=>x.toLowerCase()===p.name.toLowerCase())){
            DB.addProductType(p.name);
          }
        }

        if(existing){
          DB.updateRepair(existing.id, data);
          UI.toast('Reparación actualizada');
        } else {
          const nr = DB.addRepair(data);
          UI.toast('Reparación registrada: '+nr.id);
          try{ localStorage.removeItem(DRAFT_KEY); }catch(_){}
        }
        // Aviso claro: el dato YA está guardado offline; se subirá solo
        // al restablecerse la conexión (o al pulsar Subir).
        try{
          if(!navigator.onLine) UI.toast('Sin conexión: guardado en el dispositivo. Se subirá al reconectar.', 3500);
        }catch(_){}
        try{ if(window.__formGuardCleanup) window.__formGuardCleanup(); }catch(_){}
        App.go('repairs');
      };
      if(rec && rec.isRecording()){
        rec.stop().then(url=>{ acceptAudio = url; rec = null; doSave(); }).catch(()=> doSave());
      } else {
        doSave();
      }
    });
  }

  // ============= DETALLE =============
  // v57 — FIRMA DEL CLIENTE al entregar (regla inviolable): se llama cuando la
  // reparación pasa a COMPLETADA. La sección de captura se pinta ABAJO, en el
  // propio detalle, ANTES de cambiar el estado a Entregada. Tras guardar la
  // foto el sistema muestra una NOTIFICACIÓN pidiendo confirmar el paso
  // Completada → Entregada (el técnico decide; la entrega no ocurre en
  // silencio). El botón "Cancelar" devuelve el flujo sin entregar.
  function offerSignatureCapture(id){
    const rec = DB.findRepair(id); if(!rec) return;
    // v61 — CAPTURA RÁPIDA de la firma: los DOS accesos (Cámara y Galería)
    // visibles a la vez como botones grandes, cada uno abre SU input
    // directamente (capture=environment para la cámara). El input de cámara
    // ya no depende de soporte de getUserMedia: usa la app de cámara del
    // dispositivo, así que es instantáneo en móvil y PC.
    UI.openModal(`
      <h2 style="margin:0 0 6px;font-size:20px">✍️ Firma del cliente</h2>
      <p class="muted small" style="margin:0 0 12px">
        La reparación <b>${UI.escape(rec.id)}</b> quedó en <b>Completada</b>.
        Toma la foto del papel con la firma del cliente (o elige una de la
        galería) y, al guardarla, te pediremos confirmar el paso a
        <b>Entregada</b>.
      </p>
      <div id="sigCapture">
        <div class="sig-shot" id="sigPreview" style="display:none">
          <img id="sigImg" alt="Firma del cliente">
          <button type="button" class="sig-remove" id="sigRm" aria-label="Quitar foto">
            <svg viewBox="0 0 24 24"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>
          </button>
        </div>
        <div class="sig-quick-btns" id="sigBtns">
          <button type="button" class="sig-quick cam">
            <svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 3l-1.8 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"/></svg>
            <span>Cámara</span>
          </button>
          <button type="button" class="sig-quick gal">
            <svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10l5-5 3.5 3.5L16 11l4 4V6H4zm3 3.5A1.75 1.75 0 1 1 7.75 6 1.75 1.75 0 0 1 7 9.5z"/></svg>
            <span>Galería</span>
          </button>
          <input type="file" accept="image/*" ${('capture' in HTMLInputElement.prototype || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) ? 'capture="environment"' : ''} id="sigCam" hidden>
          <input type="file" accept="image/*" id="sigGal" hidden>
        </div>
      </div>
      <div class="btn-row" style="margin-top:14px">
        <button type="button" class="btn-primary" id="sigDone" disabled>✓ Guardar firma</button>
      </div>
      <p class="muted small" style="margin:10px 4px 0">
        Recomendado: la foto de la firma deja constancia de quién retiró el
        equipo. Si no la tienes ahora, cierra y vuelve después; la reparación
        queda en <b>Completada</b> hasta que la marques <b>Entregada</b>.
      </p>
    `);
    let sig = null;
    const preview = document.getElementById('sigPreview');
    const img = document.getElementById('sigImg');
    const doneBtn = document.getElementById('sigDone');
    function renderSig(){
      if(sig){
        preview.style.display = '';
        img.src = sig;
        doneBtn.disabled = false;
      } else {
        preview.style.display = 'none';
        doneBtn.disabled = true;
      }
    }
    async function pick(file){
      if(!file) return;
      try{
        sig = await UI.resizeImage(file, 1200, .8);
        renderSig();
      }catch(e){ UI.toast('Error con la imagen'); }
    }
    document.getElementById('sigCam').onchange = e=>{ pick(e.target.files[0]); e.target.value=''; };
    document.getElementById('sigGal').onchange = e=>{ pick(e.target.files[0]); e.target.value=''; };
    // v61 — ACCESO RÁPIDO: los botones grandes abren el input DIRECTAMENTE
    // (un toque menos que los labels de antes) y ambos quedan a la vista.
    const camBtn = document.querySelector('#sigBtns .sig-quick.cam');
    const galBtn = document.querySelector('#sigBtns .sig-quick.gal');
    if(camBtn) camBtn.onclick = ()=> document.getElementById('sigCam').click();
    if(galBtn) galBtn.onclick = ()=> document.getElementById('sigGal').click();
    document.getElementById('sigRm').onclick = ()=>{ sig = null; renderSig(); };
    doneBtn.onclick = async ()=>{
      if(!sig) return;
      // v57 — Guardar la foto SIN entregar en silencio: queda Completada y se
      // pide confirmación explícita del paso a Entregada (notificación clara).
      DB.updateRepair(id, { signaturePhoto: sig });
      UI.closeModal();
      const ok = await UI.confirmDialog({
        title:'Cambiar estado a Entregada',
        message:`La firma quedó guardada en la reparación ${DB.findRepair(id).id}. ¿Cambiar el estado de Completada a Entregada ahora? Esto inicia la garantía.`,
        okText:'Sí, marcar Entregada', cancelText:'Todavía no'
      });
      if(ok){
        DB.updateRepair(id, { status:'delivered' });
        UI.toast('✓ Entregada · garantía iniciada');
      } else {
        UI.toast('Firma guardada · sigue Completada');
      }
      App.refresh();
    };
  }

  // v57 — Texto de ayuda bajo el selector de estado, COLOREADO según el
  // estado elegido (mismo código de color del badge). Explica qué significa
  // cada estado respecto al COBRO — la ganancia del Resumen vive en las
  // Entregadas, que es cuando se cobra la reparación.
  function statusHelpHtml(r){
    const map = {
      pending:      '⏳ <b>Pendiente</b> — el equipo está en espera; todavía no hay trabajo ni cobro.',
      in_progress: '🔧 <b>En proceso</b> — trabajando en el equipo ahora. El importe va a «por cobrar».',
      completed:    '🔵 <b>Completada</b> — trabajo terminado, <b>sin entregar todavía</b>. Toma la foto de la firma y márcala Entregada para cobrarla.',
      delivered:    '🟢 <b>Entregada</b> — equipo entregado y <b>reparación cobrada</b>: ya suma en la ganancia del Resumen.',
      cancelled:    '✖️ <b>Cancelada</b> — fuera del taller; no cuenta en la ganancia.',
      no_devolution: '🟣 <b>Sin devolución</b> — más de 60 días en el taller: el equipo se considera no reclamado. El registro se conserva completo en el historial y puedes revertirlo si el cliente aparece.'
    };
    return map[r.status] || '';
  }
  function showRepair(id){
    const r = DB.findRepair(id);
    if(!r) return;
    const photos = (r.devicePhotos && r.devicePhotos.length) ? r.devicePhotos : (r.devicePhoto?[r.devicePhoto]:[]);
    const naFields = r.naFields || [];

    function valHtml(key, transform){
      if(naFields.includes(key)) return '<span class="na-tag">Sin datos</span>';
      let v = r[key];
      if(v == null || v === '') return '<span class="muted">—</span>';
      return transform ? transform(v) : escape(v);
    }

    const phones = (r.clientPhones && r.clientPhones.length) ? r.clientPhones : (r.clientPhone?[r.clientPhone]:[]);
    let phonesHtml;
    if(naFields.includes('clientPhones') || naFields.includes('clientPhone')){
      phonesHtml = '<span class="na-tag">Sin datos</span>';
    } else if(!phones.length){
      phonesHtml = '<span class="muted">—</span>';
    } else {
      phonesHtml = `<div class="phones-display">${phones.map(p=>{
        const tel = UI.phoneClean(p); const sms = UI.phoneSms(p);
        return `<div style="display:flex;gap:6px">
          <a class="phone-link" href="tel:${escape(tel)}">${ICONS.phone}<span>${escape(p)}</span></a>
          <a class="phone-link sms" href="sms:${escape(sms)}">${ICONS.sms}<span>SMS</span></a>
        </div>`;
      }).join('')}</div>`;
    }

    const html = `
      <h2 style="margin:0 0 4px;font-size:20px">${escape(r.clientName||'Cliente')}</h2>
      <p class="muted" style="margin:0 0 14px">${escape(r.id)} · ${escape(r.device||'Equipo')} · <span class="status ${r.status}">${statusLabel(r.status)}</span></p>

      ${(r.clientPhotos && r.clientPhotos.length) ? `<div class="client-photos-strip" id="detailClientPhotos">${r.clientPhotos.map((p,i)=>`<img src="${p}" data-view-cli="${i}" alt="Foto del cliente ${i+1}" title="Foto del cliente ${i+1}">`).join('')}</div>` : ''}
      ${photos.length ? `<div class="detail-photo-strip">${photos.map((p,i)=>`<img src="${p}" data-view-idx="${i}">`).join('')}</div>` : ''}

      <div class="detail-row"><span class="lbl">Teléfono</span><span class="val">${phonesHtml}</span></div>
      <div class="detail-row"><span class="lbl">Dirección</span><span class="val">${valHtml('clientAddress')}</span></div>
      <div class="detail-row"><span class="lbl">Nº identidad</span><span class="val">${valHtml('clientIdNumber')}</span></div>
      <div class="detail-row"><span class="lbl">Marca</span><span class="val">${valHtml('brand')}</span></div>
      <div class="detail-row"><span class="lbl">Modelo</span><span class="val">${valHtml('model')}</span></div>
      <div class="detail-row"><span class="lbl">Nº serie</span><span class="val">${valHtml('serial')}</span></div>
      <div class="detail-row"><span class="lbl">Falla</span><span class="val">${escape(r.issue||'—')}</span></div>
      <div class="detail-row"><span class="lbl">Notas</span><span class="val">${valHtml('notes')}</span></div>
      <div class="detail-row"><span class="lbl">Ingreso</span><span class="val">${fmtDate(r.createdAt)}</span></div>
      <div class="detail-row"><span class="lbl">Entrega</span><span class="val">${r.dueDate?fmtDate(r.dueDate):'—'}</span></div>
      <div class="detail-row"><span class="lbl">Precio</span><span class="val">${naFields.includes('price')?'<span class="na-tag">Sin datos</span>':(r.price!=null?Number(r.price).toFixed(2):'<span class="muted">—</span>')}</span></div>
      <div class="detail-row"><span class="lbl">Anticipo</span><span class="val">${naFields.includes('deposit')?'<span class="na-tag">Sin datos</span>':(r.deposit!=null?Number(r.deposit).toFixed(2):'<span class="muted">—</span>')}</span></div>
      ${(()=>{ 
        if(!r.warrantyDays) return '<div class="detail-row"><span class="lbl">Garantía</span><span class="val"><span class="muted">—</span></span></div>';
        if(r.status !== 'delivered' || !r.deliveredAt){
          return `<div class="detail-row"><span class="lbl">Garantía</span><span class="val">${r.warrantyDays} día(s) (empieza al marcar como entregado)</span></div>`;
        }
        const endTs = r.deliveredAt + r.warrantyDays*86400000;
        const remainingMs = endTs - Date.now();
        const remaining = Math.ceil(remainingMs/86400000);
        const elapsed = Math.max(0, Math.floor((Date.now() - r.deliveredAt)/86400000));
        const status = remaining>0
          ? `<span class="warranty-tag active">Vigente · ${remaining} día(s) restantes</span>`
          : `<span class="warranty-tag expired">Vencida hace ${Math.abs(remaining)} día(s)</span>`;
        return `<div class="detail-row"><span class="lbl">Garantía</span><span class="val">${r.warrantyDays} día(s) · entregada el ${fmtDate(r.deliveredAt)} · transcurridos ${elapsed} · hasta ${fmtDate(endTs)}<br>${status}</span></div>`;
      })()}

      ${(()=>{
        const ps = r.parts||[];
        if(!ps.length) return `<div class="detail-row"><span class="lbl">Piezas</span><span class="val"><span class="muted">Sin cambio de pieza</span></span></div>`;
        const inv = ps.reduce((a,p)=> a + Number(p.unitCost||0)*Number(p.qty||0), 0);
        const price = Number(r.price||0);
        const profit = price - inv;
        const pcls = profit>=0 ? 'pos' : 'neg';
        const rows = ps.map(p=>`<div class="part-show"><span class="ps-name">${escape(p.name)}</span><span class="ps-meta">${p.qty} × $ ${Number(p.unitCost||0).toFixed(2)}</span><span class="ps-total">$ ${(Number(p.unitCost||0)*Number(p.qty||0)).toFixed(2)}</span></div>`).join('');
        return `<div class="section-title">Piezas cambiadas</div>
          <div class="parts-show">${rows}</div>
          <div class="parts-show-foot">
            <span>Inversión en piezas <b>$ ${inv.toFixed(2)}</b></span>
            ${r.price!=null?`<span class="tx-profit ${pcls}">Ganancia rep.: $ ${profit.toFixed(2)}</span>`:''}
          </div>`;
      })()}

      ${r.acceptAudio ? `<div class="section-title">Aceptación del cliente</div>${UI.audioPlayerHtml('apDetail')}` : ''}

      ${r.signaturePhoto ? `
        <div class="section-title">Firma del cliente (entrega)</div>
        <div class="sig-shot">
          <img src="${r.signaturePhoto}" id="detailSignature" alt="Firma del cliente al recibir el equipo" style="cursor:zoom-in">
        </div>` : (r.status==='completed' || r.status==='delivered' ? `
        <div class="section-title">Firma del cliente (pendiente)</div>
        <p class="muted small" style="margin:-4px 0 8px">${r.status==='completed'
          ? 'Guarda la foto de la firma <b>antes</b> de cambiar el estado a Entregada.'
          : 'Esta reparación está Entregada sin foto de firma: guárdala para dejar constancia de la entrega.'}</p>
        <div class="btn-row">
          <button type="button" class="btn-primary" id="sigPendingBtn">✍️ Tomar / elegir foto de la firma</button>
        </div>` : '')}

      ${(() => {
        // v54 — Firma del cliente en la entrega (ver quickStatus más abajo)
        return '';
      })()}

      <div class="section-title">Cambiar estado</div>
      <div class="select-elegant">
        <select id="quickStatus">
          ${['pending','in_progress','completed','delivered','cancelled','no_devolution'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${statusLabel(s)||s}</option>`).join('')}
        </select>
      </div>
      <div id="statusHelp" class="status-help ${r.status}">${statusHelpHtml(r)}</div>
      ${(()=> {
        // v61 — fila del recargo por retraso (si está activo o ya cobrado)
        const late = Number(r.lateFee||0);
        const charged = Number(r.lateFeeCharged||0);
        if(late<=0 && charged<=0) return '';
        return `<div class="detail-row"><span class="lbl">Recargo por retraso</span><span class="val">${late>0
          ? `+$ ${late.toFixed(2)} acumulándose (${r.lateFeeDays||'?'} día(s) × $ 100 · se cobra al entregar)`
          : `$ ${charged.toFixed(2)} ya cobrado en la entrega (${r.lateFeeDays||'?'} día(s))`}</span></div>`;
      })()}
      <div id="sigBox"></div>
      <div class="btn-row four">
        <button class="btn-secondary" id="editBtn">${ICONS.edit} Editar</button>
        <button class="btn-secondary" id="ticketBtn">${ICONS.print} Etiqueta</button>
        <button class="btn-secondary" id="dupBtn" title="Duplicar con ID nuevo"><span class="dup-ico" style="display:inline-flex;vertical-align:-3px">${ICONS.duplicate}</span> Duplicar</button>
        <button class="btn-primary btn-cancel" id="delBtn">${ICONS.trash} Eliminar</button>
      </div>
    `;
    UI.openModal(html);

    // v54 — Reproductor propio en el detalle (barra correcta desde 0)
    if(r.acceptAudio) UI.bindAudioPlayer('apDetail', r.acceptAudio);
    // v54 — Ampliar la firma al tocarla
    const dSig = document.getElementById('detailSignature');
    if(dSig) dSig.onclick = ()=> UI.openImageViewer(r.signaturePhoto);

    document.querySelectorAll('[data-view-idx]').forEach(img=>{
      img.onclick = ()=> UI.openImageViewer(photos, +img.dataset.viewIdx);
    });
    // v56 — fotos del cliente (múltiples) en el detalle: tira con visor
    const cliStrip = document.getElementById('detailClientPhotos');
    if(cliStrip){
      const cliPhotos = (r.clientPhotos && r.clientPhotos.length) ? r.clientPhotos : (r.clientPhoto?[r.clientPhoto]:[]);
      cliStrip.querySelectorAll('[data-view-cli]').forEach(img=>{
        img.onclick = ()=> UI.openImageViewer(cliPhotos, +img.dataset.viewCli);
      });
    }

    document.getElementById('quickStatus').addEventListener('change', async e=>{
      const newStatus = e.target.value;
      // v57 — el texto de ayuda de abajo se recolorea al instante con el
      // estado elegido (aunque aún no se guarde), para saber qué significa.
      const helpEl = document.getElementById('statusHelp');
      if(helpEl){ helpEl.className = 'status-help ' + newStatus; helpEl.innerHTML = statusHelpHtml({ ...r, status:newStatus }); }
      if(newStatus === 'cancelled' && r.status !== 'cancelled'){
        const ok = await UI.confirmDialog({
          title:'Cancelar reparación',
          message:'¿Marcar esta reparación como cancelada?',
          okText:'Sí, cancelar', cancelText:'Volver', danger:true
        });
        if(!ok){ e.target.value = r.status; return; }
      }
      // v57 — Flujo recomendado: Completada → foto de firma → notificación
      // → Entregada. Al poner Completada se abre la captura de la firma.
      if(newStatus === 'completed' && r.status !== 'completed'){
        DB.updateRepair(id, { status: 'completed' });
        UI.toast('Completada. Toma la foto de la firma del cliente para entregarla');
        offerSignatureCapture(id);
        return;
      }
      // v57 — Entregada permitida SIEMPRE (con aviso si falta la firma): la
      // regla anterior de bloqueo estricto dejó reparaciones atascadas en
      // Completada (equipos entregados que el Resumen no contaba). Se
      // recomienda la firma, se recuerda si falta, pero el técnico decide.
      if(newStatus === 'delivered' && r.status !== 'delivered'){
        const rec = DB.findRepair(id);
        if(rec && !rec.signaturePhoto){
          const ok = await UI.confirmDialog({
            title:'Entregar sin foto de firma',
            message:'Esta reparación no tiene la foto de la firma del cliente. ¿Marcarla como Entregada de todos modos? Podrás añadir la firma después desde el detalle.',
            okText:'Sí, entregar', cancelText:'Volver'
          });
          if(!ok){ e.target.value = r.status; return; }
        }
        DB.updateRepair(id, { status: 'delivered' });
        UI.toast('✓ Entregada · garantía iniciada');
        UI.closeModal(); App.refresh();
        return;
      }
      DB.updateRepair(id, { status: newStatus });
      UI.toast(newStatus==='cancelled' ? 'Reparación cancelada' : 'Estado actualizado');
      UI.closeModal(); App.refresh();
    });
    // v57 — botón de firma abajo (estado Completada sin firma): abre la
    // captura ANTES de cambiar el estado; tras guardar notifica el paso a Entregada.
    const sigPending = document.getElementById('sigPendingBtn');
    if(sigPending) sigPending.onclick = ()=> offerSignatureCapture(id);
    document.getElementById('editBtn').onclick = ()=>{ UI.closeModal(); App.go('new', null, r); };
    document.getElementById('ticketBtn').onclick = ()=>{ showLabel(r); };
    bindDuplicateBtn(id);
    document.getElementById('delBtn').onclick = async ()=>{
      // v64 — el ID de una copia duplicada no se puede eliminar
      if(r.duplicatedFrom){
        UI.toast('🔒 El ID '+r.id+' es una copia generada por duplicación y no se puede eliminar. Puedes vaciar sus datos editándola.');
        return;
      }
      const ok = await UI.confirmDialog({
        title:'Eliminar reparación',
        message:`¿Eliminar definitivamente la reparación ${r.id}? Esta acción no se puede deshacer.`,
        okText:'Eliminar', cancelText:'Cancelar', danger:true
      });
      if(!ok) return;
      DB.deleteRepair(id); UI.toast('Eliminada'); UI.closeModal(); App.refresh();
    };
  }

  // ============= ETIQUETA INTERNA (rápida, sin imprimir) =============
  function showLabel(r){
    const phones = (r.clientPhones && r.clientPhones.length) ? r.clientPhones : (r.clientPhone?[r.clientPhone]:[]);
    const pieces = [
      ['ID', r.id],
      ['Cliente', r.clientName||'—'],
      ['Tel', phones.join(' / ') || '—'],
      ['Equipo', [r.device, r.brand, r.model].filter(Boolean).join(' ') || '—'],
      ['Serie', r.serial || '—'],
      ['Falla', r.issue || '—'],
      ['Entrega', r.dueDate ? fmtDate(r.dueDate) : '—']
    ];
    const rows = pieces.map(([k,vv])=>`<div class="lbl-row"><span class="k">${escape(k)}</span><span class="v">${escape(vv)}</span></div>`).join('');
    const plain = pieces.map(([k,vv])=> `${k}: ${vv}`).join('\n');
    UI.openModal(`
      <h2 style="margin:0 0 4px;font-size:18px">Etiqueta del equipo</h2>
      <p class="muted small" style="margin:0 0 12px">Datos rápidos para pegar detrás del aparato.</p>
      <div class="label-card" id="labelCard">
        <div class="lbl-id">${escape(r.id)}</div>
        ${rows}
      </div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn-secondary" id="copyLbl">Copiar texto</button>
        <button class="btn-secondary" id="closeLbl">Cerrar</button>
      </div>
    `);
    document.getElementById('closeLbl').onclick = ()=> UI.closeModal();
    document.getElementById('copyLbl').onclick = async ()=>{
      try{ await navigator.clipboard.writeText(plain); UI.toast('Copiado al portapapeles'); }
      catch(e){ UI.toast('No se pudo copiar'); }
    };
  }

  // ============= TICKET DE SALIDA (legacy) =============
  function printTicket(r){
    const s = DB.settings;
    const logo = s.logo
      ? `<img src="${s.logo}" style="width:60px;height:60px;border-radius:12px;object-fit:cover">`
      : `<div style="width:60px;height:60px;border-radius:12px;background:#7a1f1f;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px">${escape((s.appName||'T').charAt(0))}</div>`;
    const phones = (r.clientPhones && r.clientPhones.length) ? r.clientPhones : (r.clientPhone?[r.clientPhone]:[]);
    const total = r.price!=null ? Number(r.price) : null;
    const dep = r.deposit!=null ? Number(r.deposit) : 0;
    const saldo = total!=null ? (total - dep) : null;
    const photosHtml = (r.devicePhotos||[]).slice(0,3).map(p=>
      `<img src="${p}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #ddd">`
    ).join('');
    const html = `
<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${escape(r.id)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:24px;color:#111;background:#fff}
  .ticket{max-width:560px;margin:0 auto;border:1px solid #ddd;border-radius:14px;padding:22px;background:#fff}
  .head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:2px dashed #ccc;padding-bottom:14px;margin-bottom:14px}
  .brand{display:flex;align-items:center;gap:10px}
  .brand h1{margin:0;font-size:20px;letter-spacing:.5px}
  .brand p{margin:0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px}
  .id-box{text-align:right}
  .id-box .id{font-family:'Courier New',monospace;font-weight:800;font-size:22px;color:#7a1f1f;letter-spacing:1px}
  .id-box .id-lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:#7a1f1f;margin:18px 0 6px;border-bottom:1px solid #eee;padding-bottom:4px}
  .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;gap:12px}
  .row .l{color:#666}
  .row .v{font-weight:600;text-align:right;max-width:65%}
  .photos{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
  .totals{margin-top:14px;background:#faf6f3;border:1px solid #eee;border-radius:10px;padding:12px}
  .totals .row{padding:3px 0}
  .totals .total{font-size:16px;font-weight:800;color:#7a1f1f;border-top:1px dashed #c5a98a;margin-top:6px;padding-top:6px}
  .signs{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:30px}
  .signs .box{border-top:1px solid #333;padding-top:6px;text-align:center;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.8px}
  .legal{margin-top:18px;font-size:10px;color:#888;line-height:1.5;text-align:center}
  .actions{max-width:560px;margin:14px auto 0;display:flex;gap:8px;justify-content:flex-end}
  button{padding:10px 16px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer;font-weight:600}
  button.primary{background:#7a1f1f;color:#fff;border-color:#7a1f1f}
  @media print{ .actions{display:none} body{padding:0} .ticket{border:0} }
</style></head>
<body>
  <div class="ticket" id="ticketPrintArea">
    <div class="head">
      <div class="brand">
        ${logo}
        <div>
          <h1>${escape(s.appName||'Taller')}</h1>
          <p>Comprobante de servicio</p>
        </div>
      </div>
      <div class="id-box">
        <div class="id-lbl">N.º Ticket</div>
        <div class="id">#${escape(r.id)}</div>
        <div class="id-lbl" style="margin-top:4px">${fmtDateTime(r.createdAt)}</div>
      </div>
    </div>

    <h2>Cliente</h2>
    <div class="row"><span class="l">Nombre</span><span class="v">${escape(r.clientName||'—')}</span></div>
    ${phones.length?`<div class="row"><span class="l">Teléfono(s)</span><span class="v">${phones.map(escape).join(' · ')}</span></div>`:''}
    ${r.clientAddress?`<div class="row"><span class="l">Dirección</span><span class="v">${escape(r.clientAddress)}</span></div>`:''}
    ${r.clientIdNumber?`<div class="row"><span class="l">N.º identidad</span><span class="v">${escape(r.clientIdNumber)}</span></div>`:''}

    <h2>Equipo</h2>
    <div class="row"><span class="l">Equipo</span><span class="v">${escape(r.device||'—')}</span></div>
    ${r.brand?`<div class="row"><span class="l">Marca</span><span class="v">${escape(r.brand)}</span></div>`:''}
    ${r.model?`<div class="row"><span class="l">Modelo</span><span class="v">${escape(r.model)}</span></div>`:''}
    ${r.serial?`<div class="row"><span class="l">N.º serie</span><span class="v">${escape(r.serial)}</span></div>`:''}
    <div class="row"><span class="l">Estado</span><span class="v">${escape(statusLabel(r.status))}</span></div>
    ${photosHtml?`<div class="photos">${photosHtml}</div>`:''}

    <h2>Servicio</h2>
    <div class="row"><span class="l">Falla reportada</span><span class="v">${escape(r.issue||'—')}</span></div>
    ${r.notes?`<div class="row"><span class="l">Notas</span><span class="v">${escape(r.notes)}</span></div>`:''}
    <div class="row"><span class="l">Ingreso</span><span class="v">${fmtDate(r.createdAt)}</span></div>
    ${r.dueDate?`<div class="row"><span class="l">Entrega prevista</span><span class="v">${fmtDate(r.dueDate)}</span></div>`:''}

    ${total!=null?`
    <div class="totals">
      <div class="row"><span class="l">Precio</span><span class="v">$ ${total.toFixed(2)}</span></div>
      <div class="row"><span class="l">Anticipo</span><span class="v">$ ${dep.toFixed(2)}</span></div>
      <div class="row total"><span class="l">Saldo a pagar</span><span class="v">$ ${saldo.toFixed(2)}</span></div>
    </div>`:''}

    <div class="signs">
      <div class="box">Firma del técnico</div>
      <div class="box">Firma del cliente</div>
    </div>

    <p class="legal">Conserve este comprobante. Es el único documento válido para reclamar su equipo.<br>
    Identificador único: <b>${escape(r.id)}</b> · Generado: ${fmtDateTime(Date.now())}</p>
  </div>

  <div class="actions">
    <button onclick="window.print()" class="primary">Imprimir</button>
    <button onclick="window.close()">Cerrar</button>
  </div>
</body></html>`;
    const w = window.open('', '_blank', 'width=720,height=900');
    if(!w){ UI.toast('Habilita ventanas emergentes para ver el ticket'); return; }
    w.document.write(html);
    w.document.close();
  }

  // ============= BUSCAR =============
  function search(){
    const sortKey = Views._searchSort || 'recent';
    view().innerHTML = `
      <div class="search-bar">${ICONS.search}
        <input id="searchInput" placeholder="Buscar cliente, equipo, teléfono o ID..." autofocus>
      </div>
      ${sortSelectHtml('searchSort', sortKey)}
      <div id="searchResults"></div>`;
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const sortSel = document.getElementById('searchSort');
    function render(q){
      const list = applySort(DB.search(q), Views._searchSort||'recent');
      results.innerHTML = list.length ? list.map(repairCard).join('') : emptyState('Sin resultados','Prueba con otro término');
      results.querySelectorAll('.repair-card').forEach(c=>c.addEventListener('click',e=>{
        if(e.target.closest('[data-stop]')) return;
        showRepair(c.dataset.id);
      }));
      results.querySelectorAll('[data-pick-phone]').forEach(b=>{
        b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); openPhonePicker(b.dataset.pickPhone); });
      });
    }
    render('');
    input.addEventListener('input', e=>render(e.target.value));
    sortSel.addEventListener('change', e=>{ Views._searchSort = e.target.value; render(input.value); });
  }


  // ============= ADMIN =============
  function admin(){
    const s = DB.settings;
    const g = s.github || {};
    const c = s.creator || {phone:'',whatsapp:''};
    // v57 — el handle local carga async de IndexedDB: al pintar admin puede
    // seguir vacío (bug «Cargar desde el archivo» deshabilitado). El binding
    // de la tarjeta (paintLocalCardState) lo re-chequea y habilita al llegar.
    let hasLocal = typeof LocalFile !== 'undefined' && LocalFile.hasHandle();
    const localSupported = typeof LocalFile !== 'undefined' && LocalFile.isSupported();
    // v54: frase secreta recordada (para mostrarla en el cuadro de compartir)
    let savedPhrase = '';
    try{ savedPhrase = localStorage.getItem('taller_cfg_phrase') || ''; }catch(_){}

    const menuItems = [
      {id:'adm-name',    t:'Nombre',          s:'Marca del sistema',      i:ICONS.edit},
      {id:'adm-logo',    t:'Logo',            s:'Imagen o ícono',         i:ICONS.camera},
      {id:'adm-creator', t:'Creador',         s:'Contactos en cabecera',  i:ICONS.phone},
      {id:'adm-pass',    t:'Contraseña',      s:'Acceso y seguridad',     i:ICONS.save},
      {id:'adm-recover', t:'Recuperación',    s:'Preguntas de seguridad', i:ICONS.search},
      {id:'adm-gh',      t:'GitHub',          s:'Respaldo en la nube',    i:ICONS.cloud},
      {id:'adm-local',   t:'Archivo local',   s:'Guardado en disco',      i:ICONS.save},
      {id:'adm-backup',  t:'Copia manual',    s:'Exportar / importar',    i:ICONS.upload},
      {id:'adm-devices', t:'Equipos',         s:'Catálogo de equipos',    i:ICONS.box},
      {id:'adm-products',t:'Productos',       s:'Piezas y artículos',     i:ICONS.box},
      {id:'adm-suppliers',t:'Proveedores',    s:'Contactos de repuestos', i:ICONS.box},
      {id:'adm-warranty',t:'Garantía',        s:'Días por defecto',       i:ICONS.check},
      {id:'adm-stats',   t:'Estadísticas',    s:'Ganancia · inversión',   i:ICONS.edit},
      {id:'adm-glossary',t:'Glosario',        s:'Términos del Resumen',   i:ICONS.search},
      {id:'adm-audit',   t:'Auditoría',       s:'Comprobar todo',         i:ICONS.cloud}
    ];
    const menuHtml = `
      <div class="admin-menu">
        ${menuItems.map(m=>`<button class="adm-tile" data-jump="${m.id}" type="button">
          <span class="adm-ico">${m.i}</span>
          <span class="adm-t">${escape(m.t)}</span>
          <span class="adm-s">${escape(m.s)}</span>
        </button>`).join('')}
      </div>`;

    view().innerHTML = `
      <h2 style="margin:0 0 10px;font-size:20px">Administración</h2>
      <p class="muted small" style="margin:0 0 14px">Toca un módulo para ir directo a esa configuración.</p>
      ${menuHtml}

      <div class="admin-card" id="adm-name">
        <h3>Nombre del sistema</h3>
        <p>La segunda palabra se mostrará en el color principal automáticamente.</p>
        <input id="appNameInput" class="input-pill" value="${escape(s.appName)}">
      </div>

      <div class="admin-card" id="adm-logo">
        <h3>Logo del sistema</h3>
        <p>Sube una imagen (PNG/JPG/SVG). Se mostrará en el inicio de sesión y en la cabecera. Si no eliges ninguna se usa el logo por defecto.</p>
        <div class="logo-upload">
          <div class="logo-preview" id="logoPreview">${s.logo?`<img src="${s.logo}">`:((App.getPresets&&App.getPresets().find(x=>x.key===(s.logoPreset||'tools')))||{svg:''}).svg}</div>
          <div class="logo-actions">
            <label class="btn-secondary btn-iconlbl">
              ${ICONS.upload}<span>Elegir imagen</span>
              <input type="file" id="logoFile" accept="image/*" hidden>
            </label>
            <button class="btn-secondary btn-iconlbl" id="logoReset">${ICONS.trash}<span>Restaurar por defecto</span></button>
          </div>
        </div>
        <p class="muted small" style="margin:14px 0 6px">O elige un icono por defecto:</p>
        <div class="preset-grid">
          ${(App.getPresets?App.getPresets():[]).map(p=>`
            <button type="button" class="preset-tile ${(!s.logo && (s.logoPreset||'tools')===p.key)?'active':''}" data-preset="${escape(p.key)}" title="${escape(p.name)}">
              <div class="preset-thumb">${p.svg}</div>
              <span>${escape(p.name)}</span>
            </button>`).join('')}
        </div>
      </div>


      <div class="admin-card" id="adm-creator">
        <h3>Datos del creador (opcional)</h3>
        <p>Se muestran como botones en la cabecera para llamar o enviar WhatsApp.</p>
        <div class="form-row">
          <div class="form-group">
            <label>Teléfono</label>
            <input id="creatorPhone" type="tel" inputmode="tel" placeholder="+53 5555 5555" value="${escape(c.phone||'')}">
          </div>
          <div class="form-group">
            <label>WhatsApp</label>
            <input id="creatorWa" type="tel" inputmode="tel" placeholder="+5355555555" value="${escape(c.whatsapp||'')}">
          </div>
        </div>
      </div>

      <div class="admin-card" id="adm-pass">
        <div class="row-between">
          <div style="flex:1;min-width:0"><h3>Pedir contraseña al entrar</h3><p>Si está apagado, no pedirá contraseña</p></div>
          <label class="switch"><input type="checkbox" id="reqPass" ${s.requirePassword?'checked':''}><span class="slider"></span></label>
        </div>
        <hr style="border:0;border-top:1px solid var(--border);margin:14px 0">
        <h3>Cambiar contraseña</h3>
        <p>Define una nueva contraseña de acceso</p>
        <div class="form-group"><div class="pwd-wrap"><input type="password" id="newPass" placeholder="Nueva contraseña"><button type="button" class="pwd-eye" data-pwd-toggle aria-label="Mostrar contraseña"><svg viewBox="0 0 24 24" class="ico eye-on"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg><svg viewBox="0 0 24 24" class="ico eye-off"><path d="M2 4.3L3.3 3l18 18-1.3 1.3-3-3A12 12 0 0 1 12 20C5 20 1 13 1 13a17 17 0 0 1 4.4-5.1L2 4.3zM12 8a5 5 0 0 1 5 5c0 .7-.1 1.3-.4 1.9l-2-2A3 3 0 0 0 12 10c-.3 0-.6 0-.9.1l-2-2C9.7 8 10.8 8 12 8zm0-3c7 0 11 7 11 7a17 17 0 0 1-3.2 4l-1.4-1.4A14 14 0 0 0 21 13s-3.5-6-9-6c-.8 0-1.5.1-2.2.3L8.3 5.9C9.5 5.3 10.7 5 12 5z"/></svg></button></div></div>
        <button class="btn-secondary" id="savePassBtn">Actualizar contraseña</button>
      </div>

      <div class="admin-card" id="adm-recover">
        <h3>Preguntas de seguridad</h3>
        <p>Configura preguntas personales (mascota, hobby preferido, ciudad de nacimiento, etc.). Te permitirán recuperar tu contraseña si la olvidas.</p>
        <div id="sqList" class="sq-list"></div>
        <button class="btn-secondary btn-inline" id="addSqBtn" style="margin-top:6px">${ICONS.plus} Añadir pregunta</button>
        <button class="btn-primary" id="saveSqBtn" style="margin-top:10px">Guardar preguntas</button>
        <p class="muted small" style="margin-top:8px">Recomendado: configura al menos 2 preguntas. Las respuestas no distinguen mayúsculas ni acentos.</p>
      </div>

      <div class="admin-card" id="adm-gh">
        <div class="row-between" style="margin-bottom:8px">
          <h3 style="margin:0">${ICONS.cloud} Sincronización GitHub</h3>
          <label class="switch"><input type="checkbox" id="ghEnabled" ${g.enabled?'checked':''}><span class="slider"></span></label>
        </div>
        <p>Cada reparación se guarda en su <b>propio archivo</b> dentro del repositorio (<code>repairs/Rxxxx.json</code>), con sus fotos, audio y texto aislados — nunca se mezcla con otras. Los ajustes y transacciones viajan en <code>index.json</code>.</p>
        <div class="form-row">
          <div class="form-group"><label>Usuario / org</label><input id="ghUser" value="${escape(g.user)}" placeholder="tu-usuario"></div>
          <div class="form-group"><label>Repositorio</label><input id="ghRepo" value="${escape(g.repo)}" placeholder="taller-datos"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Rama</label><input id="ghBranch" value="${escape(g.branch||'main')}" placeholder="main"></div>
          <div class="form-group"><label>Carpeta base</label><input id="ghPath" value="${escape(g.path||'taller-data')}" placeholder="taller-data"></div>
        </div>
        <div class="form-group"><label>Token (Fine-grained · Contents: read/write)</label><div class="pwd-wrap"><input id="ghToken" type="text" value="${escape(g.token||'')}" placeholder="github_pat_..."><button type="button" class="pwd-eye" data-pwd-toggle aria-label="Ocultar token"><svg viewBox="0 0 24 24" class="ico eye-off"><path d="M2 4.3L3.3 3l18 18-1.3 1.3-3-3A12 12 0 0 1 12 20C5 20 1 13 1 13a17 17 0 0 1 4.4-5.1L2 4.3zM12 8a5 5 0 0 1 5 5c0 .7-.1 1.3-.4 1.9l-2-2A3 3 0 0 0 12 10c-.3 0-.6 0-.9.1l-2-2C9.7 8 10.8 8 12 8zm0-3c7 0 11 7 11 7a17 17 0 0 1-3.2 4l-1.4-1.4A14 14 0 0 0 21 13s-3.5-6-9-6c-.8 0-1.5.1-2.2.3L8.3 5.9C9.5 5.3 10.7 5 12 5z"/></svg></button></div><p class="muted small" style="margin:4px 0 0">v65: el token se muestra VISIBLE para poder copiarlo/verificarlo de un vistazo; el ojo lo oculta si lo prefieres.</p></div>
        <div class="form-group">
          <label class="inline-check"><input type="checkbox" id="ghAuto" ${g.autoSync?'checked':''}> Sincronización automática al guardar</label>
        </div>

        <div class="gh-panel" id="ghPanel">
          <div class="gh-head">
            <span class="gh-dot"></span>
            <span class="gh-status" id="ghStatusText">Listo</span>
          </div>
          <div class="gh-actions">
            <button class="btn-secondary" id="ghFetchCfg" style="grid-column:1/-1">🔐 Traer configuración del taller (descifra y rellena)</button>
            <button class="btn-secondary" id="ghTest">${ICONS.check||''} Probar conexión</button>
            <button class="btn-secondary" id="ghPull">${ICONS.cloud} Bajar todo</button>
            <button class="btn-primary"   id="ghPush" style="grid-column:1/-1">${ICONS.save||''} Subir / sincronizar todo</button>
          </div>
          <div class="gh-progress" id="ghProgress"><i></i></div>
          <div class="gh-meta" id="ghMeta">
            <span class="pill">Repo<b id="mRepo">—</b></span>
            <span class="pill">Rama<b id="mBranch">—</b></span>
            <span class="pill">Base<b id="mBase">—</b></span>
            <span class="pill">Última sync<b id="mLast">${g.lastSyncAt?fmtDateTime(g.lastSyncAt):'nunca'}</b></span>
          </div>
          <div class="gh-log-actions">
            <button id="ghLogClear">Limpiar registro</button>
          </div>
          <div class="gh-log" id="ghLog" aria-live="polite"></div>
        </div>
      </div>

      ${typeof LocalFile !== 'undefined' ? `
      <div class="admin-card" id="adm-local">
        <h3>${ICONS.save} Guardar JSON en una ubicación</h3>
        <p>Elige un archivo local. Las fotos y audios viajan dentro del JSON — al mover ese archivo nunca pierdes información.</p>
        ${localSupported ? `
          <div class="btn-row">
            <button class="btn-secondary" id="pickLoc">${hasLocal?'Cambiar ubicación':'Elegir ubicación'}</button>
            <button class="btn-secondary" id="clearLoc" ${hasLocal?'':'disabled'}>Quitar ubicación</button>
          </div>
          <button class="btn-secondary" id="loadFromLoc" ${hasLocal?'':'disabled'} style="margin-top:8px">Cargar desde el archivo</button>
          <p class="muted small" style="margin-top:8px" id="localCardState">Estado: ${hasLocal?'<b>Ubicación configurada</b>':'sin configurar'}</p>
        ` : `<p class="muted small">Tu navegador no soporta elegir ubicación. Usa "Exportar JSON" en su lugar.</p>`}
      </div>` : ''}

      <div class="admin-card" id="adm-backup">
        <h3>Copia local (manual)</h3>
        <p>Exporta o importa el JSON manualmente. Contiene fotos + audios embebidos.</p>
        <div class="btn-row">
          <button class="btn-primary" id="exportLocBtn">Elegir ubicación y exportar todo…</button>
          <button class="btn-secondary" id="exportBtn">Exportar JSON</button>
          <button class="btn-secondary" id="importBtn">Importar JSON</button>
        </div>
        <input type="file" id="importFile" accept="application/json" style="display:none">
        <p class="muted small" id="exportLocHint" style="margin-top:8px">«Elegir ubicación…» abre el selector de tu equipo para guardar la copia donde TÚ decidas (PC). «Exportar JSON» la deja en la carpeta Descargas (móvil y PC).</p>
      </div>

      <div class="admin-card share-card" id="adm-share">
        <h3>📱 Datos hacia otros dispositivos (móvil)</h3>
        <p>Comparte la <b>configuración de conexión</b> (usuario, repositorio, rama y carpeta) en la nube del taller. Otro dispositivo que abra la app se conectará <b>sin teclear nada</b>: se le preguntará una única vez y descargará los datos automáticamente.</p>
        <div class="row-between" style="gap:12px;align-items:flex-start">
          <div style="flex:1">
            <label class="inline-check" style="margin-bottom:6px">
              <input type="checkbox" id="shareConfigChk" ${(s.githubShared && s.githubShared.user) ? 'checked' : ''}>
              Compartir configuración con otros dispositivos
            </label>
            <div class="form-row" style="margin:0">
              <div class="form-group" style="margin:0"><label>WhatsApp de contacto (opcional)</label>
                <input id="shareWhatsapp" inputmode="tel" placeholder="+58 412 0000000" value="${escape((s.githubShared&&s.githubShared.whatsapp)||'')}"></div>
            </div>
            <div class="form-group" style="margin-top:10px"><label>🔐 Frase secreta del taller (cifrado de la configuración)</label>
              <div class="pwd-wrap"><input id="sharePhrase" type="password" placeholder="Ej: mi taller 48228" value="${escape(savedPhrase||'')}"><button type="button" class="pwd-eye" data-pwd-toggle aria-label="Mostrar frase"><svg viewBox="0 0 24 24" class="ico eye-on"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 1 0-6z"/></svg><svg viewBox="0 0 24 24" class="ico eye-off"><path d="M2 4.3L3.3 3l18 18-1.3 1.3-3-3A12 12 0 0 1 12 20C5 20 1 13 1 13a17 17 0 0 1 4.4-5.1L2 4.3zM12 8a5 5 0 0 1 5 5c0 .7-.1 1.3-.4 1.9l-2-2A3 3 0 0 0 12 10c-.3 0-.6 0-.9.1l-2-2C9.7 8 10.8 8 12 8zm0-3c7 0 11 7 11 7a17 17 0 0 1-3.2 4l-1.4-1.4A14 14 0 0 0 21 13s-3.5-6-9-6c-.8 0-1.5.1-2.2.3L8.3 5.9C9.5 5.3 10.7 5 12 5z"/></svg></button></div>
              <p class="muted small" style="margin:6px 0 0">Con la frase, la configuración viaja <b>cifrada</b> (AES-GCM) por Pages y los móviles del taller se rellenan solos. Sin frase, viaja sin cifrar (formato antiguo).</p>
            </div>
            <label class="inline-check" style="margin-top:10px">
              <input type="checkbox" id="shareTokenChk" ${(s.githubShared && s.githubShared.shareToken) ? 'checked' : ''}>
              Incluir también el <b>token</b> en el cifrado (los móviles del taller podrán editar)
            </label>
            ${ (s.githubShared && s.githubShared.user) ? `
            <p class="muted small" style="margin-top:8px">
              Compartiendo: <b>${escape(s.githubShared.user)}/${escape(s.githubShared.repo)}</b> · carpeta <code>${escape(s.githubShared.path)}</code>${s.githubSharedAt?` · desde ${fmtDateTime(s.githubSharedAt)}`:''}
            </p>` : ''}
          </div>
        </div>
        <button class="btn-primary" id="shareConfigBtn" style="margin-top:10px">Guardar preferencia</button>
      </div>

      <div class="admin-card danger-card" id="adm-reset">
        <h3>⚠️ Zona peligrosa</h3>
        <p>Reinicia <b>TODO el sistema</b> a su estado inicial de fábrica: reparaciones, fotos, audios, movimientos, catálogos, contraseña y ajustes. Esta acción no se puede deshacer.</p>
        <label class="inline-check" style="margin-bottom:10px">
          <input type="checkbox" id="resetWipeCloudChk">
          Borrar TAMBIÉN la copia de la nube (GitHub) — requiere conexión y token
        </label>
        <button class="btn-primary btn-cancel" id="resetSystemBtn">Reiniciar todo el sistema</button>
      </div>

      <div class="admin-card" id="adm-devices">
        <h3>Equipos disponibles</h3>
        <p>Aparecen como sugerencias al registrar una reparación</p>
        <div class="chip-list" id="deviceTypes">
          ${s.deviceTypes.map(d=>`<span class="chip-static">${escape(d)} <button data-rm-dev="${escape(d)}">×</button></span>`).join('')}
        </div>
        <div class="form-row" style="margin-top:10px">
          <div class="form-group" style="margin:0"><input id="newDeviceType" placeholder="Nuevo equipo (ej. Soundbar)"></div>
          <div class="form-group" style="margin:0"><button class="btn-secondary" id="addDeviceBtn">Añadir</button></div>
        </div>
      </div>

      ${typeof DB.suppliers !== 'undefined' ? `
      <details class="admin-card collapsible-card sup-collapse" id="adm-suppliers">
        <summary>
          <span class="adm-collapse-title">
            <span class="adm-collapse-ico sup-ico">${ICONS.box}</span>
            <span>🧰 Proveedores de piezas <span class="sup-count-badge" id="supCountBadge">${(DB.suppliers||[]).length}</span></span>
          </span>
          <span class="adm-collapse-chev" aria-hidden="true">▾</span>
        </summary>
        <div class="adm-collapse-body">
          <p class="muted small" style="margin:0 0 12px">Contactos de donde consigues repuestos: datos completos, varios teléfonos (llamada y SMS), piezas que vende, notas. Se sincronizan con todos los dispositivos.</p>
          <div class="btn-row" style="margin:0 0 12px">
            <button class="btn-primary" id="supAddBtn">${ICONS.plus} Nuevo proveedor</button>
          </div>
          <div class="sup-search-bar">
            ${ICONS.search.replace('class="ico"','class="ico sup-search-ico"')}
            <input id="supSearch" type="search" autocomplete="off" placeholder="Buscar por nombre, empresa, teléfono o pieza…" aria-label="Buscar proveedores">
            <button type="button" id="supClearBtn" class="sup-clear ${''}" title="Limpiar búsqueda" aria-label="Limpiar búsqueda">×</button>
          </div>
          <div id="supList"></div>
          <p class="muted small" id="supCount" style="margin:8px 0 0"></p>
        </div>
      </details>` : ''}

      <div class="admin-card" id="adm-products">
        <h3>Productos para ventas y compras</h3>
        <p>Aparecen como sugerencias al registrar un movimiento</p>
        <div class="chip-list" id="productTypes">
          ${(s.productTypes||[]).map(d=>`<span class="chip-static">${escape(d)} <button data-rm-prod="${escape(d)}">×</button></span>`).join('')}
        </div>
        <div class="form-row" style="margin-top:10px">
          <div class="form-group" style="margin:0"><input id="newProductType" placeholder="Nuevo producto (ej. Cable HDMI)"></div>
          <div class="form-group" style="margin:0"><button class="btn-secondary" id="addProductBtn">Añadir</button></div>
        </div>
      </div>

      <div class="admin-card" id="adm-warranty">
        <h3>Garantía por defecto</h3>
        <p>Días que se rellenarán automáticamente al crear una reparación nueva.</p>
        <input id="defWarranty" type="number" min="0" step="1" inputmode="numeric" class="input-pill" value="${s.defaultWarrantyDays!=null?s.defaultWarrantyDays:7}">
      </div>

      <div class="admin-card" id="adm-stats">
        <h3>Estadísticas</h3>
        <p>Las estadísticas de <b>ganancia</b>, <b>ingresos</b>, <b>servicios</b> y <b>costos</b> se muestran ahora en la sección <b>Resumen</b>. La gestión de compras, ventas, stock y alertas vive en <b>Compra/Venta</b>.</p>
        <div class="btn-row">
          <button class="btn-secondary" id="goSummaryBtn">Ir a Resumen</button>
          <button class="btn-secondary" id="goStatsBtn">Ir a Compra/Venta</button>
        </div>
      </div>

      <details class="admin-card audit-card collapsible-card" id="adm-glossary">
        <summary>
          <span class="adm-collapse-title"><span class="adm-collapse-ico">${ICONS.search}</span> Glosario del Resumen</span>
          <span class="adm-collapse-chev" aria-hidden="true">▾</span>
        </summary>
        <div class="adm-collapse-body">
        <p>Significado de cada término que aparece en la sección <b>Resumen</b>. Explicado fácil para que sepas qué mide cada cifra.</p>
        <div class="audit-legend">
          <div class="legend-block">
            <span class="legend-tag tag-sum">📊 Términos</span>
            <ul>
              <li><b>Ganancia neta</b>: el dinero que de verdad te quedó después de restar todo lo que te costó. Fórmula: <i>(ventas + servicios) − (costo mercancía + piezas usadas)</i>.</li>
              <li><b>Ganancia total acumulada</b>: la ganancia neta sumada desde el primer día hasta hoy.</li>
              <li><b>Ingresos</b>: todo el dinero que entró (ventas + servicios cobrados). Aún no resta los costos.</li>
              <li><b>Ventas</b>: dinero que recibiste vendiendo productos del inventario.</li>
              <li><b>Servicios</b>: dinero cobrado por reparaciones <b>entregadas</b>. Las que están pendientes no cuentan aquí.</li>
              <li><b>Costo de mercancía</b>: lo que tú pagaste por los productos que ya vendiste. Solo se descuenta cuando la venta se hace.</li>
              <li><b>Piezas usadas</b>: lo que costaron las piezas puestas en reparaciones entregadas.</li>
              <li><b>Costos</b>: la suma del costo de mercancía + piezas usadas. Es todo lo que “te costó” generar tus ingresos.</li>
              <li><b>Compras stock</b>: dinero que invertiste comprando piezas o productos. <i>No</i> resta ganancia hasta que los uses o vendas — es inversión.</li>
              <li><b>Movimientos</b>: cantidad de operaciones registradas (ventas, compras y reparaciones) en el periodo.</li>
              <li><b>Pendiente de cobrar</b>: reparaciones terminadas pero aún no entregadas; ese dinero todavía no entró.</li>
            </ul>
          </div>
          <div class="legend-block legend-note">
            <p><b>Regla simple:</b> <i>Ganancia = lo que entró − lo que costó</i>. Las <b>compras de stock</b> son inversión, no gasto.</p>
          </div>
        </div>
        </div>
      </details>


      <details class="admin-card audit-card collapsible-card" id="adm-audit">
        <summary>
          <span class="adm-collapse-title"><span class="adm-collapse-ico">${ICONS.cloud}</span> Auditoría del sistema</span>
          <span class="adm-collapse-chev" aria-hidden="true">▾</span>
        </summary>
        <div class="adm-collapse-body">
        <p>Recalcula <b>todo</b> el sistema desde cero: compras, ventas, reparaciones, piezas y stock — y te avisa si algo no cuadra. Se ejecuta también automáticamente cada vez que entras.</p>
        <button class="btn-primary btn-audit" id="runAuditBtn" type="button">
          <span class="audit-ico">${ICONS.check}</span>
          <span>Calcular todo el sistema</span>
        </button>
        <p class="muted small" style="margin-top:10px">Comprueba: cuentas de ventas y compras, ganancia, piezas usadas, stock disponible, reparaciones entregadas sin precio, fechas inválidas y más.</p>

        <div class="audit-legend">
          <h4>¿Qué significan las secciones <b>Resumen</b> y <b>Compra/Venta</b>?</h4>
          <p class="muted small">Explicado fácil, como a un niño: el sistema lleva la cuenta del dinero que <b>entra</b> (lo que cobras) y del dinero que <b>sale</b> (lo que pagas), y te dice cuánto ganaste de verdad.</p>

          <div class="legend-block">
            <span class="legend-tag tag-sum">📊 Resumen</span>
            <p>Es como el <b>boletín de notas</b> de tu taller. Aquí solo <b>miras</b>, no escribes nada.</p>
            <ul>
              <li><b>Ganancia total acumulada</b>: la suma de todo lo que ganaste desde el primer día (ventas + reparaciones − lo que te costó la mercancía y las piezas).</li>
              <li><b>Contabilidad e ingresos</b>: divide el dinero por periodos (hoy, semana, mes, año y total). En cada uno ves:
                <ul>
                  <li><i>Ventas (entró)</i>: dinero que recibiste vendiendo productos.</li>
                  <li><i>Servicios (entró)</i>: dinero que cobraste por reparaciones <b>entregadas</b>.</li>
                  <li><i>Costo mercancía</i>: lo que tú pagaste por lo que vendiste.</li>
                  <li><i>Piezas usadas</i>: lo que costaron las piezas que pusiste en reparaciones.</li>
                  <li><i>Compras stock</i>: lo que invertiste comprando piezas (no resta ganancia hasta que las vendas o las uses).</li>
                  <li><i>Movimientos</i>: cuántas ventas, compras y reparaciones hubo.</li>
                </ul>
              </li>
              <li><b>Reparaciones cobradas</b>: solo dinero de reparaciones <b>entregadas</b>. Las que aún no entregaste salen como “pendiente de cobrar”.</li>
              <li><b>Ganancias por mes y año</b>: una tabla con cada mes mostrando ganancia de reparaciones, ventas con inversión (ingreso − costo) y ventas sin inversión (ingreso completo).</li>
            </ul>
          </div>

          <div class="legend-block">
            <span class="legend-tag tag-cv">🛒 Compra/Venta</span>
            <p>Es la <b>caja registradora</b> y el <b>almacén</b>. Aquí sí <b>anotas</b> cada movimiento de productos.</p>
            <ul>
              <li><b>Nueva venta</b>: registras lo que vendiste (producto, cantidad, precio y, si quieres, cuánto te costó). Esto <b>descuenta</b> piezas del stock y suma el dinero a tus ingresos.</li>
              <li><b>Nueva compra</b>: registras piezas que compraste para tu inventario. Esto <b>suma</b> piezas al stock y se contabiliza como <i>inversión</i> (no como gasto perdido).</li>
              <li><b>Total de ventas</b> y <b>Total de compras</b>: dos tarjetas que muestran hoy, semana, mes, año y total. Al tocarlas se abren con la lista detallada de cada movimiento.</li>
              <li><b>Stock y alertas</b>: cuántas unidades te quedan de cada producto. Si pones un <i>mínimo</i>, te avisa cuando bajas de él.</li>
              <li><b>Lista de movimientos</b>: el historial completo, ordenado por fecha, con filtro para ver solo ventas, solo compras o todo.</li>
            </ul>
          </div>

          <div class="legend-block legend-note">
            <p><b>Regla simple:</b> lo que escribes en <b>Compra/Venta</b> y en <b>Reparaciones</b> alimenta automáticamente lo que ves en <b>Resumen</b>. Por eso el Resumen siempre cuadra solo si los movimientos están bien registrados — y para eso sirve este botón de auditoría.</p>
          </div>
        </div>
        </div>
      </details>
    `;

    // Menú elegante: scroll suave a cada sección
    view().querySelectorAll('[data-jump]').forEach(b=>{
      b.onclick = ()=>{
        const el = document.getElementById(b.dataset.jump);
        if(!el) return;
        if(el.tagName === 'DETAILS') el.open = true;
        el.scrollIntoView({behavior:'smooth', block:'start'});
        el.classList.add('flash');
        setTimeout(()=>el.classList.remove('flash'), 1500);
      };
    });

    // === Preguntas de seguridad ===
    const sq = (s.securityQuestions||[]).map(x=>({ q:x.q||'', aHash:x.aHash||null, a:'' }));
    if(!sq.length) sq.push({q:'',a:'',aHash:null});
    const SQ_PRESETS = ['¿Nombre de tu primera mascota?','¿Cuál es tu hobby preferido?','¿Ciudad donde naciste?','¿Mejor amigo de la infancia?','¿Comida favorita?','¿Nombre de tu madre?','¿Modelo de tu primer teléfono?','¿Película favorita?'];
    function renderSq(){
      const wrap = document.getElementById('sqList'); if(!wrap) return;
      const dlOpts = SQ_PRESETS.map(p=>`<option value="${escape(p)}">`).join('');
      wrap.innerHTML = sq.map((it,i)=>`
        <div class="sq-row" data-si="${i}">
          <input class="sq-q" list="sqPresets" placeholder="Pregunta" value="${escape(it.q||'')}" data-sf="q" data-si="${i}">
          <input class="sq-a" type="text" placeholder="${it.aHash?'(respuesta guardada — escribe para cambiar)':'Respuesta'}" data-sf="a" data-si="${i}">
          ${sq.length>1?`<button type="button" class="icon-btn-sm" data-rm-sq="${i}" aria-label="Quitar">${ICONS.trash}</button>`:''}
        </div>
      `).join('') + `<datalist id="sqPresets">${dlOpts}</datalist>`;
      wrap.querySelectorAll('input[data-si]').forEach(inp=>{
        inp.addEventListener('input', e=>{
          const i = +inp.dataset.si; const f = inp.dataset.sf;
          sq[i][f] = inp.value;
        });
      });
      wrap.querySelectorAll('[data-rm-sq]').forEach(b=>{
        b.onclick = ()=>{ sq.splice(+b.dataset.rmSq,1); if(!sq.length) sq.push({q:'',a:'',aHash:null}); renderSq(); };
      });
    }
    renderSq();
    document.getElementById('addSqBtn').onclick = ()=>{ sq.push({q:'',a:'',aHash:null}); renderSq(); };
    document.getElementById('saveSqBtn').onclick = async ()=>{
      const out = [];
      for(const it of sq){
        const q = (it.q||'').trim(); if(!q) continue;
        let aHash = it.aHash;
        if((it.a||'').trim()){ aHash = await DB.hashAnswer(it.a); }
        if(!aHash) continue;
        out.push({ q, aHash });
      }
      if(!out.length){ UI.toast('Añade al menos una pregunta con respuesta'); return; }
      DB.setSecurityQuestions(out);
      UI.toast('Preguntas guardadas');
      admin();
    };

    const gs = document.getElementById('goStatsBtn');
    if(gs) gs.onclick = ()=> App.go('sales');
    const gsm = document.getElementById('goSummaryBtn');
    if(gsm) gsm.onclick = ()=> App.go('summary');
    const auditBtn = document.getElementById('runAuditBtn');
    if(auditBtn) auditBtn.onclick = ()=> Views.openAudit();




    document.getElementById('appNameInput').addEventListener('change', e=>{
      DB.updateSettings({ appName: e.target.value.trim() || 'Taller' });
      App.applyBrand();
      UI.toast('Nombre actualizado');
    });

    // Logo
    document.getElementById('logoFile').addEventListener('change', async e=>{
      const f = e.target.files[0]; if(!f) return;
      try{
        // Resize a 256px máx, calidad alta — el logo queda pequeño y nítido
        const dataUrl = await UI.resizeImage(f, 256, 0.92);
        DB.updateSettings({ logo: dataUrl });
        App.applyBrand();
        admin(); // re-render para actualizar preview y botón
        UI.toast('Logo actualizado');
      }catch(err){ UI.toast('No se pudo procesar la imagen'); }
    });
    document.getElementById('logoReset').addEventListener('click', async ()=>{
      const ok = await UI.confirmDialog({
        title:'Restaurar logo',
        message:'¿Volver al logo por defecto del sistema?',
        okText:'Restaurar', cancelText:'Cancelar'
      });
      if(!ok) return;
      DB.updateSettings({ logo: null, logoPreset: 'tools' });
      App.applyBrand(); admin(); UI.toast('Logo restaurado');
    });
    document.querySelectorAll('[data-preset]').forEach(b=>{
      b.onclick = ()=>{
        DB.updateSettings({ logo: null, logoPreset: b.dataset.preset });
        App.applyBrand(); admin(); UI.toast('Logo actualizado');
      };
    });
    function saveCreator(){
      DB.updateCreator({
        phone: document.getElementById('creatorPhone').value.trim(),
        whatsapp: document.getElementById('creatorWa').value.trim()
      });
      App.applyBrand();
    }
    document.getElementById('creatorPhone').addEventListener('change', saveCreator);
    document.getElementById('creatorWa').addEventListener('change', saveCreator);

    document.getElementById('reqPass').addEventListener('change', e=>{
      DB.updateSettings({ requirePassword: e.target.checked });
      UI.toast(e.target.checked?'Contraseña activada':'Contraseña desactivada');
    });
    document.getElementById('savePassBtn').addEventListener('click', async ()=>{
      const v = document.getElementById('newPass').value;
      if(v.length<3) return UI.toast('Mínimo 3 caracteres');
      await Auth.setPassword(v);
      document.getElementById('newPass').value = '';
      UI.toast('Contraseña actualizada');
    });

    function readGh(){
      return {
        enabled: document.getElementById('ghEnabled').checked,
        user: document.getElementById('ghUser').value.trim(),
        repo: document.getElementById('ghRepo').value.trim(),
        branch: document.getElementById('ghBranch').value.trim() || 'main',
        path: document.getElementById('ghPath').value.trim() || 'taller-data.json',
        token: document.getElementById('ghToken').value.trim(),
        autoSync: document.getElementById('ghAuto').checked
      };
    }
    ['ghEnabled','ghUser','ghRepo','ghBranch','ghPath','ghToken','ghAuto'].forEach(id=>{
      document.getElementById(id).addEventListener('change', ()=> DB.updateGithub(readGh()));
    });
    // ===== Panel moderno: log en vivo, progreso, estado =====
    const panel = document.getElementById('ghPanel');
    const logEl = document.getElementById('ghLog');
    const statusEl = document.getElementById('ghStatusText');
    const progressEl = document.getElementById('ghProgress');
    const progressBar = progressEl ? progressEl.querySelector('i') : null;
    const mRepo = document.getElementById('mRepo');
    const mBranch = document.getElementById('mBranch');
    const mBase = document.getElementById('mBase');
    const mLast = document.getElementById('mLast');
    function updateMeta(){
      const gg = DB.settings.github;
      mRepo.textContent = (gg.user && gg.repo) ? `${gg.user}/${gg.repo}` : '—';
      mBranch.textContent = gg.branch || 'main';
      mBase.textContent = GitSync.basePath();
      mLast.textContent = gg.lastSyncAt ? fmtDateTime(gg.lastSyncAt) : 'nunca';
    }
    updateMeta();
    function setStatus(level, txt){
      panel.classList.remove('gh-on','gh-err','gh-busy');
      if(level) panel.classList.add('gh-'+level);
      if(txt) statusEl.textContent = txt;
    }
    function setProgress(done,total){
      if(!progressEl) return;
      if(!total){ progressEl.classList.remove('on'); progressBar.style.width='0%'; return; }
      progressEl.classList.add('on');
      const pct = Math.min(100, Math.round(done*100/total));
      progressBar.style.width = pct+'%';
      if(done>=total) setTimeout(()=>{ progressEl.classList.remove('on'); progressBar.style.width='0%'; }, 700);
    }
    function fmtTime(ms){
      const d = new Date(ms);
      return d.toLocaleTimeString('es-ES',{hour12:false}) + '.' + String(d.getMilliseconds()).padStart(3,'0').slice(0,3);
    }
    function renderLog(entries){
      const html = entries.slice(-200).map(e =>
        `<div class="gh-line lv-${e.level}"><span class="gh-t">${fmtTime(e.t)}</span><span class="gh-tag">${escape(e.tag)}</span><span class="gh-msg">${escape(e.msg)}</span></div>`
      ).join('');
      logEl.innerHTML = html;
      logEl.scrollTop = logEl.scrollHeight;
    }
    const unsubLog = GitLog.subscribe(renderLog);
    // Cancela una suscripción previa para evitar fugas al re-renderizar admin
    if(window.__ghUnsub) try{ window.__ghUnsub(); }catch(_){}
    window.__ghUnsub = unsubLog;
    document.getElementById('ghLogClear').onclick = ()=> GitLog.clear();

    async function runOp(name, fn){
      setStatus('busy', name+'…');
      try{
        const res = await fn();
        setStatus('on', name+' OK');
        UI.toast(name+' completada');
        updateMeta();
        return res;
      }catch(e){
        GitLog.err('error', e.message);
        setStatus('err', 'Error: '+e.message);
        UI.toast('Error: '+e.message);
      }
    }

    document.getElementById('ghTest').onclick = ()=>{
      DB.updateGithub(readGh());
      runOp('Conexión', ()=> GitSync.test());
    };
    document.getElementById('ghPush').onclick = async ()=>{
      DB.updateGithub(readGh());
      try{
        const p = await GitSync.getPendingPush();
        if(p.total === 0){
          UI.toast('No hay cambios nuevos para subir');
          return;
        }
        if(!confirm('¿Quieres subir la información al servidor de GitHub?')) return;
        runOp('Subida', ()=> GitSync.push({ onProgress:setProgress }));
      }catch(e){
        UI.toast('Error: '+e.message);
      }
    };
    document.getElementById('ghPull').onclick = async ()=>{
      DB.updateGithub(readGh());
      try{
        UI.toast('Comprobando cambios en GitHub…');
        const p = await GitSync.getPendingPull();
        if(p.total === 0){
          UI.toast('Ya estás al día: no hay cambios en GitHub');
          return;
        }
        if(!confirm('¿Quieres bajar la información del servidor de GitHub?')) return;
        runOp('Descarga', ()=> GitSync.pull({ onProgress:setProgress }));
      }catch(e){
        UI.toast('Error: '+e.message);
      }
    };

    if(typeof LocalFile !== 'undefined' && localSupported){
      // v57 — repinta la tarjeta del archivo local cuando el handle async
      // termina de cargar (corrige «Cargar desde el archivo» deshabilitado).
      function paintLocalCardState(){
        const st = document.getElementById('localCardState');
        const lfBtn = document.getElementById('loadFromLoc');
        const clr = document.getElementById('clearLoc');
        const ok = LocalFile.hasHandle();
        if(st) st.innerHTML = 'Estado: ' + (ok?'<b>Ubicación configurada</b>':'sin configurar');
        if(lfBtn) lfBtn.disabled = !ok;
        if(clr) clr.disabled = !ok;
      }
      if(!hasLocal){
        try{
          LocalFile.loadHandle().then(()=>{ hasLocal = true; paintLocalCardState(); });
        }catch(_){}
      }
      // v61 — además: repintar ya al abrir Admin por si el handle llegó
      // entre el paint y ahora (carrera con sync.js loadHandle()).
      try{
        if(!hasLocal && LocalFile.hasHandle()) paintLocalCardState();
      }catch(_){}
      const pl = document.getElementById('pickLoc');
      if(pl) pl.onclick = async ()=>{
        try{
          await LocalFile.pickLocation();
          // v65 — el estado YA no depende de la carrera con IndexedDB:
          // pickLocation garantiza cachedHandle (memoria) aunque el guardado
          // persistente falle; repintar tras resolver de verdad.
          UI.toast('Ubicación guardada');
          paintLocalCardState();
          try{ window.dispatchEvent(new Event('localfile-ready')); }catch(_){}
        }
        catch(e){ if(e.name!=='AbortError') UI.toast('Error: '+e.message); }
      };
      const clr = document.getElementById('clearLoc');
      if(clr) clr.onclick = async ()=>{
        try{ await LocalFile.clearHandle(); }catch(_){}
        UI.toast('Ubicación quitada');
        paintLocalCardState();
      };
      const lf = document.getElementById('loadFromLoc');
      if(lf) lf.onclick = async ()=>{
        try{
          // v61 — Asegurar primero que el handle async de IndexedDB ya cargó:
          // al abrir Administración justo tras arrancar, la carrera dejaba el
          // botón muerto aunque hubiera ubicación guardada.
          try{ await LocalFile.loadHandle(); }catch(_){}
          if(!LocalFile.hasHandle()){
            UI.toast('Primero elige la ubicación del archivo con «Elegir ubicación»');
            return;
          }
          const text = await LocalFile.readText();
          if(text==null){
            // v61 — recuperación guiada: si el archivo se movió/borró o el
            // permiso cayó, ofrecer RE-ELEGIR la ubicación al instante en
            // vez de dejar al usuario sin camino.
            const ok = await UI.confirmDialog({
              title:'No se pudo leer el archivo',
              message:'La ubicación guardada ya no es legible (¿se movió, borró o cambió de permiso?). ¿Elegir de nuevo dónde está el archivo?',
              okText:'Elegir de nuevo', cancelText:'Cancelar'
            });
            if(ok){
              try{
                await LocalFile.pickLocation();
                UI.toast('Ubicación guardada · cargando…');
                const t2 = await LocalFile.readText();
                if(t2!=null) askImportMode(t2);
              }catch(e2){ if(e2.name!=='AbortError') UI.toast('Error: '+e2.message); }
            }
            return;
          }
          askImportMode(text);
        }
        catch(e){ UI.toast('Error: '+e.message); }
      };
    }

    // v61 — «Cargar desde el archivo» no funcionaba: sync.js EMITE
    // 'localfile-ready' cuando el handle termina de cargar desde IndexedDB,
    // pero NADIE lo escuchaba → si Administración se pintaba antes de que
    // loadHandle() resolviera, la tarjeta quedaba congelada en «sin
    // configurar» y el botón deshabilitado PARA SIEMPRE aunque hubiera
    // ubicación guardada. Este listener repinta la tarjeta en vivo, tanto si
    // Admin ya está abierto como si el handle llega tarde (y también tras
    // guardar una ubicación desde otra vista).
    if(!window.__localFileReadyBound){
      window.__localFileReadyBound = true;
      window.addEventListener('localfile-ready', ()=>{
        if(typeof LocalFile === 'undefined') return;
        const st = document.getElementById('localCardState');
        if(st && LocalFile.hasHandle()){
          st.innerHTML = 'Estado: <b>Ubicación configurada</b>';
          const lfBtn = document.getElementById('loadFromLoc');
          const clrBtn = document.getElementById('clearLoc');
          if(lfBtn) lfBtn.disabled = false;
          if(clrBtn) clrBtn.disabled = false;
        }
      });
    }

    // v56 — IMPORTAR SEGURO: antes de tocar nada se pre-lee el JSON y se
    // muestra un resumen del archivo frente al contenido actual. "Añadir"
    // fusiona sin duplicar (opción destacada, no pierde nada); "Reemplazar
    // todo" exige DOS confirmaciones con el conteo exacto de lo que se
    // PERDERÁ, porque borra todos los datos actuales del dispositivo.
    async function askImportMode(text){
      let file = null;
      try{
        file = typeof text==='string' ? JSON.parse(text) : text;
      }catch(_){ UI.toast('Archivo inválido (JSON ilegible)'); return; }
      if(!file || (!Array.isArray(file.repairs) && !Array.isArray(file.transactions))){
        UI.toast('Archivo inválido: no contiene reparaciones ni movimientos');
        return;
      }
      const fileReps  = Array.isArray(file.repairs) ? file.repairs.length : 0;
      const fileTxs   = Array.isArray(file.transactions) ? file.transactions.length : 0;
      const curReps   = DB.repairs.length;
      const curTxs    = (DB.transactions||[]).length;
      const newReps   = file.repairs ? file.repairs.filter(r=>r && r.id && !DB.repairs.some(x=>x.id===r.id)).length : 0;
      const newTxs    = file.transactions ? file.transactions.filter(t=>t && t.id && !(DB.transactions||[]).some(x=>x.id===t.id)).length : 0;
      const dupReps   = fileReps - newReps;
      const dupTxs    = fileTxs - newTxs;

      const wrap = document.createElement('div');
      wrap.className = 'confirm-overlay';
      wrap.innerHTML = `
        <div class="confirm-card" role="dialog" aria-modal="true">
          <h3>Importar JSON</h3>
          <p style="margin-bottom:8px">El archivo trae <b>${fileReps} reparación(es)</b> y <b>${fileTxs} movimiento(s)</b>.<br>
          Ahora mismo tienes <b>${curReps} reparación(es)</b> y <b>${curTxs} movimiento(s)</b> en este dispositivo.</p>
          <p class="muted small" style="margin:0 0 12px">Elige cómo cargarlo:</p>
          <div class="btn-row" style="flex-wrap:wrap;gap:8px">
            <button class="btn-secondary" data-act="cancel">Cancelar (no tocar nada)</button>
            <button class="btn-primary" data-act="merge">Añadir al existente ${ (newReps||newTxs) ? `(+${newReps} rep · +${newTxs} mov)` : '(todo ya existe)' }</button>
            <button class="btn-primary btn-cancel" data-act="replace">Reemplazar TODO</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const close = ()=> wrap.remove();
      wrap.addEventListener('click', async ev2=>{
        if(ev2.target===wrap){ close(); return; }
        const act = ev2.target.closest('[data-act]')?.dataset.act;
        if(!act) return;
        if(act==='cancel'){ close(); return; }
        if(act==='replace'){
          // DOBLE CONFIRMACIÓN — primera: qué se pierde exactamente.
          const first = await UI.confirmDialog({
            title:'¿Reemplazar todos los datos?',
            message:`Se BORRARÁN los ${curReps} reparación(es) y ${curTxs} movimiento(s) actuales, con TODAS sus fotos, audios y firmas. En su lugar quedarán solo los ${fileReps} reparación(es) y ${fileTxs} movimiento(s) del archivo.`,
            okText:'Sí, reemplazar', cancelText:'Cancelar', danger:true
          });
          if(!first){ close(); return; }
          // Segunda: verificación final con acción explícita.
          const second = await UI.confirmDialog({
            title:'Última confirmación',
            message:'¿Estás SEGURO? No se puede deshacer: se pierden los datos actuales. Si dudas, cancela y usa "Añadir al existente" (no pierde nada), o exporta antes una copia con "Exportar JSON".',
            okText:'Reemplazar definitivamente', cancelText:'Mejor no', danger:true
          });
          if(!second){ close(); return; }
          if(DB.importJson(text)){ UI.toast('Datos reemplazados'); App.refresh(); }
          else UI.toast('Archivo inválido');
        } else if(act==='merge'){
          const res = DB.mergeJson(text);
          if(res && res.ok){
            const msg = [`${res.added.repairs} rep y ${res.added.transactions} mov añadidos`];
            if(dupReps > 0 || dupTxs > 0) msg.push(`${dupReps} rep y ${dupTxs} mov ya existían (no duplicados)`);
            UI.toast('✓ ' + msg.join(' · '));
            App.refresh();
          } else UI.toast('Archivo inválido');
        }
        close();
      });
    }
    // Expuesta para pruebas E2E y para que LocalFile.loadFromFile pueda
    // redirigir aquí en lugar de reemplazar datos sin preguntar.
    window.__askImportMode = askImportMode;

    document.getElementById('exportBtn').onclick = ()=>{ DB.exportJson(); UI.toast('Descargado'); };
    // v56e — EXPORTAR TODO ELIGIENDO UBICACIÓN: resumen previo de lo que
    // contiene la copia (para saber qué se protege) y selector del sistema
    // para guardar donde el técnico decida. En móvil (sin File System Access)
    // se explica y se cae a la descarga clásica.
    const exportLoc = document.getElementById('exportLocBtn');
    if(exportLoc) exportLoc.onclick = async ()=>{
      const s = DB.exportSummary();
      const kb = (s.bytes/1024).toFixed(1);
      const msg = `La copia incluirá: ${s.repairs} reparación(es) · ${s.transactions} compra/venta · ${s.pendings} pendiente(s) · ${s.suppliers} proveedor(es) · ${s.fotos} foto(s) · ${s.audios} audio(s) · ajustes y contraseña (${kb} KB).` +
        ( ('showSaveFilePicker' in window)
          ? ' Elige la carpeta y el nombre en el diálogo que se abrirá.'
          : ' Tu navegador guardará la copia en Descargas: muévela luego a donde quieras (memoria, nube, PC).' );
      const ok = await UI.confirmDialog({ title:'Exportar copia de seguridad', message:msg, okText:'Continuar', cancelText:'Cancelar' });
      if(!ok) return;
      if('showSaveFilePicker' in window){
        try{
          const r = await DB.exportWithPicker();
          UI.toast('Copia guardada: ' + r.name);
        }catch(e){
          if(e.name!=='AbortError') UI.toast('Error: '+e.message);
        }
      } else {
        DB.exportJson();
        UI.toast('Copia descargada (carpeta Descargas)');
      }
    };
    document.getElementById('importBtn').onclick = ()=> document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = e=>{
      const f = e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = ev=> askImportMode(ev.target.result);
      reader.readAsText(f);
      // Permite reimportar el mismo archivo
      e.target.value = '';
    };

    // ===== v5/v54: Compartir configuración con otros dispositivos =====
    const shareBtn = document.getElementById('shareConfigBtn');
    if(shareBtn) shareBtn.onclick = ()=>{
      const chk = document.getElementById('shareConfigChk').checked;
      const wa = document.getElementById('shareWhatsapp').value.trim();
      const phEl = document.getElementById('sharePhrase');
      const phrase = phEl ? phEl.value.trim() : '';
      const shareToken = document.getElementById('shareTokenChk')
        ? document.getElementById('shareTokenChk').checked : false;
      if(chk){
        const g = DB.settings.github;
        if(!g.user || !g.repo){ UI.toast('Completa primero la Sincronización GitHub (usuario y repositorio)'); return; }
        if(shareToken && !g.token){
          UI.toast('Para incluir el token, guarda primero el token en la Sincronización GitHub');
          return;
        }
        DB.setGithubShared({
          user:g.user, repo:g.repo, branch:g.branch||'main',
          path:g.path||'taller-data', whatsapp:wa,
          // v54: frase secreta y consentimiento de token viajan en el
          // bloque compartido; el TOKEN en sí solo se empaqueta al
          // construir el payload cifrado (nunca en claro).
          phrase: phrase || '', shareToken: !!shareToken
        });
        if(phrase){
          // Recordar la frase también como clave local de descifrado
          try{ localStorage.setItem('taller_cfg_phrase', phrase); }catch(_){}
          UI.toast('✓ Configuración compartida y CIFRADA: el próximo móvil solo escribe la frase');
        } else {
          UI.toast('✓ Configuración compartida (sin cifrar): añade una frase secreta para cifrarla');
        }
        // Publicar config.json de inmediato si hay conexión y token
        if(GitSync.cfgOk() && g.autoSync){ GitSync.schedulePush(); }
        admin();
      } else {
        if(DB.settings.githubShared){
          DB.setGithubShared(null);
          UI.toast('Configuración ya no se comparte (la existente en la nube se quita al sincronizar)');
          admin();
        } else {
          UI.toast('Sin cambios');
        }
      }
    };

    // ===== v54: Descifrar config.json del servidor y RELLENAR los cuadros =====
    // Flujo manual: "trae la configuración del taller y ponla en los
    // cuadros de usuario/repo/rama/carpeta/token" — evita re-teclearlo
    // todo cuando el dispositivo ya tiene la app instalada.
    const fetchCfgBtn = document.getElementById('ghFetchCfg');
    if(fetchCfgBtn) fetchCfgBtn.onclick = async ()=>{
      fetchCfgBtn.disabled = true;
      const old = fetchCfgBtn.textContent;
      fetchCfgBtn.textContent = 'Descifrando…';
      try{
        // Lee el config publicado por Pages (ruta relativa al despliegue)
        const paths = ['taller-data/config.json', './taller-data/config.json'];
        let txt = null;
        for(const p of paths){
          try{
            const resp = await fetch(p, { cache:'no-store' });
            if(resp.ok){ txt = await resp.text(); break; }
          }catch(_){}
        }
        if(txt == null){ UI.toast('No hay config.json publicado en la nube'); return; }
        let cfg = null;
        if(CryptoCfg.isEncrypted(txt)){
          // Pedir la frase (o usar la recordada) y descifrar
          let phrase = '';
          try{ phrase = localStorage.getItem('taller_cfg_phrase') || ''; }catch(_){}
          for(let attempt=0; attempt<2 && !cfg; attempt++){
            if(!phrase){
              phrase = await new Promise(resolve=>{
                const wrap = document.createElement('div');
                wrap.className = 'confirm-overlay';
                wrap.innerHTML = `
                  <div class="confirm-card" role="dialog" aria-modal="true">
                    <h3>🔐 Frase secreta del taller</h3>
                    <p style="line-height:1.55">La configuración de la nube viaja <b>cifrada</b>.
                    Escribe la frase para descifrarla y autorrellenar los cuadros.</p>
                    <div class="form-group" style="margin:0 0 12px">
                      <input type="password" id="edrPhrase2" placeholder="Frase secreta" autocomplete="off" style="width:100%;box-sizing:border-box">
                    </div>
                    <div class="btn-row">
                      <button class="btn-secondary" data-act="no">Cancelar</button>
                      <button class="btn-primary" data-act="yes">Descifrar</button>
                    </div>
                  </div>`;
                document.body.appendChild(wrap);
                const inp = wrap.querySelector('#edrPhrase2');
                if(inp) setTimeout(()=>{ try{ inp.focus(); }catch(_){} }, 50);
                const close = v => { wrap.remove(); resolve(v); };
                wrap.addEventListener('click', e=>{
                  if(e.target===wrap){ close(null); return; }
                  const act = e.target.closest('[data-act]')?.dataset.act;
                  if(act==='yes') close(inp ? inp.value.trim() : '');
                  if(act==='no') close(null);
                });
                wrap.addEventListener('keydown', e=>{
                  if(e.key==='Enter'){ e.preventDefault(); close(inp ? inp.value.trim() : ''); }
                });
              });
              if(phrase == null){ return; } // cancelado
            }
            try{
              cfg = JSON.parse(await CryptoCfg.decrypt(txt, phrase));
              try{ localStorage.setItem('taller_cfg_phrase', phrase); }catch(_){}
            }catch(e){ phrase = ''; if(attempt===0) UI.toast('Frase secreta incorrecta'); }
          }
        } else {
          try{ cfg = JSON.parse(txt); }catch(_){}
        }
        if(!cfg || cfg.kind !== 'taller-config'){
          UI.toast('El config.json de la nube no es válido');
          return;
        }
        // RELLENAR los cuadros de texto, legibles, tal cual llegaron:
        const put = (id, v)=>{ const el = document.getElementById(id); if(el && v!=null) el.value = v; };
        put('ghUser', cfg.user || '');
        put('ghRepo', cfg.repo || '');
        put('ghBranch', cfg.branch || 'main');
        put('ghPath', cfg.path || 'taller-data');
        if(cfg.token) put('ghToken', cfg.token);
        // Guardar en DB los valores adoptados (guardado normal):
        DB.updateGithub({
          enabled:true,
          user:cfg.user||'', repo:cfg.repo||'',
          branch:cfg.branch||'main', path:cfg.path||'taller-data',
          token:cfg.token||'', autoSync:true
        });
        UI.toast(cfg.token
          ? '✓ Configuración descifrada y cuadros rellenados (token incluido)'
          : '✓ Configuración descifrada y cuadros rellenados');
        admin();
      }catch(e){
        UI.toast('No se pudo descifrar la configuración');
      }finally{
        fetchCfgBtn.disabled = false;
        fetchCfgBtn.textContent = old;
      }
    };

    // ===== v5: RESET TOTAL del sistema (doble confirmación) =====
    const resetBtn = document.getElementById('resetSystemBtn');
    if(resetBtn) resetBtn.onclick = async ()=>{
      const wipeCloud = document.getElementById('resetWipeCloudChk').checked;
      const stats = DB.repairs.length, txs = DB.transactions.length;
      // --- Confirmación 1: resumen de lo que se pierde ---
      const ok1 = await UI.confirmDialog({
        title:'Reiniciar todo el sistema',
        message:`Se borrarán ${stats} reparación(es), ${txs} movimiento(s), las fotos, los audios, el inventario, la contraseña y todos los ajustes de ESTE dispositivo.${wipeCloud?' También se eliminará la copia guardada en GitHub (la nube quedará vacía).':''}\n\nEsta acción no se puede deshacer. ¿Continuar?`,
        okText:'Sí, continuar', cancelText:'Cancelar', danger:true
      });
      if(!ok1) return;
      // --- Confirmación 2: escribir la palabra REINICIAR ---
      const ok2 = await new Promise(resolve=>{
        const wrap = document.createElement('div');
        wrap.className = 'confirm-overlay';
        wrap.innerHTML = `
          <div class="confirm-card" role="dialog" aria-modal="true">
            <h3>Confirmación final</h3>
            <p>Escribe la palabra <b>REINICIAR</b> para confirmar que entiendes que todos los datos se perderán para siempre.</p>
            <input id="resetWordInput" class="reset-word-input" autocomplete="off" autocapitalize="characters" placeholder="Escribe REINICIAR">
            <div class="btn-row" style="margin-top:12px">
              <button class="btn-secondary" data-act="cancel">Cancelar</button>
              <button class="btn-primary btn-cancel" data-act="ok" disabled id="resetWordOk">Reiniciar</button>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        const inp = wrap.querySelector('#resetWordInput');
        const okB = wrap.querySelector('#resetWordOk');
        inp.addEventListener('input', ()=>{ okB.disabled = inp.value.trim().toUpperCase() !== 'REINICIAR'; });
        const close = v => { wrap.remove(); resolve(v); };
        wrap.addEventListener('click', e=>{
          if(e.target===wrap){ close(false); return; }
          const act = e.target.closest('[data-act]')?.dataset.act;
          if(act==='ok' && !okB.disabled) close(true);
          if(act==='cancel') close(false);
        });
      });
      if(!ok2) return;

      // --- Ejecutar ---
      let cloudResult = null;
      if(wipeCloud){
        try{
          UI.toast('Borrando la copia en GitHub…', 4000);
          cloudResult = await GitSync.wipeRemote();
        }catch(e){
          const okRetry = await UI.confirmDialog({
            title:'No se pudo borrar la nube',
            message:'Error: '+e.message+'\n\n¿Reiniciar igualmente este dispositivo (la nube se borrará la próxima vez que funcione la conexión)?',
            okText:'Sí, reiniciar local', cancelText:'Cancelar', danger:true
          });
          if(!okRetry) return;
        }
      }
      DB.resetAll();
      Auth.logout();
      try{ GitSync.stopAutoPull(); }catch(_){}
      UI.toast(cloudResult ? '✓ Sistema reiniciado · nube vacía ('+cloudResult.deleted+' archivos)' : '✓ Sistema reiniciado a su estado inicial', 3500);
      // Recargar la app completa: estado limpio, primer acceso
      setTimeout(()=>{ window.location.reload(); }, 1200);
    };


    document.getElementById('addDeviceBtn').onclick = ()=>{
      const v = document.getElementById('newDeviceType').value;
      if(DB.addDeviceType(v)){ UI.toast('Equipo añadido'); admin(); }
      else UI.toast('Vacío o duplicado');
    };
    document.querySelectorAll('[data-rm-dev]').forEach(b=>{
      b.onclick = ()=>{ DB.removeDeviceType(b.dataset.rmDev); admin(); };
    });

    document.getElementById('addProductBtn').onclick = ()=>{
      const v = document.getElementById('newProductType').value;
      if(DB.addProductType(v)){
        document.getElementById('newProductType').value = '';
        UI.toast('Producto añadido'); admin();
      } else UI.toast('Vacío o duplicado');
    };
    document.querySelectorAll('[data-rm-prod]').forEach(b=>{
      b.onclick = ()=>{ DB.removeProductType(b.dataset.rmProd); admin(); };
    });
    document.getElementById('defWarranty').addEventListener('change', e=>{
      const v = Math.max(0, parseInt(e.target.value,10)||0);
      DB.updateSettings({ defaultWarrantyDays: v });
      UI.toast('Garantía por defecto actualizada');
    });

    // v68 — PROVEEDORES DE PIEZAS: barra de búsqueda RE-HECHA (antes un
    // input plano con emoji pegado al placeholder, sin lupa ni botón de
    // limpiar): ahora es una barra estilo «Buscar» del taller: lupa a la
    // izquierda, botón × que limpia (y solo aparece cuando hay texto), y
    // además ABRIMOS el desplegable si el técnico toca el acceso rápido
    // del menú. La tarjeta entera es encojible (details/summary plegada
    // por defecto, con el conteo visible en la cabecera).
    const supSearchEl = document.getElementById('supSearch');
    if(supSearchEl){
      const supClearBtn = document.getElementById('supClearBtn');
      const supBadge = document.getElementById('supCountBadge');
      const paint = ()=>{
        const q = supSearchEl.value;
        if(supClearBtn) supClearBtn.classList.toggle('show', !!q);
        const list = DB.searchSuppliers(q);
        renderSuppliersList(list, q);
      };
      supSearchEl.addEventListener('input', paint);
      if(supClearBtn) supClearBtn.onclick = ()=>{
        supSearchEl.value = '';
        supSearchEl.focus();
        paint();
      };
      // Enter no debe re-enviar nada (input suelto dentro de un details)
      supSearchEl.addEventListener('keydown', e=>{ if(e.key==='Enter') e.preventDefault(); });
      document.getElementById('supAddBtn').onclick = ()=> supplierForm(null);
      // badge vivo en la cabecera plegada
      if(supBadge) supBadge.textContent = (DB.suppliers||[]).length;
      paint();
    }
  }

  // v66 — render de la lista de proveedores (dentro de Administración):
  function renderSuppliersList(list, q){
    const box = document.getElementById('supList');
    const count = document.getElementById('supCount');
    if(!box) return;
    if(!list.length){
      box.innerHTML = `<p class="muted small">${q?'Ningún proveedor coincide con «'+escape(q)+'»':'Aún no hay proveedores. Pulsa «Nuevo proveedor» para agregar el primero.'}</p>`;
    } else {
      box.innerHTML = list.map(s=>{
        const phones = (s.phones||[]).filter(Boolean);
        return `
        <div class="sup-card" data-sup-id="${escape(s.id)}">
          <div class="pend-row">
            <div class="pend-info" style="flex:1;min-width:0">
              <h3>${escape(s.name||'Proveedor')}</h3>
              ${s.company?`<p class="sup-company">🏢 ${escape(s.company)}</p>`:''}
              ${phones.length ? `
              <div class="card-phones">
                ${phones.map(ph=>`
                  <a class="phone-link" href="tel:${escape(UI.phoneClean(ph))}">${ICONS.phone}<span>${escape(ph)}</span></a>
                  <a class="mini-action sms" href="sms:${escape(UI.phoneSms(ph))}" title="SMS a ${escape(ph)}">${ICONS.sms}<span>SMS</span></a>`).join('')}
              </div>` : ''}
              ${s.email?`<p class="muted small" style="margin:4px 0 0">✉️ ${escape(s.email)}</p>`:''}
              ${s.address?`<p class="muted small" style="margin:2px 0 0">📍 ${escape(s.address)}</p>`:''}
              ${s.notes?`<p class="muted small" style="margin:2px 0 0">📝 ${escape(s.notes)}</p>`:''}
              ${(s.parts&&s.parts.length)?`<div class="sup-parts">${s.parts.map(pt=>`<span class="chip-static">${escape(pt)}</span>`).join('')}</div>`:''}
              <p class="sup-meta">ID ${escape(s.id)}${s.updatedAt?' · actualizado '+fmtDateTime(s.updatedAt):''}</p>
            </div>
            <div class="pend-actions" style="align-self:flex-start">
              <button type="button" class="pend-act" data-sup-edit="${escape(s.id)}" title="Editar proveedor">${ICONS.edit}</button>
              <button type="button" class="pend-act danger" data-sup-del="${escape(s.id)}" title="Eliminar proveedor">${ICONS.trash}</button>
            </div>
          </div>
        </div>`;
      }).join('');
      // bindings de editar / eliminar
      box.querySelectorAll('[data-sup-edit]').forEach(b=>{
        b.onclick = e=>{ e.stopPropagation(); supplierForm(DB.findSupplier(b.dataset.supEdit)); };
      });
      box.querySelectorAll('[data-sup-del]').forEach(b=>{
        b.onclick = async e=>{
          e.stopPropagation();
          const s = DB.findSupplier(b.dataset.supDel);
          const ok = await UI.confirmDialog({
            title:'Eliminar proveedor',
            message:`¿Eliminar a ${s&&s.name?escape(s.name):'este proveedor'}${s&&s.company?' ('+escape(s.company)+')':''}? Esta acción no se puede deshacer.`,
            okText:'Eliminar', cancelText:'Cancelar', danger:true
          });
          if(!ok) return;
          DB.deleteSupplier(b.dataset.supDel);
          UI.toast('Proveedor eliminado');
          admin();
        };
      });
    }
    if(count) count.textContent = list.length + ' proveedor(es)' + (q?' · búsqueda: «'+q+'»':'') + ' · sincronizados con todos los dispositivos';
    // v68 — mantener vivo el badge de la cabecera (visible plegada)
    const supBadge = document.getElementById('supCountBadge');
    if(supBadge) supBadge.textContent = list.length + ((q && list.length !== (DB.suppliers||[]).length) ? '/'+(DB.suppliers||[]).length : '');
  }

  // v66 — formulario de proveedor (crear / editar) con multi-teléfono y piezas:
  function supplierForm(existing){
    const s = existing || {};
    const initPhones = (Array.isArray(s.phones) && s.phones.length ? s.phones : (s.phone?[s.phone]:[])).filter(Boolean);
    let phoneCount = Math.max(1, initPhones.length);
    let partCount = (s.parts&&s.parts.length) ? s.parts.length : 0;
    const phoneField = (i,val)=>`
      <div class="pend-phone-row" data-prow="${i}">
        <input name="supPhones" inputmode="tel" value="${escape(val||'')}" placeholder="+58 412 0000000">
        ${i>0?'<button type="button" class="pend-phone-rm" data-rm-phone="1" title="Quitar teléfono">×</button>':''}
      </div>`;
    const partField = (i,val)=>`
      <div class="pend-phone-row" data-partrow="${i}">
        <input name="supParts" value="${escape(val||'')}" placeholder="Ej. Pantalla LG 43\"">
        ${i>0?'<button type="button" class="pend-phone-rm" data-rm-part="1" title="Quitar pieza">×</button>':''}
      </div>`;
    view().innerHTML = `
      <button type="button" class="form-close" id="formCloseTop" title="Cerrar">${ICONS.close}</button>
      <h2 style="margin:0 0 16px;font-size:20px;padding-right:50px">${existing?'Editar proveedor':'Nuevo proveedor de piezas'}</h2>
      <form id="supplierFormEl" novalidate>
        <div class="form-group">
          <label>Nombre / contacto *</label>
          <input name="name" required autocapitalize="words" value="${escape(s.name||'')}" placeholder="Ej. José Hernández">
        </div>
        <div class="form-group">
          <label>Empresa / negocio</label>
          <input name="company" autocapitalize="words" value="${escape(s.company||'')}" placeholder="Ej. Repuestos Electrónica CR">
        </div>
        <div class="form-group">
          <label>Teléfonos <span class="muted small">(varios: llamada y SMS a cada uno)</span></label>
          <div id="supPhonesBox">${initPhones.map((ph,i)=>phoneField(i,ph)).join('')||phoneField(0,'')}</div>
          <button type="button" class="btn-secondary btn-inline" id="supAddPhone" style="margin-top:6px">${ICONS.plus} Añadir teléfono</button>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input name="email" type="email" value="${escape(s.email||'')}" placeholder="proveedor@ejemplo.com">
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <textarea name="address" rows="2" placeholder="Dónde está el local">${escape(s.address||'')}</textarea>
        </div>
        <div class="form-group">
          <label>Piezas que vende</label>
          <div id="supPartsBox">${partCount?s.parts.map((pt,i)=>partField(i,pt)).join(''):''}</div>
          <button type="button" class="btn-secondary btn-inline" id="supAddPart" style="margin-top:6px">${ICONS.plus} Añadir pieza</button>
        </div>
        <div class="form-group">
          <label>Notas (precios, horarios, condiciones…)</label>
          <textarea name="notes" rows="3" placeholder="Ej. entrega a domicilio, solo efectivo, horario 8am-4pm">${escape(s.notes||'')}</textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn-primary">${existing?'Guardar cambios':'Agregar proveedor'}</button>
          <button type="button" class="btn-secondary" id="cancelSupBtn">Cancelar</button>
        </div>
      </form>
    `;
    const phonesBox = document.getElementById('supPhonesBox');
    const partsBox = document.getElementById('supPartsBox');
    document.getElementById('supAddPhone').onclick = ()=>{
      phonesBox.insertAdjacentHTML('beforeend', phoneField(phoneCount,''));
      bindRm(); phoneCount++;
    };
    if(!partCount){
      partsBox.innerHTML = partField(0,''); partCount = 1;
    }
    document.getElementById('supAddPart').onclick = ()=>{
      partsBox.insertAdjacentHTML('beforeend', partField(partCount,''));
      bindRm(); partCount++;
    };
    function bindRm(){
      phonesBox.querySelectorAll('[data-rm-phone]').forEach(b=>{ b.onclick = ()=>b.closest('[data-prow]').remove(); });
      partsBox.querySelectorAll('[data-rm-part]').forEach(b=>{ b.onclick = ()=>b.closest('[data-partrow]').remove(); });
    }
    bindRm();
    document.getElementById('formCloseTop').onclick = ()=> App.go('admin');
    document.getElementById('cancelSupBtn').onclick = ()=> App.go('admin');
    document.getElementById('supplierFormEl').addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = (fd.get('name')||'').trim();
      if(!name){ UI.toast('Escribe el nombre del proveedor'); return; }
      const phones = [...phonesBox.querySelectorAll('input[name="supPhones"]')].map(i=>i.value.trim()).filter(Boolean);
      const parts = [...partsBox.querySelectorAll('input[name="supParts"]')].map(i=>i.value.trim()).filter(Boolean);
      const data = {
        name,
        company: (fd.get('company')||'').trim() || null,
        phones,
        phone: phones[0] || null,
        email: (fd.get('email')||'').trim() || null,
        address: (fd.get('address')||'').trim() || null,
        parts,
        notes: (fd.get('notes')||'').trim() || null
      };
      if(existing){
        DB.updateSupplier(existing.id, data);
        UI.toast('Proveedor actualizado');
      } else {
        const ns = DB.addSupplier(data);
        UI.toast('Proveedor agregado: ' + ns.id);
      }
      App.go('admin');
    });
  }

  // ============= VENTAS Y COMPRAS =============
  const TX_FILTERS = [
    {k:'all', label:'Todo'},
    {k:'sale', label:'Ventas'},
    {k:'purchase', label:'Compras'}
  ];
  function txLabel(t){ return t==='sale' ? 'Venta' : 'Compra'; }

  // Calcula estadísticas combinadas (ventas + compras + reparaciones + piezas) por periodo.
  function computeAllStats(){
    const now = new Date();
    const t0 = new Date(now); t0.setHours(0,0,0,0);
    const wd = (t0.getDay()+6)%7;
    const w0 = new Date(t0); w0.setDate(w0.getDate()-wd);
    const m0 = new Date(t0.getFullYear(), t0.getMonth(), 1);
    const y0 = new Date(t0.getFullYear(), 0, 1);

    const empty = ()=>({
      salesIncome:0, salesCost:0,        // ventas y su costo de mercancía
      purchases:0,                        // inversión en compras de stock
      repairIncome:0, repairPartsCost:0,  // reparaciones entregadas y costo de piezas usadas
      countSales:0, countPurchases:0, countRepairs:0,
      pendingRepair:0                     // por cobrar (no entregadas)
    });
    const buckets = { day:empty(), week:empty(), month:empty(), year:empty(), total:empty() };
    function inAll(ts, fn){
      fn(buckets.total);
      if(ts>=y0.getTime()) fn(buckets.year);
      if(ts>=m0.getTime()) fn(buckets.month);
      if(ts>=w0.getTime()) fn(buckets.week);
      if(ts>=t0.getTime()) fn(buckets.day);
    }
    for(const tx of DB.transactions){
      const ts = tx.date || tx.createdAt || 0;
      const total = Number(tx.total||0);
      if(tx.type==='sale'){
        const cost = Number(tx.costTotal||0);
        inAll(ts, b=>{ b.salesIncome+=total; b.salesCost+=cost; b.countSales++; });
      } else {
        inAll(ts, b=>{ b.purchases+=total; b.countPurchases++; });
      }
    }
    for(const r of DB.repairs){
      const price = Number(r.price||0);
      const partsCost = (r.parts||[]).reduce((a,p)=> a + Number(p.unitCost||0)*Number(p.qty||0), 0);
      if(r.status==='delivered'){
        const ts = r.deliveredAt || r.updatedAt || r.createdAt || 0;
        inAll(ts, b=>{ b.repairIncome+=price; b.repairPartsCost+=partsCost; b.countRepairs++; });
      } else if(r.status!=='cancelled' && r.status!=='no_devolution' && price>0){
        // v61 — «sin devolución» tampoco va a «por cobrar»: el equipo se
        // considera no reclamado (está en su propia lista del Resumen).
        const dep = Number(r.deposit||0);
        buckets.total.pendingRepair += Math.max(0, price - dep);
      }
    }
    // Derivados
    for(const k in buckets){
      const b = buckets[k];
      b.salesProfit = b.salesIncome - b.salesCost;
      b.repairProfit = b.repairIncome - b.repairPartsCost;
      b.totalProfit = b.salesProfit + b.repairProfit;
      b.totalIncome = b.salesIncome + b.repairIncome;
      b.totalInvested = b.salesCost + b.repairPartsCost; // dinero realmente convertido en ingresos
    }
    return buckets;
  }

  function computeRepairStats(){
    const a = computeAllStats();
    return {
      dT:a.day.repairIncome, wT:a.week.repairIncome, mT:a.month.repairIncome, yT:a.year.repairIncome,
      total:a.total.repairIncome, pending:a.total.pendingRepair, countDel:a.total.countRepairs
    };
  }
  function totalProfitNow(){
    try { return computeAllStats().total.totalProfit || 0; } catch(e){ return 0; }
  }

  function txCard(t){
    const isSale = t.type==='sale';
    const sign = isSale ? '+' : '-';
    const cls = isSale ? 'sale' : 'purchase';
    const qty = Number(t.quantity||0);
    const unit = Number(t.unitPrice||0);
    const total = Number(t.total||0);
    const cp = t.counterparty ? ` · ${escape(t.counterparty)}` : '';
    let profitHtml = '';
    if(isSale && t.costTotal != null){
      const profit = total - Number(t.costTotal||0);
      const pcls = profit>=0 ? 'pos' : 'neg';
      profitHtml = `<span class="tx-profit ${pcls}">Ganancia $ ${profit.toFixed(2)}</span>`;
    } else if(!isSale){
      profitHtml = `<span class="tx-profit neg">Inversión $ ${total.toFixed(2)}</span>`;
    }
    // v61 — Plegable: fila compacta (badge+nombre+monto+chevron) y el
    // resto del detalle desplegable. Así se ven MÁS entradas por pantalla
    // y se lee mejor; tocar la fila abre el detalle completo sin perder
    // ningún dato.
    return `
      <div class="tx-card ${cls} collapsed" data-tx-id="${escape(t.id)}">
        <div class="tx-collapse-row">
          <div class="tx-info">
            <div class="tx-head">
              <span class="tx-badge ${cls}">${txLabel(t.type)}</span>
              <h3>${escape(t.product||'Producto')}</h3>
            </div>
          </div>
          <div class="tx-side">
            <span class="tx-amount ${cls}">${sign} $ ${total.toFixed(2)}</span>
            <span class="tx-chev" aria-hidden="true"></span>
          </div>
        </div>
        <div class="tx-details">
          <div class="tx-details-inner">
            <p class="muted small">${qty} × $ ${unit.toFixed(2)}${cp}</p>
            <p class="muted small">${fmtDate(t.date||t.createdAt)} ${profitHtml}</p>
            <p class="muted small tx-id">${escape(t.id)}</p>
          </div>
        </div>
      </div>`;
  }

  // v61 — Plegado/despliegue de tarjetas de Compra/Venta: tocar la fila
  // alterna el detalle (y mantiene un tarjeta abierta como máximo para leer
  // rápido varias seguidas). El CHEVRON de la fila indica el estado.
  function bindTxCards(){
    view().querySelectorAll('.tx-card').forEach(c=>{
      c.querySelector('.tx-collapse-row').addEventListener('click', e=>{
        if(e.target.closest('a,button,input')) return;
        const open = c.classList.contains('open');
        view().querySelectorAll('.tx-card.open').forEach(o=>o.classList.remove('open'));
        if(!open) c.classList.add('open');
        c.classList.toggle('collapsed', !c.classList.contains('open'));
      });
      // Los botones de acción (si aparecieran dentro) no alternan el pliegue
      c.addEventListener('click', e=>{
        if(e.target.closest('.tx-collapse-row')) return;
        showTransaction(c.dataset.txId);
      });
    });
  }

  // Accordion ligero — clickea cabecera para abrir/cerrar
  function bindAccordions(root){
    (root||view()).querySelectorAll('[data-acc]').forEach(head=>{
      head.addEventListener('click', ()=>{
        const card = head.closest('.acc-card');
        if(!card) return;
        card.classList.toggle('open');
      });
    });
  }

  function fmtMoney(v){ return '$ '+Number(v||0).toFixed(2); }

  // Etiquetas con descripción humana del rango temporal
  function periodInfo(){
    const now = new Date();
    const t0 = new Date(now); t0.setHours(0,0,0,0);
    const wd = (t0.getDay()+6)%7;
    const w0 = new Date(t0); w0.setDate(w0.getDate()-wd);
    const m0 = new Date(t0.getFullYear(), t0.getMonth(), 1);
    const y0 = new Date(t0.getFullYear(), 0, 1);
    const fd = d => d.toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
    return {
      day:   `Solo el día de hoy (${fd(t0)})`,
      week:  `Desde el lunes ${fd(w0)} hasta hoy`,
      month: `Desde el día 1 (${fd(m0)}) hasta hoy`,
      year:  `Desde el 1 de enero (${fd(y0)}) hasta hoy`,
      total: 'Suma de todo lo registrado, sin límite de fecha'
    };
  }

  function sysStatsTilesHtml(){
    const s = computeRepairStats();
    const p = periodInfo();
    return `
      <p class="muted small" style="margin:0 0 10px">
        Dinero que has <b>cobrado</b> por reparaciones <b>entregadas</b>.
        Solo cuenta cuando marcas el equipo como <b>Entregado</b>.
      </p>
      <div class="earn-grid">
        <div class="earn-tile" title="${escape(p.day)}"><span class="el">Hoy</span><span class="ev">${fmtMoney(s.dT)}</span><span class="er">${escape(p.day)}</span></div>
        <div class="earn-tile" title="${escape(p.week)}"><span class="el">Esta semana</span><span class="ev">${fmtMoney(s.wT)}</span><span class="er">${escape(p.week)}</span></div>
        <div class="earn-tile" title="${escape(p.month)}"><span class="el">Este mes</span><span class="ev">${fmtMoney(s.mT)}</span><span class="er">${escape(p.month)}</span></div>
        <div class="earn-tile" title="${escape(p.year)}"><span class="el">Este año</span><span class="ev">${fmtMoney(s.yT)}</span><span class="er">${escape(p.year)}</span></div>
        <div class="earn-tile gold" title="${escape(p.total)}"><span class="el">Total cobrado</span><span class="ev">${fmtMoney(s.total)}</span><span class="er">${escape(p.total)}</span></div>
        <div class="earn-tile pending" title="Reparaciones aún no entregadas con precio definido"><span class="el">Pendiente de cobrar</span><span class="ev">${fmtMoney(s.pending)}</span><span class="er">Reparaciones aún sin entregar</span></div>
      </div>
      <p class="muted small" style="margin-top:12px">Reparaciones entregadas: <b>${s.countDel}</b> · Total registradas: <b>${DB.repairs.length}</b></p>`;
  }

  function cvStatsTilesHtml(){
    const stats = computeAllStats();
    const p = periodInfo();
    function tile(label, b, rangeHelp, accent){
      const pcls = b.totalProfit>=0 ? 'pos' : 'neg';
      const movs = b.countSales+b.countPurchases+b.countRepairs;
      return `<div class="cv-tile ${accent||''}">
        <div class="cv-tile-head">
          <span class="cv-tile-label">${escape(label)}</span>
          <span class="cv-tile-profit ${pcls}" title="Ganancia neta: lo que entró menos lo que costó">${fmtMoney(b.totalProfit)}</span>
        </div>
        <p class="cv-range">${escape(rangeHelp)}</p>
        <div class="cv-tile-grid">
          <div class="cv-mini sale" title="Dinero recibido por ventas de productos"><span>Ventas (entró)</span><b>${fmtMoney(b.salesIncome)}</b></div>
          <div class="cv-mini repair" title="Dinero cobrado por reparaciones entregadas"><span>Servicios (entró)</span><b>${fmtMoney(b.repairIncome)}</b></div>
          <div class="cv-mini cost" title="Cuánto te costó a ti la mercancía que vendiste"><span>Costo mercancía</span><b>${fmtMoney(b.salesCost)}</b></div>
          <div class="cv-mini cost" title="Cuánto costaron las piezas usadas en reparaciones"><span>Piezas usadas</span><b>${fmtMoney(b.repairPartsCost)}</b></div>
          <div class="cv-mini buy" title="Dinero gastado en compras de stock"><span>Compras stock</span><b>${fmtMoney(b.purchases)}</b></div>
          <div class="cv-mini count" title="Número de operaciones registradas en el periodo"><span>Movimientos</span><b>${movs}</b></div>
        </div>
      </div>`;
    }
    return `
      <p class="muted small" style="margin:0 0 10px">
        Resumen del dinero que entró, lo que te costó y la <b>ganancia neta</b> en cada periodo.
        Cada bloque te dice exactamente desde qué fecha cuenta.
      </p>
      <div class="cv-grid">
        ${tile('Hoy', stats.day, p.day)}
        ${tile('Esta semana', stats.week, p.week)}
        ${tile('Este mes', stats.month, p.month)}
        ${tile('Este año', stats.year, p.year)}
        ${tile('Total histórico', stats.total, p.total, 'gold')}
      </div>
      <div class="cv-legend">
        <b>¿Cómo se calcula?</b>
        <ul>
          <li><b>Ganancia</b> = (Ventas − Costo mercancía) + (Servicios − Piezas usadas).</li>
          <li><b>Ventas</b>: total facturado por los productos que vendiste.</li>
          <li><b>Servicios</b>: precio de las reparaciones <i>entregadas</i> al cliente.</li>
          <li><b>Costo mercancía</b> y <b>Piezas usadas</b>: lo que tú pagaste por esos artículos.</li>
          <li><b>Compras stock</b>: inversión total en comprar piezas (no resta de la ganancia hasta que las vendas o las uses).</li>
          <li><b>Movimientos</b>: cantidad de ventas, compras y reparaciones entregadas en ese periodo.</li>
        </ul>
      </div>`;
  }


  function stockPanelHtml(){
    const stats = DB.productStats();
    const items = Object.values(stats).sort((a,b)=>{
      // alerta primero
      const la = (a.min>0 && a.stock<=a.min) ? 0 : 1;
      const lb = (b.min>0 && b.stock<=b.min) ? 0 : 1;
      if(la!==lb) return la-lb;
      return a.name.localeCompare(b.name,'es');
    });
    if(!items.length) return `<p class="muted small">Aún no hay productos con movimientos. Registra una compra o usa una pieza en una reparación para ver el stock.</p>`;
    const lowCount = items.filter(i=> i.min>0 && i.stock<=i.min).length;
    const rows = items.map(i=>{
      const isLow = i.min>0 && i.stock<=i.min;
      const cls = isLow ? 'low' : (i.stock<=0 ? 'zero' : '');
      return `<div class="stk-row ${cls}">
        <div class="stk-main">
          <span class="stk-name">${escape(i.name)}</span>
          <span class="stk-tags">
            <span class="stk-tag in">+${i.purchased}</span>
            <span class="stk-tag out">−${i.sold+i.usedInRepairs}</span>
            ${isLow?'<span class="stk-tag alert">¡Bajo!</span>':''}
          </span>
        </div>
        <div class="stk-side">
          <span class="stk-stock">${i.stock}</span>
          <input class="stk-min" type="number" min="0" step="1" inputmode="numeric" placeholder="mín" value="${i.min||''}" data-stk-min="${escape(i.name)}" title="Stock mínimo">
        </div>
      </div>`;
    }).join('');
    return `
      <p class="muted xsmall" style="margin:0 0 10px">Define el <b>stock mínimo</b> de cada pieza. El sistema avisará cuando bajes de ese umbral.${lowCount?` Hoy hay <b class="warn">${lowCount}</b> por reponer.`:''}</p>
      <div class="stk-list">${rows}</div>`;
  }

  function bindStockInputs(){
    view().querySelectorAll('[data-stk-min]').forEach(inp=>{
      inp.addEventListener('change', ()=>{
        DB.setProductMinStock(inp.dataset.stkMin, inp.value);
        UI.toast('Stock mínimo actualizado');
        sales(document.getElementById('txFilter') ? document.getElementById('txFilter').value : 'all');
      });
    });
  }

  // ===== Desglose mensual/anual de ganancias =====
  function monthlyBreakdownHtml(){
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    // Estructura: years[year][month] = { repIncome, repCost, salesWithInvIncome, salesWithInvCost, salesNoInvIncome, countRep, countSalesWith, countSalesNo }
    const years = {};
    function bucket(y,m){
      if(!years[y]) years[y] = {};
      if(!years[y][m]) years[y][m] = {
        repIncome:0, repCost:0,
        salesWithInvIncome:0, salesWithInvCost:0, salesNoInvIncome:0,
        countRep:0, countSalesWith:0, countSalesNo:0
      };
      return years[y][m];
    }
    // Ventas
    for(const tx of DB.transactions){
      if(tx.type!=='sale') continue;
      const ts = tx.date || tx.createdAt || 0;
      const d = new Date(ts);
      const b = bucket(d.getFullYear(), d.getMonth());
      const total = Number(tx.total||0);
      if(tx.costTotal != null){
        b.salesWithInvIncome += total;
        b.salesWithInvCost  += Number(tx.costTotal||0);
        b.countSalesWith++;
      } else {
        b.salesNoInvIncome += total;
        b.countSalesNo++;
      }
    }
    // Reparaciones entregadas
    for(const r of DB.repairs){
      if(r.status!=='delivered') continue;
      const ts = r.deliveredAt || r.updatedAt || r.createdAt || 0;
      const d = new Date(ts);
      const b = bucket(d.getFullYear(), d.getMonth());
      const price = Number(r.price||0);
      const partsCost = (r.parts||[]).reduce((a,p)=> a + Number(p.unitCost||0)*Number(p.qty||0), 0);
      b.repIncome += price;
      b.repCost   += partsCost;
      b.countRep++;
    }
    const yKeys = Object.keys(years).map(Number).sort((a,b)=>b-a);
    if(!yKeys.length){
      return `<p class="muted small" style="margin:0">Aún no hay ventas ni reparaciones entregadas para desglosar.</p>`;
    }
    const nowY = new Date().getFullYear();
    const html = yKeys.map(y=>{
      const months = years[y];
      const mKeys = Object.keys(months).map(Number).sort((a,b)=>b-a);
      // Totales del año
      let yRepProfit=0, yWithProfit=0, yNoProfit=0, yWithInv=0;
      const rowsM = mKeys.map(m=>{
        const b = months[m];
        const repProfit = b.repIncome - b.repCost;
        const withProfit = b.salesWithInvIncome - b.salesWithInvCost;
        const noProfit = b.salesNoInvIncome;
        const monthTotal = repProfit + withProfit + noProfit;
        yRepProfit += repProfit; yWithProfit += withProfit; yNoProfit += noProfit; yWithInv += b.salesWithInvCost;
        const cls = monthTotal>=0?'pos':'neg';
        return `
          <div class="mb-month">
            <div class="mb-month-head">
              <span class="mb-month-name">${MONTHS[m]}</span>
              <span class="mb-month-total ${cls}">$ ${monthTotal.toFixed(2)}</span>
            </div>
            <div class="mb-rows">
              <div class="mb-row rep">
                <span class="mb-row-label">Reparaciones</span>
                <span class="mb-row-meta">${b.countRep} entregada(s) · Ingreso $ ${b.repIncome.toFixed(2)} · Piezas $ ${b.repCost.toFixed(2)}</span>
                <span class="mb-row-val ${repProfit>=0?'pos':'neg'}">$ ${repProfit.toFixed(2)}</span>
              </div>
              <div class="mb-row swith">
                <span class="mb-row-label">Ventas con inversión</span>
                <span class="mb-row-meta">${b.countSalesWith} venta(s) · Ingreso $ ${b.salesWithInvIncome.toFixed(2)} · Costo $ ${b.salesWithInvCost.toFixed(2)}</span>
                <span class="mb-row-val ${withProfit>=0?'pos':'neg'}">$ ${withProfit.toFixed(2)}</span>
              </div>
              <div class="mb-row sno">
                <span class="mb-row-label">Ventas sin inversión</span>
                <span class="mb-row-meta">${b.countSalesNo} venta(s) · Ingreso $ ${b.salesNoInvIncome.toFixed(2)} · Sin costo registrado</span>
                <span class="mb-row-val ${noProfit>=0?'pos':'neg'}">$ ${noProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>`;
      }).join('');
      const yearTotal = yRepProfit + yWithProfit + yNoProfit;
      const ycls = yearTotal>=0?'pos':'neg';
      const open = (y===nowY) ? 'open' : '';
      return `
        <div class="mb-year ${open}">
          <button class="mb-year-head" data-mbyear type="button" aria-expanded="${open?'true':'false'}">
            <span class="mb-year-name">${y}</span>
            <span class="mb-year-meta">
              <span class="mb-pill rep" title="Ganancia reparaciones">Rep $ ${yRepProfit.toFixed(2)}</span>
              <span class="mb-pill swith" title="Ganancia ventas con inversión">V/Inv $ ${yWithProfit.toFixed(2)}</span>
              <span class="mb-pill sno" title="Ingreso ventas sin inversión">V/Sin $ ${yNoProfit.toFixed(2)}</span>
            </span>
            <span class="mb-year-total ${ycls}">$ ${yearTotal.toFixed(2)}</span>
            <span class="mb-year-chev">▾</span>
          </button>
          <div class="mb-year-body" ${open?'':'hidden'}>${rowsM}</div>
        </div>`;
    }).join('');
    return `
      <p class="muted small" style="margin:0 0 10px">
        Ganancia neta por <b>mes</b> y por <b>año</b>: reparaciones entregadas, ventas <b>con inversión</b> registrada (ingreso − costo) y ventas <b>sin inversión</b> (ingreso completo, sin costo asociado).
      </p>
      <div class="mb-list">${html}</div>`;
  }

  function bindMonthlyBreakdown(){
    view().querySelectorAll('[data-mbyear]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const card = btn.closest('.mb-year');
        const body = card && card.querySelector('.mb-year-body');
        if(!body) return;
        const open = !body.hasAttribute('hidden');
        if(open){ body.setAttribute('hidden',''); card.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
        else { body.removeAttribute('hidden'); card.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
      });
    });
  }


  // =============================================================
  // v61 — SECCIONES DE ESTANCAMIENTO en el Resumen (regla del taller):
  // · Recargo por días (+100/día tras 15 en Completada): tarjeta de aviso.
  // · «Más de 30 días sin entregar»: lista desplegable con TODOS los datos
  //   de cada reparación y botón «Quitar de la lista» (solo la lista;
  //   el registro sigue en el historial).
  // · «Equipos sin devolución» (más de un mes más, 60 días): lista propia
  //   desplegable igual, también quitable. El estado del registro pasa a
  //   Sin devolución (morado) en todas las vistas.
  // =============================================================
  function staleListHtml(){
    const st = DB.staleCompute();
    const hasFee = st.fee30.length > 0;
    const totalFee = st.fee30.reduce((a,x)=>a+Number(x.fee||0),0);
    const list30 = st.list30.filter(x=> !(x.r.staleDismissed && x.r.staleDismissed.s30));
    const listND = st.listND.filter(x=> !(x.r.staleDismissed && x.r.staleDismissed.nd));
    const hidden = (st.list30.length - list30.length) + (st.listND.length - listND.length);
    const row = (x, which)=>{
      const r = x.r;
      const late = Number(r.lateFee||0);
      return `
        <div class="stale-item" data-stale-id="${escape(r.id)}" data-stale-which="${which}">
          <div class="stale-row">
            <span class="status ${r.status}">${statusLabel(r.status)}</span>
            <span class="stale-days">${x.days} día(s)</span>
            <button type="button" class="stale-notify" data-stale-notify title="Avisar por WhatsApp">${ICONS.wa}<span>WhatsApp</span></button>
            <button type="button" class="stale-notify sys" data-stale-sys title="Notificación del sistema">${ICONS.bell}<span>Avisar</span></button>
            <button type="button" class="stale-remove" title="Quitar de la lista (el registro se conserva)">Quitar</button>
          </div>
          <h4>${escape(r.clientName||'Cliente')} · ${escape(r.device||'Equipo')}</h4>
          <div class="stale-grid">
            <span><b>ID:</b> ${escape(r.id)}</span>
            <span><b>Precio:</b> $ ${Number(r.price||0).toFixed(2)}</span>
            <span><b>Depósito:</b> $ ${Number(r.deposit||0).toFixed(2)}</span>
            <span><b>Teléfono:</b> ${escape(r.clientPhone||'—')}</span>
            <span><b>Ingreso:</b> ${fmtDate(r.createdAt)}</span>
            <span><b>Entrega prometida:</b> ${r.dueDate?fmtDate(r.dueDate):'—'}</span>
            <span><b>Falla:</b> ${escape((r.issue||'—').slice(0,60))}</span>
            <span><b>Marca/Modelo:</b> ${escape(r.brand||'—')} ${escape(r.model||'')}</span>
            ${late>0 ? `<span class="stale-fee"><b>Recargo por retraso:</b> +$ ${late.toFixed(2)} (${r.lateFeeDays||'?'} día(s) × $ ${Number(r.lateFeePerDay||100).toFixed(2)})</span>` : ''}
            ${Number(r.lateFeeCharged||0)>0 ? `<span><b>Recargo ya cobrado:</b> $ ${Number(r.lateFeeCharged||0).toFixed(2)}</span>` : ''}
            ${r.signaturePhoto ? '<span><b>Firma:</b> sí</span>' : '<span><b>Firma:</b> pendiente</span>'}
          </div>
        </div>`;
    };
    return `
      ${hasFee ? `
      <div class="stale-fee-card">
        <h3>⏱ Recargo por días (${st.fee30.length})</h3>
        <p>Completadas sin entregar hace más de <b>15 días</b>: el precio de cada una sube
        <b>$ 100 por día</b> desde el día 16. El recargo se cobra al momento de la entrega.</p>
        <p class="stale-fee-total">Recargo acumulado en espera: <b>$ ${totalFee.toFixed(2)}</b></p>
      </div>` : ''}

      <div class="acc-card ${list30.length? '' : 'dim'}">
        <button class="acc-head" data-acc type="button">
          <span class="acc-ico">${ICONS.clock}</span>
          <span class="acc-title">Más de 30 días en el taller (${list30.length})</span>
          <span class="acc-sub">Sin entregar · toca para abrir o cerrar</span>
          <span class="acc-chev"></span>
        </button>
        <div class="acc-body">
          ${list30.length ? list30.map(x=>row(x,'s30')).join('')
            : '<p class="muted small" style="margin:4px 2px">Ningún equipo pasa de 30 días sin entregarse.</p>'}
        </div>
      </div>

      <div class="acc-card ${listND.length? '' : 'dim'}">
        <button class="acc-head" data-acc type="button">
          <span class="acc-ico">${ICONS.clock}</span>
          <span class="acc-title">Equipos sin devolución (${listND.length})</span>
          <span class="acc-sub">Más de 60 días · toca para abrir o cerrar</span>
          <span class="acc-chev"></span>
        </button>
        <div class="acc-body">
          ${listND.length ? listND.map(x=>row(x,'nd')).join('')
            : '<p class="muted small" style="margin:4px 2px">Ningún equipo pasó a «sin devolución».</p>'}
          ${hidden>0 ? `<p class="muted small" style="margin:8px 2px 2px">${hidden} equipo(s) oculto(s) de las listas (quitarlos no borra nada del historial).</p>` : ''}
        </div>
      </div>`;
  }

  function bindStaleLists(){
    view().querySelectorAll('.stale-remove').forEach(b=>{
      b.onclick = e=>{
        e.stopPropagation();
        const item = b.closest('.stale-item');
        const id = item.dataset.staleId;
        const which = item.dataset.staleWhich;
        DB.staleDismiss(id, which);
        UI.toast('Quitado de la lista · el registro sigue en el historial');
        summary();
      };
    });
    // v64 — avisar por equipo: WhatsApp y notificación del sistema
    view().querySelectorAll('[data-stale-notify]').forEach(b=>{
      b.onclick = e=>{
        e.stopPropagation();
        const item = b.closest('.stale-item');
        const id = item.dataset.staleId;
        const which = item.dataset.staleWhich;
        const r = DB.findRepair(id);
        if(!r || !window.Notify) return;
        Notify.notifyWa({ r, days: Math.floor((Date.now()-(r.createdAt||Date.now()))/86400000) }, which==='nd'?'nodev':'d30');
      };
    });
    view().querySelectorAll('[data-stale-sys]').forEach(b=>{
      b.onclick = async e=>{
        e.stopPropagation();
        const item = b.closest('.stale-item');
        const id = item.dataset.staleId;
        const which = item.dataset.staleWhich;
        const r = DB.findRepair(id);
        if(!r || !window.Notify) return;
        const p = await Notify.askPermission();
        if(p !== 'granted'){ UI.toast('Permiso de notificaciones denegado'); return; }
        const days = Math.floor((Date.now()-(r.createdAt||Date.now()))/86400000);
        Notify.systemNotify(
          which==='nd' ? 'Equipo sin devolución' : 'Equipo más de 30 días',
          `${r.clientName||'cliente'} · ${[r.device,r.brand,r.model].filter(Boolean).join(' ')} · ${days} día(s) · ${r.id}`,
          'taller-'+which
        );
        UI.toast('🔔 Notificación enviada');
      };
    });
    bindAccordions();
  }

  function summary(){
    const _stats = computeAllStats();
    const _gT = _stats.total.totalProfit;
    const _gCls = _gT>=0 ? 'pos' : 'neg';
    // v57 — DESGLOSE del hero: qué parte está ya cobrada (entregadas+ventas)
    // y qué parte está POR COBRAR (reparaciones no entregadas). El número
    // grande es ganancia REAL cobrada; el resto va aparte, sin mezclar.
    const _pend = _stats.total.pendingRepair || 0;
    view().innerHTML = `
      <div class="greeting">Resumen <span>financiero</span></div>
      <p class="muted small" style="margin:-8px 4px 14px">Ganancias, ingresos y reparaciones — todo con explicación de dónde sale cada cifra.</p>

      <div class="profit-hero ${_gCls}">
        <span class="ph-label">Ganancia total acumulada (ya cobrada)</span>
        <span class="ph-amount">$ ${_gT.toFixed(2)}</span>
        <span class="ph-help">Ventas + servicios entregados − costos · de todo el historial</span>
        ${_pend>0 ? `
        <span class="ph-help" style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border)">
          Además tienes <b>$ ${_pend.toFixed(2)}</b> <b>por cobrar</b> en reparaciones
          terminadas o en curso que aún no se entregaron (se suman al momento de la entrega).
        </span>` : ''}
      </div>

      ${staleListHtml()}


      <div class="acc-card cv-stats-card open">
        <button class="acc-head" data-acc type="button">
          <span class="acc-ico">${ICONS.box}</span>
          <span class="acc-title">Contabilidad e ingresos</span>
          <span class="acc-sub">Lo que entró, lo que costó y la ganancia neta (incluye el Total histórico) · toca para cerrar</span>
          <span class="acc-chev"></span>
        </button>
        <div class="acc-body">${cvStatsTilesHtml()}</div>
      </div>

      <div class="acc-card">
        <button class="acc-head" data-acc type="button">
          <span class="acc-ico">${ICONS.edit}</span>
          <span class="acc-title">Reparaciones cobradas</span>
          <span class="acc-sub">Solo cuenta cuando entregas el equipo · toca para abrir o cerrar</span>
          <span class="acc-chev"></span>
        </button>
        <div class="acc-body">${sysStatsTilesHtml()}</div>
      </div>

      <div class="acc-card">
        <button class="acc-head" data-acc type="button">
          <span class="acc-ico">${ICONS.box}</span>
          <span class="acc-title">Ganancias por mes y año</span>
          <span class="acc-sub">Reparaciones, ventas con inversión y ventas sin inversión · toca para abrir o cerrar</span>
          <span class="acc-chev"></span>
        </button>
        <div class="acc-body">${monthlyBreakdownHtml()}</div>
      </div>

      <div class="btn-row" style="margin-top:14px">
        <button class="btn-secondary" id="goCvBtn">${ICONS.box} Ir a Compra/Venta</button>
      </div>
    `;
    bindStaleLists();
    bindMonthlyBreakdown();
    const gb = document.getElementById('goCvBtn');
    if(gb) gb.onclick = ()=> App.go('sales');
  }

  function sales(filter){
    const active = filter || 'all';
    let list = DB.transactions.slice();
    if(active!=='all') list = list.filter(t=>t.type===active);
    list.sort((a,b)=>(b.date||b.createdAt||0)-(a.date||a.createdAt||0));

    const opts = TX_FILTERS.map(f=>`<option value="${f.k}" ${f.k===active?'selected':''}>${f.label}</option>`).join('');

    const groups = groupByDate(list.map(t=>({ ...t, createdAt: t.date||t.createdAt })));
    const grouped = groups.map(g=>`
      ${sectionDivider(g.label, g.items.length)}
      ${g.items.map(txCard).join('')}
    `).join('');

    const stockStats = DB.productStats();
    const lowList = Object.values(stockStats).filter(i=> i.min>0 && i.stock<=i.min);
    const lowBadge = lowList.length ? `<span class="acc-badge alert">${lowList.length}</span>` : '';
    const items = Object.values(stockStats);
    const totalStockUnits = items.reduce((a,i)=> a + Math.max(0,i.stock), 0);

    const _allStats = computeAllStats();
    const _cv = _allStats.total;
    const _pi = periodInfo();

    // Lista detallada de ventas (con inversión y ganancia) y compras (inversión)
    const allSales = DB.transactions.filter(t=>t.type==='sale')
      .sort((a,b)=>(b.date||b.createdAt||0)-(a.date||a.createdAt||0));
    const allPurchases = DB.transactions.filter(t=>t.type==='purchase')
      .sort((a,b)=>(b.date||b.createdAt||0)-(a.date||a.createdAt||0));

    let totSalesInv = 0, totSalesProfit = 0;
    const salesRows = allSales.map(t=>{
      const total = Number(t.total||0);
      const qty = Number(t.quantity||0);
      const hasCost = t.costTotal != null;
      const inv = hasCost ? Number(t.costTotal||0) : Number(t.unitCost||0)*qty;
      const profit = hasCost ? (total - inv) : null;
      totSalesInv += inv;
      if(profit != null) totSalesProfit += profit;
      const pcls = profit==null ? 'muted' : (profit>=0?'pos':'neg');
      const profitTxt = profit==null ? '—' : `$ ${profit.toFixed(2)}`;
      return `
        <button class="cv-detail-row" data-tx="${escape(t.id)}" type="button">
          <span class="cd-main">
            <b>${escape(t.product||'Producto')}</b>
            <span class="cd-sub">${qty} u · ${fmtDate(t.date||t.createdAt)}${t.counterparty?` · ${escape(t.counterparty)}`:''}</span>
          </span>
          <span class="cd-nums">
            <span class="cd-total sale">$ ${total.toFixed(2)}</span>
            <span class="cd-meta">Inv. $ ${inv.toFixed(2)} · <b class="${pcls}">Gan. ${profitTxt}</b></span>
          </span>
        </button>`;
    }).join('');

    let totPurchInv = 0;
    const purchaseRows = allPurchases.map(t=>{
      const total = Number(t.total||0);
      const qty = Number(t.quantity||0);
      totPurchInv += total;
      return `
        <button class="cv-detail-row" data-tx="${escape(t.id)}" type="button">
          <span class="cd-main">
            <b>${escape(t.product||'Producto')}</b>
            <span class="cd-sub">${qty} u · ${fmtDate(t.date||t.createdAt)}${t.counterparty?` · ${escape(t.counterparty)}`:''}</span>
          </span>
          <span class="cd-nums">
            <span class="cd-total buy">$ ${total.toFixed(2)}</span>
            <span class="cd-meta">Inversión</span>
          </span>
        </button>`;
    }).join('');

    const salesDetailsHtml = allSales.length
      ? `<div class="cv-detail-summary">
           <span>Inversión total: <b>$ ${totSalesInv.toFixed(2)}</b></span>
           <span>Ganancia total: <b class="${totSalesProfit>=0?'pos':'neg'}">$ ${totSalesProfit.toFixed(2)}</b></span>
         </div>
         <div class="cv-detail-list">${salesRows}</div>`
      : `<p class="muted small" style="margin:6px 2px 0">Aún no hay ventas registradas.</p>`;

    const purchDetailsHtml = allPurchases.length
      ? `<div class="cv-detail-summary">
           <span>Inversión total: <b>$ ${totPurchInv.toFixed(2)}</b></span>
           <span class="muted">La ganancia se realiza al vender la pieza o usarla en una reparación.</span>
         </div>
         <div class="cv-detail-list">${purchaseRows}</div>`
      : `<p class="muted small" style="margin:6px 2px 0">Aún no hay compras registradas.</p>`;

    // v67 — TARJETAS PLEGABLES QUE ENCOGEN DE VERDAD: la cabecera es UNA
    // sola línea (chevron ▸ · título · total), el conteo de movimientos
    // pasa al desplegable y el plegado se gobierna con la clase .open
    // (display) — el atributo hidden era pisado por display:flex y la
    // tarjeta «plegada» seguía ocupando 400 px (por eso «no encojía»).
    // Los periodos hoy/semana/mes/año y el detalle de movimientos viven
    // DENTRO del desplegable.
    const _row = (cls, label, day, week, month, year, total, count, sub, detailsHtml) => `
      <div class="cv-period ${cls}">
        <button class="cv-period-toggle" data-cvtoggle type="button" aria-expanded="false" title="Desplegar ${label.toLowerCase()}">
          <span class="cv-period-line">
            <span class="cv-period-chevron" aria-hidden="true"></span>
            <span class="cv-period-title">${label}</span>
            <span class="cv-period-count">${count}</span>
            <span class="cv-period-total">$ ${total.toFixed(2)}</span>
          </span>
        </button>
        <div class="cv-period-details">
          <span class="cv-period-grid">
            <span title="${escape(_pi.day)}"><b>Hoy</b>$ ${day.toFixed(2)}</span>
            <span title="${escape(_pi.week)}"><b>Semana</b>$ ${week.toFixed(2)}</span>
            <span title="${escape(_pi.month)}"><b>Mes</b>$ ${month.toFixed(2)}</span>
            <span title="${escape(_pi.year)}"><b>Año</b>$ ${year.toFixed(2)}</span>
          </span>
          <p class="muted small" style="margin:0">${sub}</p>
          ${detailsHtml}
        </div>
      </div>`;
    const _qs = `<div class="cv-periods">
      ${_row('sale','Total de ventas',
        _allStats.day.salesIncome,_allStats.week.salesIncome,_allStats.month.salesIncome,_allStats.year.salesIncome,_cv.salesIncome,
        _cv.countSales,'suma de todo lo facturado en ventas', salesDetailsHtml)}
      ${_row('buy','Total de compras',
        _allStats.day.purchases,_allStats.week.purchases,_allStats.month.purchases,_allStats.year.purchases,_cv.purchases,
        _cv.countPurchases,'suma de todo lo invertido en compras de stock', purchDetailsHtml)}
    </div>`;
    view().innerHTML = `
      <div class="greeting">Compras y <span>Ventas</span></div>
      <p class="muted small" style="margin:-8px 4px 10px">
        Gestiona aquí tus compras de stock y tus ventas. Cada compra suma piezas a tu inventario;
        cada venta o pieza usada en una reparación las descuenta automáticamente.
      </p>

      <div class="btn-row" style="margin:6px 0 10px">
        <button class="btn-secondary" id="newSaleBtn">${ICONS.plus} Nueva venta</button>
        <button class="btn-secondary" id="newPurchaseBtn">${ICONS.plus} Nueva compra</button>
      </div>
      <div class="select-elegant" style="margin:0 0 14px">
        <select id="txFilter" aria-label="Filtrar movimientos">${opts}</select>
      </div>

      ${_qs}

      <div class="acc-card ${lowList.length?'open':''}">
        <button class="acc-head" data-acc type="button">
          <span class="acc-ico">${ICONS.box}</span>
          <span class="acc-title">Stock y alertas ${lowBadge}</span>
          <span class="acc-sub">${totalStockUnits} unidad(es) en total · define mínimos para avisos</span>
          <span class="acc-chev"></span>
        </button>
        <div class="acc-body">${stockPanelHtml()}</div>
      </div>

      ${list.length ? grouped : emptyState('Sin movimientos','Registra tu primera venta o compra')}
    `;
    document.getElementById('newSaleBtn').onclick = ()=> newTransaction('sale');
    document.getElementById('newPurchaseBtn').onclick = ()=> newTransaction('purchase');
    document.getElementById('txFilter').addEventListener('change', e=> sales(e.target.value));
    view().querySelectorAll('[data-cvtoggle]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const card = btn.closest('.cv-period');
        const panel = card && card.querySelector('.cv-period-details');
        if(!panel) return;
        // v67 — plegado por CLASE .open (display:none por CSS): el atributo
        // hidden era pisado por .cv-period-details{display:flex} y no encojía.
        const open = card.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    view().querySelectorAll('.cv-detail-row[data-tx]').forEach(b=>{
      b.addEventListener('click', ()=> showTransaction(b.dataset.tx));
    });
    bindAccordions();
    bindStockInputs();
    bindTxCards();
  }

  // =============================================================
  // v63 — PENDIENTES (citas/trabajos por hacer): lista independiente de
  // las reparaciones. Nombre, teléfono, fecha, dirección y detalles.
  // Guardado en el dispositivo (IndexedDB) + sincronización por el índice
  // de GitHub (index.json) junto a las transacciones.
  // =============================================================
  function pendings(){
    const list = DB.pendings.slice().sort((a,b)=>(b.date||b.createdAt||0)-(a.date||a.createdAt||0));
    const active = list.filter(p=>!p.done);
    const done = list.filter(p=>p.done);
    const card = (p)=>{
      // v67 — MULTI-TelÉFONO en pendientes: phones[] (alias phone = [0]).
      // Cada teléfono muestra su enlace para LLAMAR y su botón SMS directo.
      // ESTRUCTURA ORDENADA (antes las opciones estaban regadas): una fila
      // clara ✎ hecho · nombre+fecha · acciones (editar/eliminar) y una
      // zona inferior agrupada por QUÉ: teléfonos (llamada+SMS juntos por
      // número) · dirección · detalles.
      const phones = (Array.isArray(p.phones) && p.phones.length ? p.phones : (p.phone?[p.phone]:[])).filter(Boolean);
      const dateStr = p.date ? fmtDate(p.date) : '—';
      const overdue = p.date && !p.done && p.date < Date.now();
      const phonesHtml = phones.length ? `
        <div class="pend-phones" data-stop="1">
          ${phones.map(ph=>{
            const tel = UI.phoneClean(ph);
            const sms = UI.phoneSms(ph);
            return `
            <div class="pend-phone-item">
              <a class="phone-link" href="tel:${escape(tel)}" title="Llamar al ${escape(ph)}">${escape(ph)}</a>
              <a class="mini-action sms" href="sms:${escape(sms)}" data-stop="1" title="SMS al ${escape(ph)}">${ICONS.sms}<span>SMS</span></a>
            </div>`;
          }).join('')}
        </div>` : '';
      return `
      <div class="pend-card ${p.done?'done':''} ${overdue?'overdue':''}" data-pend-id="${escape(p.id)}">
        <div class="pend-row">
          <button type="button" class="pend-check" title="${p.done?'Reabrir':'Marcar hecho'}" aria-label="Marcar">${p.done?'↺':'✓'}</button>
          <div class="pend-info">
            <h3>${escape(p.name||'Sin nombre')}</h3>
            <p class="muted small">${overdue?'⚠ Vencida · ':''}${dateStr}</p>
          </div>
          <div class="pend-actions">
            <button type="button" class="pend-act" data-act="edit" title="Editar pendiente">${ICONS.edit}</button>
            <button type="button" class="pend-act danger" data-act="del" title="Eliminar pendiente">${ICONS.trash}</button>
          </div>
        </div>
        ${phonesHtml || p.address || p.details ? `
        <div class="pend-extra">
          ${phonesHtml}
          ${p.address?`<p class="muted small">📍 ${escape(p.address)}</p>`:''}
          ${p.details?`<p class="muted small">📝 ${escape(p.details)}</p>`:''}
        </div>` : ''}
      </div>`;
    };
    view().innerHTML = `
      <div class="greeting">Pendientes <span>por hacer</span></div>
      <p class="muted small" style="margin:-8px 4px 14px">Citas, encargos y trabajos futuros. Se guardan y sincronizan con el resto del taller.</p>
      <div class="btn-row" style="margin:0 0 16px">
        <button class="btn-primary" id="newPendBtn">${ICONS.plus} Nuevo pendiente</button>
      </div>
      ${active.length ? active.map(card).join('') : `
        <div class="empty">${ICONS.box.replace('class="ico"','class="ico lg"')}<h3>Sin pendientes</h3><p>Toca «Nuevo pendiente» para apuntar una cita o encargo.</p></div>`}
      ${done.length ? `
        <div class="section-title" style="margin-top:22px">Hechos (${done.length})</div>
        ${done.map(card).join('')}` : ''}
    `;
    const nb = document.getElementById('newPendBtn');
    if(nb) nb.onclick = ()=> App.go('pendingForm', null, null);
    // Marcar hecho / reabrir
    view().querySelectorAll('.pend-check').forEach(b=>{
      b.onclick = e=>{
        e.stopPropagation();
        const id = b.closest('.pend-card').dataset.pendId;
        const p = DB.findPending(id);
        if(!p) return;
        DB.updatePending(id, { done: !p.done, doneAt: p.done?null:Date.now() });
        UI.toast(p.done?'Marcado como hecho':'Reabierto');
        try{ App.updatePendBadge(); }catch(_){}
        pendings();
      };
    });
    // Editar / eliminar
    view().querySelectorAll('.pend-act').forEach(b=>{
      b.onclick = async e=>{
        e.stopPropagation();
        const id = b.closest('.pend-card').dataset.pendId;
        if(b.dataset.act==='edit'){
          const p = DB.findPending(id);
          if(p) App.go('pendingForm', null, p);
          return;
        }
        const ok = await UI.confirmDialog({
          title:'Eliminar pendiente',
          message:'¿Eliminar este pendiente? Esta acción no se puede deshacer.',
          okText:'Eliminar', cancelText:'Cancelar', danger:true
        });
        if(!ok) return;
        DB.deletePending(id);
        UI.toast('Pendiente eliminado');
        try{ App.updatePendBadge(); }catch(_){}
        pendings();
      };
    });
    try{ App.updatePendBadge(); }catch(_){}
  }

  function pendingForm(existing){
    const p = existing || {};
    // v66 — teléfonos múltiples: repinta la lista de campos de teléfono
    // (mismo patrón que el formulario de reparaciones: + botón añade campo).
    const initPhones = (Array.isArray(p.phones) && p.phones.length ? p.phones : (p.phone?[p.phone]:[])).filter(Boolean);
    let phoneCount = Math.max(1, initPhones.length);
    function phoneField(i, val){
      return `<div class="pend-phone-row" data-prow="${i}">
        <input name="phones" inputmode="tel" value="${escape(val||'')}" placeholder="+58 412 0000000">
        ${i>0?'<button type="button" class="pend-phone-rm" data-rm-phone="1" title="Quitar teléfono">×</button>':''}
      </div>`;
    }
    view().innerHTML = `
      <button type="button" class="form-close" id="formCloseTop" title="Cerrar">${ICONS.close}</button>
      <h2 style="margin:0 0 16px;font-size:20px;padding-right:50px">${existing?'Editar pendiente':'Nuevo pendiente'}</h2>
      <form id="pendingFormEl" novalidate>
        ${sectionDivider('Quién')}
        <div class="form-group">
          <label>Nombre *</label>
          <input name="name" required autocapitalize="words" value="${escape(p.name||'')}" placeholder="Quién o qué">
        </div>
        <div class="form-group">
          <label>Teléfonos <span class="muted small">(varios: llamada y SMS a cada uno desde la lista)</span></label>
          <div id="pendPhonesBox">${initPhones.map((ph,i)=>phoneField(i,ph)).join('')||phoneField(0,'')}</div>
          <button type="button" class="btn-secondary btn-inline" id="pendAddPhone" style="margin-top:6px">${ICONS.plus} Añadir teléfono</button>
        </div>
        ${sectionDivider('Cuándo')}
        <div class="form-group">
          <label>Fecha</label>
          <input name="date" type="date" value="${p.date?fmtDateInput(p.date):''}">
        </div>
        ${sectionDivider('Dónde y qué')}
        <div class="form-group">
          <label>Dirección</label>
          <textarea name="address" rows="2" placeholder="Dónde">${escape(p.address||'')}</textarea>
        </div>
        <div class="form-group">
          <label>Detalles</label>
          <textarea name="details" rows="3" placeholder="Qué hay que hacer / recordar">${escape(p.details||'')}</textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn-primary">${existing?'Guardar cambios':'Agregar pendiente'}</button>
          <button type="button" class="btn-secondary" id="cancelPendBtn">Cancelar</button>
        </div>
      </form>
    `;
    const phonesBox = document.getElementById('pendPhonesBox');
    document.getElementById('pendAddPhone').onclick = ()=>{
      phonesBox.insertAdjacentHTML('beforeend', phoneField(phoneCount,''));
      bindRmButtons();
      phoneCount++;
    };
    function bindRmButtons(){
      phonesBox.querySelectorAll('[data-rm-phone]').forEach(b=>{
        b.onclick = ()=>{ b.closest('[data-prow]').remove(); };
      });
    }
    bindRmButtons();
    document.getElementById('formCloseTop').onclick = ()=> App.go('pendings');
    document.getElementById('cancelPendBtn').onclick = ()=> App.go('pendings');
    document.getElementById('pendingFormEl').addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = (fd.get('name')||'').trim();
      if(!name){ UI.toast('Escribe el nombre'); return; }
      const dateRaw = fd.get('date');
      const phones = [...phonesBox.querySelectorAll('input[name="phones"]')]
        .map(i=>i.value.trim()).filter(Boolean);
      const data = {
        name,
        phones,
        phone: phones[0] || null,
        date: dateRaw ? UI.localNoon(dateRaw) : null,
        address: (fd.get('address')||'').trim() || null,
        details: (fd.get('details')||'').trim() || null
      };
      if(existing){
        DB.updatePending(existing.id, data);
        UI.toast('Pendiente actualizado');
      } else {
        const np = DB.addPending(data);
        UI.toast('Pendiente agregado: '+np.id);
      }
      try{ App.updatePendBadge(); }catch(_){}
      App.go('pendings');
    });
  }

  // v63 — Duplicar reparación con confirmación + diálogo de qué datos
  // eliminar de la copia. La copia recibe ID nuevo y queda DEBAJO de la
  // original en la lista.
  async function duplicateRepairDialog(id){
    const r = DB.findRepair(id);
    if(!r) return;
    // Paso 1: confirmación general
    const ok = await UI.confirmDialog({
      title:'Duplicar reparación',
      message:`Se creará una COPIA nueva de ${r.id} (${r.clientName||'cliente'} · ${r.device||'equipo'}) con ID nuevo, insertada debajo de la original en la lista. La copia arranca como Pendiente, sin firma ni recargos. ¿Continuar?`,
      okText:'Sí, duplicar', cancelText:'Cancelar'
    });
    if(!ok) return;
    // Paso 2: elegir qué datos VACIAR en la copia
    const FIELDS = [
      ['clientName','Nombre del cliente'],
      ['clientPhones','Teléfono(s)'],
      ['clientAddress','Dirección'],
      ['clientIdNumber','Nº de identidad'],
      ['clientPhotos','Fotos del cliente'],
      ['device','Equipo'],
      ['brand','Marca'],
      ['model','Modelo'],
      ['serial','Nº de serie'],
      ['devicePhotos','Fotos del equipo'],
      ['issue','Falla reportada'],
      ['notes','Notas'],
      ['price','Precio'],
      ['deposit','Anticipo'],
      ['dueDate','Fecha de entrega'],
      ['warrantyDays','Garantía (días)'],
      ['parts','Piezas'],
      ['acceptAudio','Audio de aceptación']
    ];
    const withData = FIELDS.filter(([k])=>{
      if(k==='clientPhones') return (r.clientPhones||[]).length || r.clientPhone;
      if(k==='clientPhotos') return (r.clientPhotos||[]).length || r.clientPhoto;
      if(k==='devicePhotos') return (r.devicePhotos||[]).length || r.devicePhoto;
      if(k==='parts') return (r.parts||[]).length;
      if(k==='acceptAudio') return !!r.acceptAudio;
      if(k==='dueDate'||k==='warrantyDays'||k==='price'||k==='deposit') return r[k] != null;
      return !!(r[k] && String(r[k]).trim());
    });
    const checks = withData.map(([k,lbl])=>`
      <label class="dup-field-check"><input type="checkbox" data-drop="${k}">
      <span>Vaciar «${escape(lbl)}» en la copia</span></label>`).join('');
    UI.openModal(`
      <h2 style="margin:0 0 6px;font-size:19px">Duplicar ${escape(r.id)}</h2>
      <p class="muted small" style="margin:0 0 12px">Marca los datos que quieres <b>ELIMINAR de la copia</b> (quedarán vacíos). Los no marcados se copian tal cual.</p>
      <div class="dup-fields-list">${checks || '<p class="muted small">La reparación casi no tiene datos: la copia saldrá limpia.</p>'}</div>
      <p class="dup-id-note">🔒 El nuevo ID de la copia <b>no se podrá eliminar</b> después: queda registrado como duplicado de ${escape(r.id)} (puedes vaciar todos sus datos editándola, pero el registro se conserva).</p>
      <div class="btn-row" style="margin-top:14px">
        <button type="button" class="btn-secondary" id="dupCancel">Cancelar</button>
        <button type="button" class="btn-primary" id="dupGo">Crear la copia</button>
      </div>
    `);
    document.getElementById('dupCancel').onclick = ()=> UI.closeModal();
    document.getElementById('dupGo').onclick = ()=>{
      const drop = [...document.querySelectorAll('.dup-field-check input:checked')].map(i=>i.dataset.drop);
      const copy = DB.duplicateRepair(id, drop);
      UI.closeModal();
      UI.toast('✓ Copia creada: '+copy.id+' (debajo de la original · ID no eliminable)');
      App.go('repairs');
    };
  }

  // v63 — Enlace del botón «Duplicar» en el detalle de una reparación:
  function bindDuplicateBtn(id){
    const btn = document.getElementById('dupBtn');
    if(btn) btn.onclick = ()=> duplicateRepairDialog(id);
  }





  function newTransaction(type, existing){
    const t = existing || { type };
    const productOptions = (DB.settings.productTypes||[])
      .map(p=>`<option value="${escape(p)}">`).join('');
    const dateVal = t.date ? fmtDateInput(t.date) : fmtDateInput(Date.now());
    // v48: en ventas NUEVAS prellenamos el coste unitario con el coste
    // promedio de las compras de ese producto cuando exista — la ganancia
    // queda calculada desde el primer guardado sin teclear nada extra.
    let prefillCost = '';
    if(!existing && t.type==='sale'){
      const stat = DB.productStats()[String(t.product||'').trim()];
      if(stat && stat.purchased>0){
        const avg = stat.invested / stat.purchased;
        if(isFinite(avg) && avg>0) prefillCost = avg.toFixed(2);
      }
    }

    UI.openModal(`
      <h2 style="margin:0 0 4px;font-size:20px">${existing?'Editar':'Nueva'} ${txLabel(t.type)}</h2>
      <p class="muted small" style="margin:0 0 14px">Registra el movimiento con todos los detalles.</p>
      <form id="txForm" novalidate>
        <div class="form-group">
          <label>Tipo</label>
          <div class="select-elegant">
            <select name="type">
              <option value="sale" ${t.type==='sale'?'selected':''}>Venta (ingreso)</option>
              <option value="purchase" ${t.type==='purchase'?'selected':''}>Compra (gasto)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Producto *</label>
          <input name="product" list="productTypesList" required placeholder="Selecciona o escribe" value="${escape(t.product||'')}">
          <datalist id="productTypesList">${productOptions}</datalist>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Cantidad *</label>
            <input name="quantity" type="number" min="0" step="1" inputmode="numeric" required value="${t.quantity!=null?t.quantity:1}">
          </div>
          <div class="form-group">
            <label>Precio unitario *</label>
            <input name="unitPrice" type="number" min="0" step="0.01" inputmode="decimal" required value="${t.unitPrice!=null?t.unitPrice:''}">
          </div>
        </div>
        <div class="form-group cost-group" id="costGroup">
          <label>Costo unitario (lo que te costó) <span class="muted" style="text-transform:none;font-weight:500">— opcional</span></label>
          <input name="unitCost" type="number" min="0" step="0.01" inputmode="decimal" value="${t.unitCost!=null?t.unitCost:prefillCost}" placeholder="Ej: 5.00">
          <p class="muted small" style="margin:6px 2px 0">Se usa para calcular tu <b>ganancia</b> e <b>inversión</b> al vender. ${prefillCost?`Prellenado con el costo promedio de tus compras (<b>$ ${escape(prefillCost)}</b> por unidad) — ajústalo si esta venta te costó distinto.`:''}</p>
          <div id="profitHint" class="profit-hint hidden"></div>
        </div>
        <div class="form-group">
          <label>Total</label>
          <input name="total" type="number" min="0" step="0.01" inputmode="decimal" id="txTotalInput" value="${t.total!=null?t.total:''}" placeholder="Se calcula automáticamente">
          <p class="muted small" style="margin:6px 2px 0">Puedes ajustar el total si aplicaste un descuento.</p>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Fecha</label>
            <input name="date" type="date" value="${dateVal}">
          </div>
          <div class="form-group">
            <label id="cpLabel">Cliente / Proveedor</label>
            <input name="counterparty" autocapitalize="words" value="${escape(t.counterparty||'')}">
          </div>
        </div>
        <div class="form-group">
          <label>Notas</label>
          <textarea name="notes" rows="2">${escape(t.notes||'')}</textarea>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:6px">${existing?'Guardar cambios':'Registrar movimiento'}</button>
      </form>
    `);

    const form = document.getElementById('txForm');
    const qty = form.querySelector('[name=quantity]');
    const unit = form.querySelector('[name=unitPrice]');
    const costI = form.querySelector('[name=unitCost]');
    const totalI = document.getElementById('txTotalInput');
    const cpLabel = document.getElementById('cpLabel');
    const typeSel = form.querySelector('[name=type]');
    const costGroup = document.getElementById('costGroup');
    const profitHint = document.getElementById('profitHint');
    let totalEdited = !!(existing && t.total!=null);
    function recalc(){
      if(!totalEdited){
        const q = parseFloat(qty.value)||0;
        const u = parseFloat(unit.value)||0;
        totalI.value = (q*u).toFixed(2);
      }
      updateProfitHint();
    }
    function updateProfitHint(){
      if(typeSel.value !== 'sale'){ profitHint.classList.add('hidden'); return; }
      const q = parseFloat(qty.value)||0;
      const u = parseFloat(unit.value)||0;
      const c = parseFloat(costI.value);
      const totalCalc = parseFloat(totalI.value) || (q*u);
      if(isNaN(c) || costI.value===''){ profitHint.classList.add('hidden'); return; }
      const inv = c*q;
      const profit = totalCalc - inv;
      const cls = profit>=0 ? 'pos' : 'neg';
      profitHint.classList.remove('hidden');
      profitHint.innerHTML = `
        <span class="ph-row"><span>Inversión</span><b>$ ${inv.toFixed(2)}</b></span>
        <span class="ph-row ${cls}"><span>Ganancia estimada</span><b>$ ${profit.toFixed(2)}</b></span>`;
    }
    function updateCpLabel(){
      cpLabel.textContent = typeSel.value==='sale' ? 'Cliente' : 'Proveedor';
    }
    function updateCostVisibility(){
      // El campo coste es útil sobre todo en ventas; en compras lo ocultamos
      costGroup.style.display = typeSel.value==='sale' ? '' : 'none';
      updateProfitHint();
    }
    qty.addEventListener('input', recalc);
    unit.addEventListener('input', recalc);
    if(costI) costI.addEventListener('input', updateProfitHint);
    totalI.addEventListener('input', ()=>{ totalEdited = true; updateProfitHint(); });
    typeSel.addEventListener('change', ()=>{ updateCpLabel(); updateCostVisibility(); });
    // v48: al escribir el producto en una VENTA, si el coste está vacío se
    // prellena con el costo promedio de las compras de ese producto —
    // la ganancia queda bien calculada sin teclear nada extra.
    const productI = form.querySelector('[name=product]');
    let costTouched = false;
    if(costI) costI.addEventListener('input', ()=>{ costTouched = true; });
    productI.addEventListener('input', ()=>{
      if(typeSel.value !== 'sale') return;
      if(costTouched && String(costI.value).trim()!=='') return; // el usuario lo escribió
      const stat = DB.productStats()[String(productI.value||'').trim()];
      if(stat && stat.purchased>0){
        const avg = stat.invested / stat.purchased;
        if(isFinite(avg) && avg>0){
          costI.value = avg.toFixed(2);
          updateProfitHint();
        }
      } else if(!costTouched){
        costI.value = '';
        profitHint.classList.add('hidden');
      }
    });
    updateCpLabel();
    updateCostVisibility();
    if(!totalEdited) recalc();

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(form);
      const product = (fd.get('product')||'').trim();
      if(!product){ UI.toast('Indica el producto'); return; }
      const q = parseFloat(fd.get('quantity'))||0;
      if(q<=0){ UI.toast('La cantidad debe ser mayor que cero'); return; }
      const u = parseFloat(fd.get('unitPrice'))||0;
      const tot = fd.get('total')!=='' ? parseFloat(fd.get('total')) : (q*u);
      const typeVal = fd.get('type')==='purchase' ? 'purchase' : 'sale';
      const costRaw = fd.get('unitCost');
      const hasCost = typeVal==='sale' && costRaw!=null && String(costRaw).trim()!=='';
      const unitCost = hasCost ? parseFloat(costRaw) : null;
      const dateStr = fd.get('date');
      const data = {
        type: typeVal,
        product,
        quantity: q,
        unitPrice: u,
        unitCost: unitCost,
        costTotal: hasCost ? Number((unitCost*q).toFixed(2)) : null,
        total: Number(tot.toFixed(2)),
        // v56d — FECHA LOCAL: 'YYYY-MM-DD' sin hora se interpreta como UTC
        // 00:00 y en husos negativos (América) fmtDate la mostraba un día
        // antes. Se fija al mediodía LOCAL del día elegido por el técnico.
        date: dateStr ? UI.localNoon(dateStr) : Date.now(),
        counterparty: (fd.get('counterparty')||'').trim() || null,
        notes: (fd.get('notes')||'').trim() || null
      };
      if(data.product && !DB.settings.productTypes.some(p=>p.toLowerCase()===data.product.toLowerCase())){
        DB.addProductType(data.product);
      }
      if(existing){
        DB.updateTransaction(existing.id, data);
        UI.toast('Movimiento actualizado');
      } else {
        const nt = DB.addTransaction(data);
        UI.toast(`${txLabel(data.type)} registrada: ${nt.id}`);
      }
      try{
        if(!navigator.onLine) UI.toast('Sin conexión: guardado en el dispositivo. Se subirá al reconectar.', 3500);
      }catch(_){}
      UI.closeModal();
      App.refresh();
    });
  }

  function showTransaction(id){
    const t = DB.findTransaction(id); if(!t) return;
    const isSale = t.type==='sale';
    const sign = isSale ? '+' : '-';
    const total = Number(t.total||0);
    const qty = Number(t.quantity||0);
    let saleExtras = '';
    if(isSale && t.unitCost != null){
      const unitCost = Number(t.unitCost||0);
      const invTotal = t.costTotal != null ? Number(t.costTotal) : unitCost*qty;
      const profit = total - invTotal;
      const pcls = profit>=0 ? 'pos' : 'neg';
      saleExtras = `
        <div class="detail-row"><span class="lbl">Costo unit.</span><span class="val">$ ${unitCost.toFixed(2)}</span></div>
        <div class="detail-row"><span class="lbl">Inversión</span><span class="val">$ ${invTotal.toFixed(2)}</span></div>
        <div class="detail-row"><span class="lbl">Ganancia de esta venta</span><span class="val tx-profit ${pcls}">$ ${profit.toFixed(2)}</span></div>`;
    } else if(!isSale){
      saleExtras = `
        <div class="detail-row"><span class="lbl">Inversión</span><span class="val tx-profit neg">$ ${total.toFixed(2)}</span></div>
        <div class="detail-row"><span class="lbl">Ganancia de esta compra</span><span class="val muted">— (se realiza al vender o usar la pieza)</span></div>`;
    }
    const generalRow = '';
    UI.openModal(`
      <h2 style="margin:0 0 4px;font-size:20px">${escape(t.product||'Producto')}</h2>
      <p class="muted" style="margin:0 0 14px">${escape(t.id)} · <span class="tx-badge ${isSale?'sale':'purchase'}">${txLabel(t.type)}</span></p>
      <div class="detail-row"><span class="lbl">Cantidad</span><span class="val">${qty}</span></div>
      <div class="detail-row"><span class="lbl">Precio unit.</span><span class="val">$ ${Number(t.unitPrice||0).toFixed(2)}</span></div>
      <div class="detail-row"><span class="lbl">Total</span><span class="val tx-amount ${isSale?'sale':'purchase'}">${sign} $ ${total.toFixed(2)}</span></div>
      ${saleExtras}
      ${generalRow}
      <div class="detail-row"><span class="lbl">Fecha</span><span class="val">${fmtDate(t.date||t.createdAt)}</span></div>
      <div class="detail-row"><span class="lbl">${isSale?'Cliente':'Proveedor'}</span><span class="val">${t.counterparty?escape(t.counterparty):'<span class="muted">—</span>'}</span></div>
      <div class="detail-row"><span class="lbl">Notas</span><span class="val">${t.notes?escape(t.notes):'<span class="muted">—</span>'}</span></div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn-secondary" id="txEdit">${ICONS.edit} Editar</button>
        <button class="btn-primary btn-cancel" id="txDel">${ICONS.trash} Eliminar</button>
      </div>
    `);
    document.getElementById('txEdit').onclick = ()=>{ UI.closeModal(); newTransaction(t.type, t); };
    document.getElementById('txDel').onclick = async ()=>{
      const ok = await UI.confirmDialog({
        title:'Eliminar movimiento',
        message:`¿Eliminar definitivamente ${t.id}? Esta acción no se puede deshacer.`,
        okText:'Eliminar', cancelText:'Cancelar', danger:true
      });
      if(!ok) return;
      DB.deleteTransaction(id);
      UI.toast('Movimiento eliminado');
      UI.closeModal();
      App.refresh();
    };
  }

  // ============= CHOOSER FAB =============
  function newChooser(){
    UI.openModal(`
      <h2 style="margin:0 0 6px;font-size:20px">¿Qué quieres registrar?</h2>
      <p class="muted small" style="margin:0 0 14px">Elige el tipo de movimiento.</p>
      <div class="chooser-grid">
        <button class="chooser-tile repair" data-c="repair">
          ${ICONS.edit}
          <span class="ct-title">Reparación</span>
          <span class="ct-sub">Registrar un nuevo equipo</span>
        </button>
        <button class="chooser-tile sale" data-c="sale">
          ${ICONS.plus}
          <span class="ct-title">Venta</span>
          <span class="ct-sub">Producto vendido (ingreso)</span>
        </button>
        <button class="chooser-tile purchase" data-c="purchase">
          ${ICONS.box}
          <span class="ct-title">Compra</span>
          <span class="ct-sub">Producto comprado (gasto)</span>
        </button>
      </div>
    `);
    document.querySelectorAll('[data-c]').forEach(b=>{
      b.onclick = ()=>{
        const c = b.dataset.c;
        UI.closeModal();
        if(c==='repair') App.go('new');
        else { App.go('sales'); newTransaction(c); }
      };
    });
  }

  // ============= AUDITORÍA DEL SISTEMA =============
  function runSystemAudit(){
    const s = computeAllStats();
    const total = s.total;
    const repairs = DB.repairs;
    const txs = DB.transactions;
    const issues = [];
    const ps = DB.productStats ? DB.productStats() : {};
    for(const n in ps){
      const it = ps[n];
      // El stock ya viene calculado por productStats(); solo alertar
      // cuando el propio sistema puede recomponerlo con una compra.
      if(it.min && it.stock < it.min) issues.push(`Stock bajo en "${n}": ${it.stock} (mínimo ${it.min}).`);
    }
    for(const r of repairs){
      if(r.status==='delivered' && (r.price==null || r.price==='')) issues.push(`Reparación ${r.id} entregada sin precio asignado.`);
      if(r.deposit!=null && r.price!=null && Number(r.deposit) > Number(r.price)) issues.push(`Reparación ${r.id}: anticipo ($${Number(r.deposit).toFixed(2)}) supera al precio ($${Number(r.price).toFixed(2)}).`);
      if(r.dueDate && r.createdAt){
        const c0 = new Date(r.createdAt); c0.setHours(0,0,0,0);
        if(r.dueDate < c0.getTime()) issues.push(`Reparación ${r.id}: fecha de entrega anterior a la fecha de entrada.`);
      }
    }
    for(const t of txs){
      const q = Number(t.quantity||0), u = Number(t.unitPrice||0), tot = Number(t.total||0);
      if(q>0 && u>0 && Math.abs(q*u - tot) > 0.05) issues.push(`Movimiento ${t.id}: total $${tot.toFixed(2)} no coincide con ${q}×$${u.toFixed(2)}.`);
    }
    return {
      stats: s,
      totals: {
        repairs: repairs.length,
        delivered: repairs.filter(r=>r.status==='delivered').length,
        pendingPayments: total.pendingRepair,
        salesIncome: total.salesIncome,
        salesProfit: total.salesProfit,
        purchases: total.purchases,
        repairIncome: total.repairIncome,
        repairProfit: total.repairProfit,
        totalProfit: total.totalProfit,
        countSales: total.countSales,
        countPurchases: total.countPurchases
      },
      issues
    };
  }

  function auditReportHtml(a){
    const t = a.totals;
    const okBadge = a.issues.length===0
      ? '<span class="audit-badge ok">✓ Todo consistente</span>'
      : `<span class="audit-badge warn">⚠ ${a.issues.length} aviso(s)</span>`;
    const issuesHtml = a.issues.length
      ? `<ul class="audit-issues">${a.issues.map(i=>`<li>${escape(i)}</li>`).join('')}</ul>`
      : `<p class="muted small">No se detectaron inconsistencias. Las cifras de compras, ventas y reparaciones cuadran perfectamente.</p>`;
    return `
      <h2 style="margin:0 0 4px;font-size:20px">Auditoría del sistema</h2>
      <p class="muted small" style="margin:0 0 12px">Recalculado en tiempo real desde compras, ventas y reparaciones. ${okBadge}</p>
      <div class="audit-grid">
        <div class="audit-tile"><span>Ingresos por ventas</span><b>${fmtMoney(t.salesIncome)}</b><em>${t.countSales} venta(s)</em></div>
        <div class="audit-tile"><span>Inversión en compras</span><b>${fmtMoney(t.purchases)}</b><em>${t.countPurchases} compra(s)</em></div>
        <div class="audit-tile"><span>Reparaciones cobradas</span><b>${fmtMoney(t.repairIncome)}</b><em>${t.delivered} entregadas</em></div>
        <div class="audit-tile"><span>Por cobrar</span><b>${fmtMoney(t.pendingPayments)}</b><em>reparaciones sin entregar</em></div>
        <div class="audit-tile gold"><span>Ganancia total</span><b>${fmtMoney(t.totalProfit)}</b><em>ventas + servicios − costos</em></div>
        <div class="audit-tile"><span>Reparaciones totales</span><b>${t.repairs}</b><em>en el sistema</em></div>
      </div>
      <div class="section-title">Avisos</div>
      ${issuesHtml}
    `;
  }

  function openAudit(){
    const a = runSystemAudit();
    UI.openModal(auditReportHtml(a));
  }

  function autoAuditOnLoad(){
    try{
      const a = runSystemAudit();
      if(a.issues.length){
        UI.toast(`Auditoría: ${a.issues.length} aviso(s) — revisa Administración.`);
      }
    }catch(e){}
  }

  return { dashboard, repairsList, newRepair, search, admin, showRepair, showLabel, sales, summary, newTransaction, newChooser, runSystemAudit, openAudit, autoAuditOnLoad, pendings, pendingForm, supplierForm };
})();

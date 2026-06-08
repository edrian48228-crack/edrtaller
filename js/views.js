const Views = (() => {
  const { escape, fmtDate, fmtDateInput, statusLabel } = UI;
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
    trash: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
  };

  function emptyState(title, sub){
    return `<div class="empty">${ICONS.box.replace('class="ico"','class="ico lg"')}<h3>${escape(title)}</h3><p>${escape(sub)}</p></div>`;
  }

  function repairCard(r){
    const thumb = r.devicePhoto ? `<img src="${r.devicePhoto}" alt="">` : ICONS.device;
    return `
      <div class="repair-card" data-id="${r.id}">
        <div class="thumb">${thumb}</div>
        <div class="repair-info">
          <h3>${escape(r.device||'Equipo')} ${r.brand?'· '+escape(r.brand):''}</h3>
          <p>${escape(r.clientName||'Cliente')} · ${escape(r.id)}</p>
          <span class="status ${r.status}">${statusLabel(r.status)}</span>
        </div>
      </div>
    `;
  }

  function bindRepairCards(){
    view().querySelectorAll('.repair-card').forEach(c=>{
      c.addEventListener('click', ()=> showRepair(c.dataset.id));
    });
  }

  function dashboard(){
    const repairs = DB.repairs;
    const pending = DB.byStatus('pending').length + DB.byStatus('in_progress').length;
    const todayPending = DB.todayPending().length;
    const awaiting = DB.byStatus('awaiting').length;
    const completed = DB.byStatus('completed').length + DB.byStatus('delivered').length;
    const recent = repairs.slice(0,5);

    view().innerHTML = `
      <div class="greeting">Bienvenido a <span>${escape(DB.settings.appName)}</span></div>
      ${todayPending>0 ? `
        <div class="admin-card" style="border-left:3px solid #ff7b6b;background:linear-gradient(90deg,rgba(255,123,107,.1),var(--surface))">
          <div class="row-between">
            <div>
              <h3>Reparaciones para hoy</h3>
              <p>Tienes <b>${todayPending}</b> reparación(es) con entrega para hoy o vencidas</p>
            </div>
            ${ICONS.clock}
          </div>
        </div>` : ''}
      <div class="stats-grid">
        <div class="stat-card pending" data-go="repairs:pending">
          ${ICONS.clock}
          <div class="stat-num">${pending}</div>
          <div class="stat-lbl">Pendientes</div>
        </div>
        <div class="stat-card warn" data-go="repairs:awaiting">
          ${ICONS.box}
          <div class="stat-num">${awaiting}</div>
          <div class="stat-lbl">Esperan recogida</div>
        </div>
        <div class="stat-card success" data-go="repairs:completed">
          ${ICONS.check}
          <div class="stat-num">${completed}</div>
          <div class="stat-lbl">Completadas</div>
        </div>
      </div>
      <div class="section-title">Recientes</div>
      ${recent.length ? recent.map(repairCard).join('') : emptyState('Aún no hay reparaciones','Pulsa el botón + para registrar la primera')}
    `;
    view().querySelectorAll('[data-go]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const [v, filter] = el.dataset.go.split(':');
        App.go(v, filter);
      });
    });
    bindRepairCards();
  }

  function repairsList(filter){
    let list = DB.repairs;
    const filters = [
      {k:'all', label:'Todas'},
      {k:'pending', label:'Pendientes'},
      {k:'in_progress', label:'En proceso'},
      {k:'awaiting', label:'Esperan recogida'},
      {k:'completed', label:'Completadas'},
      {k:'delivered', label:'Entregadas'}
    ];
    const active = filter || 'all';
    if(active!=='all') list = list.filter(r=>r.status===active);
    view().innerHTML = `
      <div class="chips">
        ${filters.map(f=>`<button class="chip ${f.k===active?'active':''}" data-f="${f.k}">${f.label}</button>`).join('')}
      </div>
      ${list.length ? list.map(repairCard).join('') : emptyState('Sin reparaciones','No hay registros en esta categoría')}
    `;
    view().querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>repairsList(c.dataset.f)));
    bindRepairCards();
  }

  function buildPhotoBox(key, dataUrl){
    const lbl = key==='client' ? 'Foto del cliente' : 'Foto del equipo';
    const icon = key==='client' ? ICONS.person : ICONS.camera;
    const cap = key==='client' ? 'user' : 'environment';
    if(dataUrl){
      return `<img src="${dataUrl}"><input type="file" accept="image/*" capture="${cap}" data-photo="${key}"><button type="button" class="photo-remove" data-rm="${key}">${ICONS.trash}</button>`;
    }
    return `${icon}<span>${lbl}</span><input type="file" accept="image/*" capture="${cap}" data-photo="${key}">`;
  }

  function newRepair(existing){
    const r = existing || {};
    view().innerHTML = `
      <h2 style="margin:0 0 16px;font-size:20px">${existing?'Editar reparación':'Nueva reparación'}</h2>
      <form id="repairForm">
        <div class="photo-grid">
          <label class="photo-input ${r.devicePhoto?'has-img':''}" data-box="device">${buildPhotoBox('device', r.devicePhoto)}</label>
          <label class="photo-input ${r.clientPhoto?'has-img':''}" data-box="client">${buildPhotoBox('client', r.clientPhoto)}</label>
        </div>
        <div class="section-title">Cliente</div>
        <div class="form-group">
          <label>Nombre del cliente *</label>
          <input name="clientName" required value="${escape(r.clientName||'')}">
        </div>
        <div class="form-row">
          <div class="form-group"><label>Teléfono</label><input name="clientPhone" type="tel" value="${escape(r.clientPhone||'')}"></div>
          <div class="form-group"><label>Email</label><input name="clientEmail" type="email" value="${escape(r.clientEmail||'')}"></div>
        </div>
        <div class="section-title">Equipo</div>
        <div class="form-row">
          <div class="form-group"><label>Equipo *</label><input name="device" required placeholder="TV, Laptop..." value="${escape(r.device||'')}"></div>
          <div class="form-group"><label>Marca</label><input name="brand" value="${escape(r.brand||'')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Modelo</label><input name="model" value="${escape(r.model||'')}"></div>
          <div class="form-group"><label>Nº de serie</label><input name="serial" value="${escape(r.serial||'')}"></div>
        </div>
        <div class="form-group">
          <label>Falla reportada *</label>
          <textarea name="issue" required>${escape(r.issue||'')}</textarea>
        </div>
        <div class="section-title">Detalles</div>
        <div class="form-row">
          <div class="form-group">
            <label>Estado</label>
            <select name="status">
              ${['pending','in_progress','awaiting','completed','delivered'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Fecha entrega</label><input name="dueDate" type="date" value="${fmtDateInput(r.dueDate)}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Precio (€)</label><input name="price" type="number" step="0.01" value="${r.price!=null?r.price:''}"></div>
          <div class="form-group"><label>Anticipo (€)</label><input name="deposit" type="number" step="0.01" value="${r.deposit!=null?r.deposit:''}"></div>
        </div>
        <div class="form-group"><label>Notas</label><textarea name="notes">${escape(r.notes||'')}</textarea></div>
        <button type="submit" class="btn-primary">${existing?'Guardar cambios':'Registrar reparación'}</button>
      </form>
    `;

    const photos = { device: r.devicePhoto||null, client: r.clientPhoto||null };

    function bindPhotoEvents(){
      view().querySelectorAll('input[type=file][data-photo]').forEach(inp=>{
        inp.onchange = async e=>{
          const file = e.target.files[0]; if(!file) return;
          try{
            const dataUrl = await UI.resizeImage(file);
            const key = inp.dataset.photo;
            photos[key] = dataUrl;
            const box = inp.closest('.photo-input');
            box.classList.add('has-img');
            box.innerHTML = buildPhotoBox(key, dataUrl);
            bindPhotoEvents();
          }catch(err){ UI.toast('Error al cargar imagen'); }
        };
      });
      view().querySelectorAll('[data-rm]').forEach(btn=>{
        btn.onclick = e=>{
          e.preventDefault(); e.stopPropagation();
          const key = btn.dataset.rm;
          photos[key] = null;
          const box = btn.closest('.photo-input');
          box.classList.remove('has-img');
          box.innerHTML = buildPhotoBox(key, null);
          bindPhotoEvents();
        };
      });
    }
    bindPhotoEvents();

    view().querySelector('#repairForm').addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      data.devicePhoto = photos.device;
      data.clientPhoto = photos.client;
      data.dueDate = data.dueDate ? new Date(data.dueDate).getTime() : null;
      data.price = data.price ? parseFloat(data.price) : null;
      data.deposit = data.deposit ? parseFloat(data.deposit) : null;
      if(existing){
        DB.updateRepair(existing.id, data);
        UI.toast('Reparación actualizada');
      } else {
        const nr = DB.addRepair(data);
        UI.toast('Reparación registrada: '+nr.id);
      }
      App.go('repairs');
    });
  }

  function showRepair(id){
    const r = DB.findRepair(id);
    if(!r) return;
    const html = `
      <h2 style="margin:0 0 4px;font-size:20px">${escape(r.device||'Equipo')}</h2>
      <p class="muted" style="margin:0 0 14px">${escape(r.id)} · <span class="status ${r.status}">${statusLabel(r.status)}</span></p>
      ${(r.devicePhoto||r.clientPhoto) ? `
        <div class="detail-photos">
          <div class="thumb-big">${r.devicePhoto?`<img src="${r.devicePhoto}">`:ICONS.device}</div>
          <div class="thumb-big">${r.clientPhoto?`<img src="${r.clientPhoto}">`:ICONS.person}</div>
        </div>` : ''}
      <div class="detail-row"><span class="lbl">Cliente</span><span class="val">${escape(r.clientName||'—')}</span></div>
      ${r.clientPhone?`<div class="detail-row"><span class="lbl">Teléfono</span><span class="val"><a href="tel:${escape(r.clientPhone)}" style="color:var(--primary-glow);text-decoration:none">${escape(r.clientPhone)}</a></span></div>`:''}
      ${r.clientEmail?`<div class="detail-row"><span class="lbl">Email</span><span class="val">${escape(r.clientEmail)}</span></div>`:''}
      ${r.brand?`<div class="detail-row"><span class="lbl">Marca</span><span class="val">${escape(r.brand)}</span></div>`:''}
      ${r.model?`<div class="detail-row"><span class="lbl">Modelo</span><span class="val">${escape(r.model)}</span></div>`:''}
      ${r.serial?`<div class="detail-row"><span class="lbl">Nº serie</span><span class="val">${escape(r.serial)}</span></div>`:''}
      <div class="detail-row"><span class="lbl">Falla</span><span class="val">${escape(r.issue||'—')}</span></div>
      ${r.notes?`<div class="detail-row"><span class="lbl">Notas</span><span class="val">${escape(r.notes)}</span></div>`:''}
      <div class="detail-row"><span class="lbl">Ingreso</span><span class="val">${fmtDate(r.createdAt)}</span></div>
      ${r.dueDate?`<div class="detail-row"><span class="lbl">Entrega</span><span class="val">${fmtDate(r.dueDate)}</span></div>`:''}
      ${r.price?`<div class="detail-row"><span class="lbl">Precio</span><span class="val">€${Number(r.price).toFixed(2)}</span></div>`:''}
      ${r.deposit?`<div class="detail-row"><span class="lbl">Anticipo</span><span class="val">€${Number(r.deposit).toFixed(2)}</span></div>`:''}
      <div class="section-title">Cambiar estado</div>
      <div class="form-group">
        <select id="quickStatus">
          ${['pending','in_progress','awaiting','completed','delivered'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}
        </select>
      </div>
      <div class="btn-row">
        <button class="btn-secondary" id="editBtn">${ICONS.edit} Editar</button>
        <button class="btn-primary btn-danger" id="delBtn">${ICONS.trash} Eliminar</button>
      </div>
    `;
    UI.openModal(html);
    document.getElementById('quickStatus').addEventListener('change', e=>{
      DB.updateRepair(id, { status: e.target.value });
      UI.toast('Estado actualizado');
      UI.closeModal();
      App.refresh();
    });
    document.getElementById('editBtn').addEventListener('click', ()=>{
      UI.closeModal();
      App.go('new', null, r);
    });
    document.getElementById('delBtn').addEventListener('click', ()=>{
      if(confirm('¿Eliminar esta reparación? Esta acción no se puede deshacer.')){
        DB.deleteRepair(id);
        UI.toast('Reparación eliminada');
        UI.closeModal();
        App.refresh();
      }
    });
  }

  function search(){
    view().innerHTML = `
      <div class="search-bar">
        ${ICONS.search}
        <input id="searchInput" placeholder="Buscar cliente, equipo, teléfono o ID..." autofocus>
      </div>
      <div id="searchResults"></div>
    `;
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    function render(q){
      const list = DB.search(q);
      results.innerHTML = list.length
        ? list.map(repairCard).join('')
        : emptyState('Sin resultados','Prueba con otro término de búsqueda');
      results.querySelectorAll('.repair-card').forEach(c=>c.addEventListener('click',()=>showRepair(c.dataset.id)));
    }
    render('');
    input.addEventListener('input', e=>render(e.target.value));
  }

  function admin(){
    const s = DB.settings;
    view().innerHTML = `
      <h2 style="margin:0 0 16px;font-size:20px">Administración</h2>
      <div class="admin-card">
        <h3>Nombre del sistema</h3>
        <p>Aparece en la cabecera y pantalla de inicio</p>
        <input id="appNameInput" value="${escape(s.appName)}">
      </div>
      <div class="admin-card">
        <div class="row-between">
          <div style="flex:1">
            <h3>Pedir contraseña al entrar</h3>
            <p>Si está apagado, no pedirá contraseña</p>
          </div>
          <label class="switch">
            <input type="checkbox" id="reqPass" ${s.requirePassword?'checked':''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="admin-card">
        <h3>Cambiar contraseña</h3>
        <p>Define una nueva contraseña de acceso</p>
        <div class="form-group"><input type="password" id="newPass" placeholder="Nueva contraseña"></div>
        <button class="btn-secondary" id="savePassBtn">Actualizar contraseña</button>
      </div>
      <div class="admin-card">
        <h3>Sincronización (GitHub)</h3>
        <p>Exporta los datos como JSON y súbelo a tu repositorio. En otro dispositivo, importa el mismo archivo para sincronizar.</p>
        <div class="btn-row">
          <button class="btn-secondary" id="exportBtn">Exportar JSON</button>
          <button class="btn-secondary" id="importBtn">Importar JSON</button>
        </div>
        <input type="file" id="importFile" accept="application/json" style="display:none">
      </div>
      <div class="admin-card">
        <h3>Estadísticas</h3>
        <p>Total reparaciones: <b>${DB.repairs.length}</b></p>
      </div>
    `;
    document.getElementById('appNameInput').addEventListener('change', e=>{
      DB.updateSettings({ appName: e.target.value.trim() || 'Taller' });
      document.getElementById('appTitle').textContent = DB.settings.appName;
      document.title = DB.settings.appName;
      UI.toast('Nombre actualizado');
    });
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
    document.getElementById('exportBtn').addEventListener('click', ()=>{
      DB.exportJson();
      UI.toast('Archivo descargado');
    });
    document.getElementById('importBtn').addEventListener('click', ()=>document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', e=>{
      const f = e.target.files[0]; if(!f) return;
      if(!confirm('Esto reemplazará todos los datos actuales. ¿Continuar?')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        if(DB.importJson(ev.target.result)){
          UI.toast('Datos importados');
          App.refresh();
        } else UI.toast('Archivo inválido');
      };
      reader.readAsText(f);
    });
  }

  return { dashboard, repairsList, newRepair, search, admin, showRepair };
})();
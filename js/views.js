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
    cloud: '<svg viewBox="0 0 24 24" class="ico"><path d="M19 18H6a4 4 0 0 1-.5-7.97A6 6 0 0 1 17 9a4 4 0 0 1 2 9z"/></svg>',
    save: '<svg viewBox="0 0 24 24" class="ico"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"/></svg>'
  };

  function emptyState(t,s){
    return `<div class="empty">${ICONS.box.replace('class="ico"','class="ico lg"')}<h3>${escape(t)}</h3><p>${escape(s)}</p></div>`;
  }

  function repairCard(r){
    const cover = (r.devicePhotos && r.devicePhotos[0]) || r.devicePhoto;
    const thumb = cover ? `<img src="${cover}" alt="">` : ICONS.device;
    return `
      <div class="repair-card" data-id="${r.id}">
        <div class="thumb">${thumb}</div>
        <div class="repair-info">
          <h3>${escape(r.device||'Equipo')} ${r.brand?'· '+escape(r.brand):''}</h3>
          <p>${escape(r.clientName||'Cliente')} · ${escape(r.id)}</p>
          <span class="status ${r.status}">${statusLabel(r.status)}</span>
        </div>
      </div>`;
  }
  function bindRepairCards(){
    view().querySelectorAll('.repair-card').forEach(c=>{
      c.addEventListener('click', ()=> showRepair(c.dataset.id));
    });
  }

  // ============= DASHBOARD =============
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
          <div class="row-between"><div>
            <h3>Reparaciones para hoy</h3>
            <p>Tienes <b>${todayPending}</b> reparación(es) con entrega para hoy o vencidas</p>
          </div>${ICONS.clock}</div>
        </div>` : ''}
      <div class="stats-grid">
        <div class="stat-card pending" data-go="repairs:pending">${ICONS.clock}<div class="stat-num">${pending}</div><div class="stat-lbl">Pendientes</div></div>
        <div class="stat-card warn" data-go="repairs:awaiting">${ICONS.box}<div class="stat-num">${awaiting}</div><div class="stat-lbl">Esperan recogida</div></div>
        <div class="stat-card success" data-go="repairs:completed">${ICONS.check}<div class="stat-num">${completed}</div><div class="stat-lbl">Completadas</div></div>
      </div>
      <div class="section-title">Recientes</div>
      ${recent.length ? recent.map(repairCard).join('') : emptyState('Aún no hay reparaciones','Pulsa el botón + para registrar la primera')}
    `;
    view().querySelectorAll('[data-go]').forEach(el=>{
      el.addEventListener('click', ()=>{
        const [v, f] = el.dataset.go.split(':'); App.go(v, f);
      });
    });
    bindRepairCards();
  }

  // ============= LISTA =============
  function repairsList(filter){
    let list = DB.repairs;
    const filters = [
      {k:'all',label:'Todas'},{k:'pending',label:'Pendientes'},{k:'in_progress',label:'En proceso'},
      {k:'awaiting',label:'Esperan recogida'},{k:'completed',label:'Completadas'},{k:'delivered',label:'Entregadas'}
    ];
    const active = filter || 'all';
    if(active!=='all') list = list.filter(r=>r.status===active);
    view().innerHTML = `
      <div class="chips">${filters.map(f=>`<button class="chip ${f.k===active?'active':''}" data-f="${f.k}">${f.label}</button>`).join('')}</div>
      ${list.length ? list.map(repairCard).join('') : emptyState('Sin reparaciones','No hay registros en esta categoría')}
    `;
    view().querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>repairsList(c.dataset.f)));
    bindRepairCards();
  }

  // ============= NUEVA / EDITAR =============
  function naWrap(fieldKey, label, inputHtml, naFields){
    const isNa = naFields.includes(fieldKey);
    return `<div class="form-group" data-na-group="${fieldKey}">
      <label>${label}
        <label class="na-toggle"><input type="checkbox" data-na="${fieldKey}" ${isNa?'checked':''}> Sin datos</label>
      </label>
      <div class="na-input ${isNa?'disabled':''}">${inputHtml}</div>
    </div>`;
  }

  function newRepair(existing){
    const r = existing || {};
    const photos = { device: (r.devicePhotos||[]).slice(), client: r.clientPhoto || null };
    let acceptAudio = r.acceptAudio || null;
    const naFields = (r.naFields||[]).slice();

    const deviceOptions = DB.settings.deviceTypes.map(d=>`<option value="${escape(d)}">`).join('');

    view().innerHTML = `
      <h2 style="margin:0 0 16px;font-size:20px">${existing?'Editar reparación':'Nueva reparación'}</h2>
      <form id="repairForm" novalidate>

        <div class="section-title">Fotos del equipo</div>
        <div id="devicePhotos" class="multi-photo-grid"></div>
        <label class="photo-add-btn">
          ${ICONS.plus}<span>Añadir foto del equipo</span>
          <input type="file" accept="image/*" capture="environment" id="addDevicePhoto" multiple>
        </label>

        <div class="section-title">Foto del cliente</div>
        <div class="photo-grid single">
          <label class="photo-input ${photos.client?'has-img':''}" id="clientPhotoBox"></label>
        </div>

        <div class="section-title">Cliente</div>
        <div class="form-group">
          <label>Nombre del cliente *</label>
          <input name="clientName" required value="${escape(r.clientName||'')}">
        </div>
        ${naWrap('clientPhone','Teléfono',`<input name="clientPhone" type="tel" value="${escape(r.clientPhone||'')}">`,naFields)}
        ${naWrap('clientEmail','Email',`<input name="clientEmail" type="email" value="${escape(r.clientEmail||'')}">`,naFields)}

        <div class="section-title">Equipo</div>
        <div class="form-group">
          <label>Equipo *</label>
          <input name="device" list="deviceTypesList" required placeholder="Selecciona o escribe" value="${escape(r.device||'')}">
          <datalist id="deviceTypesList">${deviceOptions}</datalist>
        </div>
        ${naWrap('brand','Marca',`<input name="brand" value="${escape(r.brand||'')}">`,naFields)}
        ${naWrap('model','Modelo',`<input name="model" value="${escape(r.model||'')}">`,naFields)}
        ${naWrap('serial','Nº de serie',`<input name="serial" value="${escape(r.serial||'')}">`,naFields)}

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
        ${naWrap('price','Precio (€)',`<input name="price" type="number" step="0.01" value="${r.price!=null?r.price:''}">`,naFields)}
        ${naWrap('deposit','Anticipo (€)',`<input name="deposit" type="number" step="0.01" value="${r.deposit!=null?r.deposit:''}">`,naFields)}
        ${naWrap('notes','Notas',`<textarea name="notes">${escape(r.notes||'')}</textarea>`,naFields)}

        <div class="section-title">Audio: cliente aceptando la reparación</div>
        <div class="admin-card" id="audioBox"></div>

        <button type="submit" class="btn-primary">${existing?'Guardar cambios':'Registrar reparación'}</button>
      </form>
    `;

    // ---- N/A toggles ----
    view().querySelectorAll('input[data-na]').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        const key = cb.dataset.na;
        const wrap = cb.closest('[data-na-group]').querySelector('.na-input');
        const inp = wrap.querySelector('input,textarea');
        if(cb.checked){
          if(!naFields.includes(key)) naFields.push(key);
          wrap.classList.add('disabled');
          inp && (inp.disabled = true);
        } else {
          const i = naFields.indexOf(key); if(i>=0) naFields.splice(i,1);
          wrap.classList.remove('disabled');
          inp && (inp.disabled = false);
        }
      });
      // estado inicial
      const wrap = cb.closest('[data-na-group]').querySelector('.na-input');
      const inp = wrap.querySelector('input,textarea');
      if(cb.checked) inp && (inp.disabled = true);
    });

    // ---- fotos del equipo (multi) ----
    function renderDevicePhotos(){
      const wrap = document.getElementById('devicePhotos');
      if(!photos.device.length){ wrap.innerHTML = '<p class="muted small">Aún no hay fotos del equipo.</p>'; return; }
      wrap.innerHTML = photos.device.map((src,i)=>`
        <div class="photo-item"><img src="${src}"><button type="button" class="photo-remove" data-rm-dev="${i}">${ICONS.trash}</button></div>
      `).join('');
      wrap.querySelectorAll('[data-rm-dev]').forEach(b=>{
        b.onclick = e=>{ e.preventDefault(); photos.device.splice(+b.dataset.rmDev,1); renderDevicePhotos(); };
      });
    }
    renderDevicePhotos();
    document.getElementById('addDevicePhoto').addEventListener('change', async e=>{
      for(const f of Array.from(e.target.files||[])){
        try{ photos.device.push(await UI.resizeImage(f)); }catch(err){ UI.toast('Error con imagen'); }
      }
      e.target.value = '';
      renderDevicePhotos();
    });

    // ---- foto cliente ----
    function renderClient(){
      const box = document.getElementById('clientPhotoBox');
      box.classList.toggle('has-img', !!photos.client);
      box.innerHTML = photos.client
        ? `<img src="${photos.client}"><input type="file" accept="image/*" capture="user" id="clientPhotoInput"><button type="button" class="photo-remove" id="clientPhotoRm">${ICONS.trash}</button>`
        : `${ICONS.person}<span>Foto del cliente</span><input type="file" accept="image/*" capture="user" id="clientPhotoInput">`;
      const inp = document.getElementById('clientPhotoInput');
      if(inp) inp.onchange = async e=>{
        const f = e.target.files[0]; if(!f) return;
        try{ photos.client = await UI.resizeImage(f); renderClient(); }catch(err){ UI.toast('Error con imagen'); }
      };
      const rm = document.getElementById('clientPhotoRm');
      if(rm) rm.onclick = e=>{ e.preventDefault(); photos.client = null; renderClient(); };
    }
    renderClient();

    // ---- audio ----
    let rec = null;
    function renderAudio(){
      const box = document.getElementById('audioBox');
      if(acceptAudio){
        box.innerHTML = `<audio controls src="${acceptAudio}" style="width:100%"></audio>
          <button type="button" class="btn-secondary" id="rmAudio" style="margin-top:10px">${ICONS.trash} Eliminar audio</button>`;
        document.getElementById('rmAudio').onclick = ()=>{ acceptAudio = null; renderAudio(); };
      } else {
        box.innerHTML = `
          <p class="muted small">Graba al cliente diciendo que acepta la reparación. Opcional.</p>
          <div class="row-between">
            <button type="button" class="btn-primary" id="recStart" style="width:auto;padding:10px 16px">${ICONS.mic} Grabar</button>
            <button type="button" class="btn-secondary" id="recStop" style="width:auto;padding:10px 16px;display:none">${ICONS.stop} Detener</button>
            <span id="recTimer" class="muted small"></span>
          </div>
          <input type="file" accept="audio/*" id="audioFile" style="margin-top:10px">
        `;
        document.getElementById('recStart').onclick = async ()=>{
          try{
            rec = UI.createRecorder();
            await rec.start(s=>{ document.getElementById('recTimer').textContent = `Grabando... ${s}s`; });
            document.getElementById('recStart').style.display = 'none';
            document.getElementById('recStop').style.display = '';
          }catch(e){ UI.toast('No se pudo acceder al micrófono'); }
        };
        document.getElementById('recStop').onclick = async ()=>{
          try{ acceptAudio = await rec.stop(); renderAudio(); }catch(e){ UI.toast('Error al detener'); }
        };
        document.getElementById('audioFile').onchange = async e=>{
          const f = e.target.files[0]; if(!f) return;
          acceptAudio = await UI.blobToDataUrl(f); renderAudio();
        };
      }
    }
    renderAudio();

    // ---- submit ----
    document.getElementById('repairForm').addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {};
      // recoger campos respetando N/A
      ['clientName','clientPhone','clientEmail','device','brand','model','serial','issue','status','notes'].forEach(k=>{
        data[k] = naFields.includes(k) ? null : (fd.get(k) || null);
      });
      data.clientName = fd.get('clientName'); // requerido
      data.device = fd.get('device');
      data.issue = fd.get('issue');
      data.status = fd.get('status');
      const due = fd.get('dueDate');
      data.dueDate = due ? new Date(due).getTime() : null;
      const price = fd.get('price'); const dep = fd.get('deposit');
      data.price = naFields.includes('price') ? null : (price ? parseFloat(price) : null);
      data.deposit = naFields.includes('deposit') ? null : (dep ? parseFloat(dep) : null);
      data.devicePhotos = photos.device;
      data.devicePhoto = photos.device[0] || null; // compat con versiones viejas
      data.clientPhoto = photos.client;
      data.acceptAudio = acceptAudio;
      data.naFields = naFields;

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

  // ============= DETALLE =============
  function showRepair(id){
    const r = DB.findRepair(id);
    if(!r) return;
    const photos = (r.devicePhotos && r.devicePhotos.length) ? r.devicePhotos : (r.devicePhoto?[r.devicePhoto]:[]);
    const naFields = r.naFields || [];
    const valOf = (key, fallback='—') => naFields.includes(key) ? '<i class="muted">Sin datos</i>' : (r[key] || fallback);

    const html = `
      <h2 style="margin:0 0 4px;font-size:20px">${escape(r.device||'Equipo')}</h2>
      <p class="muted" style="margin:0 0 14px">${escape(r.id)} · <span class="status ${r.status}">${statusLabel(r.status)}</span></p>

      ${photos.length ? `<div class="detail-photo-strip">${photos.map(p=>`<img src="${p}">`).join('')}</div>` : ''}
      ${r.clientPhoto ? `<div class="detail-photos"><div class="thumb-big"><img src="${r.clientPhoto}"></div></div>` : ''}

      <div class="detail-row"><span class="lbl">Cliente</span><span class="val">${escape(r.clientName||'—')}</span></div>
      <div class="detail-row"><span class="lbl">Teléfono</span><span class="val">${naFields.includes('clientPhone')?'<i class="muted">Sin datos</i>':(r.clientPhone?`<a href="tel:${escape(r.clientPhone)}" style="color:var(--primary-glow);text-decoration:none">${escape(r.clientPhone)}</a>`:'—')}</span></div>
      <div class="detail-row"><span class="lbl">Email</span><span class="val">${escape(valOf('clientEmail'))}</span></div>
      <div class="detail-row"><span class="lbl">Marca</span><span class="val">${escape(valOf('brand'))}</span></div>
      <div class="detail-row"><span class="lbl">Modelo</span><span class="val">${escape(valOf('model'))}</span></div>
      <div class="detail-row"><span class="lbl">Nº serie</span><span class="val">${escape(valOf('serial'))}</span></div>
      <div class="detail-row"><span class="lbl">Falla</span><span class="val">${escape(r.issue||'—')}</span></div>
      <div class="detail-row"><span class="lbl">Notas</span><span class="val">${escape(valOf('notes'))}</span></div>
      <div class="detail-row"><span class="lbl">Ingreso</span><span class="val">${fmtDate(r.createdAt)}</span></div>
      <div class="detail-row"><span class="lbl">Entrega</span><span class="val">${r.dueDate?fmtDate(r.dueDate):'—'}</span></div>
      <div class="detail-row"><span class="lbl">Precio</span><span class="val">${naFields.includes('price')?'<i class="muted">Sin datos</i>':(r.price!=null?'€'+Number(r.price).toFixed(2):'—')}</span></div>
      <div class="detail-row"><span class="lbl">Anticipo</span><span class="val">${naFields.includes('deposit')?'<i class="muted">Sin datos</i>':(r.deposit!=null?'€'+Number(r.deposit).toFixed(2):'—')}</span></div>

      ${r.acceptAudio ? `<div class="section-title">Aceptación del cliente</div><audio controls src="${r.acceptAudio}" style="width:100%"></audio>` : ''}

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
      UI.toast('Estado actualizado'); UI.closeModal(); App.refresh();
    });
    document.getElementById('editBtn').onclick = ()=>{ UI.closeModal(); App.go('new', null, r); };
    document.getElementById('delBtn').onclick = ()=>{
      if(confirm('¿Eliminar esta reparación?')){
        DB.deleteRepair(id); UI.toast('Eliminada'); UI.closeModal(); App.refresh();
      }
    };
  }

  // ============= BUSCAR =============
  function search(){
    view().innerHTML = `
      <div class="search-bar">${ICONS.search}
        <input id="searchInput" placeholder="Buscar cliente, equipo, teléfono o ID..." autofocus>
      </div>
      <div id="searchResults"></div>`;
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    function render(q){
      const list = DB.search(q);
      results.innerHTML = list.length ? list.map(repairCard).join('') : emptyState('Sin resultados','Prueba con otro término');
      results.querySelectorAll('.repair-card').forEach(c=>c.addEventListener('click',()=>showRepair(c.dataset.id)));
    }
    render('');
    input.addEventListener('input', e=>render(e.target.value));
  }

  // ============= ADMIN =============
  function admin(){
    const s = DB.settings;
    const g = s.github;
    const hasLocal = LocalFile.hasHandle();
    const localSupported = LocalFile.isSupported();

    view().innerHTML = `
      <h2 style="margin:0 0 16px;font-size:20px">Administración</h2>

      <div class="admin-card">
        <h3>Nombre del sistema</h3>
        <p>Aparece en la cabecera y pantalla de inicio</p>
        <input id="appNameInput" value="${escape(s.appName)}">
      </div>

      <div class="admin-card">
        <div class="row-between">
          <div style="flex:1"><h3>Pedir contraseña al entrar</h3><p>Si está apagado, no pedirá contraseña</p></div>
          <label class="switch"><input type="checkbox" id="reqPass" ${s.requirePassword?'checked':''}><span class="slider"></span></label>
        </div>
      </div>

      <div class="admin-card">
        <h3>Cambiar contraseña</h3>
        <p>Define una nueva contraseña de acceso</p>
        <div class="form-group"><input type="password" id="newPass" placeholder="Nueva contraseña"></div>
        <button class="btn-secondary" id="savePassBtn">Actualizar contraseña</button>
      </div>

      <div class="admin-card">
        <div class="row-between" style="margin-bottom:8px">
          <h3 style="margin:0">${ICONS.cloud} Sincronización GitHub</h3>
          <label class="switch"><input type="checkbox" id="ghEnabled" ${g.enabled?'checked':''}><span class="slider"></span></label>
        </div>
        <p>Sube/baja un JSON con todos tus datos usando la API de GitHub. Crea un token en <b>github.com → Settings → Developer settings → Personal access tokens (Fine-grained)</b> con permiso de lectura y escritura de Contents en tu repo.</p>
        <div class="form-row">
          <div class="form-group"><label>Usuario / org</label><input id="ghUser" value="${escape(g.user)}" placeholder="tu-usuario"></div>
          <div class="form-group"><label>Repositorio</label><input id="ghRepo" value="${escape(g.repo)}" placeholder="taller-datos"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Rama</label><input id="ghBranch" value="${escape(g.branch||'main')}" placeholder="main"></div>
          <div class="form-group"><label>Ruta del archivo</label><input id="ghPath" value="${escape(g.path||'taller-data.json')}"></div>
        </div>
        <div class="form-group"><label>Token (se guarda solo en este dispositivo)</label><input id="ghToken" type="password" value="${escape(g.token||'')}" placeholder="github_pat_..."></div>
        <div class="form-group">
          <label class="na-toggle" style="margin:0"><input type="checkbox" id="ghAuto" ${g.autoSync?'checked':''}> Sincronización automática al guardar</label>
        </div>
        <div class="btn-row">
          <button class="btn-secondary" id="ghTest">Probar</button>
          <button class="btn-secondary" id="ghPull">Bajar de GitHub</button>
        </div>
        <button class="btn-primary" id="ghPush" style="margin-top:8px">Subir ahora a GitHub</button>
        <p class="muted small" style="margin-top:10px">Última sincronización: ${g.lastSyncAt?fmtDateTime(g.lastSyncAt):'nunca'}</p>
      </div>

      <div class="admin-card">
        <h3>${ICONS.save} Guardar JSON en una ubicación</h3>
        <p>Elige una carpeta/archivo del dispositivo. El sistema escribirá ahí automáticamente cuando guardes cambios.</p>
        ${localSupported ? `
          <div class="btn-row">
            <button class="btn-secondary" id="pickLoc">${hasLocal?'Cambiar ubicación':'Elegir ubicación'}</button>
            <button class="btn-secondary" id="clearLoc" ${hasLocal?'':'disabled'}>Quitar ubicación</button>
          </div>
          <button class="btn-secondary" id="loadFromLoc" ${hasLocal?'':'disabled'} style="margin-top:8px">Cargar desde el archivo</button>
          <p class="muted small" style="margin-top:8px">Estado: ${hasLocal?'<b>Ubicación configurada</b>':'sin configurar'}</p>
        ` : `<p class="muted small">Tu navegador no soporta elegir ubicación. Usa "Exportar JSON" en su lugar.</p>`}
      </div>

      <div class="admin-card">
        <h3>Copia local (manual)</h3>
        <p>Exporta o importa el JSON manualmente</p>
        <div class="btn-row">
          <button class="btn-secondary" id="exportBtn">Exportar JSON</button>
          <button class="btn-secondary" id="importBtn">Importar JSON</button>
        </div>
        <input type="file" id="importFile" accept="application/json" style="display:none">
      </div>

      <div class="admin-card">
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

      <div class="admin-card">
        <h3>Estadísticas</h3>
        <p>Total reparaciones: <b>${DB.repairs.length}</b> · Versión de datos: v${DB.all.schemaVersion}</p>
      </div>
    `;

    // Nombre
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

    // GitHub
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
    document.getElementById('ghTest').onclick = async ()=>{
      DB.updateGithub(readGh());
      try{ await GitSync.test(); UI.toast('Conexión OK'); }catch(e){ UI.toast('Error: '+e.message); }
    };
    document.getElementById('ghPush').onclick = async ()=>{
      DB.updateGithub(readGh());
      try{ await GitSync.push(); UI.toast('Subido a GitHub'); App.refresh(); }catch(e){ UI.toast('Error: '+e.message); }
    };
    document.getElementById('ghPull').onclick = async ()=>{
      DB.updateGithub(readGh());
      if(!confirm('Esto reemplazará tus datos locales con los de GitHub. ¿Continuar?')) return;
      try{ await GitSync.pull(); UI.toast('Datos descargados'); App.refresh(); }catch(e){ UI.toast('Error: '+e.message); }
    };

    // Local file handle
    if(localSupported){
      document.getElementById('pickLoc').onclick = async ()=>{
        try{ await LocalFile.pickLocation(); UI.toast('Ubicación guardada'); App.refresh(); }
        catch(e){ if(e.name!=='AbortError') UI.toast('Error: '+e.message); }
      };
      const clr = document.getElementById('clearLoc');
      if(clr) clr.onclick = async ()=>{ await LocalFile.clearHandle(); UI.toast('Ubicación quitada'); App.refresh(); };
      const lf = document.getElementById('loadFromLoc');
      if(lf) lf.onclick = async ()=>{
        if(!confirm('Reemplazar datos locales con los del archivo elegido?')) return;
        try{ const ok = await LocalFile.loadFromFile(); UI.toast(ok?'Cargado':'No se pudo cargar'); App.refresh(); }
        catch(e){ UI.toast('Error: '+e.message); }
      };
    }

    // Export/Import manual
    document.getElementById('exportBtn').onclick = ()=>{ DB.exportJson(); UI.toast('Descargado'); };
    document.getElementById('importBtn').onclick = ()=> document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = e=>{
      const f = e.target.files[0]; if(!f) return;
      if(!confirm('Esto reemplazará todos los datos. ¿Continuar?')) return;
      const reader = new FileReader();
      reader.onload = ev=>{
        if(DB.importJson(ev.target.result)){ UI.toast('Importado'); App.refresh(); }
        else UI.toast('Archivo inválido');
      };
      reader.readAsText(f);
    };

    // Equipos
    document.getElementById('addDeviceBtn').onclick = ()=>{
      const v = document.getElementById('newDeviceType').value;
      if(DB.addDeviceType(v)){ UI.toast('Equipo añadido'); admin(); }
      else UI.toast('Vacío o duplicado');
    };
    document.querySelectorAll('[data-rm-dev]').forEach(b=>{
      b.onclick = ()=>{ DB.removeDeviceType(b.dataset.rmDev); admin(); };
    });
  }

  return { dashboard, repairsList, newRepair, search, admin, showRepair };
})();

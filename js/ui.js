const UI = (() => {
  const $ = sel => document.querySelector(sel);
  // Delegación global: ojo para mostrar/ocultar contraseña en cualquier .pwd-wrap
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest && e.target.closest('[data-pwd-toggle]');
    if(!btn) return;
    e.preventDefault();
    const wrap = btn.closest('.pwd-wrap');
    const inp = wrap && wrap.querySelector('input');
    if(!inp) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    btn.classList.toggle('is-visible', show);
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
  function toast(msg, ms=2400){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tm);
    t._tm = setTimeout(()=>t.classList.add('hidden'), ms);
  }
  function openModal(html){
    $('#modalBody').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }
  function closeModal(){ $('#modal').classList.add('hidden'); $('#modalBody').innerHTML=''; }
  // v54 — Reproductor de audio propio (sustituye al <audio controls> nativo).
  // Motivo: en móviles el control nativo dentro de nuestros modales dibuja la
  // barra de progreso CORRIDA (arrancaba "después de la mitad") porque la
  // duración de un DataURL webm/ogg se conoce tarde y el motor no repinta el
  // rail. Con el reproductor propio la barra es un div con ancho exacto:
  // 0 % en el instante 0, sincronizado por timeupdate, y un input range
  // invisible para arrastrar/retroceder con precisión.
  // Uso: UI.audioPlayerHtml(id) devuelve el markup; UI.bindAudioPlayer(id, src)
  // lo conecta. El formulario y el detalle lo usan.
  function audioPlayerHtml(id){
    return `
      <div class="edr-audio" id="${id}">
        <button type="button" class="edr-ap-btn" data-ap="play" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" class="edr-ap-play"><path d="M8 5v14l11-7z"/></svg>
          <svg viewBox="0 0 24 24" class="edr-ap-pause" style="display:none"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
        </button>
        <div class="edr-ap-track" data-ap="track">
          <div class="edr-ap-fill" data-ap="fill"></div>
          <div class="edr-ap-knob" data-ap="knob"></div>
          <input type="range" min="0" max="1000" step="1" value="0" data-ap="seek" aria-label="Posición del audio">
        </div>
        <span class="edr-ap-time" data-ap="time">0:00 / 0:00</span>
      </div>`;
  }
  function bindAudioPlayer(id, src){
    const root = document.getElementById(id);
    if(!root || root._bound) return;
    root._bound = true;
    const btn  = root.querySelector('[data-ap="play"]');
    const playIco  = root.querySelector('.edr-ap-play');
    const pauseIco = root.querySelector('.edr-ap-pause');
    const fill = root.querySelector('[data-ap="fill"]');
    const knob = root.querySelector('[data-ap="knob"]');
    const seek = root.querySelector('[data-ap="seek"]');
    const time = root.querySelector('[data-ap="time"]');
    const audio = new Audio(src);
    audio.preload = 'metadata';
    // v55 — Segunda capa del fix "reproduce desde la mitad": si el contenedor
    // (webm de MediaRecorder) reporta duration=Infinity, medimos la duración
    // real decodificando en memoria (AudioContext.decodeAudioData) y forzamos
    // la posición de reproducción a 0 en cada arranque. seek/exact.
    let knownDuration = 0;
    const fixInfiniteDuration = () => {
      if(isFinite(audio.duration) && audio.duration>0){ knownDuration = audio.duration; return; }
      if(knownDuration > 0) return;
      try{
        const byteStr = atob(String(src).split(',')[1] || '');
        const bytes = new Uint8Array(byteStr.length);
        for(let i=0;i<byteStr.length;i++) bytes[i] = byteStr.charCodeAt(i);
        const AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return;
        const ctx = new AC();
        ctx.decodeAudioData(bytes.buffer, buf=>{
          knownDuration = buf.duration;
          try{ ctx.close(); }catch(_){}
          paint();
        }, ()=>{ try{ ctx.close(); }catch(_){} });
      }catch(e){}
    };
    const dur = () => isFinite(audio.duration) && audio.duration>0 ? audio.duration : knownDuration;
    const fmt = s => {
      if(!isFinite(s)) return '0:00';
      s = Math.max(0, Math.floor(s));
      return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
    };
    function paint(){
      const d = dur();
      const p = d>0 ? Math.min(1, audio.currentTime/d) : 0;
      const pct = (p*100).toFixed(3) + '%';
      if(fill) fill.style.width = pct;
      if(knob) knob.style.left = pct;
      if(time) time.textContent = fmt(audio.currentTime) + ' / ' + fmt(d);
    }
    audio.addEventListener('loadedmetadata', ()=>{ fixInfiniteDuration(); paint(); });
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('ended', ()=>{
      playIco.style.display = ''; pauseIco.style.display = 'none';
      paint();
    });
    btn.addEventListener('click', ()=>{
      if(audio.paused){
        // NUNCA arrancar "desde la mitad": la primera reproducción parte de 0.
        if(!isFinite(audio.duration)){ try{ audio.currentTime = 0; }catch(_){} }
        audio.play().then(()=>{
          if(!isFinite(audio.duration) || audio.duration===0){
            // Infinity: reposicionar a 0 tras arrancar (Chromium re-ancla)
            try{ audio.currentTime = 0; }catch(_){}
          }
          fixInfiniteDuration();
        }).catch(()=>{});
      } else { audio.pause(); }
    });
    audio.addEventListener('play',  ()=>{ playIco.style.display='none'; pauseIco.style.display=''; });
    audio.addEventListener('pause', ()=>{ playIco.style.display='';   pauseIco.style.display='none'; });
    seek.addEventListener('input', ()=>{
      const d = dur();
      if(d>0) audio.currentTime = Math.min(d, (Number(seek.value)/1000) * d);
      paint();
    });
    fixInfiniteDuration();
    paint();
    return audio;
  }
  function escape(s){ return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function fmtDate(ts){
    if(!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
  }
  function fmtDateTime(ts){
    if(!ts) return '—';
    return new Date(ts).toLocaleString('es-ES');
  }
  function fmtDateInput(ts){
    if(!ts) return '';
    // v56d — FECHA LOCAL: toISOString() convierte a UTC y en husos
    // negativos (América) o madrugadas europeas desplaza la fecha un día
    // (registrar HOY aparecía como AYER o como OTRO MES al final del mes).
    // Se construye la cadena YYYY-MM-DD con los componentes LOCALES.
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + dd;
  }
  function localNoon(str){
    // v56d — parseo de un input type="date" ('YYYY-MM-DD') en el huso LOCAL:
    // new Date('YYYY-MM-DD') interpreta medianoche UTC; añadimos T12:00
    // (sin zona) para anclar al mediodía local del día elegido, inmune a
    // husos ±13h y al horario de verano.
    if(!str) return Date.now();
    return new Date(str + 'T12:00:00').getTime();
  }
  function statusLabel(s){
    return ({
      pending:'Pendiente', in_progress:'En proceso',
      awaiting:'Esperando recogida', completed:'Completada', delivered:'Entregada',
      cancelled:'Cancelada', no_devolution:'Sin devolución'
    })[s] || s;
  }
  // Render del nombre del sistema con segunda palabra en marrón
  function renderBrand(name){
    const parts = String(name||'').trim().split(/\s+/);
    if(parts.length < 2) return escape(parts[0]||'');
    return `${escape(parts[0])} <span class="w2">${escape(parts.slice(1).join(' '))}</span>`;
  }
  // Limpia un número para tel:/sms:/wa.me
  function phoneClean(p){ return String(p||'').replace(/[^\d+]/g,''); }
  function phoneWa(p){ return String(p||'').replace(/\D/g,''); }
  function phoneSms(p){ return String(p||'').replace(/[^\d+]/g,''); }

  // Confirmación elegante (Promise<boolean>)
  function confirmDialog({title='¿Confirmar?', message='', okText='Aceptar', cancelText='Cancelar', danger=false}={}){
    return new Promise(resolve=>{
      const wrap = document.createElement('div');
      wrap.className = 'confirm-overlay';
      wrap.innerHTML = `
        <div class="confirm-card" role="dialog" aria-modal="true">
          <h3>${escape(title)}</h3>
          <p>${escape(message)}</p>
          <div class="btn-row">
            <button class="btn-secondary" data-act="cancel">${escape(cancelText)}</button>
            <button class="btn-primary ${danger?'btn-cancel':''}" data-act="ok">${escape(okText)}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      function close(v){ wrap.remove(); resolve(v); }
      wrap.addEventListener('click', e=>{
        if(e.target===wrap) close(false);
        const act = e.target.closest('[data-act]')?.dataset.act;
        if(act==='ok') close(true);
        if(act==='cancel') close(false);
      });
    });
  }

  function capitalizeWords(str){
    if(!str) return '';
    return str.replace(/(^|\s)([\p{L}])/gu, (_,sp,ch)=> sp + ch.toLocaleUpperCase('es'));
  }
  function attachAutoCapitalize(input){
    if(!input) return;
    input.setAttribute('autocapitalize','words');
    input.addEventListener('input', ()=>{
      const start = input.selectionStart;
      const newVal = capitalizeWords(input.value);
      if(newVal !== input.value){
        input.value = newVal;
        try{ input.setSelectionRange(start, start); }catch(e){}
      }
    });
  }
  // Estado global compartido del visor — evita que swipes posteriores
  // reutilicen las imágenes de un cliente anterior.
  const _viewerState = { srcs: [], i: 0, el: null, keyHandler: null };
  function openImageViewer(srcs, index=0){
    if(typeof srcs === 'string') srcs = [srcs];
    if(!srcs || !srcs.length) return;
    // Copia defensiva — si el llamador muta su array, no nos afecta
    _viewerState.srcs = srcs.slice();
    _viewerState.i = Math.max(0, Math.min(index, _viewerState.srcs.length-1));

    let el = _viewerState.el;
    if(!el){
      el = document.createElement('div');
      el.id = 'imgViewer';
      el.className = 'img-viewer';
      el.innerHTML = `
        <button class="iv-close" aria-label="Cerrar">&times;</button>
        <button class="iv-prev" aria-label="Anterior">&#10094;</button>
        <img class="iv-img" alt="">
        <button class="iv-next" aria-label="Siguiente">&#10095;</button>
        <div class="iv-count"></div>`;
      document.body.appendChild(el);
      _viewerState.el = el;
      el.addEventListener('click', e=>{
        if(e.target===el || e.target.classList.contains('iv-close')) closeViewer();
      });
      el.querySelector('.iv-prev').addEventListener('click', ()=> showAt(_viewerState.i-1));
      el.querySelector('.iv-next').addEventListener('click', ()=> showAt(_viewerState.i+1));
      // Soporte gestos táctiles para imágenes únicas: no navegar
      let tStartX = 0, tStartY = 0;
      el.addEventListener('touchstart', e=>{
        if(!e.touches[0]) return;
        tStartX = e.touches[0].clientX; tStartY = e.touches[0].clientY;
      }, {passive:true});
      el.addEventListener('touchend', e=>{
        if(_viewerState.srcs.length<=1) return;
        const t = e.changedTouches[0]; if(!t) return;
        const dx = t.clientX - tStartX, dy = t.clientY - tStartY;
        if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
          showAt(_viewerState.i + (dx<0 ? 1 : -1));
        }
      });
      _viewerState.keyHandler = e=>{
        if(!el.classList.contains('open')) return;
        if(e.key==='Escape') closeViewer();
        if(_viewerState.srcs.length<=1) return;
        if(e.key==='ArrowLeft') showAt(_viewerState.i-1);
        if(e.key==='ArrowRight') showAt(_viewerState.i+1);
      };
      document.addEventListener('keydown', _viewerState.keyHandler);
    }
    function showAt(n){
      const len = _viewerState.srcs.length;
      if(!len) return;
      _viewerState.i = (n + len) % len;
      el.querySelector('.iv-img').src = _viewerState.srcs[_viewerState.i];
      el.querySelector('.iv-count').textContent = len>1 ? `${_viewerState.i+1} / ${len}` : '';
      el.querySelector('.iv-prev').style.display = len>1 ? '' : 'none';
      el.querySelector('.iv-next').style.display = len>1 ? '' : 'none';
    }
    function closeViewer(){
      el.classList.remove('open');
      // Limpia para que no aparezcan fotos de otros clientes después
      _viewerState.srcs = [];
      _viewerState.i = 0;
      const img = el.querySelector('.iv-img'); if(img) img.src = '';
    }
    showAt(_viewerState.i);
    el.classList.add('open');
  }
  async function resizeImage(file, maxDim=900, quality=.72){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let {width,height} = img;
          if(width>height && width>maxDim){ height = height*maxDim/width; width = maxDim; }
          else if(height>maxDim){ width = width*maxDim/height; height = maxDim; }
          const c = document.createElement('canvas');
          c.width=width; c.height=height;
          c.getContext('2d').drawImage(img,0,0,width,height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  async function blobToDataUrl(blob){
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  // Grabador de audio MEJORADO — sin cortes, alta calidad
  function pickAudioMime(){
    const types = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/webm',
      'audio/mp4'
    ];
    if(!('MediaRecorder' in window)) return '';
    for(const t of types){
      try{ if(MediaRecorder.isTypeSupported(t)) return t; }catch(e){}
    }
    return '';
  }
  // v55 — FIX "el grabado se reproduce desde la mitad":
  // Chromium graba webm SIN duración en la cabecera → <audio>.duration llega
  // Infinity → el navegador posiciona la reproducción donde quiere (mitad).
  // Solución estándar (la misma de MediaRecorder docs/StackOverflow 2024):
  // parchear los bytes EBML del cluster 0 con la duración REAL medida con
  // reloj (startedAt→stop) en float doble de 8 bytes. Si algo falla, queda
  // el fix del reproductor (seekToStart + duration calculada).
  function patchWebmDuration(blob, durationMs){
    return new Promise(resolve=>{
      try{
        // El header webm busca el elemento "Duration" (ID 0x04489) por
        // delante: 0000 0000-ish. Estrategia mínima robusta: convertir a
        // ArrayBuffer, localizar los 8 bytes del valor float de Duration
        // (patrón 0x4489 + longitud 8 en el Info del segmento) y escribir.
        blob.arrayBuffer().then(buf=>{
          const u8 = new Uint8Array(buf);
          // Buscar EBML-ID 0x2AD7B1 (TimecodeScale) NO hace falta: Duration
          // es 0x4489 seguido de 0x88 (longitud 8, doble).
          for(let i=0;i<u8.length-10;i++){
            if(u8[i]===0x44 && u8[i+1]===0x89 && u8[i+2]===0x88){
              // verificar que no sea "Duration=0" ya correcta
              const dv = new DataView(buf, i+3, 8);
              const cur = dv.getFloat64(0, true);
              if(isFinite(cur) && cur>0 && cur<1e12){ break; }
              // Escribir la duración real en nanoseundos-escala del reloj
              // webm (TimecodeScale por defecto 1ms → nanosegundos: x1e6)
              const ns = durationMs * 1e6;
              dv.setFloat64(0, ns, true);
              break;
            }
          }
          resolve(new Blob([u8], { type: blob.type }));
        }).catch(()=> resolve(blob));
      }catch(e){ resolve(blob); }
    });
  }
  function createRecorder(){
    let mediaRec = null, chunks = [], stream = null, startedAt = 0, tickTimer = null;
    return {
      async start(onTick){
        // v61 — CALIDAD DE GRABACIÓN mejorada:
        // · Opus a 192 kbps (transparente para voz; antes 128 kbps).
        // · SIN autoGainControl: aplasta la dinámica de la voz y hace
        //   "bombeo" (sube/baja el volumen constantemente).
        // · echoCancellation solo si se habla cerca del micrófono del propio
        //   equipo (grabación de notas de taller: no hay llamada, no hace
        //   falta; quitarlo evita filtrado extra). noiseSuppression suave
        //   se mantiene porque el taller tiene ruido de fondo.
        // · sampleRate 48 kHz mono nativo.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: false,
            noiseSuppression: true,
            autoGainControl: false
          }
        });
        chunks = [];
        const mime = pickAudioMime();
        const opts = { audioBitsPerSecond: 192000 };
        if(mime) opts.mimeType = mime;
        try{
          mediaRec = new MediaRecorder(stream, opts);
        }catch(e){
          try{
            // v61 — algunos navegadores viejos no aceptan bitrate alto:
            mediaRec = new MediaRecorder(stream, { ...(mime?{mimeType:mime}:{}) });
          }catch(e2){
            mediaRec = new MediaRecorder(stream);
          }
        }
        mediaRec.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
        // timeslice 1000ms = recoge datos cada segundo (evita pérdidas si algo interrumpe)
        mediaRec.start(1000);
        startedAt = Date.now();
        if(onTick){
          onTick(0);
          tickTimer = setInterval(()=> onTick(Math.floor((Date.now()-startedAt)/1000)), 500);
        }
      },
      async stop(){
        clearInterval(tickTimer);
        return new Promise((res,rej)=>{
          if(!mediaRec) return rej(new Error('No recorder'));
          mediaRec.onstop = async ()=>{
            try{
              const type = mediaRec.mimeType || 'audio/webm';
              let blob = new Blob(chunks, { type });
              if(stream) stream.getTracks().forEach(t=>t.stop());
              // v55 — duración real medida con reloj (no Infinity) y parche
              // de la cabecera webm para que cualquier reproductor la lea.
              const durationMs = Math.max(0, Date.now() - startedAt);
              if(/webm/i.test(type)){
                try{ blob = await patchWebmDuration(blob, durationMs); }catch(_){}
              }
              res(await blobToDataUrl(blob));
            }catch(e){ rej(e); }
          };
          // mediaRec.requestData() opcional, stop() emite el último chunk
          try{ mediaRec.stop(); }catch(e){ rej(e); }
        });
      },
      cancel(){
        clearInterval(tickTimer);
        try{ mediaRec && mediaRec.state!=='inactive' && mediaRec.stop(); }catch(e){}
        try{ stream && stream.getTracks().forEach(t=>t.stop()); }catch(e){}
      },
      isRecording(){ return mediaRec && mediaRec.state==='recording'; }
    };
  }
  return { $, toast, openModal, closeModal, escape, fmtDate, fmtDateTime, fmtDateInput, localNoon, statusLabel, resizeImage, blobToDataUrl, createRecorder, capitalizeWords, attachAutoCapitalize, openImageViewer, renderBrand, phoneClean, phoneWa, phoneSms, confirmDialog, audioPlayerHtml, bindAudioPlayer };
})();

const UI = (() => {
  const $ = sel => document.querySelector(sel);
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
    const d = new Date(ts);
    return d.toISOString().slice(0,10);
  }
  function statusLabel(s){
    return ({
      pending:'Pendiente', in_progress:'En proceso',
      awaiting:'Esperando recogida', completed:'Completada', delivered:'Entregada'
    })[s] || s;
  }
  // Render del nombre del sistema con segunda palabra en marrón
  function renderBrand(name){
    const parts = String(name||'').trim().split(/\s+/);
    if(parts.length < 2) return escape(parts[0]||'');
    return `${escape(parts[0])} <span class="w2">${escape(parts.slice(1).join(' '))}</span>`;
  }
  // Limpia un número para tel:/wa.me
  function phoneClean(p){ return String(p||'').replace(/[^\d+]/g,''); }
  function phoneWa(p){ return String(p||'').replace(/\D/g,''); }

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
  function openImageViewer(srcs, index=0){
    if(typeof srcs === 'string') srcs = [srcs];
    if(!srcs || !srcs.length) return;
    let i = Math.max(0, Math.min(index, srcs.length-1));
    let el = document.getElementById('imgViewer');
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
      el.addEventListener('click', e=>{
        if(e.target===el || e.target.classList.contains('iv-close')) close();
      });
      el.querySelector('.iv-prev').onclick = ()=> show(i-1);
      el.querySelector('.iv-next').onclick = ()=> show(i+1);
      document.addEventListener('keydown', e=>{
        if(el.classList.contains('open')){
          if(e.key==='Escape') close();
          if(e.key==='ArrowLeft') show(i-1);
          if(e.key==='ArrowRight') show(i+1);
        }
      });
    }
    function show(n){
      i = (n + srcs.length) % srcs.length;
      el.querySelector('.iv-img').src = srcs[i];
      el.querySelector('.iv-count').textContent = srcs.length>1 ? `${i+1} / ${srcs.length}` : '';
      el.querySelector('.iv-prev').style.display = srcs.length>1 ? '' : 'none';
      el.querySelector('.iv-next').style.display = srcs.length>1 ? '' : 'none';
    }
    function close(){ el.classList.remove('open'); }
    el._srcs = srcs;
    show(i);
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
  function createRecorder(){
    let mediaRec = null, chunks = [], stream = null, startedAt = 0, tickTimer = null;
    return {
      async start(onTick){
        // pedimos buena calidad y sin procesamiento agresivo que entrecorta voz
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        chunks = [];
        const mime = pickAudioMime();
        const opts = { audioBitsPerSecond: 128000 };
        if(mime) opts.mimeType = mime;
        try{
          mediaRec = new MediaRecorder(stream, opts);
        }catch(e){
          // fallback sin opciones
          mediaRec = new MediaRecorder(stream);
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
              const blob = new Blob(chunks, { type });
              if(stream) stream.getTracks().forEach(t=>t.stop());
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
  return { $, toast, openModal, closeModal, escape, fmtDate, fmtDateTime, fmtDateInput, statusLabel, resizeImage, blobToDataUrl, createRecorder, capitalizeWords, attachAutoCapitalize, openImageViewer, renderBrand, phoneClean, phoneWa };
})();

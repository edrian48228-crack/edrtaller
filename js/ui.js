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
  // Grabador de audio sencillo
  function createRecorder(){
    let mediaRec = null, chunks = [], stream = null, startedAt = 0, tickTimer = null;
    return {
      async start(onTick){
        stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        chunks = [];
        mediaRec = new MediaRecorder(stream);
        mediaRec.ondataavailable = e => { if(e.data.size) chunks.push(e.data); };
        mediaRec.start();
        startedAt = Date.now();
        if(onTick){ tickTimer = setInterval(()=> onTick(Math.floor((Date.now()-startedAt)/1000)), 500); }
      },
      async stop(){
        clearInterval(tickTimer);
        return new Promise(res=>{
          mediaRec.onstop = async ()=>{
            const blob = new Blob(chunks, { type: mediaRec.mimeType || 'audio/webm' });
            stream.getTracks().forEach(t=>t.stop());
            res(await blobToDataUrl(blob));
          };
          mediaRec.stop();
        });
      },
      cancel(){
        clearInterval(tickTimer);
        try{ mediaRec && mediaRec.state!=='inactive' && mediaRec.stop(); }catch(e){}
        try{ stream && stream.getTracks().forEach(t=>t.stop()); }catch(e){}
      }
    };
  }
  return { $, toast, openModal, closeModal, escape, fmtDate, fmtDateTime, fmtDateInput, statusLabel, resizeImage, blobToDataUrl, createRecorder };
})();

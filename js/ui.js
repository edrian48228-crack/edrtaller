const UI = (() => {
  const $ = sel => document.querySelector(sel);
  function toast(msg, ms=2200){
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
  function fmtDateInput(ts){
    if(!ts) return '';
    const d = new Date(ts);
    return d.toISOString().slice(0,10);
  }
  function statusLabel(s){
    return ({
      pending:'Pendiente',
      in_progress:'En proceso',
      awaiting:'Esperando recogida',
      completed:'Completada',
      delivered:'Entregada'
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
  return { $, toast, openModal, closeModal, escape, fmtDate, fmtDateInput, statusLabel, resizeImage };
})();
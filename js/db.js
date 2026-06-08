// Simple localStorage-based DB with export/import for GitHub sync
const DB = (() => {
  const KEY = 'taller_db_v1';
  const defaults = {
    settings: {
      appName: 'Taller',
      requirePassword: true,
      passwordHash: null
    },
    repairs: [],
    counter: 1
  };
  let data = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(defaults), ...parsed, settings:{...defaults.settings, ...(parsed.settings||{})} };
    }catch(e){ return structuredClone(defaults); }
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(data)); }

  async function sha256(text){
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  return {
    get all(){ return data; },
    get settings(){ return data.settings; },
    get repairs(){ return data.repairs; },
    save, sha256,
    updateSettings(patch){ Object.assign(data.settings, patch); save(); },
    addRepair(r){
      r.id = 'R' + String(data.counter++).padStart(4,'0');
      r.createdAt = Date.now();
      r.updatedAt = Date.now();
      data.repairs.unshift(r);
      save();
      return r;
    },
    updateRepair(id, patch){
      const r = data.repairs.find(x=>x.id===id);
      if(!r) return null;
      Object.assign(r, patch, { updatedAt: Date.now() });
      save();
      return r;
    },
    deleteRepair(id){
      data.repairs = data.repairs.filter(r=>r.id!==id);
      save();
    },
    findRepair(id){ return data.repairs.find(r=>r.id===id); },
    search(q){
      q = (q||'').toLowerCase().trim();
      if(!q) return data.repairs;
      return data.repairs.filter(r =>
        (r.clientName||'').toLowerCase().includes(q) ||
        (r.clientPhone||'').toLowerCase().includes(q) ||
        (r.device||'').toLowerCase().includes(q) ||
        (r.brand||'').toLowerCase().includes(q) ||
        (r.id||'').toLowerCase().includes(q) ||
        (r.issue||'').toLowerCase().includes(q)
      );
    },
    byStatus(status){ return data.repairs.filter(r=>r.status===status); },
    todayPending(){
      const today = new Date(); today.setHours(0,0,0,0);
      const end = today.getTime() + 24*60*60*1000;
      return data.repairs.filter(r =>
        (r.status==='pending'||r.status==='in_progress') &&
        r.dueDate && new Date(r.dueDate).getTime() < end
      );
    },
    exportJson(){
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taller-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importJson(json){
      try{
        const parsed = typeof json==='string' ? JSON.parse(json) : json;
        if(!parsed.repairs) throw new Error('Formato inválido');
        data = { ...structuredClone(defaults), ...parsed, settings:{...defaults.settings, ...(parsed.settings||{})} };
        save();
        return true;
      }catch(e){ return false; }
    }
  };
})();
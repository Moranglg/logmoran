// ════ PROGRAMS — renderProg, openProgEdit, saveProg, delProg ════
function renderProg(){
  const el=document.getElementById('prog-list');
  if(!programs.length){el.innerHTML='<div class="empty"><div class="empty-t">Aucun programme</div></div>';return;}
  el.innerHTML=programs.map(p=>{
    const rows=(p.sessions||[]).map(sid=>{
      const s=sessions.find(x=>x.id===sid);
      if(!s) return '';
      const names=(s.exercises||[]).slice(0,3).map(e=>{const x=exercises.find(ex=>ex.id===e.id);return x?x.name:'';}).filter(Boolean);
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:var(--r);font-size:13px;margin-bottom:5px;">
        <div style="flex:1;font-weight:500;">${s.name}</div>
        <div style="font-size:11px;color:var(--muted);">${names.join(', ')}${s.exercises.length>3?'…':''}</div>
      </div>`;
    }).join('');
    return `<div class="card" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div><div style="font-weight:600;font-size:15px;">${p.name}</div>${p.description?`<div style="font-size:12px;color:var(--muted);margin-top:1px;">${p.description}</div>`:''}</div>
        <div style="display:flex;gap:5px;">
          <button class="ib edit" onclick="openProgEdit('${p.id}')">✏</button>
          <button class="ib del"  onclick="confirmDel('Supprimer «${p.name}» ?',()=>delProg('${p.id}'))">✕</button>
        </div>
      </div>
      ${rows||'<div style="font-size:12px;color:var(--muted);">Aucune séance.</div>'}
    </div>`;
  }).join('');
}

function openProgEdit(id){
  const p=id?programs.find(x=>x.id===id):null;
  document.getElementById('m-prog-ttl').textContent=p?'Modifier':'Créer un programme';
  document.getElementById('prog-id').value=id||'';
  document.getElementById('prog-name').value=p?p.name:'';
  document.getElementById('prog-desc').value=p?(p.description||''):'';
  _progSess=p?[...p.sessions]:[];
  renderProgEditList(); openM('m-prog');
}

function renderProgEditList(){
  const el=document.getElementById('prog-edit-sessions');
  if(!_progSess.length){el.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0;">Aucune séance.</div>';return;}
  el.innerHTML=_progSess.map((sid,i)=>{
    const s=sessions.find(x=>x.id===sid);
    return `<div class="lrow" style="margin-bottom:5px;">
      <div class="lrow-main"><div class="lrow-name" style="font-size:13px;">${s?s.name:sid}</div></div>
      <button class="ib del" onclick="_progSess.splice(${i},1);renderProgEditList()">✕</button>
    </div>`;
  }).join('');
}

async function saveProg(){
  const id=document.getElementById('prog-id').value;
  const name=document.getElementById('prog-name').value.trim();
  if(!name) return toast('Donne un nom.','warn');
  const body={name, description:document.getElementById('prog-desc').value.trim(), sessions:_progSess};
  showLoad();
  try {
    if(id){ await dbUpdate('programs',id,body); const i=programs.findIndex(p=>p.id===id); if(i>=0) programs[i]={...programs[i],...body}; }
    else { const [r]=await dbInsert('programs',body); programs.push(r); }
    closeM('m-prog'); renderProg(); toast(id?'Programme modifié.':'Programme créé.');
  } catch(e){ toast('Erreur : '+e.message,'warn'); } hideLoad();
}

async function delProg(id){
  showLoad(); try { await dbDelete('programs',id); programs=programs.filter(p=>p.id!==id); renderProg(); toast('Supprimé.'); }
  catch(e){ toast('Erreur : '+e.message,'warn'); } hideLoad();
}

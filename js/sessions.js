// ════ SESSIONS — renderSess, openSessEdit, saveSess, delSess, drag&drop ════
function renderSess(){
  const el=document.getElementById('sess-list');
  if(!sessions.length){el.innerHTML='<div class="empty"><div class="empty-t">Aucune séance</div><div class="empty-s">Crée un template.</div></div>';return;}
  el.innerHTML=sessions.map(s=>{
    const names=(s.exercises||[]).map(e=>{const x=exercises.find(ex=>ex.id===e.id);return x?x.name:e.id;}).join(', ');
    return `<div class="lrow">
      <div class="lrow-main"><div class="lrow-name">${s.name}</div><div class="lrow-sub">${names||'Aucun exercice'}${s.note?' · '+s.note:''}</div></div>
      <button class="ib edit" onclick="openSessEdit('${s.id}')">✏</button>
      <button class="ib del"  onclick="confirmDel('Supprimer «${s.name}» ?',()=>delSess('${s.id}'))">✕</button>
    </div>`;
  }).join('');
}

function openSessEdit(id){
  const s=id?sessions.find(x=>x.id===id):null;
  document.getElementById('m-sess-ttl').textContent=s?'Modifier':'Créer une séance';
  document.getElementById('sess-id').value=id||'';
  document.getElementById('sess-name').value=s?s.name:'';
  document.getElementById('sess-note').value=s?(s.note||''):'';
  _sessExos=s?(s.exercises||[]).map(e=>({...e})):[];
  renderSessEditList(); openM('m-sess');
}

function renderSessEditList(){
  const el=document.getElementById('sess-edit-exos');
  if(!_sessExos.length){el.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0;">Aucun exercice.</div>';return;}
  el.innerHTML=_sessExos.map((e,i)=>{
    const x=exercises.find(ex=>ex.id===e.id);
    return `<div class="lrow sess-edit-row" data-i="${i}" draggable="false" style="margin-bottom:5px;">
      <div class="drag-handle" style="cursor:grab;font-size:16px;color:var(--muted);display:flex;align-items:center;touch-action:none;" title="Réordonner">⠿</div>
      <div class="lrow-main"><div class="lrow-name" style="font-size:13px;">${x?x.name:e.id}</div><div class="lrow-sub">${x?x.muscle:''}</div></div>
      <label style="margin:0;font-size:11px;white-space:nowrap;">Séries cibles</label>
      <input type="number" value="${e.sets||3}" min="1" max="20" style="width:52px;padding:4px 6px;font-family:var(--m);font-size:12px;text-align:center;" oninput="_sessExos[${i}].sets=parseInt(this.value)||1">
      <button class="ib del" onclick="_sessExos.splice(${i},1);renderSessEditList()">✕</button>
    </div>`;
  }).join('');
  initSessEditDrag();
}

// ── Drag & drop liste édition séance ──
function initSessEditDrag(){
  const container=document.getElementById('sess-edit-exos');
  const rows=()=>[...container.querySelectorAll('.sess-edit-row')];

  rows().forEach(row=>{
    const handle=row.querySelector('.drag-handle');

    // Desktop
    handle.addEventListener('mousedown',()=>row.setAttribute('draggable','true'));
    row.addEventListener('dragstart',e=>{
      _sedDragSrc=row;
      e.dataTransfer.effectAllowed='move';
      setTimeout(()=>row.style.opacity='.4',0);
    });
    row.addEventListener('dragend',()=>{
      row.style.opacity='';
      rows().forEach(r=>r.style.boxShadow='');
      row.setAttribute('draggable','false');
      _sedDragSrc=null;
    });
    row.addEventListener('dragover',e=>{
      e.preventDefault();
      if(_sedDragSrc&&_sedDragSrc!==row){
        rows().forEach(r=>r.style.boxShadow='');
        row.style.boxShadow='0 -2px 0 var(--amber)';
      }
    });
    row.addEventListener('drop',e=>{
      e.preventDefault();
      if(!_sedDragSrc||_sedDragSrc===row) return;
      const from=parseInt(_sedDragSrc.dataset.i);
      const to=parseInt(row.dataset.i);
      const [moved]=_sessExos.splice(from,1);
      _sessExos.splice(to,0,moved);
      renderSessEditList();
    });

    // Touch (iPhone)
    handle.addEventListener('touchstart',e=>{
      e.preventDefault();
      _sedTouchSrc=row;
      const touch=e.touches[0];
      const rect=row.getBoundingClientRect();
      _sedOffX=touch.clientX-rect.left;
      _sedOffY=touch.clientY-rect.top;
      _sedTouchClone=row.cloneNode(true);
      _sedTouchClone.style.cssText=`position:fixed;width:${rect.width}px;opacity:.85;pointer-events:none;z-index:999;border-radius:var(--r);box-shadow:0 4px 16px rgba(0,0,0,.15);left:${rect.left}px;top:${rect.top}px;background:var(--surface);border:1px solid var(--amber);`;
      document.body.appendChild(_sedTouchClone);
      row.style.opacity='.4';
    },{passive:false});

    handle.addEventListener('touchmove',e=>{
      e.preventDefault();
      if(!_sedTouchClone) return;
      const touch=e.touches[0];
      _sedTouchClone.style.left=(touch.clientX-_sedOffX)+'px';
      _sedTouchClone.style.top=(touch.clientY-_sedOffY)+'px';
      rows().forEach(r=>r.style.boxShadow='');
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const target=el?.closest('.sess-edit-row');
      if(target&&target!==_sedTouchSrc) target.style.boxShadow='0 -2px 0 var(--amber)';
    },{passive:false});

    handle.addEventListener('touchend',e=>{
      if(_sedTouchClone){_sedTouchClone.remove();_sedTouchClone=null;}
      if(!_sedTouchSrc) return;
      _sedTouchSrc.style.opacity='';
      rows().forEach(r=>r.style.boxShadow='');
      const touch=e.changedTouches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const target=el?.closest('.sess-edit-row');
      if(target&&target!==_sedTouchSrc){
        const from=parseInt(_sedTouchSrc.dataset.i);
        const to=parseInt(target.dataset.i);
        const [moved]=_sessExos.splice(from,1);
        _sessExos.splice(to,0,moved);
        renderSessEditList();
      }
      _sedTouchSrc=null;
    });
  });
}

async function saveSess(){
  const id=document.getElementById('sess-id').value;
  const name=document.getElementById('sess-name').value.trim();
  if(!name) return toast('Donne un nom.','warn');
  const body={name, note:document.getElementById('sess-note').value.trim(), exercises:_sessExos};
  showLoad('Sauvegarde...');
  try {
    if(id){ await dbUpdate('sessions',id,body); const i=sessions.findIndex(s=>s.id===id); if(i>=0) sessions[i]={...sessions[i],...body}; }
    else { const [r]=await dbInsert('sessions',body); sessions.push(r); }
    closeM('m-sess'); renderSess(); toast(id?'Séance modifiée.':'Séance créée.');
  } catch(e){ toast('Erreur : '+e.message,'warn'); }
  hideLoad();
}

async function delSess(id){
  showLoad(); try { await dbDelete('sessions',id); sessions=sessions.filter(s=>s.id!==id); renderSess(); toast('Supprimé.'); }
  catch(e){ toast('Erreur : '+e.message,'warn'); } hideLoad();
}

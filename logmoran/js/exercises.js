// ════ EXERCISES — renderEx, openExEdit, saveEx, delEx ════
function renderEx(){
  const chips=['Tous',...muscles.map(m=>m.name)];
  document.getElementById('ex-chips').innerHTML=chips.map(g=>
    `<button class="chip ${exFilter===g?'on':''}" onclick="exFilter='${g}';renderEx()">${g}</button>`
  ).join('');
  const filtered = exFilter==='Tous'?exercises:exercises.filter(e=>e.muscle===exFilter);
  const el=document.getElementById('ex-list');
  if(!filtered.length){el.innerHTML='<div class="empty"><div class="empty-t">Aucun exercice</div><div class="empty-s">Ajoute ton premier exercice.</div></div>';return;}
  el.innerHTML=filtered.map(e=>`
    <div class="lrow">
      <div class="lrow-main">
        <div class="lrow-name">${e.name}</div>
        <div class="lrow-sub"><span class="pill pill-muscle">${e.muscle}</span>${e.note?`<span style="margin-left:8px;font-size:12px;color:var(--muted)">${e.note}</span>`:''}</div>
      </div>
      <button class="ib edit" onclick="openExEdit('${e.id}')">✏</button>
      <button class="ib del"  onclick="confirmDel('Supprimer «${e.name}» ?',()=>delEx('${e.id}'))">✕</button>
    </div>`).join('');
}

function openExEdit(id){
  const sel=document.getElementById('ex-muscle');
  sel.innerHTML=muscles.map(m=>`<option>${m.name}</option>`).join('');
  const ex=id?exercises.find(e=>e.id===id):null;
  document.getElementById('m-ex-ttl').textContent=ex?'Modifier':'Ajouter un exercice';
  document.getElementById('ex-id').value=id||'';
  document.getElementById('ex-name').value=ex?ex.name:'';
  sel.value=ex?ex.muscle:(muscles[0]?.name||'');
  document.getElementById('ex-note').value=ex?(ex.note||''):'';
  openM('m-ex');
}

async function saveEx(){
  const id=document.getElementById('ex-id').value;
  const name=document.getElementById('ex-name').value.trim();
  if(!name) return toast('Donne un nom.','warn');
  const body={name, muscle:document.getElementById('ex-muscle').value, note:document.getElementById('ex-note').value.trim()};
  showLoad('Sauvegarde...');
  try {
    if(id){ await dbUpdate('exercises',id,body); const i=exercises.findIndex(e=>e.id===id); if(i>=0) exercises[i]={...exercises[i],...body}; }
    else { const [r]=await dbInsert('exercises',body); exercises.push(r); }
    closeM('m-ex'); renderEx(); toast(id?'Exercice modifié.':'Exercice ajouté.');
  } catch(e){ toast('Erreur : '+e.message,'warn'); }
  hideLoad();
}

async function delEx(id){
  showLoad('Suppression...');
  try { await dbDelete('exercises',id); exercises=exercises.filter(e=>e.id!==id); renderEx(); toast('Supprimé.'); }
  catch(e){ toast('Erreur : '+e.message,'warn'); }
  hideLoad();
}

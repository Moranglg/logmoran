// ════ MUSCLES — renderMuscles, openMuscleEdit, saveMuscle, delMuscle ════
function renderMuscles(){
  const el=document.getElementById('muscle-list');
  if(!muscles.length){el.innerHTML='<div class="empty"><div class="empty-t">Aucun groupe</div></div>';return;}
  el.innerHTML=muscles.map(m=>{
    const count=exercises.filter(e=>e.muscle===m.name).length;
    return `<div class="lrow">
      <div class="lrow-main"><div class="lrow-name">${m.name}</div><div class="lrow-sub">${count} exercice${count>1?'s':''}</div></div>
      <button class="ib edit" onclick="openMuscleEdit('${m.id}','${m.name.replace(/'/g,"\\'")}')">✏</button>
      <button class="ib del"  onclick="confirmDel('Supprimer «${m.name}» ?',()=>delMuscle('${m.id}','${m.name.replace(/'/g,"\\'")}'))">✕</button>
    </div>`;
  }).join('');
}

function openMuscleEdit(id,name){
  document.getElementById('m-muscle-ttl').textContent=name?'Renommer':'Ajouter un groupe';
  document.getElementById('muscle-edit-id').value=id||'';
  document.getElementById('muscle-edit-name').value=name||'';
  openM('m-muscle');
}

async function saveMuscle(){
  const id=document.getElementById('muscle-edit-id').value;
  const name=document.getElementById('muscle-edit-name').value.trim();
  if(!name) return toast('Donne un nom.','warn');
  showLoad('Sauvegarde...');
  try {
    if(id){
      const oldName=muscles.find(m=>m.id===id)?.name;
      await dbUpdate('muscles',id,{name});
      const i=muscles.findIndex(m=>m.id===id); if(i>=0) muscles[i].name=name;
      // Mettre à jour les exercices côté DB
      if(oldName && oldName!==name){
        const toUpdate=exercises.filter(e=>e.muscle===oldName);
        await Promise.all(toUpdate.map(e=>dbUpdate('exercises',e.id,{muscle:name})));
        exercises=exercises.map(e=>e.muscle===oldName?{...e,muscle:name}:e);
      }
      toast('Groupe renommé.');
    } else {
      if(muscles.find(m=>m.name===name)) return toast('Ce groupe existe déjà.','warn');
      const [r]=await dbInsert('muscles',{name, position:muscles.length});
      muscles.push(r);
      toast('Groupe ajouté.');
    }
    closeM('m-muscle'); renderMuscles(); renderEx();
  } catch(e){ toast('Erreur : '+e.message,'warn'); }
  hideLoad();
}

async function delMuscle(id, name){
  const used=exercises.filter(e=>e.muscle===name).length;
  if(used>0) return toast(`${used} exercice(s) utilisent ce groupe.`,'warn');
  showLoad('Suppression...');
  try { await dbDelete('muscles',id); muscles=muscles.filter(m=>m.id!==id); renderMuscles(); toast('Groupe supprimé.'); }
  catch(e){ toast('Erreur : '+e.message,'warn'); }
  hideLoad();
}

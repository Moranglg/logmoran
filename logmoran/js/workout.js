// ════ SÉANCE DU JOUR — autosave, drag&drop ════
// currentWo = {date, entries:[{exId,name,muscle,sets:[{kg,reps}]}], logId?}
// Autosave : debounce 1.5s après chaque modif

function todayDateStr(){ return new Date().toISOString().split('T')[0]; }

function setSaveIndicator(msg,color='var(--muted)'){
  const el=document.getElementById('today-save-indicator');
  if(el){el.textContent=msg;el.style.color=color;}
}

function scheduleAutoSave(){
  clearTimeout(_autoSaveTimer);
  setSaveIndicator('...');
  _autoSaveTimer=setTimeout(()=>autoSave(),1500);
}

async function autoSave(){
  if(!currentWo||_autoSaving) return;
  if(!currentWo.entries.length) return; // rien à sauvegarder
  _autoSaving=true;
  setSaveIndicator('Sauvegarde...');
  try {
    const body={
      session_name: currentWo.name||'Séance',
      session_id: currentWo.sessId||null,
      date: currentWo.date,
      entries: currentWo.entries,
      elapsed_seconds: 0
    };
    if(currentWo.logId){
      // Toujours UPDATE — jamais de doublon
      await dbUpdate('logs', currentWo.logId, body);
      const i=logs.findIndex(l=>l.id===currentWo.logId);
      if(i>=0) logs[i]={...logs[i],...body};
    } else {
      // Premier enregistrement
      const [r]=await dbInsert('logs', body);
      currentWo.logId=r.id;
      logs.push(r);
    }
    setSaveIndicator('● Sauvegardé', 'var(--green)');
    setSyncStatus('● sync');
  } catch(e){
    setSaveIndicator('⚠ Erreur de sauvegarde','var(--red)');
  }
  _autoSaving=false;
}

function renderToday(){
  // Date
  const today=todayDateStr();
  document.getElementById('today-date').textContent=
    new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});

  // Populate session selector
  const sel=document.getElementById('today-sess-sel');
  sel.innerHTML='<option value="">— Partir d\'une séance existante —</option>'+
    sessions.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');

  // Si pas de séance en cours, créer une vide pour aujourd'hui
  if(!currentWo){
    currentWo={name:'Séance', date:today, sessId:null, logId:null, entries:[]};
  }

  renderActiveWo();
}

function loadSessionIntoToday(){
  const sessId=document.getElementById('today-sess-sel').value;
  if(!sessId) return;
  const sess=sessions.find(s=>s.id===sessId);
  if(!sess) return;
  if(currentWo&&currentWo.entries.length>0){
    if(!confirm('Remplacer les exercices actuels par ceux de cette séance ?')) return;
  }
  const entries=(sess.exercises||[]).map(e=>{
    const x=exercises.find(ex=>ex.id===e.id);
    return {exId:e.id, name:x?x.name:e.id, muscle:x?x.muscle:'', sets:Array.from({length:e.sets||3},()=>({kg:'',reps:''}))};
  });
  currentWo.name=sess.name;
  currentWo.sessId=sessId;
  currentWo.entries=entries;
  renderActiveWo();
  scheduleAutoSave();
}

function clearToday(){
  if(!confirm('Vider tous les exercices de la séance ?')) return;
  currentWo.entries=[];
  currentWo.name='Séance du jour';
  currentWo.sessId=null;
  renderActiveWo();
  scheduleAutoSave();
}

function renderActiveWo(){
  const el=document.getElementById('wo-ex-list');
  if(!el) return;
  if(!currentWo||!currentWo.entries.length){
    el.innerHTML='<div style="padding:24px 0;text-align:center;color:var(--muted);font-size:13px;">Aucun exercice — clique sur <strong>+ Exercice</strong> pour commencer.</div>';
    return;
  }
  el.innerHTML=currentWo.entries.map((en,ei)=>buildExBlock(en,ei)).join('');
  initDrag();
}

// ⚠ Conservé à l'identique de l'original : finishWo (et cancelWo) sont déclarés
// DEUX fois. En JS, la 2e déclaration (plus bas) écrase celle-ci à l'exécution.
async function finishWo(){
  if(!currentWo) return;
  clearTimeout(_autoSaveTimer);
  showLoad('Enregistrement...');
  await autoSave();
  hideLoad();

  const logId=currentWo.logId;
  const logObj=logs.find(l=>l.id===logId);

  currentWo={name:'Séance', date:todayDateStr(), sessId:null, logId:null, entries:[]};
  renderActiveWo();
  setSaveIndicator('');

  goPage('week');
  if(logObj) showRecap(logObj);
  setSyncStatus('● sync');
}

function cancelWo(){ /* plus utilisé */ }

// ── DRAG & DROP (desktop + touch) ──
function initDrag(){
  const container=document.getElementById('wo-ex-list');
  const blocks=()=>[...container.querySelectorAll('.ex-block')];

  // ── Desktop drag ──
  blocks().forEach(block=>{
    const handle=block.querySelector('.drag-handle');

    handle.addEventListener('mousedown',()=>{ block.setAttribute('draggable','true'); });
    block.addEventListener('dragstart',e=>{
      _dragSrc=block;
      e.dataTransfer.effectAllowed='move';
      setTimeout(()=>block.classList.add('dragging'),0);
    });
    block.addEventListener('dragend',()=>{
      block.classList.remove('dragging');
      blocks().forEach(b=>b.classList.remove('drag-over'));
      block.setAttribute('draggable','false');
      _dragSrc=null;
    });
    block.addEventListener('dragover',e=>{
      e.preventDefault();
      if(_dragSrc && _dragSrc!==block){
        blocks().forEach(b=>b.classList.remove('drag-over'));
        block.classList.add('drag-over');
      }
    });
    block.addEventListener('drop',e=>{
      e.preventDefault();
      if(!_dragSrc||_dragSrc===block) return;
      const srcIdx=parseInt(_dragSrc.dataset.ei);
      const dstIdx=parseInt(block.dataset.ei);
      reorderEntries(srcIdx,dstIdx);
    });
  });

  // ── Touch drag (iPhone) ──
  blocks().forEach(block=>{
    const handle=block.querySelector('.drag-handle');
    handle.addEventListener('touchstart',e=>{
      e.preventDefault();
      _touchSrc=block;
      const touch=e.touches[0];
      const rect=block.getBoundingClientRect();
      _touchOffX=touch.clientX-rect.left;
      _touchOffY=touch.clientY-rect.top;
      // Clone visuel
      _touchClone=block.cloneNode(true);
      _touchClone.style.cssText=`position:fixed;width:${rect.width}px;opacity:.85;pointer-events:none;z-index:999;border-radius:var(--r);box-shadow:0 8px 24px rgba(0,0,0,.18);left:${rect.left}px;top:${rect.top}px;background:var(--surface);border:1px solid var(--amber);`;
      document.body.appendChild(_touchClone);
      block.classList.add('dragging');
    },{passive:false});

    handle.addEventListener('touchmove',e=>{
      e.preventDefault();
      if(!_touchClone) return;
      const touch=e.touches[0];
      _touchClone.style.left=(touch.clientX-_touchOffX)+'px';
      _touchClone.style.top=(touch.clientY-_touchOffY)+'px';
      // Highlight target
      blocks().forEach(b=>b.classList.remove('drag-over'));
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const target=el?.closest('.ex-block');
      if(target && target!==_touchSrc) target.classList.add('drag-over');
    },{passive:false});

    handle.addEventListener('touchend',e=>{
      if(_touchClone){ _touchClone.remove(); _touchClone=null; }
      if(!_touchSrc) return;
      _touchSrc.classList.remove('dragging');
      blocks().forEach(b=>b.classList.remove('drag-over'));
      const touch=e.changedTouches[0];
      const el=document.elementFromPoint(touch.clientX,touch.clientY);
      const target=el?.closest('.ex-block');
      if(target && target!==_touchSrc){
        const srcIdx=parseInt(_touchSrc.dataset.ei);
        const dstIdx=parseInt(target.dataset.ei);
        reorderEntries(srcIdx,dstIdx);
      }
      _touchSrc=null;
    });
  });
}

function reorderEntries(from,to){
  if(from===to||!currentWo) return;
  const entries=currentWo.entries;
  const [moved]=entries.splice(from,1);
  entries.splice(to,0,moved);
  renderActiveWo();
  scheduleAutoSave();
}

function buildExBlock(en,ei){
  const prevSets=getLastSets(en.exId);
  const rows=en.sets.map((s,si)=>{
    const prev=prevSets[si];
    const prevTxt=prev&&(prev.kg||prev.reps)?`${prev.kg||0}kg × ${prev.reps||0}`:'—';
    return `<tr><td class="stbl-n">${si+1}</td>
      <td><input class="stbl-inp" type="number" placeholder="kg" min="0" step="0.5" value="${s.kg||''}" oninput="wUpd(${ei},${si},'kg',this.value)"></td>
      <td><input class="stbl-inp" type="number" placeholder="reps" min="0" step="1" value="${s.reps||''}" style="width:60px;" oninput="wUpd(${ei},${si},'reps',this.value)"></td>
      <td class="stbl-prev">${prevTxt}</td>
      <td><button class="ib del btn-xs" onclick="wDelSet(${ei},${si})" style="width:22px;height:22px;font-size:11px;">✕</button></td>
    </tr>`;
  }).join('');
  return `<div class="ex-block" id="eb${ei}" draggable="true" data-ei="${ei}">
    <div class="ex-block-hdr">
      <div class="drag-handle" title="Glisser pour réordonner">⠿</div>
      <span class="ex-block-num" onclick="toggleEB(${ei})" style="cursor:pointer">${ei+1}</span>
      <div class="ex-block-info" onclick="toggleEB(${ei})" style="cursor:pointer"><div class="ex-block-name">${en.name}</div><div class="ex-block-muscle">${en.muscle}</div></div>
      <button class="ib edit btn-xs" onclick="openPickerForWo(${ei})">⇄</button>
      <button class="ib del btn-xs"  onclick="wDelEx(${ei})">✕</button>
    </div>
    <div class="ex-block-body" id="ebb${ei}">
      <table class="stbl">
        <thead><tr><th>#</th><th>Poids (kg)</th><th>Reps</th><th>Dernière fois</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="padding:8px 0 0;"><button class="btn btn-gh btn-xs" onclick="wAddSet(${ei})">+ Série</button></div>
    </div>
  </div>`;
}

function toggleEB(ei){const b=document.getElementById('ebb'+ei);b.style.display=b.style.display==='none'?'':'none';}
function wUpd(ei,si,f,v){if(!currentWo)return;currentWo.entries[ei].sets[si][f]=v;scheduleAutoSave();}
function wAddSet(ei){if(!currentWo)return;const sets=currentWo.entries[ei].sets;const last=sets[sets.length-1]||{};sets.push({kg:last.kg||'',reps:last.reps||''});renderActiveWo();scheduleAutoSave();}
function wDelSet(ei,si){if(!currentWo||currentWo.entries[ei].sets.length<=1)return;currentWo.entries[ei].sets.splice(si,1);renderActiveWo();scheduleAutoSave();}
function wDelEx(ei){if(!currentWo)return;if(!confirm('Supprimer ?'))return;currentWo.entries.splice(ei,1);renderActiveWo();scheduleAutoSave();}

function getLastSets(exId){
  const sorted=[...logs].sort((a,b)=>new Date(b.date)-new Date(a.date));
  for(const log of sorted){const en=(log.entries||[]).find(e=>e.exId===exId);if(en)return en.sets;}
  return [];
}

// ⚠ 2e déclaration de finishWo/cancelWo (cf. note plus haut) : ce sont CES
// versions qui s'exécutent réellement, car elles écrasent les précédentes.
async function finishWo(){
  if(!currentWo)return;
  const elapsed=woStart?Math.floor((Date.now()-woStart)/1000):0;
  let vol=0,sets=0;
  currentWo.entries.forEach(en=>en.sets.forEach(s=>{const kg=parseFloat(s.kg)||0,r=parseInt(s.reps)||0;if(kg&&r){vol+=kg*r;sets++;}}));
  const body={session_name:currentWo.name, session_id:currentWo.sessId||null, date:currentWo.date, entries:currentWo.entries, elapsed_seconds:elapsed};
  showLoad('Enregistrement...');
  try {
    const [r]=await dbInsert('logs',body);
    logs.push(r);
    clearInterval(woTimerInt);woTimerInt=null;
    currentWo=null;woStart=null;
    hideLoad();
    goPage('week');
    showRecap(r);
    setSyncStatus('● sync');
  } catch(e){ toast('Erreur : '+e.message,'warn'); hideLoad(); }
}

function cancelWo(){
  if(!confirm('Annuler la séance ? Les données ne seront pas sauvegardées.'))return;
  clearInterval(woTimerInt);woTimerInt=null;woStart=null;currentWo=null;
  goPage('week');
}

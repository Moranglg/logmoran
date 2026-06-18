// ════ SEMAINE — renderWeek, saveGoal, showRecap, editLog ════
function getWeek(offset=currentWeekOffset){
  const n=new Date();
  const mon=new Date(n);mon.setDate(n.getDate()-(((n.getDay()+6)%7))+offset*7);mon.setHours(0,0,0,0);
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);sun.setHours(23,59,59,999);
  return {mon,sun};
}

// Navigation entre semaines
function weekPrev(){ currentWeekOffset--; renderWeek(); }
function weekNext(){ if(currentWeekOffset<0){ currentWeekOffset++; renderWeek(); } }

function weekRangeLabel(mon,sun){
  const month=d=>d.toLocaleDateString('fr-FR',{month:'long'});
  return mon.getMonth()===sun.getMonth()
    ? `${mon.getDate()} - ${sun.getDate()} ${month(sun)}`
    : `${mon.getDate()} ${month(mon)} - ${sun.getDate()} ${month(sun)}`;
}

function renderWeek(){
  const {mon,sun}=getWeek();
  document.getElementById('week-range').textContent=weekRangeLabel(mon,sun);
  // Flèche « suivant » désactivée sur la semaine courante
  const nextBtn=document.getElementById('week-next');
  if(nextBtn) nextBtn.disabled=(currentWeekOffset>=0);
  const wLogs=logs.filter(l=>{const d=new Date(l.date);return d>=mon&&d<=sun;});
  let vol=0,sets=0;const byMuscle={},byMuscleVol={};
  wLogs.forEach(log=>{
    (log.entries||[]).forEach(en=>{
      const done=en.sets.filter(s=>s.kg||s.reps);
      done.forEach(s=>{const kg=parseFloat(s.kg)||0,r=parseInt(s.reps)||0;if(kg&&r){vol+=kg*r;sets++;byMuscleVol[en.muscle]=(byMuscleVol[en.muscle]||0)+kg*r;}});
      byMuscle[en.muscle]=(byMuscle[en.muscle]||0)+done.length;
    });
  });
  document.getElementById('w-vol').textContent=Math.round(vol);
  document.getElementById('w-sets').textContent=sets;
  const ll=document.getElementById('week-log-list');
  if(!wLogs.length){ll.innerHTML='<div style="font-size:13px;color:var(--muted);">Aucune séance cette semaine.</div>';}
  else{ll.innerHTML=[...wLogs].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(l=>{
    let lv=0,ls=0;
    (l.entries||[]).forEach(en=>en.sets.forEach(s=>{const kg=parseFloat(s.kg)||0,r=parseInt(s.reps)||0;if(kg&&r){lv+=kg*r;ls++;}}));
    return `<div class="lrow" style="cursor:pointer;" onclick="showRecap(logs.find(x=>x.id==='${l.id}'))">
      <div class="lrow-main"><div class="lrow-name">${l.session_name}</div>
      <div class="lrow-sub">${new Date(l.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div></div>
      <span style="font-family:var(--m);font-size:12px;color:var(--muted)">${Math.round(lv)} kg · ${ls} séries</span>
      <button class="ib del" onclick="event.stopPropagation();confirmDel('Supprimer ce log ?',()=>delLog('${l.id}'))">✕</button>
    </div>`;
  }).join('');}
  const maxS=Math.max(...muscles.map(m=>byMuscle[m.name]||0),1);
  document.getElementById('week-muscle-body').innerHTML=muscles.map(m=>{
    const val=byMuscle[m.name]||0;
    const goal=goals[m.name]??10;
    const goalMax=Math.max(goal,val,maxS);
    const pct=val/goalMax*100, gPct=goal/goalMax*100, ok=val>=goal&&val>0;
    return `<tr>
      <td style="font-weight:500;">${m.name}</td>
      <td><div style="position:relative;height:7px;background:var(--s2);border-radius:2px;">
        <div style="position:absolute;inset:0;border-radius:99px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${ok?'var(--green)':'var(--cyan)'};transition:width .3s;"></div></div>
        <div style="position:absolute;top:-3px;bottom:-3px;left:${Math.min(gPct,98)}%;width:2px;background:var(--red);border-radius:1px;"></div>
      </div></td>
      <td style="font-family:var(--m);font-size:12px;${ok?'color:var(--green);font-weight:600;':''}">${val}</td>
      <td style="font-family:var(--m);font-size:12px;">${Math.round(byMuscleVol[m.name]||0)}</td>
      <td><input class="g-inp" type="number" value="${goal}" min="0" step="1" onchange="saveGoal('${m.name}',this.value)"></td>
    </tr>`;
  }).join('');
}

async function saveGoal(muscle, val){
  const target=parseInt(val)||0;
  goals[muscle]=target;
  try {
    // Requête directe sans order=created_at (colonne inexistante sur goals)
    const resp = await fetch(`${SB_URL}/rest/v1/goals?select=id&muscle=eq.${encodeURIComponent(muscle)}`,
      {headers:{...H,'Accept':'application/json'}});
    const rows = await resp.json();
    if(Array.isArray(rows)&&rows.length) await dbUpdate('goals',rows[0].id,{target});
    else await dbInsert('goals',{muscle,target});
    renderWeek();
  } catch(e){ toast('Erreur objectif : '+e.message,'warn'); }
}

async function delLog(id){
  showLoad();
  try { await dbDelete('logs',id); logs=logs.filter(l=>l.id!==id); renderWeek(); toast('Supprimé.'); }
  catch(e){ toast('Erreur : '+e.message,'warn'); } hideLoad();
}

// ════ RÉCAP ════
function showRecap(log){
  _recapLogId=log.id;
  const d=new Date(log.date);
  document.getElementById('recap-ttl').textContent=(log.session_name||log.name)+' — '+d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
  let vol=0,sets=0;const byMuscle={};
  (log.entries||[]).forEach(en=>{
    const done=en.sets.filter(s=>s.kg||s.reps);
    done.forEach(s=>{const kg=parseFloat(s.kg)||0,r=parseInt(s.reps)||0;if(kg&&r){vol+=kg*r;sets++;}});
    byMuscle[en.muscle]=(byMuscle[en.muscle]||0)+done.length;
  });
  document.getElementById('recap-kpi').innerHTML=`
    <div class="kpi"><div class="kpi-v">${Math.round(vol)}</div><div class="kpi-l">Volume kg</div></div>
    <div class="kpi"><div class="kpi-v">${sets}</div><div class="kpi-l">Séries</div></div>
    <div class="kpi"><div class="kpi-v">${(log.entries||[]).length}</div><div class="kpi-l">Exercices</div></div>`;
  document.getElementById('recap-exos').innerHTML=(log.entries||[]).map(en=>{
    const setLines=en.sets.filter(s=>s.kg||s.reps).map((s,i)=>`<span style="font-family:var(--m);font-size:11px;background:var(--bg);padding:2px 6px;border-radius:3px;margin-right:4px;">${i+1}. ${s.kg||0}kg × ${s.reps||0}</span>`).join('');
    return `<div style="padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
        <div style="font-weight:500;font-size:13px;">${en.name}</div>
        <span class="pill pill-muscle" style="font-size:10px;">${en.muscle}</span>
      </div>
      <div>${setLines||'<span style="font-size:12px;color:var(--muted);">—</span>'}</div>
    </div>`;
  }).join('');
  const maxS=Math.max(...Object.values(byMuscle),1);
  document.getElementById('recap-muscles').innerHTML=Object.entries(byMuscle).map(([m,s])=>`
    <div class="muscle-bar-row">
      <div class="muscle-bar-lbl">${m}</div>
      <div class="muscle-bar-track"><div class="muscle-bar-fill" style="width:${s/maxS*100}%"></div></div>
      <div class="muscle-bar-val">${s} série${s>1?'s':''}</div>
    </div>`).join('');
  openM('m-recap');
}

// ════ ÉDITION LOG ════
function openLogEdit(){
  const log = logs.find(l=>l.id===_recapLogId);
  if(!log) return;
  _editLogId = log.id;
  _editLogEntries = (log.entries||[]).map(e=>({...e, sets:e.sets.map(s=>({...s}))}));
  document.getElementById('le-name').value = log.session_name||'';
  document.getElementById('le-date').value = log.date||todayDateStr();
  renderLogEditExos();
  closeM('m-recap');
  openM('m-log-edit');
}

function renderLogEditExos(){
  const el = document.getElementById('le-ex-list');
  if(!_editLogEntries.length){
    el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:8px 0;">Aucun exercice.</div>';return;
  }
  el.innerHTML = _editLogEntries.map((en,ei)=>{
    const setsHtml = en.sets.map((s,si)=>`
      <div style="display:grid;grid-template-columns:30px 1fr 1fr auto;gap:6px;align-items:center;margin-bottom:4px;">
        <span style="font-family:var(--M);font-size:11px;color:var(--text3);text-align:center;">${si+1}</span>
        <input type="number" placeholder="kg" value="${s.kg||''}" min="0" step="0.5"
          style="font-family:var(--M);font-size:13px;text-align:center;padding:5px 4px;"
          oninput="_editLogEntries[${ei}].sets[${si}].kg=this.value">
        <input type="number" placeholder="reps" value="${s.reps||''}" min="0" step="1"
          style="font-family:var(--M);font-size:13px;text-align:center;padding:5px 4px;"
          oninput="_editLogEntries[${ei}].sets[${si}].reps=this.value">
        <button class="ib del" onclick="if(_editLogEntries[${ei}].sets.length>1){_editLogEntries[${ei}].sets.splice(${si},1);renderLogEditExos()}" style="width:24px;height:24px;font-size:11px;">✕</button>
      </div>`).join('');
    return `<div style="background:var(--s2);border:1px solid var(--b0);border-radius:var(--r);padding:12px 14px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div>
          <div style="font-weight:700;font-size:13px;letter-spacing:.05em;text-transform:uppercase;">${en.name}</div>
          <div style="font-family:var(--M);font-size:9px;color:var(--text2);margin-top:1px;">${en.muscle}</div>
        </div>
        <div style="display:flex;gap:5px;">
          <button class="btn btn-gh btn-xs" onclick="_editLogEntries[${ei}].sets.push({kg:'',reps:''});renderLogEditExos()">+ Série</button>
          <button class="ib del" onclick="_editLogEntries.splice(${ei},1);renderLogEditExos()" style="font-size:11px;">✕</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:30px 1fr 1fr auto;gap:6px;margin-bottom:4px;">
        <span style="font-family:var(--M);font-size:8px;color:var(--text3);text-align:center;">#</span>
        <span style="font-family:var(--M);font-size:8px;color:var(--text3);text-align:center;letter-spacing:.1em;">KG</span>
        <span style="font-family:var(--M);font-size:8px;color:var(--text3);text-align:center;letter-spacing:.1em;">REPS</span>
        <span></span>
      </div>
      ${setsHtml}
    </div>`;
  }).join('');
}

function openPickerForLogEdit(){
  _pickerTarget='log-edit';
  document.getElementById('pk-ttl').textContent='Ajouter un exercice';
  document.getElementById('pk-search').value='';
  pkFilter='Tous'; renderPkChips(); renderPk();
  openM('m-picker');
}

async function saveLogEdit(){
  if(!_editLogId) return;
  const name = document.getElementById('le-name').value.trim()||'Séance';
  const date = document.getElementById('le-date').value||todayDateStr();
  const body = {session_name:name, date, entries:_editLogEntries};
  showLoad('Sauvegarde...');
  try {
    await dbUpdate('logs',_editLogId,body);
    const i=logs.findIndex(l=>l.id===_editLogId);
    if(i>=0) logs[i]={...logs[i],...body};
    closeM('m-log-edit');
    renderWeek();
    toast('Séance modifiée.','ok');
  } catch(e){ toast('Erreur : '+e.message,'warn'); }
  hideLoad();
}

// ════ PROGRESSION — grille de cartes + détail exercice ════

function renderProgress(){
  const el=document.getElementById('prog-grid');
  const prs=computePRs();
  // Exercices ayant au moins un log
  const loggedIds=new Set(logs.flatMap(l=>(l.entries||[]).map(e=>e.exId)));
  const cards=exercises.filter(e=>loggedIds.has(e.id));
  // Tri par groupe musculaire puis par nom
  cards.sort((a,b)=>(a.muscle||'').localeCompare(b.muscle||'')||a.name.localeCompare(b.name));
  if(!cards.length){
    el.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-t">Aucune progression</div><div class="empty-s">Les exercices apparaissent après tes premières séances.</div></div>';
    return;
  }
  el.innerHTML=cards.map(ex=>{
    const pr=prs[ex.id];
    const prHtml=pr
      ? `<div class="prog-card__pr">${pr.weight} kg × ${pr.reps} reps</div>`
      : `<div class="prog-card__pr prog-card__pr--none">Aucun record</div>`;
    return `<div class="prog-card" onclick="openExDetail('${ex.id}')">
      <div class="prog-card__name">${ex.name}</div>
      ${prHtml}
    </div>`;
  }).join('');
}

// ── Détail d'un exercice (modale) ──
function openExDetail(exId){
  const ex=exercises.find(e=>e.id===exId); if(!ex) return;
  document.getElementById('exd-ttl').textContent=ex.name;
  document.getElementById('exd-muscle').textContent=ex.muscle||'';
  const pr=computePRs()[exId];
  document.getElementById('exd-pr').innerHTML=pr
    ? `<span class="exd-pr__val">${pr.weight} kg</span><span class="exd-pr__sub">× ${pr.reps} reps</span>`
    : `<span class="exd-pr__none">Aucun record</span>`;
  openM('m-ex-detail');
  // Tracé après ouverture de la modale (largeur du canvas dispo)
  drawExDetailCharts(exId);
  renderExHist(exId);
}

function drawExDetailCharts(exId){
  const cw=document.getElementById('exd-c-w'), cwE=document.getElementById('exd-c-w-empty');
  const ptsW=getDataPts(exId,sets=>Math.max(...sets.map(s=>parseFloat(s.kg)||0)));
  if(ptsW.length){ cw.style.display=''; cwE.style.display='none'; drawChart(cw,ptsW.map(p=>p.lbl),ptsW.map(p=>p.v)); }
  else { cw.style.display='none'; cwE.style.display=''; }

  const c1=document.getElementById('exd-c-1rm'), c1E=document.getElementById('exd-c-1rm-empty');
  const pts1=getDataPts(exId,sets=>{
    const best=Math.max(...sets.filter(s=>s.kg&&s.reps).map(s=>(parseFloat(s.kg)||0)*(1+(parseInt(s.reps)||0)/30)),0);
    return Math.round(best*10)/10;
  });
  if(pts1.length){ c1.style.display=''; c1E.style.display='none'; drawChart(c1,pts1.map(p=>p.lbl),pts1.map(p=>p.v)); }
  else { c1.style.display='none'; c1E.style.display=''; }
}

function renderExHist(exId){
  const el=document.getElementById('exd-hist');
  const rows=[...logs].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(log=>{
    const en=(log.entries||[]).find(e=>e.exId===exId); if(!en) return null;
    const sets=en.sets.filter(s=>s.kg||s.reps);
    const setTxt=sets.map(s=>`<span class="exd-set">${s.kg||0} kg × ${s.reps||0}</span>`).join('');
    return `<div class="exd-hist-row">
      <div class="exd-hist-date">${new Date(log.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
      <div class="exd-hist-sets">${setTxt||'<span style="color:var(--muted)">—</span>'}</div>
    </div>`;
  }).filter(Boolean).join('');
  el.innerHTML=rows||'<div style="font-size:12px;color:var(--muted);padding:8px 0;">Aucune séance.</div>';
}

// ── Helpers conservés ──
function computePRs(){
  const prs={};
  logs.forEach(log=>{
    (log.entries||[]).forEach(en=>{
      en.sets.forEach(s=>{
        const kg=parseFloat(s.kg)||0,r=parseInt(s.reps)||0;
        if(kg>0&&r>0){
          const v=kg*(1+r/30);
          if(!prs[en.exId]||v>prs[en.exId].val) prs[en.exId]={weight:kg,reps:r,val:v,date:log.date,name:en.name};
        }
      });
    });
  });
  return prs;
}

function getDataPts(exId,reducer){
  return [...logs].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(log=>{
    const en=(log.entries||[]).find(e=>e.exId===exId);if(!en)return null;
    const v=reducer(en.sets);if(!v)return null;
    return {lbl:new Date(log.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}),v};
  }).filter(Boolean);
}

// ════ UI — toast, modal, loading, nav, chart, picker ════

// ── SYNC STATUS ──
function setSyncStatus(msg, ok=true){
  const dot=document.getElementById('sync-dot');
  const lbl=document.getElementById('sync-label');
  if(dot){dot.style.background=ok?'var(--green)':'var(--red)';dot.style.boxShadow=ok?'0 0 6px rgba(0,255,159,.6)':'0 0 6px rgba(255,48,96,.6)';}
  if(lbl) lbl.textContent=msg;
}

// ── LOADING ──
function showLoad(msg='Chargement...'){document.getElementById('loading').classList.add('on');document.getElementById('loading-msg').textContent=msg;}
function hideLoad(){document.getElementById('loading').classList.remove('on');}

// ── NAVIGATION ──
function goPage(name){
  // Fermer le drawer settings si ouvert
  const dr=document.getElementById('settings-drawer');
  if(dr) dr.style.display='none';
  const sb=document.getElementById('mni-settings');
  if(sb) sb.style.color='';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.nav-item,.mni[data-page]').forEach(n=>n.classList.remove('on'));
  document.getElementById('page-'+name).classList.add('on');
  document.querySelectorAll('[data-page="'+name+'"]').forEach(n=>n.classList.add('on'));
  if(name==='today')     renderToday();
  if(name==='exercises') renderEx();
  if(name==='muscles')   renderMuscles();
  if(name==='sessions')  renderSess();
  if(name==='programs')  renderProg();
  if(name==='week')      renderWeek();
  if(name==='progress')  renderProgress();
}
document.querySelectorAll('.nav-item,.mni[data-page]').forEach(n=>n.addEventListener('click',()=>goPage(n.dataset.page)));

function toggleSettings(){
  const d = document.getElementById('settings-drawer');
  const btn = document.getElementById('mni-settings');
  if(!d) return;
  const open = d.style.display !== 'none';
  d.style.display = open ? 'none' : 'block';
  if(btn) btn.style.color = open ? '' : 'var(--cyan)';
  // Fermer si on clique ailleurs
  if(!open){
    setTimeout(()=>{
      document.addEventListener('click', function close(e){
        if(!d.contains(e.target) && e.target.id !== 'mni-settings' && !document.getElementById('mni-settings')?.contains(e.target)){
          d.style.display='none';
          if(btn) btn.style.color='';
          document.removeEventListener('click', close);
        }
      });
    }, 50);
  }
}

// ── MODALS ──
function openM(id){document.getElementById(id).classList.add('on');}
function closeM(id){document.getElementById(id).classList.remove('on');}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('on');}));

function confirmDel(msg,cb){
  document.getElementById('m-del-ttl').textContent=msg;
  document.getElementById('m-del-txt').textContent='Cette action est irréversible.';
  document.getElementById('m-del-ok').onclick=()=>{cb();closeM('m-del');};
  openM('m-del');
}

// ── TOAST ──
function toast(msg,type=''){
  const c=document.getElementById('tc');const t=document.createElement('div');
  t.className='toast'+(type?' '+type:'');t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),3000);
}

function pad(n){return String(n).padStart(2,'0');}

// ════ PICKER ════
function openPickerFor(target){
  _pickerTarget=target; _replaceWoIdx=null;
  if(target==='prog-edit'){
    const el=document.getElementById('sess-pick-list');
    el.innerHTML=sessions.map(s=>`<div class="pk-item" onclick="addSessToP('${s.id}')"><div><div class="pk-name">${s.name}</div><div class="pk-sub">${(s.exercises||[]).length} ex.</div></div></div>`).join('')
      ||'<div style="color:var(--muted);font-size:13px;padding:12px;">Crée d\'abord une séance.</div>';
    openM('m-sess-pick'); return;
  }
  document.getElementById('pk-ttl').textContent='Ajouter un exercice';
  document.getElementById('pk-search').value='';
  pkFilter='Tous'; renderPkChips(); renderPk(); openM('m-picker');
}

function openPickerForWo(replIdx){
  _pickerTarget='wo';
  _replaceWoIdx=(replIdx!==undefined&&replIdx!==null)?replIdx:null;
  document.getElementById('pk-ttl').textContent=_replaceWoIdx!==null?'Remplacer':'Ajouter un exercice';
  document.getElementById('pk-search').value='';
  pkFilter='Tous'; renderPkChips(); renderPk(); openM('m-picker');
}

function renderPkChips(){
  const groups=['Tous',...muscles.map(m=>m.name)];
  document.getElementById('pk-chips').innerHTML=groups.map(g=>
    `<button class="chip ${pkFilter===g?'on':''}" onclick="pkFilter='${g}';renderPkChips();renderPk()">${g}</button>`
  ).join('');
}

function renderPk(){
  const q=document.getElementById('pk-search').value.toLowerCase();
  const list=exercises.filter(e=>(pkFilter==='Tous'||e.muscle===pkFilter)&&(!q||e.name.toLowerCase().includes(q)));
  document.getElementById('pk-list').innerHTML=list.map(e=>`
    <div class="pk-item" onclick="pickEx('${e.id}')">
      <div><div class="pk-name">${e.name}</div><div class="pk-sub">${e.muscle}</div></div>
    </div>`).join('')||'<div style="color:var(--muted);font-size:13px;padding:10px;">Aucun résultat.</div>';
}

function pickEx(id){
  const ex=exercises.find(e=>e.id===id); if(!ex) return;
  if(_pickerTarget==='sess-edit'){
    if(!_sessExos.find(e=>e.id===id)){_sessExos.push({id,sets:3}); renderSessEditList();}
    closeM('m-picker'); return;
  }
  if(_pickerTarget==='wo'){
    if(!currentWo) return;
    const ne={exId:id, name:ex.name, muscle:ex.muscle, sets:[{kg:'',reps:''}]};
    if(_replaceWoIdx!==null) currentWo.entries[_replaceWoIdx]=ne;
    else currentWo.entries.push(ne);
    closeM('m-picker');
    renderActiveWo();
    scheduleAutoSave();
    return;
  }
  if(_pickerTarget==='log-edit'){
    _editLogEntries.push({exId:id, name:ex.name, muscle:ex.muscle, sets:[{kg:'',reps:''}]});
    closeM('m-picker');
    renderLogEditExos();
    return;
  }
}

function addSessToP(sid){
  if(!_progSess.includes(sid)){_progSess.push(sid); renderProgEditList();}
  closeM('m-sess-pick');
}

// ════ CHART ════
function drawChart(canvas,labels,data){
  const dpr=window.devicePixelRatio||1;
  const W=canvas.parentElement.clientWidth||600,H=160;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  canvas.width=W*dpr;canvas.height=H*dpr;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,W,H);
  if(data.length<2){
    ctx.fillStyle='#888888';ctx.font='10px Inter, sans-serif';ctx.textAlign='center';
    ctx.fillText(data.length===1?'CONTINUE — UNE SEULE SÉANCE':'PAS DE DONNÉES',W/2,H/2);
    return;
  }
  const pad={t:20,r:14,b:26,l:46};
  const gW=W-pad.l-pad.r,gH=H-pad.t-pad.b;
  const minV=Math.min(...data),maxV=Math.max(...data),range=maxV-minV||1;
  for(let i=0;i<=3;i++){
    const y=pad.t+(gH/3)*i;
    ctx.strokeStyle='#E5EAE5';ctx.lineWidth=1;ctx.setLineDash([2,4]);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+gW,y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#888888';ctx.font='8px Inter, sans-serif';ctx.textAlign='right';
    ctx.fillText(Math.round((maxV-(range/3)*i)*10)/10,pad.l-4,y+3);
  }
  const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+gH);
  grad.addColorStop(0,'rgba(61,139,55,0.12)');grad.addColorStop(1,'rgba(61,139,55,0)');
  ctx.beginPath();
  data.forEach((v,i)=>{const x=pad.l+(i/(data.length-1))*gW,y=pad.t+(1-(v-minV)/range)*gH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  ctx.lineTo(pad.l+gW,pad.t+gH);ctx.lineTo(pad.l,pad.t+gH);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();ctx.strokeStyle='#3D8B37';ctx.lineWidth=2;
  data.forEach((v,i)=>{const x=pad.l+(i/(data.length-1))*gW,y=pad.t+(1-(v-minV)/range)*gH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  ctx.stroke();
  data.forEach((v,i)=>{
    const x=pad.l+(i/(data.length-1))*gW,y=pad.t+(1-(v-minV)/range)*gH;
    ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);
    ctx.fillStyle='#FFFFFF';ctx.fill();
    ctx.strokeStyle='#3D8B37';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#1A1A1A';ctx.font='8px Inter, sans-serif';ctx.textAlign='center';
    ctx.fillText(v,x,y-8);
  });
  ctx.fillStyle='#888888';ctx.font='8px Inter, sans-serif';ctx.textAlign='center';
  const step=Math.max(1,Math.floor(labels.length/7));
  labels.forEach((l,i)=>{if(i%step===0){const x=pad.l+(i/(data.length-1))*gW;ctx.fillText(l,x,H-4);}});
}

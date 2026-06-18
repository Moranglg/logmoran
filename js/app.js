// ════ APP — init, loaders, seedIfEmpty, démarrage ════

// ── INIT ──
async function init(){
  showLoad('Connexion à la base...');
  try {
    await Promise.all([
      loadMuscles().catch(()=>{}),
      loadExercises().catch(()=>{}),
      loadSessions().catch(()=>{}),
      loadPrograms().catch(()=>{}),
      loadLogs().catch(()=>{}),
      loadGoals().catch(()=>{})
    ]);
    setSyncStatus('● sync');
  } catch(e){
    setSyncStatus('● hors ligne', false);
    toast('Erreur de connexion : '+e.message,'warn');
  }
  hideLoad();
}

// ── LOADERS ──
async function loadMuscles(){ muscles = await dbGet('muscles','select=*'); }
async function loadExercises(){ exercises = await dbGet('exercises','select=*'); }
async function loadSessions(){ sessions = await dbGet('sessions','select=*'); }
async function loadPrograms(){ programs = await dbGet('programs','select=*'); }
async function loadLogs(){ logs = await dbGet('logs','select=*'); }
async function loadGoals(){
  const rows = await fetch(`${SB_URL}/rest/v1/goals?select=*`, {headers:{...H,'Accept':'application/json'}}).then(r=>r.json());
  goals={};
  if(Array.isArray(rows)) rows.forEach(r=>goals[r.muscle]=r.target);
}

// ── SEED PAR DÉFAUT ──
async function seedIfEmpty(){
  if(muscles.length===0){
    showLoad('Premier lancement — initialisation...');
    try {
      const mRows=await Promise.all(DEF_MUSCLES.map((name,i)=>dbInsert('muscles',{name,position:i}).then(r=>r[0])));
      muscles=mRows;
      const exRows=await Promise.all(DEF_EX.map(e=>dbInsert('exercises',e).then(r=>r[0])));
      exercises=exRows;
      toast('Base initialisée avec les données par défaut !','ok');
    } catch(e){ toast('Erreur init : '+e.message,'warn'); }
    hideLoad();
  }
}

// ── DÉMARRAGE ──
init().then(()=>seedIfEmpty().then(()=>{
  goPage('today');
}));

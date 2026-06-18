// ════ CONFIG — Supabase URL/KEY, constantes ════
const SB_URL = 'https://pnysghuvlujvxmnibfaf.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueXNnaHV2bHVqdnhtbmliZmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODQ4NDUsImV4cCI6MjA5NjU2MDg0NX0.jDkxCg_0FYFFDh2XDXnfGp6Uxd6r1lPl1yVT_ISdLpw';
const H = {'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Prefer':'return=representation'};

// ════ DONNÉES PAR DÉFAUT ════
const DEF_MUSCLES=['Pectoraux','Dos','Épaules','Quadriceps','Ischio-jambiers','Fessiers','Mollets','Biceps','Triceps','Abdominaux'];
const DEF_EX=[
  {name:'Développé couché barre',muscle:'Pectoraux',note:''},
  {name:'Développé incliné haltères',muscle:'Pectoraux',note:''},
  {name:'Écarté poulie basse',muscle:'Pectoraux',note:''},
  {name:'Soulevé de terre',muscle:'Dos',note:'Dos droit'},
  {name:'Tractions',muscle:'Dos',note:''},
  {name:'Rowing barre',muscle:'Dos',note:''},
  {name:'Tirage vertical',muscle:'Dos',note:''},
  {name:'Rowing haltère unilatéral',muscle:'Dos',note:''},
  {name:'Développé militaire barre',muscle:'Épaules',note:''},
  {name:'Élévations latérales',muscle:'Épaules',note:''},
  {name:'Face pull',muscle:'Épaules',note:''},
  {name:'Curl biceps barre',muscle:'Biceps',note:''},
  {name:'Curl marteau',muscle:'Biceps',note:''},
  {name:'Dips',muscle:'Triceps',note:''},
  {name:'Extension triceps poulie',muscle:'Triceps',note:''},
  {name:'Skull crusher',muscle:'Triceps',note:''},
  {name:'Squat barre',muscle:'Quadriceps',note:''},
  {name:'Presse à cuisses',muscle:'Quadriceps',note:''},
  {name:'Fentes marchées',muscle:'Quadriceps',note:''},
  {name:'Leg extension',muscle:'Quadriceps',note:''},
  {name:'Romanian deadlift',muscle:'Ischio-jambiers',note:''},
  {name:'Leg curl couché',muscle:'Ischio-jambiers',note:''},
  {name:'Hip thrust',muscle:'Fessiers',note:''},
  {name:'Mollets debout',muscle:'Mollets',note:''},
  {name:'Mollets assis',muscle:'Mollets',note:''},
  {name:'Planche',muscle:'Abdominaux',note:''},
  {name:'Ab wheel',muscle:'Abdominaux',note:''},
];

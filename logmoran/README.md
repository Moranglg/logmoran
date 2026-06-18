# LogMoran

Application de suivi d'entraînement (musculation) — version modulaire de `LogMoranV1.html`.

Front-end statique (HTML/CSS/JS vanilla) branché sur une base **Supabase** via son API REST.

## Lancer

Aucune compilation. Sers le dossier avec n'importe quel serveur statique puis ouvre `index.html` :

```bash
# Python
python -m http.server 8000
# ou Node
npx serve
```

> Ouvrir le fichier directement en `file://` fonctionne aussi, mais un serveur local
> évite d'éventuels soucis CORS sur certains navigateurs.

## Structure

```
logmoran/
├── index.html          ← HTML pur, lie le CSS et les modules JS
├── css/
│   └── style.css       ← tout le CSS (thème « Forge Dark »)
├── js/
│   ├── config.js       ← Supabase URL/KEY, en-têtes, données par défaut
│   ├── api.js          ← dbGet, dbInsert, dbUpdate, dbDelete
│   ├── state.js        ← toutes les variables globales
│   ├── ui.js           ← toast, modal, loading, nav, chart, picker
│   ├── exercises.js    ← renderEx, openExEdit, saveEx, delEx
│   ├── muscles.js      ← renderMuscles, saveMuscle, delMuscle
│   ├── sessions.js     ← renderSess, saveSess, drag & drop
│   ├── programs.js     ← renderProg, saveProg
│   ├── workout.js      ← séance du jour, autosave, drag & drop
│   ├── week.js         ← renderWeek, saveGoal, showRecap, editLog
│   ├── progress.js     ← renderPRs, courbes, historique
│   └── app.js          ← init, seedIfEmpty, démarrage
└── README.md
```

Les modules partagent un **scope global** (pas de bundler ni d'`import`/`export`).
L'ordre des balises `<script>` en bas d'`index.html` respecte les dépendances ;
`app.js` est chargé en dernier et lance l'application.

## Configuration

Les identifiants Supabase (`SB_URL`, `SB_KEY`) et les données par défaut
(`DEF_MUSCLES`, `DEF_EX`) sont dans `js/config.js`.

Tables attendues côté Supabase : `muscles`, `exercises`, `sessions`,
`programs`, `logs`, `goals`.

## Note de migration

Lors de l'extraction, le code original contenait **deux** définitions de
`finishWo` (et de `cancelWo`). Le comportement a été conservé à l'identique :
en JavaScript, la dernière déclaration l'emporte, donc c'est la version
`dbInsert` de `finishWo` qui s'exécute. Voir les commentaires dans
`js/workout.js`.

// ════ STATE — toutes les variables globales ════

// Données chargées depuis la base
let muscles=[], exercises=[], sessions=[], programs=[], logs=[], goals={};

// Séance en cours / timers
let currentWo=null, woStart=null, woTimerInt=null;

// Onglet courant de la progression
let progCurTab='prs';

// Navigation semaine (0 = semaine courante, -1 = précédente, etc.)
let currentWeekOffset = 0;

// Buffers d'édition (séance/programme) + cible du picker
let _sessExos=[], _progSess=[], _pickerTarget=null, _replaceWoIdx=null;

// Filtres (picker + liste exercices)
let pkFilter='Tous', exFilter='Tous';

// Autosave séance du jour
let _autoSaveTimer=null;
let _autoSaving=false;

// Drag & drop — liste édition séance
let _sedDragSrc=null, _sedTouchSrc=null, _sedTouchClone=null, _sedOffX=0, _sedOffY=0;

// Drag & drop — séance du jour
let _dragSrc=null, _touchSrc=null, _touchClone=null, _touchOffX=0, _touchOffY=0;

// Édition d'un log existant
let _recapLogId = null;
let _editLogId = null;
let _editLogEntries = [];

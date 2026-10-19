// Sauvegarde locale (navigateur) : toutes les 4 s en jeu, à la fermeture de l'onglet, et après chaque étape.
import {$,P,state,on} from './core.js';
import {S,chap} from './histoire/partie.js';

const SAVE_KEY='pluie-noire-save-v1';
export function saveGame(){if(state!=='play'&&state!=='dialogue')return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({S:Object.assign({},S,{elapsed:performance.now()-S.t0}),p:[+P.pos.x.toFixed(2),+P.pos.z.toFixed(2),+P.yaw.toFixed(3)],at:Date.now()}))}catch(e){}}
export function readSave(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return d&&d.S&&d.p?d:null}catch(e){return null}}
export function clearSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}
on('save',saveGame);on('clearSave',clearSave);
export function showSaveInfo(){const d=readSave();$('cont').hidden=!d;$('play').textContent=d?'Nouvelle partie':'Entrer dans la nuit';$('play').classList.toggle('alt',!!d);
  if(!d){$('saveInfo').hidden=true;return}
  const min=Math.round((Date.now()-d.at)/60000),ago=min<1?"à l'instant":min<60?`il y a ${min} min`:min<1440?`il y a ${Math.round(min/60)} h`:`il y a ${Math.round(min/1440)} j`;
  $('saveInfo').textContent=`Sauvegarde ${ago} · ${chap().describe(d.S)}`;$('saveInfo').hidden=false}
setInterval(()=>{if(state==='play')saveGame()},4000);
addEventListener('pagehide',saveGame);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});

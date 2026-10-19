// Déroulé d'une partie : état de l'histoire S, chapitres, objectifs, retour au point sûr, fin, nouvelle partie.
import {$,P,G,state,setState,on,emit} from '../core.js';
import {setCredits,setObjectives} from '../interface.js';
import {tone} from '../son.js';
import {stopDialog} from './dialogue.js';
import {zone,enterZone} from '../zones.js';
import {resetDrones} from '../drones.js';
import {collide} from '../physique.js';
import {setArmed,resetHand} from '../joueur.js';

// Tous les drapeaux de l'histoire (voir docs/histoire.md). Ajouter les nouveaux ici, avec leur valeur de départ.
export const S0=()=>({chapter:1,quest:false,code:false,credits:80,ventTip:false,chip:false,door:false,spotted:0,t0:0,noxPaid:false,ch2:false,armed:false,dd:[false,false,false],gate:false,battery:false,decoded:false,forced:false});
export let S=S0();

/* Un chapitre : {zone, objectives(S,L), checkpoint(S) → [x,z,yaw], reset(), apply(S), describe(S), ends} */
const chapters={};
export function defineChapter(n,c){chapters[n]=c}
export const chap=()=>chapters[S.chapter]||chapters[1];
const ENDS={};
export const defineEnds=e=>Object.assign(ENDS,e);

export function refreshHud(){setCredits(S.credits);const L=[];chap().objectives(S,L);setObjectives(L)}
on('hud',refreshHud);

export function caught(){
  if(state!=='play')return;setState('caught');S.spotted++;$('caught').hidden=false;tone(300,.6,'sawtooth',.08,90);
  setTimeout(()=>{const[x,z,y]=chap().checkpoint(S);P.pos.set(x,0,z);P.yaw=y;P.pitch=0;P.vx=P.vz=0;resetDrones(zone());G.grace=2.5;$('caught').hidden=true;if(state==='caught')setState('play')},1500);
}
on('caught',caught);

export function finish(k){
  stopDialog();setState('end');if(document.pointerLockElement)document.exitPointerLock();
  const sec=Math.round((performance.now()-S.t0)/1000),e=ENDS[k];
  $('endTitle').textContent=e[0];$('endText').textContent=typeof e[1]==='function'?e[1]():e[1];
  $('endStats').textContent=`Temps ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}  ·  Repérages : ${S.spotted}  ·  ${S.credits} crédits restants`;
  $('hud').hidden=true;$('touch').hidden=true;document.body.classList.remove('playing');emit('clearSave');$('end').hidden=false;tone(220,1.2,'sine',.05,330);
}

// Nouvelle partie : état neuf, décors remis à zéro par chaque chapitre, joueur au départ.
export function newGame(){
  S=S0();S.t0=performance.now();P.pos.set(0,0,26);P.yaw=0;P.pitch=0;P.vx=P.vz=0;
  for(const k in chapters)chapters[k].reset&&chapters[k].reset();
  enterZone(chap().zone);setArmed(false);resetHand();
  resetDrones(zone());G.grace=1;refreshHud();
}
// Reprise d'une sauvegarde : on repart d'une partie neuve puis on rejoue l'état enregistré.
export function applySave(d){
  newGame();const el=d.S.elapsed||0;Object.assign(S,d.S);delete S.elapsed;S.t0=performance.now()-el;
  enterZone(chap().zone);
  P.pos.set(d.p[0],0,d.p[1]);P.yaw=d.p[2];collide(P.pos,.38);
  for(const k in chapters)chapters[k].apply&&chapters[k].apply(S);
  if(S.armed)setArmed(true);
  G.grace=2.5;refreshHud();
}

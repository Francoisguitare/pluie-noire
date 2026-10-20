// Déroulé d'une partie : état de l'histoire S, chapitres, objectifs, retour au point sûr, fin, nouvelle partie.
import {$,P,G,state,setState,on,emit} from '../core.js';
import {setCredits,setObjectives} from '../interface.js';
import {tone} from '../son.js';
import {stopDialog} from './dialogue.js';
import {zone,enterZone,assurerZone} from '../zones.js';
import {THREE,scene,V3} from '../core.js';
import {buildEnv} from '../rendu.js';
import {showSky,setHemiBase,placerCiel} from '../ciel.js';
import {rain} from '../pluie.js';
import {fade} from '../interface.js';
import {resetDrones} from '../drones.js';
import {collide} from '../physique.js';
import {setArmed,resetHand} from '../joueur.js';

// Tous les drapeaux de l'histoire (voir docs/histoire.md). Ajouter les nouveaux ici, avec leur valeur de départ.
export const S0=()=>({chapter:1,heure:192,quest:false,code:false,credits:80,ventTip:false,chip:false,door:false,spotted:0,t0:0,noxPaid:false,ch2:false,armed:false,dd:[false,false,false],gate:false,battery:false,decoded:false,forced:false,
  // relations du chapitre 1, utiles plus tard
  kovacVerite:false,kovacPaye:false,kovacMenace:false,readMail:false,
  // chapitre 3 (Black-out)
  blackout:false,kovacAide:false,escalier:false,dd3:[false,false],toits:false,maraVue:false,maraFree:null,trappe:false,noxWith:false,
  // chapitre 4 (Traboules) ; boitier : qui tient la copie du kill-switch de Mara (null, 'mara' ou 'ash')
  sidTrab:false,canuts:false,rosaVue:false,vargaVue:false,atelierOuvert:false,carte:false,badge:false,galerie:false,maraTrab:false,boitier:null,temoignage:false,vargaTestifies:null,
  // chapitre 5 (Confluence) ; cams : caméras abattues (« zone:numéro »)
  tour:false,ascenseur:false,couloir:false,lasersCoupes:false,cle:false,sommet:false,finale:false,cams:[],fin:null,
  // pouvoirs (voir pouvoirs.js) : XP, améliorations achetées, Gardiens neutralisés {k:'zone:num',x,z,yaw,sens}, archives trouvées,
  // dernière étape de l'histoire déjà payée en XP, tutoriel de la Coupure vu
  xp:0,ameli:{portee:0,recharge:0,discretion:0,arc:0,echo:0},neutres:[],archives:[],xpChap:1,coupureVue:false,
  // exploration (voir exploration.js) : lieux découverts, premières rencontres, dossiers complets, quêtes (sid, rosa, casier), signal déjà expliqué
  lieux:[],rencontres:[],dossiersFinis:[],quetes:{},signalVu:false});
// Un point de pouvoir par niveau ; chaque niveau coûte 50 XP de plus que le précédent (100, 150, 200…).
export const seuilNiveau=n=>100*n+25*n*(n-1);
export const niveauDe=xp=>{let n=0;while(seuilNiveau(n+1)<=xp)n++;return n};
export let S=S0();

/* Un chapitre : {zone, objectives(S,L), checkpoint(S) → [x,z,yaw], reset(), apply(S), describe(S), ends} */
const chapters={};
export function defineChapter(n,c){chapters[n]=c}
export const chap=n=>chapters[n??S.chapter]||chapters[1];
// La zone d'un chapitre peut dépendre de l'avancée (ex. chapitre 3 : la rue, puis les toits).
const zoneDe=c=>typeof c.zone==='function'?c.zone(S):c.zone;
const ENDS={};
export const defineEnds=e=>Object.assign(ENDS,e);

export function refreshHud(){setCredits(S.credits);$('heure').textContent=fmtHeure(S.heure);const L=[];chap().objectives(S,L);setObjectives(L);emit('hudRafraichi')}
on('hud',refreshHud);

export function caught(){
  if(state!=='play')return;setState('caught');S.spotted++;$('caught').hidden=false;tone(300,.6,'sawtooth',.08,90);
  setTimeout(()=>{const[x,z,y]=chap().checkpoint(S);P.pos.set(x,0,z);P.yaw=y;P.pitch=0;P.vx=P.vz=0;resetDrones(zone());emit('apresCapture');G.grace=2.5;$('caught').hidden=true;if(state==='caught')setState('play')},1500);
}
on('caught',caught);

// o.kicker : sur-titre (« Fin de la saison 1 ») ; o.saison : note sur la suite.
export function finish(k,o={}){
  stopDialog();setState('end');if(document.pointerLockElement)document.exitPointerLock();
  const sec=Math.round((performance.now()-S.t0)/1000),e=ENDS[k];
  $('endKicker').textContent=o.kicker||'Fin de mission';$('endSaison').textContent=o.saison||'';$('endSaison').hidden=!o.saison;
  $('endTitle').textContent=e[0];$('endText').textContent=typeof e[1]==='function'?e[1]():e[1];
  $('endStats').textContent=`Temps ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}  ·  Repérages : ${S.spotted}  ·  ${S.credits} crédits restants  ·  Niveau ${niveauDe(S.xp)}  ·  Archives : ${S.archives.length}`;
  $('hud').hidden=true;$('touch').hidden=true;document.body.classList.remove('playing');emit('clearSave');$('end').hidden=false;tone(220,1.2,'sine',.05,330);
}

// Nouvelle partie : état neuf, décors remis à zéro par chaque chapitre, joueur au départ.
export function newGame(){
  S=S0();S.t0=performance.now();P.pos.set(0,0,26);P.yaw=0;P.pitch=0;P.vx=P.vz=0;
  for(const k in chapters)chapters[k].reset&&chapters[k].reset();
  allerZone(zoneDe(chap()),null,{fondu:false});setArmed(false);resetHand();
  resetDrones(zone());G.grace=1;refreshHud();
}
// Reprise d'une sauvegarde : on repart d'une partie neuve puis on rejoue l'état enregistré.
export function applySave(d){
  newGame();const el=d.S.elapsed||0;Object.assign(S,d.S);delete S.elapsed;S.t0=performance.now()-el;
  for(const k in chapters)chapters[k].avantZone&&chapters[k].avantZone(S);
  allerZone(d.zone||zoneDe(chap()),null,{fondu:false});
  P.pos.set(d.p[0],0,d.p[1]);P.yaw=d.p[2];collide(P.pos,.38);
  for(const k in chapters)chapters[k].apply&&chapters[k].apply(S);
  emit('partieAppliquee'); // les chapitres ont pu ajouter des Gardiens : pouvoirs.js remet à terre les neutralisés
  if(S.armed)setArmed(true);
  G.grace=2.5;refreshHud();
}

/* ---------- Changer de zone ---------- */
// Construit la zone si besoin, applique son ambiance (brouillard, ciel, pluie, lumière, reflets) et place le joueur.
// spawn : [x,z,yaw] ou null pour ne pas bouger le joueur. fondu : passage au noir.
export function allerZone(id,spawn,{fondu=true,ensuite=null}={}){
  const faire=()=>{
    const z=assurerZone(id);enterZone(id);
    scene.fog.color.setHex(z.fog);scene.background.setHex(z.fog);scene.fog.density=z.fogD;showSky(z.ciel);placerCiel(z.cielY);setHemiBase(z.hemi);
    if(!z.env){const cach=[rain,...(z.cacherEnv||[])];z.root.traverse(o=>{if(o.type==='Reflector')cach.push(o)});z.env=buildEnv(new V3(...z.envPos),cach)}
    scene.environment=z.env;
    if(spawn){P.pos.set(spawn[0],0,spawn[1]);P.yaw=spawn[2]||0;P.pitch=0;P.vx=P.vz=0}
    resetDrones(z);emit('apresCapture');G.grace=Math.max(G.grace,1.5);
    if(ensuite)ensuite();
  };
  if(!fondu){faire();return}
  fade(true);setTimeout(()=>{faire();emit('save');setTimeout(()=>fade(false),120)},350);
}
// L'heure du HUD avance avec le temps réel et saute aux moments clés de l'histoire (jamais au-delà de 5 h 58 avant la fin).
export function heure(min){S.heure=Math.max(S.heure,min)}
export const fmtHeure=m=>{m=Math.floor(m);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};

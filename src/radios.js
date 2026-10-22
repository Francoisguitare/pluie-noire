// Les radios des Gardiens. À moins de 9 m d'un Gardien qui ne t'a pas vu, on entend son canal : la tour, les autres
// patrouilles, la Faucheuse, parfois Saal. Des répliques qui racontent la nuit d'en face, et parfois un conseil sans le
// vouloir. Une écoute entendue jusqu'au bout compte (S.radios, XP, pourcentage de la partie) et se relit dans « Dossiers ».
// Si on s'éloigne ou si ça tourne mal, le canal grésille et coupe : l'écoute pourra reprendre plus tard.
import {$,P,G,state,on,emit} from './core.js';
import {S} from './histoire/partie.js';
import {zone} from './zones.js';
import {RADIOS} from './archives.js';
import {gagner} from './pouvoirs.js';
import {categorie} from './completion.js';
import {gresillement} from './son.js';

categorie({id:'radios',nom:'Écoutes radio',poids:4,fait:()=>S.radios.filter(id=>RADIOS.some(r=>r.id===id)).length,total:()=>RADIOS.length});
const DUREE=3.6; // secondes par réplique
let cours=null,attente=4;
// Un Gardien assez proche, debout, qui ne t'a pas vu (et dans le bon secteur du lieu, si l'écoute en demande un).
function emetteur(Z,r){
  for(const d of Z.gardiens){if(d.neutre||!d.g.visible||d.etat==='combat'||d.s>.4)continue;
    if(r.secteur&&!(d.pos.x>=r.secteur[0]&&d.pos.x<=r.secteur[1]))continue;
    if(Math.hypot(d.pos.x-P.pos.x,d.pos.z-P.pos.z)<9)return d}
  return null;
}
function afficher(){
  const r=cours.r,L=r.lignes.slice(Math.max(0,cours.i-1),cours.i+1);
  $('radioTxt').innerHTML='';for(const[qui,t]of L){const p=document.createElement('p'),b=document.createElement('b');b.textContent=qui;p.appendChild(b);p.appendChild(document.createTextNode(' '+t));$('radioTxt').appendChild(p)}
  $('radio').hidden=false;gresillement(.6);
}
function couper(){if(!cours)return;cours=null;gresillement(1);$('radio').hidden=true;attente=8}
function finir(){const r=cours.r;cours=null;setTimeout(()=>{if(!cours)$('radio').hidden=true},1400);attente=12;
  if(!S.radios.includes(r.id)){S.radios.push(r.id);gagner(15,'écoute radio');emit('save')}}
export function updateRadios(dt){
  const Z=zone();if(!Z)return;
  if(cours){
    if(state!=='play')return; // le temps s'arrête en pause, en lecture, en dialogue
    if(G.danger>0||!cours.d.g.visible||cours.d.neutre||Math.hypot(cours.d.pos.x-P.pos.x,cours.d.pos.z-P.pos.z)>14){couper();return}
    cours.t-=dt;if(cours.t<=0){cours.i++;if(cours.i>=cours.r.lignes.length){finir();return}cours.t=DUREE;afficher()}
    return;
  }
  if(state!=='play'||G.danger>0)return;
  attente-=dt;if(attente>0)return;attente=1;
  for(const r of RADIOS){if(r.zone!==Z.id||S.radios.includes(r.id)||(r.si&&!r.si(S)))continue;const d=emetteur(Z,r);if(!d)continue;
    cours={r,d,i:0,t:DUREE};afficher();return}
}
on('apresCapture',()=>{if(cours)couper()});

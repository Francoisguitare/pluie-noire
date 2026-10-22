// Affichage par-dessus la 3D : messages, objectifs, crédits, jauge de détection, impacts.
import {$,MOBILE,on} from './core.js';
import {tone} from './son.js';

if(MOBILE)$('note').textContent='Une nuit en cinq chapitres, environ une heure et demie. Joue en mode paysage. Ta partie est sauvegardée automatiquement.';
let toastT=null;
export function toast(t){const el=$('toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),3400)}
let hitT=null;
export function showHit(){const h=$('hit');h.classList.add('on');clearTimeout(hitT);hitT=setTimeout(()=>h.classList.remove('on'),120)}
export function setCredits(n){$('cred').textContent=n}
export function setObjectives(L){$('objs').innerHTML=L.map(([t,c])=>`<li class="${c}">${t}</li>`).join('')}
let beepT=0;
// Jauge, vignette rouge et bips selon le niveau de détection le plus haut (0..1).
export function detectionHud(dt,maxS){
  $('detbar').style.width=(maxS*100).toFixed(1)+'%';$('det').classList.toggle('hot',maxS>.5);$('vig').style.opacity=Math.min(.5,Math.max(0,maxS-.15)*.9); // le voile du combat est celui des blessures (combat.js)
  beepT-=dt;if(maxS>.12&&beepT<=0){tone(760+maxS*700,.07,'square',.025);beepT=.6-maxS*.45}
}
export function fade(on){$('fade').classList.toggle('on',on)}
// L'écran de chargement, réutilisé en cours de partie (premier passage dans un lieu, reprise d'une partie).
let finT=null;
export function chargement(texte,k=.6){clearTimeout(finT);const c=$('chargement');c.hidden=false;c.classList.remove('fini');$('lstep').textContent=texte;$('lbar').style.width=(k*100)+'%'}
export function finChargement(){$('lbar').style.width='100%';const c=$('chargement');c.classList.add('fini');finT=setTimeout(()=>{c.hidden=true},650)}
// Question à deux réponses, par-dessus tout le reste. Renvoie une promesse : true si l'on accepte.
export function ask(titre,texte,oui='Oui',non='Annuler'){return new Promise(res=>{
  $('askTitle').textContent=titre;$('askText').textContent=texte;$('askYes').textContent=oui;$('askNo').textContent=non;$('askNo').hidden=!non;$('ask').hidden=false;
  const fin=v=>{$('ask').hidden=true;$('askYes').onclick=$('askNo').onclick=null;res(v)};$('askYes').onclick=()=>fin(true);$('askNo').onclick=()=>fin(false);$('askYes').focus()})}
// Ouvre un écran par-dessus un autre, qu'on retrouve en le fermant.
const pile=[];
export function ouvrirEcran(id,depuis){if(depuis){$(depuis).hidden=true;pile.push(depuis)}$(id).hidden=false}
export function fermerEcran(id){$(id).hidden=true;const r=pile.pop();if(r)$(r).hidden=false}
// Le témoin « Sauvegarde automatique », quelques secondes en bas de l'écran, à chaque point de sauvegarde.
let autoT=null;
on('pointSauve',()=>{const a=$('autosave');a.classList.add('on');clearTimeout(autoT);autoT=setTimeout(()=>a.classList.remove('on'),2600)});

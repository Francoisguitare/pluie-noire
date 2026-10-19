// Affichage par-dessus la 3D : messages, objectifs, crédits, jauge de détection, impacts.
import {$,MOBILE} from './core.js';
import {tone} from './son.js';

if(MOBILE)$('note').textContent='Environ 3 minutes. Joue en mode paysage. Ta partie est sauvegardée automatiquement.';
let toastT=null;
export function toast(t){const el=$('toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),3400)}
let hitT=null;
export function showHit(){const h=$('hit');h.classList.add('on');clearTimeout(hitT);hitT=setTimeout(()=>h.classList.remove('on'),120)}
export function setCredits(n){$('cred').textContent=n}
export function setObjectives(L){$('objs').innerHTML=L.map(([t,c])=>`<li class="${c}">${t}</li>`).join('')}
let beepT=0;
// Jauge, vignette rouge et bips selon le niveau de détection le plus haut (0..1).
export function detectionHud(dt,maxS){
  $('detbar').style.width=(maxS*100).toFixed(1)+'%';$('det').classList.toggle('hot',maxS>.5);$('vig').style.opacity=Math.max(0,maxS-.15)*1.1;
  beepT-=dt;if(maxS>.12&&beepT<=0){tone(760+maxS*700,.07,'square',.025);beepT=.6-maxS*.45}
}
export function fade(on){$('fade').classList.toggle('on',on)}

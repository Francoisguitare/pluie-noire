// Moteur de dialogue. Un dialogue = {name, entry(), nodes}. Un nœud = {t texte (ou fonction), c() choix, act() action}.
// Un choix = {l libellé, go nœud suivant (id, null pour partir, ou fonction), if() condition d'affichage}.
import {$,MOBILE,state,setState,on,emit} from '../core.js';
import {tone} from '../son.js';
import {gesture} from '../personnages.js';
import {npcBy} from '../zones.js';
import {toast} from '../interface.js';
import {reprendreVisee} from '../controles.js';

export const DLG={};
// Nœuds où le personnage secoue la tête au lieu d'acquiescer
export const SHAKE=new Set();
let dlg=null,typeTimer=null,fullText='';
export function openDialog(key,node){dlg={d:DLG[key],key};document.body.classList.add('dialogue');setState('dialogue'); // la souris reste verrouillée : curseur dessiné (controles.js)
  emit('dialogueOuvert',key);$('prompt').hidden=true;$('dialog').hidden=false;$('dwho').textContent=dlg.d.name;tone(720,.06,'triangle',.04);showNode(node||dlg.d.entry())}
function showNode(id){
  if(id==null){closeDialog();return}
  if(typeof id==='function'){id();return}
  const n=dlg.d.nodes[id];if(n.act)n.act();if(!dlg)return;gesture(npcBy(dlg.key),SHAKE.has(id)?'shake':'agree');
  fullText=typeof n.t==='function'?n.t():n.t;typeText(fullText);
  const ch=(n.c?n.c():[{l:'(Partir)',go:null}]).filter(c=>!c.if||c.if());
  dlg.choices=ch;const ol=$('dch');ol.innerHTML='';ol.scrollTop=0;$('dtxt').scrollTop=0;
  ch.forEach((c,i)=>{const li=document.createElement('li');const b=document.createElement('button');b.id='choice'+i;
    b.innerHTML=`<span>${i+1}</span>`;b.appendChild(document.createTextNode(c.l));b.onclick=()=>pickChoice(i);li.appendChild(b);ol.appendChild(li)});
  emit('hud');
}
function typeText(t){clearInterval(typeTimer);const el=$('dtxt');let i=0;el.textContent='';
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=t;return}
  typeTimer=setInterval(()=>{i+=2;el.textContent=t.slice(0,i);if(i>=t.length)clearInterval(typeTimer)},16)}
export function pickChoice(i){if(!dlg||!dlg.choices[i])return;clearInterval(typeTimer);tone(520,.04,'triangle',.03);showNode(dlg.choices[i].go);
  if(!dlg&&(state==='play'||state==='cine'))reprendreVisee()} // le dialogue est fini : la visée revient sans recliquer
// Ferme sans rien déclencher (fin de partie, cinématique).
export function stopDialog(){clearInterval(typeTimer);document.body.classList.remove('dialogue');$('dialog').hidden=true;dlg=null}
export function closeDialog(){stopDialog();if(state==='dialogue')setState('play');emit('dialogClosed');emit('hud');emit('save')}
export const inDialog=()=>!!dlg;
on('choice',pickChoice);
on('skipText',()=>{clearInterval(typeTimer);$('dtxt').textContent=fullText});

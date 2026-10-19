// Cinématiques : la caméra suit un script, des événements se déclenchent à l'heure dite, des sous-titres s'affichent.
// Pendant la scène, state vaut 'cine'. Passer (Espace, Entrée, Échap, toucher) exécute tous les événements restants
// d'un coup : le monde se retrouve exactement dans l'état de fin de scène.
//
// cine([{t, cam:{p:[x,y,z], l:[x,y,z], p2, l2, dur, suivre:()=>[x,y,z]}}, {t, fn}, {t, sub:{qui, texte, dur}}, …]) → Promise
// suivre : la caméra garde l'œil sur un point qui bouge (un appareil, un personnage).
import {$,camera,state,setState,on,emit,V3} from './core.js';

let cur=null;
const _l=new V3(),_a=new V3(),_b=new V3();
const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
export const enCine=()=>!!cur;
export function cine(steps,{apres='play'}={}){
  return new Promise(res=>{
    const evs=steps.filter(s=>s.fn).sort((a,b)=>a.t-b.t),cams=steps.filter(s=>s.cam).sort((a,b)=>a.t-b.t),subs=steps.filter(s=>s.sub).sort((a,b)=>a.t-b.t);
    const fin=Math.max(...steps.map(s=>s.t+(s.cam?s.cam.dur||0:0)+(s.sub?s.sub.dur||0:0)),.1);
    if(document.pointerLockElement)document.exitPointerLock();
    cur={tc:0,evs,cams,subs,fin,next:0,res,apres};setState('cine');
    document.body.classList.add('cine');$('cineBars').hidden=false;$('cineSkip').hidden=false;$('cineSub').hidden=true;
    update(0);
  });
}
function finir(){
  const c=cur;if(!c)return;cur=null;
  document.body.classList.remove('cine');$('cineBars').hidden=true;$('cineSkip').hidden=true;$('cineSub').hidden=true;
  if(state==='cine')setState(c.apres);emit('cineFin');c.res();
}
export function passer(){if(!cur)return;for(;cur&&cur.next<cur.evs.length;cur.next++)cur.evs[cur.next].fn();finir()}
on('skipCine',passer);
$('cineSkip').onclick=passer;
export function update(dt){
  const c=cur;if(!c)return;c.tc+=dt;
  while(c.next<c.evs.length&&c.evs[c.next].t<=c.tc){const e=c.evs[c.next++];e.fn();if(cur!==c)return}
  let k=null;for(const s of c.cams)if(s.t<=c.tc)k=s;
  if(k){const m=k.cam,u=m.dur?ease(Math.min(1,(c.tc-k.t)/m.dur)):1;
    _a.fromArray(m.p);_b.fromArray(m.p2||m.p);camera.position.lerpVectors(_a,_b,u);
    if(m.suivre)_l.fromArray(m.suivre());else{_a.fromArray(m.l);_b.fromArray(m.l2||m.l);_l.lerpVectors(_a,_b,u)}camera.lookAt(_l);
    if(m.fov&&camera.fov!==m.fov){camera.fov=m.fov;camera.updateProjectionMatrix()}}
  let sb=null;for(const s of c.subs)if(s.t<=c.tc&&c.tc<s.t+s.sub.dur)sb=s.sub;
  if(sb){$('cineSub').hidden=false;$('cineWho').textContent=sb.qui||'';$('cineWho').hidden=!sb.qui;$('cineTxt').textContent=sb.texte}else $('cineSub').hidden=true;
  if(c.tc>=c.fin)finir();
}

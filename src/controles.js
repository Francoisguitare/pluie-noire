// Clavier, souris (verrouillage du pointeur) et commandes tactiles. Les actions sont annoncées par événements.
import {$,clamp,state,P,MOBILE,G,renderer,emit} from './core.js';

export const keys={};
addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('input,textarea'))return; // saisie dans un champ (code, e-mail)
  keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='KeyM')emit('mute');
  if(e.code==='KeyG'&&!e.repeat&&state!=='puzzle')emit('cycleQuality'); // G est aussi une carte du métier Jacquard
  if(state==='play'&&e.code==='KeyF'&&!e.repeat)emit('shoot');
  if(state==='play'&&e.code==='KeyR'&&!e.repeat)emit('couper');
  if(e.code==='Tab'){e.preventDefault();if(state==='play'&&!e.repeat)emit('ouvrirPouvoirs')}
  if(e.code==='KeyJ'&&state==='play'&&!e.repeat)emit('ouvrirDossiers');
  if(state==='play'&&(e.code==='KeyP'||e.code==='Escape')&&!e.repeat)emit('pause');
  if(state==='play'&&e.code==='KeyE'&&G.curInter&&!e.repeat){G.curInter.act()}
  else if(state==='dialogue'&&!e.repeat){
    const m=e.code.match(/^(?:Digit|Numpad)([1-6])$/);if(m)emit('choice',+m[1]-1);
    if(e.code==='Space'||e.code==='Enter')emit('skipText');
  }
  else if(state==='cine'&&!e.repeat&&(e.code==='Space'||e.code==='Enter'||e.code==='Escape'))emit('skipCine');
  else if(state==='lecture'&&!e.repeat&&['KeyE','Space','Enter','Escape','KeyF'].includes(e.code))emit('lectureSuite');
});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
const cvs=renderer.domElement;let dragging=false;
export function lookBy(dx,dy){P.yaw-=dx*.0022;P.pitch=clamp(P.pitch-dy*.0022,-1.4,1.4)}
export function lock(){try{const r=cvs.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(err){}}
// Après une lecture, un dialogue ou l'énigme : on reprend la visée tout seul (il faut être dans le geste du joueur,
// clic ou touche ; sinon le navigateur refuse et on le dit).
export function reprendreVisee(){
  if(MOBILE||document.pointerLockElement===cvs)return;
  const echec=()=>{if(state==='play')emit('toast','Clique dans la scène pour reprendre la visée')};
  try{const r=cvs.requestPointerLock();if(r&&r.catch)r.catch(echec)}catch(err){echec()}
}
cvs.addEventListener('mousedown',e=>{if(state==='lecture'){emit('lectureSuite');return}if(avecCurseur()){if(e.button===0)cliquerCurseur();return}if(state!=='play')return;if(document.pointerLockElement===cvs){if(e.button===0)emit('shoot');else if(e.button===2)emit('couper');return}dragging=true;lock()});
cvs.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',()=>{dragging=false});
addEventListener('mousemove',e=>{if(avecCurseur()){bougerCurseur(e.movementX||0,e.movementY||0);return}if(state!=='play')return;if(document.pointerLockElement===cvs||dragging)lookBy(e.movementX||0,e.movementY||0)});
/* ---------- Curseur dessiné ----------
   Pendant un dialogue ou l'énigme du métier, la souris reste verrouillée : un curseur dessiné suit ses mouvements et
   clique sur les réponses. À la fin, la visée reprend aussitôt, sans recliquer dans la scène. */
const curseur=$('curseur');let cx=innerWidth/2,cy=innerHeight*.7,survol=null,affiche=false;
const avecCurseur=()=>(state==='dialogue'||state==='puzzle')&&document.pointerLockElement===cvs;
function viser(){curseur.style.transform=`translate(${cx}px,${cy}px)`;const el=document.elementFromPoint(cx,cy),b=el&&el.closest('button');
  if(b!==survol){if(survol)survol.classList.remove('survol');survol=b;if(b)b.classList.add('survol')}}
function bougerCurseur(dx,dy){cx=clamp(cx+dx,2,innerWidth-2);cy=clamp(cy+dy,2,innerHeight-2);viser()}
function cliquerCurseur(){const el=document.elementFromPoint(cx,cy),b=el&&el.closest('button');if(b&&!b.disabled)b.click()}
// le curseur apparaît sur la première réponse
function centrer(){const b=document.querySelector('#dialog:not([hidden]) #dch button, #metier:not([hidden]) button');
  if(b){const r=b.getBoundingClientRect();cx=r.left+Math.min(40,r.width/2);cy=r.top+r.height/2}else{cx=innerWidth/2;cy=innerHeight*.7}viser()}
setInterval(()=>{const v=avecCurseur();if(v&&!affiche)centrer();if(!v&&survol){survol.classList.remove('survol');survol=null}affiche=v;curseur.hidden=!v},80);
document.addEventListener('pointerlockerror',()=>emit('toast','Maintiens le clic gauche et bouge la souris pour regarder'));

/* ---------- Plein écran ---------- */
// Demandé tout de suite, dans le geste du joueur : le navigateur refuse s'il s'est passé trop de temps depuis le toucher.
// Sur iPhone, Safari ne le permet pas : le jeu installé sur l'écran d'accueil s'ouvre sans barres (manifeste).
const racine=document.documentElement;
export const pleinPossible=!!(racine.requestFullscreen||racine.webkitRequestFullscreen);
export const enPlein=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
const installe=matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches||navigator.standalone===true;
export function pleinEcran(on=!enPlein()){
  try{
    if(on&&!enPlein()){const f=racine.requestFullscreen||racine.webkitRequestFullscreen;if(!f)return;const r=f.call(racine,{navigationUI:'hide'});
      const paysage=()=>{try{const o=screen.orientation;if(MOBILE&&o&&o.lock)o.lock('landscape').catch(()=>{})}catch(e){}};
      if(r&&r.then)r.then(()=>{paysage();majPlein()},()=>{});else paysage()}
    else if(!on&&enPlein()){const r=(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(r&&r.then)r.then(majPlein,()=>{})}
  }catch(e){}
}
function majPlein(){const p=enPlein();document.body.classList.toggle('plein',p);for(const b of document.querySelectorAll('.pleinBtn'))b.textContent=p?'Quitter le plein écran':'Plein écran'}
document.body.classList.toggle('sansPlein',!pleinPossible||installe);
$('pleinAide').hidden=pleinPossible||installe||!MOBILE;
// l'événement ne part pas partout (certains navigateurs) : on vérifie aussi à chaque redimensionnement
document.addEventListener('fullscreenchange',majPlein);document.addEventListener('webkitfullscreenchange',majPlein);addEventListener('resize',majPlein);
for(const b of document.querySelectorAll('.pleinBtn'))b.onclick=()=>pleinEcran();

/* ---------- Commandes tactiles ---------- */
export const TC={on:false,x:0,y:0,id:null,ox:0,oy:0,look:null,lx:0,ly:0,crouch:false,run:false};
const stick=$('stick'),knob=$('knob');
function placeStick(x,y){stick.style.left=x+'px';stick.style.top=y+'px'}
function restStick(){placeStick(Math.max(90,innerWidth*.12),innerHeight-Math.max(90,innerHeight*.2));knob.style.transform='';stick.classList.remove('on')}
restStick();addEventListener('resize',restStick);
function onTouchStart(e){
  if(state!=='play')return;
  for(const t of e.changedTouches){
    if(t.target.closest&&t.target.closest('.tbtn,#prompt'))continue;
    if(t.clientX<innerWidth*.45&&TC.id===null){TC.id=t.identifier;TC.ox=t.clientX;TC.oy=t.clientY;TC.on=true;TC.x=TC.y=0;placeStick(t.clientX,t.clientY);stick.classList.add('on')}
    else if(TC.look===null){TC.look=t.identifier;TC.lx=t.clientX;TC.ly=t.clientY}
  }
  if(e.cancelable)e.preventDefault();
}
function onTouchMove(e){
  if(state!=='play'){if(TC.id!==null||TC.look!==null){TC.id=null;TC.look=null;TC.on=false;TC.x=TC.y=0;restStick()}return}
  for(const t of e.changedTouches){
    if(t.identifier===TC.id){let dx=t.clientX-TC.ox,dy=t.clientY-TC.oy;const d=Math.hypot(dx,dy),R=52;if(d>R){dx*=R/d;dy*=R/d}
      TC.x=dx/R;TC.y=dy/R;if(Math.hypot(TC.x,TC.y)<.12){TC.x=TC.y=0}knob.style.transform=`translate(${dx}px,${dy}px)`}
    else if(t.identifier===TC.look&&state==='play'){const k=2.3;lookBy((t.clientX-TC.lx)*k,(t.clientY-TC.ly)*k);TC.lx=t.clientX;TC.ly=t.clientY}
  }
  if(e.cancelable)e.preventDefault();
}
function onTouchEnd(e){for(const t of e.changedTouches){if(t.identifier===TC.id){TC.id=null;TC.on=false;TC.x=TC.y=0;restStick()}if(t.identifier===TC.look)TC.look=null}}
if(MOBILE){
  const opt={passive:false};
  document.addEventListener('touchstart',onTouchStart,opt);document.addEventListener('touchmove',onTouchMove,opt);
  document.addEventListener('touchend',onTouchEnd);document.addEventListener('touchcancel',onTouchEnd);
  const tap=(el,fn)=>el.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();fn()},{passive:false});
  tap($('tAct'),()=>{if(state==='play'&&G.curInter)G.curInter.act()});
  tap($('prompt'),()=>{if(state==='play'&&G.curInter)G.curInter.act()});
  tap($('tCrouch'),()=>{TC.crouch=!TC.crouch;$('tCrouch').classList.toggle('on',TC.crouch);if(TC.crouch){TC.run=false;$('tRun').classList.remove('on')}});
  tap($('tRun'),()=>{TC.run=!TC.run;$('tRun').classList.toggle('on',TC.run);if(TC.run){TC.crouch=false;$('tCrouch').classList.remove('on')}});
  tap($('tFire'),()=>emit('shoot'));
  tap($('tCoupe'),()=>emit('couper'));
  tap($('tMenu'),()=>{if(state==='play')emit('pause')});
  tap($('tPlein'),()=>pleinEcran(true));
}

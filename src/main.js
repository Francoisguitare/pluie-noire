// Chef d'orchestre : construit le monde dans l'ordre, branche les écrans et les événements, fait tourner la boucle.
import {THREE,$,P,G,T,tick,state,setState,quality,setQuality,MOBILE,camera,scene,on,emit,lerpAng,clamp} from './core.js';
import {into,updateFx} from './construire.js';
import {buildSky,buildCars,updateSky} from './ciel.js';
import {buildRain,updateRain,rain} from './pluie.js';
import {buildRue,loadRueCharacters,rueFallback,H} from './lieux/rue.js';
import {initSparks,updateDrones,killDrone} from './drones.js';
import {updatePlayer,updateHand,handLocked} from './joueur.js';
import {buildEnv,render} from './rendu.js';
import {DLG,openDialog,pickChoice} from './histoire/dialogue.js';
import {ACTIONS} from './histoire/chapitre1.js';
import {S,chap,newGame,applySave} from './histoire/partie.js';
import {saveGame,readSave,clearSave,showSaveInfo,lire,exportCode,importCode} from './sauvegarde.js';
import {toast,detectionHud,fade} from './interface.js';
import {initAudio,toggleMute,setIndoor} from './son.js';
import {keys,lock} from './controles.js';
import {enterZone,zone} from './zones.js';
import {poseSid} from './personnages.js';
import {ouvrirTransfert,importDepuisAdresse} from './transfert.js';
import {ouvrirCompte,initComptes} from './compte.js';
window.__pnBoot=true;

/* ---------- Écrans ---------- */
$('play').disabled=true;$('cont').disabled=true;const noteTxt=$('note').textContent;$('note').textContent='Chargement des personnages…';
const ready=()=>{$('play').disabled=false;$('cont').disabled=false;$('note').textContent=noteTxt};
let perfProbe=null;
function enterGame(){$('title').hidden=true;$('end').hidden=true;$('pauseMenu').hidden=true;$('hud').hidden=false;$('touch').hidden=!MOBILE;document.body.classList.add('playing');setState('play');perfProbe={t:0,f:0};
  if(MOBILE){try{const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen({navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}catch(e){}}else lock()}
$('play').onclick=()=>{initAudio();clearSave();newGame();enterGame();saveGame();toast('Mara t\'attend sous l\'enseigne violette, à gauche')};
$('cont').onclick=()=>{const d=readSave();if(!d)return;initAudio();applySave(d);enterGame();toast('Partie reprise')};
$('again').onclick=()=>{clearSave();newGame();enterGame();saveGame()};
function pause(){if(state!=='play')return;saveGame();emit('saveNow');setState('paused');document.body.classList.add('paused');$('pauseMenu').hidden=false;if(document.pointerLockElement)document.exitPointerLock()}
$('resume').onclick=()=>{$('pauseMenu').hidden=true;document.body.classList.remove('paused');setState('play');if(!MOBILE)lock()};
function toTitle(save){if(save){saveGame();emit('saveNow')}document.body.classList.remove('paused');$('pauseMenu').hidden=true;$('hud').hidden=true;$('touch').hidden=true;document.body.classList.remove('playing');setState('title');showSaveInfo();$('title').hidden=false;
  try{document.fullscreenElement&&document.exitFullscreen()}catch(e){}}
$('toTitle').onclick=()=>toTitle(true);
// Partie importée (code, QR code, compte) pendant une pause : retour à l'écran titre sans écraser l'import.
on('partieImportee',()=>{if(state!=='title')toTitle(false)});
$('transferBtn').onclick=()=>ouvrirTransfert('title');$('pauseTransfer').onclick=()=>ouvrirTransfert('pauseMenu');
$('compteBtn').onclick=()=>ouvrirCompte('title');$('pauseCompte').onclick=()=>ouvrirCompte('pauseMenu');
on('pause',pause);
// Sur ordinateur, perdre le pointeur (touche Échap) ouvre la pause.
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='play'&&!MOBILE)pause()});
on('mute',()=>toast(toggleMute()?'Son coupé':'Son activé'));
on('cycleQuality',()=>{setQuality(quality==='ultra'?'perf':quality==='perf'?'low':'ultra');toast({ultra:'Graphismes : ultra',perf:'Graphismes : performance',low:'Graphismes : économie'}[quality])});
on('toast',toast);
on('teleport',(x,z,yaw,msg)=>{fade(true);setTimeout(()=>{P.pos.set(x,0,z);P.vx=P.vz=0;P.yaw=yaw;P.pitch=0;fade(false);if(msg)toast(msg)},300)});

/* ---------- Monde ---------- */
// L'ordre des constructions fixe la suite aléatoire : ciel, rue (avec ses drones), pluie, voitures.
function buildWorld(){into(null);buildSky();buildRue();initSparks();buildRain();buildCars();enterZone('rue');emit('quality')}
function updateNpcs(dt){
  const pp=state==='title'||state==='end'?camera.position:P.pos;
  for(const n of zone().npcs){const dx=pp.x-n.x,dz=pp.z-n.z,d=Math.hypot(dx,dz),near=d<6&&state!=='title';
    n.g.rotation.y=near?lerpAng(n.g.rotation.y,Math.atan2(dx,dz),dt*3):lerpAng(n.g.rotation.y,n.yaw,dt*1.2);
    if(n.warm!==undefined)n.warm+=((near?0:1)-n.warm)*Math.min(1,dt*2);
    if(n.mixer)n.mixer.update(dt);if(n.bones)poseSid(n);n.tag.material.opacity=clamp(1-(d-5)/4,0,1);
    if(n.cig)n.cig.material.color.setRGB(3,.6+Math.sin(T*.8)*.3,.15)}
}
const fx={flash:0,alert:0,glitch:0};
function frame(dt){
  tick(dt);if(G.grace>0)G.grace-=dt;
  if(state==='title'||state==='end'){camera.position.set(Math.sin(T*.07)*2.5,3.2+Math.sin(T*.19)*.3,24-Math.sin(T*.05)*3);camera.lookAt(Math.sin(T*.1)*1.5,6,-40)}
  if(state==='play')updatePlayer(dt);
  const z=zone();
  G.alertLvl=updateDrones(dt,state==='play',z,chap().droneOpts?chap().droneOpts(S):{});
  if(state==='play')detectionHud(dt,G.alertLvl);
  const inside=state==='play'&&z.indoor(P.pos);updateRain(dt,!inside);setIndoor(inside);
  updateFx(dt,z);updateSky(dt);if(z.update)z.update(dt,S);
  fx.glitch=updateHand(dt);
  updateNpcs(dt);
  fx.flash=G.flash;fx.alert=state==='play'?Math.max(0,G.alertLvl-.3):0;
  if(perfProbe&&state==='play'){perfProbe.t+=dt;perfProbe.f++;if(perfProbe.t>4){const fps=perfProbe.f/perfProbe.t;perfProbe=null;
    if(fps<38&&quality!=='low'){const was=quality;setQuality(quality==='ultra'?'perf':'low');toast(quality==='perf'?'Graphismes passés en mode performance':'Graphismes passés en mode économie');if(was==='ultra')perfProbe={t:0,f:0}}}}
}
const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);frame(dt);render(dt,fx)}

/* ---------- Mode debug (?debug) : accès pour les tests automatiques ---------- */
if(/[?&]debug\b/.test(location.search))window.__pn={P,G,camera,scene,keys,DLG,ACTIONS,openDialog,pickChoice,newGame,applySave,saveGame,readSave,killDrone,zone,handLocked,lire,exportCode,importCode,
  get S(){return S},get state(){return state},
  step:(n,dt=1/30)=>{for(let i=0;i<n;i++)frame(dt)}};

/* ---------- Démarrage : polices, monde, personnages, boucle ---------- */
const fonts=document.fonts&&document.fonts.load?Promise.race([Promise.all(['500','600','700'].map(w=>document.fonts.load(`${w} 40px "Saira Condensed"`))),new Promise(r=>setTimeout(r,1500))]):Promise.resolve();
fonts.catch(()=>{}).then(()=>{
  buildWorld();newGame();
  scene.environment=buildEnv(new THREE.Vector3(0,2.5,-6),[H.reflector,rain]);
  showSaveInfo();initComptes();importDepuisAdresse();
  loadRueCharacters().then(ready,e=>{console.warn('Personnages :',e);rueFallback();ready()});
  loop();
});

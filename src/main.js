// Chef d'orchestre : construit le monde dans l'ordre, branche les écrans et les événements, fait tourner la boucle.
import {THREE,$,P,G,T,tick,state,setState,quality,setQuality,MOBILE,camera,scene,renderer,on,emit,lerpAng,clamp} from './core.js';
import {into,updateFx} from './construire.js';
import {buildSky,buildCars,updateSky} from './ciel.js';
import {buildRain,updateRain,rain} from './pluie.js';
import {buildRue,loadRueCharacters,rueFallback,H} from './lieux/rue.js';
import {H as HT} from './lieux/toits.js';
import {H as HTB} from './lieux/traboules.js';
import * as METIER from './metier.js';
import {H as HQ} from './lieux/quais.js';
import {H as HTO} from './lieux/tour.js';
import {H as HS} from './lieux/sommet.js';
import {initSparks,updateDrones,killDrone} from './drones.js';
import {updateGardiens} from './gardiens.js';
import {updateFaucheuses} from './faucheuse.js';
import {updateCameras} from './cameras.js';
import {update as updateCine,passer as passerCine} from './cinema.js';
import {updatePlayer,updateHand,handLocked} from './joueur.js';
import {buildEnv,render} from './rendu.js';
import {DLG,openDialog,pickChoice} from './histoire/dialogue.js';
import {ACTIONS} from './histoire/chapitre1.js';
import './histoire/chapitre3.js';
import './histoire/chapitre4.js';
import './histoire/chapitre5.js';
import {S,chap,newGame,applySave,allerZone,fmtHeure,NOMS_LIEUX} from './histoire/partie.js';
import {saveGame,readSave,clearSave,showSaveInfo,lire,exportCode,importCode,majPoints,dernierPoint,resume,pointDeSauvegarde} from './sauvegarde.js';
import {toast,detectionHud,fade,chargement,finChargement,ask} from './interface.js';
import {updateCombat,chargerPoint,blesser,trace} from './combat.js';
import {completion,texteCompletion} from './completion.js';
import {updateRadios} from './radios.js';
import {initAudio,toggleMute,setIndoor} from './son.js';
import {keys,lock,pleinEcran} from './controles.js';
import {enterZone,zone,zones} from './zones.js';
import {poseSid,pivoter} from './personnages.js';
import {ouvrirTransfert,importDepuisAdresse} from './transfert.js';
import {ouvrirCompte,initComptes} from './compte.js';
import {updateAmbiance} from './ambiance.js';
import {updatePouvoirs} from './pouvoirs.js';
import {majOrdinateurs} from './ordinateurs.js';
import {updateExploration,brancherHistoire} from './exploration.js';
import {compilerZone,suivreLumieres,signatureLumieres} from './compilation.js';
import {updateMusique} from './musique.js';
import {prechargerRue3} from './histoire/chapitre3.js';
import * as EXPLO from './exploration.js';
brancherHistoire(); // les archives changent certains dialogues (Kovac, Varga, Sid, Rosa)
import * as POUV from './pouvoirs.js';
window.__pnBoot=true;

/* ---------- Écrans ---------- */
$('play').disabled=true;$('cont').disabled=true;const noteTxt=$('note').textContent;$('note').textContent='Chargement des personnages…';
const ready=()=>{$('play').disabled=false;$('cont').disabled=false;$('note').textContent=noteTxt};
let perfProbe=null;
const DEBUG=/[?&]debug\b/.test(location.search);
function enterGame(){$('title').hidden=true;$('end').hidden=true;$('pauseMenu').hidden=true;$('hud').hidden=false;$('touch').hidden=!MOBILE;document.body.classList.add('playing');setState('play');perfProbe=DEBUG?null:{t:0,f:0}; // en test, pas de baisse automatique de qualité
  if(!MOBILE)lock()}
$('play').onclick=()=>{if(MOBILE)pleinEcran(true);initAudio();clearSave();newGame();enterGame();saveGame();toast('Mara t\'attend sous l\'enseigne violette, à gauche')};
$('cont').onclick=()=>{const d=readSave();if(!d)return;if(MOBILE)pleinEcran(true);initAudio();
  const reprendre=()=>{applySave(d);enterGame();toast('Partie reprise')};
  // partie sauvegardée ailleurs que dans la rue : le lieu est construit et préparé derrière l'écran de chargement
  const z=zones[d.zone||'rue'];if(z&&z.compilee){reprendre();return}
  chargement('Reprise de ta partie : '+(NOMS_LIEUX[d.zone]||'')+'…');setTimeout(()=>{reprendre();finChargement()},60)};
$('again').onclick=()=>{if(MOBILE)pleinEcran(true);clearSave();newGame();enterGame();saveGame()};
function pause(){if(state!=='play')return;saveGame();emit('saveNow');setState('paused');document.body.classList.add('paused');$('pauseMenu').hidden=false;if(document.pointerLockElement)document.exitPointerLock();
  const d=dernierPoint();$('pointInfo').hidden=!d;$('pausePoint').hidden=!d;if(d)$('pointInfo').textContent='Dernier point de sauvegarde : '+resume(d);
  $('pauseCompletion').textContent=texteCompletion()}
// Revenir au dernier point de sauvegarde (on demande d'abord : ce qui a été fait depuis est perdu).
$('pausePoint').onclick=async()=>{const d=dernierPoint();if(!d)return;
  if(!await ask('Revenir au dernier point de sauvegarde ?',`Point de sauvegarde ${resume(d)}. Ce que tu as fait depuis sera perdu.`,'Revenir','Annuler'))return;
  if(MOBILE)pleinEcran(true);$('pauseMenu').hidden=true;document.body.classList.remove('paused');chargerPoint(false);if(!MOBILE)lock()};
$('resume').onclick=()=>{if(MOBILE)pleinEcran(true);$('pauseMenu').hidden=true;document.body.classList.remove('paused');setState('play');if(!MOBILE)lock()};
function toTitle(save){if(save){saveGame();emit('saveNow')}document.body.classList.remove('paused');$('pauseMenu').hidden=true;$('hud').hidden=true;$('touch').hidden=true;document.body.classList.remove('playing');setState('title');showSaveInfo();$('title').hidden=false;}
$('toTitle').onclick=()=>toTitle(true);
$('endTitre').onclick=()=>{$('end').hidden=true;toTitle(false)};
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
function buildWorld(){into(null);buildSky();buildRue();zones.rue.construite=true;initSparks();buildRain();buildCars();enterZone('rue');emit('quality')}
function updateNpcs(dt){
  const pp=state==='title'||state==='end'?camera.position:P.pos;
  for(const n of zone().npcs){const dx=pp.x-n.x,dz=pp.z-n.z,d=Math.hypot(dx,dz),near=d<6&&state!=='title';
    pivoter(n,near?Math.atan2(dx,dz):n.yaw,near?3:1.6,dt);
    if(n.warm!==undefined)n.warm+=((near?0:1)-n.warm)*Math.min(1,dt*2);
    if(n.mixer)n.mixer.update(dt);if(n.bones)poseSid(n);n.tag.material.opacity=state==='cine'?0:clamp(1-(d-5)/4,0,1);
    if(n.cig)n.cig.material.color.setRGB(3,.6+Math.sin(T*.8)*.3,.15)}
}
const fx={flash:0,alert:0,glitch:0};
function frame(dt){
  tick(dt);if(G.grace>0)G.grace-=dt;
  if(state==='title'||state==='end'){camera.position.set(Math.sin(T*.07)*2.5,3.2+Math.sin(T*.19)*.3,24-Math.sin(T*.05)*3);camera.lookAt(Math.sin(T*.1)*1.5,6,-40)}
  if(state==='play')updatePlayer(dt);
  if(state==='cine')updateCine(dt);
  const z=zone(),actif=state==='play';
  G.alertLvl=Math.max(updateDrones(dt,actif,z,chap().droneOpts?chap().droneOpts(S):{}),updateGardiens(dt,actif,z),updateFaucheuses(dt,actif,z),updateCameras(dt,actif,z));
  updateCombat(dt);majPoints(dt);
  if(actif){detectionHud(dt,G.alertLvl);
    // Horloge : une minute de jeu par minute réelle, sans dépasser 5 h 58 avant la fin
    const avant=Math.floor(S.heure);S.heure=Math.min(S.heure+dt/60,S.fin?24*60:5*60+58);if(Math.floor(S.heure)!==avant)$('heure').textContent=fmtHeure(S.heure)}
  const inside=(state==='play'||state==='cine')&&z.indoor(P.pos);updateRain(dt,z.pluie&&!inside);setIndoor(inside||!z.pluie);
  updateFx(dt,z);updateSky(dt);if(z.update)z.update(dt,S);
  fx.glitch=Math.max(updateHand(dt),G.choc*.5);updatePouvoirs(dt);majOrdinateurs(dt);updateExploration(dt);updateRadios(dt);suivreLumieres(z);updateMusique(dt);
  updateAmbiance(dt,z);
  updateNpcs(dt);for(const f of z.figurants)if(f.mixer)f.mixer.update(dt);
  fx.flash=G.flash;fx.alert=state==='play'?Math.max(0,G.alertLvl-.3):0;
  if(perfProbe&&state==='play'){perfProbe.t+=dt;perfProbe.f++;if(perfProbe.t>4){const fps=perfProbe.f/perfProbe.t;perfProbe=null;
    if(fps<38&&quality!=='low'){const was=quality;setQuality(quality==='ultra'?'perf':'low');toast(quality==='perf'?'Graphismes passés en mode performance':'Graphismes passés en mode économie');if(was==='ultra')perfProbe={t:0,f:0}}}}
}
const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);frame(dt);render(dt,fx)}

/* ---------- Mode debug (?debug) : accès pour les tests automatiques ---------- */
if(DEBUG)window.__pn={P,G,camera,scene,keys,DLG,ACTIONS,openDialog,pickChoice,newGame,applySave,saveGame,readSave,killDrone,zone,zones,handLocked,lire,exportCode,importCode,allerZone,passerCine,
  get S(){return S},pouvoirs:POUV,combat:{blesser,chargerPoint,dernierPoint,pointDeSauvegarde,trace},on,completion,exploration:EXPLO,signatureLumieres,programmes:()=>renderer.info.programs.length,textures:()=>renderer.info.memory.textures,get state(){return state},emit,H:{rue:H,toits:HT,traboules:HTB,quais:HQ,tour:HTO,sommet:HS},metier:METIER,
  step:(n,dt=1/30)=>{for(let i=0;i<n;i++)frame(dt)}};

/* ---------- Démarrage : polices, monde, personnages, boucle ---------- */
const fonts=document.fonts&&document.fonts.load?Promise.race([Promise.all(['500','600','700'].map(w=>document.fonts.load(`${w} 40px "Saira Condensed"`))),new Promise(r=>setTimeout(r,1500))]):Promise.resolve();
// Écran de chargement : on laisse le navigateur l'afficher entre deux étapes lourdes.
const etape=(texte,k)=>{$('lstep').textContent=texte;$('lbar').style.width=(k*100).toFixed(1)+'%'};
const souffle=()=>new Promise(r=>setTimeout(r,30));
fonts.catch(()=>{}).then(async()=>{
  etape('Construction de la ville…',.08);await souffle();
  buildWorld();newGame();
  showSaveInfo();initComptes();importDepuisAdresse();
  etape('Arrivée des personnages…',.3);
  await loadRueCharacters(v=>etape('Arrivée des personnages…',.3+v*.6)).catch(e=>{console.warn('Personnages :',e);rueFallback()});
  etape('Préparation des lumières…',.94);await souffle();
  // les Gardiens et la Faucheuse du black-out existent dès maintenant (cachés), puis toute la rue est préparée
  prechargerRue3();compilerZone(zones.rue);
  // la boucle ne démarre qu'ici : pendant le chargement, rien ne se dessine derrière l'écran
  loop();etape('Premières images…',.98);
  // les deux premières images (ombres, textures, post-traitement) sont les plus lourdes : on les dessine sous l'écran de chargement
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  etape('Prêt.',1);ready();
  setTimeout(()=>{$('chargement').classList.add('fini');setTimeout(()=>{$('chargement').hidden=true},700)},250);
}).catch(e=>{console.error(e);window.pnEchec&&window.pnEchec("Le jeu n'a pas pu se charger. Recharge la page.")});

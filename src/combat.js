// Combat : la santé d'Ash, les tirs ennemis (Gardiens, drones, Faucheuse), les grilles laser qui brûlent, l'alarme des
// caméras, la chute et le retour au dernier point de sauvegarde. Réglages dans DIFF (core.js) : « tendu mais juste ».
// Une rafale s'annonce (le canon d'épaule se lève, déclic) ; on est plus dur à toucher en courant, accroupi, dans le noir
// ou derrière un obstacle bas ; la santé remonte après quelques secondes sans blessure.
// Les traînées des tirs sont créées au chargement et préparées avec chaque lieu (compilation.js) : rien à compiler en plein combat.
import {THREE,$,V3,P,G,T,DIFF,state,setState,on,emit,clamp,camera,scene,MOBILE} from './core.js';
import {zone,zones} from './zones.js';
import {couvertBas} from './physique.js';
import {eclaire,alerter} from './gardiens.js';
import {burst} from './drones.js';
import {S,applySave,chap,refreshHud} from './histoire/partie.js';
import {dernierPoint} from './sauvegarde.js';
import {toast,fade,chargement,finChargement} from './interface.js';
import {globaux} from './compilation.js';
import {reprendreVisee} from './controles.js';
import {tone,tirEnnemi,sifflement,ricochet,impactJoueur,taserSon,brulure,coeur,chuteJoueur,armement,alarme,droneHitSound,clac,explosion} from './son.js';
import {appliquerFaucheuses,cleFaucheuse,ABATTABLES} from './faucheuse.js';
import {gagner} from './pouvoirs.js';
import {categorie} from './completion.js';
import {showHit} from './interface.js';

/* ---------- Traînées des tirs ---------- */
const TR=[];let trI=0;
const geoTrace=new THREE.CylinderGeometry(1,1,1,6,1,true);geoTrace.translate(0,.5,0);
for(let i=0;i<14;i++){
  const m=new THREE.Mesh(geoTrace,new THREE.MeshBasicMaterial({color:0xffd08a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  m.visible=false;m.frustumCulled=false;m.renderOrder=5;scene.add(m);globaux.push(m);TR.push({m,t:0,dur:.08});
}
const _up=new V3(0,1,0),_d=new V3(),_a=new V3(),_b=new V3();
export function trace(a,b,couleur,ep=.016,dur=.08){
  const t=TR[trI++%TR.length];_d.subVectors(b,a);const L=_d.length();if(L<.05)return;
  t.m.position.copy(a);t.m.quaternion.setFromUnitVectors(_up,_d.divideScalar(L));t.m.scale.set(ep,L,ep);
  t.m.material.color.setHex(couleur).multiplyScalar(2.6);t.m.material.opacity=1;t.m.visible=true;t.t=t.dur=dur;
}

/* ---------- Tirer sur Ash ---------- */
// Chance de toucher : de près, debout, immobile, en pleine lumière, c'est base. Plus loin, en courant, accroupi, dans le
// noir ou derrière un obstacle bas, beaucoup moins. o.projecteur : la Faucheuse éclaire sa cible ; o.dessus : tir plongeant.
export function chanceToucher(x,z,base,portee,o={}){
  const d=Math.hypot(P.pos.x-x,P.pos.z-z);let k=base*(1-clamp((d-4)/Math.max(1,portee-4),0,1)*.6);
  const v=Math.hypot(P.vx,P.vz);k*=v>5?.55:v>1.5?.78:1;
  if(P.crouch>.5)k*=.75;
  if(!o.projecteur&&!eclaire(zone(),P.pos))k*=.75;
  if(!o.dessus&&couvertBas(x,z,P.pos.x,P.pos.z))k*=.45;
  return k;
}
// Un tir de src (bouche du canon) vers Ash. Raté : la balle frappe le sol à côté, ou passe en sifflant.
// vers : là où le tireur croit qu'est Ash (il ne le voit plus) : la balle y part, et rate.
function tir(src,x,z,base,portee,degats,couleur,o={}){
  const y=camera.position.y,c=o.vers||P.pos;
  if(!o.vers&&Math.random()<chanceToucher(x,z,base,portee,o)){_b.set(P.pos.x,y-.3,P.pos.z);trace(src,_b,couleur,o.ep,o.dur);blesser(degats,x,z,o.type);return}
  const a=Math.random()*Math.PI*2,r=.4+Math.random()*1.3;
  if(Math.random()<.55){_b.set(c.x+Math.cos(a)*r,.02,c.z+Math.sin(a)*r);trace(src,_b,couleur,o.ep,o.dur);burst(_b,5);if(o.type!=='taser')ricochet()}
  else{_b.set(c.x+Math.cos(a)*r*.6,y-.5+Math.random()*.9,c.z+Math.sin(a)*r*.6);_b.add(_a.subVectors(_b,src).setLength(12));trace(src,_b,couleur,o.ep,o.dur);
    if(!o.vers&&r<1.2&&o.type!=='taser')sifflement()}
}
const distance=(x,z)=>Math.hypot(P.pos.x-x,P.pos.z-z);
on('tirGardien',(d,voit)=>{
  const D=DIFF.gardien;d.eclair.visible=true;d.eclairT=.06;d.eclair.material.rotation=Math.random()*6;d.eclair.getWorldPosition(_a);
  tirEnnemi(distance(d.pos.x,d.pos.z),false);
  tir(_a.clone(),d.pos.x,d.pos.z,D.chance,D.portee,D.degats,0xffd08a,voit?{}:{vers:d.cible});
  G.danger=Math.max(G.danger,6);alerter(zone(),d.pos,26,d); // les coups de feu s'entendent
});
on('tirDrone',d=>{
  const D=DIFF.drone;_a.set(0,-.03,.36);d.g.localToWorld(_a);tone(1900,.09,'square',.012,700);
  tir(_a.clone(),d.g.position.x,d.g.position.z,D.chance,D.portee,D.degats,0x58e6ff,{ep:.009,dur:.13,type:'taser',dessus:true});
});
on('tirFaucheuse',(f,dans)=>{
  const D=DIFF.faucheuse;_a.set(0,-.85,2.9);f.g.localToWorld(_a);tirEnnemi(distance(f.g.position.x,f.g.position.z),true);
  tir(_a.clone(),f.g.position.x,f.g.position.z,D.chance,D.portee,D.degats,0xff8a40,dans?{ep:.03,dur:.06,projecteur:true,dessus:true}:{ep:.03,dur:.06,vers:f.cible});
});
let laserT=-9;
on('laser',l=>{if(state!=='play'||T-laserT<DIFF.laser.delai)return;laserT=T;blesser(DIFF.laser.degats,l.x,0,'laser');episode();alerter(zone(),P.pos,40)});
on('alarmeCamera',c=>{alarme();episode();toast('Alarme : les Gardiens accourent.');alerter(zone(),P.pos,45)});
on('engagement',e=>{episode();if(e.canon)armement(distance(e.pos.x,e.pos.z))});
// Un nouvel échange de tirs (après un moment de calme) compte comme un repérage.
function episode(){
  if(G.danger<=0){S.spotted++;
    if(!S.combatVu){S.combatVu=true;toast('Alerte : on te tire dessus. Romps le contact : cours, cache-toi, ou accroupis-toi derrière un obstacle bas.')}}
  G.danger=Math.max(G.danger,6);
}

/* ---------- Abattre une Faucheuse ---------- */
on('faucheuseTouchee',(f,p)=>{if(p)burst(p,28);droneHitSound();showHit()});
on('faucheuseRicoche',(f,p)=>{if(p)burst(p,10);clac()});
on('faucheuseTombe',f=>{const k=cleFaucheuse(f);if(!S.faucheuses.includes(k))S.faucheuses.push(k);
  toast('Touchée ! La Faucheuse part en vrille.');tone(160,1.6,'sawtooth',.04,50)});
// au sol : l'explosion (gare à qui est dessous), l'XP, un point de sauvegarde
on('faucheuseAbattue',f=>{
  const p=f.g.position;G.flash=1;burst(_a.set(p.x,1.5,p.z),160);explosion(distance(p.x,p.z));secousse=Math.max(secousse,.8);
  const d=distance(p.x,p.z);if(d<6)blesser(Math.round(45*(1-d/6))+10,p.x,p.z);
  gagner(150,'Faucheuse abattue');emit('save');
});
const majFaucheuses=()=>{const z=zone();if(z)appliquerFaucheuses(z,S)};
on('apresCapture',majFaucheuses);on('partieAppliquee',majFaucheuses);
categorie({id:'faucheuses',nom:'Faucheuses abattues',poids:5,fait:()=>S.faucheuses.filter(k=>ABATTABLES.includes(k)).length,total:()=>ABATTABLES.length});

/* ---------- Blessures ---------- */
let dernierCoup=-99,sang=0,secousse=0,coeurT=0,coupI=0;
export function blesser(n,x,z,type){
  if(state!=='play'||P.vie<=0)return;
  P.vie=Math.max(0,P.vie-n);dernierCoup=T;sang=1;secousse=type==='laser'?.6:.4;G.danger=Math.max(G.danger,6);
  if(x!==undefined)indiquer(x,z);
  if(type==='taser'){taserSon();G.choc=1}else if(type==='laser')brulure();else impactJoueur();
  try{if(MOBILE&&navigator.vibrate)navigator.vibrate(type==='taser'?[40,30,40]:70)}catch(e){}
  majVie();emit('blesse',n,type);
  if(P.vie<=0)tomber();
}
// Un arc rouge au bord de l'écran, du côté d'où vient le coup.
function indiquer(x,z){
  const face=Math.atan2(-Math.sin(P.yaw),-Math.cos(P.yaw)),vers=Math.atan2(x-P.pos.x,z-P.pos.z);
  const el=$('coups').children[coupI++%4];el.style.transform=`rotate(${(face-vers).toFixed(3)}rad)`;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
}
let vieAff=-1;
function majVie(){const v=Math.ceil(P.vie);if(v===vieAff)return;vieAff=v;$('vieBar').style.width=v+'%';$('vie').classList.toggle('bas',v<35)}

/* ---------- La chute ---------- */
let chuteT=-1;
function tomber(){
  setState('mort');chuteT=0;S.morts++;chuteJoueur();$('mort').hidden=false;document.body.classList.add('mort');
  setTimeout(()=>chargerPoint(true),2600);
}
// Retour au dernier point de sauvegarde, santé pleine. Ce qui compte pour toute la partie (repérages, chutes, temps) est gardé.
export function chargerPoint(apresChute){
  const garde={spotted:S.spotted,morts:S.morts,t0:S.t0};
  fade(true);const d=dernierPoint(),z=d&&zones[d.zone];
  // un lieu pas encore préparé dans cette session : écran de chargement le temps de le construire
  const neuf=d&&!(z&&z.compilee);if(neuf)setTimeout(()=>chargement('Retour au dernier point de sauvegarde…'),360);
  setTimeout(()=>{
    if(d)applySave(Object.assign({},d,{vie:DIFF.vie}));
    else{const[x,z,y]=chap().checkpoint(S);P.pos.set(x,0,z);P.yaw=y;emit('apresCapture');G.grace=2.5}
    S.spotted=Math.max(S.spotted,garde.spotted);S.morts=garde.morts;S.t0=garde.t0;
    P.vie=DIFF.vie;P.pitch=0;P.vx=P.vz=0;chuteT=-1;sang=0;secousse=0;G.danger=0;G.choc=0;dernierCoup=-99;
    $('mort').hidden=true;document.body.classList.remove('mort');setState('play');refreshHud();majVie();emit('pointCharge');
    if(neuf)finChargement();setTimeout(()=>fade(false),120);toast(apresChute?'Retour au dernier point de sauvegarde':'Dernier point de sauvegarde chargé');
    reprendreVisee();
  },neuf?480:420);
}

/* ---------- Chaque image ---------- */
let sangAff=-1;
export function updateCombat(dt){
  for(const t of TR)if(t.t>0){t.t-=dt;t.m.material.opacity=Math.max(0,t.t/t.dur);if(t.t<=0)t.m.visible=false}
  if(state==='mort'&&chuteT>=0){ // la caméra tombe
    chuteT+=dt;const k=Math.min(1,chuteT/.9),e=1-(1-k)**3;
    camera.position.y=(1.66-.62*P.crouch)*(1-e)+.3*e;camera.rotation.set(P.pitch*(1-e)-.25*e,P.yaw,e*.6);
  }
  if(state==='play'){
    const z=zone();let combat=false,recherche=false;
    for(const d of z.gardiens){if(d.neutre)continue;if(d.etat==='combat')combat=true;else if(d.alerte>0&&d.etat!=='ronde')recherche=true}
    for(const d of z.drones)if(d.combat&&!d.dead)combat=true;
    for(const f of z.faucheuses)if(f.combat)combat=true;
    // une caméra qui te voit rappelle les Gardiens toutes les 1,5 s
    for(const c of z.cameras)if(c.alarme&&!c.mort){combat=true;if(c.s>=1&&(c.rappel=(c.rappel||0)-dt)<=0){c.rappel=1.5;alerter(z,P.pos,45)}}
    if(combat)G.danger=Math.max(G.danger,4);else if(recherche)G.danger=Math.max(G.danger,1);else G.danger=Math.max(0,G.danger-dt);
    // la santé remonte après un moment sans blessure ; le cœur cogne quand elle est basse
    if(P.vie<DIFF.vie&&T-dernierCoup>DIFF.regenDelai)P.vie=Math.min(DIFF.vie,P.vie+DIFF.regen*dt);
    if(P.vie<35){coeurT-=dt;if(coeurT<=0){coeurT=.5+P.vie/50;coeur(1-P.vie/70)}}
    majVie();
    // le coup secoue la vue
    if(secousse>0){secousse=Math.max(0,secousse-dt*2.5);camera.rotation.z+=(Math.random()-.5)*secousse*.06;camera.position.y+=(Math.random()-.5)*secousse*.04}
  }
  G.choc=Math.max(0,G.choc-dt*1.6);sang=Math.max(0,sang-dt*2.2);
  const bas=clamp(1-P.vie/DIFF.vie,0,1),o=Math.min(1,Math.pow(bas,1.8)*.8+sang*.5);
  if(Math.abs(o-sangAff)>.004){sangAff=o;$('sang').style.opacity=o.toFixed(3)}
}

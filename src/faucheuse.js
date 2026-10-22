// La Faucheuse : l'appareil de combat d'Helix. Elle tourne au-dessus de la zone et balaie le sol avec son projecteur.
// Rester dans le cercle de lumière à découvert (pas sous un auvent, une citerne, un abri) : son projecteur s'accroche à toi
// et sa mitrailleuse tire par rafales (combat.js) tant que tu restes dans la lumière.
// Elle peut tomber : ses deux réacteurs, sous les anneaux, sont ses points faibles. Dix balles de P-9 (la Coupure, à
// portée, en vaut trois et l'aveugle quelques secondes) : elle fume, part en vrille et s'écrase en flammes. Abattue pour
// toute la partie (S.faucheuses). Celle du toit de la tour a des réacteurs carénés (blindee) : rien ne l'arrête.
// La fumée, les flammes et le feu de l'épave existent dès la construction (cachés) : rien à compiler quand elle tombe.
import {THREE,V3,P,G,T,DIFF,clamp,emit,on} from './core.js';
import {add,glow,shaftMat,M,flamme,Particles} from './construire.js';
import {zone} from './zones.js';

const metal0=new THREE.MeshStandardMaterial({color:0x15181e,roughness:.35,metalness:.85,envMapIntensity:1.2});
const metal20=new THREE.MeshStandardMaterial({color:0x2a2f37,roughness:.5,metalness:.7,envMapIntensity:1});
// Les Faucheuses qu'on peut abattre (« lieu:rang »), pour le pourcentage de la partie.
export const ABATTABLES=['rue:0','toits:0','quais:0'];
export const PV=10;
export function couvert(z,p){for(const c of z.couverts)if(p.x>c.x0&&p.x<c.x1&&p.z>c.z0&&p.z<c.z1)return true;return false}
// o : {cx,cz,rx,rz,h,v (vitesse angulaire),R (rayon du cercle de détection)}
export function makeFaucheuse(z,o){
  const g=new THREE.Group();add(g);
  const metal=metal0.clone(),metal2=metal20.clone(),lueurs=[],L=m=>{lueurs.push({m,c:m.material.color.clone()});return m};
  const B=(w,h,d,m,x,y,zz)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,zz);g.add(b);return b};
  const corps=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),metal);corps.scale.set(1.05,.7,3.4);g.add(corps);
  B(1.3,.5,2.6,metal2,0,-.55,.4);B(.5,.4,3.2,metal,0,.15,-3.6);B(.08,1.1,1.1,metal,0,.8,-4.6);
  const vitre=L(new THREE.Mesh(new THREE.SphereGeometry(.62,18,12,0,Math.PI*2,0,Math.PI*.42),glow(0x58e6ff,.9)));vitre.scale.set(1.1,.6,1.8);vitre.position.set(0,.35,2.1);g.add(vitre);
  const rotors=[],reacteurs=[];
  for(const sx of[-1,1]){
    B(1.6,.18,.6,metal,sx*1.5,0,.2);
    const anneau=new THREE.Mesh(new THREE.TorusGeometry(1.05,.16,10,32),metal2);anneau.rotation.x=Math.PI/2;anneau.position.set(sx*2.75,0,.2);g.add(anneau);
    const pale=new THREE.Mesh(new THREE.BoxGeometry(1.9,.04,.22),metal);pale.position.set(sx*2.75,0,.2);g.add(pale);rotors.push(pale);
    const reac=L(new THREE.Mesh(new THREE.CircleGeometry(.95,24),glow(0xff7a2a,.7)));reac.rotation.x=Math.PI/2;reac.position.set(sx*2.75,-.12,.2);g.add(reac);reacteurs.push(reac);
    const nav=L(new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),glow(sx<0?0xff2020:0x20ff60,3)));nav.position.set(sx*3.85,0,.2);g.add(nav);
  }
  const bal=L(new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),glow(0xff2020,3)));bal.position.set(0,.95,-4.6);g.add(bal);
  // Feux de position le long de la coque, et l'œil du projecteur sous le ventre : on la voit arriver dans le noir.
  for(const sx of[-1,1]){const b=L(new THREE.Mesh(new THREE.BoxGeometry(.05,.05,4.2),glow(0x9fd8ff,2.2)));b.position.set(sx*1.02,-.05,-.2);g.add(b)}
  const oeil=L(new THREE.Mesh(new THREE.SphereGeometry(.28,16,10),glow(0xeaf4ff,4)));oeil.position.set(0,-.72,.6);g.add(oeil);
  // Projecteur : vraie lumière et faisceau visible
  const light=new THREE.SpotLight(0xd8e8ff,o.lum??7,90,o.angle??.15,.35,1.2);g.add(light);add(light.target);
  const cone=new THREE.Mesh(new THREE.CylinderGeometry(.35,1,1,28,1,true),shaftMat(0xcfe2ff,.3));cone.geometry.translate(0,-.5,0);cone.material.uniforms.opacity.value=.3;add(cone);
  // L'épave : fumée (un réacteur touché fume déjà), deux flammes et le feu (le projecteur, rougi), cachés jusque-là.
  const fo=new V3(),fumee=new Particles(70,{color:0x2b2725,k:1,rate:0,fadeIn:4,drag:.4,spawn:q=>{q.x=fo.x+(Math.random()-.5)*.8;q.y=fo.y;q.z=fo.z+(Math.random()-.5)*.8;
    q.vx=(Math.random()-.5)*.5+.35;q.vy=1.1+Math.random()*.9;q.vz=(Math.random()-.5)*.5;q.max=3.5+Math.random()*2.5;q.s0=.9;q.s1=4.5+Math.random()*2.5;q.a=.32}});
  const feux=[flamme(0,-60,0,2.6,3.4),flamme(0,-60,0,1.5,2.2)];for(const x of feux)x.visible=false;
  const tous=z.toutesFaucheuses||(z.toutesFaucheuses=[]);
  const f={g,light,cone,rotors,bal,cx:o.cx,cz:o.cz,rx:o.rx,rz:o.rz,h:o.h,hCur:o.h,v:o.v??.09,R:o.R??3.4,t:o.t0??0,cible:new V3(o.cx,0,o.cz),s:0,verrou:0,actif:true,
    zone:z,num:tous.length,lum:o.lum??7,angle:o.angle??.15,blindee:!!o.blindee,pv:PV,aveugle:0,abattue:false,chute:null,metal,metal2,lueurs,reacteurs,fo,fumee,feux};
  tous.push(f);z.faucheuses.push(f);poser(f,0);return f;
}
const cle=f=>f.zone.id+':'+f.num;
const _p=new V3(),_d=new V3(),_up=new V3(0,1,0);
function poser(f,dt){
  const a=f.t,x=f.cx+Math.cos(a)*f.rx,zz=f.cz+Math.sin(a)*f.rz;
  f.g.position.set(x,f.hCur+Math.sin(T*.7)*.4,zz);
  const tx=-Math.sin(a)*f.rx,tz=Math.cos(a)*f.rz;f.g.rotation.set(0,Math.atan2(tx,tz),Math.sin(T*.5)*.05-.08);
  // Le projecteur balaie autour de la verticale, ou s'accroche au joueur repéré.
  const bx=x+Math.sin(T*.61)*7,bz=zz+Math.cos(T*.47)*7;
  if(f.verrou>0)f.cible.lerp(_p.set(P.pos.x,0,P.pos.z),Math.min(1,dt*3));else f.cible.lerp(_p.set(bx,0,bz),Math.min(1,dt*1.5));
  f.light.position.set(0,-.7,.6);f.light.target.position.copy(f.cible);
  const src=f.g.localToWorld(_d.set(0,-.7,.6)),dir=_p.copy(f.cible).sub(src),L=dir.length();
  f.cone.position.copy(src);f.cone.scale.set(f.R*1.0,L,f.R*1.0);f.cone.quaternion.setFromUnitVectors(_up,dir.normalize().negate());
  f.cone.scale.x=f.cone.scale.z=Math.max(.6,Math.tan(f.light.angle)*L*.95);
}
export function resetFaucheuses(z){for(const f of z.faucheuses){f.s=0;f.verrou=0;f.combat=false;f.balles=0;f.aveugle=0}}
on('apresCapture',()=>{const z=zone();if(z&&z.faucheuses)resetFaucheuses(z)});

/* ---------- La faire tomber ---------- */
let avertie=false;
// Une balle de P-9 : dans un réacteur, elle compte ; sur la coque, elle ricoche. Dans les deux cas, elle cherche le tireur.
export function toucheFaucheuse(f,reacteur,p){
  if(f.abattue)return;
  if(f.blindee||!reacteur){emit('faucheuseRicoche',f,p);
    if(!avertie||f.blindee){avertie=true;emit('toast',f.blindee?"Ses réacteurs sont carénés : le P-9 n'y fera rien.":'Le blindage encaisse. Vise les réacteurs, sous les anneaux.')}
    riposte(f);return}
  degats(f,1,p);riposte(f);
}
// La Coupure : un court-circuit qui vaut trois balles et aveugle son projecteur quelques secondes.
export function coupureFaucheuse(f,p){
  if(f.abattue)return;if(f.blindee){emit('toast',"Son armure ne répond pas : celle-là n'est pas une K7.");return}
  f.aveugle=6;f.s=0;f.verrou=0;f.combat=false;f.balles=0;degats(f,3,p);
}
function degats(f,n,p){
  const avant=f.pv;f.pv=Math.max(0,f.pv-n);emit('faucheuseTouchee',f,p);
  if(avant>PV/2&&f.pv<=PV/2&&f.pv>0)emit('toast','Un réacteur fume. Elle tient encore.');
  if(f.pv<=0)abattre(f);
}
// Le projecteur cherche le tireur ; s'il est à découvert, elle le trouve vite.
function riposte(f){if(f.aveugle>0)return;f.verrou=Math.max(f.verrou,2.5);if(!couvert(f.zone,P.pos))f.s=Math.max(f.s,.75)}
// instant : déjà au sol (reprise d'une sauvegarde).
export function abattre(f,instant){
  if(f.abattue)return;f.abattue=true;f.actif=false;f.combat=false;f.balles=0;f.s=0;f.verrou=0;f.cone.visible=false;f.light.intensity=0;
  if(instant){epave(f);return}
  const a=f.t,vit=2.2;f.chute={t:0,vy:0,vx:-Math.sin(a)*vit,vz:Math.cos(a)*vit};emit('faucheuseTombe',f);
}
const _w=new V3();
function epave(f){
  f.chute=null;const g=f.g;g.position.y=.95;g.rotation.set(.22,g.rotation.y,.5);
  f.metal.color.setHex(0x0a0a0b);f.metal2.color.setHex(0x101011);for(const l of f.lueurs)l.m.material.color.setHex(0x050505);f.bal.visible=false;
  const x=g.position.x,z=g.position.z;f.feux[0].position.set(x,0,z);f.feux[1].position.set(x+1.4,.3,z-.8);for(const e of f.feux)e.visible=true;
  f.fo.set(x,1.3,z);f.fumee.o.rate=7;
  // le feu de l'épave : le projecteur, rougi, au-dessus, tourné vers le sol
  f.light.color.setHex(0xff6a20);f.light.angle=1.2;f.light.distance=16;f.light.target.position.set(x,0,z);f.feuX=x;f.feuZ=z;
}
// Une partie neuve : elle revole.
export function reparer(f){
  if(!f.abattue)return;Object.assign(f,{abattue:false,actif:true,chute:null,pv:PV,aveugle:0,s:0,verrou:0});
  f.metal.color.copy(metal0.color);f.metal2.color.copy(metal20.color);for(const l of f.lueurs)l.m.material.color.copy(l.c);f.bal.visible=true;
  for(const e of f.feux)e.visible=false;f.fumee.o.rate=0;f.cone.visible=f.g.visible;
  f.light.color.setHex(0xd8e8ff);f.light.angle=f.angle;f.light.distance=90;f.light.intensity=f.lum;const a=f.light.userData.ancre;(a||f.light).position.set(0,-.7,.6);
}
// Remet chaque Faucheuse du lieu dans l'état de la partie (abattue ou en vol).
export function appliquerFaucheuses(z,S){
  for(const f of z.toutesFaucheuses||[]){const k=cle(f);if((S.faucheuses||[]).includes(k)){if(!f.abattue)abattre(f,true)}else reparer(f)}
}
export const cleFaucheuse=cle;
// Renvoie le niveau de détection (0..1).
export function updateFaucheuses(dt,active,z){
  let maxS=0;
  for(const f of z.faucheuses){
    // abattue : elle tombe en vrille, puis l'épave brûle
    if(f.chute){const c=f.chute,g=f.g;c.t+=dt;c.vy-=7.5*dt;g.position.x+=c.vx*dt;g.position.z+=c.vz*dt;g.position.y+=c.vy*dt;
      g.rotation.y+=dt*(1.5+c.t*2.2);g.rotation.z=Math.min(.8,c.t*.35);for(const r of f.rotors)r.rotation.y+=dt*8;
      f.fo.set(g.position.x,g.position.y,g.position.z);f.fumee.o.rate=26;
      if(g.position.y<=.95){epave(f);emit('faucheuseAbattue',f)}continue}
    if(f.abattue){f.fo.y=1.3;(f.light.userData.ancre||f.light).position.copy(f.g.worldToLocal(_w.set(f.feuX,3.2,f.feuZ)));
      f.light.intensity=3.2+Math.sin(T*11)*.7+Math.sin(T*23.7)*.4;continue}
    // un réacteur touché fume
    if(f.pv<=PV/2){f.reacteurs[0].getWorldPosition(f.fo);f.fumee.o.rate=10}
    f.t+=dt*f.v;for(const r of f.rotors)r.rotation.y+=dt*30;f.bal.visible=Math.sin(T*4)>0;
    poser(f,dt);
    // aveuglée par la Coupure : projecteur éteint quelques secondes
    if(f.aveugle>0){f.aveugle-=dt;f.light.intensity=f.aveugle>0?0:f.lum;f.cone.visible=f.aveugle<=0&&f.g.visible;f.s=Math.max(0,f.s-dt);continue}
    if(active&&f.actif){
      const dans=Math.hypot(P.pos.x-f.cible.x,P.pos.z-f.cible.z)<f.R&&!couvert(z,P.pos)&&G.grace<=0,D=DIFF.faucheuse;
      if(dans){f.s+=dt*1.6;f.verrou=1.2}else{f.s=Math.max(0,f.s-dt*.35);f.verrou=Math.max(0,f.verrou-dt)}
      if(f.s>=1){f.s=1;if(!f.combat){f.combat=true;f.tir=D.reaction;f.balles=0;emit('engagement',f)}}
      // une rafale tant que tu restes dans la lumière ; à couvert, elle te perd au bout d'un moment
      if(f.combat){if(dans){f.tir-=dt;if(f.tir<=0&&!(f.balles>0)){f.tir=D.cadence;f.balles=D.balles;f.entre=0}}else if(f.verrou<=0)f.combat=false}
      if(f.balles>0){f.entre-=dt;if(f.entre<=0){f.balles--;f.entre=D.entre;emit('tirFaucheuse',f,dans)}}
    }
    f.light.color.setHex(f.s>.3?0xff6050:0xd8e8ff);
    maxS=Math.max(maxS,f.s);
  }
  return maxS;
}

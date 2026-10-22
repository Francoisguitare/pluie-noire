// Drones de patrouille : vol entre deux points, cône de détection, chute quand on vise le capteur.
// Quand un drone t'a repéré, il te suit en gardant ses distances et tire des fléchettes de taser (combat.js) ;
// il abandonne s'il te perd de vue quelques secondes.
import {THREE,V3,rnd,clamp,lerpAng,T,G,P,DIFF,emit} from './core.js';
import {M,glow,shaftMat,Particles,steam,add,into} from './construire.js';
import {los} from './physique.js';
import {droneHitSound,crashSound} from './son.js';

const C_IDLE=new THREE.Color(0x8fe9ff),C_WARN=new THREE.Color(0xffb02e),C_ALERT=new THREE.Color(0xff3030);
// Construit un drone dans la zone en cours de construction (z).
export function makeDrone(z,pts,yaw,o={}){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.SphereGeometry(.32,24,16),M.darkMetal);body.scale.set(1,.55,1.18);body.castShadow=true;g.add(body);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.33,.025,8,32),M.metal);band.rotation.x=Math.PI/2;g.add(band);
  const eyeMat=new THREE.MeshBasicMaterial({color:0x8fe9ff,toneMapped:false});const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,12,10),eyeMat);eye.position.set(0,-.03,.36);g.add(eye);
  const rotors=[];
  for(const[x,zz]of[[.44,.44],[-.44,.44],[.44,-.44],[-.44,-.44]]){
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.04,.03,.5),M.metal);arm.position.set(x/2,.04,zz/2);arm.rotation.y=Math.atan2(x,zz);g.add(arm);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.018,8,24),M.metal);ring.rotation.x=Math.PI/2;ring.position.set(x,.07,zz);g.add(ring);
    const blade=new THREE.Mesh(new THREE.BoxGeometry(.3,.008,.04),M.metal);blade.position.set(x,.08,zz);g.add(blade);rotors.push(blade);
    const nav=new THREE.Mesh(new THREE.SphereGeometry(.025,6,6),glow(x>0?0x30ff60:0xff3030,3));nav.position.set(x*1.2,.07,zz*1.2);g.add(nav);
  }
  const L=8,geo=new THREE.CylinderGeometry(.05,Math.tan(.55)*L,L,32,1,true);geo.translate(0,-L/2,0);geo.rotateX(-Math.PI/2);
  const coneMat=shaftMat(0x8fe9ff,.35);
  const cone=new THREE.Mesh(geo,coneMat);cone.rotation.x=.4;g.add(cone);
  const light=new THREE.PointLight(0x8fe9ff,1.6,9,1.6);light.position.set(0,-.4,.4);g.add(light);
  g.userData.drone=true;add(g);
  const d={g,pts,i:1,dir:1,wait:0,waitMax:1.9,yaw,baseYaw:yaw,s:0,speed:o.speed||2.1,range:10,fov:.55,eyeMat,coneMat,cone,light,rotors,ph:rnd()*6,passive:!!o.passive,tut:!!o.tut,h:o.h||3.3,dead:false,fall:null,idx:z.drones.length,zone:z};
  if(d.passive){cone.visible=false;light.intensity=.7}
  z.drones.push(d);return d;
}
const sparkO=new V3();
let sparks=null;
// Gerbe d'étincelles commune à toutes les zones (créée au démarrage pour éviter une compilation de shader en jeu).
export function initSparks(){sparks=new Particles(160,{color:0xffb050,k:3.2,additive:true,rate:0,grav:9,spawn:q=>{q.x=sparkO.x;q.y=sparkO.y;q.z=sparkO.z;const a=rnd()*6.28,v=1+rnd()*4.5;q.vx=Math.cos(a)*v;q.vz=Math.sin(a)*v;q.vy=rnd()*4;q.max=.3+rnd()*.6;q.s0=.08;q.s1=.01;q.a=1}})}
export function burst(p,n){sparkO.copy(p);sparks.acc+=n}
export function reviveDrone(d){d.dead=false;d.fall=null;d.combat=false;d.g.rotation.set(0,d.yaw,0);d.cone.visible=!d.passive;d.light.intensity=d.passive?.7:1.6;if(d.smoke){d.smoke.o.rate=0;d.smoke.pts.visible=false;d.smoke=null}}
const smoke=d=>{into(d.zone);d.smoke=steam(d.g.position.x,.3,d.g.position.z,0x2c2826,{n:24,rate:4,a:.28,s1:2.2,up:.7,life:3});into(null)};
// instant : drone déjà à terre au chargement d'une sauvegarde (pas de chute, pas d'annonce).
export function killDrone(d,instant){
  if(d.dead)return;d.dead=true;d.s=0;d.combat=false;d.light.intensity=0;d.eyeMat.color.setHex(0x111111);d.cone.visible=false;
  if(instant){d.g.position.y=.26;d.g.rotation.set(.5,d.yaw,.9);smoke(d);emit('droneKilled',d,true);return}
  d.fall={vy:1.2,rx:(rnd()-.5)*9,rz:(rnd()-.5)*9};burst(d.g.position,60);droneHitSound();
  emit('droneKilled',d,false);
}
function updateWreck(d,dt){
  const g=d.g;
  if(d.fall){d.fall.vy-=13*dt;g.position.y+=d.fall.vy*dt;g.rotation.x+=d.fall.rx*dt;g.rotation.z+=d.fall.rz*dt;
    if(g.position.y<=.26){g.position.y=.26;d.fall=null;crashSound();burst(g.position,30);smoke(d)}}
  else if(rnd()<dt*.8)burst(g.position,4);
}
export function resetDrones(z){for(const d of z.drones){if(d.dead)continue;d.g.position.set(d.pts[0][0],d.h,d.pts[0][1]);d.i=1;d.dir=1;d.wait=0;d.s=0;d.combat=false;d.yaw=Math.atan2(d.pts[1][0]-d.pts[0][0],d.pts[1][1]-d.pts[0][1])}}
const tmpC=new THREE.Color();
// Renvoie le niveau de détection le plus haut (0..1). opts.boost : alerte silencieuse, opts.showTut : drone d'entraînement visible.
export function updateDrones(dt,active,z,opts={}){
  let maxS=0;
  for(const d of z.drones){
    if(d.tut){d.g.visible=!!opts.showTut;if(!opts.showTut)continue}
    if(d.dead){updateWreck(d,dt);continue}
    const g=d.g,dx=P.pos.x-g.position.x,dz=P.pos.z-g.position.z,dist=Math.hypot(dx,dz);
    if(active){
      const fx=Math.sin(d.yaw),fz=Math.cos(d.yaw);
      const boost=!!opts.boost,range=d.range*(P.crouch>.5?.55:1)*(boost?1.2:1)*(d.combat?1.35:1),fov=d.combat?1.1:d.fov*(boost?1.15:1);
      let sees=false;
      if(!d.passive&&G.grace<=0&&dist<range){const ang=Math.acos(clamp((dx*fx+dz*fz)/(dist||1),-1,1));if(ang<fov&&los(g.position.x,g.position.z,P.pos.x,P.pos.z))sees=true}
      if(sees)d.s+=dt*(.5+1.5*(1-dist/range));else d.s=Math.max(0,d.s-dt*(d.combat?.15:.35));
      if(d.s>=1&&!d.combat){d.combat=true;d.perdu=0;d.tir=DIFF.drone.reaction;emit('engagement',d)}
      if(d.combat){
        // il te suit, à 6 ou 7 m, et tire ; il abandonne s'il te perd de vue plus de 3,5 s
        if(sees){d.s=1;d.perdu=0}else if((d.perdu+=dt)>3.5)d.combat=false;
        d.yaw=lerpAng(d.yaw,Math.atan2(dx,dz),dt*4);
        if(sees&&dist>7){const st=Math.min(dist-7,d.speed*1.4*dt);g.position.x+=dx/dist*st;g.position.z+=dz/dist*st}
        d.tir-=dt;if(sees&&d.tir<=0){d.tir=DIFF.drone.cadence+rnd()*.35;emit('tirDrone',d)}
      }
      else if(d.s>.2){d.yaw=lerpAng(d.yaw,Math.atan2(dx,dz),dt*3)}
      else if(d.wait>0){d.wait-=dt;d.yaw=d.baseYaw+Math.sin((d.waitMax-d.wait)*1.7)*1.05}
      else{const t=d.pts[d.i],mx=t[0]-g.position.x,mz=t[1]-g.position.z,md=Math.hypot(mx,mz),sp=d.speed*(boost?1.4:1);
        if(md<.15){d.wait=d.waitMax*(boost?.7:1);d.baseYaw=d.yaw;d.i+=d.dir;if(d.i>=d.pts.length||d.i<0){d.dir*=-1;d.i+=2*d.dir}}
        else{d.yaw=lerpAng(d.yaw,Math.atan2(mx,mz),dt*4);const st=Math.min(md,sp*dt);g.position.x+=mx/md*st;g.position.z+=mz/md*st}}
    }
    g.rotation.y=d.yaw;g.position.y=d.h+Math.sin(T*2+d.ph)*.08;g.rotation.z=Math.sin(T*1.3+d.ph)*.04;
    for(const r of d.rotors)r.rotation.y+=dt*40;
    if(d.s<.05)tmpC.copy(C_IDLE);else if(d.s<.6)tmpC.copy(C_IDLE).lerp(C_WARN,clamp(d.s/.5,0,1));else tmpC.copy(C_WARN).lerp(C_ALERT,(d.s-.6)/.4);
    if(d.passive)tmpC.setHex(0xffa030);
    d.eyeMat.color.copy(tmpC).multiplyScalar(3);d.coneMat.uniforms.color.value.copy(tmpC);d.light.color.copy(tmpC);d.coneMat.uniforms.opacity.value=.35+d.s*.5;
    maxS=Math.max(maxS,d.s);
  }
  return maxS;
}

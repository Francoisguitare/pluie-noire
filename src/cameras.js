// Caméras de surveillance d'Helix (chapitre 5) : fixées à un mât ou à un mur, elles balaient un angle et voient comme
// un Gardien (cône, portée réduite dans le noir ou accroupi, ligne de vue), sans rien entendre. Une balle de P-9 dans
// l'objectif les éteint pour de bon. Quand elles repèrent quelqu'un, elles s'arrêtent de balayer, le suivent et sonnent
// l'alarme : les Gardiens du coin accourent (combat.js).
import {THREE,V3,P,G,T,clamp,lerpAng,emit,on} from './core.js';
import {add,glow,shaftMat,M} from './construire.js';
import {los} from './physique.js';
import {zone} from './zones.js';
import {eclaire} from './gardiens.js';
import {burst} from './drones.js';
import {droneHitSound} from './son.js';

const C_IDLE=new THREE.Color(0xff8a70),C_ALERT=new THREE.Color(0xff2a20),tmp=new THREE.Color();
// o : x, y (hauteur), z, yaw (direction moyenne ; 0 regarde vers +z), amp (demi-angle de balayage), vitesse, portee, fov
export function makeCamera(z,o){
  const g=new THREE.Group();g.position.set(o.x,o.y??3.4,o.z);add(g);
  const bras=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.32),M.darkMetal);bras.position.set(0,.12,-.16);g.add(bras);
  const pivot=new THREE.Group();g.add(pivot);
  const corps=new THREE.Mesh(new THREE.BoxGeometry(.2,.17,.44),new THREE.MeshStandardMaterial({color:0xd8dade,roughness:.35,metalness:.4,envMapIntensity:1}));corps.position.z=.1;pivot.add(corps);
  const casq=new THREE.Mesh(new THREE.BoxGeometry(.24,.03,.5),M.darkMetal);casq.position.set(0,.1,.12);pivot.add(casq);
  const lensMat=glow(0xff8a70,2.2),lens=new THREE.Mesh(new THREE.CircleGeometry(.055,14),lensMat);lens.position.z=.325;pivot.add(lens);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.022,6,6),glow(0xff2020,3));led.position.set(.07,.06,.3);pivot.add(led);
  const L=o.portee??11,fov=o.fov??.4,geo=new THREE.CylinderGeometry(.04,Math.tan(fov)*L,L,24,1,true);geo.translate(0,-L/2,0);geo.rotateX(-Math.PI/2);
  const coneMat=shaftMat(0xff8a70,.14),cone=new THREE.Mesh(geo,coneMat);cone.position.z=.33;pivot.add(cone);
  pivot.rotation.x=o.inclinaison??.38;
  const c={g,pivot,lensMat,led,cone,coneMat,x:o.x,y:o.y??3.4,z:o.z,base:o.yaw??0,yaw:o.yaw??0,amp:o.amp??.7,vitesse:o.vitesse??.35,ph:o.ph??0,portee:L,fov,s:0,mort:false,zone:z,idx:z.cameras.length};
  g.rotation.y=c.yaw;z.cameras.push(c);return c;
}
export function detruireCamera(c,instant){
  if(c.mort)return;c.mort=true;c.s=0;c.cone.visible=false;c.lensMat.color.setHex(0x111111);c.led.visible=false;c.pivot.rotation.x=1.1;c.pivot.rotation.z=.4;
  if(!instant){burst(new V3(c.x,c.y,c.z),45);droneHitSound()}
  emit('cameraDetruite',c,!!instant);
}
export function reparerCamera(c){c.mort=false;c.cone.visible=true;c.led.visible=true;c.pivot.rotation.set(.38,0,0);c.yaw=c.base;c.g.rotation.y=c.yaw}
export function resetCameras(z){for(const c of z.cameras){c.s=0;c.alarme=false}}
on('apresCapture',()=>{const z=zone();if(z&&z.cameras)resetCameras(z)});
// Renvoie le niveau de détection le plus haut (0..1).
export function updateCameras(dt,active,z){
  let maxS=0;
  for(const c of z.cameras){
    if(c.mort){c.led.visible=false;continue}
    const dx=P.pos.x-c.x,dz=P.pos.z-c.z,dist=Math.hypot(dx,dz);
    let voit=false;
    if(active&&G.grace<=0){
      const portee=c.portee*(eclaire(z,P.pos)?1:.62)*(P.crouch>.5?.8:1);
      if(dist<portee){const ang=Math.acos(clamp((dx*Math.sin(c.yaw)+dz*Math.cos(c.yaw))/(dist||1),-1,1));if(ang<c.fov&&los(c.x,c.z,P.pos.x,P.pos.z))voit=true}
    }
    if(voit){c.s+=dt*(.45+1.4*(1-dist/c.portee));c.yaw=lerpAng(c.yaw,Math.atan2(dx,dz),dt*2.5)}
    else{c.s=Math.max(0,c.s-dt*.3);if(c.s<.2)c.yaw=lerpAng(c.yaw,c.base+Math.sin(T*c.vitesse+c.ph)*c.amp,dt*1.5)}
    if(active&&c.s>=1){c.s=1;if(!c.alarme){c.alarme=true;emit('alarmeCamera',c)}}
    if(c.alarme&&c.s<.3)c.alarme=false;
    c.g.rotation.y=c.yaw;c.led.visible=c.s>.1?Math.sin(T*14)>0:Math.sin(T*2+c.idx)>.6;
    tmp.copy(C_IDLE).lerp(C_ALERT,clamp(c.s*1.4,0,1));c.coneMat.uniforms.color.value.copy(tmp);c.coneMat.uniforms.opacity.value=.14+c.s*.3;c.lensMat.color.copy(tmp).multiplyScalar(2.2);
    maxS=Math.max(maxS,c.s);
  }
  return maxS;
}

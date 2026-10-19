// Gardiens d'Helix : rondes à pied, lampe-torche. Ils voient (cône, ligne de vue, moins loin dans le noir ou si l'on est accroupi),
// ils entendent (courir s'entend de loin, marcher de près, accroupi pas du tout), vont voir, fouillent, puis reprennent leur ronde.
// Le blindage arrête les balles du P-9 : on les évite, on ne les combat pas.
import {THREE,V3,P,G,T,clamp,lerpAng,emit,on} from './core.js';
import {los} from './physique.js';
import {add,glow,shaftMat} from './construire.js';
import {MODELES,prepClip,findBone,attachTo,figure} from './personnages.js';
import {zone} from './zones.js';

const C_IDLE=new THREE.Color(0xdfe8ff),C_WARN=new THREE.Color(0xffb02e),C_ALERT=new THREE.Color(0xff3030);
const tmpC=new THREE.Color();
// La zone dit si un point est éclairé (lampes allumées) : dans le noir, on est vu de moins loin.
export function eclaire(z,p){if(!z.lumieres||!z.lumieres.length)return true;for(const l of z.lumieres)if(l.on&&(p.x-l.x)**2+(p.z-l.z)**2<l.r*l.r)return true;return false}

// path : points de ronde [[x,z],…]. o.boucle : la ronde tourne en rond au lieu d'aller-retour. o.attente : pause aux points.
export function makeGardien(z,path,o={}){
  const g=new THREE.Group();add(g);
  const d={g,path,i:1,dir:1,wait:0,etat:'ronde',pos:new V3(path[0][0],0,path[0][1]),yaw:o.yaw??0,s:0,cible:new V3(),fouille:0,zone:z,boucle:!!o.boucle,attente:o.attente??2.2,
    vue:o.vue||12,fov:.62,model:null,mixer:null,acts:null,anim:'',idx:z.gardiens.length,depart:{p:path[0],yaw:o.yaw??0}};
  // Lampe-torche : lumière réelle + faisceau visible
  const light=new THREE.SpotLight(0xdfe8ff,2.4,15,.45,.55,1.6);light.position.set(.22,1.4,.25);light.target.position.set(.3,0,5);g.add(light,light.target);
  const L=7,geo=new THREE.CylinderGeometry(.04,Math.tan(.42)*L,L,24,1,true);geo.translate(0,-L/2,0);geo.rotateX(-Math.PI/2);
  const coneMat=shaftMat(0xdfe8ff,.22);const cone=new THREE.Mesh(geo,coneMat);cone.position.set(.22,1.4,.25);cone.rotation.x=.2;g.add(cone);
  const torch=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.22,10),new THREE.MeshStandardMaterial({color:0x1b1d22,metalness:.8,roughness:.4}));torch.rotation.x=Math.PI/2;torch.position.set(.22,1.38,.18);g.add(torch);
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.03,12),glow(0xffffff,3));lens.position.set(.22,1.38,.295);g.add(lens);
  Object.assign(d,{light,cone,coneMat,lensMat:lens.material});
  habiller(d);
  z.gardiens.push(d);placer(d);return d;
}
// Habille le gardien avec le modèle « soldier » (armure sombre, casque à visière rouge), ou une silhouette de secours.
function habiller(d){
  const M=MODELES.soldier;
  if(!M){const f=figure({coat:0x1d2128,skin:0x30343c,hood:true,belt:0xff3030});d.g.add(f);d.model=f;return}
  const m=THREE.SkeletonUtils.clone(M.scene);
  m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.material=o.material.clone();o.material.color.multiply(new THREE.Color(0x4a525e));o.material.envMapIntensity=1.1}});
  m.scale.setScalar(M.echelle);m.position.y=M.decalage;m.rotation.y=Math.PI;d.g.add(m);d.model=m;
  const head=findBone(m,['mixamorigHead']);
  if(head){const cas=new THREE.Mesh(new THREE.SphereGeometry(.15,18,12,0,Math.PI*2,0,Math.PI*.6),new THREE.MeshStandardMaterial({color:0x15171c,roughness:.35,metalness:.7,envMapIntensity:1.3}));attachTo(head,cas,0,.1,0);
    const vis=new THREE.Mesh(new THREE.BoxGeometry(.2,.035,.05),glow(0xff2a2a,2.6));attachTo(head,vis,0,.09,.11)}
  d.mixer=new THREE.AnimationMixer(m);d.acts={};
  for(const n of['Idle','Walk','Run']){const c=M.animations.find(a=>a.name===n);if(c){const a=d.mixer.clipAction(prepClip(c,false));a.play();a.setEffectiveWeight(n==='Idle'?1:0);d.acts[n]=a}}
  d.anim='Idle';
}
function anim(d,n){if(!d.acts||d.anim===n||!d.acts[n])return;for(const k in d.acts)d.acts[k].setEffectiveWeight(k===n?1:0);d.acts[n].time=0;d.anim=n}
function placer(d){d.g.position.copy(d.pos);d.g.rotation.y=d.yaw}
export function resetGardiens(z){for(const d of z.gardiens){d.pos.set(d.depart.p[0],0,d.depart.p[1]);d.yaw=d.depart.yaw;d.i=1;d.dir=1;d.wait=0;d.s=0;d.etat='ronde';placer(d)}}
on('apresCapture',()=>{const z=zone();if(z&&z.gardiens)resetGardiens(z)});

// Va vers (x,z) à la vitesse v ; renvoie true une fois arrivé.
function marcher(d,x,z,v,dt){
  const dx=x-d.pos.x,dz=z-d.pos.z,dd=Math.hypot(dx,dz);if(dd<.2)return true;
  d.yaw=lerpAng(d.yaw,Math.atan2(dx,dz),dt*5);const st=Math.min(dd,v*dt);d.pos.x+=dx/dd*st;d.pos.z+=dz/dd*st;return false;
}
// Renvoie le niveau de détection le plus haut de la zone (0..1).
export function updateGardiens(dt,active,z){
  let maxS=0;
  for(const d of z.gardiens){
    if(d.mixer)d.mixer.update(dt);
    if(active){
      const dx=P.pos.x-d.pos.x,dz=P.pos.z-d.pos.z,dist=Math.hypot(dx,dz);
      const fx=Math.sin(d.yaw),fz=Math.cos(d.yaw);
      const portee=d.vue*(eclaire(z,P.pos)?1:.55)*(P.crouch>.5?.75:1);
      let voit=false;
      if(G.grace<=0){
        const ang=Math.acos(clamp((dx*fx+dz*fz)/(dist||1),-1,1));
        if((dist<portee&&ang<d.fov||dist<1.3)&&los(d.pos.x,d.pos.z,P.pos.x,P.pos.z))voit=true;
        // Bruit de pas : courir s'entend à 9 m, marcher à 4 m, accroupi pas du tout
        if(!voit&&P.noise&&dist<P.noise*9&&d.etat!=='alerte'){d.cible.copy(P.pos);if(d.etat==='ronde'||d.etat==='retour'){d.etat='enquete';d.wait=.6}}
      }
      if(voit){d.s+=dt*(.55+1.8*(1-dist/Math.max(portee,1)));d.cible.copy(P.pos);if(d.s>.25&&d.etat!=='enquete'){d.etat='enquete';d.wait=.3}}
      else d.s=Math.max(0,d.s-dt*.22);
      if(d.s>=1){emit('caught');return 1}
      // Comportement
      if(d.wait>0){d.wait-=dt;anim(d,'Idle');if(d.etat==='ronde'||d.etat==='fouille')d.yaw+=Math.sin(T*1.3+d.idx)*dt*.9;else d.yaw=lerpAng(d.yaw,Math.atan2(d.cible.x-d.pos.x,d.cible.z-d.pos.z),dt*4)}
      else if(d.etat==='ronde'){
        const t=d.path[d.i];anim(d,'Walk');
        if(marcher(d,t[0],t[1],1.25,dt)){d.wait=d.attente;
          if(d.boucle)d.i=(d.i+1)%d.path.length;else{d.i+=d.dir;if(d.i>=d.path.length||d.i<0){d.dir*=-1;d.i+=2*d.dir}}}
      }
      else if(d.etat==='enquete'){anim(d,voit?'Walk':'Run');if(marcher(d,d.cible.x,d.cible.z,voit?1.1:2.6,dt)){d.etat='fouille';d.fouille=4.5;d.wait=0}}
      else if(d.etat==='fouille'){anim(d,'Idle');d.yaw+=Math.sin(T*1.7+d.idx)*dt*1.6;d.fouille-=dt;if(d.fouille<=0){d.etat='retour'}}
      else if(d.etat==='retour'){const t=d.path[d.i];anim(d,'Walk');if(marcher(d,t[0],t[1],1.25,dt))d.etat='ronde'}
      placer(d);
    }
    if(d.s<.05)tmpC.copy(C_IDLE);else if(d.s<.6)tmpC.copy(C_IDLE).lerp(C_WARN,clamp(d.s/.5,0,1));else tmpC.copy(C_WARN).lerp(C_ALERT,(d.s-.6)/.4);
    d.light.color.copy(tmpC);d.coneMat.uniforms.color.value.copy(tmpC);d.coneMat.uniforms.opacity.value=.2+d.s*.35;d.lensMat.color.copy(tmpC).multiplyScalar(3);
    maxS=Math.max(maxS,d.s);
  }
  return maxS;
}
// Un tir qui touche un gardien : la balle ricoche sur le blindage, et lui fonce voir d'où ça vient.
export function toucheGardien(d){d.cible.copy(P.pos);d.etat='enquete';d.wait=.2;d.s=Math.max(d.s,.55);emit('toast','Le blindage arrête la balle. Et maintenant, il sait où tu es.')}

// Gardiens d'Helix : rondes à pied, lampe-torche. Ils voient (cône, ligne de vue, moins loin dans le noir ou si l'on est accroupi ;
// accroupi derrière un obstacle bas, plus du tout), ils entendent (courir s'entend de loin, marcher de près, accroupi pas du tout),
// vont voir, fouillent, puis reprennent leur ronde. Quand ils t'ont vu pour de bon, ils lèvent leur canon d'épaule et tirent
// par rafales (combat.js), préviennent les autres, te poursuivent là où ils t'ont vu en dernier, puis fouillent, sur le qui-vive.
// Le blindage arrête les balles du P-9. Mais l'armure est une K7 comme les autres : la Coupure de la main d'Ash la verrouille,
// et le Gardien tombe raide (neutraliser). Il reste à terre, même après une capture ou une reprise de sauvegarde.
import {THREE,V3,P,G,T,DIFF,clamp,lerpAng,emit,on} from './core.js';
import {los,collide,couvertBas} from './physique.js';
import {add,glow,shaftMat,M} from './construire.js';
import {softDot} from './textures.js';
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
  // Canon d'épaule, à gauche : baissé pendant la ronde, il se lève sur Ash en combat. L'éclair du tir est un sprite caché.
  const canon=new THREE.Group();canon.position.set(-.21,1.47,.06);canon.rotation.x=.95;g.add(canon);
  const fut=new THREE.Mesh(new THREE.CylinderGeometry(.026,.03,.34,10),M.darkMetal);fut.rotation.x=Math.PI/2;fut.position.z=.14;canon.add(fut);
  canon.add(new THREE.Mesh(new THREE.BoxGeometry(.09,.08,.16),M.darkMetal));
  const voyant=new THREE.Mesh(new THREE.BoxGeometry(.022,.012,.022),glow(0x401010,1));voyant.position.set(0,.046,.03);canon.add(voyant);
  const eclair=new THREE.Sprite(new THREE.SpriteMaterial({map:softDot,color:new THREE.Color(0xffc070).multiplyScalar(2.2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  eclair.scale.setScalar(.5);eclair.position.z=.34;eclair.visible=false;canon.add(eclair);
  Object.assign(d,{canon,voyant:voyant.material,eclair,eclairT:0,alerte:0,balles:0,tir:0,vu:0,enq:0});
  habiller(d);d.g.rotation.order='YXZ';
  // num : rang du Gardien dans la zone, stable même quand l'histoire en retire ou en ajoute (sauvegarde des neutralisés)
  const tous=z.tousGardiens||(z.tousGardiens=[]);d.num=tous.length;tous.push(d);z.gardiens.push(d);placer(d);return d;
}
// Un Gardien immobile, pour les scènes (escorte de Saal) : même allure, lampe allumée, ne voit ni n'entend rien.
export function gardienImmobile(z,x,zz,yaw){
  const g=new THREE.Group();g.position.set(x,0,zz);g.rotation.y=yaw;add(g);const d={g};habiller(d);
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.03,12),glow(0xffffff,3));lens.position.set(.22,1.38,.295);g.add(lens);
  const L=5,geo=new THREE.CylinderGeometry(.04,Math.tan(.38)*L,L,20,1,true);geo.translate(0,-L/2,0);geo.rotateX(-Math.PI/2);const cone=new THREE.Mesh(geo,shaftMat(0xdfe8ff,.18));cone.position.set(.22,1.4,.25);cone.rotation.x=.35;g.add(cone);
  if(d.acts)for(const k in d.acts)d.acts[k].setEffectiveWeight(k==='Idle'?1:0);
  z.figurants.push(d);return d;
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
    const vis=new THREE.Mesh(new THREE.BoxGeometry(.2,.035,.05),glow(0xff2a2a,2.6));attachTo(head,vis,0,.09,.11);d.visMat=vis.material}
  d.mixer=new THREE.AnimationMixer(m);d.acts={};
  for(const n of['Idle','Walk','Run']){const c=M.animations.find(a=>a.name===n);if(c){const a=d.mixer.clipAction(prepClip(c,false));a.play();a.setEffectiveWeight(n==='Idle'?1:0);d.acts[n]=a}}
  d.anim='Idle';
}
function anim(d,n){if(!d.acts||d.anim===n||!d.acts[n])return;for(const k in d.acts)d.acts[k].setEffectiveWeight(k===n?1:0);d.acts[n].time=0;d.anim=n}
function placer(d){d.g.position.copy(d.pos);d.g.rotation.y=d.yaw}
export function remettre(d){d.pos.set(d.depart.p[0],0,d.depart.p[1]);d.yaw=d.depart.yaw;d.i=1;d.dir=1;d.wait=0;d.s=0;d.etat='ronde';d.alerte=0;d.balles=0;d.eclair.visible=false;d.canon.rotation.x=.95;placer(d)}
export function resetGardiens(z){for(const d of z.gardiens)if(!d.neutre)remettre(d)}
on('apresCapture',()=>{const z=zone();if(z&&z.gardiens)resetGardiens(z)});

// Va vers (x,z) à la vitesse v ; renvoie true une fois arrivé. col : contourne les obstacles (poursuite, enquête).
function marcher(d,x,z,v,dt,col){
  const dx=x-d.pos.x,dz=z-d.pos.z,dd=Math.hypot(dx,dz);if(dd<(col?.6:.2))return true;
  d.yaw=lerpAng(d.yaw,Math.atan2(dx,dz),dt*5);const st=Math.min(dd,v*dt);d.pos.x+=dx/dd*st;d.pos.z+=dz/dd*st;if(col)collide(d.pos,.35);return false;
}
// Repéré pour de bon : le canon se lève, les Gardiens proches sont prévenus.
function engager(d,z){d.etat='combat';d.vu=0;d.tir=DIFF.gardien.reaction;d.balles=0;d.alerte=25;emit('engagement',d);alerter(z,d.pos,22,d)}
// Les Gardiens à moins de r de p (et qui le voient, ou tout proches) accourent là où est Ash, sur le qui-vive.
export function alerter(z,p,r,sauf){
  for(const o of z.gardiens){if(o===sauf||o.neutre||o.etat==='combat'||!o.g.visible)continue;const dd=Math.hypot(o.pos.x-p.x,o.pos.z-p.z);
    if(dd<r&&(dd<12||los(o.pos.x,o.pos.z,p.x,p.z))){o.cible.copy(P.pos);if(o.etat!=='enquete'){o.etat='enquete';o.wait=.3+Math.random()*.5;o.enq=0}o.alerte=25}}
}
// En combat : face à Ash, il s'approche s'il est loin et tire par rafales ; s'il te perd de vue, il court là où il t'a vu.
function combattre(d,voit,dist,dt){
  const D=DIFF.gardien;
  if(voit){d.yaw=lerpAng(d.yaw,Math.atan2(P.pos.x-d.pos.x,P.pos.z-d.pos.z),dt*6);
    if(dist>10){anim(d,'Walk');marcher(d,P.pos.x,P.pos.z,1.5,dt,true);d.yaw=lerpAng(d.yaw,Math.atan2(P.pos.x-d.pos.x,P.pos.z-d.pos.z),dt*6)}else anim(d,'Idle');
    d.tir-=dt;if(d.tir<=0&&d.balles<=0){d.balles=D.rafale;d.entre=0;d.tir=D.cadence+Math.random()*.45}}
  else{d.tir=Math.max(d.tir,.5);
    if(d.vu>9||marcher(d,d.cible.x,d.cible.z,2.7,dt,true)){d.etat='fouille';d.fouille=7;d.wait=0;d.balles=0}else anim(d,'Run')}
  if(d.balles>0){d.entre-=dt;if(d.entre<=0){d.balles--;d.entre=D.entre;emit('tirGardien',d,voit)}}
}
// Renvoie le niveau de détection le plus haut de la zone (0..1).
export function updateGardiens(dt,active,z){
  let maxS=0;
  for(const d of z.gardiens){
    if(d.neutre){if(d.chute)tomber(d,dt);else if(d.mixer&&d.spasme>0){d.spasme-=dt;d.mixer.update(dt*.2)}continue}
    if(d.mixer)d.mixer.update(dt);
    if(d.eclairT>0){d.eclairT-=dt;if(d.eclairT<=0)d.eclair.visible=false}
    if(active){
      const dx=P.pos.x-d.pos.x,dz=P.pos.z-d.pos.z,dist=Math.hypot(dx,dz);
      const fx=Math.sin(d.yaw),fz=Math.cos(d.yaw),combat=d.etat==='combat',alerte=d.alerte>0;
      // en combat ou sur le qui-vive, ils voient plus loin et plus large
      const portee=d.vue*(eclaire(z,P.pos)?1:.55)*(P.crouch>.5?.75:1)*(combat?1.4:alerte?1.15:1),fov=combat?1.25:alerte?.85:d.fov;
      let voit=false;
      if(G.grace<=0){
        const ang=Math.acos(clamp((dx*fx+dz*fz)/(dist||1),-1,1));
        if((dist<portee&&ang<fov||dist<1.3)&&los(d.pos.x,d.pos.z,P.pos.x,P.pos.z)&&!(P.crouch>.5&&dist>3&&couvertBas(d.pos.x,d.pos.z,P.pos.x,P.pos.z)))voit=true;
        // Bruit de pas : courir s'entend à 9 m, marcher à 4 m, accroupi pas du tout
        if(!voit&&P.noise&&dist<P.noise*9&&!combat){d.cible.copy(P.pos);if(d.etat==='ronde'||d.etat==='retour'){d.etat='enquete';d.wait=.6;d.enq=0}}
      }
      if(alerte)d.alerte-=dt;
      if(combat){if(voit){d.s=1;d.vu=0;d.cible.copy(P.pos)}else{d.vu+=dt;d.s=Math.max(0,d.s-dt*.12)}}
      else{
        if(voit){d.s+=dt*(.55+1.8*(1-dist/Math.max(portee,1)))*(alerte?2.5:1);d.cible.copy(P.pos);if(d.s>.25&&d.etat!=='enquete'){d.etat='enquete';d.wait=.3;d.enq=0}}
        else d.s=Math.max(0,d.s-dt*.22);
        if(d.s>=1){d.s=1;engager(d,z)}
      }
      // Comportement
      if(d.etat==='combat')combattre(d,voit,dist,dt);
      else if(d.wait>0){d.wait-=dt;anim(d,'Idle');if(d.etat==='ronde'||d.etat==='fouille')d.yaw+=Math.sin(T*1.3+d.idx)*dt*.9;else d.yaw=lerpAng(d.yaw,Math.atan2(d.cible.x-d.pos.x,d.cible.z-d.pos.z),dt*4)}
      else if(d.etat==='ronde'){
        const t=d.path[d.i];anim(d,'Walk');
        if(marcher(d,t[0],t[1],1.25,dt)){d.wait=d.attente;
          if(d.boucle)d.i=(d.i+1)%d.path.length;else{d.i+=d.dir;if(d.i>=d.path.length||d.i<0){d.dir*=-1;d.i+=2*d.dir}}}
      }
      else if(d.etat==='enquete'){anim(d,voit?'Walk':'Run');d.enq+=dt;if(marcher(d,d.cible.x,d.cible.z,voit?1.1:2.6,dt,true)||d.enq>14){d.etat='fouille';d.fouille=alerte?7:4.5;d.wait=0}}
      else if(d.etat==='fouille'){anim(d,'Idle');d.yaw+=Math.sin(T*1.7+d.idx)*dt*1.6;d.fouille-=dt;if(d.fouille<=0){d.etat='retour'}}
      else if(d.etat==='retour'){const t=d.path[d.i];anim(d,'Walk');if(marcher(d,t[0],t[1],1.25,dt))d.etat='ronde'}
      placer(d);
      // le canon se lève sur Ash en combat, se baisse ensuite ; son voyant rougit
      const vise=d.etat==='combat'?Math.atan2(1.47-(1.3-.6*P.crouch),Math.max(1,dist)):.95;d.canon.rotation.x+=(vise-d.canon.rotation.x)*Math.min(1,dt*7);
    }
    d.voyant.color.setHex(d.etat==='combat'?0xff2020:d.alerte>0?0xff9020:0x401010).multiplyScalar(d.etat==='combat'?3:1.5);
    if(d.s<.05)tmpC.copy(C_IDLE);else if(d.s<.6)tmpC.copy(C_IDLE).lerp(C_WARN,clamp(d.s/.5,0,1));else tmpC.copy(C_WARN).lerp(C_ALERT,(d.s-.6)/.4);
    d.light.color.copy(tmpC);d.coneMat.uniforms.color.value.copy(tmpC);d.coneMat.uniforms.opacity.value=.2+d.s*.35;d.lensMat.color.copy(tmpC).multiplyScalar(3);
    maxS=Math.max(maxS,d.s);
  }
  return maxS;
}
// Un tir qui touche un gardien : la balle ricoche sur le blindage, et lui fonce voir d'où ça vient.
export function toucheGardien(d){d.cible.copy(P.pos);if(d.etat!=='combat'){d.etat='enquete';d.wait=.2;d.enq=0}d.alerte=25;d.s=Math.max(d.s,.55);emit('toast','Le blindage arrête la balle. Et maintenant, il sait où tu es.')}

/* ---------- La Coupure : l'armure se verrouille, le Gardien tombe raide ---------- */
// sens : 1 tombe en avant, -1 en arrière. instant : déjà à terre (reprise d'une sauvegarde).
export function neutraliser(d,sens=1,instant=false){
  if(d.neutre)return;d.neutre=true;d.s=0;d.etat='neutre';d.sens=sens;d.balles=0;d.alerte=0;d.eclair.visible=false;d.canon.rotation.x=.95;
  d.light.intensity=0;d.cone.visible=false;d.lensMat.color.setHex(0x111111);if(d.visMat)d.visMat.color.setHex(0x1a0505);
  if(instant){d.chute=null;d.g.rotation.x=1.5*sens;d.g.position.y=.06;placer2(d);if(d.mixer)d.mixer.update(1/30);return} // une image d'animation : pas de pose de référence figée
  d.chute={t:0,v:0,a:0};d.spasme=.5;
}
const placer2=d=>{d.g.position.x=d.pos.x;d.g.position.z=d.pos.z;d.g.rotation.y=d.yaw};
// Chute d'une planche : l'angle accélère comme un corps rigide, un petit rebond au sol.
function tomber(d,dt){
  const c=d.chute;c.t+=dt;if(c.t<.35){d.g.rotation.x=Math.sin(c.t*60)*.02*d.sens;if(d.mixer)d.mixer.update(dt*.3);return} // l'armure grésille, se fige
  c.v+=dt*(2.2+Math.sin(c.a)*14);c.a+=c.v*dt;
  if(c.a>=1.5){c.a=1.5;if(c.v>1.2){c.v*=-.25;emit('gardienAuSol',d)}else{c.v=0;d.chute=null}}
  d.g.rotation.x=c.a*d.sens;d.g.position.y=.06*c.a/1.5;
}
export function relever(d){
  if(!d.neutre)return;d.neutre=false;d.chute=null;d.etat='ronde';d.g.rotation.x=0;d.g.position.y=0;d.light.intensity=2.4;d.cone.visible=true;
  if(d.visMat)d.visMat.color.setHex(0xff2a2a).multiplyScalar(2.6);
}
// Les Gardiens qui entendent l'armure tomber (rayon r) vont voir le corps, pas Ash.
export function bruitDeChute(z,d,r){if(r<=0)return;for(const o of z.gardiens){if(o===d||o.neutre||o.etat==='combat')continue;if(Math.hypot(o.pos.x-d.pos.x,o.pos.z-d.pos.z)<r){o.cible.copy(d.pos);if(o.etat!=='enquete'){o.etat='enquete';o.wait=.8;o.enq=0}o.alerte=Math.max(o.alerte,12)}}}

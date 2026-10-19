// Le joueur : déplacement, balancement de la tête et pas, interactions à portée, arme P-9 et main prothétique K7.
import {THREE,$,V3,P,G,T,camera,MOBILE,state,on,emit,rnd} from './core.js';
import {glow,eteindre} from './construire.js';
import {softDot} from './textures.js';
import {keys,TC} from './controles.js';
import {collide,los} from './physique.js';
import {zone} from './zones.js';
import {footstep,shotSound,lockSound,unlockSound,verreSound} from './son.js';
import {toast} from './interface.js';
import {killDrone,burst} from './drones.js';
import {toucheGardien} from './gardiens.js';

/* ---------- Arme (P-9 silencieux) ---------- */
const gun=new THREE.Group();gun.visible=false;camera.add(gun);
(function(){
  const gm=new THREE.MeshStandardMaterial({color:0x1a1c21,roughness:.3,metalness:.9,envMapIntensity:1.4});
  const gm2=new THREE.MeshStandardMaterial({color:0x2e3239,roughness:.55,metalness:.6,envMapIntensity:1});
  const hm=new THREE.MeshStandardMaterial({color:0x6d747e,roughness:.3,metalness:.9,envMapIntensity:1.3});
  const B=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);gun.add(b);return b};
  B(.038,.044,.21,gm,0,.02,-.03);B(.034,.03,.17,gm2,0,-.012,0);
  const grip=B(.032,.1,.046,gm2,0,-.07,.06);grip.rotation.x=.25;
  B(.006,.028,.04,gm,0,-.04,-.005);
  const sup=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.17,18),gm);sup.rotation.x=Math.PI/2;sup.position.set(0,.02,-.215);gun.add(sup);
  for(const z of[-.15,-.28]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.0215,.0215,.01,18),gm2);r.rotation.x=Math.PI/2;r.position.set(0,.02,z);gun.add(r)}
  B(.012,.003,.1,glow(0xf0a53a,.9),.014,.0435,-.03);
  B(.005,.01,.005,glow(0x58e6ff,1),0,.05,-.12);B(.004,.008,.005,glow(0x58e6ff,1),-.011,.048,.06);B(.004,.008,.005,glow(0x58e6ff,1),.011,.048,.06);
  // main cybernétique
  const palm=B(.06,.075,.07,hm,.003,-.075,.078);palm.rotation.x=.25;
  for(let i=0;i<3;i++){const f=B(.05,.014,.016,gm,-.012,-.05-i*.02,.035);f.rotation.x=.25}
  B(.003,.05,.003,glow(0xf0a53a,1),.033,-.075,.08).rotation.x=.25;
  const wrist=new THREE.Mesh(new THREE.CylinderGeometry(.04,.045,.14,14),hm);wrist.rotation.x=Math.PI/2-.35;wrist.position.set(.01,-.12,.17);gun.add(wrist);
  const wl=new THREE.Mesh(new THREE.TorusGeometry(.041,.003,6,18),glow(0xf0a53a,1));wl.rotation.x=Math.PI/2-.35;wl.position.set(.01,-.105,.13);gun.add(wl);
})();
const muzzle=new THREE.Mesh(new THREE.PlaneGeometry(.09,.09),new THREE.MeshBasicMaterial({map:softDot,color:new THREE.Color(0xffb070).multiplyScalar(1.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
muzzle.position.set(0,.02,-.31);muzzle.visible=false;gun.add(muzzle);
let fireCD=0,gunKick=0,flashT=0,armed=false;
export function setArmed(v){armed=v;gun.visible=v;document.body.classList.toggle('armed',v)}
const _dir=new V3(),_o=new V3(),_v=new V3();
export function shoot(){
  if(!armed||state!=='play'||fireCD>0)return;fireCD=.38;gunKick=1;flashT=.045;muzzle.visible=true;muzzle.rotation.z=rnd()*3;shotSound();
  camera.getWorldDirection(_dir);camera.getWorldPosition(_o);
  let best=null,bt=1e9,kind='';const Z=zone();
  // Distance le long du tir jusqu'au point (x,y,z), ou 1e9 si le tir passe à côté (tolérance r, plus large au loin).
  const vise=(x,y,z,r)=>{_v.set(x,y,z).sub(_o);const t=_v.dot(_dir);if(t<.5||t>50)return 1e9;return _v.addScaledVector(_dir,-t).length()<r+t*.02?t:1e9};
  for(const d of Z.drones){if(d.dead||!d.g.visible)continue;const t=vise(d.g.position.x,d.g.position.y,d.g.position.z,.6);if(t<bt&&los(_o.x,_o.z,d.g.position.x,d.g.position.z)){best=d;bt=t;kind='drone'}}
  for(const l of Z.lumieres){if(!l.on||!l.cassable)continue;const t=vise(l.hx,l.hy,l.hz,.3);if(t<bt){best=l;bt=t;kind='lampe'}}
  for(const g of Z.gardiens){const t=vise(g.pos.x,1.2,g.pos.z,.42);if(t<bt&&los(_o.x,_o.z,g.pos.x,g.pos.z)){best=g;bt=t;kind='gardien'}}
  if(!best)return;const b=best;
  setTimeout(()=>{if(kind==='drone')killDrone(b);else if(kind==='lampe'){eteindre(b);_v.set(b.hx,b.hy,b.hz);burst(_v,40);verreSound();emit('lampeCassee',b)}else toucheGardien(b)},40+bt*6);
}
on('shoot',shoot);

/* ---------- Main prothétique K7 d'Ash (scène où Mara la verrouille) ---------- */
const kHand=new THREE.Group();kHand.visible=false;camera.add(kHand);
const kSeam=glow(0xf0a53a,1.6),kFingers=[];
let kShow=0,kLock=0,kLockT=0;
export const handLocked=()=>!!kLock;
(function(){
  const hm=new THREE.MeshStandardMaterial({color:0x8a919b,roughness:.32,metalness:.9,envMapIntensity:1.1});
  const gm=new THREE.MeshStandardMaterial({color:0x22252b,roughness:.4,metalness:.85,envMapIntensity:1});
  const palm=new THREE.Mesh(new THREE.BoxGeometry(.08,.088,.024),gm);palm.position.y=.044;kHand.add(palm);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(.07,.074,.006),hm);plate.position.set(0,.046,.014);kHand.add(plate);
  for(const x of[-.027,-.009,.009,.027]){const s=new THREE.Mesh(new THREE.BoxGeometry(.0025,.06,.002),kSeam);s.position.set(x,.046,.0175);kHand.add(s)}
  // Dos de la main vers la caméra : le pouce est à gauche, les doigts se replient vers -Z.
  const jointG=new THREE.SphereGeometry(1,12,8);
  const finger=(x,y,k,rz)=>{let j=new THREE.Group();j.position.set(x,y,0);j.rotation.z=rz;kHand.add(j);const js=[j];
    [.032,.026,.02].forEach((L,i)=>{const r=.0088-i*.0012,seg=new THREE.Mesh(new THREE.CylinderGeometry(r*.9,r,L*k,12),i===1?gm:hm);seg.position.y=L*k/2;j.add(seg);
      const kn=new THREE.Mesh(jointG,i?gm:hm);kn.scale.setScalar(r*1.15);j.add(kn);
      if(i<2){const nj=new THREE.Group();nj.position.y=L*k;j.add(nj);js.push(nj);j=nj}
      else{const tip=new THREE.Mesh(jointG,hm);tip.scale.setScalar(r*.9);tip.position.y=L*k;j.add(tip)}});
    kFingers.push(js)};
  for(const[x,k]of[[-.028,.95],[-.0095,1.05],[.0095,.97],[.028,.8]])finger(x,.09,k,0);
  finger(-.043,.022,.85,.8);
  const dir=new V3(.35,-.85,.4).normalize();
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.036,.042,.34,18),hm);arm.quaternion.setFromUnitVectors(new V3(0,1,0),dir);arm.position.copy(dir).multiplyScalar(.17);kHand.add(arm);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.038,.0035,6,24),kSeam);ring.quaternion.setFromUnitVectors(new V3(0,0,1),dir);ring.position.copy(dir).multiplyScalar(.02);kHand.add(ring);
  kHand.scale.setScalar(.85);
})();
export function lockHand(on){
  if(on){kLock=1;kLockT=0;lockSound();try{navigator.vibrate&&navigator.vibrate([90,50,220])}catch(e){}toast('Prothèse K7 · verrouillage à distance')}
  else{kLock=0;unlockSound();$('vig').style.opacity=0}
}
export function resetHand(){kLock=0;kShow=0;kHand.visible=false}
// Renvoie l'intensité du glitch d'écran à appliquer.
export function updateHand(dt){
  kShow+=((kLock?1:0)-kShow)*Math.min(1,dt*(kLock?4:3));kHand.visible=kShow>.01;kLockT+=dt;
  const spasm=kLock?Math.max(0,1-kLockT/1.1):0;
  if(kLock)$('vig').style.opacity=(.35+spasm*.4).toFixed(2);
  if(kHand.visible){
    kHand.position.set(.15+Math.sin(T*41)*.003*spasm,-.36+kShow*.27,-.42);kHand.rotation.set(-.12,.3,-.22+Math.sin(T*29)*.04*spasm);
    const curl=kLock?Math.min(1,kLockT*1.4):0;
    kFingers.forEach((js,fi)=>js.forEach((j,ji)=>{j.rotation.x=-curl*(ji?.75:.45)-.06-spasm*.25*Math.sin(T*37+fi*2.1+ji*1.3)}));
    if(kLock)kSeam.color.setHex(0xff2a2a).multiplyScalar(Math.sin(T*18)>-.2?2.4:.6);else kSeam.color.setHex(0xf0a53a).multiplyScalar(1.6);
  }
  return kLock?.22+spasm*.9:0;
}

/* ---------- Déplacement ---------- */
let lastPrompt='';
on('dialogClosed',()=>{lastPrompt=''});
export function updatePlayer(dt){
  const Z=zone();
  let f=0,s=0;
  if(TC.on){f=-TC.y;s=TC.x}
  if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD||keys.ArrowRight)s+=1;if(keys.KeyA||keys.ArrowLeft)s-=1;
  const cr=!!keys.KeyC||TC.crouch;P.crouch+=((cr?1:0)-P.crouch)*Math.min(1,dt*10);
  const sprint=(keys.ShiftLeft||keys.ShiftRight||TC.run)&&!cr&&f>0;const sp=cr?2.1:sprint?6.4:4.0;
  const raw=Math.hypot(f,s),len=raw||1,mag=TC.on&&!keys.KeyW&&!keys.KeyS&&!keys.KeyA&&!keys.KeyD?Math.min(1,raw):1;f/=len;s/=len;
  const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);
  const tx=(-sy*f+cy*s)*sp*mag,tz=(-cy*f-sy*s)*sp*mag,k=1-Math.exp(-dt*12);
  P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;P.pos.x+=P.vx*dt;P.pos.z+=P.vz*dt;collide(P.pos,.38);
  // Une foulée = un demi-tour de phase ; le pas tombe au point bas du balancement de la tête.
  const mv=Math.hypot(P.vx,P.vz);P.stepPh+=mv*dt/(cr?1.0:sprint?2.1:1.5)*Math.PI;
  P.noise=cr||mv<.6?0:sprint?1:.45;
  const si=Math.floor(P.stepPh/Math.PI);if(si!==P.stepIdx){P.stepIdx=si;if(!cr&&mv>.6)footstep(Z.surfaceAt(P.pos),sprint)}
  const bob=(Math.abs(Math.sin(P.stepPh))-.6)*.045*Math.min(1,mv/4);
  P.fov+=((sprint&&mv>5?79:72)-P.fov)*Math.min(1,dt*6);if(Math.abs(camera.fov-P.fov)>.01){camera.fov=P.fov;camera.updateProjectionMatrix()}
  camera.position.set(P.pos.x,1.66-.62*P.crouch+bob,P.pos.z);
  fireCD-=dt;
  if(gun.visible){gunKick=Math.max(0,gunKick-dt*7);const mm=Math.min(1,mv/4),bx=Math.sin(P.stepPh)*.009*mm,by=(1-Math.abs(Math.sin(P.stepPh)))*.007*mm;
    gun.position.set((MOBILE?.19:.16)+bx,-.15-by+gunKick*.012,-.34+gunKick*.05);gun.rotation.set(gunKick*.32,0,0);
    if(flashT>0){flashT-=dt;if(flashT<=0)muzzle.visible=false}}camera.rotation.set(P.pitch,P.yaw,Math.sin(P.stepPh)*.004*Math.min(1,mv/4));
  let best=null,bd=1e9;const fx=-sy,fz=-cy;
  for(const it of Z.inter){if(it.on&&!it.on())continue;const dx=it.p.x-P.pos.x,dz=it.p.z-P.pos.z,d=Math.hypot(dx,dz);if(d>it.r)continue;
    if(d>1.1&&(dx*fx+dz*fz)/d<.45)continue;if(d<bd){bd=d;best=it}}
  G.curInter=best;const html=best?'<kbd>E</kbd>'+best.label():'';
  if(html!==lastPrompt){lastPrompt=html;$('prompt').innerHTML=MOBILE&&best?best.label():html;$('prompt').hidden=!best;$('tAct').classList.toggle('ready',!!best)}
}

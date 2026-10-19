// Ciel, silhouette de la ville au loin, projecteurs, voitures volantes et orage : communs à toutes les zones extérieures.
import {THREE,scene,rnd,T,G} from './core.js';
import {FAC,canvasTex,mk} from './textures.js';
import {neon,shaftMat,glow} from './construire.js';
import {thunder} from './son.js';

export let skyMat=null,hemi=null,moon=null;
const sky=new THREE.Group();scene.add(sky);
const beacons=[],searchlights=[],cars=[];
let nextBolt=12,hemiBase=.32;
export const setHemiBase=v=>{hemiBase=v};

function tower(x,z,w,d,h,i,skyMats){
  const m=new THREE.Mesh(boxGeoWorldUV(w,h,d,24),skyMats[i%4]);m.position.set(x,h/2,z);sky.add(m);
  if(rnd()<.45){const b=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),glow(0xff2a2a,3));b.material.fog=false;b.position.set(x,h+.6,z);sky.add(b);beacons.push({m:b,ph:rnd()*6})}
  return m;
}
function boxGeoWorldUV(w,h,d,S){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);let a,b;if(f<2){a=d;b=h}else if(f<4){a=w;b=d}else{a=w;b=h}uv.setXY(i,uv.getX(i)*a/S,uv.getY(i)*b/S)}
  return g;
}
export function buildSky(){
  /* ---------- Sky ---------- */
  skyMat=(()=>{
    const[c,g]=mk(1024,512);
    const gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#030409');gr.addColorStop(.3,'#0b0b1d');gr.addColorStop(.46,'#2a1a3e');gr.addColorStop(.5,'#5a2c4e');gr.addColorStop(.53,'#1d1730');gr.addColorStop(1,'#07080d');
    g.fillStyle=gr;g.fillRect(0,0,1024,512);
    for(let i=0;i<260;i++){const x=rnd()*1024,y=90+rnd()*170,rx=40+rnd()*160,ry=8+rnd()*26;const a=.04+rnd()*.08;
      const cg=g.createRadialGradient(x,y,0,x,y,rx);const glowc=y>200?`rgba(190,90,150,${a*1.6})`:`rgba(90,80,140,${a})`;cg.addColorStop(0,glowc);cg.addColorStop(1,'rgba(0,0,0,0)');
      g.save();g.translate(x,y);g.scale(1,ry/rx);g.translate(-x,-y);g.fillStyle=cg;g.beginPath();g.arc(x,y,rx,0,7);g.fill();g.restore()}
    const m=new THREE.MeshBasicMaterial({map:canvasTex(c),side:THREE.BackSide,fog:false,depthWrite:false});
    const s=new THREE.Mesh(new THREE.SphereGeometry(400,48,24),m);sky.add(s);return m;
  })();
  // Skyline
  const skyMats=FAC.map(f=>new THREE.MeshStandardMaterial({color:0x0c0d12,roughness:.8,metalness:.2,emissive:0xffffff,emissiveMap:f.em,emissiveIntensity:.55,fog:false,envMapIntensity:.2}));
  for(let i=0;i<60;i++){
    let x,z;do{x=(rnd()*2-1)*150;z=(rnd()*2-1)*170}while(Math.abs(x)<32&&z>-74&&z<50);
    tower(x,z,8+rnd()*18,8+rnd()*18,30+rnd()*rnd()*140,i,skyMats);
  }
  tower(-48,-118,22,22,190,1,skyMats);tower(64,-100,18,26,150,2,skyMats);tower(-78,24,20,16,120,3,skyMats);
  neon('夢','#ff3d9e',14,30,-48,120,-106.9,0,{vertical:true,fog:false,ppm:24,glow:2.4});
  neon('HELIX','#ffb347',26,7,64,118,-86.9,0,{fog:false,ppm:30,glow:2.2});
  neon('ÉDEN','#4dffa1',7,24,-67.9,80,24,Math.PI/2,{vertical:true,fog:false,ppm:30,glow:2.2});
  // Searchlights
  for(const[x,z,c]of[[-70,-140,0x9ab8ff],[90,-120,0xffd2a0],[-120,60,0xb79cff]]){
    const g=new THREE.Group();g.position.set(x,0,z);sky.add(g);
    const h=260,m=new THREE.Mesh(new THREE.CylinderGeometry(.6,9,h,24,1,true),shaftMat(c,.22));
    m.geometry.translate(0,-h/2,0);m.geometry.rotateX(Math.PI);m.material.depthTest=true;m.material.fog=false;g.add(m);searchlights.push({g,ph:rnd()*6});
  }
  /* ---------- Lumières d'ambiance ---------- */
  hemi=new THREE.HemisphereLight(0x3a3f70,0x0a0a10,.32);scene.add(hemi);
  moon=new THREE.DirectionalLight(0x6070b0,.22);moon.position.set(-20,40,10);scene.add(moon);
}
/* ---------- Voitures volantes ---------- */
export function buildCars(){
  for(let i=0;i<10;i++){
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.2,.5,1),new THREE.MeshBasicMaterial({color:0x0a0b10,fog:false})));
    const t=new THREE.Mesh(new THREE.BoxGeometry(.1,.14,.8),new THREE.MeshBasicMaterial({color:new THREE.Color(0xff2840).multiplyScalar(2.5),fog:false,toneMapped:false}));t.position.x=-1.12;g.add(t);
    const h=new THREE.Mesh(new THREE.BoxGeometry(.1,.12,.7),new THREE.MeshBasicMaterial({color:new THREE.Color(0xfff2d0).multiplyScalar(2.5),fog:false,toneMapped:false}));h.position.x=1.12;g.add(h);
    const dir=i%2?1:-1;g.rotation.y=dir>0?0:Math.PI;
    g.position.set((rnd()-.5)*300,32+rnd()*30,-70+rnd()*120);sky.add(g);cars.push({g,v:dir*(14+rnd()*18)});
  }
}
export const showSky=v=>{sky.visible=v};
// Hauteur de la ville au loin : au sommet de la tour Helix, elle passe sous les pieds.
export const placerCiel=y=>{sky.position.y=y};
// L'aube (0 = nuit, 1 = jour levé) : le ciel se réchauffe, l'orage se tait.
let aube=0;export const setAube=k=>{aube=k};
export function updateSky(dt){
  for(const b of beacons)b.m.visible=Math.sin(T*2+b.ph)>.3;
  for(const s of searchlights){s.g.rotation.z=Math.sin(T*.13+s.ph)*.45;s.g.rotation.x=Math.cos(T*.11+s.ph)*.3;s.g.children[0].material.uniforms.time.value=T}
  for(const c of cars){c.g.position.x+=c.v*dt;if(c.g.position.x>180)c.g.position.x=-180;if(c.g.position.x<-180)c.g.position.x=180}
  // orage
  if(aube<=0){nextBolt-=dt;if(nextBolt<=0){nextBolt=22+rnd()*30;G.flash=1;thunder()}}
  if(G.flash>0){G.flash=Math.max(0,G.flash-dt*2.2);const f=G.flash*(.6+.4*Math.sin(T*60));hemi.intensity=hemiBase+f*2.5;skyMat.color.setScalar(1+f*2)}else{hemi.intensity=hemiBase+aube*.9;skyMat.color.setRGB(1+aube*2.2,1+aube*1.25,1+aube*.6)}
}

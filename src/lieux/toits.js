// Les toits de Lyon-Basse (chapitre 3) : quatre toits reliés par une planche, une enseigne tombée et une poutre.
// La Faucheuse tourne au-dessus, des Gardiens patrouillent, des drones aussi. En bas, la rue, seize mètres plus bas.
// Le sol des toits est à y = 0 ; les immeubles descendent jusqu'à y = -16.
import {THREE,V3,mulberry32,T,camera} from '../core.js';
import {into,add,pushCol,M,glow,addBox,neon,plight,shaft,Particles,steam,cable,bmats,boxGeoWorldUV,ledgesFor,flushLedges,lampeCassable,ombre} from '../construire.js';
import {makeZone,constructeurs} from '../zones.js';
import {makeDrone} from '../drones.js';
import {makeGardien} from '../gardiens.js';
import {makeFaucheuse} from '../faucheuse.js';
import {MODELES,mountChar,habillerSid,nameTag,figure,cyberize} from '../personnages.js';
import {canvasTex,mk} from '../textures.js';

const ROOFS=[[0,14,0,12],[0,14,-16,-3],[-18,-3,-16,-2],[-18,-6,-34,-20]];
// Passages entre les toits : [x0,x1,z0,z1,surface]
const PASSAGES=[[6.3,7.1,-3,0,'bois'],[-3,0,-10.2,-8.8,'metal'],[-12.3,-11.6,-20,-16,'metal']];
const dans=(p,r)=>p.x>r[0]&&p.x<r[1]&&p.z>r[2]&&p.z<r[3];
export const Z=makeZone('toits',{envPos:[0,2.5,-8],
  surfaceAt:p=>{for(const c of PASSAGES)if(dans(p,c))return c[4];return'asphalt'},
});
export const H={};
Z.sons=[{type:'vapeur',pos:[6,.4,-13],vol:.35},{type:'neon',pos:[-11,3,-2.6],vol:.12}];

const goudron=new THREE.MeshStandardMaterial({color:0x1d1f24,roughness:.42,metalness:.15,envMapIntensity:.9});
// Mur bas le long d'un bord, avec des ouvertures [a,b] (passages).
function parapet(axe,fixe,de,a,ouvertures=[]){
  const pts=[de];for(const[o0,o1]of ouvertures){pts.push(o0,o1)}pts.push(a);
  for(let i=0;i<pts.length;i+=2){const u0=pts[i],u1=pts[i+1];if(u1-u0<.05)continue;
    if(axe==='x')addBox(u0,u1,fixe-.13,fixe+.13,0,.62,M.concrete,{los:false});else addBox(fixe-.13,fixe+.13,u0,u1,0,.62,M.concrete,{los:false})}
}
function citerne(x,z,r,h){
  for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])addBox(x+dx*r*.7-.06,x+dx*r*.7+.06,z+dz*r*.7-.06,z+dz*r*.7+.06,0,1.5,M.darkMetal,{collide:false});
  const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),new THREE.MeshStandardMaterial({color:0x3b3a36,roughness:.7,metalness:.4,envMapIntensity:.6}));c.position.set(x,1.5+h/2,z);c.castShadow=true;add(c);
  const toit=new THREE.Mesh(new THREE.ConeGeometry(r*1.05,.5,24),M.darkMetal);toit.position.set(x,1.5+h+.25,z);add(toit);
  for(const[dx,dz]of[[-1,-1],[1,1]])pushCol({x0:x+dx*r*.7-.1,x1:x+dx*r*.7+.1,z0:z+dz*r*.7-.1,z1:z+dz*r*.7+.1,los:false,off:false});
  Z.couverts.push({x0:x-r*.9,x1:x+r*.9,z0:z-r*.9,z1:z+r*.9});
}
function clim(x,z){addBox(x-.6,x+.6,z-.45,z+.45,0,.9,M.metal,{los:false});const f=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.03,18),M.darkMetal);f.position.set(x,.92,z);add(f)}
function abri(x0,x1,z0,z1,h){addBox(x0,x1,z0,z1,0,h,new THREE.MeshStandardMaterial({color:0x2c2e33,roughness:.8,metalness:.2}));addBox(x0-.15,x1+.15,z0-.15,z1+.15,h,h+.12,M.darkMetal,{collide:false})}

constructeurs.toits=()=>{
  const r=mulberry32(4242);
  into(Z);
  /* ---------- Les immeubles sous les toits, et la rue tout en bas ---------- */
  ROOFS.forEach(([x0,x1,z0,z1],i)=>{
    addBox(x0,x1,z0,z1,-16,0,bmats[(i+1)%4],{geo:boxGeoWorldUV(x1-x0,16,z1-z0,24),collide:false}).receiveShadow=true;ledgesFor(x0,x1,z0,z1,16,-16);
    const sol=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),goudron);sol.rotation.x=-Math.PI/2;sol.position.set((x0+x1)/2,.004,(z0+z1)/2);sol.receiveShadow=true;add(sol);
  });
  // Immeubles voisins plus hauts tout autour : on est au milieu de la ville, pas sur une île.
  for(const[x0,x1,z0,z1,h]of[[18,30,-40,14,30],[-34,-22,-48,8,26],[-6,16,-56,-40,36],[-30,-20,-60,-48,22],[2,18,16,30,20],[-20,-4,13,27,14],[-34,-24,12,30,30],[22,34,18,34,18]]){
    addBox(x0,x1,z0,z1,-16,h,bmats[(x0+40)%4],{geo:boxGeoWorldUV(x1-x0,h+16,z1-z0,24),collide:false});ledgesFor(x0,x1,z0,z1,h+16,-16)}
  const rueSol=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x111216,roughness:.25,metalness:.4,envMapIntensity:.8}));rueSol.rotation.x=-Math.PI/2;rueSol.position.y=-16;add(rueSol);
  // Lampadaires de la rue en contrebas (à l'arrêt pendant le black-out, sauf ceux de secours près du fourgon)
  H.lampesBas=[];
  for(const[x,z]of[[-10,8],[2,8],[-22,-4]]){const b=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),glow(0xff3a2a,2));b.position.set(x,-11,z);add(b);const l=plight(0xff3a2a,1.4,10,x,-11.5,z);H.lampesBas.push({b,l})}

  /* ---------- Bords et passages ---------- */
  // R1
  parapet('x',0,0,14,[[6.3,7.1]]);parapet('x',12,0,14);parapet('z',0,0,12);parapet('z',14,0,12);
  // R2
  parapet('x',-3,0,14,[[6.3,7.1]]);parapet('x',-16,0,14);parapet('z',0,-16,-3,[[-10.2,-8.8]]);parapet('z',14,-16,-3);
  // R3 (bord sud au-dessus de la rue : parapet bas, on voit en bas)
  parapet('z',-3,-16,-2,[[-10.2,-8.8]]);parapet('x',-16,-18,-3,[[-12.3,-11.6]]);parapet('x',-2,-18,-3);parapet('z',-18,-16,-2);
  // R4
  parapet('x',-20,-18,-6,[[-12.3,-11.6]]);parapet('x',-34,-18,-6);parapet('z',-18,-34,-20);parapet('z',-6,-34,-20);
  // Côtés des passages : on ne tombe pas dans le vide
  for(const[x0,x1,z0,z1]of PASSAGES){
    if(x1-x0<z1-z0){pushCol({x0:x0-.12,x1:x0,z0,z1,los:false,off:false});pushCol({x0:x1,x1:x1+.12,z0,z1,los:false,off:false})}
    else{pushCol({x0,x1,z0:z0-.12,z1:z0,los:false,off:false});pushCol({x0,x1,z0:z1,z1:z1+.12,los:false,off:false})}
  }
  // La planche, l'enseigne tombée, la poutre
  const bois=new THREE.MeshStandardMaterial({color:0x4b3a2a,roughness:.9});
  const planche=new THREE.Mesh(new THREE.BoxGeometry(.8,.08,3.6),bois);planche.position.set(6.7,.04,-1.5);add(planche);
  const ens=new THREE.Mesh(new THREE.BoxGeometry(3.6,.14,1.4),M.darkMetal);ens.position.set(-1.5,.07,-9.5);ens.rotation.z=.03;add(ens);
  {const[c,g]=mk(512,192);g.fillStyle='#120f12';g.fillRect(0,0,512,192);g.strokeStyle='#5a2440';g.lineWidth=10;g.font='700 120px "Saira Condensed",sans-serif';g.textAlign='center';g.strokeText('LOTO',256,140);
    const t=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.25),new THREE.MeshStandardMaterial({map:canvasTex(c),roughness:.6}));t.rotation.x=-Math.PI/2;t.position.set(-1.5,.15,-9.5);add(t)}
  const poutre=new THREE.Mesh(new THREE.BoxGeometry(.7,.3,4.4),M.metal);poutre.position.set(-11.95,-.12,-18);add(poutre);

  /* ---------- R1 : le toit de Kovac ---------- */
  abri(.4,3.4,9.4,11.8,2.6);
  {const porte=new THREE.Mesh(new THREE.PlaneGeometry(1,2.1),new THREE.MeshStandardMaterial({color:0x3a2a20,roughness:.6}));porte.position.set(1.9,1.05,9.39);porte.rotation.y=Math.PI;add(porte)}
  H.lampeR1=lampeCassable(1.9,2.45,9.25,0xffb46a,{int:1.6,dist:8});
  citerne(10,6,1.25,2.2);clim(4,3.5);clim(5.4,3.5);clim(4,5);
  {const a=new THREE.Mesh(new THREE.SphereGeometry(.7,16,10,0,Math.PI*2,0,Math.PI*.35),M.metal);a.rotation.x=-1.0;a.position.set(12.5,1.5,10.2);add(a);addBox(12.45,12.55,10.3,10.4,0,1.3,M.darkMetal,{collide:false})}
  cable(3.4,2.2,10.5,12.5,2,10.8,.4,0);
  for(let i=0;i<6;i++){const x=4.5+i*1.25,y=2.2-Math.sin(i/5*Math.PI)*.38;const tissu=new THREE.Mesh(new THREE.PlaneGeometry(.7,.9),new THREE.MeshStandardMaterial({color:[0x5a6b7a,0x7a3a3a,0xb8b0a0,0x384a3a][i%4],roughness:1,side:THREE.DoubleSide}));tissu.position.set(x,y-.5,10.6);tissu.rotation.y=.1;add(tissu)}

  /* ---------- R2 : les citernes ---------- */
  citerne(3,-12,1.4,2.6);citerne(10,-6.5,1.15,2.1);clim(11.5,-13);clim(11.5,-11.6);clim(12.9,-13);
  {const v=new THREE.Mesh(new THREE.BoxGeometry(2.2,.35,1.4),glow(0x9fd8ff,.7));v.position.set(6.5,.18,-13);add(v);pushCol({x0:5.4,x1:7.6,z0:-13.7,z1:-12.3,los:false,off:false});plight(0x9fd8ff,.8,5,6.5,1,-13)}
  H.lampeR2=lampeCassable(12.6,2.6,-4.2,0xffc58a,{int:1.8,dist:9});addBox(12.55,12.65,-4.35,-4.25,0,2.5,M.darkMetal,{collide:false});
  steam(6,.5,-13.6,0x9aa4b8,{n:24,rate:4,a:.12,s1:2.4,up:.6,life:3});
  makeDrone(Z,[[2,-5],[12,-14]],Math.PI*.75,{h:3.2,speed:1.6});

  /* ---------- R3 : au-dessus de la rue ---------- */
  // Dos d'une grande enseigne éteinte, tournée vers la rue
  for(const x of[-17.5,-15.75,-14])addBox(x-.07,x+.07,-2.75,-2.6,0,4.2,M.darkMetal,{collide:false});
  addBox(-17.8,-13.7,-2.55,-2.45,1.2,4.2,new THREE.MeshStandardMaterial({color:0x1a1b20,roughness:.7,metalness:.5}),{collide:false});
  H.enseigne=neon('LYON-BASSE','#ff3d6a',3.9,1.1,-15.75,2.7,-2.4,0,{glow:.25});
  {const m=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,9,8),M.darkMetal);m.position.set(-16.5,4.5,-14.5);add(m);const b=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),glow(0xff2020,3));b.position.set(-16.5,9.1,-14.5);add(b);H.balise=b}
  abri(-9,-6,-15.6,-13,2.4);H.lampeR3a=lampeCassable(-14,2.6,-8,0xd9e8ff,{int:1.9,dist:10});addBox(-14.05,-13.95,-8.05,-7.95,0,2.5,M.darkMetal,{collide:false});
  H.lampeR3b=lampeCassable(-6,2.3,-12.8,0xffb46a,{int:1.5,dist:8});
  clim(-16,-6);clim(-16,-4.6);
  makeGardien(Z,[[-16,-4.5],[-5,-4.5],[-5,-11],[-16,-11]],{boucle:true,yaw:Math.PI/2,attente:1.6});
  makeGardien(Z,[[-10.5,-14.6],[-10.5,-6]],{yaw:0,attente:2.6});

  /* ---------- En bas : le fourgon, Mara, les Gardiens, le transformateur ---------- */
  H.fourgon=new THREE.Group();H.fourgon.position.set(-11,-16,5.5);add(H.fourgon);
  {const g=H.fourgon,c=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.1,5),new THREE.MeshStandardMaterial({color:0x1c1f24,roughness:.4,metalness:.6,envMapIntensity:1}));c.position.y=1.25;g.add(c);
    for(const sx of[-.75,.75]){const p=new THREE.Mesh(new THREE.CircleGeometry(.16,12),glow(0xfff2d0,2.5));p.position.set(sx,.9,2.51);g.add(p)}
    H.gyro=[];for(const[sx,col]of[[-.5,0xff2020],[.5,0x2060ff]]){const b=new THREE.Mesh(new THREE.BoxGeometry(.4,.12,.2),glow(col,3));b.position.set(sx,2.36,1.6);g.add(b);H.gyro.push(b)}
    H.gyroL=plight(0xff3030,1.6,10,-11,-13,7);
    // Phares du fourgon et réverbère de secours : la scène doit se lire depuis le toit
    const ph=new THREE.SpotLight(0xfff2d0,3,18,.5,.6,1.4);ph.position.set(-11,-14.8,8);ph.target.position.set(-11,-16,16);add(ph);add(ph.target);H.phares=ph;
    H.reverbere=plight(0xcfe0ff,2.2,14,-8.5,-10.5,6.5)}
  H.mara=figure({coat:0x5a1520,skin:0xc8957a,hair:0x120c0c,long:true,visor:0x58e6ff});H.mara.position.set(-9.5,-16,7.6);H.mara.rotation.y=-.6;add(H.mara);
  H.gardesBas=[];for(const[x,z,ry]of[[-8.6,7.1,-2.2],[-10.3,8.4,.4]]){const f=figure({coat:0x1d2128,skin:0x30343c,hood:true,belt:0xff3030});f.position.set(x,-16,z);f.rotation.y=ry;add(f);H.gardesBas.push(f)}
  addBox(-5.55,-5.45,3.95,4.05,-16,-10.6,M.darkMetal,{collide:false});
  H.transfo=lampeCassable(-5.5,-10.4,4,0x7dffc8,{int:0,dist:1,r:0});H.transfo.transfo=true;H.transfo.head.scale.set(2.4,2.8,2.4);
  {const t=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.5),M.metal);t.position.set(-5.5,-10.45,4.1);add(t)}

  /* ---------- R4 : la trappe ---------- */
  abri(-18,-14.5,-27.5,-24,2.2);Z.couverts.push({x0:-18,x1:-14.2,z0:-28,z1:-23.6});
  {const tr=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,1.3),M.metal);tr.position.set(-15.5,.06,-31);add(tr);H.trappe=tr;
    const l=plight(0xffa65a,1.1,6,-15.5,1.2,-31);H.trappeLum=l}
  clim(-8,-31.5);clim(-9.4,-31.5);citerne(-9,-23.5,1.1,2);
  H.lampeR4=lampeCassable(-14.5,2.4,-24.5,0xffb46a,{int:1.4,dist:8});
  makeDrone(Z,[[-16,-21.5],[-8,-32]],Math.PI*.8,{h:3.1,speed:1.5});
  // Sid, qui attend près de la trappe
  const sid={key:'sid',name:'SID',x:-14,z:-30.2,yaw:Math.PI*.8,h:1.76};
  sid.g=new THREE.Group();sid.g.position.set(sid.x,0,sid.z);sid.g.rotation.y=sid.yaw;add(sid.g);
  sid.tag=nameTag(sid.name);sid.tag.position.set(sid.x,sid.h+.55,sid.z);add(sid.tag);
  pushCol({x0:sid.x-.3,x1:sid.x+.3,z0:sid.z-.3,z1:sid.z+.3,los:false,off:false});
  if(MODELES.sid){mountChar(sid,THREE.SkeletonUtils.clone(MODELES.sid.scene),{},{env:.7});habillerSid(sid);try{cyberize(sid,{arm:'Left',r1:.052,r2:.045,col:0xffa040,head:-1,neck:true})}catch(e){}}
  else{const f=figure({coat:0x3b3426,skin:0xb0846a,beanie:0x6a2a1a,hunch:true,mech:true});sid.g.add(f);sid.root=f}
  Z.npcs.push(sid);Z.inter.push({p:new V3(sid.x,0,sid.z),r:2.6,label:()=>'Parler à Sid',act:()=>Z.talk&&Z.talk('sidToits')});

  /* ---------- La Faucheuse ---------- */
  H.faucheuse=makeFaucheuse(Z,{cx:-4,cz:-12,rx:15,rz:13,h:13,v:.075,R:3.2,t0:1.2,lum:6});

  flushLedges();
  Z.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.receiveShadow=true});
  into(null);
};
Z.update=(dt,S)=>{
  if(!H.gyro)return;
  const on=Math.sin(T*9)>0;H.gyro[0].visible=on;H.gyro[1].visible=!on;H.gyroL.color.setHex(on?0xff3030:0x3050ff);
  H.balise.visible=Math.sin(T*3)>0;
};

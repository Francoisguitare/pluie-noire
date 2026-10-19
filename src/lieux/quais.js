// Les quais de Saône jusqu'à Confluence (chapitre 5). On sort de la galerie des câbles sur le bas-port, on longe la
// rivière sous la pluie, on passe sous un pont où des sans-abri ont fait du feu, et on arrive au quai de chargement de
// la tour Helix : conteneurs, projecteurs, caméras, Gardiens, et la Faucheuse au-dessus. La porte de service s'ouvre
// avec le badge de Varga. La tour domine tout : 230 m de verre, un écran géant, l'antenne de la K7.2 au sommet.
// Plan (le nord vers +Z) : on descend le quai vers −Z ; la Saône à l'ouest (x < −6), le mur du quai à l'est (x > 6.5).
import {THREE,V3,mulberry32,T} from '../core.js';
import {into,add,pushCol,M,glow,addBox,plight,neon,boxGeoWorldUV,building,flushLedges,lampeCassable,steam,flamme,cable} from '../construire.js';
import {makeZone,constructeurs} from '../zones.js';
import {makeGardien} from '../gardiens.js';
import {makeDrone} from '../drones.js';
import {makeFaucheuse} from '../faucheuse.js';
import {makeCamera} from '../cameras.js';
import {canvasTex,mk,texPierre,texPaves} from '../textures.js';

const sousPont=p=>p.z<-37.6&&p.z>-46.4&&p.x<6.5;
export const Z=makeZone('quais',{fog:0x06070d,fogD:.014,hemi:.26,envPos:[0,2.5,-40],
  indoor:sousPont,
  // pavés mouillés, flaques çà et là ; béton sec sous le pont ; bitume au quai de chargement
  surfaceAt:p=>sousPont(p)||p.z<-56?'asphalt':Math.sin(p.x*1.7+1)*Math.sin(p.z*.9)>.45?'puddle':'asphalt',
});
export const H={};
Z.sons=[{type:'feu',pos:[.4,.7,-44.4],vol:.7}];

// Normales de l'eau : petites vagues qui se répètent sans couture (fréquences entières).
function texEau(r){const N=256,[c,g]=mk(N,N),im=g.createImageData(N,N),h=new Float32Array(N*N),ondes=[];
  for(let i=0;i<16;i++)ondes.push([1+Math.floor(r()*9),Math.floor(r()*9)-4,r()*6.283,.3+r()*.7]);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){let v=0;for(const[a,b,p,k]of ondes)v+=Math.sin((a*x+b*y)/N*6.283+p)*k/(Math.abs(a)+Math.abs(b)+1);h[y*N+x]=v}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const dx=h[y*N+(x+1)%N]-h[y*N+(x+N-1)%N],dy=h[((y+1)%N)*N+x]-h[((y+N-1)%N)*N+x],nx=-dx*28,ny=-dy*28,l=Math.hypot(nx,ny,1),o=(y*N+x)*4;
    im.data[o]=(nx/l*.5+.5)*255;im.data[o+1]=(ny/l*.5+.5)*255;im.data[o+2]=(1/l*.5+.5)*255;im.data[o+3]=255}
  g.putImageData(im,0,0);return c}
// Façade de la tour : verre sombre, lignes d'étages allumées (texture et carte d'émission).
function texTour(r){const W=512,Hh=1024,[c,g]=mk(W,Hh),[e,ge]=mk(W,Hh);g.fillStyle='#0b0e14';g.fillRect(0,0,W,Hh);ge.fillStyle='#000';ge.fillRect(0,0,W,Hh);
  for(let y=0;y<Hh;y+=16){g.fillStyle='#161b24';g.fillRect(0,y,W,3);
    for(let x=0;x<W;x+=32){const v=r();if(v<.42){ge.fillStyle=v<.08?'#ffcf8a':v<.3?'#8fc8ff':'#d8ecff';ge.globalAlpha=.25+r()*.6;ge.fillRect(x+2,y+4,28,10);ge.globalAlpha=1}
      g.fillStyle='#1d2430';g.fillRect(x,y,2,16)}}
  return[c,e]}
// L'écran géant de la tour : slogan et compte à rebours, redessiné chaque seconde.
const ecran={c:null,g:null,t:null,txt:''};
export function majEcran(heure){if(!ecran.g)return;const m=Math.max(0,6*60-heure),mm=Math.floor(m),ss=Math.floor((m-mm)*60);
  const t=heure>=6*60?'K7.2 · DIFFUSION EN COURS':`K7.2 · DIFFUSION DANS ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;if(t===ecran.txt)return;ecran.txt=t;
  const g=ecran.g;g.fillStyle='#02060a';g.fillRect(0,0,1024,512);g.fillStyle='#58e6ff';g.font='700 150px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('SOYEZ ENTIER.',512,230);
  g.fillStyle='#ffb347';g.font='600 70px "Saira Condensed",sans-serif';g.fillText(t,512,380);g.fillStyle='rgba(88,230,255,.25)';for(let y=0;y<512;y+=6)g.fillRect(0,y,1024,1);ecran.t.needsUpdate=true}

constructeurs.quais=()=>{
  const r=mulberry32(4301);into(Z);
  const tP=canvasTex(texPierre(r),true),tV=canvasTex(texPaves(r),true),tE=canvasTex(texEau(r),true,true);
  const pierre=new THREE.MeshStandardMaterial({map:tP,bumpMap:tP,bumpScale:.03,roughness:.85,metalness:.05,envMapIntensity:.4});
  const paves=new THREE.MeshStandardMaterial({map:tV,roughness:.28,metalness:.25,envMapIntensity:1});
  const beton=new THREE.MeshStandardMaterial({color:0x34363c,roughness:.8,metalness:.1,envMapIntensity:.5});
  const bois=new THREE.MeshStandardMaterial({color:0x3e2c1e,roughness:.8});
  const sol=(x0,x1,z0,z1,mat,k,y=0)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(x1-x0)/k,uv.getY(i)*(z1-z0)/k);
    const m=new THREE.Mesh(g,mat);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,y+.003,(z0+z1)/2);m.receiveShadow=true;add(m);return m};
  const mur=(x0,x1,z0,z1,h,mat=pierre,o={})=>addBox(x0,x1,z0,z1,o.y0||0,h,mat,{geo:boxGeoWorldUV(x1-x0,h-(o.y0||0),z1-z0,4),...o});

  /* ---------- La rivière, le quai, le mur ---------- */
  sol(-6,6.5,-56,8,paves,2);
  {const eau=new THREE.Mesh(new THREE.PlaneGeometry(130,260),new THREE.MeshStandardMaterial({color:0x07101a,roughness:.1,metalness:.7,envMapIntensity:1.3,normalMap:tE,normalScale:new THREE.Vector2(.5,.5)}));
    tE.repeat.set(26,52);eau.rotation.x=-Math.PI/2;eau.position.set(-71,-1.1,-60);add(eau);H.eau=tE}
  // bord du quai : margelle de pierre, bittes d'amarrage, une chaîne ; on ne tombe pas à l'eau
  mur(-6.3,-5.9,-92,8,.28,pierre,{los:false});pushCol({x0:-7,x1:-5.9,z0:-92,z1:8,los:false,off:false});
  addBox(-6.3,-5.9,-92,8,-1.2,0,pierre,{collide:false});
  for(let z=4;z>-56;z-=7){const b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.55,12),M.darkMetal);b.position.set(-5.5,.28,z);add(b);pushCol({x0:-5.7,x1:-5.3,z0:z-.2,z1:z+.2,los:false,off:false})}
  // le mur du quai, côté ville, et l'arche de la galerie des câbles d'où l'on sort
  mur(6.5,7.5,1.4,8,6.5);mur(6.5,7.5,-92,-1.4,6.5);linteauArche();
  function linteauArche(){mur(6.5,7.5,-1.4,1.4,6.5,pierre,{y0:2.6,collide:false});pushCol({x0:7.2,x1:7.6,z0:-1.4,z1:1.4,los:true,off:false});
    const fond=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.6),new THREE.MeshBasicMaterial({color:0x020304}));fond.position.set(7.15,1.3,0);fond.rotation.y=-Math.PI/2;add(fond);
    H.grille=new THREE.Group();H.grille.position.set(6.55,0,1.4);add(H.grille);
    for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.04,2.6,.04),M.darkMetal);b.position.set(0,1.3,-.15-i*.3);H.grille.add(b)}
    for(const y of[.4,1.3,2.2]){const b=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,2.8),M.darkMetal);b.position.set(0,y,-1.4);H.grille.add(b)}
    H.grille.rotation.y=1.9}
  // au-dessus du mur : le haut-quai, ses réverbères et ses immeubles
  sol(7.5,40,-92,8,beton,4,6.5);
  for(const[z,on]of[[-6,true],[-30,false],[-50,true]]){addBox(8.3,8.42,z-.06,z+.06,6.5,11.4,M.darkMetal,{collide:false});const t=new THREE.Mesh(new THREE.BoxGeometry(.7,.16,.3),glow(0xffc58a,on?2.2:.2));t.position.set(8.1,11.4,z);add(t);
    if(on)plight(0xffb070,1.6,14,8,10.8,z)}
  building(14,26,-40,-14,24);building(14,24,-12,6,30);building(16,30,-74,-44,20);
  // l'autre rive, de l'autre côté de la Saône
  for(let i=0;i<7;i++){const z=10-i*24-r()*6,w=10+r()*8,h=18+r()*30;building(-62-w,-62,z-14,z,h)}

  /* ---------- 1. Le bas-port : platanes, bancs, une péniche ---------- */
  const platane=(x,z)=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,5.2,10),new THREE.MeshStandardMaterial({color:0x34322a,roughness:.9}));t.position.set(x,2.6,z);add(t);
    pushCol({x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3,los:true,off:false});
    const f=new THREE.Mesh(new THREE.IcosahedronGeometry(2.6,1),new THREE.MeshStandardMaterial({color:0x1c2418,roughness:1,flatShading:true}));f.scale.set(1,.7,1);f.position.set(x,6.4,z);add(f);
    addBox(x-.9,x+.9,z-.9,z+.9,0,.12,M.darkMetal,{collide:false})};
  for(const z of[-7,-17,-27])platane(3.6,z);
  const banc=(x,z)=>{addBox(x-.25,x+.25,z-.9,z+.9,.42,.5,bois,{los:false});addBox(x+.15,x+.25,z-.9,z+.9,.5,.95,bois,{collide:false});for(const dz of[-.75,.75])addBox(x-.2,x+.2,z+dz-.04,z+dz+.04,0,.42,M.darkMetal,{collide:false})};
  banc(4.9,-12);banc(4.9,-22);
  for(const[x,z]of[[-4.6,-20],[-4.2,-21.3],[-4.7,-33]])addBox(x-.5,x+.5,z-.5,z+.5,0,.9,bois,{los:false});
  // péniche amarrée (décor, sur l'eau)
  const peniche=(z0,z1,c)=>{addBox(-11.5,-6.9,z1,z0,-1.1,.2,new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.4}),{collide:false});
    addBox(-10.8,-7.6,z1+2,z1+7,.2,2.2,new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.5,metalness:.4}),{collide:false});
    const f=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.6),glow(0xffc070,1.2));f.position.set(-7.58,1.4,z1+4.5);f.rotation.y=Math.PI/2;add(f)};
  peniche(-8,-30,0x1d2a24);peniche(-58,-82,0x3a2418);
  H.lQ1=lampeCassable(-5.6,4,-12,0xffb46a,{int:1.6,dist:10,r:4});H.lQ2=lampeCassable(5.9,3.6,-24,0xffb46a,{int:1.4,dist:9,r:3.6});
  for(const[x,z]of[[-5.6,-12]])addBox(x-.06,x+.06,z-.06,z+.06,0,4.1,M.darkMetal,{collide:false});
  makeDrone(Z,[[0,-6],[0,-34]],Math.PI,{h:3.4,speed:1.6});

  /* ---------- 2. Sous le pont : le campement, le feu ---------- */
  addBox(-90,12,-46,-38,7.4,9.2,beton,{collide:false});addBox(-90,12,-46.4,-46,9.2,10.4,M.darkMetal,{collide:false});addBox(-90,12,-38,-37.6,9.2,10.4,M.darkMetal,{collide:false});
  for(const x of[-3.4,3.4])mur(x-.6,x+.6,-42.8,-41.2,7.4,beton);
  for(const x of[-24,-48,-72])addBox(x-1.2,x+1.2,-43.2,-40.8,-1.1,7.4,beton,{collide:false});
  {const b=new THREE.Mesh(new THREE.CylinderGeometry(.32,.3,.85,14,1,true),new THREE.MeshStandardMaterial({color:0x3a2a20,roughness:.6,metalness:.6,side:THREE.DoubleSide}));b.position.set(.4,.42,-44.4);add(b);pushCol({x0:.05,x1:.75,z0:-44.75,z1:-44.05,los:false,off:false});
    flamme(.4,.8,-44.4,.75,.9);H.feu=plight(0xff8a3a,2.2,10,.4,1.5,-44.4);steam(.4,1.6,-44.4,0x3a3634,{n:16,rate:3,a:.12,s1:1.8,up:.8,life:3})}
  // une tente, des cartons, un caddie, deux sacs de couchage
  {const t=new THREE.Mesh(new THREE.ConeGeometry(1.3,1.4,4),new THREE.MeshStandardMaterial({color:0x1a2a22,roughness:.95,envMapIntensity:.3}));t.rotation.y=Math.PI/4;t.position.set(4.7,.7,-39.6);add(t);pushCol({x0:3.8,x1:5.6,z0:-40.5,z1:-38.7,los:false,off:false})}
  for(const[x,z,ry]of[[-2,-44.8,.3],[2.4,-45.2,-.2]]){const s=new THREE.Mesh(new THREE.BoxGeometry(.6,.25,1.8),new THREE.MeshStandardMaterial({color:0x3a2e4a,roughness:.95}));s.position.set(x,.13,z);s.rotation.y=ry;add(s)}
  addBox(-4.6,-3.6,-39.2,-38.6,0,.6,new THREE.MeshStandardMaterial({color:0x8a7050,roughness:1}),{los:false});
  Z.couverts.push({x0:-6,x1:6.5,z0:-46,z1:-38});

  /* ---------- 3. Le quai de chargement d'Helix ---------- */
  // grillage et portail ouvert
  const grillage=(x0,x1,z)=>{const[c,g]=mk(64,64);g.clearRect(0,0,64,64);g.strokeStyle='rgba(150,160,170,.9)';g.lineWidth=2;for(let i=-64;i<128;i+=12){g.beginPath();g.moveTo(i,0);g.lineTo(i+64,64);g.stroke();g.beginPath();g.moveTo(i+64,0);g.lineTo(i,64);g.stroke()}
    const t=canvasTex(c,true);t.repeat.set((x1-x0)/1.2,2.4/1.2);const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,2.4),new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.3,side:THREE.DoubleSide,metalness:.6,roughness:.5}));
    m.position.set((x0+x1)/2,1.2,z);add(m);pushCol({x0,x1,z0:z-.05,z1:z+.05,los:false,off:false});for(const x of[x0,x1])addBox(x-.05,x+.05,z-.05,z+.05,0,2.5,M.darkMetal,{collide:false})};
  grillage(-5.9,-1.2,-56);grillage(2.4,6.5,-56);
  neon('HELIX · ACCÈS RÉSERVÉ','#ff5a4a',3.6,.4,.6,2.9,-55.9,0,{glow:1.4,size:.6,ppm:140});
  sol(-6,6.5,-92,-56,new THREE.MeshStandardMaterial({color:0x1e2026,roughness:.35,metalness:.3,envMapIntensity:.9}),3);
  for(let z=-58;z>-90;z-=4)addBox(-6,6.5,z-.06,z,.004,.008,glow(0xc8a020,.35),{collide:false});
  // conteneurs (couverts contre le projecteur quand ils sont empilés en pont)
  const cont=(x0,x1,z0,z1,y0,c)=>{const[cc,g]=mk(128,128);g.fillStyle=c;g.fillRect(0,0,128,128);g.fillStyle='rgba(0,0,0,.28)';for(let i=0;i<128;i+=8)g.fillRect(i,0,3,128);g.fillStyle='rgba(60,30,10,.35)';for(let i=0;i<40;i++)g.fillRect(r()*128,r()*128,2+r()*6,2+r()*14);
    const t=canvasTex(cc,true);const m=addBox(x0,x1,z0,z1,y0,y0+2.6,new THREE.MeshStandardMaterial({map:t,roughness:.6,metalness:.5,envMapIntensity:.7}),{collide:y0===0});m.castShadow=true;return m};
  cont(-5.4,-2.9,-68,-62,0,'#7a3a22');cont(-5.4,-2.9,-77,-71,0,'#22405a');cont(-5.4,-2.9,-77,-71,2.6,'#5a5a28');
  cont(1.6,4.1,-70,-64,0,'#2a4a30');cont(1.6,4.1,-80,-74,0,'#7a3a22');
  // le tunnel : deux piles de caisses, un conteneur posé dessus, on passe dessous à l'abri du projecteur
  addBox(-2.6,-1.6,-80.5,-74.5,0,2.2,bois);addBox(.3,1.3,-80.5,-74.5,0,2.2,bois);cont(-2.8,1.5,-80.5,-74.5,2.2,'#6a2a2a');
  Z.couverts.push({x0:-1.6,x1:.3,z0:-80.5,z1:-74.5});
  // l'auvent du quai de chargement, contre la tour
  addBox(-6,6.5,-90,-84.5,4.6,4.9,M.darkMetal,{collide:false});for(const x of[-5.6,6.1])addBox(x-.1,x+.1,-84.8,-84.5,0,4.6,M.darkMetal,{collide:true,los:false});
  Z.couverts.push({x0:-6,x1:6.5,z0:-90,z1:-84.6});
  // un chariot élévateur, des palettes, des fûts
  {const jaune=new THREE.MeshStandardMaterial({color:0xb88a18,roughness:.55,metalness:.35});
    addBox(-4.7,-3.5,-87.2,-85.4,.25,1.25,jaune,{los:false});addBox(-4.7,-3.5,-87.6,-87.2,.25,1.5,M.darkMetal,{collide:false});
    for(const[x,z]of[[-4.65,-85.5],[-3.55,-85.5],[-4.65,-86.9],[-3.55,-86.9]])addBox(x-.04,x+.04,z-.04,z+.04,1.25,2.6,M.darkMetal,{collide:false});addBox(-4.72,-3.48,-87,-85.4,2.6,2.68,jaune,{collide:false});
    for(const x of[-4.5,-3.7])addBox(x-.05,x+.05,-85.4,-85.3,0,3.2,M.darkMetal,{collide:false});
    for(const x of[-4.4,-3.8])addBox(x-.06,x+.06,-85.3,-84.1,.08,.14,M.darkMetal,{collide:false});
    for(const[x,z]of[[-4.75,-85.8],[-3.45,-85.8],[-4.75,-87],[-3.45,-87]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.18,14),new THREE.MeshStandardMaterial({color:0x111214,roughness:.9}));w.rotation.z=Math.PI/2;w.position.set(x,.25,z);add(w)}
    pushCol({x0:-4.8,x1:-3.4,z0:-87.6,z1:-84.1,los:false,off:false})}
  for(const[x,z]of[[4.6,-86.6],[5.5,-86.3]]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.9,14),new THREE.MeshStandardMaterial({color:0x2a5a8a,roughness:.5,metalness:.5}));b.position.set(x,.45,z);add(b);pushCol({x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3,los:false,off:false})}
  addBox(2,3.4,-62,-60.6,0,.5,bois,{los:false});addBox(2.1,3.3,-61.9,-60.7,.5,1,bois,{los:false});
  // projecteurs sur mâts (on peut les abattre) et caméras
  for(const[x,z,k]of[[-5.7,-60,'lP1'],[6.1,-70,'lP2']]){addBox(x-.07,x+.07,z-.07,z+.07,0,6,M.darkMetal,{collide:false});H[k]=lampeCassable(x,6,z,0xe8f0ff,{int:2.2,dist:14,r:6})}
  H.lP3=lampeCassable(.2,4.4,-85,0xe8f0ff,{int:1.8,dist:11,r:5});
  addBox(2.55,2.67,-56.86,-56.74,0,3.9,M.darkMetal,{collide:false});
  H.cam1=makeCamera(Z,{x:2.6,y:3.9,z:-57.2,yaw:.2,amp:.65,vitesse:.4,portee:12,ph:0});
  H.cam2=makeCamera(Z,{x:2.2,y:3.7,z:-89.2,yaw:0,amp:.8,vitesse:.33,portee:13,ph:2});
  makeGardien(Z,[[-.8,-59],[-.8,-72],[5.4,-72],[5.4,-59]],{boucle:true,yaw:Math.PI,attente:1.8});
  makeGardien(Z,[[-4.6,-82.4],[4.8,-82.4]],{yaw:Math.PI/2,attente:2.6,vue:11});
  H.faucheuse=makeFaucheuse(Z,{cx:0,cz:-71,rx:8,rz:11,h:17,v:.06,R:3,t0:.4,lum:6});

  /* ---------- La tour Helix ---------- */
  mur(-30,30,-140,-90,14,new THREE.MeshStandardMaterial({color:0x15181e,roughness:.4,metalness:.6,envMapIntensity:.8}),{los:true});
  // porte de service (badge) et lecteur
  H.porteService=addBox(-1,1,-90.12,-89.98,0,2.4,new THREE.MeshStandardMaterial({color:0x3a3e46,roughness:.4,metalness:.7}),{});
  H.lecteur=new THREE.Mesh(new THREE.BoxGeometry(.14,.06,.02),glow(0xff3030,2));H.lecteur.position.set(1.35,1.35,-89.96);add(H.lecteur);
  addBox(1.26,1.44,-90,-89.95,1.15,1.5,M.darkMetal,{collide:false});
  {const l=plight(0xbfe0ff,1.2,7,0,3.2,-88.6);const b=new THREE.Mesh(new THREE.BoxGeometry(1.4,.06,.2),glow(0xd8f0ff,2.2));b.position.set(0,3.25,-89.9);add(b)}
  for(const x of[-14,-8,8,14]){const p=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.6),new THREE.MeshStandardMaterial({color:0x2a2e36,roughness:.5,metalness:.6}));p.position.set(x,1.8,-89.97);add(p);
    for(let y=.3;y<3.6;y+=.3)addBox(x-2.1,x+2.1,-89.97,-89.95,y,y+.04,M.darkMetal,{collide:false})}
  // le fût de la tour, visible de loin malgré le brouillard (hors de la capture des reflets : elle éblouirait tout le quai)
  H.tour=new THREE.Group();add(H.tour);into({root:H.tour,colliders:[],particles:[],shafts:[],flickers:[],lanterns:[],flames:[],lumieres:[]});
  {const[c,e]=texTour(r),tc=canvasTex(c,true),te=canvasTex(e,true);tc.repeat.set(2,1);te.repeat.set(2,1);
    const mat=new THREE.MeshStandardMaterial({map:tc,emissive:0xffffff,emissiveMap:te,emissiveIntensity:1.4,roughness:.25,metalness:.7,envMapIntensity:.6,fog:false});
    const f=new THREE.Mesh(new THREE.BoxGeometry(46,216,38),mat);f.position.set(0,122,-115);add(f);
    const couronne=new THREE.Mesh(new THREE.CylinderGeometry(14,23,16,8),new THREE.MeshStandardMaterial({color:0x101318,roughness:.4,metalness:.8,fog:false}));couronne.position.set(0,238,-115);add(couronne);
    for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.5-i*.1,.6-i*.1,12,8),new THREE.MeshStandardMaterial({color:0x1a1d22,metalness:.8,roughness:.4,fog:false}));m.position.set(0,252+i*12,-115);add(m)}
    H.balises=[];for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.9,10,8),glow(0xff2020,3));b.material.fog=false;b.position.set(0,247+i*10,-115+(i%2?.9:-.9));add(b);H.balises.push(b)}
    const logo=neon('HELIX','#ffb347',30,8,0,205,-95.8,0,{fog:false,ppm:24,glow:2.2});logo.material.fog=false}
  into(Z);
  // l'écran géant : « SOYEZ ENTIER. » et le compte à rebours de la K7.2
  {const[c,g]=mk(1024,512);ecran.c=c;ecran.g=g;ecran.t=canvasTex(c);ecran.txt='';
    const m=new THREE.Mesh(new THREE.PlaneGeometry(40,20),new THREE.MeshBasicMaterial({map:ecran.t,toneMapped:false,fog:false}));m.material.color.setScalar(1.6);m.position.set(0,44,-95.9);add(m);H.ecran=m}
  Z.cacherEnv=[H.tour,H.ecran];

  flushLedges();
  Z.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.receiveShadow=true});
  into(null);
};
Z.update=(dt,S)=>{
  if(!H.eau)return;
  H.eau.offset.x+=dt*.012;H.eau.offset.y-=dt*.03;
  H.feu.intensity=2+Math.sin(T*17)*.4+Math.sin(T*7.3)*.3;
  H.balises.forEach((b,i)=>{b.visible=Math.sin(T*2.4-i*.7)>.2});
  majEcran(S.heure);
};

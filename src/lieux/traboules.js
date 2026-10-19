// Les traboules de la Croix-Rousse (chapitre 4) : passages voûtés, cours, la cour des Voraces et son grand escalier,
// l'atelier des Nouveaux Canuts (refuge) et celui de Varga, plein de métiers Jacquard. Puis la galerie vers les quais.
// Sol à y = 0. Les passages sont couverts (pas de pluie), les cours à ciel ouvert.
// Plan (vu de dessus, le nord vers −Z) : A arrivée sous la trappe (0,0) → B passage voûté → C première cour (0,−29)
// → D long passage vers l'ouest, deux alcôves → E cour des Voraces (−40,−30) → porte des Canuts → F refuge (−41,−54)
// → G atelier de Varga (−59,−54) → H galerie des câbles, vers le nord, jusqu'aux quais.
import {THREE,V3,mulberry32,T} from '../core.js';
import {into,add,pushCol,M,glow,addBox,plight,cable,neon,bmats,boxGeoWorldUV,ledgesFor,flushLedges,lampeCassable,steam,fusion} from '../construire.js';
import {makeZone,constructeurs} from '../zones.js';
import {makeGardien} from '../gardiens.js';
import {habiller,nameTag} from '../personnages.js';
import {canvasTex,mk,texPierre,texPaves} from '../textures.js';

// Zones à ciel ouvert : la première cour et la cour des Voraces
const COURS=[[-10,10,-38,-20],[-50,-30,-46,-14]];
const dehors=p=>COURS.some(c=>p.x>c[0]&&p.x<c[1]&&p.z>c[2]&&p.z<c[3]);
export const Z=makeZone('traboules',{fog:0x07080c,fogD:.04,hemi:.16,envPos:[0,2,-29],
  indoor:p=>!dehors(p),
  // pierre sous les voûtes (avec écho), pavés mouillés dans les cours, plancher dans les ateliers
  surfaceAt:p=>p.z<-46&&p.z>-62&&p.x<-31.7?'bois':dehors(p)?'asphalt':'tile',
});
export const H={};
Z.sons=[{type:'vapeur',pos:[-30.5,.3,-30.2],vol:.25},{type:'neon',pos:[-41.3,2.75,-45.9],vol:.15}];

/* ---------- Matières : pierre et pavés (textures.js), plancher ---------- */
function texPlancher(r){const[c,g]=mk(512,512);for(let i=0;i<8;i++){const v=58+Math.floor(r()*20);g.fillStyle=`rgb(${v+18},${v+4},${v-10})`;g.fillRect(0,i*64,512,62);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,i*64+62,512,2);
  for(let k=0;k<12;k++){g.fillStyle=`rgba(30,18,10,${.1+r()*.15})`;g.fillRect(r()*512,i*64+r()*60,40+r()*120,1+r()*2)}}return c}

// Fils de chaîne : de fines lignes crème sur fond transparent.
function texFils(){const[c,g]=mk(256,8);g.clearRect(0,0,256,8);g.fillStyle='rgba(228,212,176,.8)';for(let x=0;x<256;x+=4)g.fillRect(x,0,1.4,8);return c}
// Le fond du grand escalier : enduit ocre taché de pluie, portes palières et fenêtres, étage par étage (64 px par mètre).
// Renvoie la texture et la carte des fenêtres allumées.
function texEscalier(r){const W=1024,Hh=1152,k=64;const[c,g]=mk(W,Hh),[e,ge]=mk(W,Hh);
  g.fillStyle='#8f6a45';g.fillRect(0,0,W,Hh);ge.fillStyle='#000';ge.fillRect(0,0,W,Hh);
  for(let i=0;i<300;i++){const v=r()<.5;g.fillStyle=`rgba(${v?55:160},${v?38:118},${v?22:78},${.05+r()*.09})`;g.fillRect(r()*W,r()*Hh,20+r()*140,10+r()*70)}
  for(let i=0;i<60;i++){const x=r()*W,l=80+r()*420,y=r()*Hh;const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(28,20,12,.4)');gr.addColorStop(1,'rgba(28,20,12,0)');g.fillStyle=gr;g.fillRect(x,y,4+r()*12,l)}
  for(let f=0;f<5;f++){const yb=Hh-f*3.6*k;
    [-46,-42,-38,-34].forEach((bx,i)=>{const cx=(bx+48)*k;if(f===0&&bx===-42)return; // la porte des Canuts est un vrai volume
      if((i+f)%2===0){g.fillStyle='#24170e';g.fillRect(cx-34,yb-2.25*k,68,2.25*k);g.strokeStyle='#4a3424';g.lineWidth=5;g.strokeRect(cx-34,yb-2.25*k,68,2.25*k);g.fillStyle='#b08a50';g.fillRect(cx+20,yb-1.15*k,6,6)}
      else{const y=yb-2.7*k,lit=r()<.55;g.fillStyle='#161210';g.fillRect(cx-28,y,56,1.3*k);if(lit){ge.fillStyle='#ffb060';ge.fillRect(cx-24,y+5,48,1.3*k-10);g.fillStyle='#d9a060';g.fillRect(cx-24,y+5,48,1.3*k-10)}
        g.fillStyle='#3a2a1a';g.fillRect(cx-1,y,3,1.3*k);g.fillRect(cx-28,y+.6*k,56,3)}})}
  return[c,e]}
// Voûte en berceau : demi-cylindre dont l'axe suit le passage et dont le sommet regarde vers le haut.
const BASE_Z=new THREE.Matrix4().makeBasis(new V3(0,1,0),new V3(0,0,1),new V3(1,0,0));
const BASE_X=new THREE.Matrix4().makeBasis(new V3(0,1,0),new V3(1,0,0),new V3(0,0,-1));

constructeurs.traboules=()=>{
  const r=mulberry32(1831); // l'année de la première révolte des canuts
  into(Z);
  const tP=canvasTex(texPierre(r),true),tV=canvasTex(texPaves(r),true),tB=canvasTex(texPlancher(r),true);
  const pierre=new THREE.MeshStandardMaterial({map:tP,bumpMap:tP,bumpScale:.03,roughness:.88,metalness:.05,envMapIntensity:.35});
  const voute=new THREE.MeshStandardMaterial({map:tP,roughness:.9,metalness:.05,envMapIntensity:.3,side:THREE.BackSide});
  const paves=new THREE.MeshStandardMaterial({map:tV,roughness:.32,metalness:.2,envMapIntensity:.8});
  const plancher=new THREE.MeshStandardMaterial({map:tB,roughness:.6,metalness:.05,envMapIntensity:.4});
  const bois=new THREE.MeshStandardMaterial({color:0x4a3626,roughness:.75});
  const tFils=canvasTex(texFils(),true);tFils.repeat.set(1,1);
  const MAT={bois:new THREE.MeshStandardMaterial({color:0x5a4130,roughness:.7}),fils:new THREE.MeshStandardMaterial({map:tFils,transparent:true,depthWrite:false,side:THREE.DoubleSide,roughness:.8}),
    tissu:new THREE.MeshStandardMaterial({color:0x6e1418,roughness:.55,metalness:.1}),creme:new THREE.MeshStandardMaterial({color:0xcdbb92,roughness:.85}),cartes:new THREE.MeshStandardMaterial({color:0xcdb88e,roughness:.95})};
  const fer=M.darkMetal;
  const sol=(x0,x1,z0,z1,mat,k)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(x1-x0)/k,uv.getY(i)*(z1-z0)/k);
    const m=new THREE.Mesh(g,mat);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,.003,(z0+z1)/2);m.receiveShadow=true;add(m);return m};
  const mur=(x0,x1,z0,z1,h=3.6,o={})=>addBox(x0,x1,z0,z1,o.y0||0,h,o.mat||pierre,{geo:boxGeoWorldUV(x1-x0,h-(o.y0||0),z1-z0,4),...o});
  // Linteau : maçonnerie au-dessus d'une ouverture, sans collision
  const linteau=(x0,x1,z0,z1,y0,y1)=>mur(x0,x1,z0,z1,y1,{y0,collide:false});
  const plafond=(x0,x1,z0,z1,h)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),new THREE.MeshStandardMaterial({color:0x1a1714,roughness:.95}));m.rotation.x=Math.PI/2;m.position.set((x0+x1)/2,h,(z0+z1)/2);add(m)};
  const berceau=(x0,x1,z0,z1,axe,h=2.5)=>{const w=axe==='z'?x1-x0:z1-z0,L=axe==='z'?z1-z0:x1-x0;
    const geo=new THREE.CylinderGeometry(w/2,w/2,L,18,1,true,0,Math.PI),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.PI*w/2/4,uv.getY(i)*L/4);
    const m=new THREE.Mesh(geo,voute);m.quaternion.setFromRotationMatrix(axe==='z'?BASE_Z:BASE_X);m.position.set((x0+x1)/2,h,(z0+z1)/2);add(m);return m};
  const lampe=(x,y,z,c=0xffb46a,o={})=>lampeCassable(x,y,z,c,{int:o.int??1.5,dist:o.dist??8,r:o.r??3.4});
  const tonneau=(x,z)=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.34,.32,.9,16),bois);b.position.set(x,.45,z);add(b);pushCol({x0:x-.34,x1:x+.34,z0:z-.34,z1:z+.34,los:false,off:false})};

  /* ---------- A. L'arrivée sous la trappe ---------- */
  sol(-2.4,2.4,-3,1.5,pierre,3);mur(-2.4,2.4,1.5,1.8);mur(-2.6,-2.4,-3,1.8);mur(2.4,2.6,-3,1.8);plafond(-2.6,2.6,-3,1.8,3.2);
  mur(-2.6,-1.2,-3.25,-3,3.2);mur(1.2,2.6,-3.25,-3,3.2);linteau(-1.3,1.3,-3.12,-3,3.2,3.9);
  for(let y=.3;y<3.2;y+=.35)addBox(-.4,.4,1.38,1.46,y,y+.05,fer,{collide:false});for(const x of[-.42,.42])addBox(x-.03,x+.03,1.38,1.46,0,3.3,fer,{collide:false});
  {const tr=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),glow(0x2a3550,.6));tr.rotation.x=Math.PI/2;tr.position.set(0,3.19,1);add(tr)}
  /* ---------- B. Premier passage voûté ---------- */
  sol(-1.2,1.2,-20,-3,pierre,3);mur(-1.45,-1.2,-20,-3,2.5);mur(1.2,1.45,-20,-3,2.5);berceau(-1.2,1.2,-20,-3,'z');
  H.lB1=lampe(-1.1,2.2,-7);H.lB2=lampe(1.1,2.2,-15);
  cable(-1.1,2.3,-3.2,-1.1,2.3,-19.8,.08,0);
  /* ---------- C. Première cour (à ciel ouvert) ---------- */
  sol(-10,10,-38,-20,paves,2);
  // Façades hautes tout autour, avec les ouvertures des passages (et la maçonnerie au-dessus)
  const fac=(x0,x1,z0,z1,h)=>{addBox(x0,x1,z0,z1,0,h,bmats[Math.floor(r()*4)],{geo:boxGeoWorldUV(x1-x0,h,z1-z0,24)});ledgesFor(x0,x1,z0,z1,h)};
  fac(-10.5,-1.2,-20.5,-20,18);fac(1.2,10.5,-20.5,-20,18);fac(-10.5,10.5,-38.5,-38,20);fac(10,10.5,-38,-20,16);fac(-10.5,-10,-38,-31,16);fac(-10.5,-10,-28.6,-20,16);
  linteau(-1.2,1.2,-20.5,-20,2.5,18);linteau(-10.5,-10,-31,-28.6,2.5,16);
  // Puits au milieu, linge, tonneaux
  {const p=new THREE.Mesh(new THREE.CylinderGeometry(1,1.05,.9,24),pierre);p.position.set(0,.45,-29);add(p);pushCol({x0:-1,x1:1,z0:-30,z1:-28,los:false,off:false});
    const e=new THREE.Mesh(new THREE.CircleGeometry(.85,24),new THREE.MeshStandardMaterial({color:0x05070a,roughness:.1,metalness:.6}));e.rotation.x=-Math.PI/2;e.position.set(0,.86,-29);add(e);
    for(const x of[-.85,.85])addBox(x-.05,x+.05,-29.05,-28.95,.9,2.4,fer,{collide:false});addBox(-.9,.9,-29.04,-28.96,2.35,2.45,fer,{collide:false})}
  for(const[x,z]of[[7.5,-36],[8.4,-35.4],[-8,-23],[7.8,-22.6]])tonneau(x,z);
  addBox(-9.6,-7.6,-37.6,-36.4,0,1.1,bois,{los:false});addBox(5.5,7.2,-24,-22.6,0,1.25,bois,{los:false});
  cable(-10,6,-25,10,6.4,-33,.9,0);for(let i=0;i<7;i++){const t=i/6,x=-10+t*20,z=-25-t*8,y=6.2-Math.sin(t*Math.PI)*.85;const m=new THREE.Mesh(new THREE.PlaneGeometry(.6,.8),new THREE.MeshStandardMaterial({color:[0x6a5a4a,0x7a3030,0xa8a090][i%3],roughness:1,side:THREE.DoubleSide}));m.position.set(x,y-.45,z);m.rotation.y=.4;add(m)}
  H.lC1=lampe(-9.9,3,-26);H.lC2=lampe(9.9,3,-33,0xd9e8ff);H.lC3=lampe(4,3,-37.9);
  makeGardien(Z,[[-6,-34],[6,-34],[6,-24],[-6,-24]],{boucle:true,yaw:Math.PI/2,attente:1.6});
  makeGardien(Z,[[-8.2,-26.5],[-8.2,-35]],{yaw:Math.PI,attente:3.2,vue:10});
  /* ---------- D. Le long passage, avec deux alcôves pour se cacher ---------- */
  sol(-30,-10,-31,-28.6,pierre,3);mur(-30,-10,-28.6,-28.35,2.5);
  // Mur nord percé de deux alcôves profondes
  mur(-30,-24.2,-31.25,-31,2.5);mur(-22.6,-16.2,-31.25,-31,2.5);mur(-14.6,-10,-31.25,-31,2.5);
  for(const x0 of[-24.2,-16.2]){sol(x0,x0+1.6,-32.9,-31,pierre,3);mur(x0-.25,x0,-32.9,-31,2.5);mur(x0+1.6,x0+1.85,-32.9,-31,2.5);mur(x0-.25,x0+1.85,-33.15,-32.9,2.5);plafond(x0,x0+1.6,-32.9,-31,2.5)}
  berceau(-30,-10,-31,-28.6,'x');
  H.lD1=lampe(-26,2.2,-28.7);H.lD2=lampe(-13,2.2,-28.7);
  makeGardien(Z,[[-28.5,-29.8],[-11.5,-29.8]],{yaw:Math.PI/2,attente:2.4,vue:11});
  /* ---------- E. La cour des Voraces ---------- */
  sol(-50,-30,-46,-14,paves,2);
  fac(-50.5,-50,-46,-14,22);fac(-50.5,-29.5,-14.5,-14,20);fac(-30,-29.5,-28.6,-14,18);fac(-30,-29.5,-46,-31,18);
  linteau(-30,-29.5,-31,-28.6,2.5,18);
  // Le grand escalier : cinq étages d'arcades ouvertes, paliers éclairés, contre le mur du fond (qui ferme aussi l'atelier des Canuts)
  {const z0=-46,z1=-42,x0=-48,x1=-32;
    addBox(-50.5,-29.5,z0-.6,z0,0,19,pierre,{geo:boxGeoWorldUV(21,19,.6,4)});
    {const[c,e]=texEscalier(r);const m=new THREE.Mesh(new THREE.PlaneGeometry(16,18),new THREE.MeshStandardMaterial({map:canvasTex(c),emissive:0xffffff,emissiveMap:canvasTex(e),emissiveIntensity:.9,roughness:.92,envMapIntensity:.3}));
      m.position.set((x0+x1)/2,9,z0+.02);add(m)}
    for(let f=0;f<5;f++){const y=f*3.6;
      addBox(x0,x1,z0,z1,y+3.25,y+3.6,pierre,{collide:false});
      for(const x of[x0,x0+4,x0+8,x0+12,x1])addBox(x-.35,x+.35,z1-.7,z1,y,y+3.25,pierre,{collide:f===0,los:false});
      // volées de marches en diagonale derrière les arcades
      const v=new THREE.Mesh(new THREE.BoxGeometry(5.4,.25,1.4),pierre);v.position.set(f%2?x0+5:x1-5,y+1.8,z0+1.6);v.rotation.z=(f%2?1:-1)*.62;add(v);
      // une lampe par palier, contre le fond : les arcades se découpent sur l'enduit éclairé
      {const l=plight(0xffa65a,f?1.5:1.2,f?10:8,f?(x0+x1)/2:-39.2,y+2.5,z0+1.4);const b=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),glow(0xffb46a,2.2));b.position.copy(l.position);add(b)}
      addBox(x0,x1,z1-.08,z1,y+3.6,y+4.5,fer,{collide:false});}
    pushCol({x0:-39.3,x1:-34.7,z0:-45.2,z1:-43.8,los:false,off:false}); // la première volée, au rez-de-chaussée
    // La porte de l'atelier des Canuts, sous l'enseigne (dehors) et vue de dedans
    const pm=new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.6});
    const p=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.4),pm);p.position.set(-41.3,1.2,-45.95);add(p);
    const pi=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.4),pm);pi.position.set(-41.3,1.2,-46.65);pi.rotation.y=Math.PI;add(pi);
    for(const x of[-42.1,-40.5]){addBox(x-.1,x+.1,-46.12,-45.9,0,2.55,fer,{collide:false});addBox(x-.1,x+.1,-46.8,-46.58,0,2.55,fer,{collide:false})}
    H.enseigneCanuts=neon('NOUVEAUX CANUTS','#ffb347',2.6,.48,-41.3,2.9,-45.88,0,{glow:1.6,size:.66,ppm:200});}
  {const[c,g]=mk(1024,256);g.fillStyle='rgba(0,0,0,0)';g.fillRect(0,0,1024,256);g.fillStyle='rgba(220,210,190,.82)';g.font='600 64px "Saira Condensed",sans-serif';g.textAlign='center';
    g.fillText('VIVRE EN TRAVAILLANT',512,100);g.fillText('OU MOURIR EN COMBATTANT',512,180);
    const t=canvasTex(c),m=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshStandardMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.22,transparent:true,roughness:.9}));m.position.set(-49.97,3.4,-30);m.rotation.y=Math.PI/2;add(m)}
  for(const[x,z]of[[-34,-18],[-46,-17],[-33,-40]])tonneau(x,z);
  addBox(-47.5,-45.5,-24,-22.4,0,1.2,bois,{los:false});addBox(-36,-33.8,-31,-29.4,0,1.1,bois,{los:false});
  H.lE1=lampe(-49.9,3,-22);H.lE2=lampe(-30.1,3,-20,0xd9e8ff);H.lE3=lampe(-49.9,3,-38);
  makeGardien(Z,[[-46,-20],[-34,-20],[-34,-36],[-46,-36]],{boucle:true,yaw:Math.PI/2,attente:1.8});
  makeGardien(Z,[[-41.3,-40.5],[-41.3,-25]],{yaw:0,attente:3,vue:11});
  steam(-30.5,.2,-30.2,0x8a8f9a,{n:20,rate:3,a:.1,s1:2,up:.5,life:3});
  /* ---------- F. L'atelier des Nouveaux Canuts (refuge) ---------- */
  sol(-50,-32,-62,-46,plancher,3);plafond(-50,-32,-62,-46,4.2);
  mur(-50.3,-50,-62,-56.4,4.2);mur(-50.3,-50,-54.6,-46,4.2);mur(-50,-32,-62.3,-62,4.2);mur(-32,-31.7,-62,-46,4.2);
  linteau(-50.3,-50,-56.4,-54.6,2.4,4.2);
  // Métiers à tisser : bâti, ensouples, nappe de fils, lames, battant, banc ; le Jacquard a sa mécanique et ses cordes en plus.
  // Fusionnés par matière (quelques appels de dessin par métier). Le banc est du côté +z local.
  const metier=(x,z,ry=0,s=1,jacquard=false)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;g.scale.setScalar(s);add(g);
    const P={bois:[],fils:[],tissu:[],creme:[],cartes:[]};
    const B=(k,w,h,d,px,py,pz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d));m.position.set(px,py,pz);P[k].push(m);return m};
    const C=(k,r,L,px,py,pz)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,14));m.rotation.z=Math.PI/2;m.position.set(px,py,pz);P[k].push(m);return m};
    const F=(w,h,px,py,pz,rx=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h));m.rotation.x=rx;m.position.set(px,py,pz);P.fils.push(m);return m};
    for(const a of[-1.1,1.1])for(const b of[-.6,.6])B('bois',.1,2.4,.1,a,1.2,b);
    for(const b of[-.6,.6])B('bois',2.3,.1,.1,0,2.35,b);for(const a of[-1.1,1.1]){B('bois',.1,.1,1.3,a,2.35,0);B('bois',.08,.08,1.3,a,.3,0)}
    B('bois',2.2,.1,.12,0,.95,.62);C('bois',.07,2.1,0,.62,.6);C('tissu',.11,1.7,0,.62,.6);C('bois',.08,2.1,0,.85,-.62);C('creme',.14,1.8,0,.85,-.62);
    F(1.8,1.25,0,.985,-.02,-Math.PI/2);const t=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.36));t.rotation.x=-Math.PI/2;t.position.set(0,.99,.42);P.tissu.push(t);
    for(const zz of[-.12,.04]){B('bois',1.9,.04,.03,0,1.55,zz);B('bois',1.9,.04,.03,0,.6,zz);F(1.9,.95,0,1.075,zz)}
    B('bois',2,.07,.07,0,1.45,.3);for(const a of[-1,1])B('bois',.05,.7,.05,a,1.1,.3);F(1.9,.32,0,1.12,.3);
    B('bois',1.3,.06,.32,0,.55,1.05);for(const a of[-.6,.6])for(const b of[.93,1.17])B('bois',.06,.53,.06,a,.27,b);
    if(jacquard){B('bois',1.3,.62,.95,0,2.72,0);B('bois',.08,.5,.08,-.55,2.1,-.4);B('bois',.08,.5,.08,.55,2.1,-.4);F(1.8,.82,0,1.98,-.25);
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2,c=B('cartes',.04,.02,.32,.78+Math.cos(a)*.34,2.72+Math.sin(a)*.34,0);c.rotation.z=a}
      B('bois',.36,.26,.62,1.27,.92,0);B('cartes',.3,.04,.5,1.27,1.07,0)}
    for(const k in P)if(P[k].length){const m=fusion(P[k],MAT[k]);m.castShadow=k==='bois';g.add(m)}
    // Collision : le bâti et le banc, dans le repère du monde
    const cs=Math.cos(ry),sn=Math.sin(ry),pts=[[-1.25,-.75],[1.25,-.75],[-1.25,1.25],[1.25,1.25]].map(([a,b])=>[x+(a*cs+b*sn)*s,z+(-a*sn+b*cs)*s]);
    pushCol({x0:Math.min(...pts.map(p=>p[0])),x1:Math.max(...pts.map(p=>p[0])),z0:Math.min(...pts.map(p=>p[1])),z1:Math.max(...pts.map(p=>p[1])),los:false,off:false});return g};
  metier(-46,-58);metier(-46,-50.5);addBox(-38,-34,-61.5,-60.5,0,.95,bois,{los:false});addBox(-35.5,-32.4,-55,-50,0,.95,bois,{los:false});
  for(const[x,z]of[[-40,-50.5],[-37,-58]]){const l=plight(0xffa65a,2,12,x,3.4,z);const b=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),glow(0xffb46a,2.4));b.position.copy(l.position);add(b);
    addBox(x-.01,x+.01,z-.01,z+.01,3.5,4.2,fer,{collide:false})}
  // Le coin des Canuts : caisses, outils, une affiche de 1831
  for(const[x,z,w]of[[-48.6,-61,1.1],[-47.4,-61.2,.8],[-33,-47.2,1]])addBox(x-w/2,x+w/2,z-w/2,z+w/2,0,w*.8,bois,{los:false});
  {const[c,g]=mk(256,384);g.fillStyle='#c9b48a';g.fillRect(0,0,256,384);g.fillStyle='#3a1010';g.font='700 46px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('LYON',128,70);g.fillText('1831',128,124);
    g.font='600 28px "Saira Condensed",sans-serif';g.fillText('LES CANUTS',128,330);g.fillStyle='#7a2a20';g.fillRect(48,150,160,140);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.2),new THREE.MeshStandardMaterial({map:canvasTex(c),roughness:.95}));m.position.set(-31.98,1.9,-57.5);m.rotation.y=-Math.PI/2;add(m)}
  H.ecranDecodeur=new THREE.Mesh(new THREE.PlaneGeometry(.6,.4),glow(0x58e6ff,1.4));H.ecranDecodeur.position.set(-33.4,1.25,-52.5);H.ecranDecodeur.rotation.y=-Math.PI/2;H.ecranDecodeur.visible=false;add(H.ecranDecodeur);
  // La porte de l'atelier de Varga (charnière côté nord ; elle s'ouvre vers l'atelier)
  H.porteAtelier=new THREE.Group();H.porteAtelier.position.set(-50.15,0,-54.6);add(H.porteAtelier);
  {const b=new THREE.Mesh(new THREE.BoxGeometry(.1,2.4,1.8),new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.6}));b.position.set(0,1.2,-.9);H.porteAtelier.add(b)}
  H.porteAtelierCol=pushCol({x0:-50.3,x1:-50,z0:-56.4,z1:-54.6,los:true,off:false});
  /* ---------- G. L'atelier de Varga (métiers Jacquard, sombre) ---------- */
  sol(-68,-50,-62,-46,plancher,3);plafond(-68,-50,-62,-46,4.2);
  mur(-68.3,-68,-62,-46,4.2);mur(-68,-50,-46.3,-46,4.2);mur(-68,-66,-62.3,-62,4.2);mur(-64.6,-50,-62.3,-62,4.2);
  linteau(-66,-64.6,-62.3,-62,2.5,4.2);
  // Le grand Jacquard au milieu (son tiroir à cartes côté est), trois métiers ordinaires autour
  H.jacquard=metier(-59,-54.4,0,1.25,true);metier(-64.2,-49.6,Math.PI/2);metier(-53,-60.2,-Math.PI/2);metier(-64.6,-57.6,Math.PI);
  H.carteLum=plight(0x9fd8ff,.7,4,-56.9,1.9,-54.4);
  H.lG1=lampe(-55,3.6,-46.4,0xffd59a,{int:1.2});H.lG2=lampe(-67.8,3.4,-54,0xffd59a,{int:1.1});
  H.gardienG=makeGardien(Z,[[-62,-58.2],[-55.2,-58.2],[-55.2,-50.4],[-62,-50.4]],{boucle:true,yaw:Math.PI/2,attente:2,vue:10});
  /* ---------- H. La galerie des câbles, vers les quais ---------- */
  sol(-66,-64.6,-80,-62,pierre,3);mur(-66.25,-66,-80,-62,2.5);mur(-64.6,-64.35,-80,-62,2.5);berceau(-66,-64.6,-80,-62,'z',2.5);mur(-66.25,-64.35,-80.25,-80,2.5);
  for(let i=0;i<5;i++)cable(-65.95,1.6+i*.12,-62.5,-65.95,1.6+i*.12,-79.5,.04,0);
  H.lH=plight(0x58e6ff,.8,8,-65.3,2,-76);
  // La grille du bout, sur les quais : la lumière bleue de la ville passe à travers
  for(let i=0;i<7;i++)addBox(-65.95+i*.2,-65.91+i*.2,-79.95,-79.9,0,2.4,fer,{collide:false});
  H.porteGalerie=addBox(-66,-64.6,-62.2,-62,0,2.5,new THREE.MeshStandardMaterial({color:0x2a2622,roughness:.5,metalness:.6}),{});
  H.lecteur=new THREE.Mesh(new THREE.BoxGeometry(.12,.05,.02),glow(0xff3030,2));H.lecteur.position.set(-64.2,1.35,-61.93);add(H.lecteur);
  addBox(-64.32,-64.08,-62,-61.95,1.15,1.5,fer,{collide:false});

  /* ---------- Personnages ---------- */
  const pnj=(def,look)=>{const n=Object.assign({h:1.72,yaw:0},def);n.g=new THREE.Group();n.g.position.set(n.x,0,n.z);n.g.rotation.y=n.yaw;n.g.userData.pnj=true;add(n.g);
    n.tag=nameTag(n.name);n.tag.position.set(n.x,n.h+.55,n.z);add(n.tag);n.col=pushCol({x0:n.x-.3,x1:n.x+.3,z0:n.z-.3,z1:n.z+.3,los:false,off:false});
    habiller(n,look);Z.npcs.push(n);
    n.inter={p:new V3(n.x,0,n.z),r:2.6,on:()=>!n.absent,label:()=>'Parler à '+n.nom,act:()=>Z.talk&&Z.talk(n.dlg||n.key)};Z.inter.push(n.inter);return n};
  H.sid=pnj({key:'sid',name:'SID',nom:'Sid',x:.4,z:-4.5,yaw:Math.PI,h:1.76,dlg:'sidTrab'},'sid');
  H.rosa=pnj({key:'rosa',name:'ROSA DELORME',nom:'Rosa',x:-40.5,z:-54,yaw:0,h:1.64,dlg:'rosa'},'rosa');
  H.mara=pnj({key:'mara',name:'MARA',nom:'Mara',x:-36.4,z:-52.5,yaw:-Math.PI/2,h:1.72,dlg:'maraTrab'},'mara');
  H.nox=pnj({key:'nox',name:'NOX-7',nom:'Nox',x:-37.5,z:-48.4,yaw:Math.PI,h:1.76,dlg:'noxTrab'},'nox');
  H.varga=pnj({key:'varga',name:'DR ILSE VARGA',nom:'Varga',x:-37,z:-59.6,yaw:0,h:1.7,dlg:'varga'},'varga');
  // Deux canuts au travail, devant les métiers
  for(const[x,z,ry]of[[-46,-56.35,Math.PI],[-44.3,-50.4,-Math.PI/2]]){const n={h:1.7,g:new THREE.Group()};n.g.position.set(x,0,z);n.g.rotation.y=ry;add(n.g);habiller(n,'canut');Z.figurants.push(n);
    pushCol({x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3,los:false,off:false})}

  flushLedges();
  Z.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.receiveShadow=true});
  into(null);
};
Z.update=(dt,S)=>{
  if(!H.enseigneCanuts)return;
  H.enseigneCanuts.material.color.setScalar(Math.sin(T*7)>-.93?1.6:.5);
};
// Déplace un personnage (et son étiquette, sa collision, son interaction) ailleurs dans la zone.
export function deplacer(n,x,z,yaw){n.x=x;n.z=z;if(yaw!==undefined)n.yaw=yaw;n.g.position.set(x,0,z);n.g.rotation.y=n.yaw;n.tag.position.set(x,n.h+.55,z);
  Object.assign(n.col,{x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3});n.inter.p.set(x,0,z)}
export function montrer(n,v){n.absent=!v;n.g.visible=v;n.tag.visible=v;n.col.off=!v}

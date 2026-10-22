// L'intérieur de la tour Helix (chapitre 5), en trois endroits d'une même zone :
//  A. le hall (x −16..16) : marbre noir, l'hologramme « SOYEZ ENTIER. », l'accueil, deux Gardiens, une caméra, les ascenseurs ;
//  B. la cabine vitrée de l'ascenseur (x ≈ 41), pour la montée : la ville défile derrière la vitre ;
//  C. le 41e étage (x 100..152) : palier, couloir de sécurité et ses grilles laser, salle des serveurs, pupitre de l'override,
//     escalier vers le toit.
// On passe de l'un à l'autre par l'ascenseur (téléportation). Sol à y = 0, pas de pluie (sauf derrière les vitres).
import {THREE,V3,mulberry32,T,P,G,emit} from '../core.js';
import {into,add,pushCol,M,glow,addBox,plight,neon,boxGeoWorldUV,flushLedges,lampeCassable,steam,holoMat} from '../construire.js';
import {makeZone,constructeurs} from '../zones.js';
import {makeGardien} from '../gardiens.js';
import {makeCamera} from '../cameras.js';
import {canvasTex,mk} from '../textures.js';
import {moniteur,clavier,rangeeBaies,cheminCables,dallesPerforees} from '../ordinateurs.js';

export const Z=makeZone('tour',{fog:0x05060a,fogD:.018,hemi:.38,envPos:[0,3,2],ciel:false,pluie:false,indoor:()=>true,
  surfaceAt:()=>'tile'});
export const H={};
Z.sons=[{type:'neon',pos:[0,1.2,-2],vol:.25},{type:'vapeur',pos:[140,.3,0],vol:.18}];
Z.lasers=[];

// La ville la nuit, vue d'en haut à travers les vitres (texture émissive : rues, tours, néons).
// dense : la ville vue d'en haut, des tours sur toute la hauteur (vue de l'ascenseur).
function texVille(r,dense){const W=1024,Hh=1024,[c,g]=mk(W,Hh);g.fillStyle='#020308';g.fillRect(0,0,W,Hh);
  for(let i=0;i<(dense?140:70);i++){const x=r()*W,w=20+r()*70,h=dense?300+r()*720:80+r()*500,y=Hh-h;g.fillStyle=`rgb(${8+r()*10},${10+r()*10},${18+r()*14})`;g.fillRect(x,y,w,h);
    for(let yy=y+6;yy<Hh;yy+=9)for(let xx=x+4;xx<x+w-4;xx+=7)if(r()<.3){g.fillStyle=r()<.7?'#ffcf8a':'#9fd8ff';g.globalAlpha=.4+r()*.6;g.fillRect(xx,yy,3,4);g.globalAlpha=1}}
  for(let i=0;i<14;i++){g.fillStyle=['#ff3d9e','#58e6ff','#ffb347','#7dffc8'][i%4];g.globalAlpha=.8;g.fillRect(r()*W,Hh*(.3+r()*.6),18+r()*40,4+r()*6);g.globalAlpha=1}
  return c}
// La main K7 de l'hologramme, en traits, et le slogan
function texHolo(){const[c,g]=mk(512,1024);g.clearRect(0,0,512,1024);g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=7;g.lineJoin='round';
  const R=(x,y,w,h)=>{g.beginPath();g.roundRect?g.roundRect(x,y,w,h,14):g.rect(x,y,w,h);g.stroke()};
  R(150,420,210,230);R(205,650,100,170);for(const[x,l]of[[152,250],[205,300],[258,290],[311,240]]){R(x,420-l,46,l-10);for(let k=1;k<3;k++){g.beginPath();g.moveTo(x+6,420-l+k*l/3);g.lineTo(x+40,420-l+k*l/3);g.stroke()}}
  g.save();g.translate(150,560);g.rotate(-.75);R(-30,-150,48,170);g.restore();
  for(let i=0;i<6;i++){g.beginPath();g.arc(255,535,30+i*14,0,7);g.globalAlpha=.25;g.stroke();g.globalAlpha=1}
  g.font='700 92px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('SOYEZ',256,900);g.fillText('ENTIER.',256,985);return c}

constructeurs.tour=()=>{
  const r=mulberry32(600);into(Z);
  const marbre=new THREE.MeshStandardMaterial({color:0x0a0b0e,roughness:.12,metalness:.35,envMapIntensity:1.1});
  const panneau=new THREE.MeshStandardMaterial({color:0x2a2420,roughness:.55,metalness:.15,envMapIntensity:.6});
  const blanc=new THREE.MeshStandardMaterial({color:0xb8bec6,roughness:.4,metalness:.2,envMapIntensity:.7});
  const acier=new THREE.MeshStandardMaterial({color:0x6e747c,roughness:.3,metalness:.85,envMapIntensity:1.2});
  const sol=(x0,x1,z0,z1,mat)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),mat);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,.002,(z0+z1)/2);m.receiveShadow=true;add(m);return m};
  const plafond=(x0,x1,z0,z1,h,c=0x101216)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),new THREE.MeshStandardMaterial({color:c,roughness:.9}));m.rotation.x=Math.PI/2;m.position.set((x0+x1)/2,h,(z0+z1)/2);add(m)};
  const mur=(x0,x1,z0,z1,h,mat=panneau,o={})=>addBox(x0,x1,z0,z1,o.y0||0,h,mat,{geo:boxGeoWorldUV(x1-x0,h-(o.y0||0),z1-z0,4),...o});
  const tV=canvasTex(texVille(r));

  /* ---------- A. Le hall ---------- */
  sol(-16,16,-12,12,marbre);plafond(-16,16,-12,12,10);
  mur(-16,16,12,12.4,10);mur(16,16.4,-12,7,10);mur(16,16.4,9,12,10);mur(16,16.4,7,9,10,panneau,{y0:2.5,collide:false});
  mur(-16.4,-16,-12,12,10,panneau);
  // la façade vitrée (nord) : la ville, la pluie qui ruisselle, les montants
  {const v=new THREE.Mesh(new THREE.PlaneGeometry(32,10),new THREE.MeshBasicMaterial({map:tV,toneMapped:false}));tV.repeat.set(2,1);tV.wrapS=THREE.RepeatWrapping;v.material.color.setScalar(.9);v.position.set(0,5,-12.6);add(v);
    const[c,g]=mk(256,256);g.clearRect(0,0,256,256);for(let i=0;i<90;i++){const x=r()*256,y=r()*256,l=10+r()*60;g.strokeStyle=`rgba(200,220,255,${.08+r()*.15})`;g.lineWidth=1+r()*1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*3,y+l);g.stroke()}
    H.ruissellement=canvasTex(c,true);H.ruissellement.repeat.set(8,2.5);const p=new THREE.Mesh(new THREE.PlaneGeometry(32,10),new THREE.MeshBasicMaterial({map:H.ruissellement,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));p.position.set(0,5,-12.15);add(p)}
  for(let x=-16;x<=16;x+=4)addBox(x-.08,x+.08,-12.2,-12,0,10,M.darkMetal,{collide:false});for(const y of[3.4,6.8])addBox(-16,16,-12.2,-12.05,y,y+.1,M.darkMetal,{collide:false});
  pushCol({x0:-16,x1:16,z0:-12.6,z1:-12,los:true,off:false});
  // la porte de service, à l'est, par où l'on entre
  addBox(16,16.3,7,9,0,2.5,new THREE.MeshStandardMaterial({color:0x2e3238,roughness:.4,metalness:.7}),{});
  // le logo HELIX au-dessus de l'accueil
  neon('HELIX','#ffb347',9,2.4,0,7.6,11.9,Math.PI,{weight:700,glow:1.8});
  neon('Biotech · Lyon-Confluence','#ffd59a',6,.5,0,6,11.9,Math.PI,{weight:500,size:.6,glow:1.2});
  // l'accueil : un comptoir en arc
  {const f=new THREE.Shape();f.absarc(0,0,6.2,-.62,.62,false);f.absarc(0,0,5.5,.62,-.62,true);
    const geo=new THREE.ExtrudeGeometry(f,{depth:1.08,bevelEnabled:false,curveSegments:24});geo.rotateX(-Math.PI/2);geo.rotateY(-Math.PI/2);
    const m=new THREE.Mesh(geo,blanc);m.position.set(0,0,.5);add(m);
    const b=new THREE.Mesh(new THREE.TorusGeometry(5.48,.025,6,40,1.24),glow(0x58e6ff,1.8));b.rotation.x=Math.PI/2;b.rotation.z=Math.PI/2-.62;b.position.set(0,.98,.5);add(b);
    pushCol({x0:-3.6,x1:3.6,z0:5.4,z1:6.8,los:false,off:false})}
  // colonnes, bacs à plantes, banquettes
  for(const[x,z]of[[-8,-6],[8,-6],[-8,6.5],[8,6.5]])mur(x-.7,x+.7,z-.7,z+.7,10,new THREE.MeshStandardMaterial({color:0x17191e,roughness:.3,metalness:.5,envMapIntensity:1}));
  for(const[x,z]of[[-12.5,-9],[12.5,-9],[-12.5,9.6],[13.6,-3]]){addBox(x-1,x+1,z-.6,z+.6,0,.7,M.darkMetal,{los:false});const f=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,1),new THREE.MeshStandardMaterial({color:0x1a3a22,roughness:.9,flatShading:true}));f.scale.set(1.1,.8,.7);f.position.set(x,1.2,z);add(f)}
  for(const x of[-4,4])addBox(x-1.6,x+1.6,-10.6,-9.6,0,.55,new THREE.MeshStandardMaterial({color:0x3a1f1a,roughness:.7}),{los:false});
  // l'hologramme
  H.holo=new THREE.Group();H.holo.position.set(0,0,-2);add(H.holo);
  {const mat=holoMat(texHolo(),0x7fe6ff,1.6);H.holoMat=mat;for(const a of[0,Math.PI/2]){const p=new THREE.Mesh(new THREE.PlaneGeometry(3.2,6.4),mat);p.position.y=4.2;p.rotation.y=a;H.holo.add(p)}
    const socle=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,.35,32),M.darkMetal);socle.position.y=.17;H.holo.add(socle);
    const anneau=new THREE.Mesh(new THREE.TorusGeometry(1.25,.05,8,40),glow(0x58e6ff,2.4));anneau.rotation.x=Math.PI/2;anneau.position.y=.36;H.holo.add(anneau);
    pushCol({x0:-1.6,x1:1.6,z0:-3.6,z1:-.4,los:false,off:false});plight(0x58e6ff,2.2,16,0,3,-2)}
  // suspensions qu'on peut abattre
  H.lH1=lampeCassable(-7,6.6,-1,0xfff0dc,{int:1.8,dist:13,r:6});H.lH2=lampeCassable(7,6.6,-1,0xfff0dc,{int:1.8,dist:13,r:6});
  H.lH3=lampeCassable(-11,6.6,7,0xfff0dc,{int:1.4,dist:11,r:5});H.lH4=lampeCassable(11,6.6,7,0xfff0dc,{int:1.4,dist:11,r:5});
  for(const[x,z]of[[-7,-1],[7,-1],[-11,7],[11,7]])addBox(x-.01,x+.01,z-.01,z+.01,6.7,10,M.darkMetal,{collide:false});
  // les ascenseurs, à l'ouest
  for(const z of[-6,-1,4]){addBox(-16,-15.9,z-1.25,z+1.25,0,3,acier,{collide:false});addBox(-15.95,-15.85,z-1.45,z+1.45,3,3.2,M.darkMetal,{collide:false});
    const n=new THREE.Mesh(new THREE.PlaneGeometry(.5,.18),glow(z===-1?0x58e6ff:0x406070,1.6));n.position.set(-15.84,3.45,z);n.rotation.y=Math.PI/2;add(n)}
  H.boutonAsc=new THREE.Mesh(new THREE.BoxGeometry(.04,.12,.08),glow(0xff3030,2));H.boutonAsc.position.set(-15.86,1.25,.6);add(H.boutonAsc);
  // Gardiens et caméra
  makeGardien(Z,[[-5.2,-7.4],[5.2,-7.4],[5.2,3.2],[-5.2,3.2]],{boucle:true,yaw:Math.PI/2,attente:1.6});
  makeGardien(Z,[[-13.4,-7.6],[-13.4,6.4]],{yaw:0,attente:2.6,vue:11});
  H.camHall=makeCamera(Z,{x:-15.3,y:4.6,z:-9.5,yaw:1,amp:.55,vitesse:.3,portee:15,inclinaison:.3});

  /* ---------- B. La cabine vitrée de l'ascenseur (pour la montée) ---------- */
  {const x0=39.5,x1=42.5;sol(x0,x1,-1.5,1.5,new THREE.MeshStandardMaterial({color:0x1a1c22,roughness:.4,metalness:.6}));plafond(x0,x1,-1.5,1.5,2.8,0x202328);
    mur(x0-.1,x0,-1.5,1.5,2.8,acier);mur(x0,x1,-1.6,-1.5,2.8,acier);mur(x0,x1,1.5,1.6,2.8,acier);
    const vitre=new THREE.Mesh(new THREE.PlaneGeometry(3,2.8),new THREE.MeshStandardMaterial({color:0x101820,transparent:true,opacity:.18,roughness:.05,metalness:.9}));vitre.position.set(x1,1.4,0);vitre.rotation.y=-Math.PI/2;add(vitre);
    const l=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.6),glow(0xe8f4ff,1.4));l.rotation.x=Math.PI/2;l.position.set(41,2.79,0);add(l);plight(0xd8ecff,1,5,41,2.4,0);
    // la ville derrière la vitre : elle descend pendant la montée
    const tv=canvasTex(texVille(r,true));const v=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshBasicMaterial({map:tv,toneMapped:false}));v.position.set(70,8,0);v.rotation.y=-Math.PI/2;add(v);H.villeAsc=v;
    const[c,g]=mk(256,128);H.etage={c,g,t:canvasTex(c)};const e=new THREE.Mesh(new THREE.PlaneGeometry(.6,.3),new THREE.MeshBasicMaterial({map:H.etage.t,toneMapped:false}));e.position.set(39.52,2.35,0);e.rotation.y=Math.PI/2;add(e);afficherEtage(0)}

  /* ---------- C. Le 41e étage ---------- */
  const bleu=new THREE.MeshStandardMaterial({color:0x7a828c,roughness:.35,metalness:.1,envMapIntensity:.6});
  // palier
  sol(100,106,-3,3,marbre);plafond(100,106,-3,3,3.2);mur(99.6,100,-3,3,3.2,acier);mur(100,106,-3.3,-3,3.2,bleu);mur(100,106,3,3.3,3.2,bleu);
  mur(105.7,106,-3,-1.6,3.2,bleu);mur(105.7,106,1.6,3,3.2,bleu);
  neon('41','#58e6ff',.9,.5,104,2.4,-2.95,0,{weight:700,glow:1.6});
  // couloir de sécurité et ses grilles laser
  sol(106,130,-1.6,1.6,new THREE.MeshStandardMaterial({color:0x5a6068,roughness:.25,metalness:.1,envMapIntensity:.8}));plafond(106,130,-1.6,1.6,3.2,0x8a929c);
  mur(106,130,-1.9,-1.6,3.2,bleu);mur(106,130,1.6,1.9,3.2,bleu);
  for(let x=108;x<130;x+=4){const b=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.12),glow(0xd8f0ff,1.6));b.rotation.x=Math.PI/2;b.position.set(x,3.19,0);add(b)}
  lampeCassable(112,3.05,0,0xd8ecff,{int:.9,dist:12,r:8,cassable:false});lampeCassable(124,3.05,0,0xd8ecff,{int:.9,dist:12,r:8,cassable:false});
  // le boîtier qui alimente les grilles, sur le palier : une balle bien placée, et elles s'éteignent
  addBox(105.3,105.65,-1.55,-1.3,1.9,2.7,new THREE.MeshStandardMaterial({color:0x3a3e46,roughness:.5,metalness:.6}),{collide:false});
  H.fusible=lampeCassable(105.28,2.45,-1.42,0xff3030,{int:0,dist:1,r:0});H.fusible.fusible=true;H.fusible.head.scale.setScalar(.45);
  // une grille : montants, cinq faisceaux ; allumée (per, on, ph) elle repère quiconque la traverse
  const grille=(x,per,on,ph)=>{const g=new THREE.Group();g.position.set(x,0,0);add(g);
    for(const z of[-1.55,1.55]){const m=new THREE.Mesh(new THREE.BoxGeometry(.14,2.4,.08),M.darkMetal);m.position.set(0,1.2,z);g.add(m)}
    const fx=[];for(const y of[.25,.6,.95,1.3,1.65,2])for(const z of[0]){const f=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,3.1),glow(0xff2a2a,3));f.position.set(0,y,z);g.add(f);fx.push(f)}
    const l={x,per,on,ph,fx,g,actif:true};Z.lasers.push(l);return l};
  H.grilles=[grille(112,3.4,1.9,0),grille(118,2.8,1.5,1.1),grille(124,3,1.7,2.2)];
  H.camCouloir=makeCamera(Z,{x:129.4,y:2.75,z:1.2,yaw:-Math.PI/2-.12,amp:.12,vitesse:.6,portee:20,fov:.3,inclinaison:.12});
  // salle des serveurs
  sol(130,152,-12,12,new THREE.MeshStandardMaterial({color:0x14171c,roughness:.3,metalness:.4,envMapIntensity:.8}));plafond(130,152,-12,12,5,0x0c0e12);
  mur(130,130.3,-12,-1.6,5,M.darkMetal);mur(130,130.3,1.6,12,5,M.darkMetal);mur(130,152,-12.3,-12,5,M.darkMetal);mur(130,152,12,12.3,5,M.darkMetal);mur(152,152.3,-12,12,5,M.darkMetal);
  linteauPorte();function linteauPorte(){mur(130,130.3,-1.6,1.6,5,M.darkMetal,{y0:3.2,collide:false})}
  // quatre rangées de baies (façades détaillées, diodes qui clignotent), allées froides en dalles perforées, chemins de câbles
  [-9.5,-6,6,9.5].forEach((z,i)=>{rangeeBaies(133,147,z-.5,z+.5,2.4,{graine:31+i});cheminCables(133,147,z,3.05)});
  dallesPerforees(133,147,-9,-6.5);dallesPerforees(133,147,6.5,9);
  for(const z of[-7.75,7.75]){const b=new THREE.Mesh(new THREE.PlaneGeometry(14,.05),glow(0x58e6ff,1.4));b.rotation.x=-Math.PI/2;b.position.set(140,.02,z);add(b)}
  for(const z of[-7.8,7.8]){const l=plight(0x4aa8ff,1.2,12,140,4.2,z)}
  steam(140,.1,-7.8,0x8aa8c8,{n:24,rate:4,a:.06,s1:3,up:.12,life:5,spread:8,wind:.05});steam(140,.1,7.8,0x8aa8c8,{n:24,rate:4,a:.06,s1:3,up:.12,life:5,spread:8,wind:.05});
  // le grand écran du compte à rebours et le pupitre de l'override
  {const[c,g]=mk(1024,576);H.ecran={c,g,t:canvasTex(c),txt:''};const e=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:H.ecran.t,toneMapped:false}));e.position.set(151.95,2.7,0);e.rotation.y=-Math.PI/2;add(e);
    H.lumEcran=plight(0x58e6ff,1.4,12,149,2.6,0)}
  addBox(147.6,148.6,-1.4,1.4,0,1,new THREE.MeshStandardMaterial({color:0x1e2228,roughness:.4,metalness:.6}),{los:false});
  H.lecteur=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.7),glow(0xffb347,1.2));H.lecteur.position.set(147.9,1.03,0);H.lecteur.rotation.z=.25;add(H.lecteur);
  // les écrans du pupitre de l'override
  moniteur(148.35,1,-.95,-Math.PI/2,{w:.6,h:.34,titre:'K7.2 · DIFFUSION',coin:'ANTENNE',teinte:'#ff6a5a',graine:41,lignes:[['Paquet : K7.2-final.bin'],['Cibles : 412 088 prothèses'],['Override : NON ARMÉ','#ffb347'],['Clé tissée requise','#ff6a5a']]});
  moniteur(148.35,1,.95,-Math.PI/2,{w:.6,h:.34,mode:'courbes',titre:'CHARGE · SALLE 41',coin:'97 %',graine:42,lignes:[]});
  clavier(147.85,1,-.95,-Math.PI/2);
  // l'escalier du toit, au nord-est
  H.porteToit=addBox(148,150.4,-12.1,-11.95,0,2.5,new THREE.MeshStandardMaterial({color:0x3a1e1e,roughness:.4,metalness:.6}),{});
  neon('TOIT · ACCÈS HÉLIPORT','#ff6a5a',2.2,.32,149.2,2.85,-11.9,0,{weight:600,size:.6,glow:1.4});
  // l'alarme : lumière rouge, deux Gardiens qui arrivent par le couloir (absents jusque-là)
  H.alarme=plight(0xff2020,0,30,141,4.5,0);
  H.renforts=[makeGardien(Z,[[131.5,-.8],[146,-.8],[146,-4.2],[131.5,-4.2]],{boucle:true,yaw:Math.PI/2,attente:1.2,vue:13}),
              makeGardien(Z,[[131.5,.8],[146,.8],[146,4.2],[131.5,4.2]],{boucle:true,yaw:Math.PI/2,attente:1.2,vue:13})];
  for(const g of H.renforts){Z.gardiens.splice(Z.gardiens.indexOf(g),1);g.g.visible=false}
  H.gardeServeurs=makeGardien(Z,[[132.5,-3.6],[146.5,-3.6],[146.5,3.6],[132.5,3.6]],{boucle:true,yaw:Math.PI/2,attente:2,vue:11});

  flushLedges();
  Z.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.receiveShadow=true});
  into(null);
};
// L'afficheur d'étage de la cabine
export function afficherEtage(n){const e=H.etage;if(!e)return;const g=e.g;g.fillStyle='#05080c';g.fillRect(0,0,256,128);g.fillStyle='#58e6ff';g.font='700 92px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText(String(n).padStart(2,'0'),128,100);e.t.needsUpdate=true}
// Le grand écran de la salle des serveurs
export function majEcranServeurs(heure,etat){const e=H.ecran;if(!e)return;const m=Math.max(0,6*60-heure),mm=Math.floor(m),ss=Math.floor((m-mm)*60);
  const txt=etat+'|'+mm+':'+ss;if(txt===e.txt)return;e.txt=txt;const g=e.g;
  g.fillStyle='#02050a';g.fillRect(0,0,1024,576);g.strokeStyle='rgba(88,230,255,.5)';g.lineWidth=4;g.strokeRect(14,14,996,548);
  g.textAlign='center';g.fillStyle='#58e6ff';g.font='600 46px "Saira Condensed",sans-serif';g.fillText('MISE À JOUR K7.2 · ANTENNE CONFLUENCE',512,90);
  g.fillStyle=etat==='arme'?'#ffb347':'#ffffff';g.font='700 230px "IBM Plex Mono",monospace';g.fillText(`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`,512,330);
  g.font='600 44px "Saira Condensed",sans-serif';
  if(etat==='arme'){g.fillStyle='#ffb347';g.fillText('MOTIF RECONNU · OVERRIDE ARMÉ',512,430);g.fillStyle='#ff6a5a';g.fillText("VALIDATION REQUISE SUR L'ANTENNE",512,490)}
  else{g.fillStyle='#9fb4c8';g.fillText('412 873 PROTHÈSES K7 EN ATTENTE',512,430);g.fillStyle='#58e6ff';g.fillText('SOYEZ ENTIER.',512,490)}
  e.t.needsUpdate=true}
// Les grilles : allumées une partie de chaque cycle ; un éclair rouge juste avant de s'allumer. Traverser allumé brûle
// et donne l'alerte (combat.js).
export function majLasers(dt,actif,coupe){
  for(const l of Z.lasers){const t=(T+l.ph)%l.per,on=!coupe&&t<l.on,pre=!coupe&&!on&&t>l.per-.35;l.actif=on;
    for(const f of l.fx){f.visible=on||(pre&&Math.sin(T*60)>0);f.material.color.setHex(on?0xff2a2a:0xff8080).multiplyScalar(on?3:1.2)}
    if(actif&&on&&G.grace<=0&&Math.abs(P.pos.x-l.x)<.42&&Math.abs(P.pos.z)<1.6)emit('laser',l)}
}
Z.update=(dt,S)=>{
  if(!H.holo)return;
  H.holo.rotation.y+=dt*.35;H.holoMat.uniforms.time.value=T;H.ruissellement.offset.y+=dt*.12;
};

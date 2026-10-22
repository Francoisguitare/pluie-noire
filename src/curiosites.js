// Les curiosités : des choses étranges à remarquer dans le décor, qui n'attaquent jamais. Un guetteur sur un toit qui
// n'est plus là quand on regarde à nouveau, une cabine qui sonne, un écran Helix qui se trompe de slogan, de la buée qui
// parle, une poupée qui tourne la tête, des mains pendues sous le pont, des têtes de NOX, des armures rangées qui frappent.
// Chacune compte une fois (S.curiosites, 10 XP, pourcentage de la partie) et se relit dans l'écran « Dossiers ».
// Tout est construit avec le lieu (rien à compiler en pleine partie) ; la rue, au chargement (installerCuriositesRue).
import {THREE,V3,P,T,state,camera,on,emit,mulberry32,clamp} from './core.js';
import {S} from './histoire/partie.js';
import {into,add,addBox,pushCol,M,glow} from './construire.js';
import {constructeurs,zones,zone} from './zones.js';
import {figure,MODELES,findBone,attachTo,prepClip} from './personnages.js';
import {canvasTex,mk,softDot} from './textures.js';
import {lire} from './exploration.js';
import {gagner} from './pouvoirs.js';
import {categorie} from './completion.js';
import {sonnerie,bourdon,boiteAMusique,cognement,cliquetis,servo} from './son.js';

export const CURIOSITES=[
  {id:'guetteur',zone:'rue',titre:'Le guetteur',desc:"Quelqu'un, tout en haut d'un toit, qui regarde la rue. Il n'est plus là quand on regarde à nouveau. Il revient, ailleurs."},
  {id:'cabine',zone:'rue',titre:'La cabine qui sonne',desc:"Une vieille cabine, rue des Tanneurs. Elle sonne quand on passe. Au bout du fil, quelqu'un d'enfermé compte les secondes."},
  {id:'soyez',zone:'rue',titre:'Soyez à nous',desc:"Un écran Helix. Le temps d'un battement, quand on le fixe, le slogan change."},
  {id:'buee',zone:'rue',titre:'La buée',desc:"Une vitre au rez-de-chaussée. Elle s'embue quand on s'en approche, et quelqu'un a écrit dedans : ILS ÉCOUTENT."},
  {id:'poupee',zone:'traboules',titre:'La poupée',desc:"Une poupée au bras K7, au fond d'une alcôve. Elle ne bouge que quand on ne la regarde pas."},
  {id:'mains',zone:'quais',titre:'Les mains rendues',desc:"Sous le pont, des mains K7 éteintes pendues à des cordes. On ne peut pas rendre une main. Alors on les accroche ici."},
  {id:'tetes',zone:'tour',titre:'Les têtes de NOX',desc:"Une caisse de têtes NOX dans le hall de la tour, en attente de broyage. L'une d'elles te suit des yeux."},
  {id:'armures',zone:'tour',titre:'Les armures rangées',desc:"Trois armures de Gardiens rangées sur le palier du 41e, comme des vêtements. Celle du milieu frappe, doucement, de l'intérieur."},
];
categorie({id:'curiosites',nom:'Curiosités',poids:5,fait:()=>S.curiosites.filter(id=>CURIOSITES.some(c=>c.id===id)).length,total:()=>CURIOSITES.length});
function noter(id){if(S.curiosites.includes(id))return;S.curiosites.push(id);gagner(10,'curiosité')}
const C={};
export const curiosites=C; // pour les tests

// L'angle entre le regard et un point (radians), et la distance.
const _f=new V3(),_c=new V3(),_d=new V3();
function regard(p){camera.getWorldDirection(_f);camera.getWorldPosition(_c);_d.subVectors(p,_c);const L=_d.length();return{a:Math.acos(clamp(_d.dot(_f)/(L||1),-1,1)),d:L}}

/* ====================================================================================================
   La rue
   ==================================================================================================== */
const POSTES=[[6.05,26.6,-20,-Math.PI/2],[-6.05,22.6,21,Math.PI/2],[1,42.6,-52.05,0]]; // au bord du toit, sur la margelle
export function installerCuriositesRue(){
  const Z=zones.rue;into(Z);
  // le guetteur : une silhouette sombre, deux yeux pâles
  {const g=new THREE.Group(),f=figure({coat:0x050507,skin:0x050507,hood:true});g.add(f);
    for(const x of[-.045,.045]){const e=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),glow(0xd8e8ff,4.5));e.position.set(x,1.93,.15);g.add(e)}
    // un halo de ville derrière lui : on voit sa silhouette se découper
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:softDot,color:new THREE.Color(0x9ab4d0).multiplyScalar(.95),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));halo.scale.set(6.5,5.5,1);halo.position.set(0,1.5,-1.6);g.add(halo)
    add(g);C.guetteur={g,poste:0,vu:0,parti:false,retour:0,tete:new V3()};poserGuetteur()}
  // la cabine
  {const x=-5.35,z=-27,fer=new THREE.MeshStandardMaterial({color:0x2a3a34,roughness:.5,metalness:.6});
    for(const[a,b]of[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]])addBox(x+a-.04,x+a+.04,z+b-.04,z+b+.04,0,2.3,fer,{collide:false});
    addBox(x-.52,x+.52,z-.52,z+.52,2.3,2.42,fer,{collide:false});
    const verre=new THREE.MeshStandardMaterial({color:0x9fb4c8,transparent:true,opacity:.16,roughness:.1,metalness:.3,depthWrite:false});
    for(const s of[-1,1]){const v=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.9),verre);v.position.set(x,1.25,z+s*.45);add(v)}
    const fond=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.9),verre);fond.position.set(x-.45,1.25,z);fond.rotation.y=Math.PI/2;add(fond);
    addBox(x-.44,x-.3,z-.15,z+.15,1.2,1.6,new THREE.MeshStandardMaterial({color:0x15171b,roughness:.4,metalness:.7}),{collide:false});
    const voyant=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),glow(0x401010,1));voyant.position.set(x-.29,1.55,z+.1);add(voyant);
    pushCol({x0:x-.5,x1:x-.3,z0:z-.5,z1:z+.5,los:false,off:false});
    C.cabine={p:new V3(x,1.4,z),voyant:voyant.material,sonne:false,cycle:0,repos:0};
    Z.inter.push({p:new V3(x+.2,0,z),r:1.7,on:()=>C.cabine.sonne,label:()=>'Décrocher',act:decrocher})}
  // l'écran Helix
  {const tex=t=>{const[c,g]=mk(512,288);const gr=g.createLinearGradient(0,0,0,288);gr.addColorStop(0,'#071a26');gr.addColorStop(1,'#020509');g.fillStyle=gr;g.fillRect(0,0,512,288);
      g.strokeStyle='rgba(88,230,255,.7)';g.lineWidth=3;g.strokeRect(8,8,496,272);g.textAlign='center';g.fillStyle='#58e6ff';g.font='600 30px "Saira Condensed",sans-serif';g.fillText('HELIX BIOTECH',256,62);
      g.fillStyle=t?'#ff3a3a':'#ffffff';g.font='700 76px "Saira Condensed",sans-serif';g.fillText(t?'SOYEZ À NOUS.':'SOYEZ ENTIER.',256,170);
      g.fillStyle='#9fb4c8';g.font='500 24px "Saira Condensed",sans-serif';g.fillText(t?'':'Votre K7 vous comprend. Votre K7 vous protège.',256,226);
      if(t){g.fillStyle='rgba(255,40,40,.25)';for(let y=0;y<288;y+=6)g.fillRect(0,y,512,2)}return canvasTex(c)};
    const a=tex(0),b=tex(1),m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.35),new THREE.MeshBasicMaterial({map:a,toneMapped:false}));m.material.color.setScalar(1.15);
    m.position.set(-5.95,2.9,-21);m.rotation.y=Math.PI/2;add(m);addBox(-6,-5.97,-22.25,-19.75,2.15,3.65,M.darkMetal,{collide:false});
    C.ecran={m,a,b,p:m.position.clone(),regard:0,glitch:0,repos:3}}
  // la buée : on n'y voit l'inscription qu'en s'approchant
  {const[c,g]=mk(512,460);g.fillStyle='rgba(225,232,240,.55)';g.fillRect(0,0,512,460);
    for(let i=0;i<5000;i++){const v=200+Math.random()*55;g.fillStyle=`rgba(${v},${v},${v+8},.25)`;g.fillRect(Math.random()*512,Math.random()*460,2,2)}
    g.globalCompositeOperation='destination-out';g.strokeStyle='#000';g.fillStyle='#000';g.lineCap='round';g.lineJoin='round';g.font='700 92px "Saira Condensed",sans-serif';g.textAlign='center';g.lineWidth=7;
    g.strokeText('ILS',256,170);g.strokeText('ÉCOUTENT',256,290);g.fillText('ILS',256,170);g.fillText('ÉCOUTENT',256,290);
    g.lineWidth=4;for(const x of[150,205,262,318,370])for(let k=0;k<2;k++){g.beginPath();g.moveTo(x+k*9,300);g.lineTo(x+k*9+2,330+((x*7+k*13)%70));g.stroke()}
    g.globalCompositeOperation='source-over';
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.875,1.6875),new THREE.MeshBasicMaterial({map:canvasTex(c),transparent:true,opacity:0,depthWrite:false}));
    m.position.set(-5.965,1.59375,29.5);m.rotation.y=Math.PI/2;add(m);C.buee={m,p:new V3(-5.9,1.5,29.5)}}
  into(null);
}
function poserGuetteur(){const g=C.guetteur,[x,y,z,yaw]=POSTES[g.poste];g.g.position.set(x,y,z);g.g.rotation.y=yaw;g.tete.set(x,y+1.9,z)}
const APPELS=[
  "(Un souffle. Puis une voix d'homme, très loin, comme enfermée dans une boîte en fer.)\n« … Léa ? … C'est noir. Ça ne s'ouvre pas. Je compte les secondes, pour ne pas devenir fou. J'en suis à… »\n\n(La ligne coupe. La tonalité, longtemps.)",
  "(Une voix d'enfant, toute petite, qui chuchote.)\n« Tu peux dire à Lou que mon bras ne fait plus mal ? Il ne fait plus rien du tout. C'est mieux, hein ? »\n\n(Un rire léger. Puis plus rien. Pas même la tonalité.)",
];
function decrocher(){const c=C.cabine,k=Math.min(S.appels,APPELS.length-1);c.sonne=false;c.repos=60;c.voyant.color.setHex(0x401010);S.appels++;
  lire([{kicker:'Cabine · rue des Tanneurs',titre:'Au bout du fil',texte:APPELS[k]}]);noter('cabine')}
function majRue(dt){
  // le guetteur : on le fixe, puis on détourne les yeux… il n'est plus là ; il revient plus tard, sur un autre toit
  const g=C.guetteur;
  if(g.parti){g.retour-=dt;if(g.retour<=0){const n=(g.poste+1)%POSTES.length,[x,y,z]=POSTES[n];if(regard(_c.set(x,y+1.9,z)).a>1){g.poste=n;poserGuetteur();g.parti=false;g.g.visible=true}}}
  else{const r=regard(g.tete);if(r.a<.12&&r.d<90){g.vu+=dt;if(g.vu>1.2)noter('guetteur')}else if(g.vu>1.2&&r.a>.7){g.g.visible=false;g.parti=true;g.vu=0;g.retour=180+Math.random()*120}}
  // la cabine sonne quand on passe à moins de 10 m (deux appels dans la nuit, le second au black-out ; S.appels décrochés)
  const c=C.cabine,d=Math.hypot(P.pos.x-c.p.x,P.pos.z-c.p.z);c.repos-=dt;
  const peut=S.appels===0||(S.appels===1&&S.chapter>=3);
  if(!c.sonne&&peut&&c.repos<=0&&d<10)c.sonne=true;
  if(c.sonne){if(d>16){c.sonne=false;c.repos=20}else{c.cycle-=dt;if(c.cycle<=0){c.cycle=5;sonnerie(Math.max(.15,1-d/16))}
    c.voyant.color.setHex(c.cycle>3.5?0xff3030:0x401010).multiplyScalar(c.cycle>3.5?3:1)}}
  // l'écran Helix : à force de le fixer, le slogan déraille
  const e=C.ecran,r=regard(e.p);e.repos-=dt;
  if(e.glitch>0){e.glitch-=dt;if(e.glitch<=0)e.m.material.map=e.a}
  else if(r.a<.3&&r.d<16){e.regard+=dt;if(e.regard>1.4&&e.repos<=0){e.glitch=.24;e.m.material.map=e.b;e.repos=8+Math.random()*12;e.regard=0;bourdon();noter('soyez')}}
  else e.regard=Math.max(0,e.regard-dt);
  // la buée apparaît quand on s'approche de la vitre
  const b=C.buee,db=Math.hypot(P.pos.x-b.p.x,P.pos.z-b.p.z),o=clamp((3.2-db)/1.8,0,1)*.8;b.m.material.opacity+=(o-b.m.material.opacity)*Math.min(1,dt*1.5);
  if(o>.6&&b.m.material.opacity>.6)noter('buee');
}

/* ====================================================================================================
   Les traboules : la poupée
   ==================================================================================================== */
{const c0=constructeurs.traboules;constructeurs.traboules=()=>{c0();const Z=zones.traboules;into(Z);
  const g=new THREE.Group();g.position.set(-14.85,0,-32.62);add(g); // au fond de l'alcôve où l'on se cache
  const robe=new THREE.Mesh(new THREE.ConeGeometry(.12,.2,14),new THREE.MeshStandardMaterial({color:0x7a3a46,roughness:.9}));robe.position.y=.1;g.add(robe);
  const buste=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,.12,10),robe.material);buste.position.y=.24;g.add(buste);
  const porcelaine=new THREE.MeshStandardMaterial({color:0xe8ddd0,roughness:.35});
  const tete=new THREE.Group();tete.position.y=.36;tete.rotation.y=1.1;g.add(tete); // elle regarde le mur… au début
  const crane=new THREE.Mesh(new THREE.SphereGeometry(.068,16,12),porcelaine);tete.add(crane);
  const cheveux=new THREE.Mesh(new THREE.SphereGeometry(.072,14,10,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x2a1a12,roughness:.8}));cheveux.rotation.x=-.3;tete.add(cheveux);
  for(const x of[-.024,.024]){const o=new THREE.Mesh(new THREE.SphereGeometry(.011,8,6),new THREE.MeshStandardMaterial({color:0x050505,roughness:.2}));o.position.set(x,.008,.061);tete.add(o)}
  const bras=new THREE.Mesh(new THREE.CylinderGeometry(.012,.01,.13,8),M.metal);bras.position.set(.07,.2,.02);bras.rotation.z=.4;g.add(bras);
  const anneau=new THREE.Mesh(new THREE.TorusGeometry(.014,.003,6,12),glow(0xffb347,2));anneau.position.set(.085,.17,.025);anneau.rotation.x=Math.PI/2;g.add(anneau);
  C.poupee={g,tete,p:new V3(-14.85,.36,-32.62),note:false};into(null)}}
function majTraboules(dt){const d=C.poupee;if(!d)return;const r=regard(d.p);
  // elle ne tourne la tête que quand on est près d'elle et qu'on ne la regarde pas
  if(r.a>.75&&r.d<7){const v=Math.atan2(P.pos.x-d.p.x,P.pos.z-d.p.z),cible=clamp(((v-d.g.rotation.y+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI,-1.3,1.3);d.tete.rotation.y+=(cible-d.tete.rotation.y)*Math.min(1,dt*3)}
  else if(r.d<2.8&&Math.abs(d.tete.rotation.y-1.1)>.6){if(!d.note){d.note=true;boiteAMusique()}noter('poupee')}} // on se retourne : elle te regarde

/* ====================================================================================================
   Les quais : les mains rendues, sous le pont
   ==================================================================================================== */
{const c0=constructeurs.quais;constructeurs.quais=()=>{c0();const Z=zones.quais;into(Z);
  const r=mulberry32(1834),corde=new THREE.MeshStandardMaterial({color:0x3a3530,roughness:1}),metal=new THREE.MeshStandardMaterial({color:0x7a8088,roughness:.35,metalness:.85}),sombre=new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.5,metalness:.7});
  const mains=[];
  for(let i=0;i<28;i++){const x=-5.5+i*.19+(r()-.5)*.1,z=-39.05+(r()-.5)*.6,L=3.1+r()*2.3,g=new THREE.Group();g.position.set(x,7.4,z);add(g);
    const fil=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,L,4),corde);fil.position.y=-L/2;g.add(fil);
    const h=new THREE.Group();h.position.y=-L-.08;h.rotation.set(Math.PI,r()*6.28,(r()-.5)*.6);h.scale.setScalar(1.35);g.add(h);
    const paume=new THREE.Mesh(new THREE.BoxGeometry(.08,.09,.025),metal);h.add(paume);
    for(let k=0;k<4;k++){const doigt=new THREE.Mesh(new THREE.BoxGeometry(.014,.07,.016),sombre);doigt.position.set(-.027+k*.018,.075,0);doigt.rotation.x=r()*.6;h.add(doigt)}
    if(r()<.25){const d=new THREE.Mesh(new THREE.SphereGeometry(.008,6,6),glow(0xffb347,1.4));d.position.set(.03,-.03,.014);h.add(d)}
    mains.push({g,ph:r()*6.28})}
  // le carton, sur la pile du pont
  const[c,gc]=mk(256,180);gc.fillStyle='#b9a27a';gc.fillRect(0,0,256,180);gc.fillStyle='#2a1a10';gc.font='700 30px "Saira Condensed",sans-serif';gc.textAlign='center';
  ['ON NE PEUT PAS','RENDRE UNE MAIN.','ALORS ON LES','ACCROCHE ICI.'].forEach((l,i)=>gc.fillText(l,128,40+i*36));
  const carton=new THREE.Mesh(new THREE.PlaneGeometry(.55,.39),new THREE.MeshStandardMaterial({map:canvasTex(c),roughness:1}));carton.position.set(-3.4,1.5,-41.18);add(carton);
  Z.inter.push({p:new V3(-3.4,0,-40.4),r:1.6,label:()=>'Lire le carton',act:()=>{lire([{kicker:'Sous le pont',titre:'Les mains rendues',
    texte:"« ON NE PEUT PAS RENDRE UNE MAIN. ALORS ON LES ACCROCHE ICI. »\n\nAu-dessus, sous l'arche, des dizaines de mains K7, éteintes, pendues à des cordes. Certaines portent encore leur bague de location. Quand le vent s'engouffre sous le pont, elles se cognent les unes contre les autres, avec un bruit de couverts.\n\nCelles qui n'ont plus de propriétaire ne coûtent plus rien à personne."}]);noter('mains')}});
  C.mains={l:mains,p:new V3(-3,4,-39.2),clic:0};into(null)}}
function majQuais(dt){const m=C.mains;if(!m)return;for(const h of m.l){h.g.rotation.z=Math.sin(T*.7+h.ph)*.05;h.g.rotation.x=Math.sin(T*.53+h.ph*1.3)*.04}
  const d=Math.hypot(P.pos.x-m.p.x,P.pos.z-m.p.z);if(d<9){m.clic-=dt;if(m.clic<=0){m.clic=.4+Math.random()*2.2;cliquetis(1-d/9)}}}

/* ====================================================================================================
   La tour : les têtes de NOX dans le hall, les armures rangées sur le palier du 41e
   ==================================================================================================== */
{const c0=constructeurs.tour;constructeurs.tour=()=>{c0();const Z=zones.tour;into(Z);
  // la caisse de têtes, près de la porte de service
  addBox(12.8,14.2,10.1,11.1,0,.62,new THREE.MeshStandardMaterial({color:0x23262c,roughness:.5,metalness:.6}),{los:false});
  const blanc=new THREE.MeshStandardMaterial({color:0xb9c2cc,roughness:.32,metalness:.55}),visiere=new THREE.MeshStandardMaterial({color:0x1c2a33,roughness:.25,metalness:.8});
  const tetes=[];for(let i=0;i<5;i++){const t=new THREE.Group();t.position.set(13+i*.27,.74+(i%2)*.06,10.6+(i%2?.18:-.15));t.rotation.set((i%3-1)*.4,i*1.1+2.6,(i%2-.5)*.5);add(t);
    const s=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),blanc);s.scale.set(1,1.08,1);t.add(s);
    const v=new THREE.Mesh(new THREE.BoxGeometry(.2,.05,.06),visiere);v.position.set(0,.02,.12);t.add(v);
    const yeux=[];for(const x of[-.045,.045]){const o=new THREE.Mesh(new THREE.SphereGeometry(.013,6,6),glow(0x2ad8ff,i===2?.6:.15));o.position.set(x,.025,.152);t.add(o);yeux.push(o)}
    tetes.push({t,yeux})}
  C.tetes={l:tetes,suit:tetes[2],p:new V3(13.5,.8,10.6),base:tetes[2].t.rotation.y,tourne:false};
  // les armures, rangées contre le mur du palier
  const Mod=MODELES.soldier;C.armures={l:[],p:new V3(103.3,1.6,2.4),coups:0};
  // le râtelier : deux montants, une barre, et l'étiquette de stockage
  for(const x of[101.4,105.2])addBox(x-.04,x+.04,2.86,2.94,0,2.1,M.darkMetal,{collide:false});addBox(101.4,105.2,2.84,2.94,1.5,1.56,M.metal,{collide:false});
  {const[c,gc]=mk(512,64);gc.fillStyle='#0b0d10';gc.fillRect(0,0,512,64);gc.fillStyle='#ff8a6a';gc.font='600 34px "Saira Condensed",sans-serif';gc.textAlign='center';gc.fillText('STOCKAGE · NE PAS DÉVERROUILLER',256,44);
    const et=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.3),new THREE.MeshBasicMaterial({map:canvasTex(c)}));et.position.set(103.3,2.55,2.98);et.rotation.y=Math.PI;add(et)}
  for(const[k,x]of[[0,102.2],[1,103.3],[2,104.4]]){const g=new THREE.Group();g.position.set(x,0,2.55);g.rotation.y=Math.PI;add(g);pushCol({x0:x-.3,x1:x+.3,z0:2.25,z1:2.85,los:false,off:false,pnj:true});
    let vis=null;
    if(Mod){const m=THREE.SkeletonUtils.clone(Mod.scene);m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.material=o.material.clone();o.material.color.multiply(new THREE.Color(0x3a4048))}});
      m.scale.setScalar(Mod.echelle);m.position.y=Mod.decalage;m.rotation.y=Math.PI;g.add(m);
      const mx=new THREE.AnimationMixer(m),cl=Mod.animations.find(a=>a.name==='Idle');if(cl){mx.clipAction(prepClip(cl,false)).play();mx.update(.4+k*.3)}
      const tete=findBone(m,['mixamorigHead']);if(tete){const cas=new THREE.Mesh(new THREE.SphereGeometry(.15,18,12,0,Math.PI*2,0,Math.PI*.6),new THREE.MeshStandardMaterial({color:0x15171c,roughness:.35,metalness:.7}));attachTo(tete,cas,0,.1,0);
        const v=new THREE.Mesh(new THREE.BoxGeometry(.2,.035,.05),glow(0x220606,1));attachTo(tete,v,0,.09,.11);vis=v.material}}
    else{const f=figure({coat:0x1d2128,skin:0x30343c,hood:true});g.add(f)}
    C.armures.l.push({g,vis})}
  into(null)}}
function majTour(dt){
  const t=C.tetes;if(t){const d=Math.hypot(P.pos.x-t.p.x,P.pos.z-t.p.z);
    if(d<7){const v=Math.atan2(P.pos.x-t.suit.t.position.x,P.pos.z-t.suit.t.position.z);t.suit.t.rotation.y+=(((v-t.suit.t.rotation.y+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI)*Math.min(1,dt*2.5);
      t.suit.t.rotation.x*=1-Math.min(1,dt*2);for(const o of t.suit.yeux)o.material.color.setHex(0x2ad8ff).multiplyScalar(2.4);if(!t.tourne){t.tourne=true;servo()}}
    else{t.tourne=false;for(const o of t.suit.yeux)o.material.color.setHex(0x2ad8ff).multiplyScalar(.6)}
    if(d<3)noter('tetes')}
  const a=C.armures;if(a){const d=Math.hypot(P.pos.x-a.p.x,P.pos.z-a.p.z),mil=a.l[1];
    if(d<3.2){a.coups-=dt;if(a.coups<=0){a.coups=6;cognement()}noter('armures')}else a.coups=Math.min(a.coups,1.5);
    if(mil&&mil.vis)mil.vis.color.setHex(d<3.2&&a.coups>4.6?0xff2a2a:0x220606).multiplyScalar(d<3.2&&a.coups>4.6?2.6:1)}
}

/* ---------- Chaque image ---------- */
export function updateCuriosites(dt){
  if(state!=='play')return;const Z=zone();if(!Z)return;
  if(Z.id==='rue'&&C.guetteur)majRue(dt);else if(Z.id==='traboules')majTraboules(dt);else if(Z.id==='quais')majQuais(dt);else if(Z.id==='tour')majTour(dt);
}
// L'écran « Dossiers » : la section des curiosités, avec les « ??? » et leur lieu.
on('remplirDossiers',(L,NOMS)=>{
  const n=CURIOSITES.filter(c=>S.curiosites.includes(c.id)).length,det=document.createElement('details');det.className='dossier radios';
  const sum=document.createElement('summary');sum.innerHTML=`<b>Curiosités</b><em>${n} / ${CURIOSITES.length}</em>`;det.appendChild(sum);
  const intro=document.createElement('p');intro.className='dosIntro';intro.textContent="Ce que la ville montre à qui prend le temps de regarder le décor.";det.appendChild(intro);
  for(const c of CURIOSITES){if(S.curiosites.includes(c.id)){const e=document.createElement('details');e.className='piece';const s=document.createElement('summary');s.textContent=c.titre;e.appendChild(s);
      const p=document.createElement('p');p.textContent=c.desc;e.appendChild(p);det.appendChild(e)}
    else{const p=document.createElement('p');p.className='manque';p.textContent=`??? · quelque part : ${NOMS[c.zone]}`;det.appendChild(p)}}
  L.appendChild(det)});
// Une partie neuve (ou une reprise) : la cabine se tait, le guetteur revient sur son premier toit.
on('nouvellePartie',()=>{if(C.cabine){C.cabine.sonne=false;C.cabine.repos=0;C.buee.m.material.opacity=0}if(C.guetteur){C.guetteur.poste=0;C.guetteur.parti=false;C.guetteur.vu=0;C.guetteur.g.visible=true;poserGuetteur()}});

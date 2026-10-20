// Ordinateurs et salles de serveurs : moniteurs (cadre, pied, dos), claviers, écrans d'interface dessinés au canvas,
// baies de serveurs détaillées (serveurs 1U, baies de disques, commutateurs, panneaux de brassage) dont les diodes
// clignotent (deux images d'émission échangées), chemins de câbles et dalles perforées.
// Aucun tirage dans la suite rnd du jeu : chaque objet a son propre mulberry32 (la ville ne change pas d'aspect).
import {THREE,mulberry32} from './core.js';
import {add,M,glow,pushCol} from './construire.js';
import {mk,canvasTex} from './textures.js';

const MONO='"IBM Plex Mono",ui-monospace,monospace',COND='"Saira Condensed",sans-serif';
const plastique=new THREE.MeshStandardMaterial({color:0x16191e,roughness:.45,metalness:.35,envMapIntensity:.9});
const plastiqueClair=new THREE.MeshStandardMaterial({color:0x2a2f37,roughness:.5,metalness:.3,envMapIntensity:.8});

/* ---------- Écrans d'interface ---------- */
// o : titre, lignes ([texte] ou [texte, couleur]), teinte (couleur d'accent), mode ('texte' | 'courbes' | 'liste'), graine.
// blanc:true dessine en blanc et gris (l'écran est teinté par la couleur de son matériau, ex. l'armoire du toit).
export function texEcran(o={}){
  const W=o.w||512,H=o.h||288,[c,g]=mk(W,H),r=mulberry32(o.graine||7),acc=o.blanc?'#ffffff':o.teinte||'#58e6ff',dim=o.blanc?'#9a9a9a':o.dim||'#3d7f92';
  const fond=g.createLinearGradient(0,0,0,H);fond.addColorStop(0,o.blanc?'#141414':'#04131a');fond.addColorStop(1,o.blanc?'#060606':'#02070b');g.fillStyle=fond;g.fillRect(0,0,W,H);
  // bandeau
  g.fillStyle=acc;g.globalAlpha=.9;g.fillRect(0,0,W,H*.11);g.globalAlpha=1;g.fillStyle=o.blanc?'#000':'#03090c';g.font=`600 ${Math.round(H*.07)}px ${MONO}`;g.textBaseline='middle';
  g.fillText(o.titre||'HELIX BIOTECH',W*.03,H*.057);g.textAlign='right';g.fillText(o.coin||'03:12',W*.97,H*.057);g.textAlign='left';
  const y0=H*.17,lh=H*.075;g.font=`500 ${Math.round(H*.055)}px ${MONO}`;
  if(o.mode==='courbes'){
    // deux courbes et des barres, façon moniteur de laboratoire
    g.strokeStyle=dim;g.lineWidth=1;for(let x=W*.05;x<W*.95;x+=W*.06){g.beginPath();g.moveTo(x,y0);g.lineTo(x,H*.62);g.stroke()}
    for(const[col,amp,ph]of[[acc,.12,0],[o.blanc?'#bbbbbb':'#ffb347',.07,2]]){g.strokeStyle=col;g.lineWidth=2;g.beginPath();
      for(let i=0;i<=60;i++){const x=W*.05+i/60*W*.9,y=H*.4+Math.sin(i*.35+ph)*H*amp+(r()-.5)*H*.04;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
    for(let i=0;i<12;i++){const h=H*(.05+r()*.18);g.fillStyle=i%4?dim:acc;g.fillRect(W*.05+i*W*.075,H*.92-h,W*.05,h)}
  }
  const lignes=o.lignes||[];
  lignes.forEach((l,i)=>{const[t,col]=Array.isArray(l)?l:[l];g.fillStyle=col||(o.blanc?'#dcdcdc':'#bfefff');g.fillText(t,W*.04,y0+(o.mode==='courbes'?H*.5:0)+i*lh+lh*.5)});
  if(o.curseur!==false&&lignes.length){g.fillStyle=acc;g.fillRect(W*.04,y0+lignes.length*lh+lh*.15,W*.022,lh*.7)}
  // lignes de balayage et vignettage
  g.fillStyle='rgba(0,0,0,.18)';for(let y=0;y<H;y+=3)g.fillRect(0,y,W,1);
  const v=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.65);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=v;g.fillRect(0,0,W,H);
  return canvasTex(c);
}
// Matériau d'écran : il éclaire de lui-même, sans être écrasé par le rendu.
export const matEcran=(tex,k=1.25,couleur=0xffffff)=>new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color(couleur).multiplyScalar(k),toneMapped:false});

/* ---------- Moniteur et clavier ---------- */
// Moniteur posé (pied) ou accroché (pied:false). yaw : direction vers laquelle l'écran regarde (0 = +z).
export function moniteur(x,y,z,yaw,o={}){
  const w=o.w||.62,h=o.h||.36,gr=new THREE.Group();gr.position.set(x,y,z);gr.rotation.y=yaw;add(gr);
  const cadre=new THREE.Mesh(new THREE.BoxGeometry(w+.04,h+.04,.03),plastique);cadre.position.y=h/2+(o.pied===false?0:.12);gr.add(cadre);
  const dos=new THREE.Mesh(new THREE.BoxGeometry(w*.7,h*.6,.05),plastiqueClair);dos.position.set(0,cadre.position.y,-.035);gr.add(dos);
  const ecran=new THREE.Mesh(new THREE.PlaneGeometry(w,h),o.mat||matEcran(o.tex||texEcran({...o,w:512,h:Math.round(512*h/w)})));ecran.position.set(0,cadre.position.y,.024);gr.add(ecran); // assez devant le cadre pour ne jamais être masqué
  const diode=new THREE.Mesh(new THREE.BoxGeometry(.008,.004,.004),glow(0x4dff9a,2.5));diode.position.set(w/2-.01,cadre.position.y-h/2-.012,.02);gr.add(diode);
  if(o.pied!==false){const cou=new THREE.Mesh(new THREE.BoxGeometry(.05,.16,.03),plastiqueClair);cou.position.set(0,.08,-.04);gr.add(cou);
    const pied=new THREE.Mesh(new THREE.BoxGeometry(.24,.012,.17),plastique);pied.position.set(0,.006,-.03);gr.add(pied)}
  if(o.inclinaison)cadre.rotation.x=ecran.rotation.x=o.inclinaison;
  return {g:gr,ecran};
}
let texTouches=null;
export function clavier(x,y,z,yaw){
  if(!texTouches){const[c,g]=mk(256,96);g.fillStyle='#0e1013';g.fillRect(0,0,256,96);g.fillStyle='#262a31';
    for(let r=0;r<5;r++)for(let k=0;k<15;k++){const w=r===4&&k>4&&k<10?(k===5?78:0):14;if(!w)continue;g.fillRect(6+k*16.5,8+r*17,w,13)}
    texTouches=new THREE.MeshStandardMaterial({map:canvasTex(c),roughness:.6,metalness:.2})}
  const m=new THREE.Mesh(new THREE.BoxGeometry(.44,.02,.15),[plastique,plastique,texTouches,plastique,plastique,plastique]);m.position.set(x,y+.01,z);m.rotation.y=yaw;add(m);return m;
}

/* ---------- Baies de serveurs ---------- */
// Une façade de baie (0,6 m × hauteur) : montants percés, équipements variés ; deux images d'émission pour le clignotement.
function texFacade(graine){
  const r=mulberry32(graine),W=256,H=1024,[c,g]=mk(W,H),E=[mk(W,H),mk(W,H)];
  g.fillStyle='#0b0d10';g.fillRect(0,0,W,H);for(const[,e]of E){e.fillStyle='#000';e.fillRect(0,0,W,H)}
  // montants
  g.fillStyle='#1d2127';g.fillRect(0,0,14,H);g.fillRect(W-14,0,14,H);g.fillStyle='#08090b';for(let y=6;y<H;y+=11){g.fillRect(4,y,6,5);g.fillRect(W-10,y,6,5)}
  const U=23,led=(x,y,col,p=.6)=>E.forEach(([,e],k)=>{if(r()<(k?p:1-p*.4)){e.fillStyle=col;e.fillRect(x,y,4,3)}});
  for(let y=8;y<H-U;){const t=r(),n=t<.42?1:t<.7?2:t<.82?1:t<.92?3:1;const h=n*U-2,x=16,w=W-32;
    if(t<.42){ // serveur 1U : baies de disques, poignées
      g.fillStyle='#262b33';g.fillRect(x,y,w,h);g.fillStyle='#3a414c';for(let k=0;k<8;k++)g.fillRect(x+30+k*22,y+4,18,h-8);g.fillStyle='#14171b';g.fillRect(x+4,y+4,20,h-8);
      led(x+8,y+8,'#4dff8a',.9);for(let k=0;k<8;k++)led(x+44+k*22,y+h-7,r()<.85?'#58e6ff':'#ffb347',.5)}
    else if(t<.7){ // stockage 2U : grille de disques
      g.fillStyle='#1f242b';g.fillRect(x,y,w,h);for(let row=0;row<2;row++)for(let k=0;k<10;k++){g.fillStyle='#343b45';g.fillRect(x+6+k*21,y+4+row*21,18,17);led(x+10+k*21,y+15+row*21,r()<.9?'#4dff8a':'#ff4b42',.45)}}
    else if(t<.82){ // commutateur : rangées de ports
      g.fillStyle='#14171c';g.fillRect(x,y,w,h);for(let k=0;k<24;k++){const px=x+8+(k%12)*17,py=y+3+Math.floor(k/12)*9;g.fillStyle='#050607';g.fillRect(px,py,12,7);led(px+8,py,'#ffb347',.55)}}
    else if(t<.92){ // panneau de brassage : câbles de couleur qui retombent
      g.fillStyle='#101317';g.fillRect(x,y,w,h);for(let k=0;k<16;k++){g.strokeStyle=['#2b6cff','#ffcf3a','#e04060','#3ad07a','#d8d8d8'][Math.floor(r()*5)];g.lineWidth=3;g.beginPath();g.moveTo(x+10+k*13,y+6);g.quadraticCurveTo(x+10+k*13+(r()-.5)*30,y+h*.8,x+10+k*13+(r()-.5)*40,y+h+4);g.stroke()}}
    else{ g.fillStyle='#0d0f12';g.fillRect(x,y,w,h);g.fillStyle='#050608';for(let k=0;k<30;k++)g.fillRect(x+10+k*7,y+6,3,h-12)} // panneau aveugle, aérations
    g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x,y,w,1);y+=n*U}
  const t=canvasTex(c),em=E.map(([e])=>canvasTex(e));for(const x of[t,...em]){x.wrapS=x.wrapT=THREE.RepeatWrapping}
  return{t,em};
}
const baies=[];let horloge=0;
// Une rangée de baies entre (x0,z0) et (x1,z1) sur la hauteur h ; les façades regardent vers ±z (axe:'x') ou ±x (axe:'z').
export function rangeeBaies(x0,x1,z0,z1,h,{graine=3,axe='x'}={}){
  const f=texFacade(graine),L=axe==='x'?x1-x0:z1-z0;
  for(const t of[f.t,...f.em])t.repeat.set(L/.6,1);
  const mat=new THREE.MeshStandardMaterial({map:f.t,emissive:0xffffff,emissiveMap:f.em[0],emissiveIntensity:1.5,roughness:.42,metalness:.55,envMapIntensity:.9});
  const cote=new THREE.MeshStandardMaterial({color:0x101216,roughness:.5,metalness:.5});
  const mats=axe==='x'?[cote,cote,cote,cote,mat,mat]:[mat,mat,cote,cote,cote,cote];
  const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,h,z1-z0),mats);m.position.set((x0+x1)/2,h/2,(z0+z1)/2);add(m);
  pushCol({x0,x1,z0,z1,los:true,off:false});
  // corniche et portes vitrées fumées, rail de câbles au-dessus
  const top=new THREE.Mesh(new THREE.BoxGeometry(x1-x0+.04,.06,z1-z0+.04),M.darkMetal);top.position.set((x0+x1)/2,h+.03,(z0+z1)/2);add(top);
  baies.push({mat,em:f.em,k:0});return m;
}
// Une façade de baies plaquée sur un meuble existant (centre cx, cz, longueur L, regard yaw).
export function facadeBaies(cx,y0,cz,L,h,yaw,graine=5){
  const f=texFacade(graine);for(const t of[f.t,...f.em])t.repeat.set(L/.6,1);
  const mat=new THREE.MeshStandardMaterial({map:f.t,emissive:0xffffff,emissiveMap:f.em[0],emissiveIntensity:1.5,roughness:.42,metalness:.55,envMapIntensity:.9});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(L,h),mat);m.position.set(cx,y0+h/2,cz);m.rotation.y=yaw;add(m);baies.push({mat,em:f.em,k:0});return m;
}
// Chemin de câbles en échelle, suspendu, avec des faisceaux de câbles.
export function cheminCables(x0,x1,z,y,o={}){
  const L=x1-x0,cx=(x0+x1)/2,g=new THREE.Group();g.position.set(cx,y,z);if(o.axe==='z')g.rotation.y=Math.PI/2;add(g);
  for(const s of[-.22,.22]){const b=new THREE.Mesh(new THREE.BoxGeometry(L,.06,.02),M.darkMetal);b.position.z=s;g.add(b)}
  for(let x=-L/2+.3;x<L/2;x+=.6){const b=new THREE.Mesh(new THREE.BoxGeometry(.03,.02,.44),M.darkMetal);b.position.set(x,-.02,0);g.add(b)}
  const cols=[0x1a2a6a,0x6a5a1a,0x1a1a1a,0x2a6a3a];
  cols.forEach((c,i)=>{const cy=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,L,8),new THREE.MeshStandardMaterial({color:c,roughness:.7}));cy.rotation.z=Math.PI/2;cy.position.set(0,.02,-.15+i*.1);g.add(cy)});
  return g;
}
// Dalles de faux plancher perforées (allée froide), légèrement éclairées par-dessous.
let texDalle=null;
export function dallesPerforees(x0,x1,z0,z1,y=.012){
  if(!texDalle){const[c,g]=mk(128,128);g.fillStyle='#1b1f25';g.fillRect(0,0,128,128);g.fillStyle='#0a0c0f';g.fillRect(0,0,128,3);g.fillRect(0,0,3,128);
    g.fillStyle='#5aa8c8';for(let y=14;y<120;y+=8)for(let x=14;x<120;x+=8)g.fillRect(x,y,3,3);texDalle=canvasTex(c,true)}
  const t=texDalle.clone();t.needsUpdate=true;t.repeat.set((x1-x0)/.6,(z1-z0)/.6);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),new THREE.MeshStandardMaterial({map:t,emissive:0x2a6a8a,emissiveMap:t,emissiveIntensity:.35,roughness:.35,metalness:.5}));
  m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,y,(z0+z1)/2);add(m);return m;
}
// Clignotement des diodes : on échange les deux images d'émission, chaque baie à son rythme.
export function majOrdinateurs(dt){horloge+=dt;if(horloge<.18)return;horloge=0;for(const b of baies)if(Math.random()<.6){b.k^=1;b.mat.emissiveMap=b.em[b.k]}}

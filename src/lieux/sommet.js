// Le toit de la tour Helix (chapitre 5, final) : 230 m au-dessus de Confluence, sous l'orage. La cage d'escalier,
// l'héliport, des rangées de panneaux solaires (on s'abrite dessous), l'antenne de la K7.2 et son armoire d'émission.
// Saal attend au pied de l'antenne avec deux Gardiens ; Mara, prisonnière ou libre ; Nox, s'il a suivi. La Faucheuse tourne.
// La ville est en dessous : le ciel et sa silhouette de tours sont abaissés (cielY).
import {THREE,V3,mulberry32,T} from '../core.js';
import {into,add,pushCol,M,glow,addBox,plight,neon,boxGeoWorldUV,flushLedges,lampeCassable,cable,fusion,holoMat} from '../construire.js';
import {makeZone,constructeurs} from '../zones.js';
import {makeGardien,gardienImmobile} from '../gardiens.js';
import {makeFaucheuse} from '../faucheuse.js';
import {habiller,nameTag} from '../personnages.js';
import {canvasTex,mk} from '../textures.js';
import {texEcran,moniteur} from '../ordinateurs.js';

export const Z=makeZone('sommet',{fog:0x0b0d16,fogD:.011,hemi:.3,envPos:[0,3,4],cielY:-235,
  surfaceAt:p=>Math.hypot(p.x-9,p.z-9)<6.5?'metal':'asphalt'});
export const H={};
Z.sons=[{type:'neon',pos:[0,1,-8],vol:.2}];

function texHeliport(){const[c,g]=mk(512,512);g.fillStyle='#1a1c22';g.fillRect(0,0,512,512);g.strokeStyle='#d8dce2';g.lineWidth=14;g.beginPath();g.arc(256,256,226,0,7);g.stroke();
  g.fillStyle='#d8dce2';g.fillRect(170,130,40,252);g.fillRect(302,130,40,252);g.fillRect(170,236,172,40);
  g.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<500;i++)g.fillRect(Math.random()*512,Math.random()*512,3,3);return c}

constructeurs.sommet=()=>{
  const r=mulberry32(6000);into(Z);
  const toit=new THREE.MeshStandardMaterial({color:0x1d1f24,roughness:.45,metalness:.3,envMapIntensity:.9});
  const beton=new THREE.MeshStandardMaterial({color:0x2c2e34,roughness:.8,metalness:.1,envMapIntensity:.5});
  const sol=new THREE.Mesh(new THREE.PlaneGeometry(44,44),toit);sol.rotation.x=-Math.PI/2;sol.position.y=.002;sol.receiveShadow=true;add(sol);
  // parapet tout autour (on ne tombe pas), et la façade de la tour qui plonge vers la ville
  for(const[x0,x1,z0,z1]of[[-22,22,-22.4,-22],[-22,22,22,22.4],[-22.4,-22,-22.4,22.4],[22,22.4,-22.4,22.4]])addBox(x0,x1,z0,z1,0,1.1,beton,{geo:boxGeoWorldUV(x1-x0,1.1,z1-z0,4)});
  {const[c,e]=[mk(256,512),mk(256,512)];const[cc,g]=c,[ce,ge]=e;g.fillStyle='#0b0e14';g.fillRect(0,0,256,512);ge.fillStyle='#000';ge.fillRect(0,0,256,512);
    for(let y=0;y<512;y+=16)for(let x=0;x<256;x+=32){g.fillStyle='#161b24';g.fillRect(x,y,32,3);if(r()<.35){ge.fillStyle=r()<.2?'#ffcf8a':'#8fc8ff';ge.globalAlpha=.3+r()*.5;ge.fillRect(x+2,y+4,28,10);ge.globalAlpha=1}}
    const tc=canvasTex(cc,true),te=canvasTex(ce,true);tc.repeat.set(5,4);te.repeat.set(5,4);
    const f=new THREE.Mesh(new THREE.BoxGeometry(44.8,90,44.8),new THREE.MeshStandardMaterial({map:tc,emissive:0xffffff,emissiveMap:te,emissiveIntensity:1.2,roughness:.25,metalness:.7}));f.position.y=-45.05;add(f)}
  // la cage d'escalier, d'où l'on sort
  addBox(-18.2,-13.8,13.2,17.6,0,3.3,beton);addBox(-18.5,-13.5,12.9,17.9,3.3,3.5,M.darkMetal,{collide:false});
  {const p=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.3),new THREE.MeshStandardMaterial({color:0x3a1e1e,roughness:.4,metalness:.6}));p.position.set(-16,1.15,13.18);p.rotation.y=Math.PI;add(p);
    plight(0xffb070,1,6,-16,2.9,12.4);const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.08,.2),glow(0xffd59a,2));b.position.set(-16,2.95,13.1);add(b)}
  Z.couverts.push({x0:-18.5,x1:-13.5,z0:12.9,z1:17.9});
  // l'héliport
  {const t=canvasTex(texHeliport());const h=new THREE.Mesh(new THREE.CylinderGeometry(6.5,6.5,.12,48),[new THREE.MeshStandardMaterial({color:0x1a1c22,roughness:.5,metalness:.6}),new THREE.MeshStandardMaterial({map:t,roughness:.45,metalness:.3}),new THREE.MeshStandardMaterial({color:0x1a1c22})]);h.position.set(9,.06,9);add(h);
    H.balisesHeli=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2,b=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),glow(i%2?0x58ff8a:0xffffff,2.4));b.position.set(9+Math.cos(a)*6.4,.16,9+Math.sin(a)*6.4);add(b);H.balisesHeli.push(b)}}
  // panneaux solaires sur leurs châssis : à l'abri du projecteur, accroupi dessous
  const pv=new THREE.MeshStandardMaterial({color:0x0e1a2e,roughness:.15,metalness:.8,envMapIntensity:1.2});
  for(const[x0,x1,z0,z1]of[[-15,-5,-2.2,0],[-15,-5,2.4,4.6],[11,19,-14,-11.8]]){
    const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,.06,z1-z0),pv);m.position.set((x0+x1)/2,1.35,(z0+z1)/2);m.rotation.x=-.18;add(m);
    for(const x of[x0+.2,x1-.2])for(const z of[z0+.2,z1-.2])addBox(x-.04,x+.04,z-.04,z+.04,0,1.3,M.darkMetal,{collide:true,los:false});
    Z.couverts.push({x0:x0+.1,x1:x1-.1,z0:z0+.1,z1:z1-.1})}
  // blocs de climatisation, gaines, caisses
  const clim=(x,z,w=2.2,d=1.6,h=1.5)=>{addBox(x-w/2,x+w/2,z-d/2,z+d/2,0,h,new THREE.MeshStandardMaterial({color:0x5a5f68,roughness:.4,metalness:.7,envMapIntensity:1}),{los:true});
    for(const dx of[-w/4,w/4]){const f=new THREE.Mesh(new THREE.CylinderGeometry(w/5,w/5,.05,18),M.darkMetal);f.position.set(x+dx,h+.02,z);add(f)}};
  clim(-9,9);clim(4,4,2.6,1.6,1.7);clim(16,2);clim(-17,-9,1.8,2.4);clim(17,-4,1.6,2.6);
  addBox(-4,4,16.5,17.2,0,.8,M.darkMetal,{los:false});addBox(-20,-12,-18.4,-17.8,0,.9,M.darkMetal,{los:false});
  // projecteurs sur mâts
  for(const[x,z,k]of[[-20.5,-6,'lS1'],[20.5,14,'lS2']]){addBox(x-.07,x+.07,z-.07,z+.07,0,5,M.darkMetal,{collide:false});H[k]=lampeCassable(x,5,z,0xe8f0ff,{int:2,dist:16,r:6})}
  // l'antenne de la K7.2 : pylône en treillis, panneaux, balises rouges ; l'armoire d'émission à son pied
  {const P=[],B=(w,h,d,x,y,z,rx=0,rz=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d));m.position.set(x,y,z);m.rotation.set(rx,0,rz);P.push(m)};
    const H0=34,bas=2.2,haut=.8,cx=0,cz=-12,lar=y=>bas+(haut-bas)*y/H0;
    // quatre montants penchés vers l'intérieur, des ceintures tous les 3 m, des croix de Saint-André sur chaque face
    for(const sx of[-1,1])for(const sz of[-1,1]){const a=Math.atan2(bas-haut,H0);B(.16,H0+.4,.16,cx+sx*(bas+haut)/2,H0/2,cz+sz*(bas+haut)/2,-sz*a,sx*a)}
    for(let y=2;y<H0-2;y+=3){const l=lar(y),m=(l+lar(y+3))/2,L=Math.hypot(2*m,3),a=Math.atan2(2*m,3);
      for(const s of[-1,1]){B(l*2,.08,.08,cx,y,cz+s*l);B(.08,.08,l*2,cx+s*l,y,cz);
        for(const d of[-1,1]){B(.05,L,.05,cx,y+1.5,cz+s*m,0,d*a);B(.05,L,.05,cx+s*m,y+1.5,cz,d*a,0)}}}
    const tr=fusion(P,new THREE.MeshStandardMaterial({color:0x8a2a22,roughness:.5,metalness:.6,envMapIntensity:.8}));tr.castShadow=true;add(tr);
    for(const a of[0,2.1,4.2]){const p=new THREE.Mesh(new THREE.BoxGeometry(.5,3.2,1.6),new THREE.MeshStandardMaterial({color:0xd8dce2,roughness:.5,metalness:.3}));p.position.set(cx+Math.sin(a)*1.3,28,cz+Math.cos(a)*1.3);p.rotation.y=a;add(p)}
    const mat=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,8,8),M.darkMetal);mat.position.set(cx,H0+4,cz);add(mat);
    H.balisesAnt=[];for(const y of[12,24,H0,H0+8]){const b=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),glow(0xff2020,3));b.position.set(cx+.3,y,cz+lar(y));add(b);H.balisesAnt.push(b)}
    H.lumAnt=plight(0xff3030,1.6,18,cx,H0+2,cz);
    pushCol({x0:cx-bas-.2,x1:cx+bas+.2,z0:cz-bas-.2,z1:cz+bas+.2,los:false,off:false});
    for(let i=0;i<4;i++)cable(-.6+i*.4,2.2,-8.6,(-.6+i*.4)*.5,8,cz+.4,.5,0)}
  // l'armoire d'émission : écrans, le lecteur de motifs, câbles vers l'antenne
  addBox(-1.6,1.6,-9.2,-8,0,2.2,new THREE.MeshStandardMaterial({color:0x2a2e36,roughness:.4,metalness:.7,envMapIntensity:1}));
  // écran dessiné en blanc : sa couleur (cyan, puis blanc quand l'override part) vient du matériau
  H.ecranArmoire=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.7),glow(0x58e6ff,1.2));H.ecranArmoire.position.set(-.6,1.6,-7.98);add(H.ecranArmoire);
  H.ecranArmoire.material.map=texEcran({blanc:true,w:640,h:320,titre:'ÉMISSION K7.2 · ANTENNE PRINCIPALE',coin:'06:00',graine:51,lignes:[['Faisceau : Lyon-Basse, Confluence, Croix-Rousse'],['Puissance : 100 %'],['Override manuel : lecteur de motifs ->'],['Autorisation : direction sécurité']]});H.ecranArmoire.material.needsUpdate=true;
  {const c=new THREE.Mesh(new THREE.BoxGeometry(1.48,.78,.03),M.darkMetal);c.position.set(-.6,1.6,-8.0);add(c)}
  moniteur(.95,1.62,-7.99,0,{pied:false,w:.36,h:.22,mode:'courbes',titre:'SIGNAL',coin:'dB',graine:52,lignes:[]});
  H.lecteurAnt=new THREE.Mesh(new THREE.BoxGeometry(.6,.08,.04),glow(0xffb347,1.6));H.lecteurAnt.position.set(.9,1.2,-7.97);add(H.lecteurAnt);
  H.lumArmoire=plight(0x58e6ff,1.2,8,0,1.8,-6.8);
  Z.couverts.push({x0:-2.4,x1:2.4,z0:-14.4,z1:-9.6});
  // Gardiens de ronde et Faucheuse
  makeGardien(Z,[[-12,7.5],[13,7.5]],{yaw:Math.PI/2,attente:2.2,vue:12});
  makeGardien(Z,[[19,-17],[19,11]],{yaw:0,attente:2,vue:12});
  H.faucheuse=makeFaucheuse(Z,{cx:0,cz:0,rx:15,rz:15,h:10,v:.07,R:3.4,t0:2.4,lum:7,blindee:true}); // celle de Saal : réacteurs carénés
  // Saal et son escorte, au pied de l'antenne
  const pnj=(def,look)=>{const n=Object.assign({h:1.8,yaw:0},def);n.g=new THREE.Group();n.g.position.set(n.x,0,n.z);n.g.rotation.y=n.yaw;n.g.userData.pnj=true;add(n.g);
    n.tag=nameTag(n.name);n.tag.position.set(n.x,n.h+.55,n.z);add(n.tag);n.col=pushCol({x0:n.x-.3,x1:n.x+.3,z0:n.z-.3,z1:n.z+.3,los:false,off:false,pnj:true});
    habiller(n,look);Z.npcs.push(n);return n};
  H.saal=pnj({key:'saal',name:'VICTOR SAAL',x:1.6,z:-6.4,yaw:0,h:1.82},'saal');
  H.mara=pnj({key:'mara',name:'MARA',x:-3.6,z:-6.8,yaw:.3,h:1.72},'mara');
  H.nox=pnj({key:'nox',name:'NOX-7',x:19.2,z:-9,yaw:-Math.PI/2,h:1.76},'nox');
  H.escorte=[gardienImmobile(Z,-1.4,-5.6,.25),gardienImmobile(Z,4.6,-6.6,-.3)];
  H.gardeMara=gardienImmobile(Z,-4.8,-5.6,.6);

  // l'hologramme de la fin, projeté par l'antenne (texte redessiné selon la fin)
  {const[c,g]=mk(1024,576);H.holoCanvas={c,g};H.holoMat=holoMat(c,0x7fe6ff,1.5);H.holo=new THREE.Mesh(new THREE.PlaneGeometry(18,10),H.holoMat);H.holo.position.set(0,21,-9.2);H.holo.visible=false;add(H.holo)}
  // l'aube, à l'est : une lueur sur l'horizon, cachée jusqu'à la fin
  {const[c,g]=mk(256,256),gr=g.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(255,220,170,1)');gr.addColorStop(.22,'rgba(255,160,100,.65)');gr.addColorStop(.6,'rgba(220,110,90,.18)');gr.addColorStop(1,'rgba(200,100,90,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);
    H.soleil=new THREE.Mesh(new THREE.PlaneGeometry(300,150),new THREE.MeshBasicMaterial({map:canvasTex(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false,opacity:0}));
    H.soleil.position.set(330,-30,30);H.soleil.rotation.y=-Math.PI/2;H.soleil.visible=false;add(H.soleil)}
  flushLedges();
  Z.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial)o.receiveShadow=true});
  into(null);
};
Z.update=(dt,S)=>{
  if(!H.balisesAnt)return;
  if(!H.antenneMorte){H.balisesAnt.forEach((b,i)=>{b.visible=Math.sin(T*2.2-i*.5)>.1});H.lumAnt.intensity=Math.sin(T*2.2)>.1?1.8:.4}
  if(H.holo.visible)H.holoMat.uniforms.time.value=T;
  H.balisesHeli.forEach((b,i)=>{b.visible=Math.sin(T*5-i*.4)>-.3});
};
// Allume l'hologramme de l'antenne : un titre, des lignes, une couleur (null pour l'éteindre).
export function afficherHolo(titre,lignes,couleur){
  if(!H.holo)return;if(!titre){H.holo.visible=false;return}
  const{c,g}=H.holoCanvas;g.clearRect(0,0,1024,576);g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=5;g.strokeRect(8,8,1008,560);
  g.textAlign='center';g.font='700 88px "Saira Condensed",sans-serif';g.fillText(titre,512,130);
  g.font='500 46px "Saira Condensed",sans-serif';lignes.forEach((l,i)=>g.fillText(l,512,250+i*70));
  H.holoMat.uniforms.map.value.needsUpdate=true;H.holoMat.uniforms.color.value.setHex(couleur).multiplyScalar(1.5);H.holo.visible=true;
}
export function montrer(n,v){n.absent=!v;n.g.visible=v;n.tag.visible=v;n.col.off=!v}
export function deplacer(n,x,z,yaw){n.x=x;n.z=z;if(yaw!==undefined)n.yaw=yaw;n.g.position.set(x,0,z);n.g.rotation.y=n.yaw;n.tag.position.set(x,n.h+.55,z);Object.assign(n.col,{x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3})}

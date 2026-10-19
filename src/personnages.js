// Personnages glTF : chargement, retargeting des animations de Xbot, implants, pose procédurale de Sid,
// silhouettes de secours si les modèles ne chargent pas, étiquettes de nom.
// Les modèles regardent vers +Z, sauf soldier (Kovac, Gardiens) qui regarde vers -Z : flip:true pour lui seul.
import {THREE,V3,rnd,T} from './core.js';
import {glow,M} from './construire.js';
import {canvasTex,mk} from './textures.js';

const loader=new THREE.GLTFLoader();loader.setMeshoptDecoder(THREE.MeshoptDecoder);
export const loadGLB=name=>new Promise((res,rej)=>loader.load('assets/models/'+name+'.glb',res,undefined,rej));
export function prepClip(c,stripPrefix){const k=c.clone();k.tracks=k.tracks.filter(t=>!/\.(position|scale)$/.test(t.name));
  if(stripPrefix)k.tracks.forEach(t=>{t.name=t.name.replace(/^mixamorig/,'')});return k}
export function findBone(root,names){let b=null;root.traverse(o=>{if(!b&&o.isBone&&names.includes(o.name))b=o});return b}
export function attachTo(bone,mesh,x,y,z){const s=new V3();bone.getWorldScale(s);mesh.scale.multiplyScalar(1/s.x);mesh.position.set(x/s.x,y/s.x,z/s.x);bone.add(mesh)}
export function mountChar(n,root,clips,opt){
  // Les matériaux sont copiés avant d'être retouchés : les clones d'un même modèle ne se contaminent pas.
  root.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();
    const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.envMapIntensity=opt.env??.9;if(opt.mat)opt.mat(m,o)})}});
  const top=findBone(root,['mixamorigHeadTop_End','HeadTop_End','mixamorigHead','Head']),feet=[];
  root.traverse(o=>{if(o.isBone&&/(Toe_End|ToeBase|Foot)$/.test(o.name))feet.push(o)});
  const v=new V3();const meas=()=>{root.updateMatrixWorld(true);top.getWorldPosition(v);const ty=v.y;let fy=1e9;for(const f of feet){f.getWorldPosition(v);fy=Math.min(fy,v.y)}return[ty,fy]};
  let[ty,fy]=meas();root.scale.multiplyScalar(n.h/Math.max(.01,ty-fy));[ty,fy]=meas();root.position.y-=fy-.03;
  n.dbg=[ty,fy,root.scale.x];
  if(opt.flip)root.rotation.y+=Math.PI;
  n.g.add(root);n.root=root;
  const mx=new THREE.AnimationMixer(root);n.mixer=mx;
  if(!clips.idle){n.bones={};root.traverse(o=>{if(o.isBone)n.bones[o.name.replace(/^mixamorig/,'')]=o});n.rest={};for(const k in n.bones)n.rest[k]=n.bones[k].quaternion.clone();n.warm=1;return}
  const idle=mx.clipAction(clips.idle);idle.play();idle.time=rnd()*clips.idle.duration;idle.timeScale=.85+rnd()*.3;
  n.gest={};for(const k of['agree','shake']){if(!clips[k])continue;const a=mx.clipAction(clips[k]);a.blendMode=THREE.AdditiveAnimationBlendMode;a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=false;n.gest[k]=a}
}
// Modèles prêts à cloner (gardiens, figurants) : scène intacte, animations, échelle et décalage pour une taille donnée.
export const MODELES={};
export function preparerModele(nom,gltf,h){
  const sc=THREE.SkeletonUtils.clone(gltf.scene),top=findBone(sc,['mixamorigHeadTop_End','HeadTop_End','mixamorigHead','Head']),feet=[];
  sc.traverse(o=>{if(o.isBone&&/(Toe_End|ToeBase|Foot)$/.test(o.name))feet.push(o)});
  sc.updateMatrixWorld(true);const v=new V3();top.getWorldPosition(v);const ty=v.y;let fy=1e9;for(const f of feet){f.getWorldPosition(v);fy=Math.min(fy,v.y)}
  const echelle=h/Math.max(.01,ty-fy);MODELES[nom]={scene:sc,animations:gltf.animations,echelle,decalage:-fy*echelle+.03};
}
export function gesture(n,kind){if(!n||!n.gest)return;const a=n.gest[kind]||n.gest.agree;if(!a)return;a.reset();a.setEffectiveWeight(.9);a.play()}
export function restInfo(root){root.updateMatrixWorld(true);const m={};root.traverse(o=>{if(o.isBone){const pw=new THREE.Quaternion();o.parent.getWorldQuaternion(pw);m[o.name.replace(/^mixamorig/,'')]={local:o.quaternion.clone(),pw}}});return m}
export function retarget(clip,src,dst,prefix){
  const tracks=[];
  for(const t of clip.tracks){const dot=t.name.lastIndexOf('.'),node=t.name.slice(0,dot),prop=t.name.slice(dot+1);if(prop!=='quaternion')continue;
    const k=node.replace(/^mixamorig/,''),S=src[k],D=dst[k];if(!S||!D)continue;
    const C=D.pw.clone().invert().multiply(S.pw),Ci=C.clone().invert(),qxi=S.local.clone().invert(),q=new THREE.Quaternion(),v=t.values.slice();
    for(let i=0;i<v.length;i+=4){q.fromArray(v,i);C.clone().multiply(q).multiply(qxi).multiply(Ci).multiply(D.local).toArray(v,i)}
    tracks.push(new THREE.QuaternionKeyframeTrack(prefix+k+'.quaternion',t.times.slice(),v))}
  return new THREE.AnimationClip(clip.name,clip.duration,tracks);
}

/* Implants cybernétiques */
const cyberMat=new THREE.MeshStandardMaterial({color:0x23272e,roughness:.22,metalness:.95,envMapIntensity:1.7});
const cyberMat2=new THREE.MeshStandardMaterial({color:0x8d949e,roughness:.28,metalness:.92,envMapIntensity:1.5});
function boneEnd(root,suf){let b=null;root.traverse(o=>{if(!b&&o.isBone&&(o.name===suf||o.name==='mixamorig'+suf))b=o});return b}
function wsc(b){b.updateMatrixWorld(true);const v=new V3();b.getWorldScale(v);return v.x}
function mountOn(bone,grp){grp.scale.setScalar(1/wsc(bone));bone.add(grp)}
function segLen(bone){const c=bone.children.find(c=>c.isBone);return c?c.position.length()*wsc(bone):.25}
function sleeve(bone,r,col){
  if(!bone)return;const L=segLen(bone),g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,L*.9,18),cyberMat);body.position.y=L*.48;g.add(body);
  for(const k of[.2,.5,.8]){const ring=new THREE.Mesh(new THREE.CylinderGeometry(r*1.07,r*1.07,L*.035,18),cyberMat2);ring.position.y=L*k;g.add(ring)}
  for(const[a,b]of[[0,1],[1,0]]){const st=new THREE.Mesh(new THREE.BoxGeometry(r*.2,L*.6,r*.2),glow(col,2.6));st.position.set(a*r*.9,L*.5,b*r*.9);g.add(st)}
  const pl=new THREE.Mesh(new THREE.BoxGeometry(r*1.3,L*.35,r*.5),cyberMat2);pl.position.set(0,L*.62,-r*.75);g.add(pl);
  const joint=new THREE.Mesh(new THREE.SphereGeometry(r*1.12,18,12),cyberMat2);g.add(joint);
  const jl=new THREE.Mesh(new THREE.TorusGeometry(r*1.14,r*.09,6,22),glow(col,2.6));jl.rotation.x=Math.PI/2;g.add(jl);
  mountOn(bone,g);
}
function cyberHand(bone,col){
  if(!bone)return;const g=new THREE.Group();
  const palm=new THREE.Mesh(new THREE.BoxGeometry(.078,.088,.036),cyberMat2);palm.position.y=.045;g.add(palm);
  for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.015,.065,.017),cyberMat);f.position.set(-.028+i*.019,.115,0);g.add(f)}
  const k=new THREE.Mesh(new THREE.BoxGeometry(.074,.007,.04),glow(col,2.8));k.position.y=.088;g.add(k);mountOn(bone,g);
}
function cyberHead(bone,col,side){
  if(!bone)return;const g=new THREE.Group();
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.0135,12,10),glow(col,4.5));eye.position.set(side*.033,.088,.092);g.add(eye);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.02,.0045,6,18),cyberMat2);ring.position.set(side*.033,.088,.088);g.add(ring);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(.016,.075,.1),cyberMat2);plate.position.set(side*.079,.095,.005);g.add(plate);
  for(const y of[.075,.095,.115]){const l=new THREE.Mesh(new THREE.BoxGeometry(.005,.004,.06),glow(col,3));l.position.set(side*.088,y,.01);g.add(l)}
  mountOn(bone,g);
}
function cyberNeck(bone,col){if(!bone)return;const g=new THREE.Group();for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.02,.012,.014),glow(col,3));p.position.set(0,.015+i*.024,-.058);g.add(p)}mountOn(bone,g)}
export function cyberize(n,o){const r=n.root;
  if(o.arm){const sd=o.arm;sleeve(boneEnd(r,sd+'Arm'),o.r1,o.col);sleeve(boneEnd(r,sd+'ForeArm'),o.r2,o.col);cyberHand(boneEnd(r,sd+'Hand'),o.col)}
  if(o.head)cyberHead(boneEnd(r,'Head'),o.col,o.head);
  if(o.neck)cyberNeck(boneEnd(r,o.neckBone||'Neck'),o.col);
}

const _q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_q3=new THREE.Quaternion(),_q4=new THREE.Quaternion();
function boneWorldQ(b,rest,q){b.parent.getWorldQuaternion(_q1);_q3.copy(_q1).invert();b.quaternion.copy(_q3.multiply(q).multiply(_q1).multiply(rest));b.updateMatrixWorld(true)}
function boneWorldRot(b,rest,axis,ang){boneWorldQ(b,rest,_q2.setFromAxisAngle(axis,ang))}
// Sid regarde vers +Z local, sa gauche est +X. warm = 1 : il se chauffe les mains au-dessus du baril.
export function poseSid(n){
  const B=n.bones,R=n.rest;if(!B.Spine)return;
  for(const k in B)B[k].quaternion.copy(R[k]);n.g.updateMatrixWorld(true);
  const gq=n.g.quaternion,left=new V3(1,0,0).applyQuaternion(gq),fwd=new V3(0,0,1).applyQuaternion(gq),up=new V3(0,1,0),w=n.warm||0;
  const br=Math.sin(T*1.6)*.025;
  if(B.Spine1)boneWorldRot(B.Spine1,R.Spine1,left,.2+.1*w+br);
  for(const[s,sg]of[['Left',1],['Right',-1]]){
    const a=B[s+'Arm'],f=B[s+'ForeArm'];
    if(a){_q4.setFromAxisAngle(fwd,-sg*(.5-.05*w));boneWorldQ(a,R[s+'Arm'],_q2.setFromAxisAngle(left,-(.1+.45*w)).multiply(_q4))}
    if(f){_q4.setFromAxisAngle(up,-sg*.45*w);boneWorldQ(f,R[s+'ForeArm'],_q4.multiply(_q2.setFromAxisAngle(left,-(.25+1.05*w))))}
  }
  if(B.Head){B.Neck&&B.Neck.updateMatrixWorld(true);_q4.setFromAxisAngle(up,Math.sin(T*.35)*.3*(1-.7*w));boneWorldQ(B.Head,R.Head,_q4.multiply(_q2.setFromAxisAngle(left,.25*w)))}
}

/* Silhouette de secours, si les modèles glTF ne chargent pas */
export function figure(o){
  const g=new THREE.Group();
  const coat=new THREE.MeshStandardMaterial({color:o.coat,roughness:.45,metalness:.15,envMapIntensity:.9});
  const pants=new THREE.MeshStandardMaterial({color:0x111216,roughness:.6});
  const skin=new THREE.MeshStandardMaterial({color:o.skin||0xc49a7c,roughness:.55});
  const legG=new THREE.CylinderGeometry(.09,.08,.86,10);
  for(const sx of[-.11,.11]){const l=new THREE.Mesh(legG,pants);l.position.set(sx,.43,0);g.add(l)}
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.27,o.long?.38:.3,o.long?.7:.4,16),coat);skirt.position.y=o.long?.85:.95;g.add(skirt);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.27,.24,.62,16),coat);torso.position.y=1.42;g.add(torso);
  const sh=new THREE.Mesh(new THREE.SphereGeometry(.27,16,10),coat);sh.scale.set(1.18,.45,.82);sh.position.y=1.7;g.add(sh);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(.17,.22,.18,16,1,true),coat);col.position.y=1.8;g.add(col);
  for(const sd of[-1,1]){
    const mech=o.mech&&sd===1;
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.075,.062,.7,10),mech?M.metal:coat);arm.position.set(sd*.34,1.37,0);arm.rotation.z=sd*.09;g.add(arm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(mech?.08:.06,10,8),mech?M.metal:skin);hand.position.set(sd*.38,1.0,0);g.add(hand);
    if(mech){for(const y of[1.2,1.45]){const j=new THREE.Mesh(new THREE.SphereGeometry(.03,6,6),glow(0xffa040,2.5));j.position.set(.37,y,.06);g.add(j)}}
  }
  if(o.belt){const b=new THREE.Mesh(new THREE.TorusGeometry(.25,.018,6,24),glow(o.belt,1.8));b.rotation.x=Math.PI/2;b.position.y=1.14;g.add(b)}
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.12,8),skin);neck.position.y=1.76;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.14,18,12),skin);head.scale.set(1,1.12,1.02);head.position.y=1.92;g.add(head);
  if(o.hair){const h=new THREE.Mesh(new THREE.SphereGeometry(.152,16,10,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:o.hair,roughness:.5}));h.position.set(0,1.95,-.01);h.scale.set(1,1.15,1.05);g.add(h);
    if(o.long){const t=new THREE.Mesh(new THREE.BoxGeometry(.26,.32,.06),h.material);t.position.set(0,1.78,-.12);g.add(t)}}
  if(o.hood){const h=new THREE.Mesh(new THREE.SphereGeometry(.2,16,10,0,Math.PI*2,0,Math.PI*.62),coat);h.position.set(0,1.92,-.04);h.scale.set(1,1.1,1.08);g.add(h)}
  if(o.beanie){const h=new THREE.Mesh(new THREE.SphereGeometry(.155,16,8,0,Math.PI*2,0,Math.PI*.5),new THREE.MeshStandardMaterial({color:o.beanie,roughness:.9}));h.position.y=1.97;g.add(h)}
  if(o.visor){const v=new THREE.Mesh(new THREE.BoxGeometry(.22,.035,.05),glow(o.visor,2.6));v.position.set(0,1.95,.125);g.add(v)}
  if(o.cig){const c=new THREE.Mesh(new THREE.SphereGeometry(.018,6,6),glow(0xff5a20,3));c.position.set(-.38,1.06,.08);g.add(c);g.userData.cig=c}
  if(o.hunch){torso.rotation.x=.18;sh.position.z=.06;head.position.z=.08;neck.position.z=.05}
  if(o.scale)g.scale.setScalar(o.scale);
  return g;
}
export function nameTag(text){
  const[c,g]=mk(320,72);g.font='600 36px "Saira Condensed","Arial Narrow",sans-serif';const w=g.measureText(text).width+30;
  g.fillStyle='rgba(7,7,9,.7)';g.fillRect(160-w/2,14,w,44);g.fillStyle='#f0a53a';g.fillRect(160-w/2,14,4,44);
  g.fillStyle='#efe7d6';g.textAlign='center';g.textBaseline='middle';g.fillText(text,162,37);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTex(c),transparent:true,depthWrite:false,fog:false}));s.scale.set(1.5,.34,1);return s;
}
export function fallbackChars(npcs){for(const n of npcs){if(n.root)continue;const f=figure(n.o);n.g.add(f);n.root=f;if(f.userData.cig)n.cig=f.userData.cig}}

// Le vieux Sid : manteau usé, barbe grise, bonnet et écharpe à la place du costume et du chapeau du modèle d'origine.
export function habillerSid(n){
  n.root.traverse(o=>{if(!o.isMesh)return;const nm=o.name;
    if(/Headwear/.test(nm)){o.visible=false;return}
    if(/Outfit_Top|Outfit_Bottom|Beard/.test(nm))o.material=o.material.clone();const m=o.material;
    if(/Outfit_Top/.test(nm)){m.color.setHex(0x5e554b);m.roughness=.95}
    else if(/Outfit_Bottom/.test(nm)){m.color.setHex(0x4a463f);m.roughness=.95}
    else if(/Beard/.test(nm))m.color.setHex(0xc4beb4)});
  const wool=c=>new THREE.MeshStandardMaterial({color:c,roughness:1});
  const head=findBone(n.root,['Head']);if(head){const b=new THREE.Mesh(new THREE.SphereGeometry(.122,20,12,0,Math.PI*2,0,Math.PI*.52),wool(0x6a2a1a));attachTo(head,b,0,.135,-.018);b.scale.y*=.9;b.castShadow=true}
  const neck=findBone(n.root,['Neck']);if(neck){const sc=new THREE.Mesh(new THREE.TorusGeometry(.068,.032,8,20),wool(0x39402c));sc.rotation.x=Math.PI/2;attachTo(neck,sc,0,.035,.005)}
}

/* ---------- Les personnages récurrents, réutilisables d'une zone à l'autre ---------- */
// La clé de cache du programme doit suivre le code ajouté : sinon Three.js réutilise le premier shader compilé pour tous.
const recolor=glsl=>m=>{m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n{vec3 c=diffuseColor.rgb;'+glsl+'}')};m.customProgramCacheKey=()=>glsl};
// Retouche des couleurs du modèle michelle (valeurs linéaires mesurées sur sa texture) : cheveux (très sombres, gris neutre),
// pantalon (jaune), haut (gris moyen). Chaque teinte garde le relief de la texture.
const v3=a=>`vec3(${a.map(x=>(+x).toFixed(3)).join(',')})`;
const teinte=o=>recolor(`float l=dot(c,vec3(.3,.59,.11)),s=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));`+
  (o.cheveux?`diffuseColor.rgb=mix(diffuseColor.rgb,${v3(o.cheveux)}*(.6+l*22.),step(l,.035)*step(s,.02));`:'')+
  (o.pantalon?`diffuseColor.rgb=mix(diffuseColor.rgb,${v3(o.pantalon)}*(.35+c.g),smoothstep(.12,.3,min(c.r,c.g)-c.b)*step(c.b*1.6,c.g));`:'')+
  (o.haut?`diffuseColor.rgb=mix(diffuseColor.rgb,${v3(o.haut)}*(.5+l*3.),step(.09,l)*step(l,.3)*step(s,.07));`:'')+
  (o.rouge?`diffuseColor.rgb=mix(diffuseColor.rgb,${v3(o.rouge)}*(.4+c.r),step(.2,c.r)*step(c.g*4.,c.r)*step(c.b*4.,c.r));`:''));
/* Vêtements simples accrochés aux os : veste ou blouse (buste ouvert devant, pans jusqu'aux genoux si long), manches.
   sauf : le bras laissé nu (prothèse K7). */
const tissus={};
const tissu=c=>tissus[c]||(tissus[c]=new THREE.MeshStandardMaterial({color:c,roughness:.9,metalness:0,envMapIntensity:.45,side:THREE.DoubleSide}));
function piece(bone,geo,mat,y){if(!bone)return;const g=new THREE.Group(),m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=true;g.add(m);mountOn(bone,g);return m}
export function vetir(n,{col,long=false,ouvert=.38,sauf=null,prof=.8}){
  const r=n.root,mat=tissu(col),k=n.h/1.72;
  const buste=piece(boneEnd(r,'Spine1'),new THREE.CylinderGeometry(.142*k,.158*k,.46*k,20,1,true,ouvert,Math.PI*2-ouvert*2),mat,.05*k);if(buste)buste.scale.z=prof;
  if(long){const pans=piece(boneEnd(r,'Hips'),new THREE.CylinderGeometry(.165*k,.235*k,.5*k,20,1,true,ouvert*.6,Math.PI*2-ouvert*1.2),mat,-.27*k);if(pans)pans.scale.z=.78}
  for(const sd of['Left','Right']){if(sd===sauf)continue;
    for(const[b,r1,r2]of[['Arm',.058,.05],['ForeArm',.05,.042]]){const os=boneEnd(r,sd+b);if(!os)continue;const L=segLen(os);piece(os,new THREE.CylinderGeometry(r2*k,r1*k,L*.96,12,1,true),mat,L*.48)}}
}
/* Coiffure : les deux gros chignons du modèle michelle sont ramenés contre le crâne (coupe courte), avant un chignon
   ou un foulard éventuel. Les cheveux sont repérés par la couleur de la texture sous chaque sommet (très sombre,
   gris neutre), au-dessus du cou. La géométrie est copiée : les autres clones gardent la leur. */
const _m4=new THREE.Matrix4(),_m5=new THREE.Matrix4();
export function coiffer(n,{rayon=1.08,chignon=null,foulard=null}={}){
  let sk=null;n.root.traverse(o=>{if(o.isSkinnedMesh&&!sk)sk=o});const img=sk&&sk.material.map&&sk.material.map.image;if(!img)return;
  const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const g2=cv.getContext('2d');g2.drawImage(img,0,0);const px=g2.getImageData(0,0,cv.width,cv.height).data;
  const geo=sk.geometry.clone(),pos=geo.attributes.position,nor=geo.attributes.normal,uv=geo.attributes.uv;sk.geometry=geo;
  const kp=pos.normalized?1/32767:1,kn=nor.normalized?1/32767:1,ku=uv.normalized?1/65535:1;
  const f=new Float32Array(pos.count*3),fn=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){f[i*3]=pos.getX(i)*kp;f[i*3+1]=pos.getY(i)*kp;f[i*3+2]=pos.getZ(i)*kp;fn[i*3]=nor.getX(i)*kn;fn[i*3+1]=nor.getY(i)*kn;fn[i*3+2]=nor.getZ(i)*kn}
  // La tête, dans le repère de la géométrie
  const sq=sk.skeleton,iH=sq.bones.findIndex(b=>/Head$/.test(b.name)),iT=sq.bones.findIndex(b=>/HeadTop_End$/.test(b.name));if(iH<0||iT<0)return;
  _m4.copy(sk.bindMatrix).invert();const os=i=>new V3().setFromMatrixPosition(_m5.copy(sq.boneInverses[i]).invert()).applyMatrix4(_m4);
  const h=os(iH),t=os(iT),L0=h.distanceTo(t),c=h.clone().lerp(t,.5),R=L0*.5*rayon,cou=h.y-L0*.25,d=new V3();
  for(let i=0;i<pos.count;i++){
    if(f[i*3+1]<cou)continue;
    const x=Math.min(cv.width-1,Math.floor(uv.getX(i)*ku*cv.width)),y=Math.min(cv.height-1,Math.floor(uv.getY(i)*ku*cv.height)),o=(y*cv.width+x)*4;
    d.set(f[i*3]-c.x,f[i*3+1]-c.y,f[i*3+2]-c.z);const L=d.length();if(L<=R)continue;
    const r=px[o]/255,g=px[o+1]/255,b=px[o+2]/255;if(L<R*1.3&&(.3*r+.59*g+.11*b>.2||Math.max(r,g,b)-Math.min(r,g,b)>.08))continue;
    d.multiplyScalar(1/L);f[i*3]=c.x+d.x*R;f[i*3+1]=c.y+d.y*R;f[i*3+2]=c.z+d.z*R;fn[i*3]=d.x;fn[i*3+1]=d.y;fn[i*3+2]=d.z;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(f,3));geo.setAttribute('normal',new THREE.BufferAttribute(fn,3));geo.computeBoundingSphere();
  // Chignon (sur la nuque) ou foulard (sur le crâne), accrochés à l'os de la tête : tailles en mètres, à l'échelle du personnage
  const tete=findBone(n.root,['mixamorigHead']);if(!tete)return;const k=n.h/1.72;
  if(chignon){const b=new THREE.Mesh(new THREE.SphereGeometry(.058*k,14,10),new THREE.MeshStandardMaterial({color:chignon,roughness:.75}));b.scale.set(1,.85,.9);attachTo(tete,b,0,.13*k,-.085*k);b.castShadow=true}
  if(foulard){const b=new THREE.Mesh(new THREE.SphereGeometry(.112*k,18,10,0,Math.PI*2,0,Math.PI*.56),tissu(foulard));b.scale.set(1,.95,1.08);b.rotation.x=-.2;attachTo(tete,b,0,.105*k,-.012*k);b.castShadow=true}
}
export const LOOKS={
  mara:{modele:'michelle',env:.8,mat:recolor('float y=smoothstep(.12,.3,min(c.r,c.g)-c.b)*step(c.b*1.6,c.g);diffuseColor.rgb=mix(c,vec3(c.r*.42+.05,c.g*.06,c.g*.1),y);'),
    apres:n=>{const hand=findBone(n.root,['mixamorigRightHand']);if(hand){const c=new THREE.Mesh(new THREE.SphereGeometry(.014,6,6),glow(0xff5a20,3));attachTo(hand,c,0,.09,.02);n.cig=c}
      cyberize(n,{arm:'Right',r1:.047,r2:.04,col:0xff3d6a,head:1,neck:true})}},
  nox:{modele:'xbot',env:1.4,mat:m=>{if(/Joints/.test(m.name)){m.color.setHex(0x1c2a33);m.emissive=new THREE.Color(0x2ad8ff);m.emissiveIntensity=.55;m.metalness=.8;m.roughness=.3}else{m.color.setHex(0xb9c2cc);m.metalness=.55;m.roughness=.32}},
    apres:n=>cyberize(n,{neck:true,col:0x2ad8ff})},
  sid:{modele:'sid',env:.7,pose:true,apres:n=>{habillerSid(n);cyberize(n,{arm:'Left',r1:.052,r2:.045,col:0xffa040,head:-1,neck:true})}},
  // Rosa Delorme : cheveux gris, bleu de travail, veste de toile, bras gauche K7
  rosa:{modele:'michelle',env:.7,mat:teinte({cheveux:[.36,.355,.35],pantalon:[.025,.03,.05],haut:[.06,.07,.05],rouge:[.05,.05,.055]}),
    apres:n=>{coiffer(n);vetir(n,{col:0x2c3a2e,sauf:'Left'});cyberize(n,{arm:'Left',r1:.052,r2:.046,col:0xffb347,neck:true})}},
  // Dr Ilse Varga : blouse blanche fermée, cheveux blond foncé, œil K7
  varga:{modele:'michelle',env:.9,mat:teinte({cheveux:[.3,.2,.1],pantalon:[.05,.05,.055],haut:[.035,.035,.04],rouge:[.12,.12,.13]}),
    apres:n=>{coiffer(n,{chignon:0x4a3420});vetir(n,{col:0xc9ccd0,long:true,ouvert:.1,prof:.95});cyberize(n,{head:1,col:0x58e6ff})}},
  // Victor Saal : le costume et le chapeau d'origine du modèle, en sombre, rasé de près, aucun implant visible
  saal:{modele:'sid',env:.9,pose:true,apres:n=>{n.root.traverse(o=>{if(!o.isMesh)return;const nm=o.name;
      if(/Beard/.test(nm)){o.visible=false;return}
      const c=/Outfit_Top/.test(nm)?0x404654:/Outfit_Bottom/.test(nm)?0x2c3038:/Headwear/.test(nm)?0x2a2c32:/Footwear/.test(nm)?0x18181a:null;
      if(c!==null){o.material=o.material.clone();o.material.color.setHex(c)}})}},
  // Figurante : une canuse en bleu de travail, bras droit K7
  canut:{modele:'michelle',env:.7,mat:teinte({cheveux:[.12,.045,.02],pantalon:[.02,.03,.06],haut:[.18,.24,.34],rouge:[.06,.06,.065]}),
    apres:n=>{coiffer(n,{foulard:0x7a2a22});vetir(n,{col:0x24344e,sauf:'Right'});cyberize(n,{arm:'Right',r1:.05,r2:.044,col:0xffb347})}},
};
// Monte le personnage n (doit avoir g, h) avec un habillage de LOOKS ; silhouette de secours si les modèles manquent.
export function habiller(n,nom){
  const L=LOOKS[nom],M=MODELES[L.modele];
  if(!M){const f=figure(n.o||{coat:0x3a3530,skin:0xb08870});n.g.add(f);n.root=f;return n}
  mountChar(n,THREE.SkeletonUtils.clone(M.scene),L.pose?{}:(M.clips||{}),{env:L.env,mat:L.mat,flip:L.modele==='soldier'});
  try{L.apres(n)}catch(e){console.warn('habillage',nom,e)}
  return n;
}

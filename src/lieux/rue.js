// La rue de Lyon-Basse : labo Helix, dépôt, bar de Kovac, ruelle de Sid, personnages et drones des chapitres 1 et 2.
// L'ordre de construction suit l'ordre d'origine : il fixe la suite aléatoire, donc l'aspect de la ville.
import {THREE,V3,rnd,T,on,quality,camera} from '../core.js';
import {PUD,PUDD,canvasTex,mk,asphaltCanvas,roughCanvas} from '../textures.js';
import {into,add,pushCol,M,glow,addBox,building,neon,plight,shaft,Particles,steam,cable,acUnit,lamp,bmats,boxGeoWorldUV,spot,shadowPoint,ombre,flushLedges,flamme} from '../construire.js';
import {makeZone} from '../zones.js';
import {makeDrone} from '../drones.js';
import {nameTag,loadGLB,restInfo,retarget,prepClip,mountChar,findBone,attachTo,cyberize,fallbackChars} from '../personnages.js';

export const Z=makeZone('rue',{
  indoor:p=>p.x>-7.5&&p.x<7.5&&p.z>-51.5&&p.z<-40.5,
  surfaceAt:p=>{
    if(Z.indoor(p))return'tile';
    for(const[x,z]of MANHOLES)if((p.x-x)**2+(p.z-z)**2<.2)return'metal';
    const u=((p.x+130)/260*12)%1,v=((130-p.z)/260*12)%1;
    return PUDD[(Math.floor((1-v)*512)&511)*512+(Math.floor(u*512)&511)]>240?'puddle':'asphalt';
  },
});
export const insideLab=p=>Z.indoor(p);
// Sons d'ambiance placés : le feu de Sid, la vapeur des plaques d'égout, le néon du bar.
Z.sons=[{type:'feu',pos:[-12.6,1.2,-15.8]},{type:'vapeur',pos:[-2,.2,8],vol:.45},{type:'vapeur',pos:[2.5,.2,-16],vol:.45},{type:'vapeur',pos:[-1.5,.2,-31],vol:.45},{type:'neon',pos:[5.95,3.85,5],vol:.25}];
const MANHOLES=[[-2,8],[2.5,-16],[-1.5,-31]];
// Objets que l'histoire anime ou modifie
export const H={};

export function buildRue(){
into(Z);
/* ---------- Ground (asphalt + wet reflection) ---------- */
const groundTex=canvasTex(asphaltCanvas(),true);groundTex.repeat.set(12,12);
const roughTex=canvasTex(roughCanvas(),true,true);roughTex.repeat.set(12,12);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,260),new THREE.MeshStandardMaterial({map:groundTex,roughnessMap:roughTex,roughness:1,bumpMap:groundTex,bumpScale:.02,metalness:.35,envMapIntensity:.7}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;add(ground);
let reflector=null;
const pudTex=canvasTex(PUD,true,true);
{
  const RS={uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},tMask:{value:null},time:{value:0},camPos:{value:new V3()},fogD:{value:.023}},
    vertexShader:`uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`uniform vec3 color;uniform sampler2D tDiffuse;uniform sampler2D tMask;uniform float time;uniform vec3 camPos;uniform float fogD;varying vec4 vUv;varying vec3 vW;
      void main(){
        vec2 wuv=vec2((vW.x+130.)/260.*12.,(130.-vW.z)/260.*12.);
        float m=smoothstep(.15,.75,texture2D(tMask,wuv).r);
        float n1=texture2D(tMask,wuv*5.3+vec2(time*.02,0.)).r,n2=texture2D(tMask,wuv*7.1-vec2(0.,time*.03)).r;
        vec2 rip=vec2(sin(vW.x*9.+time*4.+n1*8.),cos(vW.z*8.-time*3.5+n2*8.))*.0035*m;
        vec2 rough=(vec2(n1,n2)-.5)*.03*(1.-m);
        vec4 uv=vUv;uv.xy+=(rip+rough)*uv.w;
        float bl=mix(.028,.004,m);vec3 r=vec3(0.);
        for(int i=0;i<6;i++){vec4 u=uv;u.y+=(float(i)-1.5)*bl*uv.w;r+=texture2DProj(tDiffuse,u).rgb;}
        r=pow(r/6.,vec3(2.2));
        vec3 V=normalize(camPos-vW);float fres=.3+.7*pow(1.-clamp(V.y,0.,1.),3.);
        float k=mix(.32,1.,m)*fres;float d=length(camPos-vW);float f=exp(-pow(d*fogD,2.));
        gl_FragColor=vec4(r*color*k*f,1.);}`};
  reflector=new THREE.Reflector(new THREE.PlaneGeometry(260,260),{shader:RS,color:0xffffff,clipBias:.003,textureWidth:Math.round(innerWidth*.5),textureHeight:Math.round(innerHeight*.5)});
  reflector.material.uniforms.tMask.value=pudTex;
  reflector.material.transparent=true;reflector.material.blending=THREE.AdditiveBlending;reflector.material.depthWrite=false;
  reflector.rotation.x=-Math.PI/2;reflector.position.y=.006;reflector.renderOrder=-1;add(reflector);
}
H.reflector=reflector;
addBox(-6,-4.7,-30,34,0,.13,M.curb,{collide:false});
addBox(4.7,6,-30,34,0,.13,M.curb,{collide:false});
addBox(-4.75,-4.65,-30,34,0,.14,M.metal,{collide:false});addBox(4.65,4.75,-30,34,0,.14,M.metal,{collide:false});
for(let z=-26;z<32;z+=6){const d=new THREE.Mesh(new THREE.PlaneGeometry(.16,2.4),M.paint);d.rotation.x=-Math.PI/2;d.position.set(0,.012,z);add(d)}
for(let x=-4;x<=4;x+=1.1){const d=new THREE.Mesh(new THREE.PlaneGeometry(.55,3),M.paint);d.rotation.x=-Math.PI/2;d.position.set(x,.012,-29);add(d)}
for(const[x,z]of MANHOLES){const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.03,24),M.metal);m.position.set(x,.015,z);add(m);const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,6,24),M.darkMetal);ring.rotation.x=Math.PI/2;ring.position.set(x,.03,z);add(ring);steam(x,.05,z,0xc8d0e8,{a:.22,rate:9,s1:3.2})}

/* ---------- City blocks ---------- */
building(-22,-6,-6,34,22);building(-22,-14,-46,-6,30);building(-9,-6,-30,-12,14);building(-22,-8,-52,-46,18);
building(6,22,-30,0,26);building(6,22,10,34,18);building(9,22,0,10,12);building(8,22,-52,-41,34);building(20,22,-41,-30,20);
/* Dépôt Helix : grille laser alimentée par les drones */
H.gateLasers=[];for(let i=0;i<7;i++){const y=.3+i*.34;H.gateLasers.push(addBox(8.18,8.22,-40.7,-30.3,y,y+.025,glow(0xff2a2a,3.2),{collide:false}))}
for(const z of[-40.75,-30.25])addBox(8.05,8.35,z-.15,z+.15,0,2.7,M.darkMetal,{collide:false});
H.gateCol=pushCol({x0:8,x1:8.4,z0:-41,z1:-30,los:false,off:false});
H.gateLight=plight(0xff2a2a,1.5,7,8.8,1.4,-35.5);
addBox(14.6,16.2,-40.6,-39,0,1.2,M.wood,{los:false});addBox(14.9,15.9,-40.4,-39.4,1.2,1.9,M.wood,{collide:false});
addBox(18,19.7,-33,-31.1,0,1.5,M.dumpster,{los:false});
addBox(16.5,17.7,-36.3,-34.7,0,.9,M.darkMetal,{los:false});
const battery=new THREE.Group();
battery.add(new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.52,20),M.metal));
const batGlow=new THREE.Mesh(new THREE.CylinderGeometry(.168,.168,.3,20),glow(0x4dff9a,1.8));battery.add(batGlow);
const batCap=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.08,12),M.darkMetal);batCap.position.y=.3;battery.add(batCap);
battery.position.set(17.1,1.2,-35.5);add(battery);H.battery=battery;
H.batLight=plight(0x4dff9a,1.8,5,17.1,1.7,-35.5);
plight(0xffa040,1.3,13,13.5,4.5,-35.5);

building(-22,22,-64,-52,42);building(-22,22,34,40,16);

// Câbles et lanternes
for(let i=0;i<9;i++){const z=-28+i*7+rnd()*2;cable(-6,8+rnd()*8,z,6,8+rnd()*8,z+(rnd()-.5)*3,1+rnd()*1.5,i===4||i===6?9:0)}
cable(-6,6.5,-2,6,7,12,1.2,0);cable(-9,9,-20,-14,10,-28,.6,0);cable(-9,8,-34,-14,9,-38,.8,0);
// Climatiseurs, escaliers de secours
for(let i=0;i<10;i++)acUnit(-5.75,3+rnd()*15,-4+rnd()*36,1);
for(let i=0;i<8;i++)acUnit(5.75,3+rnd()*18,-28+rnd()*26,-1);
for(let i=0;i<5;i++)acUnit(5.75,4+rnd()*11,12+rnd()*20,-1);
for(let f=0;f<5;f++){const y=4+f*3.2;addBox(-6,-4.9,25,30,y,y+.08,M.darkMetal,{collide:false});
  for(let z=25;z<=30;z+=.5)addBox(-5,-4.94,z-.02,z+.02,y,y+1,M.darkMetal,{collide:false});addBox(-5.02,-4.92,25,30,y+1,y+1.05,M.darkMetal,{collide:false})}
// Bandes néon verticales
for(const[x,z,c,h]of[[-5.98,-6,0xff3d8b,20],[5.98,-30,0x58e6ff,24],[5.98,10,0xffb347,16],[-5.98,34,0x9a6bff,14],[8,-30.02,0x58e6ff,30]])addBox(x-.04,x+.04,z-.04,z+.04,1,1+h,glow(c,2.2),{collide:false});

/* ---------- Grillage ---------- */
{
  const[c,g]=mk(64,64);g.strokeStyle='#aab3bd';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(64,64);g.moveTo(64,0);g.lineTo(0,64);g.stroke();
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(20,5);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(10,2.8),new THREE.MeshStandardMaterial({map:t,alphaTest:.4,transparent:true,side:THREE.DoubleSide,metalness:.7,roughness:.3}));
  m.rotation.y=Math.PI/2;m.position.set(-8.5,1.4,-35);add(m);
  pushCol({x0:-8.6,x1:-8.4,z0:-40,z1:-30,los:true,off:false});
  for(let z=-40;z<=-30;z+=2.5)addBox(-8.55,-8.45,z-.05,z+.05,0,2.9,M.metal,{collide:false});
}

/* ---------- Helix lab ---------- */
addBox(-8,-1,-40.5,-40,0,6,M.lab);addBox(1,8,-40.5,-40,0,6,M.lab);addBox(-1,1,-40.5,-40,3.2,6,M.lab,{collide:false});
addBox(-8,8,-52,-51.5,0,6,M.lab);addBox(-8,-7.5,-51.5,-40.5,0,6,M.lab);addBox(7.5,8,-51.5,-40.5,0,6,M.lab);
addBox(-8.2,8.2,-52.2,-39.8,6,6.5,M.lab,{collide:false});
{const m=new THREE.Mesh(boxGeoWorldUV(14,16,10,24),bmats[2]);m.position.set(0,14.5,-46);add(m)}
addBox(-8,8,-39.98,-39.94,5.6,5.72,glow(0x58e6ff,2.4),{collide:false});
addBox(-1.2,1.2,-39.96,-39.92,3.2,3.3,glow(0x58e6ff,2.4),{collide:false});
for(const x of[-7.95,7.95])addBox(x-.04,x+.04,-40.02,-39.94,0,5.6,glow(0x58e6ff,2),{collide:false});
// Sol du labo : dalles de 60 cm (texture dessinée, sans tirage aléatoire pour ne pas décaler la ville)
{const[c,g]=mk(512,512);g.fillStyle='#8e979d';g.fillRect(0,0,512,512);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=136+((i*7+j*13)%5)*4;g.fillStyle=`rgb(${v},${v+8},${v+14})`;g.fillRect(i*128+3,j*128+3,122,122)}
  g.fillStyle='rgba(20,24,28,.85)';for(let k=0;k<=4;k++){g.fillRect(k*128-2,0,4,512);g.fillRect(0,k*128-2,512,4)}
  const t=canvasTex(c,true);t.repeat.set(15/2.4,11/2.4);M.labFloor.map=t;M.labFloor.color.setHex(0xffffff);M.labFloor.needsUpdate=true}
const floorLab=new THREE.Mesh(new THREE.PlaneGeometry(15,11),M.labFloor);floorLab.rotation.x=-Math.PI/2;floorLab.position.set(0,.015,-46);add(floorLab);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(15,11),new THREE.MeshStandardMaterial({color:0x2a2f35,roughness:.8}));ceil.rotation.x=Math.PI/2;ceil.position.set(0,5.95,-46);add(ceil);
H.ceilPanels=[];
for(const x of[-4,0,4]){H.ceilPanels.push(addBox(x-.9,x+.9,-46.3,-45.7,5.85,5.92,glow(0xe8f8ff,1.25),{collide:false}));shaft(x,5.85,-46,.9,2.2,5.8,0xbfe8ff,.1)}
H.door=addBox(-1,1,-40.4,-40.1,0,3.2,new THREE.MeshStandardMaterial({color:0x2c3138,roughness:.25,metalness:.85,envMapIntensity:1.3}));
H.doorCol=H.door.userData.col;
H.doorStrip=new THREE.Mesh(new THREE.BoxGeometry(1.7,.06,.04),glow(0xff3d3d,2));H.doorStrip.position.set(0,1.6,-40.08);add(H.doorStrip);
addBox(1.45,1.85,-40.0,-39.9,1.2,1.7,M.darkMetal,{collide:false});
H.keyLed=new THREE.Mesh(new THREE.BoxGeometry(.28,.08,.02),glow(0xff3d3d,2));H.keyLed.position.set(1.65,1.6,-39.88);add(H.keyLed);
addBox(-8.12,-8.0,-44.6,-43.4,.25,1.25,M.darkMetal,{collide:false});
for(let i=0;i<5;i++)addBox(-8.16,-8.12,-44.55,-43.45,.35+i*.2,.42+i*.2,M.metal,{collide:false});
addBox(-7.5,-7.38,-44.6,-43.4,.25,1.25,M.darkMetal,{collide:false});
addBox(5.6,7.4,-46.5,-42,0,2.6,M.darkMetal);
H.rackLeds=[];
for(let i=0;i<22;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(.03,.04,.06),glow(rnd()<.7?0x4dff9a:0x58e6ff,2.5));l.position.set(5.58,.3+rnd()*2.2,-46.3+rnd()*4.1);add(l);H.rackLeds.push(l)}
addBox(2.8,5.2,-51.5,-50.6,0,.95,M.darkMetal,{los:false});
// Paillasses, appareils et chemins de câbles
{const top=new THREE.MeshStandardMaterial({color:0xc9d2d8,roughness:.35,metalness:.1,envMapIntensity:.7}),dev=new THREE.MeshStandardMaterial({color:0x2b3036,roughness:.4,metalness:.6,envMapIntensity:1});
  addBox(-6.6,-2.6,-51.45,-50.65,0,.86,M.darkMetal,{los:false});addBox(-6.65,-2.55,-51.5,-50.6,.86,.92,top,{collide:false});
  addBox(-7.45,-6.65,-50.2,-46.4,0,.86,M.darkMetal,{los:false});addBox(-7.5,-6.6,-50.25,-46.35,.86,.92,top,{collide:false});
  for(const[x,z,w,d,h]of[[-5.9,-51.05,.5,.4,.45],[-4.6,-51.1,.7,.45,.32],[-3.3,-51.05,.35,.35,.6],[-7.05,-49.4,.45,.5,.38],[-7.05,-47.4,.5,.42,.5]])addBox(x-w/2,x+w/2,z-d/2,z+d/2,.92,.92+h,dev,{collide:false});
  for(const[x,z,r]of[[-4.6,-50.85,0],[-7.05,-48.3,Math.PI/2]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(.5,.3),glow(0x58e6ff,1.2));m.position.set(x,1.42,z+(r?0:.1));m.rotation.y=r;add(m)}
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.38,20),dev);cyl.position.set(-2.95,1.11,-51.0);add(cyl);
  for(const x of[-5.5,5.5])addBox(x-.15,x+.15,-51.4,-40.6,5.45,5.55,M.darkMetal,{collide:false});
  // Bandes de sécurité autour du socle de la puce
  const[c,g]=mk(512,64);for(let i=0;i<16;i++){g.fillStyle=i%2?'#1a1a1a':'#d9a21b';g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32+32,0);g.lineTo(i*32+16,64);g.lineTo(i*32-16,64);g.fill()}
  const ring=new THREE.Mesh(new THREE.RingGeometry(.66,.82,48,1),new THREE.MeshStandardMaterial({map:canvasTex(c,true),roughness:.6}));ring.rotation.x=-Math.PI/2;ring.position.set(0,.02,-49);add(ring)}
const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.62),glow(0x3fd8ff,1.4));screen.position.set(4,1.35,-50.85);add(screen);
addBox(3.42,4.58,-51.0,-50.9,1.0,1.7,M.darkMetal,{collide:false});
const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,1,24),M.lab);pedestal.position.set(0,.5,-49);add(pedestal);
const pedRing=new THREE.Mesh(new THREE.TorusGeometry(.46,.02,8,40),glow(0x58e6ff,2.5));pedRing.rotation.x=Math.PI/2;pedRing.position.set(0,1.0,-49);add(pedRing);
pushCol({x0:-.5,x1:.5,z0:-49.5,z1:-48.5,los:false,off:false});
const glass=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.7,24,1,true),new THREE.MeshStandardMaterial({color:0x9fe8ff,transparent:true,opacity:.16,roughness:.02,metalness:.3,side:THREE.DoubleSide,envMapIntensity:2}));glass.position.set(0,1.35,-49);add(glass);
const chip=new THREE.Group();
chip.add(new THREE.Mesh(new THREE.BoxGeometry(.22,.04,.22),new THREE.MeshStandardMaterial({color:0x101418,metalness:.95,roughness:.2,envMapIntensity:2})));
chip.add(new THREE.Mesh(new THREE.BoxGeometry(.1,.05,.1),glow(0x5ff0ff,3)));
chip.position.set(0,1.3,-49);add(chip);H.chip=chip;
H.chipShaft=shaft(0,5.85,-49,.25,.5,4.6,0x5ff0ff,.35);
H.labLight=plight(0xd9f4ff,.5,13,0,4.8,-46);
H.labSpot=spot(0xe6f6ff,1.5,9,0,5.8,-46,0,0,-46.5,1.2,{map:512});
// Hélice ADN holographique sur le toit
const helix=new THREE.Group();helix.position.set(0,23.5,-46);add(helix);H.helix=helix;
{const gA=new THREE.SphereGeometry(.17,10,8),rung=new THREE.CylinderGeometry(.025,.025,2.8,6);const mA=glow(0x58e6ff,2.6),mB=glow(0xff4fd8,2.2),mR=glow(0x9fe8ff,1.2);
  for(let i=0;i<28;i++){const a=i*.42,y=i*.34;const s1=new THREE.Mesh(gA,mA);s1.position.set(Math.cos(a)*1.4,y,Math.sin(a)*1.4);helix.add(s1);
    const s2=new THREE.Mesh(gA,mB);s2.position.set(-Math.cos(a)*1.4,y,-Math.sin(a)*1.4);helix.add(s2);
    if(i%2===0){const r=new THREE.Mesh(rung,mR);r.rotation.z=Math.PI/2;r.rotation.y=-a;r.position.y=y;helix.add(r)}}}

/* ---------- Bar à nouilles ---------- */
addBox(6,9.2,0,10,3.15,3.4,M.darkMetal,{collide:false});
addBox(6,6.06,0,10,3.08,3.14,glow(0xff3d8b,2.4),{collide:false});
addBox(7.6,8.1,1.5,8.5,0,1.05,M.wood,{los:false});
addBox(7.5,8.2,1.4,8.6,1.05,1.12,M.darkMetal,{collide:false});
for(const z of[2.6,4.4,6.8]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.12,.09,.09,16),new THREE.MeshStandardMaterial({color:0xd8d0c0,roughness:.3}));b.position.set(7.85,1.17,z);add(b);steam(7.85,1.25,z,0xffd0e0,{n:14,rate:3,s0:.08,s1:.5,up:.35,life:2,a:.18,spread:.1,wind:0})}
for(const z of[1.5,4,6.5,9]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.34,14),glow(0xff5a3a,1.7));l.position.set(7.3,2.75,z);add(l);shaft(7.3,2.6,z,.15,.7,2.5,0xff6040,.12)}
{const[c,g]=mk(256,96);g.fillStyle='#7a0f1c';g.fillRect(0,0,256,96);g.fillStyle='rgba(0,0,0,.4)';for(let x=0;x<256;x+=52)g.fillRect(x,18,3,78);
  g.fillStyle='#f3e6d0';g.font='700 46px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('麺 · KOVAC',128,62);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.9),new THREE.MeshStandardMaterial({map:canvasTex(c),side:THREE.DoubleSide,roughness:.8}));m.rotation.y=-Math.PI/2;m.position.set(6.12,2.62,4.9);add(m)}
neon('NOUILLES','#ff3d8b',3.4,.8,5.95,3.85,5,-Math.PI/2,{flicker:true});
neon('拉麺','#ffb3d6',.9,2.6,5.95,6.4,8.6,-Math.PI/2,{vertical:true});

/* ---------- Enseignes ---------- */
neon('HÔTEL','#ffb347',1.3,5.2,-5.95,9,15,Math.PI/2,{vertical:true,flicker:true});
neon('ÉCHOS','#d64dff',3,1,-5.95,3.9,20.6,Math.PI/2);
neon('PHARMA 24','#3dff8a',3.6,.85,5.95,4.3,-15,-Math.PI/2,{frame:true});
neon('KARAOKÉ','#ff4fd8',1.1,4.6,5.95,9,-6,-Math.PI/2,{vertical:true,flicker:true});
neon('HELIX','#58e6ff',6,1.5,0,9.5,-40.95,0,{weight:600});
neon('BAR','#ff4040',1.6,.6,-5.95,3.3,2,Math.PI/2,{frame:true,flicker:true});
neon('→ SERVICE','#9fd8ff',1.6,.36,-9.95,2.6,-41.5,Math.PI/2,{weight:500,size:.6});
neon('DÉPÔT HELIX','#ff8a3d',4.6,.8,19.95,4.2,-35.5,-Math.PI/2,{frame:true});
neon('ACCÈS RESTREINT','#ff4a3a',2.6,.36,8.3,3.1,-35.5,-Math.PI/2,{weight:600,size:.6});
neon('CLINIQUE AUG.','#7dffc8',3.4,.6,-5.95,4.5,-1,Math.PI/2,{weight:600,size:.55});
// Hologramme publicitaire
H.holoMat=(()=>{
  const[c,g]=mk(1024,320);g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=4;g.strokeRect(6,6,1012,308);
  g.font='600 120px "Saira Condensed",sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText('SOYEZ ENTIER.',250,130);
  g.font='500 44px "Saira Condensed",sans-serif';g.globalAlpha=.75;g.fillText('HELIX BIOTECH · PROTHÈSES DE SÉRIE K7',254,230);g.globalAlpha=1;
  g.lineWidth=5;for(let i=0;i<40;i++){const y=30+i*6.5,a=i*.5;g.beginPath();g.arc(120+Math.cos(a)*55,y,6,0,7);g.fill();g.beginPath();g.arc(120-Math.cos(a)*55,y,6,0,7);g.fill()}
  const mat=new THREE.ShaderMaterial({uniforms:{map:{value:canvasTex(c)},time:{value:0},color:{value:new THREE.Color(0x7fe6ff).multiplyScalar(1.7)}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map;uniform float time;uniform vec3 color;varying vec2 vUv;
      void main(){vec2 uv=vUv;float gl=step(.94,fract(sin(floor(time*9.)*12.9898)*43758.5453));uv.x+=gl*.02*sin(uv.y*80.+time*50.);
        vec4 t=texture2D(map,uv);float s=.62+.38*sin(uv.y*260.-time*7.);float f=.82+.18*sin(time*29.)*sin(time*5.3);
        float band=smoothstep(.0,.04,abs(fract(uv.y*.5-time*.15)-.5)*.0+.1);vec3 c=color*(1.+gl*vec3(.6,-.3,.4));
        gl_FragColor=vec4(c*t.a*s*f*band+color*.035,1.);}`,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(10,3.1),mat);m.rotation.y=-Math.PI/2;m.position.set(5.6,11.5,-22);add(m);return mat;
})();

/* ---------- Lumières ---------- */
plight(0xff3d8b,2.6,13,6.3,3.2,5);
plight(0xffa040,2.0,13,-5.2,7,15);
plight(0x3dff8a,1.6,11,5.2,4.5,-15);
plight(0x58e6ff,2.8,15,0,6,-37.5);
plight(0xc04dff,1.6,10,-5.2,3.5,20.6);
plight(0xff4fd8,1.4,10,5.2,8,-6);
H.ventLight=plight(0x7fd4ff,1.3,9,-10.5,3.2,-43);
shaft(-10.5,3.4,-43,.2,1.6,3.4,0x7fd4ff,.14);
lamp(-5.3,26,1);lamp(5.3,-6,-1);lamp(-5.3,-24,1);

/* ---------- Ruelle ---------- */
addBox(-13.6,-12.2,-27,-25.2,0,1.3,M.dumpster,{los:false});addBox(-13.7,-12.1,-27.1,-25.1,1.3,1.38,M.darkMetal,{collide:false});
addBox(-13.8,-12.8,-36,-35,0,.9,M.wood,{los:false});addBox(-13.6,-12.9,-35.9,-35.2,.9,1.6,M.wood,{collide:false});
addBox(-9.3,-8.7,-21,-20.2,0,1.1,M.dumpster,{los:false});
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.32,.9,18),new THREE.MeshStandardMaterial({color:0x3a2a20,metalness:.6,roughness:.5}));barrel.position.set(-12.6,.45,-15.8);add(barrel);
pushCol({x0:-12.95,x1:-12.25,z0:-16.15,z1:-15.45,los:false,off:false});
barrel.castShadow=true;
H.fire=flamme(-12.6,.9,-15.8,.62,.95);
H.fireLight=shadowPoint(plight(0xff7a2a,2.4,9,-12.6,1.6,-15.8),256,9);
new Particles(50,{color:0xff8a30,k:2.4,additive:true,rate:22,spawn:q=>{q.x=-12.6+(rnd()-.5)*.4;q.y=1.0;q.z=-15.8+(rnd()-.5)*.4;q.vx=(rnd()-.5)*.5;q.vy=1.2+rnd()*2;q.vz=(rnd()-.5)*.5;q.max=.6+rnd()*.8;q.s0=.06;q.s1=.02;q.a=1}});
steam(-12.6,1.4,-15.8,0x40342c,{n:40,rate:6,a:.22,s0:.4,s1:2.4,up:1,life:4});
for(let i=0;i<4;i++)addBox(-13.98,-13.9,-44+i*7,-43.6+i*7,0,9,M.darkMetal,{collide:false});
for(const y of[4.2,4.6])cable(-13.9,y,-12,-13.9,y,-46,.05,0);
steam(4,22.6,-48,0xa8d8ff,{n:30,rate:4,a:.12,s1:4,up:1.2,life:5});
steam(-4,22.6,-43,0xa8d8ff,{n:30,rate:4,a:.12,s1:4,up:1.2,life:5});

/* ---------- Personnages ---------- */
const blobTex=(()=>{const[c,g]=mk(128,128);const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(0,0,0,.85)');gr.addColorStop(.5,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
for(const n of NPCS){
  n.g=new THREE.Group();n.g.position.set(n.x,0,n.z);n.g.rotation.y=n.yaw;add(n.g);
  const blob=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=.02;n.g.add(blob);
  n.tag=nameTag(n.name);n.tag.position.set(n.x,n.h+.55,n.z);add(n.tag);
  if(n.key!=='kovac')pushCol({x0:n.x-.32,x1:n.x+.32,z0:n.z-.32,z1:n.z+.32,los:false,off:false});
  Z.inter.push({p:new V3(n.x,0,n.z),r:2.7,label:()=>'Parler à '+n.name.charAt(0)+n.name.slice(1).toLowerCase(),act:()=>Z.talk(n.key)});
  Z.npcs.push(n);
}
// Décodeur de Mara
addBox(-6,-5.25,16.9,18.3,0,1.25,M.darkMetal);
H.decScreen=new THREE.Mesh(new THREE.PlaneGeometry(.6,.42),new THREE.MeshBasicMaterial({color:new THREE.Color(0x150a06),toneMapped:false}));H.decScreen.rotation.y=Math.PI/2;H.decScreen.position.set(-5.24,.85,17.6);add(H.decScreen);
H.decLed=addBox(-5.75,-5.45,17.35,17.85,1.25,1.31,glow(0xff3030,2.2),{collide:false});
addBox(-5.9,-5.35,17.0,17.25,1.25,1.6,M.metal,{collide:false});
// Distributeur près de Nox
addBox(5.15,6,12.3,13.7,0,2.1,M.darkMetal);
{const[c,g]=mk(128,256);const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#0a3b4a');gr.addColorStop(1,'#04161e');g.fillStyle=gr;g.fillRect(0,0,128,256);
  for(let y=0;y<5;y++)for(let x=0;x<3;x++){g.fillStyle=['#ff4f6a','#ffd04f','#4fffc0','#4fb0ff'][(x+y)%4];g.fillRect(14+x*36,30+y*36,24,26)}
  g.fillStyle='#bff6ff';g.font='700 22px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('NUTRI-BAR',64,22);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.8),new THREE.MeshBasicMaterial({map:canvasTex(c),toneMapped:false}));m.material.color.setScalar(1.6);m.rotation.y=-Math.PI/2;m.position.set(5.14,1.1,13);add(m)}
plight(0x4fe0ff,1.6,6,4.6,1.6,13);

/* ---------- Drones ---------- */
makeDrone(Z,[[-5,-34],[5,-34]],Math.PI/2);
makeDrone(Z,[[1,-24],[1,-3]],0);
makeDrone(Z,[[-1.8,10],[2.2,10]],Math.PI/2,{passive:true,tut:true,speed:.6,h:3.0});
flushLedges();
// Ombres : tout le décor les reçoit ; les objets bas posés au sol en projettent.
Z.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial){o.receiveShadow=true;const b=o.geometry.boundingSphere||(o.geometry.computeBoundingSphere(),o.geometry.boundingSphere);if(o.position.y<1.2&&b.radius<1.6&&!o.isInstancedMesh)o.castShadow=true}});
into(null);
}

export const NPCS=[
  {key:'mara',name:'MARA',x:-4.9,z:20.2,yaw:Math.PI/2,h:1.72,o:{coat:0x5a1520,skin:0xc8957a,hair:0x120c0c,long:true,visor:0x58e6ff,cig:true}},
  {key:'nox',name:'NOX-7',x:4.5,z:14.5,yaw:-Math.PI/2,h:1.76,o:{coat:0x1f3a4a,skin:0x8a5e45,hood:true,belt:0x3dff8a}},
  {key:'kovac',name:'KOVAC',x:8.65,z:5,yaw:-Math.PI/2,h:1.86,o:{coat:0x2e2c28,skin:0xd2a888,hair:0x3a3a3a,mech:true}},
  {key:'sid',name:'SID',x:-12.0,z:-16.4,yaw:-Math.PI/4,h:1.76,o:{coat:0x3b3426,skin:0xb0846a,beanie:0x6a2a1a,hunch:true,mech:true}},
];
const npcBy=k=>NPCS.find(n=>n.key===k);

/* Chargement des vrais personnages (glTF animés) */
export async function loadRueCharacters(){
  const[xbot,mich,sold,rpm]=await Promise.all(['xbot','michelle','soldier','sid'].map(loadGLB));
  const X=nm=>xbot.animations.find(a=>a.name===nm);
  const RX=restInfo(xbot.scene),RM=restInfo(mich.scene),RS=restInfo(sold.scene);
  const addv=c=>THREE.AnimationUtils.makeClipAdditive(c);
  const forRig=R=>({idle:retarget(X('idle'),RX,R,'mixamorig'),agree:addv(retarget(X('agree'),RX,R,'mixamorig')),shake:addv(retarget(X('headShake'),RX,R,'mixamorig'))});
  const base={idle:prepClip(X('idle'),false),agree:addv(prepClip(X('agree'),false)),shake:addv(prepClip(X('headShake'),false))};
  // Mara
  mountChar(npcBy('mara'),mich.scene,forRig(RM),{env:.8,mat:m=>{m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    {vec3 c=diffuseColor.rgb;float y=smoothstep(.12,.3,min(c.r,c.g)-c.b)*step(c.b*1.6,c.g);diffuseColor.rgb=mix(c,vec3(c.r*.42+.05,c.g*.06,c.g*.1),y);}`)}}});
  { const n=npcBy('mara'),hand=findBone(n.root,['mixamorigRightHand']);if(hand){const c=new THREE.Mesh(new THREE.SphereGeometry(.014,6,6),glow(0xff5a20,3));attachTo(hand,c,0,.09,.02);n.cig=c} }
  // Kovac
  const sIdle=sold.animations.find(a=>a.name==='Idle'),rs=forRig(RS);
  mountChar(npcBy('kovac'),sold.scene,{idle:sIdle?prepClip(sIdle,false):rs.idle,agree:rs.agree,shake:rs.shake},{env:1.1,flip:true});
  // Sid (pose procédurale ; ce modèle regarde déjà vers +Z, pas de demi-tour)
  mountChar(npcBy('sid'),rpm.scene,{},{env:.7});
  // Le vieux Sid : manteau usé, barbe grise, bonnet et écharpe à la place du costume et du chapeau.
  { const n=npcBy('sid');
    n.root.traverse(o=>{if(!o.isMesh)return;const nm=o.name,m=o.material;
      if(/Headwear/.test(nm))o.visible=false;
      else if(/Outfit_Top/.test(nm)){m.color.setHex(0x5e554b);m.roughness=.95}
      else if(/Outfit_Bottom/.test(nm)){m.color.setHex(0x4a463f);m.roughness=.95}
      else if(/Beard/.test(nm))m.color.setHex(0xc4beb4)});
    const wool=c=>new THREE.MeshStandardMaterial({color:c,roughness:1});
    const head=findBone(n.root,['Head']);if(head){const b=new THREE.Mesh(new THREE.SphereGeometry(.122,20,12,0,Math.PI*2,0,Math.PI*.52),wool(0x6a2a1a));attachTo(head,b,0,.135,-.018);b.scale.y*=.9;b.castShadow=true}
    const neck=findBone(n.root,['Neck']);if(neck){const sc=new THREE.Mesh(new THREE.TorusGeometry(.068,.032,8,20),wool(0x39402c));sc.rotation.x=Math.PI/2;attachTo(neck,sc,0,.035,.005)} }
  // Nox-7
  mountChar(npcBy('nox'),xbot.scene,base,{env:1.4,mat:(m)=>{
    if(/Joints/.test(m.name)){m.color.setHex(0x1c2a33);m.emissive=new THREE.Color(0x2ad8ff);m.emissiveIntensity=.55;m.metalness=.8;m.roughness=.3}
    else{m.color.setHex(0xb9c2cc);m.metalness=.55;m.roughness=.32}}});
  try{
    cyberize(npcBy('mara'),{arm:'Right',r1:.047,r2:.04,col:0xff3d6a,head:1,neck:true});
    cyberize(npcBy('sid'),{arm:'Left',r1:.052,r2:.045,col:0xffa040,head:-1,neck:true});
    cyberize(npcBy('kovac'),{arm:'Right',r1:.068,r2:.06,col:0xff5a30,neck:true});
    cyberize(npcBy('nox'),{neck:true,col:0x2ad8ff});
  }catch(e){console.warn('implants',e)}
  return{xbot,mich,sold,rpm};
}
export const rueFallback=()=>fallbackChars(NPCS);

// Taille du reflet du sol selon la qualité graphique
const sizeReflector=()=>{const r=H.reflector;if(!r)return;r.visible=quality!=='low';const k=quality==='ultra'?.6:.35;r.getRenderTarget().setSize(Math.round(innerWidth*k),Math.round(innerHeight*k))};
on('quality',sizeReflector);on('resize',sizeReflector);

/* Animation propre à la rue */
Z.update=(dt,S)=>{
  H.holoMat.uniforms.time.value=T;
  H.helix.rotation.y+=dt*.5;
  H.fireLight.intensity=2.2+Math.sin(T*17)*.45+Math.sin(T*7.3)*.35;
  H.ventLight.intensity=Math.sin(T*9)>.97?.2:1.3;
  H.chip.rotation.y+=dt*1.5;H.chip.position.y=1.3+Math.sin(T*2)*.04;
  if(S.chip){const a=.5+.5*Math.sin(T*6);H.labLight.color.setHex(0xff2a2a);H.labLight.intensity=.6+a*.8;H.labSpot.color.setHex(0xff3030);H.labSpot.intensity=.8+a*1.6}else{H.labLight.intensity=.5;H.labSpot.color.setHex(0xe6f6ff);H.labSpot.intensity=1.5}
  H.door.position.y+=((S.door?4.8:1.6)-H.door.position.y)*Math.min(1,dt*3);
  for(const l of H.rackLeds)if(rnd()<.02)l.visible=!l.visible;
  if(H.reflector){H.reflector.material.uniforms.time.value=T;H.reflector.material.uniforms.camPos.value.copy(camera.position)}
};

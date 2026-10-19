// Briques du décor : matériaux, boîtes à collisions, néons, lumières, faisceaux, particules, câbles.
// Tout ce qui est construit entre into(zone) et into(null) appartient à cette zone (voir zones.js), le reste à la scène.
import {THREE,scene,rnd,V3,pr,on,T} from './core.js';
import {FAC,canvasTex,mk,softDot} from './textures.js';

let Z=null;
export const into=z=>{Z=z};
export const add=o=>{(Z?Z.root:scene).add(o);return o};
export const GLOBAL={colliders:[],particles:[],shafts:[],flickers:[],lanterns:[]};
const L=k=>(Z||GLOBAL)[k];
export const pushCol=c=>{L('colliders').push(c);return c};

/* ---------- Materials ---------- */
export const M={
  concrete:new THREE.MeshStandardMaterial({color:0x2a2c33,roughness:.9,envMapIntensity:.4}),
  curb:new THREE.MeshStandardMaterial({color:0x34363d,roughness:.5,metalness:.2,envMapIntensity:.6}),
  metal:new THREE.MeshStandardMaterial({color:0x5a606a,roughness:.28,metalness:.9,envMapIntensity:1.4}),
  darkMetal:new THREE.MeshStandardMaterial({color:0x1a1c22,roughness:.32,metalness:.85,envMapIntensity:1.2}),
  lab:new THREE.MeshStandardMaterial({color:0xa9b3bc,roughness:.3,metalness:.3,envMapIntensity:.9}),
  labFloor:new THREE.MeshStandardMaterial({color:0xd6dde2,roughness:.12,metalness:.1,envMapIntensity:1}),
  dumpster:new THREE.MeshStandardMaterial({color:0x1d3a2c,roughness:.45,metalness:.5,envMapIntensity:.9}),
  wood:new THREE.MeshStandardMaterial({color:0x4a2e1c,roughness:.45,envMapIntensity:.6}),
  paint:new THREE.MeshStandardMaterial({color:0x7a6428,roughness:.5,envMapIntensity:.4}),
};
export const glow=(c,k)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k||1.8),toneMapped:false});

/* ---------- Helpers ---------- */
export function boxGeoWorldUV(w,h,d,S){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);let a,b;
    if(f<2){a=d;b=h}else if(f<4){a=w;b=d}else{a=w;b=h}
    uv.setXY(i,uv.getX(i)*a/S,uv.getY(i)*b/S)}
  return g;
}
export function addBox(x0,x1,z0,z1,y0,y1,mat,o={}){
  const m=new THREE.Mesh(o.geo||new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);
  m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);add(m);
  let col=null;
  if(o.collide!==false){col=pushCol({x0,x1,z0,z1,los:o.los!==false,off:false})}
  m.userData.col=col;return m;
}
export const bmats=FAC.map((f,i)=>new THREE.MeshStandardMaterial({map:f.df,bumpMap:f.df,bumpScale:.025,roughness:.78,metalness:.15,emissive:0xffffff,emissiveMap:f.em,emissiveIntensity:1.05,envMapIntensity:.55}));
let bi=0;
export function building(x0,x1,z0,z1,h){
  const w=x1-x0,d=z1-z0;addBox(x0,x1,z0,z1,0,h,bmats[bi++%4],{geo:boxGeoWorldUV(w,h,d,24)});
  addBox(x0-.2,x1+.2,z0-.2,z1+.2,h,h+.6,M.concrete,{collide:false});
}
export function neon(text,color,w,h,x,y,z,rotY,o={}){
  const ppm=o.ppm||110,cw=Math.min(1024,Math.round(w*ppm)),ch=Math.min(1024,Math.round(h*ppm));
  const[c,g]=mk(cw,ch);g.textAlign='center';g.textBaseline='middle';g.shadowColor=color;
  const draw=(fill,blur,alpha)=>{g.globalAlpha=alpha;g.shadowBlur=blur;g.fillStyle=fill;
    if(o.vertical){const n=text.length,lh=ch/n;g.font=`700 ${Math.min(cw*.72,lh*.88)}px "Saira Condensed","Arial Narrow",sans-serif`;for(let i=0;i<n;i++)g.fillText(text[i],cw/2,lh*(i+.55));}
    else{g.font=`${o.weight||700} ${ch*(o.size||.62)}px "Saira Condensed","Arial Narrow",sans-serif`;g.fillText(text,cw/2,ch*.54,cw*.92);}};
  if(o.frame){g.strokeStyle=color;g.lineWidth=Math.max(3,ch*.035);g.shadowBlur=ch*.15;g.strokeRect(g.lineWidth,g.lineWidth,cw-g.lineWidth*2,ch-g.lineWidth*2)}
  draw(color,Math.min(cw,ch)*.22,1);draw(color,Math.min(cw,ch)*.07,1);draw('#ffffff',0,.5);
  const mat=new THREE.MeshBasicMaterial({map:canvasTex(c),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:o.fog!==false});
  mat.color.setScalar(o.glow||1.9);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.y=rotY;add(m);
  if(o.flicker)L('flickers').push({m,ph:rnd()*10,base:o.glow||1.9});
  return m;
}
export function plight(color,int,dist,x,y,z){const l=new THREE.PointLight(color,int,dist,1.7);l.position.set(x,y,z);add(l);return l}

/* ---------- Light shafts ---------- */
export function shaftMat(color,opacity){
  return new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(color)},opacity:{value:opacity},time:{value:0},ph:{value:rnd()*10}},
    vertexShader:`varying vec3 vN;varying vec3 vV;varying float vH;varying float vD;varying vec3 vW;
      void main(){vH=uv.y;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vD=-mv.z;vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 color;uniform float opacity;uniform float time;uniform float ph;varying vec3 vN;varying vec3 vV;varying float vH;varying float vD;varying vec3 vW;
      void main(){float e=pow(abs(dot(normalize(vN),normalize(vV))),1.5);
        float dust=.75+.25*sin(vW.y*3.1+time*1.3+ph)*sin(vW.x*2.3-time*.7+vW.z*1.7);
        float a=e*pow(vH,1.3)*opacity*dust*smoothstep(.4,3.,vD);gl_FragColor=vec4(color*a,1.);}`,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
}
export function shaft(x,y,z,rTop,rBot,h,color,op){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBot,h,28,1,true),shaftMat(color,op));m.position.set(x,y-h/2,z);add(m);L('shafts').push(m);return m;
}

/* ---------- Particles ---------- */
const ALL_PARTICLES=[];
export class Particles{
  constructor(n,o){
    this.n=n;this.o=o;this.p=[];this.pos=new Float32Array(n*3);this.al=new Float32Array(n);this.sz=new Float32Array(n);this.acc=0;
    for(let i=0;i<n;i++){this.p.push({life:0,max:1,x:0,y:-99,z:0,vx:0,vy:0,vz:0,s0:0,s1:0,a:0})}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));g.setAttribute('aAlpha',new THREE.BufferAttribute(this.al,1));g.setAttribute('aSize',new THREE.BufferAttribute(this.sz,1));
    this.mat=new THREE.ShaderMaterial({uniforms:{map:{value:softDot},color:{value:new THREE.Color(o.color).multiplyScalar(o.k||1)},scale:{value:innerHeight*.6*pr()}},
      vertexShader:`attribute float aAlpha;attribute float aSize;varying float vA;uniform float scale;void main(){vA=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*scale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`uniform sampler2D map;uniform vec3 color;varying float vA;void main(){float t=texture2D(map,gl_PointCoord).a;gl_FragColor=vec4(color,t*vA);}`,
      transparent:true,depthWrite:false,blending:o.additive?THREE.AdditiveBlending:THREE.NormalBlending});
    this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;add(this.pts);this.geo=g;L('particles').push(this);ALL_PARTICLES.push(this);
  }
  update(dt){
    const o=this.o;this.acc+=dt*o.rate;
    for(let i=0;i<this.n&&this.acc>=1;i++){const q=this.p[i];if(q.life>0)continue;this.acc-=1;o.spawn(q);q.life=q.max}
    if(this.acc>4)this.acc=0;
    for(let i=0;i<this.n;i++){const q=this.p[i];
      if(q.life>0){q.life-=dt;if(o.grav)q.vy-=o.grav*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(o.drag){q.vx*=1-dt*o.drag;q.vz*=1-dt*o.drag}
        const t=1-q.life/q.max;this.al[i]=q.a*Math.min(1,t*(o.fadeIn||1000))*(1-t);this.sz[i]=q.s0+(q.s1-q.s0)*t;
        this.pos[i*3]=q.x;this.pos[i*3+1]=q.y;this.pos[i*3+2]=q.z;}
      else{this.al[i]=0;this.pos[i*3+1]=-99}}
    this.geo.attributes.position.needsUpdate=true;this.geo.attributes.aAlpha.needsUpdate=true;this.geo.attributes.aSize.needsUpdate=true;
  }
}
const rescale=()=>{for(const ps of ALL_PARTICLES)ps.mat.uniforms.scale.value=innerHeight*.6*pr()};
on('quality',rescale);on('resize',rescale);
export function steam(x,y,z,color,o={}){
  return new Particles(o.n||40,{color,k:o.k||1,rate:o.rate||8,fadeIn:4,drag:.6,spawn:q=>{q.x=x+(rnd()-.5)*(o.spread||.4);q.y=y;q.z=z+(rnd()-.5)*(o.spread||.4);
    q.vx=(rnd()-.5)*.3+(o.wind||.15);q.vy=(o.up||.7)+rnd()*.5;q.vz=(rnd()-.5)*.3;q.max=(o.life||4)+rnd()*1.5;q.s0=o.s0||.5;q.s1=(o.s1||2.6)+rnd();q.a=o.a||.16}});
}

/* ---------- Câbles, climatiseurs, lampadaires ---------- */
export function cable(x0,y0,z0,x1,y1,z1,sag,lant){
  const a=new V3(x0,y0,z0),b=new V3(x1,y1,z1),mid=a.clone().add(b).multiplyScalar(.5);mid.y-=sag;
  const curve=new THREE.QuadraticBezierCurve3(a,mid,b);add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.02,4,false),M.darkMetal));
  if(lant)for(let i=1;i<lant;i++){const p=curve.getPoint(i/lant);const l=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),glow(i%3?0xff3020:0xffa030,1.6));l.scale.y=1.3;l.position.copy(p);l.position.y-=.25;add(l);L('lanterns').push({m:l,y:l.position.y,ph:rnd()*6})}
}
export function acUnit(x,y,z,side){
  addBox(x-.25,x+.25,z-.45,z+.45,y,y+.6,M.metal,{collide:false});
  const f=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.02,16),M.darkMetal);f.rotation.z=Math.PI/2;f.position.set(x+side*.26,y+.3,z);add(f);
}
export function lamp(x,z,side){
  addBox(x-.07,x+.07,z-.07,z+.07,0,5.4,M.darkMetal,{collide:false});
  addBox(side>0?x:x-1.2,side>0?x+1.2:x,z-.05,z+.05,5.3,5.4,M.darkMetal,{collide:false});
  const hx=x+side*1.1;addBox(hx-.3,hx+.3,z-.12,z+.12,5.18,5.3,glow(0xffc58a,2.2),{collide:false});
  plight(0xffa65a,2.3,15,hx,5,z);shaft(hx,5.18,z,.32,2.6,5.18,0xffb070,.17);
}

/* Animation des effets : listes globales + celles de la zone affichée */
export function updateFx(dt,z){
  for(const s of z?[GLOBAL,z]:[GLOBAL]){
    for(const ps of s.particles)ps.update(dt);
    for(const f of s.flickers){const n=Math.sin(T*13+f.ph)*Math.sin(T*3.1+f.ph*2);f.m.material.opacity=n>.93?.2:1}
    for(const l of s.lanterns){l.m.position.y=l.y+Math.sin(T*1.5+l.ph)*.05}
    for(const m of s.shafts)m.material.uniforms.time.value=T;
  }
}

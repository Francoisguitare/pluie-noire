// Briques du décor : matériaux, boîtes à collisions, néons, lumières, faisceaux, particules, câbles.
// Tout ce qui est construit entre into(zone) et into(null) appartient à cette zone (voir zones.js), le reste à la scène.
import {THREE,scene,rnd,V3,pr,on,T,camera} from './core.js';
import {FAC,canvasTex,mk,softDot} from './textures.js';

let Z=null;
export const into=z=>{Z=z};
export const add=o=>{(Z?Z.root:scene).add(o);return o};
export const GLOBAL={colliders:[],particles:[],shafts:[],flickers:[],lanterns:[],flames:[]};
const L=k=>(Z||GLOBAL)[k];
export const pushCol=c=>{L('colliders').push(c);return c};

/* ---------- Materials ---------- */
export const M={
  concrete:new THREE.MeshStandardMaterial({color:0x2a2c33,roughness:.9,envMapIntensity:.4}),
  curb:new THREE.MeshStandardMaterial({color:0x34363d,roughness:.5,metalness:.2,envMapIntensity:.6}),
  metal:new THREE.MeshStandardMaterial({color:0x5a606a,roughness:.28,metalness:.9,envMapIntensity:1.4}),
  darkMetal:new THREE.MeshStandardMaterial({color:0x1a1c22,roughness:.32,metalness:.85,envMapIntensity:1.2}),
  lab:new THREE.MeshStandardMaterial({color:0x515a62,roughness:.45,metalness:.35,envMapIntensity:.7}),
  labFloor:new THREE.MeshStandardMaterial({color:0x8d979e,roughness:.22,metalness:.1,envMapIntensity:.7}),
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
  const w=x1-x0,d=z1-z0;addBox(x0,x1,z0,z1,0,h,bmats[bi++%4],{geo:boxGeoWorldUV(w,h,d,24)}).receiveShadow=true;ledgesFor(x0,x1,z0,z1,h);
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
  spot(0xffa65a,2.6,16,hx,5.05,z,hx,0,z,1.15,{map:512});shaft(hx,5.18,z,.32,2.6,5.18,0xffb070,.17);
}
/* ---------- Lumières à ombres (qualité ultra seulement) ---------- */
export const SHADOW_LIGHTS=[];
// Projecteur qui éclaire vers (tx,ty,tz). o.map : taille de la carte d'ombre.
export function spot(color,int,dist,x,y,z,tx,ty,tz,angle,o={}){
  const l=new THREE.SpotLight(color,int,dist,angle,o.penumbra??.55,1.7);l.position.set(x,y,z);l.target.position.set(tx,ty,tz);add(l);add(l.target);
  l.shadow.mapSize.set(o.map||512,o.map||512);l.shadow.camera.near=.3;l.shadow.camera.far=dist;l.shadow.bias=-.0006;l.shadow.normalBias=.02;
  SHADOW_LIGHTS.push(l);return l;
}
export function shadowPoint(l,map,far){l.shadow.mapSize.set(map,map);l.shadow.camera.near=.1;l.shadow.camera.far=far;l.shadow.bias=-.002;l.shadow.normalBias=.03;SHADOW_LIGHTS.push(l);return l}
// Marque des objets comme projetant (cast) et/ou recevant (receive) les ombres.
export function ombre(o,cast,receive){o.traverse(m=>{if(m.isMesh){if(cast)m.castShadow=true;if(receive)m.receiveShadow=true}});return o}

/* ---------- Corniches des façades : une barre au niveau de chaque étage (alignée sur les bandes sombres de la texture) ---------- */
const LEDGES=[];
function ledgesFor(x0,x1,z0,z1,h){
  for(let y=3.28;y<h-1;y+=3){
    LEDGES.push([x1+.08,y,(z0+z1)/2,.16,.12,z1-z0+.3],[x0-.08,y,(z0+z1)/2,.16,.12,z1-z0+.3],[(x0+x1)/2,y,z1+.08,x1-x0+.3,.12,.16],[(x0+x1)/2,y,z0-.08,x1-x0+.3,.12,.16]);
  }
}
// À appeler en fin de construction d'une zone : regroupe toutes les corniches en un seul objet.
export function flushLedges(){
  if(!LEDGES.length)return;
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x26282e,roughness:.85,metalness:.1,envMapIntensity:.4}),LEDGES.length);
  const m=new THREE.Matrix4();LEDGES.forEach(([x,y,z,w,h,d],i)=>{m.makeScale(w,h,d);m.setPosition(x,y,z);im.setMatrixAt(i,m)});
  im.receiveShadow=true;add(im);LEDGES.length=0;
}

/* ---------- Flammes : deux plans tournés vers la caméra, forme et couleur calculées dans le shader ---------- */
const FLAMES=[];
const flameMat=ph=>new THREE.ShaderMaterial({uniforms:{time:{value:0},ph:{value:ph}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float time;uniform float ph;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
    void main(){vec2 uv=vUv;float y=uv.y;
      float n=fbm(vec2(uv.x*3.2+ph,y*2.6-time*2.4));
      float w=mix(.42,.04,pow(y,.8));float d=abs(uv.x-.5+(n-.5)*.45*y)/w;
      float body=smoothstep(1.,.15,d)*smoothstep(1.02,.45,y+n*.42)*smoothstep(0.,.1,y);
      vec3 c=mix(vec3(1.,.93,.65),vec3(1.,.5,.1),smoothstep(.05,.55,y+d*.35));c=mix(c,vec3(.75,.12,.03),smoothstep(.45,.95,y+d*.2));
      gl_FragColor=vec4(c*2.4,body);}`,
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
export function flamme(x,y,z,w,h){
  const g=new THREE.Group();g.position.set(x,y,z);add(g);
  for(const[k,ph]of[[1,0],[.62,4.7]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w*k,h*k),flameMat(ph));m.position.y=h*k/2;g.add(m)}
  const bed=new THREE.Mesh(new THREE.CircleGeometry(w*.42,20),glow(0xff5a1a,1.5));bed.rotation.x=-Math.PI/2;bed.position.y=.01;g.add(bed);
  L('flames').push(g);return g;
}

/* Animation des effets : listes globales + celles de la zone affichée */
export function updateFx(dt,z){
  for(const s of z?[GLOBAL,z]:[GLOBAL]){
    for(const ps of s.particles)ps.update(dt);
    for(const f of s.flickers){const n=Math.sin(T*13+f.ph)*Math.sin(T*3.1+f.ph*2);f.m.material.opacity=n>.93?.2:1}
    for(const l of s.lanterns){l.m.position.y=l.y+Math.sin(T*1.5+l.ph)*.05}
    for(const m of s.shafts)m.material.uniforms.time.value=T;
    for(const f of s.flames){f.rotation.y=Math.atan2(camera.position.x-f.position.x,camera.position.z-f.position.z);for(const c of f.children)if(c.material.uniforms)c.material.uniforms.time.value=T}
  }
}

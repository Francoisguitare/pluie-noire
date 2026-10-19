// La pluie : 3 200 traits qui suivent la caméra, et des éclaboussures au sol.
import {THREE,scene,rnd,camera} from './core.js';
import {Particles} from './construire.js';

const RAIN=3200,rainPos=new Float32Array(RAIN*6),rainV=new Float32Array(RAIN);
let rainGeo=null;
export let rain=null;let splashes=null;
export function buildRain(){
  for(let i=0;i<RAIN;i++){const x=(rnd()-.5)*50,y=rnd()*22,z=(rnd()-.5)*50;rainV[i]=17+rnd()*9;rainPos.set([x,y+.6,z,x+.07,y,z],i*6)}
  // Chaque goutte est un trait qui s'efface vers le haut (flou de mouvement), d'intensité variable, et se perd dans le brouillard.
  const al=new Float32Array(RAIN*2);for(let i=0;i<RAIN;i++){al[i*2]=0;al[i*2+1]=.45+((i*7919)%97)/97*.75}
  rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));rainGeo.setAttribute('aA',new THREE.BufferAttribute(al,1));
  rain=new THREE.LineSegments(rainGeo,new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(0x8a9cc8)},op:{value:.5},fogD:{value:.023}},
    vertexShader:`attribute float aA;varying float vA;varying float vD;void main(){vA=aA;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 color;uniform float op;uniform float fogD;varying float vA;varying float vD;void main(){float f=exp(-pow(vD*fogD,2.));gl_FragColor=vec4(color*vA*op*f,1.);}`,
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
  splashes=new Particles(160,{color:0xb8c8f0,k:1.3,additive:true,rate:110,spawn:q=>{const a=rnd()*6.28,r=1+rnd()*13;q.x=camera.position.x+Math.cos(a)*r;q.z=camera.position.z+Math.sin(a)*r;q.y=.05;q.vx=q.vz=0;q.vy=.4;q.max=.18+rnd()*.12;q.s0=.02;q.s1=.22;q.a=.55}});
}
export function updateRain(dt,show){
  const cx=camera.position.x,cz=camera.position.z;
  for(let i=0;i<RAIN;i++){const o=i*6;let y=rainPos[o+4]-rainV[i]*dt;
    if(y<0||Math.abs(rainPos[o]-cx)>25||Math.abs(rainPos[o+2]-cz)>25){y=14+rnd()*8;const x=cx+(rnd()-.5)*50,z=cz+(rnd()-.5)*50;rainPos[o]=x;rainPos[o+2]=z;rainPos[o+3]=x+.07;rainPos[o+5]=z}
    rainPos[o+1]=y+.6;rainPos[o+4]=y}
  rainGeo.attributes.position.needsUpdate=true;
  rain.visible=show;splashes.pts.visible=show;
}

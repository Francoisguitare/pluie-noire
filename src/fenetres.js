// Les fenêtres vivantes : quelques fenêtres allumées où quelqu'un bouge derrière le rideau. Une ombre floue (corps et
// tête) passe dans la pièce, lit sous une télé qui scintille, reste à regarder la rue puis s'en va, ou deux ombres se
// disputent. Chaque fenêtre est un petit plan posé pile sur une fenêtre de la façade (cellules de 3 m, texture de 24 m :
// voir facade() dans textures.js), avec un shader de théâtre d'ombres. Le brouillard s'applique comme au reste de la ville.
import {THREE,T} from './core.js';
import {add,into} from './construire.js';
import {constructeurs,zones} from './zones.js';

const vert=`varying vec2 vUv;
#include <fog_pars_vertex>
void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
const frag=`uniform float time,graine,mode;uniform vec3 lum;varying vec2 vUv;
#include <fog_pars_fragment>
// une ombre : un corps (capsule) et une tête, adoucis par le rideau
float ombre(vec2 p,vec2 c,float f){
  float corps=length(vec2((p.x-c.x)*1.6,max(0.,abs(p.y-(c.y-.2))-.17)))-.13;
  float tete=length((p-vec2(c.x,c.y+.1))*vec2(1.,.9))-.075;
  return 1.-smoothstep(-f,f,min(corps,tete));
}
void main(){
  vec2 p=vUv;float t=time+graine*17.;
  vec3 c=lum*(.3+.7*smoothstep(-.2,1.,p.y));
  c+=lum*.45*exp(-length((p-vec2(.72,.82))*vec2(1.,1.3))*6.);       // la lampe
  float s=0.;
  if(mode<.5){float x=.5+.62*sin(t*.21);s=ombre(p,vec2(x,.44),.07)*smoothstep(-.12,.05,x)*smoothstep(1.12,.95,x);} // quelqu'un traverse la pièce
  else if(mode<1.5){s=ombre(p,vec2(.33+sin(t*.31)*.015,.36+sin(t*.17)*.012),.08);                              // assis, sous la télé
    float f=.5+.5*sin(t*7.)*sin(t*2.3+graine);c+=vec3(.12,.2,.38)*f*.5;}
  else if(mode<2.5){float k=fract(t*.019);s=ombre(p,vec2(.5,.46),.05)*smoothstep(0.,.04,k)*smoothstep(.6,.5,k);}   // à la fenêtre, immobile, puis plus personne
  else{s=max(ombre(p,vec2(.3+sin(t*.9)*.05,.44),.07),ombre(p,vec2(.72+sin(t*.7+1.)*.06,.45),.07));}               // une dispute
  c*=1.-s*.8;
  c*=.74+.26*(.5+.5*sin(p.x*44.+sin(p.y*3.+t*.2)*.6));                 // les plis du rideau
  float cadre=step(abs(p.x-.5),.012)+step(p.x,.025)+step(.975,p.x)+step(p.y,.03)+step(.97,p.y);
  gl_FragColor=vec4(c*(1.-min(1.,cadre)),1.);
  #include <fog_fragment>
}`;
const vivantes=[];
// b : immeuble {x0,x1,z0,z1} ; face : px (x = x1), nx (x = x0), pz (z = z1), nz (z = z0) ; i : cellule le long de la façade ;
// m : étage (0 = rez-de-chaussée) ; mode : 0 passe, 1 assis sous la télé, 2 à la fenêtre, 3 dispute.
export function fenetreVivante(b,face,i,m,mode,couleur='#ffd59a'){
  const mat=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{time:{value:0},graine:{value:vivantes.length*1.7+i*.37},mode:{value:mode},lum:{value:new THREE.Color(couleur).convertSRGBToLinear().multiplyScalar(1.05)}}]),
    vertexShader:vert,fragmentShader:frag,fog:true});
  const w=new THREE.Mesh(new THREE.PlaneGeometry(1.875,1.6875),mat),s=3*i+1.5,y=1.59375+3*m,e=.03;
  if(face==='px'){w.position.set(b.x1+e,y,b.z1-s);w.rotation.y=Math.PI/2}
  else if(face==='nx'){w.position.set(b.x0-e,y,b.z0+s);w.rotation.y=-Math.PI/2}
  else if(face==='pz'){w.position.set(b.x0+s,y,b.z1+e)}
  else{w.position.set(b.x1-s,y,b.z0-e);w.rotation.y=Math.PI}
  add(w);vivantes.push(mat);return w;
}
export function majFenetres(){for(const m of vivantes)m.uniforms.time.value=T}
// La rue et les quais : des fenêtres choisies sur les façades qui donnent sur le passage.
export function fenetresRue(Z){into(Z);
  const ouest={x0:-22,x1:-6,z0:-6,z1:34},estSud={x0:6,x1:22,z0:10,z1:34},estNord={x0:6,x1:22,z0:-30,z1:0},fond={x0:-22,x1:22,z0:-64,z1:-52},petit={x0:-9,x1:-6,z0:-30,z1:-12};
  fenetreVivante(ouest,'px',1,1,0);fenetreVivante(ouest,'px',11,2,1,'#c8f0ff');fenetreVivante(estSud,'nx',2,1,2,'#ffc47a');
  fenetreVivante(estNord,'nx',5,2,3,'#ffe2b8');fenetreVivante(fond,'pz',7,6,2,'#ffb060');fenetreVivante(petit,'px',1,1,1,'#ffd59a');
  into(null)}
function fenetresQuais(Z){into(Z);
  const a={x0:14,x1:26,z0:-40,z1:-14},b={x0:14,x1:24,z0:-12,z1:6};
  // au-dessus du mur du quai (6,5 m) : les étages du haut, entre les platanes
  fenetreVivante(a,'nx',5,5,0,'#ffd59a');fenetreVivante(a,'nx',2,6,2,'#ffc47a');fenetreVivante(b,'nx',5,4,1,'#9fd8ff');
  into(null)}
{const c0=constructeurs.quais;constructeurs.quais=()=>{c0();fenetresQuais(zones.quais)}}

// Socle partagé : utilitaires, état courant du jeu, moteur de rendu, scène, caméra et joueur.
import * as THREE from './three.js';
export {THREE};
export const $=id=>document.getElementById(id);
export const V3=THREE.Vector3;
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// Une seule suite aléatoire construit la ville : l'ordre des tirages fixe son aspect (voir main.js).
export const rnd=mulberry32(2041);
export const clamp=(v,a,b)=>v<a?a:v>b?b:v;
export function lerpAng(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*Math.min(1,t)}

/* Bus d'événements : les modules se préviennent sans s'importer les uns les autres */
const handlers={};
export const on=(e,f)=>{(handlers[e]||(handlers[e]=[])).push(f)};
export const emit=(e,...a)=>{for(const f of handlers[e]||[])f(...a)};

/* État courant. state : title, play, dialogue, paused, caught, cine, end */
export let state='title';export const setState=v=>{state=v};
export let T=0;export const tick=dt=>{T+=dt};
export const G={grace:0,flash:0,alertLvl:0,curInter:null};
export const P={pos:new V3(0,0,26),yaw:0,pitch:0,vx:0,vz:0,crouch:0,stepPh:0,stepIdx:0,fov:72};

const TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
if(TOUCH&&matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
export const MOBILE=document.body.classList.contains('touch');
export let quality=MOBILE?'perf':'ultra';
export const setQuality=q=>{quality=q;emit('quality')};
export const pr=()=>quality==='ultra'?Math.min(devicePixelRatio,1.5):quality==='perf'?Math.min(devicePixelRatio,MOBILE?1.25:1):.85;

/* ---------- Renderer ---------- */
export const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(pr());
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.3;
$('stage').appendChild(renderer.domElement);
export const scene=new THREE.Scene();
export const FOG=new THREE.Color(0x0e0f20);
scene.background=FOG.clone();
scene.fog=new THREE.FogExp2(FOG.clone(),0.023);
export const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,0.05,600);
camera.rotation.order='YXZ';
scene.add(camera);

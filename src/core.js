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

/* État courant. state : title, play, dialogue, puzzle, paused, lecture, mort, cine, end */
export let state='title';export const setState=v=>{state=v};
export let T=0;export const tick=dt=>{T+=dt};
// danger : secondes depuis le dernier échange de tirs (pas de point de sauvegarde tant qu'il reste du danger) ; choc : décharge de taser
export const G={grace:0,flash:0,alertLvl:0,curInter:null,danger:0,choc:0};
export const P={pos:new V3(0,0,26),yaw:0,pitch:0,vx:0,vz:0,crouch:0,stepPh:0,stepIdx:0,fov:72,vie:100};
/* Difficulté des combats (voir combat.js) : « tendu mais juste ». Cinq balles de Gardien pour tomber, une rafale toutes les
   1,4 s environ après un temps de réaction ; chance : probabilité de toucher de près, debout, immobile, en pleine lumière.
   La santé remonte de regen points par seconde après regenDelai secondes sans blessure. */
export const DIFF={vie:100,regenDelai:4.5,regen:10,
  gardien:{degats:21,chance:.62,rafale:2,entre:.12,cadence:1.4,reaction:.75,portee:24},
  drone:{degats:12,chance:.65,cadence:1.3,reaction:.6,portee:14},
  faucheuse:{degats:11,chance:.24,balles:5,entre:.07,cadence:1.7,reaction:.9,portee:40},
  laser:{degats:34,delai:.8}};

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

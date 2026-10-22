// Rendu sans gel. Three.js recompile tous les shaders d'un lieu dès que le nombre de lumières visibles change
// (un Gardien qui apparaît avec sa lampe, le drone d'entraînement, la Faucheuse…) ou qu'un matériau s'affiche pour la
// première fois. Sous Windows (Direct3D), cela peut figer l'écran plusieurs dizaines de secondes. Donc :
//  1. chaque lumière portée par un objet est rattachée à la racine de son lieu, et suit un repère laissé à sa place ;
//     quand l'objet est caché, elle reste dans la scène mais s'éteint (intensité 0) : leur nombre ne change jamais ;
//  2. chaque lieu est préparé une fois en entier, objets cachés compris (compilerZone), derrière l'écran de chargement,
//     pour la cible où la scène se dessine vraiment (celle du post-traitement, et celle des reflets du sol).
import {THREE,scene,camera,renderer} from './core.js';
import {zones} from './zones.js';
import {composer} from './rendu.js';

const visible=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true};
export function stabiliserLumieres(z){
  if(!z)return;const L=[];
  z.root.traverse(o=>{if(o.isLight&&!o.isAmbientLight&&!o.isHemisphereLight&&o.parent!==z.root&&!o.userData.ancre)L.push(o)});
  for(const l of L){
    const a=new THREE.Object3D();a.position.copy(l.position);l.parent.add(a);z.root.add(l);l.userData.ancre=a;
    let v=l.intensity;Object.defineProperty(l,'intensity',{configurable:true,get(){return visible(a)?v:0},set(x){v=x}});
    (z.lumAncrees||(z.lumAncrees=[])).push(l);a.getWorldPosition(l.position);
  }
}
// À chaque image : les lumières rattachées suivent leur repère (la racine d'un lieu est à l'origine).
export function suivreLumieres(z){if(z&&z.lumAncrees)for(const l of z.lumAncrees)l.userData.ancre.getWorldPosition(l.position)}

// Effets communs à tous les lieux, cachés la plupart du temps (traînées des tirs, arcs de la Coupure) : préparés avec
// chaque lieu, comme ses propres objets cachés.
export const globaux=[];
// Prépare tous les shaders du lieu tel qu'il sera joué (mêmes lumières, même environnement), objets cachés et
// objets portés par la caméra (arme, main K7) compris.
export function compilerZone(z){
  if(!z)return;stabiliserLumieres(z);
  const caches=[],montrer=o=>{if(!o.visible){o.visible=true;caches.push(o)}};
  const autres=[];for(const id in zones){const r=zones[id].root;if(zones[id]!==z&&r.visible){r.visible=false;autres.push(r)}}
  const v0=z.root.visible;z.root.visible=true;
  z.root.traverse(o=>{if(o!==z.root)montrer(o)});camera.traverse(o=>{if(o!==camera)montrer(o)});for(const g of globaux)g.traverse(montrer);
  // Les programmes dépendent de l'encodage de la cible : la scène se dessine dans celle du post-traitement (linéaire),
  // pas à l'écran ; les reflets du sol, dans la leur (que Reflector met à l'encodage de sortie, sRGB, à chaque image).
  // Une compilation par encodage utilisé.
  const cibles=[composer?composer.renderTarget1:null];
  z.root.traverse(o=>{if(o.type==='Reflector'){const c=o.getRenderTarget();c.texture.encoding=renderer.outputEncoding;cibles.push(c)}});
  const avant=renderer.getRenderTarget(),faits=new Set();
  for(const c of cibles){const e=c?c.texture.encoding:renderer.outputEncoding;if(faits.has(e))continue;faits.add(e);
    renderer.setRenderTarget(c);try{renderer.compile(scene,camera)}catch(x){console.warn('compilation',x)}}
  renderer.setRenderTarget(avant);
  for(const o of caches)o.visible=false;for(const r of autres)r.visible=true;z.root.visible=v0;
  z.compilee=true;
}
// Pour les tests : combien de lumières de chaque sorte Three.js verra (ce qui décide des recompilations).
export function signatureLumieres(){const n={p:0,s:0,d:0};scene.traverseVisible(o=>{if(o.isPointLight)n.p++;else if(o.isSpotLight)n.s++;else if(o.isDirectionalLight)n.d++});return`${n.p}/${n.s}/${n.d}`}

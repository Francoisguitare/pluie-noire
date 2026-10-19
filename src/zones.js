// Les lieux du jeu. Chaque zone a son groupe 3D, ses collisions, ses interactions, ses personnages, ses drones
// et ses effets animés. Une seule zone est affichée à la fois ; le ciel et la pluie restent dans la scène.
import {THREE,scene} from './core.js';

export const zones={};
let cur=null;
export const zone=()=>cur;
export function makeZone(id,o={}){
  const z=Object.assign({id,root:new THREE.Group(),colliders:[],particles:[],shafts:[],flickers:[],lanterns:[],inter:[],npcs:[],drones:[],
    outdoor:true,indoor:()=>false,surfaceAt:()=>'asphalt',update:null,enter:null,exit:null},o);
  z.root.visible=false;scene.add(z.root);zones[id]=z;return z;
}
export function enterZone(id){
  if(cur&&cur.id===id)return cur;
  if(cur){cur.root.visible=false;cur.exit&&cur.exit()}
  cur=zones[id];cur.root.visible=true;cur.enter&&cur.enter();return cur;
}
export const npcBy=k=>cur&&cur.npcs.find(n=>n.key===k);

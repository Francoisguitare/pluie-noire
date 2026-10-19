// Sauvegardes, version 2. Un seul enregistrement dans le navigateur :
//   {v:2, partie:{S,p,zone,at}|null, saisons:{'1':{fin,…,at}}}
// La partie en cours s'écrit toutes les 4 s en jeu, à la fermeture et à chaque étape (emit('save')).
// Les saisons terminées restent même quand on recommence : la saison suivante les relira.
// L'ancien format (pluie-noire-save-v1) est converti au premier chargement.
import {$,P,state,on,emit} from './core.js';
import {S,chap} from './histoire/partie.js';
import {zone} from './zones.js';

const KEY='pluie-noire-v2',OLD='pluie-noire-save-v1';
const vide=()=>({v:2,partie:null,saisons:{}});
export function lire(){
  try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.v===2)return Object.assign(vide(),d)}catch(e){}
  try{const o=JSON.parse(localStorage.getItem(OLD)||'null');
    if(o&&o.S&&o.p){const d=vide();d.partie={S:o.S,p:o.p,zone:'rue',at:o.at||Date.now()};ecrire(d,true);localStorage.removeItem(OLD);return d}}catch(e){}
  return vide();
}
function ecrire(d,silent){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}if(!silent)emit('saved',d)}
export function saveGame(){if(state!=='play'&&state!=='dialogue')return;
  const d=lire(),s=Object.assign({},S,{elapsed:Math.round(performance.now()-S.t0)});delete s.t0;
  d.partie={S:s,p:[+P.pos.x.toFixed(2),+P.pos.z.toFixed(2),+P.yaw.toFixed(3)],zone:zone().id,at:Date.now()};ecrire(d)}
export function readSave(){return lire().partie}
export function clearSave(){const d=lire();d.partie=null;ecrire(d)}
// Enregistre la fin d'une saison (choix et statistiques), pour la saison suivante.
export function finSaison(n,rec){const d=lire();d.saisons[n]=Object.assign({at:Date.now()},rec);ecrire(d)}
export const saisons=()=>lire().saisons;
// Remplace tout (import d'un code ou d'une sauvegarde en ligne).
export function remplacer(d){ecrire(Object.assign(vide(),d))}
on('save',saveGame);on('clearSave',clearSave);

// Résumé lisible d'une sauvegarde (écran titre, import).
export function decrire(d){
  if(!d||!d.partie)return d&&Object.keys(d.saisons||{}).length?'Saison 1 terminée':'Aucune partie en cours';
  const min=Math.round((Date.now()-d.partie.at)/60000),ago=min<1?"à l'instant":min<60?`il y a ${min} min`:min<1440?`il y a ${Math.round(min/60)} h`:`il y a ${Math.round(min/1440)} j`;
  return`Sauvegarde ${ago} · ${chap(d.partie.S.chapter).describe(d.partie.S)}`;
}
export function showSaveInfo(){const d=lire(),p=d.partie;$('cont').hidden=!p;$('play').textContent=p?'Nouvelle partie':'Entrer dans la nuit';$('play').classList.toggle('alt',!!p);
  if(!p){$('saveInfo').hidden=true;return}
  $('saveInfo').textContent=decrire(d);$('saveInfo').hidden=false}
setInterval(()=>{if(state==='play')saveGame()},4000);
addEventListener('pagehide',saveGame);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});

/* ---------- Code de transfert ----------
   « PN2z- » + base64url(deflate(JSON)) + « . » + somme de contrôle, ou « PN2- » sans compression si le navigateur ne sait pas compresser.
   Pas de serveur : le code contient toute la sauvegarde. */
const b64=u8=>btoa(String.fromCharCode(...u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
const somme=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36).slice(-4).padStart(4,'0')};
async function flux(u8,T){const s=new Blob([u8]).stream().pipeThrough(new T('deflate-raw'));return new Uint8Array(await new Response(s).arrayBuffer())}
export async function exportCode(){
  const d=lire(),json=JSON.stringify({v:2,partie:d.partie,saisons:d.saisons}),u8=new TextEncoder().encode(json);
  let corps,pre;
  try{if(!window.CompressionStream)throw 0;corps=b64(await flux(u8,CompressionStream));pre='PN2z-'}catch(e){corps=b64(u8);pre='PN2-'}
  return pre+corps+'.'+somme(pre+corps);
}
export async function importCode(code){
  code=(code||'').replace(/\s+/g,'');const m=code.match(/^(PN2z?-)([A-Za-z0-9_-]+)\.([0-9a-z]{4})$/);
  if(!m)throw new Error('Ce code n\'est pas un code de Pluie Noire.');
  if(somme(m[1]+m[2])!==m[3])throw new Error('Ce code est incomplet ou contient une faute de frappe.');
  let u8=unb64(m[2]);
  if(m[1]==='PN2z-'){if(!window.DecompressionStream)throw new Error('Ce navigateur ne sait pas lire ce code. Mets-le à jour.');u8=await flux(u8,DecompressionStream)}
  const d=JSON.parse(new TextDecoder().decode(u8));
  if(!d||d.v!==2)throw new Error('Ce code vient d\'une version du jeu que celle-ci ne connaît pas.');
  return d;
}

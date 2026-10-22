// Sauvegardes, version 2. Un seul enregistrement dans le navigateur :
//   {v:2, partie:{S,p,zone,vie,at}|null, point:{S,p,zone,at}|null, saisons:{'1':{fin,…,at}}}
// point : le dernier point de sauvegarde. Chaque étape en demande un (emit('save') : histoire, fin d'un dialogue, archive lue,
// lieu découvert…), passer près d'un point sûr d'un chapitre aussi ; il n'est pris qu'en jeu et hors de danger (personne
// ne te tire dessus ni ne te cherche). Après une chute (combat.js), ou depuis le menu pause, on y revient.
// partie : là où tu as quitté (pause, écran titre, fermeture de la page) ; « Continuer » la reprend. Chaque point l'écrit aussi.
// Les saisons terminées restent même quand on recommence : la saison suivante les relira.
// L'ancien format (pluie-noire-save-v1) est converti au premier chargement.
import {$,P,G,state,on,emit} from './core.js';
import {S,chap} from './histoire/partie.js';
import {zone} from './zones.js';

const KEY='pluie-noire-v2',OLD='pluie-noire-save-v1';
const vide=()=>({v:2,partie:null,point:null,saisons:{}});
export function lire(){
  try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.v===2)return Object.assign(vide(),d)}catch(e){}
  try{const o=JSON.parse(localStorage.getItem(OLD)||'null');
    if(o&&o.S&&o.p){const d=vide();d.partie={S:o.S,p:o.p,zone:'rue',at:o.at||Date.now()};ecrire(d,true);localStorage.removeItem(OLD);return d}}catch(e){}
  return vide();
}
function ecrire(d,silent){try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}if(!silent)emit('saved',d)}
function instantane(){const s=Object.assign({},S,{elapsed:Math.round(performance.now()-S.t0)});delete s.t0;
  return{S:s,p:[+P.pos.x.toFixed(2),+P.pos.z.toFixed(2),+P.yaw.toFixed(3)],zone:zone().id,at:Date.now()}}
// La partie là où on la quitte (avec la santé du moment).
export function saveGame(){if(state!=='play'&&state!=='dialogue'&&state!=='paused')return;
  const d=lire();d.partie=Object.assign(instantane(),{vie:Math.round(P.vie)});ecrire(d)}
export function readSave(){return lire().partie}
export function clearSave(){const d=lire();d.partie=null;d.point=null;ecrire(d)}

/* ---------- Points de sauvegarde ---------- */
let attente=false,annonceT=-1e9,lieuSur='',verif=0;
// Écrit un point de sauvegarde ici et maintenant (santé pleine au retour), et l'annonce (au plus une fois toutes les 9 s).
export function pointDeSauvegarde(){
  const d=lire(),i=instantane();d.point=i;d.partie=Object.assign({},i,{vie:Math.round(P.vie)});ecrire(d);
  const t=performance.now();if(t-annonceT>9000){annonceT=t;emit('pointSauve')}
}
// À chaque image : un point demandé est pris dès qu'on est en jeu et hors de danger.
export function majPoints(dt){
  if(state!=='play')return;
  if((verif-=dt)<=0){verif=.5;const c=chap().checkpoint(S),k=zone().id+':'+c[0]+':'+c[1];
    if(k!==lieuSur&&Math.hypot(P.pos.x-c[0],P.pos.z-c[1])<2.2){lieuSur=k;attente=true}} // les points sûrs des chapitres
  if(attente&&G.danger<=0&&G.alertLvl<.3){attente=false;pointDeSauvegarde()}
}
// Le point où l'on revient : le dernier point de sauvegarde, sinon la partie enregistrée (importée d'un code, ancienne version).
export const dernierPoint=()=>{const d=lire();return d.point||d.partie};
on('save',()=>{attente=true});
on('nouvellePartie',()=>{attente=false;lieuSur=''});
// Enregistre la fin d'une saison (choix et statistiques), pour la saison suivante.
export function finSaison(n,rec){const d=lire();d.saisons[n]=Object.assign({at:Date.now()},rec);ecrire(d)}
export const saisons=()=>lire().saisons;
// Remplace tout (import d'un code ou d'une sauvegarde en ligne).
export function remplacer(d){ecrire(Object.assign(vide(),d))}
on('clearSave',clearSave);

// Les fins de la saison 1, telles qu'on les nomme au joueur.
export const NOMS_FINS={diffuser:'« La ville a vu »',saboter:"« Le silence de l'antenne »",negocier:"« Le prix d'une main »",mara:'« La main de Mara »',maraForce:'« La main de Mara »'};
// « à l'instant », « il y a 3 min »…
export function ilYa(at){const min=Math.round((Date.now()-at)/60000);return min<1?"à l'instant":min<60?`il y a ${min} min`:min<1440?`il y a ${Math.round(min/60)} h`:`il y a ${Math.round(min/1440)} j`}
// Résumé lisible d'un enregistrement (partie ou point de sauvegarde).
export const resume=p=>`${ilYa(p.at)} · ${chap(p.S.chapter).describe(p.S)}`;
// Résumé lisible d'une sauvegarde (écran titre, import).
export function decrire(d){
  if(!d||!d.partie)return d&&d.saisons&&d.saisons['1']?`Saison 1 terminée · ${NOMS_FINS[d.saisons['1'].fin]||''}`:'Aucune partie en cours';
  return`Sauvegarde ${resume(d.partie)}`;
}
export function showSaveInfo(){const d=lire(),p=d.partie;$('cont').hidden=!p;$('play').textContent=p?'Nouvelle partie':'Entrer dans la nuit';$('play').classList.toggle('alt',!!p);
  if(!p){const f=d.saisons['1'];$('saveInfo').hidden=!f;if(f)$('saveInfo').textContent=`Saison 1 terminée · ${NOMS_FINS[f.fin]||f.fin}${f.completion!=null?` · ${f.completion} %`:''}. Ta fin est gardée pour la saison 2.`;return}
  $('saveInfo').textContent=decrire(d);$('saveInfo').hidden=false}
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

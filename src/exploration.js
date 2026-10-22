// L'exploration : 41 archives Helix réparties en six dossiers (chacun raconte une histoire et se termine par une
// révélation), sous plusieurs formes (carte mémoire au sol, graffiti, affiche, répondeur, écran), la lecture sans
// lâcher la visée, l'écran « Dossiers », le signal de la main K7 près d'une archive, les lieux à découvrir, les
// premières rencontres, les annonces d'Helix qui suivent la nuit, et ce que certaines archives changent à l'histoire
// (Kovac, Varga, Sid, Rosa, le casier des quais, l'épilogue).
import {THREE,$,V3,P,T,camera,MOBILE,state,setState,on,emit,clamp} from './core.js';
import {S,heure,refreshHud} from './histoire/partie.js';
import {zone} from './zones.js';
import {toast,ouvrirEcran,fermerEcran} from './interface.js';
import {glow,M,into,addBox} from './construire.js';
import {softDot,mk,canvasTex} from './textures.js';
import {DLG} from './histoire/dialogue.js';
import {gagner,porteeEcho} from './pouvoirs.js';
import {moniteur} from './ordinateurs.js';
import {archiveSound,bipSignal,annonce,tone} from './son.js';
import {categorie,completion} from './completion.js';

import {DOSSIERS,ARCHIVES,RADIOS} from './archives.js';
export {DOSSIERS,ARCHIVES,RADIOS};
const dossier=id=>DOSSIERS.find(d=>d.id===id);
const deDossier=id=>ARCHIVES.filter(a=>a.dossier===id);
const trouvee=id=>S.archives.includes(id);
export const aTrouve=trouvee;
const NOMS_LIEUX={rue:'la rue',toits:'les toits',traboules:'les traboules',quais:'les quais',tour:'la tour Helix',sommet:'le toit de la tour'};

/* ====================================================================================================
   Dans le décor : carte mémoire, graffiti, affiche, répondeur, écran
   ==================================================================================================== */
const geoCarte=new THREE.BoxGeometry(.16,.014,.11),geoBande=new THREE.BoxGeometry(.162,.016,.012);
const matCarte=new THREE.MeshStandardMaterial({color:0x1b1e24,roughness:.35,metalness:.7}),matBande=glow(0x58e6ff,2.2);
const matPoint=new THREE.SpriteMaterial({map:softDot,color:new THREE.Color(0x58e6ff).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
const matPointRouge=new THREE.SpriteMaterial({map:softDot,color:new THREE.Color(0xff3020).multiplyScalar(2.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
// Le mur le plus proche : point d'appui et normale (vers l'extérieur du mur), ou null s'il est trop loin.
function murProche(z,x,zz,max=1.6){
  let best=null;
  for(const c of z.colliders){if(c.off)continue;const px=clamp(x,c.x0,c.x1),pz=clamp(zz,c.z0,c.z1),d=Math.hypot(x-px,zz-pz);
    if(d<1e-3||d>max)continue;if(!best||d<best.d)best={d,px,pz,nx:(x-px)/d,nz:(zz-pz)/d}}
  return best;
}
// Hauteur du sol sous (x,z) : un rayon vers le bas, lancé à hauteur de genou (trottoirs, marches ; pas les tables).
const rayon=new THREE.Raycaster(),BAS=new THREE.Vector3(0,-1,0),_n=new THREE.Vector3();
function solSous(z,x,zz){
  z.root.updateMatrixWorld(true);rayon.set(new THREE.Vector3(x,.6,zz),BAS);rayon.far=2;rayon.camera=camera; // la caméra : exigée pour les sprites
  for(const h of rayon.intersectObject(z.root,true)){const o=h.object;if(!o.isMesh||(o.material&&o.material.transparent)||!h.face)continue;
    _n.copy(h.face.normal).transformDirection(o.matrixWorld);if(_n.y>.7)return h.point.y}
  return 0;
}
function texGraffiti(tag,graine){
  const[c,g]=mk(512,288);g.clearRect(0,0,512,288);const lignes=tag.split('\n'),col=['#ff3d6a','#58e6ff','#ffd23a','#e8e8e8'][graine%4];
  g.textAlign='center';g.textBaseline='middle';const fs=Math.min(64,Math.floor(470/Math.max(...lignes.map(l=>l.length))*1.7));
  lignes.forEach((l,i)=>{const y=144+(i-(lignes.length-1)/2)*fs*1.1;g.font=`700 ${fs}px "Saira Condensed",sans-serif`;
    g.fillStyle='rgba(0,0,0,.35)';g.fillText(l,259,y+4);g.fillStyle=col;g.fillText(l,256,y);
    // coulures
    g.fillStyle=col;for(let k=0;k<6;k++){const x=256+((k*97+graine*31)%380)-190,h=10+((k*53+graine)%40);g.globalAlpha=.7;g.fillRect(x,y+fs*.35,3,h);g.globalAlpha=1}});
  return canvasTex(c);
}
function texAffiche(tag,graine){
  const[c,g]=mk(256,360);g.fillStyle=graine%2?'#d8d0c0':'#c9d6dc';g.fillRect(0,0,256,360);
  g.fillStyle='#0b2a3a';g.fillRect(0,0,256,70);g.fillStyle='#58e6ff';g.font='700 26px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('HELIX BIOTECH',128,44);
  g.fillStyle='#1a1a1a';const lignes=tag.split('\n');lignes.forEach((l,i)=>{g.font=`700 ${i?26:34}px "Saira Condensed",sans-serif`;g.fillText(l,128,130+i*40)});
  g.fillStyle='#7a2a20';g.fillRect(40,260,176,4);g.font='600 18px "Saira Condensed",sans-serif';g.fillStyle='#333';g.fillText('Soyez entier.',128,300);
  // déchirures et taches
  g.fillStyle='rgba(40,30,20,.25)';for(let k=0;k<5;k++)g.fillRect((k*71+graine*13)%220,(k*113+graine*7)%330,30,8);
  return canvasTex(c);
}
function poserArchives(z){
  if(z.archives)return;z.archives=[];
  ARCHIVES.forEach((a,i)=>{if(a.zone!==z.id)return;
    const g=new THREE.Group(),r={a,g,p:null};let forme=a.forme;const mur=murProche(z,a.x,a.z);
    if((forme==='graffiti'||forme==='affiche')&&!mur)forme='carte';
    const y0=forme==='graffiti'||forme==='affiche'?0:solSous(z,a.x,a.z);
    if(forme==='carte'){g.position.set(a.x,y0,a.z);g.rotation.y=(a.x*7.3+a.z*3.1)%6.28;
      const c=new THREE.Mesh(geoCarte,matCarte);c.position.y=.008;g.add(c);const b=new THREE.Mesh(geoBande,matBande);b.position.set(0,.009,.045);g.add(b);
      r.p=new THREE.Sprite(matPoint.clone());r.p.position.set(.05,.05,-.03);r.p.scale.setScalar(.22);g.add(r.p)}
    else if(forme==='graffiti'||forme==='affiche'){
      const graff=forme==='graffiti',w=graff?1.7:.62,h=graff?.95:.87;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:graff?texGraffiti(a.tag,i):texAffiche(a.tag,i),transparent:graff,roughness:.9,emissive:graff?0xffffff:0x000000,emissiveIntensity:graff?.12:0,emissiveMap:graff?null:null,depthWrite:!graff}));
      if(graff)m.material.emissiveMap=m.material.map;
      g.position.set(mur.px+mur.nx*.03,graff?1.75:1.5,mur.pz+mur.nz*.03);g.rotation.y=Math.atan2(mur.nx,mur.nz);g.add(m);
      r.p=new THREE.Sprite(matPoint.clone());r.p.position.set(w/2-.05,-h/2+.05,.02);r.p.scale.setScalar(.16);g.add(r.p)}
    else{ // répondeur ou écran : posés face à l'espace libre
      const yaw=mur?Math.atan2(mur.nx,mur.nz):0;g.position.set(a.x,y0,a.z);g.rotation.y=yaw;
      const socle=new THREE.Mesh(new THREE.BoxGeometry(.5,forme==='ecran'?.9:.5,.4),M.darkMetal);socle.position.y=forme==='ecran'?.45:.25;g.add(socle);
      if(forme==='repondeur'){const b=new THREE.Mesh(new THREE.BoxGeometry(.24,.07,.17),new THREE.MeshStandardMaterial({color:0x22252b,roughness:.5,metalness:.4}));b.position.y=.535;g.add(b);
        r.p=new THREE.Sprite(matPointRouge.clone());r.p.position.set(.07,.58,.06);r.p.scale.setScalar(.12);g.add(r.p)}
      else{const mo=moniteur(0,0,0,0,{pied:false,w:.42,h:.26,titre:'ARCHIVE HELIX',coin:'LIRE',graine:70+i,lignes:a.titre.match(/.{1,26}(\s|$)/g).slice(0,3).map(l=>[l.trim()])});
        mo.g.position.set(0,.9,0);g.add(mo.g); // add() le retire de la scène où moniteur() l'a posé
        r.p=new THREE.Sprite(matPoint.clone());r.p.position.set(.2,1.0,.05);r.p.scale.setScalar(.14);g.add(r.p)}
    }
    z.root.add(g);z.archives.push(r);
    const label={carte:"Ramasser l'archive",graffiti:'Lire le graffiti',affiche:"Lire l'affiche",repondeur:'Écouter le répondeur',ecran:"Lire l'écran"}[forme];
    const pos=forme==='graffiti'||forme==='affiche'?new V3(mur.px+mur.nx*.6,0,mur.pz+mur.nz*.6):new V3(a.x,0,a.z);
    z.inter.push({p:pos,r:1.8,archive:a.id,on:()=>!trouvee(a.id),label:()=>label,act:()=>ramasser(a)});
  });
  if(z.id==='quais')poserCasier(z);
}
// Les cartes ramassées disparaissent ; graffitis, affiches, répondeurs et écrans restent, leur diode s'éteint.
function majArchivesZone(z){if(!z.archives)return;for(const r of z.archives){const pris=trouvee(r.a.id);
  if(r.a.forme==='carte')r.g.visible=!pris;
  if(r.p){r.p.visible=!pris;if(!pris){const k=.5+.5*Math.sin(T*(r.a.forme==='repondeur'?6:3)+r.a.x);r.p.material.opacity=.3+k*.7}}}}

/* ====================================================================================================
   La lecture : un panneau par-dessus le jeu, sans lâcher la souris (E, Espace, Entrée ou clic pour continuer)
   ==================================================================================================== */
let pages=[],ouverte=false;
export function lire(lot){pages=lot.slice();ouverte=true;setState('lecture');document.body.classList.add('lecture');$('prompt').hidden=true;pageSuivante(true)}
function pageSuivante(premiere){
  if(!premiere)tone(560,.04,'triangle',.025);
  const p=pages.shift();if(!p){fermer();return}
  $('lecKick').textContent=p.kicker||'';$('lecTitre').textContent=p.titre||'';$('lecTexte').textContent=p.texte||'';$('lecture').classList.toggle('revelation',!!p.revelation);
  $('lecPied').textContent=(pages.length?'Suite':'Fermer')+(MOBILE?' : touche l\'écran':' : E, Espace ou clic')+(p.relire?(MOBILE?' · à relire dans Dossiers (menu II)':' · à relire dans Dossiers (touche J)'):'');$('lecture').hidden=false;$('lecture').scrollTop=0;
}
function fermer(){ouverte=false;$('lecture').hidden=true;document.body.classList.remove('lecture');if(state==='lecture')setState('play');emit('save');refreshHud()}
on('lectureSuite',()=>{if(ouverte)pageSuivante()});
$('lecture').addEventListener('click',()=>{if(ouverte)pageSuivante()});
export const enLecture=()=>ouverte;

function ramasser(a){
  if(trouvee(a.id))return;S.archives.push(a.id);archiveSound();
  const d=dossier(a.dossier),L=deDossier(a.dossier),n=L.filter(x=>trouvee(x.id)).length;
  const lot=[{kicker:`Archive ${S.archives.length} / ${ARCHIVES.length} · ${d.titre} (${n}/${L.length})`,titre:a.titre,texte:a.texte}];
  if(n===L.length&&!S.dossiersFinis.includes(d.id)){S.dossiersFinis.push(d.id);lot.push({kicker:`Dossier complet · ${d.titre}`,titre:'Ce que le dossier révèle',texte:d.revelation,revelation:true})}
  lot[lot.length-1].relire=true;lire(lot);gagner(50,'archive trouvée');
  if(lot.length>1)setTimeout(()=>gagner(150,'dossier complet'),700);
}

/* ====================================================================================================
   Le casier de la consigne, sous le pont des quais (code dans l'archive quais5)
   ==================================================================================================== */
function poserCasier(z){
  into(z);const x0=6.55,x1=7.15,z0=-37.6,z1=-36.6;
  const corps=addBox(x0,x1,z0,z1,0,1.9,new THREE.MeshStandardMaterial({color:0x3b4a44,roughness:.55,metalness:.6}));
  const porte=addBox(x0-.03,x0,z0+.05,z1-.05,.1,1.8,new THREE.MeshStandardMaterial({color:0x4a5c55,roughness:.5,metalness:.6}),{collide:false});
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.3,.12),glow(0xffb347,1.2));plaque.position.set(x0-.035,1.55,(z0+z1)/2);plaque.rotation.y=-Math.PI/2;z.root.add(plaque);
  into(null);
  z.inter.push({p:new V3(6.1,0,-37.1),r:1.6,on:()=>!S.quetes.casier,label:()=>trouvee('quais5')?'Ouvrir le casier 7 (code 1834)':'Casier 7 de la consigne (cadenas à code)',
    act:()=>{if(!trouvee('quais5')){toast('Un cadenas à quatre chiffres. Le code doit être écrit quelque part, pas loin.');tone(300,.08,'square',.03);return}
      S.quetes.casier=true;porte.position.x-=.25;porte.rotation.y=-1.2;S.credits+=80;tone(900,.08,'triangle',.04);setTimeout(()=>tone(1200,.1,'triangle',.04),90);
      lire([{kicker:'Casier 7 · consigne fluviale',titre:"Ce que les Canuts ont laissé",texte:"Une couverture pliée, des piles, une trousse de soin, et une enveloppe avec quatre-vingts crédits en jetons. Un mot : « Pour qui en a besoin cette nuit. On se doit ça. — R. »\n\nEt, au fond, un plan de la tour au feutre : la porte de service, l'ascenseur, et une croix sur le 41e étage avec ces mots : « la salle des serveurs, là où ils ont mis la voix de la ville »."}]);
      gagner(40,'casier des Canuts');refreshHud()}});
}

/* ====================================================================================================
   Le signal : la main K7 frémit près d'une archive (bips de plus en plus rapprochés)
   ==================================================================================================== */
let bipT=0;
function signal(dt,Z){
  let d=1e9;for(const r of Z.archives||[]){if(trouvee(r.a.id))continue;const p=r.g.getWorldPosition(_v);const dd=Math.hypot(p.x-P.pos.x,p.z-P.pos.z);if(dd<d)d=dd}
  const k=d<12?1-d/12:0;$('signal').hidden=k<=0;if(k<=0)return;
  $('signal').style.setProperty('--k',k.toFixed(2));$('signal').dataset.n=Math.ceil(k*4);
  if(!S.signalVu){S.signalVu=true;toast("Ta main K7 frémit : une archive Helix est proche. Plus elle bipe vite, plus tu chauffes.")}
  bipT-=dt;if(bipT<=0){bipSignal(k);bipT=.25+(1-k)*1.4}
}
const _v=new V3();

/* ====================================================================================================
   Lieux à découvrir et premières rencontres
   ==================================================================================================== */
export const LIEUX=[
  {id:'ruelle',zone:'rue',x:-11,z:-26,r:4,nom:'La ruelle de Sid'},{id:'bar',zone:'rue',x:6.5,z:5,r:3,nom:'Le bar de Kovac'},
  {id:'labo',zone:'rue',x:0,z:-47,r:4,nom:'Le labo Helix'},{id:'alcove',zone:'rue',x:-4.5,z:19,r:2.5,nom:"L'alcôve de Mara"},{id:'depot',zone:'rue',x:14,z:-35.5,r:3.5,nom:'Le dépôt Helix'},
  {id:'toitKovac',zone:'toits',x:7,z:6,r:5,nom:'Le toit de Kovac'},{id:'citernes',zone:'toits',x:7,z:-9,r:5,nom:'Les citernes'},
  {id:'enseigne',zone:'toits',x:-12,z:-8,r:5,nom:"Derrière l'enseigne LYON-BASSE"},{id:'trappe',zone:'toits',x:-12,z:-27,r:5,nom:'La trappe de Sid'},
  {id:'voute',zone:'traboules',x:0,z:-12,r:3,nom:'Le passage voûté'},{id:'puits',zone:'traboules',x:0,z:-29,r:5,nom:'La cour du puits'},
  {id:'alcoves',zone:'traboules',x:-20,z:-29.8,r:3,nom:'Le passage aux alcôves'},{id:'voraces',zone:'traboules',x:-40,z:-30,r:6,nom:'La cour des Voraces'},
  {id:'canuts',zone:'traboules',x:-38,z:-52,r:4,nom:'Chez les Nouveaux Canuts'},{id:'atelier',zone:'traboules',x:-57,z:-55,r:4,nom:"L'atelier de Varga"},
  {id:'basport',zone:'quais',x:0,z:-12,r:5,nom:'Le bas-port'},{id:'pont',zone:'quais',x:0,z:-36,r:5,nom:'Sous le pont'},
  {id:'quai',zone:'quais',x:1,z:-66,r:6,nom:'Le quai de chargement'},{id:'service',zone:'quais',x:0,z:-86,r:3,nom:'La porte de service'},
  {id:'hall',zone:'tour',x:0,z:2,r:7,nom:'Le hall Helix'},{id:'palier',zone:'tour',x:102,z:0,r:3,nom:'Le palier du 41e'},
  {id:'couloir',zone:'tour',x:118,z:0,r:3,nom:'Le couloir des lasers'},{id:'serveurs',zone:'tour',x:140,z:0,r:6,nom:'La salle des serveurs'},
  {id:'sommet',zone:'sommet',x:-16,z:10,r:5,nom:'Le toit de la tour'},
];
function lieux(Z){for(const l of LIEUX){if(l.zone!==Z.id||S.lieux.includes(l.id))continue;
  if(Math.hypot(P.pos.x-l.x,P.pos.z-l.z)<l.r){S.lieux.push(l.id);gagner(25,'lieu découvert : '+l.nom.replace(/^./,c=>c.toLowerCase()));emit('save')}}}
// Première conversation avec chaque personnage
const PERSONNES={mara:'Mara',nox:'NOX-7',kovac:'Kovac',sid:'Sid',rosa:'Rosa Delorme',varga:'Ilse Varga',saal:'Victor Saal'};
// Les quêtes (S.quetes) : la photo de Sid, la carte de Jean Delorme pour Rosa, le casier des quais.
export const QUETES=[{id:'sid',nom:'La photo de Sid'},{id:'rosa',nom:'La carte de Jean Delorme'},{id:'casier',nom:'Le casier 7 des quais'}];
// Ce que l'exploration compte dans le pourcentage de la partie
categorie({id:'archives',nom:'Archives',poids:30,fait:()=>S.archives.filter(id=>ARCHIVES.some(a=>a.id===id)).length,total:()=>ARCHIVES.length});
categorie({id:'dossiers',nom:'Dossiers complets',poids:10,fait:()=>S.dossiersFinis.length,total:()=>DOSSIERS.length});
categorie({id:'lieux',nom:'Lieux découverts',poids:8,fait:()=>S.lieux.length,total:()=>LIEUX.length});
categorie({id:'rencontres',nom:'Rencontres',poids:6,fait:()=>S.rencontres.length,total:()=>Object.keys(PERSONNES).length});
categorie({id:'quetes',nom:'Quêtes',poids:8,fait:()=>QUETES.filter(q=>S.quetes[q.id]).length,total:()=>QUETES.length});
on('dialogueOuvert',k=>{const d=DLG[k];if(!d)return;const nom=(d.name||'').toLowerCase();
  const qui=Object.keys(PERSONNES).find(p=>nom.includes(p));if(!qui||S.rencontres.includes(qui))return;
  S.rencontres.push(qui);setTimeout(()=>gagner(20,'rencontre : '+PERSONNES[qui]),300)});

/* ====================================================================================================
   La ville réagit : annonces des haut-parleurs d'Helix, selon l'heure et ce que tu as fait
   ==================================================================================================== */
const ANNONCES=[
  {si:()=>S.chapter<=2,t:"Helix Biotech. Votre K7 vous comprend. Votre K7 vous protège. Soyez entier."},
  {si:()=>S.chapter<=2,t:"Rappel aux résidents : la maintenance de votre prothèse est obligatoire et prélevée automatiquement. Merci de votre confiance."},
  {si:()=>S.chapter>=3,t:"Ici Helix Sécurité. Le quartier de Lyon-Basse est en quarantaine. Restez chez vous. Les prothèses K7 restent sous garantie."},
  {si:()=>S.chapter>=3&&S.neutres.length>=1,t:"Avis à la population : un individu équipé d'une prothèse K7 met nos agents hors service. Signalez-le. Récompense : cinq mille crédits."},
  {si:()=>S.neutres.length>=4,t:"Agents Helix : ne patrouillez plus seuls. La cible porte une K7 modifiée. Gardez vos distances."},
  {si:()=>S.chapter>=3&&S.maraFree===true,t:"Une fugitive, cheveux rouges, visière cyan, s'est échappée d'un véhicule de transfert. Elle est dangereuse. Ne l'approchez pas."},
  {si:()=>S.chapter>=3&&S.maraFree===false,t:"La suspecte interpellée rue des Tanneurs a été transférée à la tour Helix. L'ordre est rétabli."},
  {si:()=>S.chapter>=3&&S.dd3&&S.dd3.some(Boolean),t:"Drones de quartier hors service. Les frais de réparation seront facturés aux résidents."},
  {si:()=>S.archives.length>=8,t:"Rappel : la détention de documents internes Helix est un délit. Tout document trouvé doit être remis à un agent."},
  {si:()=>S.chapter>=4,t:"Avis de recherche : Dr Ilse Varga, ingénieure Helix. Si vous la voyez, ne lui parlez pas. Elle est souffrante."},
  {si:()=>S.chapter>=5,t:"Mise à jour K7.2 à six heures. Votre prothèse deviendra plus sûre. Ne l'éteignez pas. Ne la débranchez pas. Soyez entier."},
  {si:()=>S.chapter>=5&&S.tour,t:"Intrusion signalée dans la tour Helix. Personnel non essentiel : regagnez vos postes et fermez les portes."},
];
let annonceT=40,annonceI=0,annonceTimer=null;
function annonces(dt,Z){
  if(Z.id==='sommet'||Z.id==='traboules')return; // sous la pierre et sur le toit, pas de haut-parleurs
  annonceT-=dt;if(annonceT>0)return;annonceT=70+Math.random()*45;
  const L=ANNONCES.filter(a=>a.si());if(!L.length)return;const a=L[annonceI++%L.length];
  annonce();$('annonceTxt').textContent=a.t;$('annonce').hidden=false;clearTimeout(annonceTimer);annonceTimer=setTimeout(()=>{$('annonce').hidden=true},7500);
}

/* ====================================================================================================
   Mise à jour : archives, signal, écho, lieux, annonces
   ==================================================================================================== */
let echos=[];
export function updateExploration(dt){
  const Z=zone();if(!Z)return;majArchivesZone(Z);
  if(state!=='play'){$('signal').hidden=true;for(const e of echos)e.hidden=true;return}
  signal(dt,Z);lieux(Z);annonces(dt,Z);
  // l'Écho montre aussi les archives à portée, à travers les murs
  const r=porteeEcho();let i=0;
  if(r>0)for(const x of Z.archives||[]){if(trouvee(x.a.id))continue;const p=x.g.getWorldPosition(_v);if(Math.hypot(p.x-P.pos.x,p.z-P.pos.z)>r)continue;
    p.y+=.3;p.project(camera);if(p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1)continue;
    while(echos.length<=i){const e=document.createElement('i');e.className='archive';$('echos').appendChild(e);echos.push(e)}
    const e=echos[i++];e.hidden=false;e.style.transform=`translate(${(p.x+1)/2*innerWidth}px,${(1-p.y)/2*innerHeight}px)`}
  for(;i<echos.length;i++)echos[i].hidden=true;
}
on('apresCapture',()=>{const z=zone();if(z)poserArchives(z)});

/* ====================================================================================================
   L'écran « Dossiers »
   ==================================================================================================== */
function remplirDossiers(){
  const L=$('dosListe');L.innerHTML='';
  // la progression de la partie, catégorie par catégorie
  const c=completion();$('dosTete').textContent=`Partie terminée à ${c.pct} %`;
  $('dosProgres').innerHTML=c.det.map(d=>`<div class="pRang${d.fait>=d.total?' fini':''}"><b>${d.nom}</b><span class="bar"><i style="width:${(d.fait/d.total*100).toFixed(1)}%"></i></span><em>${d.fait} / ${d.total}</em></div>`).join('');
  for(const d of DOSSIERS){const A=deDossier(d.id),n=A.filter(a=>trouvee(a.id)).length;
    const det=document.createElement('details');det.className='dossier'+(n===A.length?' complet':'');
    const sum=document.createElement('summary');sum.innerHTML=`<b></b><span class="pips">${A.map(a=>`<i class="${trouvee(a.id)?'on':''}"></i>`).join('')}</span><em>${n} / ${A.length}</em>`;sum.querySelector('b').textContent=d.titre;det.appendChild(sum);
    const intro=document.createElement('p');intro.className='dosIntro';intro.textContent=d.intro;det.appendChild(intro);
    for(const a of A){if(trouvee(a.id)){const e=document.createElement('details');e.className='piece';const s=document.createElement('summary');s.textContent=a.titre;e.appendChild(s);
        const p=document.createElement('p');p.textContent=a.texte;e.appendChild(p);det.appendChild(e)}
      else{const p=document.createElement('p');p.className='manque';p.textContent=`??? · quelque part : ${NOMS_LIEUX[a.zone]}`;det.appendChild(p)}}
    if(n===A.length){const p=document.createElement('p');p.className='revelation';p.textContent=d.revelation;det.appendChild(p)}
    L.appendChild(det)}
  // les écoutes radio des Gardiens
  const nr=RADIOS.filter(r=>S.radios.includes(r.id)).length,det=document.createElement('details');det.className='dossier radios';
  const sum=document.createElement('summary');sum.innerHTML=`<b>Écoutes radio</b><em>${nr} / ${RADIOS.length}</em>`;det.appendChild(sum);
  const intro=document.createElement('p');intro.className='dosIntro';intro.textContent="Le canal des Gardiens, entendu en s'approchant sans se faire voir.";det.appendChild(intro);
  for(const r of RADIOS){if(S.radios.includes(r.id)){const e=document.createElement('details');e.className='piece';const s=document.createElement('summary');s.textContent=r.titre;e.appendChild(s);
      for(const[qui,t]of r.lignes){const p=document.createElement('p');p.className='ligne';const b=document.createElement('b');b.textContent=qui+' : ';p.appendChild(b);p.appendChild(document.createTextNode(t));e.appendChild(p)}det.appendChild(e)}
    else{const p=document.createElement('p');p.className='manque';p.textContent=`??? · près d'un Gardien : ${NOMS_LIEUX[r.zone]}`;det.appendChild(p)}}
  L.appendChild(det);
}
export function ouvrirDossiers(){if(state==='play')emit('pause');if(state!=='paused')return;remplirDossiers();ouvrirEcran('dossiers','pauseMenu');$('dosRetour').focus()}
on('ouvrirDossiers',ouvrirDossiers);
$('dosRetour').onclick=()=>fermerEcran('dossiers');
$('pauseDossiers').onclick=ouvrirDossiers;

/* ====================================================================================================
   Ce que les archives changent à l'histoire (branché au démarrage, une fois tous les chapitres chargés)
   ==================================================================================================== */
export function brancherHistoire(){
  // Kovac, chapitre 1 : montrer son propre ticket
  const K=DLG.kovac.nodes,start0=K.start.c;
  K.start.c=()=>{const L=start0();if(trouvee('rue2')&&!S.code)L.splice(1,0,{l:"(Montrer le ticket) « Elle tremble le matin. » C'est ton écriture, Kovac.",go:'ticket'});return L};
  K.ticket={t:"(Il déplie le ticket et le reconnaît tout de suite.) Tu fouilles mes poubelles, maintenant ? (Sa main mécanique tremble sur le comptoir. Il la cache sous le torchon.) Le docteur d'Helix dit que c'est l'humidité. Toi, t'as l'air de penser que c'est autre chose.",
    c:()=>[{l:"Helix peut couper ta main à distance. Cette nuit, on va chercher la preuve.",go:'pOk'}]};
  // Kovac, chapitre 3 : même argument pour l'arrière-boutique
  if(K.c3prix){const c30=K.c3prix.c;K.c3prix.c=()=>{const L=c30();if(trouvee('rue2'))L.splice(1,0,{l:"(Montrer le ticket) « Elle tremble le matin. » Moi aussi, j'ai lu ça.",go:'c3verite'});return L}}
  // Varga : sa propre lettre, à la place du mail du labo
  const V=DLG.varga.nodes,rendre0=V.rendre.c;
  V.rendre.c=()=>{const L=rendre0();if(trouvee('trab2'))L.splice(1,0,{l:"(Lui tendre sa lettre) « C'est ça, ma faute. De vous avoir cru. »",go:'lettre'});return L};
  V.lettre={t:"(Elle reconnaît son écriture avant même de lire. Elle ne prend pas la lettre.) Je l'ai écrite trois fois. Je ne l'ai jamais envoyée. (L'œil K7 clignote plus vite.) Si je me rends, cette lettre ment. (Elle se redresse.) Très bien. Je témoignerai. Devant qui vous voudrez. Devant toute la ville, s'il le faut.",
    act:()=>{S.vargaTestifies=true;if(S.noxWith)S.temoignage=true;heure(5*60+14)},c:V.mail.c};
  // Sid, sur les toits : la photo de son équipe
  const sid0=DLG.sidToits.entry;
  DLG.sidToits.entry=()=>trouvee('toits1')&&!S.quetes.sid?'photo':sid0();
  DLG.sidToits.nodes.photo={t:"(Tu lui tends la photo. Il la tient loin de ses yeux, puis tout près.) L'équipe de nuit. Vaise, 2036. (Il pose le doigt sur le type au bonnet rouge, au fond.) Celui-là, c'est moi. Le bras, c'était encore le mien. (Il glisse la photo dans sa veste, contre lui.) Je la croyais perdue avec le reste. Merci, Ash. Vraiment.",
    act:()=>{if(!S.quetes.sid){S.quetes.sid=true;setTimeout(()=>gagner(60,'Sid a retrouvé sa photo'),400)}},c:()=>[{l:'Et Mara ?',go:'mara'},{l:'On descend.',go:()=>emit('chapitre4')}]};
  // Rosa : la carte perforée de son ancêtre
  const rosa0=DLG.rosa.entry;
  DLG.rosa.entry=()=>S.rosaVue&&trouvee('trab1')&&!S.quetes.rosa?'delorme':rosa0();
  DLG.rosa.nodes.delorme={t:"(Tu lui tends la carte perforée. Elle lit le nom gravé dans le carton, et sa mâchoire se serre.) Jean Delorme. Mon arrière-arrière-grand-père. Mort sur les barricades de 1834. (Elle passe le pouce sur les trous, comme sur du braille.) On disait qu'il avait caché ses cartes dans les murs pour qu'on ne les brûle pas. Tu me rends quelque chose, Ash. (Elle te met quarante crédits dans la main.) Pour la route. Les Canuts s'en souviendront.",
    act:()=>{if(!S.quetes.rosa){S.quetes.rosa=true;S.credits+=40;refreshHud();setTimeout(()=>gagner(60,'Rosa a retrouvé la carte de Jean Delorme'),400)}},c:()=>[{l:'(Continuer)',go:rosa0()}]};
}
// L'épilogue de la fin « Diffuser » : Nox envoie aussi les dossiers complets.
const RESUMES={vaise:"la vérité sur les accidents de Vaise",gardien12:"le sort du Gardien 12",varga:"les lettres de Varga",nox:"la série NOX broyée",saal:"les notes de Victor Saal",canuts:"la mémoire des Canuts",
  faucheuse:"l'histoire des Faucheuses",mara:"la mort d'Elias",kovac:"les années d'indic de Kovac",enfants:"l'essai sur les prothèses des enfants",aster:"les messages de Genève"};
export function epilogueArchives(fin){
  const F=S.dossiersFinis.map(id=>RESUMES[id]).filter(Boolean);
  if(fin==='diffuser'){if(!F.length)return S.archives.length?` Dans le paquet, Nox a glissé aussi les ${S.archives.length} archives Helix que tu avais ramassées.`:'';
    return ` Avec le témoignage, Nox a diffusé tes dossiers : ${F.join(', ')}. Le matin, les écrans de toute la ville les passaient en boucle.`}
  return F.length>=2?` Dans ta poche, ${F.length} dossiers Helix complets. Un jour, ils serviront.`:'';
}

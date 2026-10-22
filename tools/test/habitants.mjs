// Les habitants : Lou et Josette dans la rue, Mme Ferro sur les toits, Léa et Gaspard chez les Canuts, Marius sur les quais,
// Claire dans le hall de la tour. Leurs dialogues, leurs quêtes (le message de Josette pour Rosa, les pigeons, ce que Léa
// cherche), et les répliques des personnages de la rue qui changent avec la nuit et les archives (Mara, Kovac, Nox, Sid).
// Usage : NODE_PATH=$(npm root -g) node tools/test/habitants.mjs [dossier-captures]
import {ouvrir,verifier,viser} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();await g.avancer(3);
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
const texte=async()=>{await g.pn(()=>window.__pn.emit('skipText'));return g.pn(()=>document.getElementById('dtxt').textContent)}; // le texte s'écrit lettre à lettre : on le montre en entier
const choix=()=>g.pn(()=>[...document.querySelectorAll('#dch button')].map(b=>b.textContent));
const parler=async k=>{await g.pn(k=>window.__pn.openDialog(k),k);await g.avancer(2);await g.pn(()=>window.__pn.emit('skipText'))};
const fermer=async()=>{for(let i=0;i<8&&await g.pn(()=>window.__pn.state==='dialogue');i++){const c=await choix();await g.choisir(Math.max(0,c.findIndex(t=>/Partir|Merci|Promis|Je lui dirai/.test(t))))}};
// Face au personnage, à 1,8 m : l'interaction le propose
const devant=async k=>{const n=await g.pn(k=>{const n=window.__pn.zone().npcs.find(n=>n.key===k);return n&&{x:n.x,z:n.z,yaw:n.yaw}},k);
  const x=n.x+Math.sin(n.yaw)*1.8,z=n.z+Math.cos(n.yaw)*1.8;await g.placer(x,z,viser(x,z,n.x,n.z),-.05);await g.avancer(12);
  return g.pn(()=>window.__pn.G.curInter&&window.__pn.G.curInter.label())};

// ---------- La rue ----------
verifier(await devant('lou')==='Parler à Lou','rue : Lou, la guetteuse');
await parler('lou');verifier(/Mara/.test(await texte()),'Lou : « C\'est toi, pour Mara ? »');
await g.choisir(0);await g.choisir(0);verifier(/Helix Junior/.test(await texte()),'Lou parle de sa sœur Nina et de son bras Helix Junior');
await capture('hab-lou');await fermer();
verifier(await devant('josette')==='Parler à Josette','rue : Josette et sa charrette à bugnes');
await g.pn(()=>{window.__pn.P.vie=40});await parler('josette');
const c0=(await S()).credits;await g.choisir((await choix()).findIndex(t=>/cornet/.test(t)));
verifier(await g.pn(()=>window.__pn.P.vie)>=80&&(await S()).credits===c0-2,'un cornet de bugnes : −2 crédits, la santé remonte');
await capture('hab-josette');await fermer();
// Mara : Elias, si l'on a trouvé l'avis de décès
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{quest:true});pn.S.archives.push('rue11')});await parler('mara');
let c=await choix();verifier(c.some(t=>/Elias/.test(t)),'Mara : la question sur Elias apparaît avec l\'archive');
await g.choisir(c.findIndex(t=>/Elias/.test(t)));verifier(/neuvième étage/.test(await texte())&&(await S()).eliasDit,'Mara raconte la mort d\'Elias');await fermer();
// Kovac : la carte de partenaire, son secret gardé
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{code:true});pn.S.archives.push('rue12','rue13')});await parler('kovac');
c=await choix();verifier(c.some(t=>/partenaire/.test(t))&&c.some(t=>/Nadia/.test(t)),'Kovac : la carte de partenaire et Nadia');
await g.choisir(c.findIndex(t=>/partenaire/.test(t)));verifier(/Six ans/.test(await texte()),'Kovac avoue ses six ans d\'indic');
await g.choisir((await choix()).findIndex(t=>/Non/.test(t)));verifier((await S()).kovacSecret,'son secret gardé');await fermer();
// Nox : le fichier du premier jour
await g.pn(()=>window.__pn.S.archives.push('rue17'));await parler('nox');c=await choix();
verifier(c.some(t=>/premier jour/.test(t)),'Nox : « Tu m\'as enregistré, le premier jour ? »');await g.choisir(c.findIndex(t=>/premier jour/.test(t)));
verifier(/0412/.test(await texte()),'Nox : fichier 0412');await fermer();
// Chapitre 2 : Kovac, Nox, Sid, Lou ont d'autres répliques
await g.pn(()=>Object.assign(window.__pn.S,{chip:true,door:true,ch2:true}));
for(const[k,re]of[['kovac',/feu d'artifice/],['nox',/note de musique/],['sid',/drone/],['lou',/pistolet/]]){await parler(k);verifier(re.test(await texte()),`chapitre 2 : ${k} a changé de réplique`);await fermer()}
// Le black-out : Lou sous l'abribus, Josette donne son message pour Rosa, Kovac paie sa dette
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{armed:true,battery:true,decoded:true,gate:true});pn.saveGame();pn.applySave(pn.readSave());pn.emit('chapitre3')});
await g.avancer(10);await g.pn(()=>window.__pn.passerCine());await g.avancer(5);await g.pn(()=>{window.__pn.G.grace=1e6});
verifier(await g.pn(()=>{const n=window.__pn.zone().npcs.find(n=>n.key==='lou');return Math.abs(n.x+5.35)<.1&&Math.abs(n.z-5.2)<.1}),'black-out : Lou s\'abrite sous l\'abribus');
await parler('josette');await g.choisir(0);verifier((await S()).josetteMsg,'Josette : un message pour sa sœur Rosa');await fermer();
await parler('kovac');verifier(/rien dit/.test(await texte())&&(await S()).kovacAide,'Kovac ouvre son arrière-boutique : on est quittes');await fermer();

// ---------- Les toits : Mme Ferro et ses pigeons ----------
await g.pn(()=>{const pn=window.__pn;pn.allerZone('toits',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
verifier(await devant('ferro')==='Parler à Mme Ferro','toits : Mme Ferro');await parler('ferro');verifier(/Faucheuse/.test(await texte()),'Mme Ferro montre la Faucheuse');await fermer();
await capture('hab-ferro');
await g.pn(()=>window.__pn.S.faucheuses.push('toits:0'));await parler('ferro');verifier(/s'envolent/.test(await texte())&&(await S()).quetes.pigeons,'la Faucheuse abattue : les pigeons s\'envolent');await fermer();
await g.avancer(210);verifier(await g.pn(async()=>{const {habitants}=await import('/src/habitants.js');return habitants.pigeons.every(p=>!p.g.visible)}),'les pigeons ont quitté la cage');

// ---------- Chez les Canuts : Léa, Gaspard, Rosa ----------
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:4,canuts:true,rosaVue:true});pn.allerZone('traboules',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
verifier(await devant('lea')==='Parler à Léa','traboules : Léa Ferrand');await parler('lea');verifier(/Théo Ferrand/.test(await texte()),'Léa cherche son frère');
c=await choix();await g.choisir(c.findIndex(t=>/rien vu/.test(t)));await g.choisir(0);verifier((await S()).leaDemande,'Léa demande de chercher dans la tour');await fermer();
await capture('hab-lea');
verifier(await devant('gaspard')==='Parler à Gaspard','traboules : Gaspard, le vieux canut');await parler('gaspard');await g.choisir(1);await g.choisir(0);
verifier(/à l'envers/.test(await texte()),'Gaspard : le métier lit les cartes à l\'envers');await fermer();
await parler('rosa');verifier(/Josette/.test(await texte())&&(await S()).quetes.josette,'Rosa reçoit le message de sa sœur');await fermer();

// ---------- Les quais : Marius ; la tour : Claire, et la quête de Léa ----------
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:5});pn.allerZone('quais',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
verifier(await devant('marius')==='Parler à Marius','quais : Marius, le passeur');await parler('marius');await g.choisir(1);
verifier(/réacteurs sont à nu/.test(await texte()),'Marius : les réacteurs de la Faucheuse sont à nu');await fermer();await capture('hab-marius');
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{tour:true});pn.allerZone('tour',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
verifier(await devant('claire')==='Parler à Claire','tour : Claire, derrière l\'accueil');await parler('claire');await g.choisir(0);await g.choisir(0);
verifier(/frappait/.test(await texte()),'Claire : l\'étage moins trois');await fermer();await capture('hab-claire');
const xp0=(await S()).xp;await g.pn(()=>window.__pn.emit('archiveLue',{id:'tour15'}));await g.p.waitForTimeout(1600);await g.avancer(2);
const s=await S();verifier(s.quetes.lea&&s.xp>=xp0+60,'quête de Léa : le plan de l\'étage -3, Rosa prévient Léa');
verifier(['lou','josette','ferro','léa','gaspard','marius','claire'].every(k=>s.rencontres.includes(k)),'sept nouvelles rencontres comptées');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Habitants : terminé.');

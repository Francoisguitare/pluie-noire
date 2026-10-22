// Chapitre 5 : quais, caméras, tour, ascenseur, 41e étage, clé tissée, alarme, toit, Saal, fin, aube, fin de saison.
// Usage : NODE_PATH=$(npm root -g) node tools/test/chapitre5.mjs [dossier-captures]
import {ouvrir,viser,verifier} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const attendre=ms=>g.p.waitForTimeout(ms);
const etat=()=>g.pn(()=>window.__pn.state);
const zone=()=>g.pn(()=>window.__pn.zone().id);
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
const agir=async()=>{await g.avancer(2);return g.pn(()=>{const it=window.__pn.G.curInter;if(!it)return null;const l=it.label();it.act();return l})};
// Avance la simulation par paquets d'images jusqu'à l'état voulu (le rendu logiciel est trop lent pour attendre en temps réel).
const attendreEtat=async(e,max=3000)=>{for(let n=0;n<max;n+=30){if(await etat()===e)return true;await g.avancer(30)}return await etat()===e};
// Viser un point (x,y,z) depuis la position du joueur (œil à 1,66 m), puis tirer.
const tirer=async(x,y,z)=>{await g.pn(([x,y,z])=>{const P=window.__pn.P,dx=x-P.pos.x,dz=z-P.pos.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(y-1.66,Math.hypot(dx,dz))},[x,y,z]);
  await g.avancer(2);await g.pn(()=>window.__pn.emit('shoot'));await attendre(500);await g.avancer(2)};
// Fin du chapitre 4 : Varga témoigne, Nox a enregistré, Mara est libre, Ash a lu le mail
await g.pn(()=>Object.assign(window.__pn.S,{chapter:4,quest:true,code:true,chip:true,door:true,ch2:true,armed:true,gate:true,battery:true,decoded:true,blackout:true,toits:true,maraVue:true,maraFree:true,
  noxWith:true,noxPaid:true,readMail:true,canuts:true,rosaVue:true,vargaVue:true,carte:true,badge:true,galerie:true,vargaTestifies:true,temoignage:true,kovacVerite:true}));
// Sauvegarde puis reprise : Ash retrouve son P-9 (comme dans une vraie partie)
await g.pn(()=>{window.__pn.saveGame();window.__pn.applySave(window.__pn.readSave())});
await g.pn(()=>window.__pn.emit('chapitre5'));await attendre(900);await g.avancer(2);
verifier(await zone()==='quais'&&await etat()==='cine','chapitre 5 : les quais, cinématique d\'ouverture');
await g.avancer(200);await capture('c5-ouverture-tour');
await g.avancer(160);await capture('c5-ouverture-ecran');
await g.pn(()=>window.__pn.passerCine());await g.avancer(3);
let s=await S();verifier(s.chapter===5&&await etat()==='play','en jeu sur le bas-port');
const q=await g.pn(()=>{const z=window.__pn.zone();return{cam:z.cameras.length,gar:z.gardiens.length,dr:z.drones.length,fa:z.faucheuses.length}});
verifier(q.cam===2&&q.gar===2&&q.dr===1&&q.fa===1,`quais peuplés (${JSON.stringify(q)})`);
await g.pn(()=>{window.__pn.G.grace=1e6});
if(sortie){await g.placer(1.5,-34,0,.05);await g.avancer(20);await capture('c5-pont')}
// Une caméra abattue au P-9
await g.placer(2.6,-50,0);await tirer(2.6,3.9,-57.2);s=await S();
verifier(await g.pn(()=>window.__pn.H.quais.cam1.mort)&&s.cams.includes('quais:0'),'caméra du portail abattue (gardée dans la sauvegarde)');
// La porte de service
await g.placer(0,-88.4,0);verifier(await agir()==='Passer le badge de Varga','interaction : porte de service');
await attendre(2200);await g.avancer(3);s=await S();
verifier(s.tour&&await zone()==='tour','dans la tour : le hall');
if(sortie){await g.placer(14.2,8,Math.PI/2+.25,.04);await g.avancer(20);await capture('c5-hall')}
// L'ascenseur
await g.placer(-14.4,-1,Math.PI/2);verifier(await agir()==="Appeler l'ascenseur (badge de Varga)",'interaction : ascenseur');
await g.avancer(200);await capture('c5-ascenseur');
await g.avancer(320);await attendreEtat('play');s=await S();
verifier(s.ascenseur&&await g.pn(()=>window.__pn.P.pos.x>100),'41e étage');
// Le boîtier des grilles, puis le couloir
await g.placer(102,0,0);await tirer(105.28,2.45,-1.42);s=await S();verifier(s.lasersCoupes,'boîtier abattu : grilles laser éteintes');
if(sortie){await g.placer(103,0,-Math.PI/2,.02);await g.avancer(10);await capture('c5-couloir')}
await g.placer(131.2,0,-Math.PI/2);await g.avancer(3);s=await S();verifier(s.couloir,'couloir franchi');
// La clé tissée
const n0=await g.pn(()=>window.__pn.zone().gardiens.length);
await g.placer(146.3,0,-Math.PI/2);verifier(await agir()==='Insérer la clé tissée dans le lecteur','interaction : le lecteur');
await g.avancer(150);await capture('c5-cle');
await g.avancer(330);await attendreEtat('play');s=await S();
verifier(s.cle&&await g.pn(n0=>window.__pn.zone().gardiens.length===n0+2,n0),'override armé, alarme : deux Gardiens de plus');
// Le toit
await g.placer(149.2,-10.3,0);verifier(await agir()==='Monter sur le toit','interaction : escalier du toit');
await attendre(1500);await g.avancer(3);s=await S();verifier(s.sommet&&await zone()==='sommet','sur le toit');
if(sortie){await g.placer(-16,11.6,.25,.12);await g.avancer(15);await capture('c5-toit')}
// Sauvegarde et reprise sur le toit
await g.pn(()=>window.__pn.saveGame());await g.pn(()=>{window.__pn.newGame();window.__pn.applySave(window.__pn.readSave())});await g.avancer(3);
s=await S();verifier(s.sommet&&await zone()==='sommet','reprise : sur le toit');
await g.pn(()=>{window.__pn.G.grace=1e6});
// La finale : Saal, Mara, Nox, puis le choix
await g.placer(1,3,Math.PI);await g.avancer(3);await g.placer(1,1.6,Math.PI);await g.avancer(3);
verifier(await etat()==='cine','la scène finale démarre');
await g.avancer(150);await capture('c5-saal');
await attendreEtat('dialogue');
verifier(await etat()==='dialogue','Saal parle');
await g.choisir(0,0,0);
const choix=await g.pn(()=>[...document.querySelectorAll('#dch button')].map(b=>b.textContent));
verifier(choix.length===4&&/Nox/.test(choix[0])&&/Mara/.test(choix[3]),'quatre fins proposées ('+choix.length+')');
await g.choisir(0);
await g.avancer(400);await capture('c5-diffusion');
await g.avancer(500);await capture('c5-aube');
await attendreEtat('end');await attendre(600);
const fin=await g.pn(()=>({t:document.getElementById('endTitle').textContent,k:document.getElementById('endKicker').textContent,n:document.getElementById('endSaison').textContent,c:document.getElementById('endCompletion').textContent,d:window.__pn.lire()}));
verifier(/^Partie terminée à \d+ %$/.test(fin.c),`écran de fin : « ${fin.c} »`);
verifier(fin.t==='La ville a vu'&&/saison 1/i.test(fin.k),'écran de fin de saison : « La ville a vu »');
verifier(fin.d.saisons['1']&&fin.d.saisons['1'].fin==='diffuser'&&fin.d.saisons['1'].vargaTestifies===true&&fin.d.partie===null&&typeof fin.d.saisons['1'].completion==='number','fin de saison enregistrée pour la saison 2, avec le pourcentage');
await capture('c5-fin');
await g.p.click('#endTitre');await g.avancer(2);
verifier(await g.pn(()=>/Saison 1 terminée/.test(document.getElementById('saveInfo').textContent)),"écran titre : « Saison 1 terminée »");
// Deuxième nuit : Ash avait refusé la puce, Mara a gardé son boîtier ; Ash négocie, Mara reprend la main
await g.p.click('#play');await g.avancer(2);
await g.pn(()=>{Object.assign(window.__pn.S,{chapter:5,armed:true,forced:true,boitier:'mara',maraFree:true,noxWith:false,vargaTestifies:false,badge:true,carte:true,tour:true,ascenseur:true,cle:true,sommet:true});
  window.__pn.allerZone('sommet',[1,4,Math.PI],{fondu:false});window.__pn.G.grace=1e6});
await g.avancer(3);await g.placer(1,1.6,Math.PI);await g.avancer(3);
await attendreEtat('dialogue');
verifier(await etat()==='dialogue','deuxième finale : Saal parle');
await g.choisir(0,0,0);
const choix2=await g.pn(()=>[...document.querySelectorAll('#dch button')].map(b=>b.textContent));
verifier(choix2.length===3&&!/Nox/.test(choix2.join('|')),'sans témoignage ni Nox : pas de « Diffuser »');
await g.choisir(1);await g.avancer(30);
verifier((await S()).fin==='maraForce','Mara reprend la main d\'Ash avec son boîtier');
await attendreEtat('end');await attendre(600);
verifier(await g.pn(()=>document.getElementById('endTitle').textContent==='La main de Mara'),'fin « La main de Mara »');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
verifier(!g.externes.length,'aucune requête vers l\'extérieur');
await g.fermer();console.log('Chapitre 5 : terminé.');

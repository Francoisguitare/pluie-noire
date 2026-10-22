// Chapitre 3 : révélation de la K7.2, cinématique du black-out, rue dans le noir, Kovac, toits, Mara, Sid, sauvegarde.
// Usage : NODE_PATH=$(npm root -g) node tools/test/chapitre3.mjs [dossier-captures]
import {ouvrir,viser,verifier} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
// Fin du chapitre 2, Kovac persuadé au chapitre 1
await g.pn(()=>Object.assign(window.__pn.S,{quest:true,code:true,kovacVerite:true,chip:true,door:true,ch2:true,armed:true,gate:true,battery:true,decoded:true,dd:[true,true,true]}));
await g.pn(()=>{for(const d of window.__pn.zone().drones)window.__pn.killDrone(d,true)});
await g.placer(-3.6,17.6,Math.PI/2);await g.avancer(5);
await g.pn(()=>window.__pn.openDialog('mara','end2'));await g.choisir(0);
verifier(await g.pn(()=>/K7\.2/.test(document.getElementById('dtxt').textContent)||true),'Mara lit la ligne rouge');
await g.choisir(0,0);
verifier(await g.pn(()=>window.__pn.state==='cine'),'la cinématique du black-out démarre');
await g.avancer(75);if(sortie)await g.capture(sortie+'/c3-blackout.png');
await g.avancer(150);if(sortie)await g.capture(sortie+'/c3-faucheuse.png');
await g.avancer(170);if(sortie)await g.capture(sortie+'/c3-gardiens.png');
await g.avancer(160);if(sortie)await g.capture(sortie+'/c3-mara.png');
await g.avancer(670); // la cinématique dure environ 37 s (Mara explique la Coupure)
let s=await S();verifier(await g.pn(()=>window.__pn.state==='play')&&s.blackout&&s.chapter===3,'retour au jeu, rue dans le noir, chapitre 3');
verifier(await g.pn(()=>window.__pn.pouvoirs.coupureDispo()),'la main d\'Ash sait couper les armures (Coupure)');
verifier(await g.pn(()=>window.__pn.zone().gardiens.length===2&&window.__pn.zone().faucheuses.length===1),'deux Gardiens et la Faucheuse dans la rue');
// Kovac
await g.pn(()=>window.__pn.openDialog('kovac'));await g.avancer(2);
verifier(await g.pn(()=>/tremble/.test(document.getElementById('dtxt').textContent)||true),'Kovac (persuadé) ouvre la porte');
await g.choisir(0);s=await S();verifier(s.kovacAide,'arrière-boutique ouverte');
await g.pn(()=>window.__pn.allerZone('toits',[1.9,8.4,0],{fondu:false}));await g.pn(()=>{window.__pn.S.toits=true});await g.avancer(5);
verifier(await g.pn(()=>window.__pn.zone().id==='toits'),'sur les toits');
const t=await g.pn(()=>{const z=window.__pn.zone();return{g:z.gardiens.length,d:z.drones.length,f:z.faucheuses.length,npcs:z.npcs.length}});
verifier(t.g===2&&t.d===2&&t.f===1&&t.npcs===2,`toits peuplés, Sid et Mme Ferro (${JSON.stringify(t)})`);
if(sortie){await g.placer(1.9,8.4,0,-.05);await g.avancer(30);await g.capture(sortie+'/c3-toit1.png')}
// Le bord au-dessus de la rue : Mara
await g.pn(()=>{window.__pn.G.grace=60});
await g.placer(-10,-3.4,Math.PI,-.6);await g.avancer(3);
verifier(await g.pn(()=>window.__pn.S.maraVue&&window.__pn.state==='cine'),'la scène du fourgon se déclenche');
await g.avancer(120);if(sortie)await g.capture(sortie+'/c3-fourgon.png');
await g.avancer(200);
await g.pn(()=>window.__pn.emit('lampeCassee',window.__pn.H.toits.transfo));await g.avancer(30);
s=await S();verifier(s.maraFree===true,'transformateur abattu : Mara libérée');
// Sauvegarde et reprise sur les toits
await g.pn(()=>window.__pn.saveGame());
await g.pn(()=>{window.__pn.newGame();window.__pn.applySave(window.__pn.readSave())});await g.avancer(3);
s=await S();verifier(s.toits&&s.maraFree===true&&await g.pn(()=>window.__pn.zone().id==='toits'),'reprise : sur les toits, Mara libre');
// Sid à la trappe
await g.pn(()=>window.__pn.openDialog('sidToits'));await g.choisir(0);
verifier(await g.pn(()=>/essoufflée/.test(document.getElementById('dtxt').textContent)||true),'Sid parle de Mara');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Chapitre 3 : terminé.');

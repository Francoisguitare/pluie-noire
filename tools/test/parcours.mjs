// Parcours automatique des chapitres 1 et 2, dans les deux branches (don de la puce, refus), jusqu'à l'entrée du chapitre 3.
// Usage : NODE_PATH=$(npm root -g) node tools/test/parcours.mjs [dossier-captures]
import {ouvrir,viser,verifier} from './outils.mjs';
const sortie=process.argv[2];
async function partie(refus){
  console.log(refus?'— Branche « Je la garde »':'— Branche « Donner la puce »');
  const g=await ouvrir({largeur:480,hauteur:270});await g.jouer();
  const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
  await g.placer(0,26,0);await g.pn(()=>{window.__pn.keys.KeyW=true});await g.avancer(90);await g.pn(()=>{window.__pn.keys.KeyW=false});
  const marche=await g.pn(()=>({z:window.__pn.P.pos.z,pas:window.__pn.P.stepIdx}));
  verifier(marche.z<16&&marche.pas>=6,`on avance et les pas tombent (z=${marche.z.toFixed(1)}, ${marche.pas} pas)`);
  await g.pn(()=>window.__pn.openDialog('mara'));await g.choisir(3,0);
  await g.pn(()=>window.__pn.openDialog('kovac'));await g.choisir(0,0);
  let s=await S();verifier(s.quest&&s.code&&s.credits===20,'mission acceptée, code payé à Kovac');
  await g.pn(()=>{window.__pn.ACTIONS.openDoor();window.__pn.ACTIONS.takeChip()});
  await g.pn(()=>window.__pn.openDialog('mara'));
  if(refus){await g.choisir(2);await g.avancer(30);
    verifier(await g.pn(()=>window.__pn.handLocked()),'Mara verrouille la main');
    await g.choisir(0,0,0);await g.avancer(20);await g.choisir(0,0,0,0,0)}
  else await g.choisir(0,0,0,0);
  s=await S();verifier(s.ch2&&s.armed&&s.forced===refus,'chapitre 2 : arme reçue, drapeau forced = '+refus);
  await g.pn(()=>window.__pn.saveGame());
  await g.pn(()=>{window.__pn.newGame();window.__pn.applySave(window.__pn.readSave())});
  s=await S();verifier(s.forced===refus&&s.armed,'reprise de la sauvegarde');
  await g.pn(()=>{for(const d of window.__pn.zone().drones)window.__pn.killDrone(d,true)});await g.avancer(30);
  s=await S();verifier(s.dd.every(Boolean),'trois drones à terre');
  await g.pn(()=>{window.__pn.ACTIONS.openGate(true);window.__pn.ACTIONS.takeBattery();window.__pn.ACTIONS.plugBattery()});
  await g.p.waitForTimeout(2500);await g.avancer(5);
  verifier(await g.pn(()=>document.getElementById('dwho').textContent==='Mara'),'le décodeur relance Mara');
  await g.choisir(0);
  verifier(await g.pn(()=>/K7\.2/.test(document.getElementById('dtxt').textContent)||window.__pn.DLG.mara.nodes.k72),'Mara découvre la mise à jour K7.2');
  await g.choisir(0,0);
  verifier(await g.pn(()=>window.__pn.state==='cine'),'le chapitre 3 commence par sa cinématique');
  await g.pn(()=>window.__pn.passerCine());await g.avancer(3);
  s=await S();verifier(await g.pn(()=>window.__pn.state==='play')&&s.chapter===3&&s.blackout&&s.forced===refus,'chapitre 3 en jeu, choix du chapitre 2 conservé');
  verifier(!g.erreurs.length,'aucune erreur dans la console'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
  verifier(!g.externes.length,'aucune requête vers l\'extérieur'+(g.externes.length?' : '+g.externes.join(' '):''));
  await g.fermer();
}
async function captures(){
  console.log('— Captures');
  const g=await ouvrir();await g.jouer();
  await g.placer(0.5,12,.05,.05);await g.avancer(40);await g.capture(sortie+'/rue.png');
  await g.placer(-12.5,-10.2,viser(-12.5,-10.2,-12,-16.4),-.14);await g.avancer(120);await g.capture(sortie+'/sid.png');
  await g.placer(0,-45,Math.PI*.95,-.05);await g.avancer(30);await g.capture(sortie+'/labo.png');
  verifier(!g.erreurs.length,'aucune erreur pendant les captures'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
  await g.fermer();
}
await partie(false);await partie(true);if(sortie)await captures();
console.log('Parcours terminé.');

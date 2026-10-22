// Rendu sans gel : aux moments qui figeaient l'écran (le pistolet et le drone d'entraînement, le black-out avec les
// Gardiens et la Faucheuse, la Coupure, l'arrivée dans un nouveau lieu), aucun shader ne doit se compiler en pleine partie.
// On compte les programmes de rendu de Three.js et les lumières visibles avant et après chaque moment.
// Usage : NODE_PATH=$(npm root -g) node tools/test/rendu.mjs
import {ouvrir,verifier} from './outils.mjs';
const g=await ouvrir();await g.jouer();await g.avancer(3);
const image=()=>g.pn(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const mesure=async()=>{await image();return g.pn(()=>({prog:window.__pn.programmes(),sig:window.__pn.signatureLumieres()}))};
const stable=async(avant,quoi)=>{const apres=await mesure();verifier(apres.prog===avant.prog&&apres.sig===avant.sig,`${quoi} : rien à recompiler (${avant.prog}→${apres.prog} programmes, lumières ${avant.sig}→${apres.sig})`);return apres};

let m=await mesure();
// Chapitre 2 : Mara donne le P-9, le drone d'entraînement apparaît
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{quest:true,code:true,chip:true,door:true,ch2:true,armed:true});pn.saveGame();pn.applySave(pn.readSave())});await g.avancer(5);
m=await stable(m,'le pistolet et le drone d\'entraînement');
// Un tir, un drone abattu
await g.pn(()=>window.__pn.emit('shoot'));await g.avancer(5);m=await stable(m,'un tir');
// Chapitre 3 : le black-out, les Gardiens descendent, la Faucheuse arrive
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{battery:true,decoded:true,gate:true});pn.emit('chapitre3')});
for(let i=0;i<4;i++){await g.avancer(150);m=await stable(m,`black-out, ${(i+1)*5} s de cinématique`)}
await g.pn(()=>window.__pn.passerCine());await g.avancer(5);m=await stable(m,'fin du black-out, Gardiens en ronde');
// Un échange de tirs : canon d'épaule et son éclair, traînées (Gardien, Faucheuse), blessure
await g.pn(()=>{const pn=window.__pn,z=pn.zone();pn.G.grace=0;pn.emit('tirGardien',z.gardiens[0],true);pn.emit('tirGardien',z.gardiens[1],false);pn.emit('tirFaucheuse',z.faucheuses[0],true);pn.combat.blesser(1,0,0);pn.G.grace=1e6});await g.avancer(1);
m=await stable(m,'un échange de tirs');
// La Faucheuse abattue : fumée, chute, explosion, épave en flammes, feu
await g.pn(async()=>{const {toucheFaucheuse}=await import('/src/faucheuse.js');const f=window.__pn.zone().faucheuses[0];while(f.pv>0)toucheFaucheuse(f,true,f.g.position.clone())});
for(let i=0;i<30&&await g.pn(()=>!!window.__pn.zone().faucheuses[0].chute);i++)await g.avancer(10);
m=await stable(m,'une Faucheuse abattue');
// La Coupure
await g.pn(()=>window.__pn.emit('couper'));await g.avancer(5);m=await stable(m,'la Coupure');
// Chaque nouveau lieu est préparé à l'arrivée : ensuite, plus rien à compiler
for(const z of['toits','traboules','quais','tour','sommet']){
  await g.pn(z=>{const pn=window.__pn;pn.allerZone(z,null,{fondu:false});pn.G.grace=1e6},z);await g.avancer(3);
  const apresCompil=await mesure();
  await g.avancer(60);let ap=await stable(apresCompil,`${z} : après la préparation du lieu`);
  await g.pn(()=>{const pn=window.__pn,V=pn.P.pos.constructor;pn.combat.trace(new V(pn.P.pos.x+3,1.5,pn.P.pos.z-6),new V(pn.P.pos.x,1.2,pn.P.pos.z-1),0xffd08a)});
  await stable(ap,`${z} : un tir`);
}
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Rendu : terminé.');

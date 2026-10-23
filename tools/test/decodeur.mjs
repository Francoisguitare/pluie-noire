// Le décodeur de Mara : brancher la batterie pendant un autre dialogue (ou recharger juste après) ne bloque plus la suite.
// Usage : NODE_PATH=$(npm root -g) node tools/test/decodeur.mjs
import {ouvrir,verifier} from './outils.mjs';
const g=await ouvrir({largeur:640,hauteur:360});await g.jouer();await g.avancer(3);
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{quest:true,code:true,chip:true,door:true,ch2:true,armed:true,dd:[true,true,true],gate:true,battery:true});pn.saveGame();pn.applySave(pn.readSave());pn.G.grace=1e6});await g.avancer(3);
// on branche pendant qu'un autre dialogue s'ouvre (cas du joueur : la réaction de Mara se perdait)
await g.placer(-5,18.4,Math.PI);await g.avancer(3);
verifier(await g.pn(()=>/Brancher/.test(window.__pn.G.curInter&&window.__pn.G.curInter.label())),'« Brancher la batterie »');
await g.pn(()=>{window.__pn.G.curInter.act();window.__pn.openDialog('kovac')});await g.p.waitForTimeout(2500);await g.avancer(2);
verifier(await g.pn(()=>window.__pn.S.decoded&&window.__pn.state==='dialogue'),'branchée, un autre dialogue en cours');
await g.pn(async()=>{(await import('/src/histoire/dialogue.js')).closeDialog()});await g.p.waitForTimeout(1500);await g.avancer(2);
verifier(await g.pn(()=>window.__pn.state==='dialogue'&&/décrochent/.test(document.getElementById('dtxt').textContent+window.__pn.DLG.mara.nodes.end2.t)),'Mara réagit dès que le dialogue est fini');
// et si on recharge la partie à ce moment-là : parler à Mara reprend la suite
await g.pn(async()=>{(await import('/src/histoire/dialogue.js')).closeDialog();const pn=window.__pn;pn.saveGame();pn.applySave(pn.readSave())});await g.avancer(3);
verifier(await g.pn(()=>window.__pn.S.decoded&&window.__pn.DLG.mara.entry()==='end2'),'reprise : parler à Mara reprend la suite (end2)');
verifier(await g.pn(()=>/Parle à Mara/.test(document.getElementById('objs').textContent)),'objectif : parler à Mara');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Décodeur : terminé.');

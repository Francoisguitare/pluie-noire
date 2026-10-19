// Démarrage en mode téléphone (paysage, tactile) : classes, qualité, commandes, aucune erreur.
import {ouvrir,verifier} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir({largeur:844,hauteur:390,mobile:true});
verifier(await g.pn(()=>document.body.classList.contains('touch')),'mode tactile détecté');
await g.jouer();await g.avancer(10);
verifier(await g.pn(()=>window.__pn.state==='play'),'la partie démarre');
verifier(await g.pn(()=>!document.getElementById('touch').hidden&&!document.getElementById('tAct').hidden),'joystick et boutons affichés');
await g.pn(()=>window.__pn.openDialog('mara'));await g.avancer(5);
if(sortie)await g.capture(sortie+'/mobile-dialogue.png');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();

// Démarrage en mode téléphone (paysage, tactile) : classes, plein écran, commandes (en arc dans le coin, sans chevauchement,
// HUD dégagé), aucune erreur.
import {ouvrir,verifier} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir({largeur:844,hauteur:390,mobile:true});
verifier(await g.pn(()=>document.body.classList.contains('touch')),'mode tactile détecté');
await g.jouer();await g.avancer(10);
verifier(await g.pn(()=>window.__pn.state==='play'),'la partie démarre');
verifier(await g.pn(()=>!document.getElementById('touch').hidden&&!document.getElementById('tAct').hidden),'joystick et boutons affichés');
verifier(await g.pn(()=>!!document.fullscreenElement),'« Jouer » passe en plein écran');
// Toutes les commandes affichées (armé, Coupure) : aucune ne chevauche une autre ni le HUD, et la moitié haute de l'écran reste libre pour regarder
for(const[w,h]of[[844,390],[740,340]]){
  await g.p.setViewportSize({width:w,height:h});
  await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:4,armed:true,xp:380});document.body.classList.add('armed');pn.emit('hud')});await g.avancer(2);
  const r=await g.pn(()=>{const B=['tAct','tFire','tCoupe','tCrouch','tRun'].map(id=>document.getElementById(id).getBoundingClientRect());
    const hud=[...document.querySelectorAll('.stats,.obj')].map(e=>e.getBoundingClientRect());
    const inter=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;let n=0;
    // les boutons sont ronds : on compare les cercles entre eux, et leur cadre au HUD
    const cer=(a,b)=>Math.hypot(a.left+a.width/2-b.left-b.width/2,a.top+a.height/2-b.top-b.height/2)<(a.width+b.width)/2;
    for(let i=0;i<B.length;i++){for(let j=i+1;j<B.length;j++)if(cer(B[i],B[j]))n++;for(const hh of hud)if(inter(B[i],hh))n++}
    return{n,haut:Math.min(...B.map(b=>b.top))/innerHeight,coupe:getComputedStyle(document.getElementById('tCoupe')).display}});
  verifier(r.n===0&&r.haut>.42&&r.coupe==='grid',`${w}×${h} : boutons sans chevauchement, regroupés en bas à droite (dès ${Math.round(r.haut*100)} % de la hauteur)`);
  if(sortie)await g.capture(`${sortie}/mobile-${w}.png`);
}
await g.pn(()=>window.__pn.openDialog('mara'));await g.avancer(5);
if(sortie)await g.capture(sortie+'/mobile-dialogue.png');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();

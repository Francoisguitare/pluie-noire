// Combat : accroupi en bascule, santé qui remonte, Gardien qui repère Ash et tire par rafales (et prévient les autres),
// couverture accroupi derrière un obstacle bas, drone et son taser, Faucheuse qui tire dans la lumière, grille laser qui
// brûle, alarme d'une caméra, points de sauvegarde (témoin, jamais en plein danger), chute et retour au dernier point,
// retour au point depuis le menu pause.
// Usage : NODE_PATH=$(npm root -g) node tools/test/combat.mjs [dossier-captures]
import {ouvrir,verifier,viser} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();await g.avancer(3);
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const etat=()=>g.pn(()=>window.__pn.state);
const vie=()=>g.pn(()=>window.__pn.P.vie);
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
// compteurs d'événements (tirs, blessures)
await g.pn(()=>{const pn=window.__pn;window.__n={};for(const e of['tirGardien','tirDrone','tirFaucheuse','blesse','engagement','alarmeCamera','pointSauve'])pn.on(e,()=>{window.__n[e]=(window.__n[e]||0)+1})});
const n=e=>g.pn(e=>window.__n[e]||0,e);
// avance de s secondes sans laisser Ash tomber (pour observer les tirs) : santé remise à 100 tous les dixièmes de seconde
const tenir=async s=>{for(let i=0;i<s*10;i++){await g.avancer(3);await g.pn(()=>{if(window.__pn.P.vie<70)window.__pn.P.vie=100})}};

// 1. Accroupi en bascule : C, puis C encore ; courir relève
await g.p.keyboard.press('KeyC');await g.avancer(15);
verifier(await g.pn(()=>window.__pn.P.crouch>.9&&document.body.classList.contains('accroupi')),'C : accroupi, et on le reste sans tenir la touche');
await g.p.keyboard.press('KeyC');await g.avancer(15);
verifier(await g.pn(()=>window.__pn.P.crouch<.1),'C encore : debout');
await g.p.keyboard.press('KeyC');await g.avancer(5);
await g.p.keyboard.down('ShiftLeft');await g.p.keyboard.down('KeyW');await g.avancer(10);await g.p.keyboard.up('KeyW');await g.p.keyboard.up('ShiftLeft');
verifier(await g.pn(()=>!document.body.classList.contains('accroupi')),'courir relève');

// 2. Santé : une blessure, puis elle remonte à couvert
await g.pn(()=>window.__pn.combat.blesser(30,0,0));
verifier(await vie()===70&&await g.pn(()=>document.getElementById('vieBar').style.width==='70%'),'blessure : 70 de santé, la barre suit');
await g.avancer(30*8);verifier(await vie()>=99,`la santé remonte après quelques secondes (${Math.round(await vie())})`);

// 3. Point de sauvegarde : pris et annoncé hors de danger
await g.placer(-4.6,17.6,Math.PI/2);await g.avancer(2);
const p0=await n('pointSauve');await g.pn(()=>window.__pn.emit('save'));await g.avancer(2);
verifier(await n('pointSauve')>p0||await g.pn(()=>Date.now()-window.__pn.lire().point.at<5000),'point de sauvegarde pris hors de danger');
verifier(await g.pn(()=>document.getElementById('autosave').classList.contains('on')),'témoin « Sauvegarde automatique »');
await capture('combat-sauvegarde');

// 4. Chapitre 3 : un Gardien repère Ash, lève son canon et tire par rafales
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{quest:true,code:true,chip:true,door:true,ch2:true,armed:true,battery:true,decoded:true,gate:true});pn.emit('chapitre3')});
await g.avancer(10);await g.pn(()=>window.__pn.passerCine());await g.avancer(5);
verifier(await etat()==='play'&&(await S()).blackout,'chapitre 3 en jeu');
// un point de sauvegarde sous l'auvent de l'hôtel, avant d'aller au contact
await g.pn(()=>{window.__pn.G.grace=1e6});await g.placer(-4.6,17.6,Math.PI/2);await g.avancer(2);await g.pn(()=>window.__pn.combat.pointDeSauvegarde());
const gi=await g.pn(()=>{const z=window.__pn.zone(),d=z.gardiens[1];return{x:d.pos.x,z:d.pos.z,yaw:d.yaw}});
const px=gi.x+Math.sin(gi.yaw)*4,pz=gi.z+Math.cos(gi.yaw)*4;
await g.pn(()=>{window.__pn.G.grace=0});await g.placer(px,pz,viser(px,pz,gi.x,gi.z));
const sp0=(await S()).spotted;await tenir(6);
const gd=await g.pn(()=>{const d=window.__pn.zone().gardiens[1];return{etat:d.etat,canon:d.canon.rotation.x}});
verifier(gd.etat==='combat'&&gd.canon<.5,`le Gardien engage le combat, canon levé (${gd.etat})`);
verifier(await n('tirGardien')>=4&&await n('blesse')>0,`il tire par rafales (${await n('tirGardien')} balles) et touche (${await n('blesse')} fois)`);
verifier((await S()).spotted===sp0+1,'un repérage compté');
verifier(await g.pn(()=>window.__pn.zone().gardiens[0].alerte>0||window.__pn.zone().gardiens[0].etat==='combat'),"l'autre Gardien a entendu les coups de feu");
await capture('combat-gardien');
// pas de point de sauvegarde en plein danger
const pa=await g.pn(()=>window.__pn.lire().point.at);await g.pn(()=>window.__pn.emit('save'));await g.avancer(5);
verifier(await g.pn(a=>window.__pn.lire().point.at===a,pa),'pas de point de sauvegarde sous le feu');

// 5. Chute : à terre, puis retour au dernier point de sauvegarde, santé pleine
await g.pn(()=>{window.__pn.P.vie=5});
for(let i=0;i<12&&await etat()==='play';i++)await g.avancer(15);
verifier(await etat()==='mort'&&await g.pn(()=>!document.getElementById('mort').hidden),'à terre : « À terre »');
await capture('combat-chute');
await g.p.waitForFunction(()=>window.__pn.state==='play',null,{timeout:60000});
const r=await g.pn(()=>({x:window.__pn.P.pos.x,z:window.__pn.P.pos.z,vie:window.__pn.P.vie,morts:window.__pn.S.morts,ch:window.__pn.S.chapter}));
verifier(Math.abs(r.x+4.6)<.6&&Math.abs(r.z-17.6)<.6&&r.vie===100,`retour au dernier point de sauvegarde, santé pleine (${r.x.toFixed(1)}, ${r.z.toFixed(1)})`);
verifier(r.morts===1,'une chute comptée, gardée malgré le retour en arrière');

// 6. La couverture : accroupi derrière un obstacle bas, le Gardien ne voit plus Ash
const couv=await g.pn(async()=>{const {couvertBas}=await import('/src/physique.js');const pn=window.__pn;
  pn.zone().colliders.push({x0:-1,x1:1,z0:-.4,z1:.4,los:false,off:false});pn.P.pos.set(0,0,.9);pn.P.crouch=1;
  const vu=couvertBas(0,-8,0,.9),dos=couvertBas(0,9,0,.9);pn.zone().colliders.pop();return{vu,dos}});
verifier(couv.vu&&!couv.dos,'un obstacle bas couvre Ash du bon côté seulement');

// 7. La Faucheuse tire tant qu'on reste dans sa lumière (au milieu de la rue, à découvert)
verifier((await S()).blackout&&await g.pn(()=>window.__pn.zone().faucheuses.length===1),'de retour au chapitre 3, la Faucheuse tourne');
const f0=await n('tirFaucheuse');
for(let i=0;i<40;i++){await g.pn(()=>{const pn=window.__pn,f=pn.zone().faucheuses[0];pn.P.pos.set(0,0,-3);pn.P.vx=pn.P.vz=0;f.cible.set(0,0,-3);f.verrou=1.2;pn.G.grace=0;if(pn.P.vie<70)pn.P.vie=100});await g.avancer(3)}
verifier(await n('tirFaucheuse')>f0,`la Faucheuse tire dans la lumière (${await n('tirFaucheuse')-f0} balles)`);
await capture('combat-faucheuse');

// 8. Un drone (chapitre 1) tire des fléchettes de taser
await g.pn(()=>{window.__pn.newGame();window.__pn.G.grace=0});await g.avancer(2);
const di=await g.pn(()=>{const d=window.__pn.zone().drones[1];return{x:d.g.position.x,z:d.g.position.z,yaw:d.yaw}});
const dx=di.x+Math.sin(di.yaw)*5,dz=di.z+Math.cos(di.yaw)*5;await g.placer(dx,dz,viser(dx,dz,di.x,di.z),.3);
const t0=await n('tirDrone');await tenir(6);
verifier(await n('tirDrone')>t0&&await g.pn(()=>window.__pn.zone().drones[1].combat),`le drone suit Ash et tire (${await n('tirDrone')-t0} fléchettes)`);

// 9. La grille laser de la tour brûle et donne l'alerte
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:5,tour:true,ascenseur:true});pn.allerZone('tour',null,{fondu:false});pn.G.grace=0;pn.P.vie=100});await g.avancer(2);
for(let i=0;i<200&&!await g.pn(()=>window.__pn.H.tour&&window.__pn.zone().lasers[0].actif);i++)await g.avancer(3);
const lx=await g.pn(()=>window.__pn.zone().lasers[0].x);await g.pn(()=>{window.__pn.G.grace=0});await g.placer(lx,0,-Math.PI/2);await g.avancer(1);
verifier(await vie()<=100-34+1,`la grille laser brûle (${Math.round(await vie())})`);

// 10. Une caméra des quais sonne l'alarme : un Gardien accourt
await g.pn(()=>{const pn=window.__pn;pn.allerZone('quais',null,{fondu:false});pn.P.vie=100});await g.avancer(2);
const ci=await g.pn(()=>{const c=window.__pn.H.quais.cam1;return{x:c.x,z:c.z,yaw:c.yaw}});
const cx=ci.x+Math.sin(ci.yaw)*5,cz=ci.z+Math.cos(ci.yaw)*5;
await g.pn(()=>{window.__pn.G.grace=0});await g.placer(cx,cz,viser(cx,cz,ci.x,ci.z));
const a0=await n('alarmeCamera');await tenir(5);
verifier(await n('alarmeCamera')>a0,'la caméra sonne l\'alarme');
verifier(await g.pn(()=>window.__pn.zone().gardiens.some(d=>d.alerte>0)),'un Gardien accourt');

// 11. Menu pause : revenir au dernier point de sauvegarde
await g.pn(()=>{const pn=window.__pn;for(const d of pn.zone().gardiens){d.etat='ronde';d.alerte=0;d.s=0}for(const c of pn.zone().cameras){c.s=0;c.alarme=false}pn.G.danger=0;pn.G.grace=1e6});await g.avancer(2);
await g.placer(4.6,-1,0);await g.avancer(2);await g.pn(()=>window.__pn.combat.pointDeSauvegarde());
await g.placer(0,-30,0);await g.avancer(2);
await g.pn(()=>window.__pn.emit('pause'));await g.avancer(1);
verifier(await g.pn(()=>!document.getElementById('pausePoint').hidden&&/Dernier point de sauvegarde/.test(document.getElementById('pointInfo').textContent)),'menu pause : dernier point de sauvegarde proposé');
await capture('combat-pause');
await g.p.click('#pausePoint');await g.p.waitForSelector('#ask:not([hidden])');await g.p.click('#askYes');
await g.p.waitForFunction(()=>window.__pn.state==='play',null,{timeout:60000});await g.avancer(2);
const q=await g.pn(()=>[window.__pn.P.pos.x,window.__pn.P.pos.z]);
verifier(Math.abs(q[0]-4.6)<.6&&Math.abs(q[1]+1)<.6,`retour au point de sauvegarde depuis la pause (${q.map(v=>v.toFixed(1))})`);

verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Combat : terminé.');

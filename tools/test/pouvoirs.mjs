// Pouvoirs : la Coupure (Gardien qui tombe, drone, portée, recharge, arc), l'XP et les niveaux, l'écran des améliorations,
// la sauvegarde des Gardiens neutralisés, la reprise d'une ancienne partie, et les 18 archives cachées (atteignables, ramassées).
// Usage : NODE_PATH=$(npm root -g) node tools/test/pouvoirs.mjs [dossier-captures]
import {ouvrir,verifier,viser} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();await g.avancer(3);
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
const couper=async()=>{await g.pn(()=>window.__pn.emit('couper'));await g.avancer(1);await g.p.waitForTimeout(250);await g.avancer(2)};

// Chapitre 1 : pas encore de Coupure
let s=await S();verifier(s.xp===0&&s.ameli.portee===0,'nouvelle partie : 0 XP');
await couper();verifier(!(await g.pn(()=>document.body.classList.contains('coupure'))),'chapitre 1 : pas de Coupure');

// Les archives : chacune atteignable (le joueur repoussé hors des murs reste à portée) et ramassée une fois
const archives=await g.pn(()=>window.__pn.pouvoirs.ARCHIVES.map(a=>({id:a.id,zone:a.zone,x:a.x,z:a.z})));
verifier(archives.length===18,'18 archives');
for(const a of archives){
  await g.pn(a=>{const pn=window.__pn;if(pn.zone().id!==a.zone)pn.allerZone(a.zone,null,{fondu:false});pn.G.grace=1e6},a);
  // on se place à 1,2 m, face à l'archive, du côté le plus dégagé
  const pos=await g.pn(async a=>{const {collide}=await import('/src/physique.js');const V=window.__pn.P.pos.constructor;let best=null;
    for(let k=0;k<16;k++){const an=k/16*Math.PI*2,p=new V(a.x+Math.sin(an)*1.2,0,a.z+Math.cos(an)*1.2),x=p.x,z=p.z;collide(p,.38);const d=Math.hypot(p.x-x,p.z-z);if(!best||d<best.d)best={x:p.x,z:p.z,d}}
    return best},a);
  await g.placer(pos.x,pos.z,viser(pos.x,pos.z,a.x,a.z));await g.avancer(2);
  const l=await g.pn(()=>{const it=window.__pn.G.curInter;return it?it.label():null});
  verifier(l==="Ramasser l'archive",`archive ${a.id} (${a.zone}) atteignable${l!=="Ramasser l'archive"?' : '+l:''}`);
  if(sortie){await g.placer(pos.x+(pos.x-a.x)*1.2,pos.z+(pos.z-a.z)*1.2,viser(pos.x,pos.z,a.x,a.z),-.55);await g.avancer(2);await capture('archive-'+a.id);await g.placer(pos.x,pos.z,viser(pos.x,pos.z,a.x,a.z));await g.avancer(2)}
  const xp0=(await S()).xp;await g.pn(()=>window.__pn.G.curInter.act());await g.avancer(2);
  s=await S();verifier(s.archives.includes(a.id)&&s.xp===xp0+50,`  ramassée : +50 XP (${s.xp})`);
}
verifier(!(await g.pn(()=>{const it=window.__pn.G.curInter;return it&&it.label()==="Ramasser l'archive"})),'une archive ramassée ne se ramasse plus');
if(sortie)await capture('archive-carte');

// Chapitre 3 sur les toits : la Coupure
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:3,blackout:true,armed:true,ch2:true,xpChap:3,coupureVue:true});pn.allerZone('toits',null,{fondu:false});pn.G.grace=1e6});
await g.avancer(2);
verifier(await g.pn(()=>document.body.classList.contains('coupure')),'chapitre 3 : Coupure disponible');
// Un Gardien immobile, à 8 m
const gd=await g.pn(()=>{const d=window.__pn.zone().gardiens[0];d.pos.set(-12,0,-8);d.yaw=0;d.wait=1e6;d.g.position.copy(d.pos);return{x:d.pos.x,z:d.pos.z}});
await g.placer(gd.x,gd.z-8,viser(gd.x,gd.z-8,gd.x,gd.z),-.04);await g.avancer(2);
verifier(await g.pn(()=>!document.getElementById('cible').hidden&&document.getElementById('cible').classList.contains('pret')),'viseur : cadre cyan sur le Gardien');
if(sortie)await capture('coupure-visee');
let xp0=(await S()).xp;
await g.pn(()=>window.__pn.emit('couper'));await g.avancer(2);if(sortie)await capture('coupure-arc');
await g.p.waitForTimeout(250);await g.avancer(14);if(sortie)await capture('coupure-chute');await g.avancer(30);
s=await S();const d0=await g.pn(()=>{const d=window.__pn.zone().gardiens[0];return{n:d.neutre,rx:d.g.rotation.x,num:d.num}});
verifier(d0.n&&Math.abs(d0.rx)>1.3,`le Gardien tombe raide (angle ${d0.rx.toFixed(2)})`);
verifier(s.neutres.length===1&&s.neutres[0].k==='toits:'+d0.num&&s.xp===xp0+45,`neutralisé sans être vu : +45 XP, gardé dans la sauvegarde (${s.xp})`);
if(sortie)await capture('coupure-au-sol');
// Recharge : une deuxième Coupure tout de suite ne part pas
const g2=await g.pn(()=>{const d=window.__pn.zone().gardiens[1];d.pos.set(-4,0,-6);d.yaw=Math.PI/2;d.wait=1e6;d.g.position.copy(d.pos);return{x:d.pos.x,z:d.pos.z}});
await g.placer(g2.x,g2.z-7,viser(g2.x,g2.z-7,g2.x,g2.z));await g.avancer(2);await couper();
verifier(!(await g.pn(()=>window.__pn.zone().gardiens[1].neutre)),'recharge : pas de deuxième Coupure tout de suite');
// Trop loin : portée de 12 m au départ
await g.avancer(200);await g.placer(g2.x-13.5,g2.z,viser(g2.x-13.5,g2.z,g2.x,g2.z));await g.avancer(2);
verifier(await g.pn(()=>document.getElementById('cible').classList.contains('loin')),'viseur : cible hors de portée signalée');
await couper();verifier(!(await g.pn(()=>window.__pn.zone().gardiens[1].neutre)),'hors de portée : rien');
// Le drone des toits
await g.avancer(200);
const dr=await g.pn(()=>{const d=window.__pn.zone().drones[0];return{x:d.g.position.x,y:d.g.position.y,z:d.g.position.z}});
await g.pn(([x,y,z])=>{const P=window.__pn.P;P.pos.set(x+5,0,z+5);const dx=x-P.pos.x,dz=z-P.pos.z;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(y-1.66,Math.hypot(dx,dz));P.vx=P.vz=0},[dr.x,dr.y,dr.z]);
await g.pn(()=>{const d=window.__pn.zone().drones[0];d.speed=0});await g.avancer(2);
xp0=(await S()).xp;await couper();await g.avancer(5);
verifier(await g.pn(()=>window.__pn.zone().drones[0].dead)&&(await S()).xp===xp0+20,'la Coupure abat le drone : +20 XP');

// Sauvegarde, reprise : le Gardien est toujours à terre ; nouvelle partie : il se relève
await g.pn(()=>window.__pn.saveGame());
await g.pn(()=>{const pn=window.__pn;pn.newGame();pn.applySave(pn.readSave())});await g.avancer(2);
verifier(await g.pn(n=>{const z=window.__pn.zone();const d=z.tousGardiens.find(d=>d.num===n);return z.id==='toits'&&d.neutre&&Math.abs(d.g.rotation.x)>1.3},d0.num),'reprise : le Gardien est toujours à terre');
await g.pn(()=>{const pn=window.__pn;pn.newGame();Object.assign(pn.S,{chapter:3,blackout:true});pn.allerZone('toits',null,{fondu:false})});await g.avancer(2);
verifier(await g.pn(n=>{const d=window.__pn.zone().tousGardiens.find(d=>d.num===n);return !d.neutre&&d.g.rotation.x===0},d0.num),'nouvelle partie : le Gardien est debout');

// L'arc : avec un rang, la Coupure saute sur le Gardien voisin
await g.pn(()=>{const pn=window.__pn,Z=pn.zone();pn.S.ameli.arc=1;pn.S.xp=1000;pn.G.grace=1e6;
  const[a,b]=Z.gardiens;a.pos.set(-12,0,-8);b.pos.set(-9,0,-8.5);for(const d of[a,b]){d.yaw=0;d.wait=1e6;d.g.position.copy(d.pos)}});
await g.avancer(200);await g.placer(-12,-16,viser(-12,-16,-12,-8));await g.avancer(2);await couper();await g.p.waitForTimeout(300);await g.avancer(30);
verifier(await g.pn(()=>window.__pn.zone().gardiens.every(d=>d.neutre)),'arc : deux Gardiens d\'un coup');
// Écho : repérage à travers les murs
await g.pn(()=>{const pn=window.__pn;pn.S.ameli.echo=1;pn.zone().drones[0].dead||0});
await g.pn(()=>{const pn=window.__pn;pn.allerZone('traboules',null,{fondu:false});pn.G.grace=1e6});await g.placer(0,-12,0);await g.avancer(3);
const nEcho=await g.pn(()=>[...document.querySelectorAll('#echos i')].filter(e=>!e.hidden).length);
verifier(nEcho>0,`écho : ${nEcho} signal(s) repéré(s) derrière les murs`);
if(sortie)await capture('echo');

// L'écran des pouvoirs
await g.pn(()=>{const pn=window.__pn;pn.S.ameli={portee:0,recharge:0,discretion:0,arc:0,echo:0};pn.S.xp=470});
await g.pn(()=>window.__pn.emit('ouvrirPouvoirs'));await g.avancer(1);
verifier(await g.pn(()=>!document.getElementById('pouvoirs').hidden&&window.__pn.state==='paused'),'Tab : écran des pouvoirs, jeu en pause');
verifier(await g.pn(()=>/3 points/.test(document.getElementById('pvPts').textContent)),'niveau 3 : 3 points à dépenser');
await capture('pouvoirs');
await g.p.click('#pvListe .pvRang:nth-child(1) button');await g.p.click('#pvListe .pvRang:nth-child(2) button');
s=await S();verifier(s.ameli.portee===1&&s.ameli.recharge===1,'améliorations achetées : portée et recharge');
await g.p.click('#pvRetour');verifier(await g.pn(()=>!document.getElementById('pauseMenu').hidden),'retour au menu pause');

// Une partie d'avant les pouvoirs, reprise au chapitre 4 : 300 XP pour les chapitres déjà faits
await g.p.click('#resume');await g.avancer(1);
await g.pn(()=>{const pn=window.__pn,old=JSON.parse(JSON.stringify(pn.S));for(const k of['xp','ameli','neutres','archives','xpChap','coupureVue'])delete old[k];old.chapter=4;old.blackout=true;
  pn.applySave({S:old,p:[0,-2,0],zone:'traboules'})});
verifier((await S()).xp===0,'ancienne partie : pas encore d\'XP');
await g.avancer(3);s=await S();
verifier(s.xp===300&&s.xpChap===4,`ancienne partie reprise au chapitre 4 : 300 XP pour les chapitres faits (${s.xp})`);
// Reprise au chapitre 3 dans la rue : les Gardiens arrivés avec le black-out restent à terre
const n3=await g.pn(()=>{const pn=window.__pn,base=JSON.parse(JSON.stringify(pn.S));Object.assign(base,{chapter:3,blackout:true,xpChap:3,neutres:[]});
  pn.applySave({S:base,p:[0,20,0],zone:'rue'});const z=pn.zone();return z.id==='rue'&&z.tousGardiens&&z.tousGardiens.length?z.tousGardiens[0].num:null});
verifier(n3!==null,'chapitre 3 : les Gardiens de la rue sont installés');
await g.pn(n=>{const pn=window.__pn,base=JSON.parse(JSON.stringify(pn.S));base.neutres=[{k:'rue:'+n,x:1,z:-5,yaw:0,sens:1}];pn.applySave({S:base,p:[0,20,0],zone:'rue'})},n3);await g.avancer(2);
verifier(await g.pn(n=>{const d=window.__pn.zone().tousGardiens.find(d=>d.num===n);return d.neutre&&!d.cone.visible&&Math.abs(d.g.rotation.x)>1.3},n3),'reprise au chapitre 3 : le Gardien de la rue reste à terre, lampe éteinte');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Pouvoirs : terminé.');

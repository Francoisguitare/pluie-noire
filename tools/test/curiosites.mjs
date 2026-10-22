// Les curiosités et les fenêtres vivantes : le guetteur qui disparaît puis revient sur un autre toit, la cabine qui sonne
// (deux appels, le second au black-out), l'écran Helix qui se trompe de slogan, la buée qui s'écrit quand on s'approche,
// la poupée qui ne bouge que quand on ne la regarde pas, les mains sous le pont, les têtes de NOX, les armures rangées.
// Chacune compte une fois (XP, pourcentage de la partie), se relit dans « Dossiers » et reste notée après une reprise.
// Usage : NODE_PATH=$(npm root -g) node tools/test/curiosites.mjs [dossier-captures]
import {ouvrir,verifier,viser} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();await g.avancer(3);await g.pn(()=>{window.__pn.G.grace=1e6});
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const etat=()=>g.pn(()=>window.__pn.state);
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
const fermerLecture=async()=>{for(let i=0;i<4&&await etat()==='lecture';i++){await g.pn(()=>window.__pn.emit('lectureSuite'));await g.avancer(1)}};
const C=f=>g.pn(async f=>{const {curiosites}=await import('/src/curiosites.js');return new Function('C','return '+f)(curiosites)},f);
// Regarde le point (x,y,z) depuis (px,pz)
const regarder=(px,pz,[x,y,z])=>g.pn(([px,pz,x,y,z])=>{const P=window.__pn.P;P.pos.set(px,0,pz);P.vx=P.vz=0;P.yaw=Math.atan2(-(x-px),-(z-pz));P.pitch=Math.atan2(y-1.66,Math.hypot(x-px,z-pz))},[px,pz,x,y,z]);
const notees=async()=>(await S()).curiosites;
const inter=()=>g.pn(()=>window.__pn.G.curInter&&window.__pn.G.curInter.label());

verifier(await g.pn(()=>{const d=window.__pn.completion().det.find(d=>d.id==='curiosites');return d&&d.total===8&&d.fait===0}),'huit curiosités comptent dans le pourcentage de la partie');
verifier(await g.pn(async()=>{const {majFenetres}=await import('/src/fenetres.js');return typeof majFenetres==='function'})&&await g.pn(()=>window.__pn.zones.rue.root.children.some(o=>o.material&&o.material.uniforms&&o.material.uniforms.mode)),'des fenêtres vivantes sur les façades de la rue');

// ---------- La rue ----------
// Le guetteur : on le fixe, il est noté ; on détourne les yeux, il n'est plus là ; il revient plus tard, sur un autre toit
const tete=await C('C.guetteur.tete.toArray()');
await regarder(0,4,tete);await g.avancer(50);await capture('cur-guetteur');
verifier((await notees()).includes('guetteur'),'le guetteur, sur le toit, se laisse regarder');
await g.pn(()=>{window.__pn.P.yaw+=Math.PI;window.__pn.P.pitch=-.4});await g.avancer(3);
verifier(await C('!C.guetteur.g.visible&&C.guetteur.parti'),'on détourne les yeux : il n\'est plus là');
await g.pn(async()=>{const {curiosites}=await import('/src/curiosites.js');curiosites.guetteur.retour=0;window.__pn.P.yaw=0;window.__pn.P.pitch=-.6});await g.avancer(3);
verifier(await C('C.guetteur.g.visible&&C.guetteur.poste===1'),'il revient, sur un autre toit, quand on ne regarde pas');

// La cabine sonne quand on passe ; on décroche
await g.placer(-1,-27,Math.PI/2);await g.avancer(6);
verifier(await C('C.cabine.sonne'),'la cabine sonne quand on passe');
await g.placer(-3.8,-27,viser(-3.8,-27,-5.35,-27),-.1);await g.avancer(6);
verifier(await inter()==='Décrocher','« Décrocher »');await capture('cur-cabine');
await g.pn(()=>window.__pn.G.curInter.act());await g.avancer(1);
verifier(await etat()==='lecture'&&await g.pn(()=>/Léa/.test(document.getElementById('lecture').textContent)),'au bout du fil : quelqu\'un d\'enfermé qui demande Léa');
await fermerLecture();verifier((await notees()).includes('cabine')&&!(await C('C.cabine.sonne')),'la cabine se tait');
await g.placer(-1,-27,Math.PI/2);await g.avancer(30);verifier(!(await C('C.cabine.sonne')),'elle ne sonne plus avant le black-out');
await g.pn(async()=>{const {curiosites}=await import('/src/curiosites.js');window.__pn.S.chapter=3;curiosites.cabine.repos=0});await g.avancer(3);
await g.placer(-3.8,-27,viser(-3.8,-27,-5.35,-27),-.1);await g.avancer(3);await g.pn(()=>window.__pn.G.curInter.act());await g.avancer(1);
verifier(await g.pn(()=>/Lou/.test(document.getElementById('lecture').textContent)),'au black-out, le second appel : une voix d\'enfant pour Lou');
await fermerLecture();await g.pn(()=>{window.__pn.S.chapter=1});

// L'écran Helix : à force de le fixer, le slogan déraille
await regarder(-2,-21,[-5.95,2.9,-21]);await g.avancer(30);
let glitch=false;for(let i=0;i<40&&!glitch;i++){await g.avancer(2);glitch=await C('C.ecran.m.material.map===C.ecran.b')}
if(glitch)await capture('cur-soyez');
verifier(glitch&&(await notees()).includes('soyez'),'« SOYEZ À NOUS. » le temps d\'un battement');
await g.avancer(15);verifier(await C('C.ecran.m.material.map===C.ecran.a'),'puis le slogan revient');

// La buée : rien de loin ; de près, l'inscription
await regarder(-1,29.5,[-5.96,1.6,29.5]);await g.avancer(20);
verifier(await C('C.buee.m.material.opacity<.05'),'de loin, une vitre comme les autres');
await regarder(-4.7,29.5,[-5.96,1.6,29.5]);await g.avancer(60);await capture('cur-buee');
verifier(await C('C.buee.m.material.opacity>.6')&&(await notees()).includes('buee'),'de près, la buée : ILS ÉCOUTENT');

// ---------- Les traboules : la poupée ----------
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:4,canuts:true});pn.allerZone('traboules',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
const poupee=await C('C.poupee.p.toArray()');
await regarder(-15.2,-30.2,poupee);await g.avancer(20);
const r0=await C('C.poupee.tete.rotation.y');
verifier(Math.abs(r0-1.1)<.01,'regardée, la poupée ne bouge pas (elle fixe le mur)');
verifier(!(await notees()).includes('poupee'),'tant qu\'elle n\'a pas bougé, rien d\'étrange');
await g.pn(()=>{window.__pn.P.yaw+=Math.PI});await g.avancer(60);
const r1=await C('C.poupee.tete.rotation.y');
verifier(Math.abs(r1-r0)>.8,`dos tourné, elle tourne la tête vers toi (${r0.toFixed(2)} → ${r1.toFixed(2)})`);
await regarder(-15.2,-30.2,poupee);await g.avancer(10);await capture('cur-poupee');
verifier((await notees()).includes('poupee'),'on se retourne : elle te regarde');

// ---------- Les quais : les mains sous le pont ----------
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:5});pn.allerZone('quais',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
verifier(await C('C.mains.l.length')>=20,'des mains K7 pendues sous le pont');
await regarder(-1.5,-35,[-3,3.2,-39.2]);await g.avancer(5);await capture('cur-mains');
await g.placer(-3.4,-39.7,0,-.3);await g.avancer(6);verifier(await inter()==='Lire le carton','« Lire le carton »');
await g.pn(()=>window.__pn.G.curInter.act());await g.avancer(1);
verifier(await g.pn(()=>/RENDRE UNE MAIN/.test(document.getElementById('lecture').textContent)),'le carton : on ne peut pas rendre une main');
await fermerLecture();verifier((await notees()).includes('mains'),'les mains rendues, notées');

// ---------- La tour : les têtes de NOX, les armures rangées ----------
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{tour:true});pn.allerZone('tour',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
const t0=await C('C.tetes.suit.t.rotation.y');
await regarder(13.5,8.4,[13.5,.8,10.6]);await g.avancer(40);
const t1=await C('C.tetes.suit.t.rotation.y');
verifier(Math.abs(t1-t0)>.3&&(await notees()).includes('tetes'),`une tête de NOX te suit des yeux (${t0.toFixed(2)} → ${t1.toFixed(2)})`);
await capture('cur-tetes');
await regarder(103.3,.3,[103.3,1.4,2.55]);await g.avancer(10);
verifier((await notees()).includes('armures'),'les armures rangées : celle du milieu frappe');
await capture('cur-armures');

// ---------- Le compte ----------
let s=await S();
verifier(s.curiosites.length===8&&await g.pn(()=>window.__pn.completion().det.find(d=>d.id==='curiosites').fait===8),'huit curiosités sur huit');
verifier(s.xp>=80,'10 XP chacune');
await g.pn(()=>window.__pn.emit('ouvrirDossiers'));await g.avancer(1);
verifier(await g.pn(()=>[...document.querySelectorAll('#dosListe details.dossier > summary')].some(e=>/Curiosités/.test(e.textContent)&&/8 \/ 8/.test(e.textContent))),'écran Dossiers : la section des curiosités, 8 / 8');
if(sortie){await g.pn(()=>{const d=[...document.querySelectorAll('#dosListe details.dossier')].find(d=>/Curiosités/.test(d.textContent));d.open=true;d.scrollIntoView()});await capture('cur-dossiers')}
await g.p.click('#dosRetour');await g.p.click('#resume');await g.avancer(1);
// Une reprise garde tout ; la cabine ne rappelle pas
await g.pn(()=>{const pn=window.__pn;pn.saveGame();pn.applySave(pn.readSave())});await g.avancer(2);
verifier((await S()).curiosites.length===8&&(await S()).appels===2,'reprise : les curiosités restent notées');
await g.pn(()=>{const pn=window.__pn;pn.allerZone('rue',null,{fondu:false});pn.G.grace=1e6});await g.placer(-1,-27,Math.PI/2);await g.avancer(30);
verifier(!(await C('C.cabine.sonne')),'la cabine ne rappelle pas');

// Une partie neuve : tout est à revoir
await g.pn(()=>window.__pn.newGame());await g.avancer(2);s=await S();
const neuf=await C('[C.guetteur.poste,C.guetteur.g.visible]');
const neuve=s.curiosites.length===0&&s.appels===0&&neuf[0]===0&&neuf[1];
verifier(neuve,'nouvelle partie : la cabine sonnera de nouveau, le guetteur revient sur son premier toit'+(neuve?'':` (${s.curiosites.join(',')} · ${s.appels} · ${neuf})`));
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Curiosités : terminé.');

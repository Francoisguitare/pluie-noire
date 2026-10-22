// Exploration : les 90 archives (atteignables, lues sans lâcher la partie, une capture chacune), les onze dossiers complets,
// l'écran « Dossiers », le signal de la main K7, l'Écho, les lieux découverts, les premières rencontres, le casier des
// quais, et ce que les archives changent aux dialogues (Kovac, Varga, Sid, Rosa) et à l'épilogue.
// Usage : NODE_PATH=$(npm root -g) node tools/test/exploration.mjs [dossier-captures]
import {ouvrir,verifier,viser} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();await g.avancer(3);
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const etat=()=>g.pn(()=>window.__pn.state);
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
const fermerLecture=async()=>{for(let i=0;i<4&&await etat()==='lecture';i++){await g.pn(()=>window.__pn.emit('lectureSuite'));await g.avancer(1)}};

// Le signal : près d'une archive, la main bipe
await g.placer(-5.5,31.5,Math.PI);await g.avancer(3);
verifier(await g.pn(()=>!document.getElementById('signal').hidden),'signal de la main K7 près d\'une archive');
let s=await S();verifier(s.signalVu,'le signal est expliqué une fois');

const archives=await g.pn(()=>window.__pn.exploration.ARCHIVES.map(a=>({id:a.id,zone:a.zone,dossier:a.dossier,forme:a.forme})));
verifier(archives.length===90,'90 archives');
const dossiers=await g.pn(()=>window.__pn.exploration.DOSSIERS.map(d=>d.id));
verifier(dossiers.length===11&&dossiers.every(d=>archives.filter(a=>a.dossier===d).length>=5),'onze dossiers d\'au moins cinq archives');
for(const a of archives){
  await g.pn(a=>{const pn=window.__pn;if(pn.zone().id!==a.zone)pn.allerZone(a.zone,null,{fondu:false});pn.G.grace=1e6},a);
  // on se place à 1,2 m du point d'interaction, du côté le plus dégagé, face à lui
  const pos=await g.pn(async id=>{const {collide}=await import('/src/physique.js');const pn=window.__pn,it=pn.zone().inter.find(i=>i.archive===id),V=pn.P.pos.constructor;let best=null;
    for(let k=0;k<16;k++){const an=k/16*Math.PI*2,p=new V(it.p.x+Math.sin(an)*1.1,0,it.p.z+Math.cos(an)*1.1),x=p.x,z=p.z;collide(p,.38);const d=Math.hypot(p.x-x,p.z-z);if(!best||d<best.d)best={x:p.x,z:p.z,d,tx:it.p.x,tz:it.p.z}}
    return best},a.id);
  await g.placer(pos.x,pos.z,viser(pos.x,pos.z,pos.tx,pos.tz),-.15);await g.avancer(2);
  const ok=await g.pn(id=>{const it=window.__pn.G.curInter;return it&&it.archive===id?it.label():null},a.id);
  verifier(ok,`${a.id} (${a.zone}, ${a.forme}) atteignable : « ${ok} »`);
  if(sortie)await capture('archive-'+a.id);
  const xp0=(await S()).xp;await g.pn(()=>window.__pn.G.curInter.act());await g.avancer(1);
  verifier(await etat()==='lecture'&&await g.pn(()=>!document.getElementById('lecture').hidden),'  lecture ouverte, partie figée');
  if(sortie&&a.id==='rue1')await capture('lecture');
  await fermerLecture();await g.p.waitForTimeout(800);await g.avancer(2);
  s=await S();verifier(s.archives.includes(a.id)&&s.xp>=xp0+50&&await etat()==='play',`  lue : ${s.xp-xp0} XP`);
}
s=await S();verifier(s.dossiersFinis.length===11,'onze dossiers complets : '+s.dossiersFinis.join(', '));
verifier(!(await g.pn(()=>window.__pn.zone().inter.some(i=>i.archive&&(!i.on||i.on())))),'une archive lue ne se relit pas sur place');

// L'écran « Dossiers » (touche J), avec le pourcentage de la partie
await g.pn(()=>window.__pn.emit('ouvrirDossiers'));await g.avancer(1);
verifier(await g.pn(()=>!document.getElementById('dossiers').hidden&&document.querySelectorAll('#dosListe details.dossier.complet').length===11),'écran Dossiers : onze dossiers complets, révélations');
const pc=await g.pn(()=>({tete:document.getElementById('dosTete').textContent,rangs:[...document.querySelectorAll('#dosProgres .pRang')].map(r=>r.textContent),c:window.__pn.completion()}));
verifier(/^Partie terminée à \d+ %$/.test(pc.tete)&&pc.rangs.some(t=>/Archives.*90 \/ 90/.test(t))&&pc.c.det.find(d=>d.id==='dossiers').fait===11,`progression : « ${pc.tete} », ${pc.rangs.length} catégories`);
if(sortie){await g.pn(()=>{const d=document.querySelector('#dosListe details.dossier');d.open=true;d.querySelector('details.piece').open=true});await capture('dossiers')}
await g.p.click('#dosRetour');await g.p.click('#resume');await g.avancer(1);

// Le casier des quais (code trouvé dans l'archive « Un code sous le pont »)
await g.pn(()=>{const pn=window.__pn;pn.allerZone('quais',null,{fondu:false});pn.G.grace=1e6});
await g.placer(5.2,-37.1,-Math.PI/2);await g.avancer(2);
const c0=(await S()).credits;
verifier(await g.pn(()=>window.__pn.G.curInter&&/1834/.test(window.__pn.G.curInter.label())),'casier 7 : le code est connu');
await g.pn(()=>window.__pn.G.curInter.act());await g.avancer(1);await fermerLecture();
s=await S();verifier(s.quetes.casier&&s.credits===c0+80,'casier ouvert : 80 crédits');

// Lieux découverts et premières rencontres : de l'XP
const lx0=(await S()).lieux.length;
await g.pn(()=>{const pn=window.__pn;pn.allerZone('traboules',null,{fondu:false});pn.G.grace=1e6});await g.placer(-40,-30,0);await g.avancer(3);
s=await S();verifier(s.lieux.includes('voraces')&&s.lieux.length>lx0,'lieu découvert : la cour des Voraces');
// Rosa : la carte de Jean Delorme
await g.pn(()=>{window.__pn.S.rosaVue=true});await g.pn(()=>window.__pn.openDialog('rosa'));await g.avancer(2);
verifier(await g.pn(()=>/Jean Delorme/.test(document.getElementById('dtxt').textContent)||/Delorme/.test(window.__pn.DLG.rosa.nodes.delorme.t)),'Rosa reconnaît la carte de Jean Delorme');
s=await S();verifier(s.quetes.rosa&&s.rencontres.includes('rosa'),'quête de Rosa faite, rencontre comptée');
await g.choisir(0);
// Varga : sa lettre remplace le mail du labo
await g.pn(()=>{Object.assign(window.__pn.S,{readMail:false,vargaVue:true,carte:true,vargaTestifies:null})});
await g.pn(()=>window.__pn.openDialog('varga','rendre'));await g.avancer(2);
const cv=await g.pn(()=>[...document.querySelectorAll('#dch button')].map(b=>b.textContent));
verifier(cv.some(t=>/ma faute/.test(t)),'Varga : la lettre devient un argument');
await g.choisir(cv.findIndex(t=>/ma faute/.test(t)));s=await S();
verifier(s.vargaTestifies===true,'Varga témoignera grâce à sa lettre');
// Kovac (chapitre 1) : son propre ticket
await g.pn(()=>{const pn=window.__pn;pn.newGame();pn.S.archives=['rue2'];pn.openDialog('kovac')});await g.avancer(2);
const ck=await g.pn(()=>[...document.querySelectorAll('#dch button')].map(b=>b.textContent));
verifier(ck.some(t=>/ticket/.test(t)),'Kovac : montrer son ticket');
await g.choisir(ck.findIndex(t=>/ticket/.test(t)),0);s=await S();
verifier(s.code&&s.kovacVerite,'Kovac donne le code, convaincu par son ticket');
// Sid (toits) : la photo de son équipe
await g.pn(()=>{const pn=window.__pn;pn.S.archives.push('toits1');pn.openDialog('sidToits')});await g.avancer(2);
verifier(await g.pn(()=>/Vaise, 2036/.test(document.getElementById('dtxt').textContent)||window.__pn.S.quetes.sid),'Sid retrouve sa photo');
s=await S();verifier(s.quetes.sid,'quête de Sid faite');

// Les radios des Gardiens : à moins de 9 m d'un Gardien qui ne t'a pas vu, on entend son canal, jusqu'au bout
// (le dialogue de Sid, resté ouvert, se ferme d'abord : en dialogue, le temps des radios s'arrête)
await g.pn(async()=>{const {closeDialog}=await import('/src/histoire/dialogue.js');closeDialog()});
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{chapter:4});pn.allerZone('traboules',null,{fondu:false});pn.G.grace=1e6;pn.G.danger=0});await g.avancer(2);
const suivre=()=>g.pn(()=>{const pn=window.__pn,d=pn.zone().gardiens[0];pn.P.pos.set(d.pos.x+2.5,0,d.pos.z+2.5);pn.G.danger=0});
const r0=(await S()).radios.length;
for(let i=0;i<40&&await g.pn(()=>document.getElementById('radio').hidden);i++){await suivre();await g.avancer(10)}
verifier(await g.pn(()=>!document.getElementById('radio').hidden&&/./.test(document.getElementById('radioTxt').textContent)),"radio : le canal des Gardiens s'ouvre");
await capture('radio');
for(let i=0;i<80&&(await S()).radios.length===r0;i++){await suivre();await g.avancer(15)}
s=await S();verifier(s.radios.length===r0+1,"écoute entendue jusqu'au bout : "+s.radios.slice(-1));
// 100 % : toute l'histoire, tout trouvé, tout le monde rencontré, toutes les quêtes, tous les pouvoirs au maximum
const cent=await g.pn(()=>{const pn=window.__pn,E=pn.exploration,A=pn.pouvoirs.AMELIS,S=pn.S;
  Object.assign(S,{ch2:true,chapter:5,fin:'diffuser',archives:E.ARCHIVES.map(a=>a.id),dossiersFinis:E.DOSSIERS.map(d=>d.id),lieux:E.LIEUX.map(l=>l.id),rencontres:['mara','nox','kovac','sid','rosa','varga','saal'],
    quetes:Object.fromEntries(E.QUETES.map(q=>[q.id,true])),ameli:Object.fromEntries(A.map(a=>[a.id,a.val.length-1])),faucheuses:['rue:0','toits:0','quais:0'],radios:E.RADIOS.map(r=>r.id)});
  const plein=pn.completion().pct;S.lieux.pop();const presque=pn.completion().pct;return{plein,presque}});
verifier(cent.plein===100&&cent.presque<100,`100 % quand tout est fait (${cent.plein} %), moins s'il manque un lieu (${cent.presque} %)`);
// L'épilogue de « Diffuser » cite les dossiers complets
const ep=await g.pn(()=>{const pn=window.__pn;pn.S.dossiersFinis=['gardien12','varga'];return pn.exploration.epilogueArchives('diffuser')});
verifier(/Gardien 12/.test(ep)&&/Varga/.test(ep),'épilogue : Nox diffuse les dossiers complets');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Exploration : terminé.');

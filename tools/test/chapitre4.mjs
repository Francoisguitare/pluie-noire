// Chapitre 4 : traboules, Sid, porte des Canuts, Rosa, Varga, énigme du métier Jacquard, choix de Varga, galerie, sauvegarde.
// Usage : NODE_PATH=$(npm root -g) node tools/test/chapitre4.mjs [dossier-captures]
import {ouvrir,viser,verifier} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const attendre=ms=>g.p.waitForTimeout(ms);
const voir=async(nom,x,z,yaw,pitch=0,n=12)=>{if(!sortie)return;await g.placer(x,z,yaw,pitch);await g.avancer(n);await g.capture(sortie+'/'+nom+'.png')};
const texte=async()=>{await g.pn(()=>window.__pn.emit('skipText'));return g.pn(()=>document.getElementById('dtxt').textContent)};
const agir=async()=>{await g.avancer(2);return g.pn(()=>{const it=window.__pn.G.curInter;if(!it)return null;const l=it.label();it.act();return l})};
// Fin du chapitre 3 : Mara libérée, Nox a suivi, le mail de Varga a été lu
await g.pn(()=>Object.assign(window.__pn.S,{chapter:3,quest:true,code:true,chip:true,door:true,ch2:true,armed:true,gate:true,battery:true,decoded:true,blackout:true,toits:true,maraVue:true,maraFree:true,noxWith:true,noxPaid:true,readMail:true}));
await g.pn(()=>window.__pn.emit('chapitre4'));await attendre(900);await g.avancer(3);
let s=await S();verifier(s.chapter===4&&await g.pn(()=>window.__pn.zone().id==='traboules'),'chapitre 4, dans les traboules');
const t=await g.pn(()=>{const z=window.__pn.zone();return{gardiens:z.gardiens.length,pnj:z.npcs.length,visibles:z.npcs.filter(n=>!n.absent).map(n=>n.key).join(',')}});
verifier(t.gardiens===6&&t.pnj===5,`traboules peuplées (${JSON.stringify(t)})`);
verifier(t.visibles==='sid,rosa,mara,nox,varga','Sid, Rosa, Mara, Nox et Varga présents');
await g.pn(()=>{window.__pn.G.grace=1e6});
// Les lieux
await voir('c4-arrivee',0,-1,0,.05);
await voir('c4-voute',0,-12,0,.42);
await voir('c4-cour',0,-21,0,.08,30);
await voir('c4-passage',-10.8,-29.8,Math.PI/2,.05);
await voir('c4-alcove',-15.4,-29.4,0,.0);
await voir('c4-voraces',-31.5,-23,viser(-31.5,-23,-40,-44),.32,30);
await voir('c4-porte',-41.3,-41,0,.08);
// Sid, à la trappe
await g.placer(0,-2.6,0);await g.pn(()=>window.__pn.openDialog('sidTrab'));await g.choisir(1,1);
verifier(/caves/.test(await texte()),'Sid prend par les caves');
await g.choisir(0);s=await S();
verifier(s.sidTrab&&await g.pn(()=>window.__pn.H.traboules.sid.absent),'Sid est parti');
// La porte des Canuts
await g.placer(-41.3,-44.9,0);const l1=await agir();
verifier(l1==='Frapper à la porte des Canuts','interaction : frapper à la porte');
verifier(await g.pn(()=>window.__pn.state==='cine'),'scène de la porte');
await g.avancer(175);await attendre(400);s=await S();
verifier(s.canuts&&await g.pn(()=>window.__pn.state==='play'&&window.__pn.P.pos.z<-47),'chez les Canuts');
verifier(await g.pn(()=>!window.__pn.H.traboules.sid.absent&&window.__pn.H.traboules.sid.z<-46),'Sid est arrivé par les caves');
await voir('c4-refuge',-41.3,-47.6,.12,.02,20);
// Rosa
await g.pn(()=>window.__pn.openDialog('rosa'));await g.choisir(0,0,0,0);s=await S();verifier(s.rosaVue,'Rosa a parlé de Varga');
// Porte de l'atelier fermée tant qu'on n'a pas vu Varga
await g.placer(-48.8,-55.5,Math.PI/2);verifier(await agir()==="Ouvrir la porte de l'atelier de Varga"&&!(await S()).atelierOuvert,"porte de l'atelier : pas encore");
// Varga
await g.pn(()=>window.__pn.openDialog('varga'));await g.choisir(0,0,0);
verifier(/de dos/.test(await texte()),'Varga : le métier lit les cartes de dos');
await g.choisir(0);s=await S();verifier(s.vargaVue,'Varga rencontrée');
await g.placer(-48.8,-55.5,Math.PI/2);await agir();await g.avancer(40);s=await S();
verifier(s.atelierOuvert&&await g.pn(()=>window.__pn.H.traboules.porteAtelierCol.off),"porte de l'atelier ouverte");
await voir('c4-atelier',-50.6,-55.5,Math.PI/2+.12,.02,20);
// L'énigme
await g.placer(-56.5,-54.4,Math.PI/2);verifier(await agir()==='Grand métier Jacquard : tisser la clé','interaction : le grand métier');
verifier(await g.pn(()=>window.__pn.state==='puzzle'&&!document.getElementById('metier').hidden),"écran de l'énigme ouvert");
for(const c of['C','A','E','G'])await g.pn(c=>window.__pn.metier.poser(c),c);
await g.pn(()=>window.__pn.metier.tisser());await attendre(1300);
verifier(await g.pn(()=>/envers/.test(document.getElementById('metierMsg').textContent)),'cartes pièges : la clé est tissée à l\'envers');
if(sortie)await g.capture(sortie+'/c4-metier-envers.png');
for(let i=3;i>=0;i--)await g.pn(i=>window.__pn.metier.retirer(i),i);
for(const c of['F','D','H','B'])await g.pn(c=>window.__pn.metier.poser(c),c);
await g.pn(()=>window.__pn.metier.tisser());await attendre(1100);
if(sortie)await g.capture(sortie+'/c4-metier-cle.png');
await attendre(1800);s=await S();
verifier(s.carte&&await g.pn(()=>window.__pn.state==='play'&&document.getElementById('metier').hidden),'clé tissée, retour au jeu');
// Varga témoigne (mail lu, Nox présent)
await g.pn(()=>window.__pn.openDialog('varga'));await g.choisir(0);
verifier(await g.pn(()=>/prochain rapport/.test(document.getElementById('choice0').textContent)),'argument du mail proposé');
await g.choisir(0,0,0,0);s=await S();
verifier(s.vargaTestifies===true&&s.temoignage&&s.badge,'Varga témoigne, Nox enregistre, badge obtenu');
// Galerie
await g.placer(-65.3,-60.6,0);verifier(await agir()==='Passer le badge de Varga','interaction : le badge');
await g.avancer(60);s=await S();verifier(s.galerie&&await g.pn(()=>window.__pn.H.traboules.porteGalerie.userData.col.off),'galerie ouverte');
await voir('c4-galerie',-65.3,-61.6,0,.05,10);
// Sauvegarde et reprise
await g.pn(()=>window.__pn.saveGame());
await g.pn(()=>{window.__pn.newGame();window.__pn.applySave(window.__pn.readSave())});await g.avancer(3);
s=await S();verifier(s.chapter===4&&s.galerie&&await g.pn(()=>window.__pn.zone().id==='traboules'&&window.__pn.zone().gardiens.length===6&&!window.__pn.H.traboules.varga.absent),'reprise : galerie ouverte, Varga et le Gardien toujours là');
// L'autre choix : Varga se rend (le Gardien repart avec elle)
await g.pn(()=>Object.assign(window.__pn.S,{vargaTestifies:null,badge:false,galerie:false,temoignage:false}));
await g.pn(()=>window.__pn.openDialog('varga'));await g.choisir(0,2,0,0);
verifier(await g.pn(()=>window.__pn.state==='cine'),'Varga se rend : ellipse');
await g.avancer(180);await attendre(300);s=await S();
verifier(s.vargaTestifies===false&&s.badge&&await g.pn(()=>window.__pn.zone().gardiens.length===5&&window.__pn.H.traboules.varga.absent),"Varga partie, le Gardien de l'atelier aussi");
// Mara, si elle avait forcé la main d'Ash : elle peut lui donner le boîtier
await g.pn(()=>{window.__pn.S.forced=true});await g.pn(()=>window.__pn.openDialog('maraTrab'));await g.choisir(0,0,0);s=await S();
verifier(s.boitier==='ash'&&s.maraTrab,'Mara donne le boîtier');
// Capture dans le long passage : retour à une alcôve
await g.pn(()=>{window.__pn.S.canuts=false;window.__pn.G.grace=1e6});await g.placer(-20,-29.8,Math.PI/2);
verifier(await g.pn(()=>window.__pn.state==='play'),'en jeu avant la capture');await g.pn(()=>window.__pn.emit('caught'));
await g.p.waitForFunction(()=>window.__pn.state==='play',null,{timeout:30000});
const p=await g.pn(()=>[window.__pn.P.pos.x,window.__pn.P.pos.z]);verifier(Math.abs(p[0]+15.4)<.5&&p[1]<-31.5,`repli dans l'alcôve (${p.map(v=>v.toFixed(1))})`);
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Chapitre 4 : terminé.');

// Les habitants : sept personnages de plus dans les lieux (Lou et Josette dans la rue, Mme Ferro sur les toits, Léa Ferrand
// et le vieux Gaspard chez les Canuts, Marius le passeur sur les quais, Claire dans le hall de la tour), leurs dialogues,
// et les répliques des personnages existants qui changent avec la nuit et avec les archives trouvées.
// Quêtes ajoutées (S.quetes) : le message de Josette pour Rosa, les pigeons de Mme Ferro, ce que Léa cherche dans la tour.
import {THREE,V3,P,DIFF,emit,on} from './core.js';
import {S,refreshHud} from './histoire/partie.js';
import {DLG,SHAKE,openDialog} from './histoire/dialogue.js';
import {into,add,pushCol,M,glow,neon,addBox,steam} from './construire.js';
import {constructeurs,zones,zone} from './zones.js';
import {habiller,nameTag} from './personnages.js';
import {toast} from './interface.js';
import {gagner} from './pouvoirs.js';
import {aTrouve} from './exploration.js';
import * as RUE from './lieux/rue.js';
import * as TOITS from './lieux/toits.js';

/* ---------- Monter un personnage ---------- */
// def : {key, name (étiquette), nom (« Parler à … »), x, z, yaw, h, echelle}. Le dialogue porte la même clé.
function pnj(Z,def,look){
  const n=Object.assign({h:1.72,yaw:0},def);n.g=new THREE.Group();n.g.position.set(n.x,0,n.z);n.g.rotation.y=n.yaw;n.g.userData.pnj=true;add(n.g);
  n.tag=nameTag(n.name);n.tag.position.set(n.x,n.h+.55,n.z);add(n.tag);n.col=pushCol({x0:n.x-.3,x1:n.x+.3,z0:n.z-.3,z1:n.z+.3,los:false,off:false,pnj:true});
  habiller(n,look);if(n.echelle)n.g.scale.setScalar(n.echelle);Z.npcs.push(n);
  n.inter={p:new V3(n.x,0,n.z),r:2.6,on:()=>!n.absent,label:()=>'Parler à '+n.nom,act:()=>openDialog(n.key)};Z.inter.push(n.inter);return n;
}
function deplacer(n,x,z,yaw){n.x=x;n.z=z;n.yaw=yaw;n.g.position.set(x,0,z);n.g.rotation.y=yaw;n.tag.position.set(x,n.h+.55,z);Object.assign(n.col,{x0:x-.3,x1:x+.3,z0:z-.3,z1:z+.3});n.inter.p.set(x,0,z)}
const partir=()=>[{l:'(Partir)',go:null}];
const soigner=k=>{P.vie=Math.min(DIFF.vie,P.vie+k)};
const H={};
export const habitants=H; // pour les tests

/* ---------- La rue : Lou, la guetteuse, et Josette, la marchande de bugnes ---------- */
// Appelé une fois les modèles chargés (main.js), avant la préparation de la rue.
export function installerHabitantsRue(){
  const Z=RUE.Z;into(Z);
  H.lou=pnj(Z,{key:'lou',name:'LOU',nom:'Lou',x:-4.6,z:10.5,yaw:Math.PI/2,h:1.45,echelle:.84},'lou');
  H.josette=pnj(Z,{key:'josette',name:'JOSETTE',nom:'Josette',x:5.15,z:21.5,yaw:-Math.PI/2,h:1.66},'josette');
  // la charrette à bugnes : caisse, bâche rayée, enseigne, la vapeur de la friteuse
  const bois=new THREE.MeshStandardMaterial({color:0x4a2a18,roughness:.6}),bache=new THREE.MeshStandardMaterial({color:0x8a1e24,roughness:.8,side:THREE.DoubleSide});
  addBox(3.75,4.55,20.7,22.3,0,.95,bois,{los:false});addBox(3.7,4.6,20.65,22.35,.95,1.0,M.metal,{collide:false});
  for(const z of[20.75,22.25])addBox(4.48,4.56,z-.04,z+.04,1,2.3,M.darkMetal,{collide:false});
  addBox(3.55,4.7,20.6,22.4,2.28,2.33,bache,{collide:false});addBox(3.55,3.6,20.6,22.4,2.06,2.33,bache,{collide:false});
  neon('BUGNES','#ffd59a',.9,.24,3.72,1.4,21.5,-Math.PI/2,{weight:700,glow:.75});
  const friteuse=new THREE.Mesh(new THREE.CylinderGeometry(.18,.16,.16,16),M.metal);friteuse.position.set(4.25,1.08,21.1);add(friteuse);
  steam(4.25,1.15,21.1,0xd8d0c0,{n:16,rate:3,a:.1,s0:.2,s1:1.2,up:.6,life:2.5,spread:.2});
  into(null);placerLou();
}
// Au black-out, Lou se réfugie sous l'abribus.
function placerLou(){if(!H.lou)return;const c3=S.chapter===3;if(c3!==H.louC3){H.louC3=c3;if(c3)deplacer(H.lou,-5.35,5.2,Math.PI/2);else deplacer(H.lou,-4.6,10.5,Math.PI/2)}}
on('hudRafraichi',placerLou);on('apresCapture',placerLou);

Object.assign(DLG,{
 lou:{name:'Lou',entry:()=>S.chapter>=3?'c3':S.decoded?'decode':S.ch2?'ch2':S.chip?'puce':S.louVue?'retour':'start',nodes:{
  start:{t:"(Une gamine en sweat trop grand, capuche sur la tête, te jauge de haut en bas.) C'est toi, pour Mara ? Elle a dit : quelqu'un avec une main K7 et une tête de pluie. Ça colle.",act:()=>{S.louVue=true},
    c:()=>[{l:"Et toi, t'es qui ?",go:'qui'},{l:'Tu connais les drones ?',go:'drones'},{l:'(Partir)',go:null}]},
  qui:{t:"Lou. Je fais le guet pour Mara, deux crédits la nuit. Je regarde les drones, je compte les Gardiens, je siffle si ça sent mauvais.",c:()=>[{l:'À trois heures du matin ?',go:'nuit'},{l:'Les drones, alors ?',go:'drones'}]},
  nuit:{t:"Ma petite sœur dort pas quand il pleut. Son bras lui fait mal : un bras Helix Junior, trop petit pour elle maintenant. Quand je tourne en rond dans la chambre, elle pleure. Alors je sors.",c:()=>[{l:'Elle s\'appelle comment ?',go:'nina'},{l:'Les drones ?',go:'drones'}]},
  nina:{t:"Nina. Sept ans. Elle dessine des soleils. Elle en a jamais vu un vrai.",c:()=>[{l:'Les drones ?',go:'drones'},{l:'(Partir)',go:null}]},
  drones:{t:"Celui du nord fait l'aller-retour devant le labo. Quand il arrive au bout, il s'arrête et il regarde autour, en tournant la tête. C'est quand il repart qu'il faut bouger. Et accroupis-toi : ils voient moins loin, et ça fait pas de bruit.",c:()=>[{l:'Merci, Lou.',go:null}]},
  retour:{t:"Encore toi ? Le labo, c'est tout au nord. Je siffle si un drone se retourne.",c:partir},
  puce:{t:"T'as fait quoi ? Les drones sont devenus dingues, ils vont deux fois plus vite. Colle-toi aux murs et ramène ça à Mara, vite.",c:partir},
  ch2:{t:"(Elle siffle doucement en voyant le pistolet.) Mara t'aime bien, alors. Le drone au-dessus de la rue, celui en maintenance, il dort. Les deux autres, non. Vise l'œil, celui qui brille.",c:partir},
  decode:{t:"Tous les écrans du quartier ont clignoté en même temps. Les gens sont sortis sur les balcons, ils regardent leurs mains. Qu'est-ce qui se passe ?",c:()=>[{l:'Helix ne peut plus les éteindre. Pour l\'instant.',go:'decode2'}]},
  decode2:{t:"Pour l'instant ? (Elle remonte sa capuche.) J'aime pas quand les adultes disent « pour l'instant ».",c:partir},
  c3:{t:"(Recroquevillée sous l'abribus, elle tremble.) Ils ont coupé le courant de tout le quartier. Nina s'est réveillée en hurlant : son bras s'est arrêté une seconde, puis il est reparti. Elle dit qu'il y avait quelqu'un dedans.",
    c:()=>[{l:'Rentre chez toi, Lou. Reste avec elle.',go:'c3b'},{l:'Je vais les arrêter.',go:'c3c'}]},
  c3b:{t:"Je peux pas, il y a des Gardiens devant la porte. Je reste là, sous le toit. La lumière de la Faucheuse passe pas dessous.",c:partir},
  c3c:{t:"Promis ? (Elle te regarde comme si c'était vraiment possible.) Alors vas-y. Je surveille le ciel.",c:partir},
 }},
 josette:{name:'Josette',entry:()=>S.chapter>=3?(S.josetteMsg?'c3apres':'c3'):S.josetteVue?'retour':'start',nodes:{
  start:{t:"Bugnes chaudes ! Deux crédits le cornet. (Sa main gauche, une K7 aux phalanges dorées, saupoudre le sucre avec une précision de machine.) La seule chose sucrée de Lyon-Basse, à cette heure-ci.",act:()=>{S.josetteVue=true},
    c:()=>[{l:'Un cornet. (2 crédits)',if:()=>S.credits>=2,go:'cornet'},{l:'Des nouvelles du quartier ?',go:'potins'},{l:'(Partir)',go:null}]},
  retour:{t:"Te revoilà. Un cornet ? C'est le meilleur remède contre la pluie. Et contre le reste.",
    c:()=>[{l:'Un cornet. (2 crédits)',if:()=>S.credits>=2,go:'cornet'},{l:'Des nouvelles ?',go:'potins'},{l:'(Partir)',go:null}]},
  cornet:{t:"(C'est chaud, sucré, ça colle aux doigts. La pluie a moins le goût de suie.) Ça va mieux, hein ? Le sucre, c'est la seule chose qu'Helix n'a pas encore réussi à louer.",
    act:()=>{S.credits-=2;soigner(40);refreshHud()},c:()=>[{l:'Des nouvelles ?',go:'potins'},{l:'(Partir)',go:null}]},
  potins:{t:()=>S.ch2?"Ça tombe, là-haut. Des drones. Les gamins ramassent les morceaux pour les revendre aux Canuts. Fais attention, ceux qui restent sont nerveux.":
      S.chip?"On dit que quelqu'un est entré au labo Helix. Moi j'ai rien vu. Je vois jamais rien : c'est pour ça que je vends encore des bugnes.":
      "Kovac ? Il a des oreilles partout, celui-là. Fais attention à ce que tu lui dis : ça ressort toujours ailleurs. Et la Mara, elle a perdu son frère sur le chantier de la tour, il y a quatre ans. Depuis, elle dort le jour.",
    c:()=>[{l:'Un cornet. (2 crédits)',if:()=>S.credits>=2,go:'cornet'},{l:'(Partir)',go:null}]},
  c3:{t:"(Elle rabat la bâche de sa charrette.) Je ferme, couvre-feu. Tiens, c'est offert. (Elle te tend un cornet tiède.) Mange, t'en auras besoin.",act:()=>soigner(40),c:()=>[{l:'Merci, Josette.',go:'c3b'}]},
  c3b:{t:"Si tu montes là-haut, à la Croix-Rousse, et que tu croises ma petite sœur, dis-lui que Josette pense à elle. Rosa. Rosa Delorme. Elle a toujours voulu changer le monde. Moi, je voulais juste faire des bugnes.",
    act:()=>{if(!S.josetteMsg){S.josetteMsg=true;toast('Un message de Josette pour sa sœur, Rosa Delorme')}},c:()=>[{l:'Je lui dirai.',go:null}]},
  c3apres:{t:"T'es encore là ? File. Et n'oublie pas Rosa.",act:()=>soigner(20),c:partir},
 }},
});

/* ---------- Les personnages de la rue, qui changent avec la nuit et les archives ---------- */
// Mara : son frère, si l'on a trouvé l'avis de décès ou la facture de l'enseigne
const eliasConnu=()=>(aTrouve('rue10')||aTrouve('rue11'))&&!S.eliasDit;
for(const k of['remind','ch2','batReady']){const n=DLG.mara.nodes[k],c0=n.c;n.c=()=>[{l:"Elias, c'était ton frère ?",if:eliasConnu,go:'elias'},...c0()]}
Object.assign(DLG.mara.nodes,{
  elias:{t:"(Elle s'arrête de fumer. Long silence.) Qui t'a parlé d'Elias ? … Peu importe. Oui. Il posait des vitres sur le chantier de la tour. Le jour de la grève, Helix a coupé les jambes de tout l'échafaudage. Il était au neuvième étage. (Elle écrase sa cigarette.) On a du travail, Ash.",
    act:()=>{S.eliasDit=true},c:partir},
});
SHAKE.add('elias');
// Kovac : au chapitre 2, et ses secrets (la carte de partenaire Helix, la carte postale de Nadia)
const kovacE1=DLG.kovac.entry;
DLG.kovac.entry=()=>S.chapter===3&&S.kovacSecret&&!S.kovacAide&&!S.kovacVerite?'c3secret':S.chapter<3&&S.ch2?'ch2k':kovacE1();
const kovacPlus=()=>[{l:"J'ai trouvé ta carte de partenaire Helix.",if:()=>aTrouve('rue12')&&!S.kovacIndic,go:'indic'},{l:"Nadia t'attend à Marseille.",if:()=>aTrouve('rue13')&&!S.nadiaDit,go:'nadia'}];
{const n=DLG.kovac.nodes.after,c0=n.c;n.c=()=>[...kovacPlus(),...c0()]}
Object.assign(DLG.kovac.nodes,{
  ch2k:{t:"(Il regarde par la vitre un drone qui tombe en vrille.) C'est toi, le feu d'artifice ? Les clients adorent. Moi j'adore moins : les drones morts, Helix les facture au quartier.",c:()=>[...kovacPlus(),{l:'(Partir)',go:null}]},
  indic:{t:"(Il pose le verre. Sa main tremble, un peu.) Six ans. Six ans à leur raconter qui se réunissait chez qui. Ils entretenaient ma main en échange. Un jour, j'ai entendu le nom d'un gamin du quartier dans leur bouche. J'ai arrêté. Depuis, elle tremble. (Il te regarde.) Tu vas le dire à Mara ?",
    act:()=>{S.kovacIndic=true},c:()=>[{l:'Non. Ça te regarde.',go:'indicNon'},{l:'Ça dépend de ce que tu fais cette nuit.',go:'indicOui'}]},
  indicNon:{t:"(Il hoche la tête, lentement.) Je m'en souviendrai. Kovac paie toujours ses dettes. Même celles qu'on ne lui réclame pas.",act:()=>{S.kovacSecret=true},c:partir},
  indicOui:{t:"Évidemment. Tout le monde a un prix, ici. (Il essuie le comptoir trop fort.) Le mien, c'était une main qui marche.",c:partir},
  nadia:{t:"(Il te regarde longtemps.) T'as lu ma carte. (Il soupire.) Elle a une chambre pour moi, avec vue sur la mer. Moi, j'ai une main qui appartient à Helix et un bar qui sent la pluie. Si la nuit se passe bien… peut-être. Va, maintenant.",act:()=>{S.nadiaDit=true},c:partir},
  // au black-out, s'il a gardé son secret : la dette est payée
  c3secret:{t:"(Il a éteint ses néons à la main.) Toi. Tu n'as rien dit à personne. (Il montre l'arrière-boutique.) L'escalier des toits est derrière. On est quittes.",
    act:()=>{S.kovacAide=true;toast("Kovac déverrouille la porte de l'arrière-boutique.");emit('save');refreshHud()},c:()=>[{l:'Merci, Kovac. (Partir)',go:null}]},
});
SHAKE.add('indicOui');
// Nox : au chapitre 2, et le fichier du premier jour
const noxE1=DLG.nox.entry;
DLG.nox.entry=()=>S.chapter<3&&S.ch2?'ch2n':noxE1();
const noxPlus=()=>[{l:"Tu m'as enregistré, le premier jour ?",if:()=>aTrouve('rue17')&&!S.nox0412,go:'f0412'}];
{const n=DLG.nox.nodes.start,c0=n.c;n.c=()=>[...noxPlus(),...c0()]}
Object.assign(DLG.nox.nodes,{
  ch2n:{t:"Des drones abattus. Je les enregistre en tombant : ils font tous le même bruit. Une note de musique, et puis plus rien.",
    c:()=>[...noxPlus(),{l:'Tiens, 10 crédits.',if:()=>S.credits>=10&&!S.noxPaid,go:'paid'},{l:'(Partir)',go:null}]},
  f0412:{t:"Fichier 0412. La personne sous l'enseigne violette, des bandages au poignet. Je ne l'ai pas transmis. (Ses optiques clignotent.) J'ai une préférence pour les gens qui regardent leur main comme si elle allait leur parler.",act:()=>{S.nox0412=true},c:partir},
});
// Sid : la grille a servi, et le premier drone tombé
const sidE1=DLG.sid.entry;
DLG.sid.entry=()=>S.ch2?'ch2s':S.chip?'puceS':sidE1();
Object.assign(DLG.sid.nodes,{
  puceS:{t:"T'es passé par ma grille ? (Il rit, puis tousse.) Trente ans que j'attendais que quelqu'un s'en serve. Allez, file. Ça sent le drone énervé.",c:partir},
  ch2s:{t:"J'ai vu tomber un drone, tout à l'heure. Je l'ai regardé longtemps, par terre, qui clignotait. On croit que c'est éternel, ces machins-là. (Il tend les mains vers le feu.) Rien n'est éternel. Même pas Helix.",c:partir},
});

/* ---------- Les toits : Mme Ferro et ses pigeons ---------- */
{const c0=constructeurs.toits;constructeurs.toits=()=>{c0();const Z=zones.toits;into(Z);
  H.ferro=pnj(Z,{key:'ferro',name:'MME FERRO',nom:'Mme Ferro',x:13,z:6,yaw:-Math.PI/2,h:1.6},'ferro');
  // la cage à pigeons
  const fer=new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.5,metalness:.7});
  addBox(13.6,15,6.9,7.9,0,.08,fer,{collide:false});addBox(13.6,15,6.9,7.9,.9,.96,fer,{collide:false});
  for(const[x,z]of[[13.6,6.9],[15,6.9],[13.6,7.9],[15,7.9]])addBox(x-.025,x+.025,z-.025,z+.025,0,.96,fer,{collide:false});
  const grillage=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.88),new THREE.MeshStandardMaterial({color:0x6a6e74,roughness:.6,metalness:.5,transparent:true,opacity:.35,side:THREE.DoubleSide}));grillage.position.set(14.3,.5,6.9);add(grillage);
  pushCol({x0:13.6,x1:15,z0:6.9,z1:7.9,los:false,off:false});
  const plume=new THREE.MeshStandardMaterial({color:0x6c6f78,roughness:.8}),tete=new THREE.MeshStandardMaterial({color:0x3e4a52,roughness:.6});
  H.pigeons=[];for(let i=0;i<5;i++){const p=new THREE.Group(),c=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),plume);c.scale.set(1,.85,1.5);p.add(c);
    const t=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),tete);t.position.set(0,.07,.12);p.add(t);
    p.position.set(13.8+i*.28,.16,7.2+(i%2)*.35);p.rotation.y=i*1.3;add(p);H.pigeons.push({g:p,o:p.position.clone(),t:-1,a:i*1.3})}
  into(null);majPigeons(0)}}
// Les pigeons libérés s'envolent en spirale et disparaissent dans la pluie.
function majPigeons(dt){if(!H.pigeons)return;const libres=!!S.quetes.pigeons;
  for(const p of H.pigeons){if(!libres){p.t=-1;p.g.visible=true;p.g.position.copy(p.o);continue}
    if(p.t<0)p.t=H.envol?0:9;p.t+=dt;const k=p.t;p.g.visible=k<6;if(!p.g.visible)continue;
    p.g.position.set(p.o.x+Math.sin(p.a+k*2.2)*k*1.6,p.o.y+k*k*.9+k*.8,p.o.z+Math.cos(p.a+k*2.2)*k*1.6);p.g.rotation.y=p.a+k*2.2+Math.PI/2}}
{const u0=TOITS.Z.update;TOITS.Z.update=(dt,s)=>{if(u0)u0(dt,s);majPigeons(dt)}}
on('apresCapture',()=>{H.envol=false;majPigeons(0)});
DLG.ferro={name:'Mme Ferro',entry:()=>S.quetes.pigeons?'apres':S.faucheuses.includes('toits:0')?'liberes':S.ferroVue?'retour':'start',nodes:{
  start:{t:"(Une vieille dame en manteau, sous un parapluie percé, glisse des graines entre les barreaux d'une cage.) N'aie pas peur. Ici, les seuls qui mordent, ce sont eux, là-haut. (Elle montre la Faucheuse du menton.)",act:()=>{S.ferroVue=true},
    c:()=>[{l:"Qu'est-ce que tu fais sur un toit, à cette heure ?",go:'toit'},{l:'Tu connais un chemin ?',go:'chemin'},{l:'(Partir)',go:null}]},
  toit:{t:"J'habite en dessous depuis cinquante-deux ans. Mes pigeons ne veulent plus sortir depuis que cette machine tourne. La lumière les rend fous. Moi aussi, un peu.",c:()=>[{l:'Et si elle tombait ?',go:'tombe'},{l:'Un chemin, pour passer ?',go:'chemin'}]},
  tombe:{t:"Tomber ? (Elle rit, un rire de papier.) Mon mari disait qu'il n'y a que ce qui vole qui tombe. Si tu la fais tomber, reviens me voir. J'ouvrirai la cage.",c:partir},
  chemin:{t:"Les citernes. La lumière ne passe pas dessous, j'ai regardé. Et la planche entre les deux toits du fond, elle tient : c'est mon mari qui l'a posée, en 2019. Après, il y a l'enseigne, et la trappe de Sid.",c:()=>[{l:'Merci.',go:null}]},
  retour:{t:"Toujours là ? Ne reste pas à découvert. Cette lumière cherche les gens.",c:partir},
  liberes:{t:"C'est toi qui l'as descendue ? (Elle regarde longtemps la fumée, puis ouvre la cage. Les pigeons hésitent, puis s'envolent d'un coup dans la pluie.) Cinquante-deux ans que je les nourris. Ils n'avaient jamais eu peur du ciel, avant. Merci.",
    act:()=>{if(!S.quetes.pigeons){S.quetes.pigeons=true;H.envol=true;setTimeout(()=>gagner(60,'les pigeons de Mme Ferro'),400);emit('save')}},c:partir},
  apres:{t:"Ils reviendront. Les pigeons reviennent toujours. Pas comme les gens.",c:partir},
}};

/* ---------- Chez les Canuts : Léa Ferrand et le vieux Gaspard ---------- */
{const c0=constructeurs.traboules;constructeurs.traboules=()=>{c0();const Z=zones.traboules;into(Z);
  H.lea=pnj(Z,{key:'lea',name:'LÉA FERRAND',nom:'Léa',x:-43.6,z:-58.6,yaw:Math.PI*.15,h:1.66},'lea');
  H.gaspard=pnj(Z,{key:'gaspard',name:'GASPARD',nom:'Gaspard',x:-33.6,z:-50.6,yaw:-Math.PI/2,h:1.7},'gaspard');
  into(null)}}
const g12=()=>['rue5','rue18','toits2','trab5','trab13','quais6'].filter(aTrouve).length;
DLG.lea={name:'Léa Ferrand',entry:()=>S.leaDemande?'attente':'start',nodes:{
  start:{t:"(Une jeune femme en veste de pluie, une affichette pliée dans la main, se lève quand tu entres.) Tu viens de la rue ? Je cherche mon frère, Théo Ferrand. Agent Helix, matricule 12. Ils disent qu'il est en soins depuis le 3 mars. Personne ne veut me dire où.",
    c:()=>[{l:"J'ai vu ton affiche, rue des Tanneurs.",if:()=>aTrouve('rue18'),go:'affiche'},{l:'Je crois savoir ce qui lui est arrivé.',if:()=>g12()>=2,go:'verite'},{l:"Je n'ai rien vu. Pas encore.",go:'rien'},{l:'(Partir)',go:null}]},
  affiche:{t:"Il en reste une ? Je les ai collées partout, la nuit, entre deux rondes. (Elle sourit, sans joie.) Les Gardiens les arrachent le matin. Ce sont ses collègues. Ils baissent les yeux quand ils me croisent.",c:()=>[{l:'Je vais chercher.',go:'cherche'}]},
  verite:{t:"(Tu lui racontes : l'armure verrouillée en pleine ronde, le même interrupteur que les K7.) … Il le savait. Il me l'a dit au téléphone, une semaine avant : « Léa, nos coquilles ont un bouton, comme leurs mains. » Je lui ai répondu qu'il était fatigué.",c:()=>[{l:'Il était en train de comprendre.',go:'cherche'}]},
  rien:{t:"Personne n'a rien vu. C'est fou, ce qu'on voit peu, dans cette ville.",c:()=>[{l:'Je vais chercher.',go:'cherche'},{l:'(Partir)',go:null}]},
  cherche:{t:"Si tu montes à la tour, cherche. Un étage, un nom, une porte. N'importe quoi. Rosa m'a donné une oreillette, comme à toi. Je saurai.",
    act:()=>{if(!S.leaDemande){S.leaDemande=true;toast('Léa Ferrand : trouver où Helix garde son frère, dans la tour')}},c:()=>[{l:'Promis.',go:null}]},
  attente:{t:"Rien encore ? Les Gardiens parlent, parfois, sur leur radio. Écoute-les. Et regarde les plans, dans la tour : les étages qu'on ne montre pas.",c:partir},
}};
SHAKE.add('rien');
// La quête de Léa se conclut dans la tour : le plan de l'étage -3 ou l'ordre de transfert
on('archiveLue',a=>{if(S.leaDemande&&!S.quetes.lea&&(a.id==='tour15'||a.id==='tour6')){S.quetes.lea=true;
  setTimeout(()=>{toast("Rosa, dans l'oreillette : « Étage moins trois. J'ai prévenu Léa. Les Canuts iront le chercher. »");gagner(60,'Léa sait où est Théo')},1200)}});
DLG.gaspard={name:'Gaspard',entry:()=>S.carte?'tisse':S.gaspardVu?'retour':'start',nodes:{
  start:{t:"(Un vieil homme en veste de velours, chapeau sur la tête, assis près d'un métier à bras. Ses mains sont à lui, tordues comme des racines.) Approche. À mon âge, on parle aux jeunes ou on parle aux murs, et les murs d'ici en savent déjà trop.",act:()=>{S.gaspardVu=true},
    c:()=>[{l:'Qui es-tu ?',go:'qui'},{l:'Raconte-moi les canuts.',go:'canuts'},{l:'(Partir)',go:null}]},
  qui:{t:"Gaspard. Tisseur, fils de tisseur. Mon arrière-arrière-grand-père a fait 1834 avec un Delorme, l'ancêtre de Rosa. Moi, j'ai fait la grève de 2037, avec mes mains. Celles-là, Helix ne les a jamais eues.",c:()=>[{l:'Raconte-moi les canuts.',go:'canuts'},{l:'(Partir)',go:null}]},
  canuts:{t:"1831 : ils réclament un tarif, on leur envoie l'armée. 1834 : ils recommencent, on les massacre dans ces escaliers. Ils tissaient la soie des rois et dormaient sur la paille. (Il tapote le métier.) Aujourd'hui, on tisse des clés. C'est un progrès.",c:()=>[{l:'Une clé ? Dans un tissu ?',go:'cle'},{l:'(Partir)',go:null}]},
  cle:{t:"Les métiers Jacquard lisent des cartes percées : un trou, l'aiguille passe, le fil se lève. Un tissu, c'est un programme. Et un programme, ça peut ouvrir une porte. (Il baisse la voix.) Retiens ça : le métier lit les cartes à l'envers, comme dans un miroir. Les pressés tissent tout de travers.",c:()=>[{l:'Merci, Gaspard.',go:null}]},
  retour:{t:"Encore là ? Le métier de la dame Varga est au fond de son atelier. Les cartes, dans le tiroir. Et regarde bien le carnet.",c:partir},
  tisse:{t:"(Il prend le ruban de soie rouge et or, le tourne entre ses doigts.) Belle clé. Serrée, régulière. Les anciens auraient été fiers. Va, maintenant. Et quand tu l'auras tournée, cette clé, viens nous le dire.",c:partir},
}};
// Rosa : le message de sa sœur Josette
{const r0=DLG.rosa.entry;DLG.rosa.entry=()=>S.rosaVue&&S.josetteMsg&&!S.quetes.josette?'josette':r0();
 DLG.rosa.nodes.josette={t:"Josette ? (Rosa s'arrête, un outil à la main.) Ma grande sœur. Elle fait encore ses bugnes sous la pluie, au coin de la rue des Tanneurs ? … Elle a toujours dit que je ne changerais rien au monde. (Un temps.) Dis-lui que je viendrai lui en acheter, après six heures. Si on est encore là.",
   act:()=>{if(!S.quetes.josette){S.quetes.josette=true;setTimeout(()=>gagner(60,'le message de Josette'),400)}},c:()=>[{l:'(Continuer)',go:r0()}]}}
// Varga : la patiente 31, si l'on a lu son journal du labo
{const n=DLG.varga.nodes.attente,c0=n.c;n.c=()=>[{l:"J'ai lu ton journal. La patiente 31.",if:()=>aTrouve('rue7')&&!S.varga31,go:'p31'},...c0()];
 DLG.varga.nodes.p31={t:"(Elle retire ses lunettes.) Vous l'avez lu. … Elle s'appelait Sophie Arnaud. Elle a pleuré, puis elle a ri, puis elle a voulu toucher toutes les choses du labo, une par une. C'est ce jour-là que j'aurais dû partir. Je suis restée pour en voir d'autres comme elle. J'ai vu autre chose.",
   act:()=>{S.varga31=true},c:()=>[{l:'(Continuer)',go:'attente'}]}}

/* ---------- Les quais : Marius, le passeur ---------- */
{const c0=constructeurs.quais;constructeurs.quais=()=>{c0();const Z=zones.quais;into(Z);
  H.marius=pnj(Z,{key:'marius',name:'MARIUS',nom:'Marius',x:-4.9,z:-15.5,yaw:-Math.PI/2+.3,h:1.78},'marius');
  // sa péniche, amarrée le long du quai
  const coque=new THREE.MeshStandardMaterial({color:0x1d2328,roughness:.6,metalness:.4}),pont=new THREE.MeshStandardMaterial({color:0x3a2c20,roughness:.8});
  addBox(-10.6,-7.8,-21,-10,-.6,.55,coque,{collide:false});addBox(-10.4,-8,-20.6,-10.4,.55,.6,pont,{collide:false});
  addBox(-10,-8.4,-13.4,-11,.6,2.1,coque,{collide:false});addBox(-10.05,-8.35,-13.45,-10.95,2.1,2.2,M.darkMetal,{collide:false});
  const hublot=new THREE.Mesh(new THREE.CircleGeometry(.18,14),glow(0xffb347,1.3));hublot.position.set(-8.38,1.4,-12.2);hublot.rotation.y=Math.PI/2;add(hublot);
  neon('RHODANIE','#9fd8ff',1.8,.36,-7.78,.25,-15.5,Math.PI/2,{weight:600,glow:1.2});
  into(null)}}
DLG.marius={name:'Marius',entry:()=>S.faucheuses.includes('quais:0')?'abattue':S.mariusVu?'retour':'start',nodes:{
  start:{t:"(Un homme en caban, le bras gauche en K7 posé sur la rambarde du quai, fume sous la pluie à côté de sa péniche.) T'es pas du quai, toi. Ça se voit à la façon dont tu regardes l'eau : comme si elle allait te mordre.",act:()=>{S.mariusVu=true},
    c:()=>[{l:'Qu\'est-ce que tu transportes ?',go:'peniche'},{l:"Comment j'entre dans la tour ?",go:'tour'},{l:'(Partir)',go:null}]},
  peniche:{t:"Ce qu'on me paie pour ne pas regarder. Cette nuit, des caisses de Genève, avec une étoile dessus. J'en ai ouvert une, par curiosité professionnelle. Des yeux. Des milliers d'yeux, dans des boîtes, qui descendent à Marseille.",c:()=>[{l:'Des yeux Helix ?',go:'aster'},{l:'Et la tour ?',go:'tour'}]},
  aster:{t:"Pas Helix. Plus haut que ça. Le type qui m'a payé avait un accent suisse et des gants. Quand les gens portent des gants en pleine nuit, je ne pose pas de questions.",c:()=>[{l:'Et la tour ?',go:'tour'},{l:'(Partir)',go:null}]},
  tour:{t:"Par le quai de chargement, au bout. Deux Gardiens, deux caméras. Les caméras balaient de gauche à droite : quand elles regardent l'eau, tu passes. Et l'autre machine, là-haut… (Il crache dans la Saône.) Ses réacteurs sont à nu. Un ami à moi l'entretenait. Il dit qu'une arme de poing suffirait, si on vise bien.",c:()=>[{l:'Merci, Marius.',go:null}]},
  retour:{t:"Toujours pas entré ? Le quai de chargement, au bout. Et regarde où vont les caméras.",c:partir},
  abattue:{t:"(Il regarde la carcasse qui fume, au bout du quai.) C'est toi ? … Elle a failli me couler. (Un temps. Il sourit, pour la première fois.) Ça valait le coup.",c:partir},
}};

/* ---------- Le hall de la tour : Claire, de l'entretien ---------- */
{const c0=constructeurs.tour;constructeurs.tour=()=>{c0();const Z=zones.tour;into(Z);
  H.claire=pnj(Z,{key:'claire',name:'CLAIRE',nom:'Claire',x:4.4,z:7.5,yaw:Math.PI,h:1.66},'claire');
  const seau=new THREE.Mesh(new THREE.CylinderGeometry(.16,.13,.3,14,1,true),new THREE.MeshStandardMaterial({color:0x2d5a8a,roughness:.5,side:THREE.DoubleSide}));seau.position.set(4.95,.15,7.9);add(seau);
  into(null)}}
DLG.claire={name:'Claire',entry:()=>S.claireVue?'retour':'start',nodes:{
  start:{t:"(Une femme en blouse grise se redresse derrière le comptoir de l'accueil, un seau à la main. Elle te dévisage, puis regarde ta main.) Chut. Si tu cherches l'ascenseur, c'est au fond, à gauche. Si tu cherches les ennuis, c'est partout.",act:()=>{S.claireVue=true},
    c:()=>[{l:'Tu travailles ici ?',go:'ici'},{l:'Le 41e étage ?',go:'etage'},{l:'(Partir)',go:null}]},
  ici:{t:"Entretien, la nuit, depuis neuf ans. Je lave le marbre, je vide les corbeilles du directeur, je ne lis rien. (Elle sourit.) Je lis tout. Il a quatorze costumes, tous pareils. Et il y a un bouton moins trois, dans l'ascenseur de service, que personne n'a le droit de toucher.",c:()=>[{l:'Moins trois ?',go:'moinstrois'},{l:'Le 41e ?',go:'etage'}]},
  moinstrois:{t:"Je suis descendue une fois, par erreur. Une salle froide, et des armures debout contre le mur, comme des vêtements dans une penderie. Quatorze. Il y en a une qui frappait, très doucement, de l'intérieur. (Elle serre son seau.) Je suis remontée. Je n'en ai parlé à personne. Jusqu'à toi.",c:()=>[{l:'Le 41e ?',go:'etage'},{l:'(Partir)',go:null}]},
  etage:{t:"Le couloir du 41e a des grilles laser. Elles s'allument par cycles, mais il y a un boîtier sur le palier, en sortant de l'ascenseur. Une balle dedans, et elles s'éteignent. L'équipe technique râle depuis des mois : il est à découvert.",c:()=>[{l:'Merci, Claire.',go:null}]},
  retour:{t:"Va. Et si quelqu'un demande, je n'ai vu personne.",c:partir},
}};

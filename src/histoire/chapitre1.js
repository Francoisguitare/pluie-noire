// Chapitres 1 (« La puce ») et 2 (« Le décodeur ») : la rue, le labo, les drones, la batterie, le décodeur de Mara.
import {V3,P,MOBILE,state,on,emit} from '../core.js';
import {tone} from '../son.js';
import {toast,showHit} from '../interface.js';
import {DLG,SHAKE,openDialog} from './dialogue.js';
import {S,defineChapter,defineEnds,finish,refreshHud,heure} from './partie.js';
import {Z,H,insideLab} from '../lieux/rue.js';
import {reviveDrone,killDrone} from '../drones.js';
import {setArmed,lockHand} from '../joueur.js';

const kills=()=>S.dd.filter(Boolean).length;
Z.talk=key=>openDialog(key);

/* ---------- Actions ---------- */
function openDoor(){S.door=true;H.doorCol.off=true;H.keyLed.material.color.setHex(0x4dff9a).multiplyScalar(2);H.doorStrip.material.color.setHex(0x4dff9a).multiplyScalar(2);
  tone(880,.08,'square',.04);setTimeout(()=>tone(1320,.12,'square',.04),90);toast('Code 0451 accepté. La porte s\'ouvre.');emit('save')}
function takeChip(){S.chip=true;heure(3*60+40);H.chip.visible=false;H.chipShaft.visible=false;tone(1500,.1,'triangle',.06);setTimeout(()=>tone(400,.5,'sawtooth',.05,160),180);
  for(const p of H.ceilPanels)p.material.color.setHex(0xff2020).multiplyScalar(2);
  toast('Puce récupérée. Alerte silencieuse : les drones accélèrent.');refreshHud();emit('save')}
function takeBattery(){S.battery=true;H.battery.visible=false;H.batLight.intensity=0;tone(500,.1,'triangle',.05);setTimeout(()=>tone(750,.12,'triangle',.05),90);toast('Batterie récupérée. Rapporte-la au décodeur de Mara.');refreshHud();emit('save')}
function plugBattery(){S.decoded=true;H.decLumiere.intensity=1.1;H.decLed.material.color.setHex(0x4dff9a).multiplyScalar(2.2);H.decScreen.material.color.setHex(0x58e6ff).multiplyScalar(1.6);
  tone(200,1.2,'sawtooth',.04,900);setTimeout(()=>tone(1200,.15,'triangle',.05),1100);setTimeout(()=>{if(state==='play')openDialog('mara','end2')},1500)}
function giveWeapon(){if(S.armed)return;S.ch2=true;S.armed=true;setArmed(true);tone(600,.08,'square',.03);setTimeout(()=>tone(900,.06,'square',.03),70);refreshHud()}
function openGate(silent){S.gate=true;H.gateCol.off=true;for(const l of H.gateLasers)l.visible=false;H.gateLight.intensity=0;
  if(!silent){tone(320,.9,'sawtooth',.06,40);toast('Le réseau de drones est tombé : la grille laser du dépôt est coupée.');refreshHud();emit('save')}}
function closeGate(){S.gate=false;H.gateCol.off=false;for(const l of H.gateLasers)l.visible=true;H.gateLight.intensity=1.5}
function teleport(x,z,yaw,msg){emit('teleport',x,z,yaw,msg)}

on('droneKilled',(d,instant)=>{
  if(d.zone!==Z)return;S.dd[d.idx]=true;if(instant)return;
  const k=kills();showHit();
  setTimeout(()=>{toast(k<3?`Drone neutralisé · ${k}/3`+(k===1&&d.tut?' · Les deux autres patrouillent au nord, vise le capteur.':''):'Drone neutralisé · 3/3');if(k===3)setTimeout(()=>openGate(false),900)},250);
  refreshHud();emit('save');
});

/* ---------- Interactions du décor ---------- */
Z.inter.push({p:new V3(1.65,0,-39.4),r:2.3,on:()=>!S.door&&!insideLab(P.pos),
  label:()=>S.code?'Saisir le code 0451':'Clavier de la porte',
  act:()=>{if(S.code){openDoor()}else{tone(180,.18,'square',.05);toast("Accès refusé. Il te faut le code : Kovac le vend, au bar à nouilles.")}}});
Z.inter.push({p:new V3(-8.7,0,-44),r:2.2,on:()=>!insideLab(P.pos),label:()=>"Forcer la grille d'aération",
  act:()=>{tone(90,.25,'sawtooth',.06);teleport(-6.7,-44,-Math.PI/2,"Tu te glisses dans le conduit.")}});
Z.inter.push({p:new V3(-7,0,-44),r:2.0,on:()=>insideLab(P.pos),label:()=>'Ressortir par la grille',act:()=>{teleport(-9.4,-44,Math.PI/2,'')}});
Z.inter.push({p:new V3(17.1,0,-35.5),r:2.3,on:()=>S.gate&&!S.battery,label:()=>'Prendre la batterie',act:takeBattery});
Z.inter.push({p:new V3(-5,0,17.6),r:2.2,on:()=>S.ch2&&!S.decoded,label:()=>S.battery?'Brancher la batterie sur le décodeur':'Décodeur de Mara (batterie vide)',
  act:()=>{if(S.battery)plugBattery();else toast("Le décodeur est éteint. Il lui faut une batterie du dépôt Helix.")}});
Z.inter.push({p:new V3(8.6,0,-35.5),r:2.2,on:()=>!S.gate,label:()=>'Grille laser du dépôt',act:()=>toast(S.ch2?`Grille alimentée par les drones du quartier : ${kills()}/3 neutralisés.`:'Grille laser sous tension. Impossible de passer.')});
Z.inter.push({p:new V3(0,0,-49),r:2.2,on:()=>!S.chip,label:()=>'Prendre la puce',act:takeChip});
Z.inter.push({p:new V3(4,0,-50.4),r:2.2,label:()=>'Lire le terminal',act:()=>openDialog('terminal')});

/* ---------- Dialogues ---------- */
const backMara=()=>[{l:"Qu'est-ce qu'elle fait, cette puce ?",go:'what'},{l:"Comment j'entre dans le labo ?",go:'how'},{l:"Combien tu payes ?",go:'pay'},{l:"D'accord. J'y vais.",go:'accept'}];
const kovacPrice=()=>[{l:'Payer 60 crédits',if:()=>S.credits>=60,go:'paid'},{l:"Mara te le revaudra.",go:'p1'},{l:"Donne-le-moi, ou je repeins le comptoir avec toi.",go:'threat'},{l:"Je repasserai. (Partir)",go:null}];
Object.assign(DLG,{
 mara:{name:'Mara',entry:()=>S.ch2?(S.battery?'batReady':'ch2'):S.chip?'final':S.quest?'remind':'start',nodes:{
  start:{t:"T'es en retard, Ash. Helix a sorti un prototype de son labo cette nuit : une puce neurale. Je la veux avant l'aube.",c:backMara},
  what:{t:"Officiellement, elle corrige les tremblements des augmentés. Officieusement, elle permet à Helix de couper une prothèse à distance. La tienne, par exemple.",c:backMara},
  how:{t:"La porte a un code. Kovac, au bar à nouilles sur ta droite, vend ce genre d'information. Et les drones de patrouille n'aiment pas les curieux : reste dans leur dos.",c:backMara},
  pay:{t:"Deux mille crédits à la livraison. Pour l'instant t'en as quatre-vingts. Ça devrait suffire pour graisser Kovac.",c:backMara},
  accept:{t:"Le labo est au bout de la rue, au nord. Si un drone te voit trop longtemps, tout le quartier est bouclé. Ne me fais pas attendre.",act:()=>{if(!S.quest){S.quest=true;toast('Nouvel objectif : entrer dans le labo Helix')}},c:()=>[{l:'(Partir)',go:null}]},
  remind:{t:()=>S.code?"Tu as le code. Qu'est-ce que tu attends ? Le labo, c'est tout au nord.":"Le code de la porte, c'est Kovac qui l'a. Le bar à nouilles, sur ta droite en remontant la rue.",c:()=>[{l:'(Partir)',go:null}]},
  final:{t:"Tu l'as ? Montre.",c:()=>[{l:"La voilà. (Donner la puce)",go:'gift'},{l:"Avant ça : c'est qui, ton client ?",go:'who'},{l:"Je la garde.",go:'keep1'}]},
  // Refus : Mara verrouille la main K7 d'Ash avec une copie du kill-switch. La partie continue, mais S.forced reste.
  keep1:{t:"(Mara ne discute pas. Elle sort de sa poche un boîtier noir, pas plus gros qu'un briquet, et pose le pouce dessus.) Regarde ta main, Ash.",act:()=>lockHand(true),c:()=>[{l:"Qu'est-ce que tu m'as fait ?",go:'keep2'}]},
  keep2:{t:"(Tes doigts se replient tout seuls. Tu ne les sens plus.) Le kill-switch d'Helix. Un de leurs techniciens m'en a vendu une copie il y a deux ans. Ta main droite est une K7, comme la moitié des mains de ce quartier. Tu croyais vraiment que je confiais un boulot pareil sans assurance ?",c:()=>[{l:"Débloque-la. Tout de suite.",go:'keep3'},{l:"T'es pire qu'Helix.",go:'keep3b'}]},
  keep3:{t:"Quand j'aurai la puce. (Elle tend sa main libre, paume ouverte.) Je ne te le demanderai pas deux fois.",c:()=>[{l:"(Lui donner la puce)",go:'keepGive'}]},
  keep3b:{t:"Peut-être. Sauf qu'Helix ne te la rendrait jamais, ta main. Moi, si. (Elle tend sa main libre, paume ouverte.) La puce.",c:()=>[{l:"(Lui donner la puce)",go:'keepGive'}]},
  keepGive:{t:"(Elle glisse la puce dans sa poche et appuie de nouveau sur le boîtier. Tes doigts se remettent à répondre, un par un.) Voilà. On repart sur de bonnes bases.",act:()=>{S.forced=true;lockHand(false)},c:()=>[{l:"Range ce truc.",go:'keepGive2'}]},
  keepGive2:{t:"Il reste dans ma poche. Ça t'évitera de changer d'avis une deuxième fois. Maintenant, écoute-moi bien.",c:()=>[{l:"(Écouter)",go:'gift'}]},
  gift:{t:()=>(S.forced?"La puce est verrouillée":"Joli travail, Ash. Mais elle est verrouillée")+" : il faut la faire tourner dans mon décodeur, et il est à sec. Helix garde ses batteries au dépôt, au fond du parvis à droite, derrière une grille laser. Cette grille tire son courant des trois drones du quartier.",c:()=>[{l:"Trois drones. Avec quoi, je les descends ?",go:'gift2'}]},
  gift2:{t:()=>"Avec ça. (Elle te tend un pistolet compact au canon allongé.) P-9 silencieux, recharge cinétique : munitions illimitées, et personne n'entendra rien. Une balle dans le capteur, le drone tombe."+(S.forced?" Et ne pense même pas à le pointer sur moi : le boîtier ne quitte pas ma poche.":""),act:giveWeapon,c:()=>[{l:"Je commence par lequel ?",go:'gift3'}]},
  gift3:{t:()=>MOBILE?"Celui en maintenance, au-dessus de la rue, devant toi. Il est en veille, il ne te verra pas : parfait pour te faire la main. Vise avec le réticule et touche « Tirer ». Les deux autres patrouillent au nord, eux ont les yeux ouverts.":"Celui en maintenance, au-dessus de la rue, devant toi. Il est en veille, il ne te verra pas : parfait pour te faire la main. Vise et clique, ou appuie sur F. Les deux autres patrouillent au nord, eux ont les yeux ouverts.",c:()=>[{l:"Compris. (Partir)",go:null}]},
  ch2:{t:()=>{const k=kills();return k<3?`Encore ${3-k} drone${3-k>1?'s':''}. Tant qu'ils volent, la grille du dépôt reste sous tension. Reste dans leur dos et vise le capteur.`:"La grille est tombée. File au dépôt, au fond du parvis à droite, et ramène-moi cette batterie."},c:()=>[{l:'(Partir)',go:null}]},
  batReady:{t:"Tu l'as. Branche-la sur le décodeur, là, contre le mur à côté de moi.",c:()=>[{l:'(Partir)',go:null}]},
  end2:{t:"(La batterie ronronne. Sur l'écran, la puce s'éveille et la liste des prothèses K7 se met à défiler.) Regarde. Elles décrochent une par une. Le kill-switch d'Helix ne répond plus nulle part.",act:()=>heure(4*60+5),c:()=>[{l:"Et maintenant ?",go:'k72'}]},
  // La révélation qui lance le chapitre 3 (Black-out)
  k72:{t:"(Une ligne rouge s'inscrit en bas de l'écran. Mara se penche, lit à voix basse.) « Mise à jour K7.2. Diffusion à six heures. Tour Helix, Confluence. » (Elle se redresse, livide.) Ils avaient prévu le coup. À six heures, ils réarment toutes les K7. Et celles qui leur ont échappé cette nuit, ils les grillent.",c:()=>[{l:"Grillées ? Avec les mains, les jambes, les yeux qui vont avec ?",go:'k72b'}]},
  k72b:{t:"Avec tout ce qui est branché dessus. Kovac. Sid. La moitié du quartier. Toi. (Elle regarde l'heure.) Il nous reste moins de deux heures.",c:()=>[{l:"Alors on y va. Maintenant.",go:()=>emit('chapitre3')}]},
  who:{t:"Un collectif de mécanos augmentés. Ils veulent comprendre le kill-switch pour le neutraliser. Pas de corpo, pas de flic. C'est assez propre pour toi ?",c:()=>[{l:"Ça me va. (Donner la puce)",go:'gift'},{l:"Je la garde quand même.",go:'keep1'}]},
 }},
 kovac:{name:'Kovac',entry:()=>S.code?'after':'start',nodes:{
  start:{t:"(Sa main droite, entièrement mécanique, essuie un verre qui n'en a pas besoin.) Kovac. Nouilles, bière, informations. Qu'est-ce que je te sers ?",c:()=>[{l:"Le code de la porte d'Helix.",go:'code'},{l:"Un bol de nouilles.",go:'noodle'},{l:"Rien. (Partir)",go:null}]},
  noodle:{t:"Synthétiques, mais la sauce est vraie. Enfin, presque. Cadeau de la maison, t'as une tête à avoir faim.",c:()=>[{l:"Merci. Et le code d'Helix ?",go:'code'},{l:"(Partir)",go:null}]},
  code:{t:"Ça, ça se paie. Soixante crédits.",c:kovacPrice},
  paid:{t:"Plaisir de faire affaire. Le code, c'est 0451. Un classique : ils ne l'ont jamais changé.",act:()=>{S.kovacPaye=true;if(!S.code){S.credits-=60;S.code=true;tone(1200,.08,'triangle',.05);toast('Code obtenu : 0451  ·  −60 crédits')}},c:()=>[{l:'(Partir)',go:null}]},
  p1:{t:"Mara me doit déjà trois services. Pourquoi je lui ferais crédit ?",c:()=>[{l:"Cette puce permet à Helix de couper une prothèse à distance. Ta main, par exemple.",go:'pOk'},{l:"Parce que je te le demande gentiment.",go:'pNo'}]},
  pOk:{t:"(Il regarde sa main un long moment.) ...Ils peuvent faire ça ? Bon. 0451. Et tu ne m'as jamais vu.",act:()=>{S.kovacVerite=true;if(!S.code){S.code=true;tone(1200,.08,'triangle',.05);toast('Code obtenu : 0451  ·  persuasion réussie')}},c:()=>[{l:'(Partir)',go:null}]},
  pNo:{t:"Gentiment, ça ne paie pas le loyer.",c:kovacPrice},
  threat:{act:()=>{S.kovacMenace=true},t:"(Il pose sa main mécanique sur le comptoir. Le bois craque.) Essaie. ...Non ? Alors c'est soixante. Ou va voir le vieux Sid, dans la ruelle en face. Il paraît qu'il connaît un autre chemin.",c:kovacPrice},
  after:{t:"Tu as le code. Le reste, c'est ton problème. Et ne reviens pas avec un drone collé aux fesses.",c:()=>[{l:'(Partir)',go:null}]},
 }},
 sid:{name:'Sid',entry:()=>'start',nodes:{
  start:{t:"Hé, toi. T'as l'air de quelqu'un qui cherche un trou dans un mur.",c:()=>[{l:"Peut-être. Tu en connais un ?",go:'vent'},{l:"Qui es-tu ?",go:'who'},{l:"(Partir)",go:null}]},
  who:{t:"Sid. J'ai posé la moitié des câbles de ce labo, avant qu'Helix me remplace par un bras robotisé. Le leur, pas le mien. Maintenant je me chauffe les mains ici.",c:()=>[{l:"Et ce trou dans le mur ?",go:'vent'},{l:"(Partir)",go:null}]},
  vent:{t:"Tout au fond de cette ruelle, la grille d'aération du labo. Les vis sont rouillées depuis 2038 : un coup d'épaule et t'es dedans. Les drones ne passent jamais par ici.",act:()=>{if(!S.ventTip){S.ventTip=true;toast('Nouvel accès : la grille au fond de la ruelle')}},c:()=>[{l:"Merci, Sid. (Partir)",go:null}]},
 }},
 nox:{name:'Nox',entry:()=>'start',nodes:{
  start:{t:"Hé, humain. T'as pas une pièce ? Mon contrat de maintenance a expiré en 2039. Non ? Tant pis. Conseil gratuit, alors : les drones ont des yeux, mais pas d'oreilles.",c:()=>[{l:"C'est-à-dire ?",go:'tip'},{l:"Tiens, 10 crédits.",if:()=>S.credits>=10&&!S.noxPaid,go:'paid'},{l:"Pas le temps. (Partir)",go:null}]},
  tip:{t:"Accroupis-toi avec C, et ils te repèrent de beaucoup moins loin. Leur faisceau ne traverse pas les murs non plus. Reste dans leur dos, et quand ils s'arrêtent pour regarder autour, toi aussi tu t'arrêtes.",c:()=>[{l:"Tiens, 10 crédits pour le conseil.",if:()=>S.credits>=10&&!S.noxPaid,go:'paid'},{l:"Merci, Nox. (Partir)",go:null}]},
  paid:{t:"Transaction acceptée. Un vrai secret, alors : la porte d'Helix, c'est 0451. J'ai vu un vigile le taper. J'enregistre tout, c'est mon défaut de fabrication.",act:()=>{if(!S.noxPaid){S.noxPaid=true;S.credits-=10;if(!S.code){S.code=true;toast('Code obtenu : 0451  ·  −10 crédits')}}},c:()=>[{l:"(Partir)",go:null}]},
 }},
 terminal:{name:'Terminal Helix · messagerie interne',entry:()=>'start',nodes:{
  start:{act:()=>{S.readMail=true},t:"De : Dr Ilse Varga\nÀ : Direction sécurité\nObjet : K7, désactivation à distance\n\nLa fonction est opérationnelle sur 100 % des prothèses de série. Comme demandé, elle n'apparaît dans aucune documentation client. Je ne signerai pas le prochain rapport.",c:()=>[{l:'(Fermer)',go:null}]},
 }},
});
for(const id of['code','pNo','threat','after','final','keep3','keep3b'])SHAKE.add(id);

defineEnds({
  decode:['Signal coupé',()=>"Trois drones au tapis, pas un bruit. La batterie du dépôt alimente maintenant le décodeur de Mara, et la puce d'Helix travaille contre ses créateurs : dans tout Lyon-Basse, les prothèses K7 échappent à la coupure à distance. "+(S.forced?"Mara, elle, a gardé son boîtier noir. Pour cette nuit, c'est assez.":"Mara t'offre une cigarette que tu refuses. Pour cette nuit, c'est assez.")],
});

const chapitre={zone:'rue',
  objectives(S,L){
    if(S.ch2){const k=kills();
      if(k<3){L.push([`Détruis les drones du quartier (${k}/3)`,'']);L.push(S.dd[2]?['Les deux autres patrouillent au nord : reste dans leur dos','sub']:['Le premier est en veille, au-dessus de la rue','sub'])}
      else if(!S.battery){L.push(['Drones détruits (3/3)','done']);L.push(['Récupère la batterie au dépôt Helix, au fond du parvis à droite',''])}
      else L.push(['Branche la batterie sur le décodeur de Mara',''])}
    else if(!S.quest){L.push(["Parle à Mara, sous l'enseigne Échos",'']);if(S.code)L.push(['Code de la porte : 0451','sub done'])}
    else if(!S.chip){L.push(['Récupère la puce dans le labo Helix, au nord','']);
      L.push(S.code?['Code de la porte : 0451','sub done']:['Trouve le code (Kovac, bar à nouilles)','sub']);
      if(S.ventTip)L.push(["Ou passe par la grille, au fond de la ruelle",'sub'])}
    else L.push(['Rapporte la puce à Mara','']);
  },
  checkpoint(S){if(S.ch2)return[-2.5,14,0];if(S.chip)return[0,-46,Math.PI];if(S.quest||S.code)return[-2.5,14,0];return[0,26,0]},
  reset(){
    H.doorCol.off=false;H.door.position.y=1.6;H.keyLed.material.color.setHex(0xff3d3d).multiplyScalar(2);H.doorStrip.material.color.setHex(0xff3d3d).multiplyScalar(2);
    H.chip.visible=true;H.chipShaft.visible=true;for(const p of H.ceilPanels)p.material.color.setHex(0xe8f8ff).multiplyScalar(1.6);
    H.labLight.color.setHex(0xd9f4ff);
    for(const d of Z.drones)reviveDrone(d);closeGate();H.battery.visible=true;H.batLight.intensity=1.8;
    H.decLed.material.color.setHex(0xff3030).multiplyScalar(2.2);H.decScreen.material.color.setHex(0x150a06);H.decLumiere.intensity=0;
  },
  apply(S){
    if(S.door){H.doorCol.off=true;H.door.position.y=4.8;H.keyLed.material.color.setHex(0x4dff9a).multiplyScalar(2);H.doorStrip.material.color.setHex(0x4dff9a).multiplyScalar(2)}
    if(S.chip){H.chip.visible=false;H.chipShaft.visible=false;for(const p of H.ceilPanels)p.material.color.setHex(0xff2020).multiplyScalar(2)}
    S.dd=(S.dd||[false,false,false]).slice();S.dd.forEach((v,i)=>{if(v&&Z.drones[i]){Z.drones[i].dead=false;killDrone(Z.drones[i],true)}});
    if(S.gate)openGate(true);if(S.battery){H.battery.visible=false;H.batLight.intensity=0}
    if(S.decoded){H.decLed.material.color.setHex(0x4dff9a).multiplyScalar(2.2);H.decScreen.material.color.setHex(0x58e6ff).multiplyScalar(1.6);H.decLumiere.intensity=1.1}
  },
  describe(S){return S.battery?'batterie récupérée':S.ch2?`chapitre 2 · ${(S.dd||[]).filter(Boolean).length}/3 drones`:S.chip?'puce récupérée':S.door?'porte du labo ouverte':S.code?'code obtenu':S.quest?'mission acceptée':'début de la nuit'},
  // Réglages des drones selon l'histoire : alerte silencieuse après le vol, drone d'entraînement visible au chapitre 2.
  droneOpts(S){return{boost:S.chip&&!S.ch2,showTut:!!S.ch2}},
};
defineChapter(1,chapitre);
// Debug : quelques actions accessibles aux tests automatiques
export const ACTIONS={openDoor,takeChip,takeBattery,plugBattery,giveWeapon,openGate};

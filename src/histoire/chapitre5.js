// Chapitre 5 : « Confluence ». Les quais de Saône jusqu'à la tour Helix, le hall, l'ascenseur et la voix de Saal,
// le 41e étage (grilles laser, salle des serveurs, la clé tissée), l'alarme, puis le toit sous l'orage : Saal, Mara, Nox,
// et le choix final. Quatre fins, l'aube (la pluie s'arrête enfin), l'écran de fin de saison et la sauvegarde pour la saison 2.
import {V3,P,G,T,state,setState,on,emit,scene} from '../core.js';
import {tone,thunder,porteMetal,clac,annonce,crashSound,setPluie} from '../son.js';
import {toast,fade} from '../interface.js';
import {DLG,SHAKE,openDialog,stopDialog} from './dialogue.js';
import {S,defineChapter,defineEnds,finish,refreshHud,heure,allerZone} from './partie.js';
import {rallumer,eteindre} from '../construire.js';
import {cine} from '../cinema.js';
import {zone,zones} from '../zones.js';
import {setAube,placerCiel} from '../ciel.js';
import {lockHand,resetHand} from '../joueur.js';
import {burst} from '../drones.js';
import {detruireCamera,reparerCamera} from '../cameras.js';
import {finSaison,NOMS_FINS} from '../sauvegarde.js';
import {epilogueArchives} from '../exploration.js';
import * as Q from '../lieux/quais.js';
import * as TR from '../lieux/tour.js';
import * as SO from '../lieux/sommet.js';

const enCours=()=>S.chapter===5;

/* ---------- Caméras abattues : gardées dans la sauvegarde (zone:numéro) ---------- */
on('cameraDetruite',(c,instant)=>{if(instant)return;const k=c.zone.id+':'+c.idx;if(!S.cams.includes(k)){S.cams.push(k);emit('save')}});
function appliquerCameras(z){for(const c of z.cameras){const mort=S.cams.includes(z.id+':'+c.idx);if(mort&&!c.mort)detruireCamera(c,true);if(!mort&&c.mort)reparerCamera(c)}}
for(const Zx of[Q.Z,TR.Z,SO.Z]){const e0=Zx.enter;Zx.enter=()=>{e0&&e0();appliquerCameras(Zx)}}

/* ====================================================================================================
   1. Les quais
   ==================================================================================================== */
let grille=null;
function entrer(){
  stopDialog();S.chapter=5;heure(5*60+31);G.grace=3;setState('play');
  allerZone('quais',[4.6,.5,0],{ensuite:()=>{refreshHud();ouverture()}});
}
on('chapitre5',entrer);
// L'ouverture : la grille de la galerie s'ouvre sur la Saône, la caméra découvre la tour, l'éclair, l'écran géant.
function ouverture(){
  const steps=[
    {t:0,cam:{p:[7.05,1.5,.3],l:[-20,1.8,-2],dur:0,fov:58}},
    {t:0,fn:()=>{grille={t:0};Q.H.grille.rotation.y=0}},
    {t:.4,fn:()=>{tone(90,1.2,'sawtooth',.03,60);clac()}},
    {t:1.3,cam:{p:[6.6,1.55,.1],p2:[-2.8,1.8,-2.2],l:[-20,2,-6],l2:[0,40,-95],dur:5.6,fov:58}},
    {t:1.6,sub:{qui:'',texte:"(La Saône, noire et gonflée de pluie. Au bout du bas-port, là où elle rejoint le Rhône : la tour Helix. Elle a son propre courant.)",dur:4.8}},
    {t:6.6,fn:()=>{G.flash=1;thunder()}},
    {t:6.9,cam:{p:[-2.8,1.8,-2.2],l:[0,40,-95],l2:[0,45,-95],dur:3.2,fov:30}},
    {t:7.1,sub:{qui:'',texte:"(Sur sa façade, un écran grand comme un immeuble compte les minutes qui restent.)",dur:3.4}},
    {t:10.8,cam:{p:[-2.8,1.8,-2.2],l:[0,5,-70],dur:0,fov:58}},
    {t:10.9,sub:{qui:"Rosa, dans l'oreillette",texte:"On t'entend, Ash. Le quai de chargement est au pied de la tour : des caméras, des Gardiens, et la Faucheuse au-dessus.",dur:4.4}},
    {t:15.4,sub:{qui:"Rosa, dans l'oreillette",texte:"Les caméras ne tirent pas : elles appellent. Casse-les avant qu'elles te voient.",dur:3.4}},
  ];
  let t=19;
  if(S.noxWith){steps.push({t,sub:{qui:"Nox, dans l'oreillette",texte:"Je passe par les égouts de la presqu'île. On se retrouve en haut. Je n'ai pas le vertige : je n'ai pas d'oreille interne.",dur:4.4}});t+=4.6}
  if(S.maraFree){steps.push({t,sub:{qui:"Mara, dans l'oreillette",texte:"Le décodeur tient encore. Je monte dès que je peux. Ne m'attends pas pour commencer.",dur:3.6}});t+=3.8}
  steps.push({t,fn:()=>{grille=null;Q.H.grille.rotation.y=1.9;P.pos.set(4.6,0,.5);P.yaw=0;P.pitch=0}});
  cine(steps).then(()=>{G.grace=2;toast('Entre dans la tour par le quai de chargement, au bout du bas-port.');emit('save')});
}
// La porte de service, au pied de la tour
Q.Z.inter.push({p:new V3(0,0,-89.2),r:2,on:()=>enCours()&&!S.tour,label:()=>'Passer le badge de Varga',act:()=>{
  porteMetal();Q.H.porteService.userData.col.off=true;porteServ=true;heure(5*60+38);
  setTimeout(()=>{S.tour=true;allerZone('tour',[14.2,8,Math.PI/2],{ensuite:()=>{refreshHud();toast("Le hall de la tour Helix. L'ascenseur est au fond, à l'ouest.")}})},900)}});
let porteServ=false;

/* ====================================================================================================
   2. La tour : le hall, l'ascenseur, le 41e étage
   ==================================================================================================== */
TR.Z.inter.push({p:new V3(-15,0,-1),r:2.2,on:()=>enCours()&&!S.ascenseur,label:()=>"Appeler l'ascenseur (badge de Varga)",act:montee});
let ascenseur=null;
function montee(){
  S.ascenseur=true;heure(5*60+42);tone(1200,.08,'triangle',.04);setTimeout(()=>tone(900,.12,'triangle',.04),110);
  const l1=S.vargaTestifies===false?"Bonsoir, Ash. Le docteur Varga m'a tout raconté. Elle a été très raisonnable. Je vous attends en haut."
    :"Bonsoir, Ash. Vous portez le badge du docteur Varga. Elle n'est pas avec vous, je suppose. Montez, je vous en prie : personne ne vous arrêtera avant le quarante et unième.";
  const l3=S.maraFree===false?"Votre amie Mara est avec nous, sur le toit. Elle a un caractère épouvantable.":"Victor Saal, direction de la sécurité. Nous protégeons nos clients. Même contre eux-mêmes.";
  cine([
    {t:0,fn:()=>fade(true)},
    {t:.45,cam:{p:[39.9,1.62,.9],l:[70,-9,-3],dur:0,fov:62}},
    {t:.5,fn:()=>{ascenseur={t:0};TR.H.villeAsc.position.y=14;TR.afficherEtage(1);fade(false)}},
    {t:1.4,fn:()=>annonce()},
    {t:1.8,sub:{qui:'Haut-parleur',texte:l1,dur:4.8}},
    {t:6.8,sub:{qui:'Haut-parleur',texte:"À six heures, il ne se passera rien. Une mise à jour. Les gens détestent les mises à jour. Ils les acceptent quand même.",dur:4.4}},
    {t:11.4,sub:{qui:'Haut-parleur',texte:l3,dur:3.6}},
    {t:15.2,fn:()=>{G.flash=.8;thunder()}},
    {t:15.6,fn:()=>fade(true)},
    {t:16,fn:()=>{ascenseur=null;TR.afficherEtage(41);P.pos.set(101.6,0,0);P.yaw=-Math.PI/2;P.pitch=0;P.vx=P.vz=0;fade(false)}},
  ]).then(()=>{toast('41e étage. Le couloir de sécurité mène à la salle des serveurs.');refreshHud();emit('save')});
}
// Le boîtier des grilles, sur le palier
on('lampeCassee',l=>{if(!l.fusible||S.lasersCoupes)return;S.lasersCoupes=true;crashSound();tone(120,.8,'sawtooth',.04,40);
  toast('Les grilles laser grésillent et s\'éteignent. Quelque part, un technicien reçoit une alerte.');refreshHud();emit('save')});
// La clé tissée, dans le lecteur du pupitre
TR.Z.inter.push({p:new V3(147,0,0),r:1.9,on:()=>enCours()&&S.ascenseur&&!S.cle,label:()=>'Insérer la clé tissée dans le lecteur',act:insererCle});
function insererCle(){
  cine([
    {t:0,cam:{p:[145.4,1.75,1.6],l:[148.4,1,-.3],dur:0,fov:52}},
    {t:.2,sub:{qui:'',texte:"(Le ruban de soie glisse dans le lecteur. Des aiguilles le lisent, rang par rang, comme un métier lit ses cartes.)",dur:3.6}},
    {t:3.8,fn:()=>{S.cle=true;heure(5*60+47);TR.majEcranServeurs(S.heure,'arme');tone(660,.2,'triangle',.04);setTimeout(()=>tone(990,.3,'triangle',.04),160)}},
    {t:3.9,cam:{p:[145.6,1.8,0],l:[152,2.6,0],dur:0,fov:48}},
    {t:6.6,fn:()=>alarme(true)},
    {t:6.8,sub:{qui:'Haut-parleur',texte:"Je vous avais dit que personne ne vous arrêterait avant le quarante et unième. Je n'ai rien promis pour la suite.",dur:4.4}},
    {t:11.4,cam:{p:[145.6,1.8,0],l:[131,1.6,0],dur:0,fov:58}},
    {t:11.5,sub:{qui:"Rosa, dans l'oreillette",texte:"Ash ! L'override doit être validé à la main, sur l'antenne. Le toit ! L'escalier, au fond de la salle.",dur:4}},
  ]).then(()=>{G.grace=Math.max(G.grace,2);toast("L'escalier du toit : au fond de la salle, côté nord.");refreshHud();emit('save')});
}
// L'alarme : lumière rouge, sirène, deux Gardiens de plus ; les grilles laser s'éteignent (le courant part vers l'antenne)
function alarme(on){
  const H=TR.H;if(!H.renforts)return;
  for(const g of H.renforts){const i=TR.Z.gardiens.indexOf(g);if(on&&i<0)TR.Z.gardiens.push(g);if(!on&&i>=0)TR.Z.gardiens.splice(i,1);g.g.visible=on}
  H.alarme.intensity=on?2.5:0;
}
// L'escalier du toit
TR.Z.inter.push({p:new V3(149.2,0,-11.2),r:2,on:()=>enCours()&&S.ascenseur,label:()=>S.cle?'Monter sur le toit':"Porte de l'escalier (verrouillée)",act:()=>{
  if(!S.cle){tone(180,.15,'square',.04);toast("Verrouillée. Elle ne s'ouvrira qu'avec l'override armé.");return}
  S.sommet=true;heure(5*60+50);porteMetal();
  allerZone('sommet',[-16,12.2,0],{ensuite:()=>{presenceSommet();refreshHud();toast("Le toit, sous l'orage. Saal t'attend au pied de l'antenne.")}})}});

/* ====================================================================================================
   3. Le toit : Saal, Mara, Nox, le choix
   ==================================================================================================== */
// Mara est là, prisonnière, si elle a été capturée ; libre, elle arrive pendant la scène. Nox arrive s'il a suivi.
function presenceSommet(){
  const H=SO.H;if(!H.saal)return;
  SO.montrer(H.mara,S.maraFree===false||(S.finale&&S.maraFree===true));H.gardeMara.g.visible=S.maraFree===false&&!S.fin;
  if(S.maraFree===true)SO.deplacer(H.mara,-5.6,-3.4,.5);
  SO.montrer(H.nox,!!S.noxWith&&!!S.finale);if(S.noxWith)SO.deplacer(H.nox,-1.2,-7.2,.2);
}
let finaleLancee=false;
function finale(){
  if(finaleLancee)return;finaleLancee=true;S.finale=true;heure(5*60+56);
  const H=SO.H,fau=H.faucheuse;
  const steps=[
    {t:0,cam:{p:[P.pos.x,1.7,P.pos.z],l:[1.6,1.6,-6.4],dur:0,fov:55}},
    {t:0,fn:()=>{fau.actif=false;fau.verrou=1e9}},
    {t:.3,cam:{p:[P.pos.x,1.7,P.pos.z],p2:[1.2,1.75,-1.8],l:[1.6,1.6,-6.4],dur:3.4,fov:50}},
    {t:.6,sub:{qui:'',texte:"(Au pied de l'antenne, un homme en costume sombre attend sous la pluie, les mains croisées. Il n'a pas de parapluie. Il n'en a jamais eu besoin.)",dur:4.4}},
    {t:5.2,cam:{p:[1.3,1.8,-3.4],l:[1.6,1.7,-6.4],dur:0,fov:40}},
    {t:5.3,sub:{qui:'Victor Saal',texte:"Ash. Enfin. Vous avez fait un long chemin pour une si petite mise à jour.",dur:3.8}},
  ];
  let t=9.4;
  if(S.maraFree===false){steps.push({t,cam:{p:[-1.6,1.7,-3.2],l:[-3.6,1.5,-6.8],dur:0,fov:45}},{t:t+.1,sub:{qui:'Mara',texte:"(Les mains liées, un Gardien dans le dos.) Prends ton temps, surtout. Je suis bien, ici.",dur:3.6}});t+=4}
  if(S.maraFree===true){steps.push({t,cam:{p:[-1,1.8,-1],l:[-5.6,1.6,-3.4],dur:0,fov:45}},{t,fn:()=>{SO.montrer(H.mara,true)}},{t:t+.1,sub:{qui:'Mara',texte:"(Elle surgit de derrière un bloc de clim, l'arme pointée sur Saal.) Je t'avais dit que je viendrais.",dur:3.8}});t+=4.2}
  if(S.noxWith){steps.push({t,cam:{p:[1.5,1.8,-2.6],l:[-1.2,1.4,-7.2],dur:0,fov:45}},{t,fn:()=>{SO.montrer(H.nox,true)}},{t:t+.1,sub:{qui:'Nox',texte:"(Il a grimpé par la façade. Il branche déjà un câble sur l'armoire.) Je n'ai pas le vertige. J'enregistre.",dur:3.8}});t+=4.2}
  // fin de la scène : Ash face à Saal, à quelques pas, pour le dialogue
  steps.push({t,cam:{p:[1.3,1.8,-3.4],l:[1.6,1.7,-6.4],dur:0,fov:40}},{t:t+.2,fn:()=>{P.pos.set(1.1,0,-2.6);P.vx=P.vz=0;P.yaw=Math.atan2(-(1.6-1.1),-(-6.4+2.6));P.pitch=-.02}});
  cine(steps).then(()=>openDialog('saal'));
}
const peutDiffuser=()=>S.vargaTestifies===true&&S.noxWith&&S.temoignage;
DLG.saal={name:'Victor Saal',entry:()=>'start',nodes:{
  start:{t:"(Il relève le bord de son chapeau. La pluie coule dessus sans qu'il y prête attention.) Vous avez armé l'override. Il ne manque qu'un geste, là, sur cette armoire. Avant de le faire, laissez-moi vous parler en adulte.",
    c:()=>[{l:'Parle.',go:'offre'},{l:"Il n'y a rien à dire.",go:'rien'}]},
  rien:{t:"Il y a toujours quelque chose à dire. C'est même mon métier.",c:()=>[{l:'(Écouter)',go:'offre'}]},
  offre:{t:()=>"La K7.2 partira à six heures. Avec ou sans cette antenne : Helix en a d'autres. Ce que je vous propose est simple. Votre main retirée de la liste. Cinquante mille crédits. Un avion avant midi."+(S.maraFree===false?" Et votre amie Mara repart avec vous, entière.":""),
    c:()=>[{l:'Et les autres K7 ? Kovac, Sid, la moitié du quartier ?',go:'autres'}]},
  autres:{t:()=>"Rendues à leurs propriétaires légitimes. Ou grillées, pour celles qui ont décroché cette nuit. Nous protégeons nos clients, Ash. Même contre eux-mêmes."+(S.vargaTestifies===false?" Le docteur Varga l'a compris, elle. Elle est en bas. Elle signe.":""),
    c:()=>[{l:'(Regarder l\'armoire)',go:'choix'}]},
  choix:{t:()=>"(Six heures moins deux. La Faucheuse tient son projecteur sur toi. L'armoire attend ta main.)"+(S.noxWith?" (NOX-7 a fini de brancher son câble. Ses diodes clignotent : prêt.)":"")+(S.maraFree===true?" (Mara ne quitte pas Saal des yeux.)":S.maraFree===false?" (Mara, les mains liées, te regarde sans rien dire.)":""),
    c:()=>[
      {l:'Nox, envoie tout. Le témoignage de Varga, tes enregistrements. Sur tous les écrans de la ville.',if:peutDiffuser,go:()=>fin('diffuser')},
      {l:"(Valider l'override, puis arracher les câbles de l'antenne)",go:()=>fin('saboter')},
      {l:"J'accepte. Ma main, les crédits, l'avion.",go:()=>fin('negocier')},
      {l:"Mara. C'est ton collectif qui tiendra la clé. À toi.",if:()=>S.maraFree===true,go:()=>fin('mara')},
    ]},
}};
SHAKE.add('rien');

/* ---------- Les fins ---------- */
const sub=(t,qui,texte,dur)=>({t,sub:{qui,texte,dur}});
function fin(k){
  if(k==='negocier'&&S.forced&&S.boitier!=='ash'&&S.maraFree===true)k='maraForce';
  stopDialog();S.fin=k;
  const H=SO.H,cam=(t,p,l,fov=48,o={})=>({t,cam:Object.assign({p,l,dur:0,fov},o)});
  const plan=[cam(0,[1.3,1.8,-3],[.4,1.4,-8])];
  if(k==='diffuser'){heure(5*60+59);plan.push(
    sub(.2,'',"(Tu poses ta main K7 sur l'armoire. L'override coupe la K7.2 au ras de l'antenne.)",3.6),
    {t:3.9,fn:()=>{H.ecranArmoire.material.color.setHex(0xffffff).multiplyScalar(1.6);H.lumAnt.color.setHex(0x58e6ff);tone(440,1.4,'sine',.04,880);
      SO.afficherHolo('TÉMOIGNAGE · DR ILSE VARGA',["« La fonction est opérationnelle sur 100 % des prothèses de série.","Comme demandé, elle n'apparaît dans aucune documentation client. »",'Enregistré par NOX-7 · diffusé sur tous les écrans de Lyon'],0x7fe6ff)}},
    sub(4,'Nox','Diffusion.',1.8),
    cam(6,[8,2.2,4],[0,26,-12],50,{l2:[0,34,-12],dur:5}),
    sub(6.2,'',"(L'antenne s'allume, du bas vers le haut. Dans toute la ville, chaque écran montre le même visage : celui du docteur Varga, et ce que NOX-7 a vu cette nuit.)",5),
    cam(11.4,[1.3,1.8,-3.4],[1.6,1.7,-6.4],40),
    sub(11.5,'Victor Saal',"(Il regarde la ville. Longtemps.) Vous venez de condamner Helix. (Un temps.) Et moi avec.",4),
    sub(15.7,'',"(Un Gardien retire son casque. Dessous, un œil K7. Il regarde Saal, puis l'écran. Il pose son arme.)",4))}
  else if(k==='saboter'){heure(5*60+59);plan.push(
    sub(.2,'',"(Tu valides l'override. Puis tu arraches le faisceau de câbles de l'armoire, à pleines mains.)",3.4),
    {t:3.6,fn:()=>{burst(new V3(0,1.6,-8.2),120);crashSound();H.ecranArmoire.visible=false;H.lumArmoire.intensity=0;tone(80,1.4,'sawtooth',.06,30)}},
    cam(3.7,[6,2,2],[0,20,-12],52,{l2:[0,36,-12],dur:4}),
    {t:4.2,fn:()=>{H.antenneMorte=true;for(const b of H.balisesAnt)b.visible=false;H.lumAnt.intensity=0}},
    sub(4,'',"(L'antenne crache une gerbe d'étincelles et s'éteint, du haut vers le bas. Six heures arrivent. Rien ne part.)",4.2),
    cam(8.4,[1.3,1.8,-3.4],[1.6,1.7,-6.4],40),
    sub(8.5,'Victor Saal',"Nous réparerons l'antenne. Nous en avons d'autres. (Il remet son chapeau droit.) Et nous vous retrouverons, Ash. Nous retrouvons toujours nos produits.",5))}
  else if(k==='negocier'){heure(6*60);plan.push(
    sub(.2,'',"(Tu retires ta main de l'armoire. Saal hoche la tête, comme on conclut une réunion.)",3.4),
    sub(3.8,'Victor Saal',"Raisonnable. (Il tape quelques mots sur sa manchette.) Votre main ne fait plus partie de la liste. Les crédits sont sur votre compte.",4.4),
    {t:4,fn:()=>{S.credits+=50000;refreshHud()}},
    cam(8.4,[8,2.2,4],[0,26,-12],50,{l2:[0,34,-12],dur:5}),
    {t:8.6,fn:()=>{H.lumAnt.color.setHex(0xffb347);H.lumAnt.intensity=4;tone(220,2,'sine',.05,110);SO.afficherHolo('K7.2 · DIFFUSION 100 %',['412 873 prothèses mises à jour','Exception : 1 prothèse (accord de la direction)','Soyez entier.'],0xffb347)}},
    sub(8.6,'',"(Six heures. L'antenne s'allume, du bas vers le haut. Dans Lyon-Basse, des centaines de mains s'arrêtent en même temps.)",5));
    if(S.maraFree===false)plan.push(cam(13.8,[-1.6,1.7,-3.2],[-3.6,1.5,-6.8],45),sub(13.9,'',"(Les Gardiens détachent Mara. Elle passe devant toi sans te regarder.)",3.6))}
  else{heure(6*60);const force=k==='maraForce';
    if(force)plan.push(
      sub(.2,'Mara',"(Elle sort le boîtier noir de sa poche.) Non, Ash. Pas lui. Pas comme ça.",3.4),
      {t:3.6,fn:()=>lockHand(true)},
      sub(3.7,'',"(Tes doigts se replient tout seuls, comme sur le parvis, il y a trois heures. Tu ne sens plus ta main.)",3.8),
      {t:7.6,fn:()=>{}});
    const t0=force?7.8:0;
    plan.push(
      cam(t0+.1,[-1,1.8,-3.6],[.4,1.4,-8.2],46),
      sub(t0+.2,'Mara',"(Elle branche une clé à côté du ruban et tape vite.) Je réécris la liste des propriétaires. Plus Helix. Nous.",4),
      cam(t0+4.4,[1.3,1.8,-3.4],[1.6,1.7,-6.4],40),
      sub(t0+4.5,'Victor Saal',"Vous croyez libérer quelqu'un ? Vous changez seulement de maître.",3.6),
      sub(t0+8.2,'Mara',"C'est déjà ça.",2.2),
      {t:t0+8.4,fn:()=>{H.lumAnt.color.setHex(0xff3d6a);H.lumAnt.intensity=4;tone(330,2,'sine',.05,165);SO.afficherHolo('K7.2 · NOUVEAU PROPRIÉTAIRE',['Clé du kill-switch : Nouveaux Canuts','Vivre en travaillant ou mourir en combattant'],0xff7a9a)}},
      cam(t0+10.6,[8,2.2,4],[0,26,-12],50,{l2:[0,34,-12],dur:4}),
      sub(t0+10.7,'',"(Six heures. L'antenne diffuse la K7.2. Les prothèses de Lyon-Basse obéissent à une nouvelle clé : celle des Nouveaux Canuts.)",4.6));
    if(force)plan.push({t:t0+15.6,fn:()=>lockHand(false)})}
  const fin1=Math.max(...plan.map(s=>s.t+(s.sub?s.sub.dur:0)))+.4;
  plan.push({t:fin1,fn:()=>{}});
  cine(plan).then(()=>aube(k));
}
// L'aube : la pluie s'arrête, l'orage se tait, le ciel s'éclaire à l'est. Puis l'écran de fin de saison.
let aubeT=-1;
const TEXTES_AUBE={
  diffuser:["(L'orage se retire vers l'est. Sur les écrans de Lyon-Basse, Varga parle toujours.)","(Et pour la première fois de l'année, la pluie s'arrête.)"],
  saboter:["(Au pied de la tour, les gyrophares se multiplient. Il faudra redescendre, et vite.)","(Mais pour la première fois de l'année, la pluie s'arrête.)"],
  negocier:["(Ta main droite fonctionne. Tu la regardes longtemps.)","(La pluie s'arrête. Ça ne change rien.)"],
  mara:["(Mara allume une cigarette, la première qui ne s'éteint pas sous la pluie.)","(Pour la première fois de l'année, la pluie s'arrête.)"],
  maraForce:["(Ta main se rouvre, doigt après doigt. Mara range le boîtier sans te regarder.)","(La pluie s'arrête. Mara n'a rien promis.)"],
};
function aube(k){
  const H=SO.H,[a,b]=TEXTES_AUBE[k];
  // la ville remonte un peu sous le toit : au lever du jour, on la voit s'éveiller en contrebas
  heure(6*60+12);setPluie(0);SO.Z.pluie=false;placerCiel(-140);H.soleil.visible=true;H.faucheuse.g.visible=false;H.faucheuse.cone.visible=false;
  aubeT=0;
  cine([
    {t:0,cam:{p:[17,4.8,4],p2:[19.4,5.3,5.6],l:[125,-50,9],l2:[138,-42,14],dur:14,fov:60}},
    {t:1.2,sub:{qui:'',texte:a,dur:5.2}},
    {t:6.8,sub:{qui:'',texte:b,dur:5.2}},
    {t:12.6,fn:()=>fade(true)},
    {t:13.4,fn:()=>{}},
  ]).then(()=>{finSaisonUn();setTimeout(()=>fade(false),400)});
}
function finSaisonUn(){
  const rec={fin:S.fin,forced:S.forced,maraFree:S.maraFree,vargaTestifies:S.vargaTestifies,noxWith:S.noxWith,noxPaid:S.noxPaid,temoignage:S.temoignage,boitier:S.boitier,
    kovac:S.kovacVerite?'verite':S.kovacPaye?'paye':S.kovacMenace?'menace':null,credits:S.credits,spotted:S.spotted,temps:Math.round((performance.now()-S.t0)/1000),
    archives:S.archives.length,dossiers:S.dossiersFinis.slice(),quetes:Object.assign({},S.quetes),neutres:S.neutres.length};
  finSaison('1',rec);emit('saveNow');
  finish(S.fin,{kicker:'Fin de la saison 1 · Avant l\'aube',saison:`Ta fin, ${NOMS_FINS[S.fin]}, et tes choix de la nuit sont gardés sur cet appareil (et sur ton compte si tu en as un). La saison 2 reprendra de là.`});
}
defineEnds({
  diffuser:['La ville a vu',()=>"À six heures, l'antenne d'Helix n'a pas diffusé la K7.2. Elle a diffusé le docteur Varga, sur tous les écrans de la ville, et ce que NOX-7 avait enregistré cette nuit."+epilogueArchives('diffuser')+" Les K7 de Lyon-Basse ne répondent plus à personne. Ni à Helix, ni à Mara."],
  saboter:["Le silence de l'antenne",()=>"L'antenne est morte et la K7.2 n'est jamais partie. Les mains de Lyon-Basse restent à ceux qui les portent. Helix a déjà commandé une nouvelle antenne, et ton visage est dans tous ses fichiers."+epilogueArchives('saboter')],
  negocier:["Le prix d'une main",()=>"Ta main fonctionne. Cinquante mille crédits dorment sur un compte à ton nom. À six heures, dans Lyon-Basse, des centaines d'autres mains se sont arrêtées en même temps. Kovac n'a pas rouvert son bar."+epilogueArchives('negocier')],
  mara:['La main de Mara',()=>"La K7.2 est partie à six heures. Mais la clé, désormais, ce sont Mara et les Nouveaux Canuts qui la tiennent. Elle a promis de ne jamais s'en servir. Tu sais ce que valent ses promesses."+epilogueArchives('mara')],
  maraForce:['La main de Mara',()=>"Tu as voulu traiter avec Saal. Mara, elle, avait gardé son boîtier : elle a repris ta main, puis la clé. Les K7 n'obéissent plus à Helix, elles obéissent à Mara. Cette nuit, tu n'as jamais eu le choix."+epilogueArchives('maraForce')],
});

/* ---------- Mises à jour propres au chapitre, à chaque image ---------- */
let sirene=0,foudre=8;
const quaisUpdate0=Q.Z.update;Q.Z.update=(dt,S)=>{quaisUpdate0(dt,S);
  if(grille){grille.t+=dt;Q.H.grille.rotation.y=1.9*Math.min(1,Math.max(0,(grille.t-.4)/1.6))}
  const d=Q.H.porteService;d.position.y+=((porteServ||S.tour?3.7:1.2)-d.position.y)*Math.min(1,dt*2.5)};
const tourUpdate0=TR.Z.update;TR.Z.update=(dt,S)=>{tourUpdate0(dt,S);
  TR.majLasers(dt,state==='play',S.lasersCoupes||S.cle);TR.majEcranServeurs(S.heure,S.cle?'arme':'');
  if(S.couloir!==true&&P.pos.x>130.6&&state==='play'){S.couloir=true;heure(5*60+45);emit('save')}
  if(ascenseur){ascenseur.t+=dt;const k=Math.min(1,ascenseur.t/14.5);TR.H.villeAsc.position.y=14-k*40;TR.afficherEtage(1+Math.floor(k*40))}
  if(S.cle){TR.H.alarme.intensity=1.2+Math.sin(T*6)*1.2;sirene-=dt;if(sirene<=0&&state==='play'){sirene=1.1;tone(880,.28,'square',.025,620)}}};
const sommetUpdate0=SO.Z.update;SO.Z.update=(dt,S)=>{sommetUpdate0(dt,S);
  if(!S.fin){foudre-=dt;if(foudre<=0){foudre=6+Math.random()*8;G.flash=1;thunder()}}
  if(state==='play'&&!S.finale&&Math.hypot(P.pos.x-1,P.pos.z+6)<8)finale();
  if(aubeT>=0){aubeT+=dt;const k=Math.min(1,aubeT/10);setAube(k);SO.H.soleil.material.opacity=k;scene.fog.color.setRGB(.043+k*.14,.05+k*.1,.086+k*.06);scene.background.copy(scene.fog.color);scene.fog.density=.011*(1-k*.6)}};

/* ---------- Le chapitre ---------- */
defineChapter(5,{
  zone:S=>S.sommet?'sommet':S.tour?'tour':'quais',
  objectives(S,L){
    if(S.sommet){if(!S.finale){L.push(["Valide l'override à l'antenne, au milieu du toit",'']);L.push(['La Faucheuse tourne : abrite-toi sous les panneaux solaires','sub'])}else L.push(['Six heures moins deux',''])}
    else if(S.tour){
      if(!S.ascenseur){L.push(["Prends l'ascenseur, au fond du hall",'']);L.push(["Une caméra surveille le hall depuis l'angle nord-ouest",'sub'])}
      else if(!S.cle){L.push(['Insère la clé tissée dans le lecteur de la salle des serveurs','']);
        if(!S.couloir){L.push([S.lasersCoupes?'Les grilles laser sont éteintes':'Les grilles laser s\'allument par cycles : passe quand elles sont éteintes','sub']);L.push(['La caméra du couloir voit tout le couloir','sub'])}}
      else L.push(["Monte sur le toit : l'escalier, au fond de la salle",''])}
    else{L.push(['Entre dans la tour Helix par le quai de chargement','']);L.push(['Les caméras se cassent au P-9','sub']);L.push(['Le badge de Varga ouvre la porte de service','sub'])}
  },
  checkpoint(S){
    if(S.sommet)return[-16,12.2,0];
    if(S.tour){if(!S.ascenseur)return[14.2,8,Math.PI/2];if(S.cle)return[150.6,-2,0];if(S.couloir)return[131.6,0,-Math.PI/2];return[102,0,-Math.PI/2]}
    return P.pos.z>-30?[4.6,-1,0]:[0,-41,0]},
  reset(){porteServ=false;grille=null;ascenseur=null;finaleLancee=false;aubeT=-1;setAube(0);setPluie(1);
    for(const Zx of[Q.Z,TR.Z,SO.Z]){if(!Zx.construite)continue;rallumer(Zx);for(const c of Zx.cameras)reparerCamera(c)}
    if(SO.Z.construite){SO.Z.pluie=true;SO.H.antenneMorte=false;SO.afficherHolo(null);SO.H.lumAnt.color.setHex(0xff3030);SO.H.ecranArmoire.material.color.setHex(0x58e6ff).multiplyScalar(1.2);SO.H.soleil.visible=false;SO.H.soleil.material.opacity=0;SO.H.faucheuse.actif=true;SO.H.faucheuse.verrou=0;SO.H.faucheuse.g.visible=true;SO.H.faucheuse.cone.visible=true;SO.H.ecranArmoire.visible=true;SO.H.lumArmoire.intensity=1.2;presenceSommet()}
    if(TR.Z.construite){alarme(false);TR.afficherEtage(0)}},
  apply(S){if(S.chapter<5)return;
    for(const Zx of[Q.Z,TR.Z,SO.Z])if(Zx.construite)appliquerCameras(Zx);
    if(TR.Z.construite){alarme(!!S.cle);if(S.lasersCoupes&&TR.H.fusible.on)eteindre(TR.H.fusible);TR.afficherEtage(S.ascenseur?41:0)}
    if(SO.Z.construite){finaleLancee=false;if(S.finale&&!S.fin){S.finale=false}presenceSommet()}},
  describe(S){return S.sommet?'chapitre 5 · le toit de la tour':S.ascenseur?'chapitre 5 · le 41e étage':S.tour?'chapitre 5 · le hall de la tour Helix':'chapitre 5 · les quais de Saône'},
});

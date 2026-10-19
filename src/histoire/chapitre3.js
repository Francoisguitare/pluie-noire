// Chapitre 3 : « Black-out ». Helix coupe le courant de Lyon-Basse et envoie la Faucheuse et ses Gardiens.
// La rue dans le noir (rejoindre Kovac ou l'escalier de secours), puis les toits jusqu'à la trappe où attend Sid.
// En chemin, du bord d'un toit : Mara emmenée vers un fourgon. Tirer sur le transformateur la libère (S.maraFree).
import {THREE,V3,P,G,T,state,setState,on,emit} from '../core.js';
import {tone,coupure,clac,annonce,crashSound} from '../son.js';
import {toast} from '../interface.js';
import {DLG,SHAKE,openDialog,stopDialog} from './dialogue.js';
import {S,defineChapter,refreshHud,heure,allerZone} from './partie.js';
import {cine} from '../cinema.js';
import {into,add,addBox,M,glow,rallumer} from '../construire.js';
import {makeGardien} from '../gardiens.js';
import {makeFaucheuse} from '../faucheuse.js';
import {burst} from '../drones.js';
import * as RUE from '../lieux/rue.js';
import * as TOITS from '../lieux/toits.js';
import {zone} from '../zones.js';

/* ---------- La rue au chapitre 3 : Gardiens, Faucheuse, abris, Mara et Sid partis ---------- */
let rue3=null;
function installerRue(){
  if(rue3)return rue3;const Z=RUE.Z;into(Z);
  rue3={};
  // Abribus : un toit sous lequel le projecteur ne voit pas
  addBox(-6.2,-4.6,3.4,6.6,2.45,2.6,M.darkMetal,{collide:false});addBox(-6.15,-6.05,3.4,6.6,0,2.45,new THREE.MeshStandardMaterial({color:0x9fb4c8,transparent:true,opacity:.18,roughness:.1,metalness:.3}),{collide:false});
  for(const z of[3.45,6.55])addBox(-4.75,-4.65,z-.05,z+.05,0,2.45,M.darkMetal,{collide:false});
  rue3.g1=makeGardien(Z,[[-2.5,-30],[-2.5,-11],[3,-11],[3,-30]],{boucle:true,yaw:0,attente:1.8});
  rue3.g2=makeGardien(Z,[[2.8,-7],[2.8,13],[-2.6,13],[-2.6,-7]],{boucle:true,yaw:0,attente:2});
  rue3.fau=makeFaucheuse(Z,{cx:0,cz:-3,rx:7,rz:22,h:22,v:.05,R:3.2,t0:2.2});
  rue3.cordes=[];for(const g of[rue3.g1,rue3.g2]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,24,5),M.darkMetal);c.visible=false;add(c);rue3.cordes.push(c)}
  into(null);
  rue3.liste={gardiens:[rue3.g1,rue3.g2],faucheuses:[rue3.fau]};
  activerRue(false);return rue3;
}
// Présence des ennemis du chapitre 3 dans la rue (absents aux chapitres 1 et 2).
function activerRue(on){
  const Z=RUE.Z;if(!rue3)return;
  for(const k of['gardiens','faucheuses'])for(const e of rue3.liste[k]){const i=Z[k].indexOf(e);if(on&&i<0)Z[k].push(e);if(!on&&i>=0)Z[k].splice(i,1);e.g.visible=on;if(e.cone)e.cone.visible=on&&!e.neutre}
  Z.couverts.length=0;if(on)Z.couverts.push({x0:6,x1:9.4,z0:0,z1:10},{x0:-6.2,x1:-4.4,z0:16.4,z1:18.6},{x0:-6.2,x1:-4.6,z0:3.4,z1:6.6},{x0:-6.2,x1:-4.7,z0:24.6,z1:30.4},{x0:-14,x1:-9,z0:-30,z1:-12});
}
// Mara et Sid quittent la rue après le black-out.
function absents(on){
  const Z=RUE.Z;for(const k of['mara','sid']){const n=RUE.NPCS.find(n=>n.key===k);if(!n||!n.g)continue;const vis=!on;n.g.visible=vis;n.tag.visible=vis;
    const c=Z.colliders.find(c=>Math.abs((c.x0+c.x1)/2-n.x)<.01&&Math.abs((c.z0+c.z1)/2-n.z)<.01);if(c)c.off=!vis;n.absent=!vis}
}
// Interactions de la rue propres au chapitre 3
RUE.Z.inter.push({p:new V3(8.5,0,9.1),r:2,on:()=>S.chapter===3&&S.kovacAide,label:()=>"Passer par l'arrière-boutique",act:()=>monter('kovac')});
RUE.Z.inter.push({p:new V3(-5.2,0,27.5),r:2.2,on:()=>S.chapter===3&&S.blackout&&!S.kovacAide,label:()=>S.escalier?"Tirer sur la chaîne de l'escalier de secours":"Escalier de secours de l'hôtel",
  act:()=>{if(S.escalier)monter('escalier');else{tone(180,.15,'square',.04);toast("L'échelle de secours est relevée, hors d'atteinte.")}}});

function monter(par){
  S.escalier=S.escalier||par==='escalier';heure(4*60+18);
  tone(220,.2,'sawtooth',.03,330);
  allerZone('toits',par==='kovac'?[1.9,8.4,0]:[12.6,1.4,Math.PI/2],{ensuite:()=>{S.toits=true;refreshHud();
    toast(par==='kovac'?"Les toits. La pluie fouette, la Faucheuse tourne au-dessus. Sid t'attend de l'autre côté.":"Tu te hisses sur le toit. Sid t'attend de l'autre côté, vers la trappe.")}});
}

/* ---------- La cinématique du black-out ---------- */
let anim=null;
function lancer(){
  stopDialog();S.chapter=3;heure(4*60+6);installerRue();activerRue(true);for(const g of rue3.liste.gardiens)g.g.visible=false;
  const r=rue3,fau=r.fau;
  // État de départ de la scène : Faucheuse au-dessus des nuages, Gardiens en haut des cordes
  fau.hCur=70;fau.actif=false;fau.t=-.64; // la Faucheuse descend devant la camérafor(const g of r.liste.gardiens){g.g.position.y=13}
  anim={rappel:-1,descente:-1};
  const forced=S.forced,mara=[-4.9,1.55,20.2];
  const steps=[
    {t:0,cam:{p:[0,9,33],p2:[0,8.5,30.5],l:[0,6,-40],dur:5.5,fov:72}},
    {t:.6,fn:()=>{coupure()}},
    {t:1.1,fn:()=>{RUE.surClac(clac);RUE.blackout(3.4)}},
    {t:5.5,cam:{p:[1,1.7,5],p2:[1,1.7,3],dur:6.9,fov:40,suivre:()=>{const p=fau.g.position;return[p.x*.9,p.y-2,p.z]}}},
    {t:5.6,fn:()=>{anim.descente=0}},
    {t:9,fn:()=>annonce()},
    {t:9.4,sub:{qui:'Haut-parleurs Helix',texte:'Ici Helix Sécurité. Le quartier de Lyon-Basse est placé en quarantaine.',dur:3.3}},
    {t:12.7,sub:{qui:'Haut-parleurs Helix',texte:'Restez chez vous. Toute personne dans la rue sera interpellée.',dur:3.3}},
    {t:12.4,cam:{p:[-1.5,2.2,2],p2:[-1.5,2.4,-2],l:[0,6,-30],l2:[0,1.6,-26],dur:4.6,fov:72}},
    {t:12.6,fn:()=>{anim.rappel=0}},
    {t:17,cam:{p:[-3.25,1.62,19.35],l:mara,dur:0}},
    {t:17.2,sub:{qui:'Mara',texte:'Ils viennent pour le décodeur. Et pour toi.',dur:2.6}},
    {t:19.9,sub:{qui:'Mara',texte:'Kovac a un escalier qui monte sur les toits, derrière son bar. Passe par là.',dur:3.4}},
    {t:23.4,sub:{qui:'Mara',texte:'Moi, j\'emporte le décodeur chez les Canuts, à la Croix-Rousse. Sid connaît le chemin : il t\'attendra de l\'autre côté des toits.',dur:4.4}},
  ];
  // La Coupure (voir pouvoirs.js) : la main d'Ash a gardé les codes de la puce
  steps.push({t:27.9,sub:{qui:'Mara',texte:"(Elle attrape ta main K7 et la retourne.) Quand tu as tenu la puce, ta main l'a lue. Les codes de coupure d'Helix sont dedans, maintenant.",dur:4.6}});
  steps.push({t:32.6,sub:{qui:'Mara',texte:"Les armures des Gardiens, c'est des K7 comme les autres. Vise, et coupe. Ils tombent comme des planches.",dur:4}});
  let fin=36.7;
  if(forced){steps.push({t:36.7,sub:{qui:'Mara',texte:'Et si l\'envie te reprend de me fausser compagnie, souviens-toi de qui tient ta main.',dur:3.4}});fin=40.2}
  steps.push({t:fin,fn:()=>{anim.descente=1e9;anim.rappel=1e9;majAnim(0);fau.hCur=fau.h;fau.actif=true;S.blackout=true;heure(4*60+8);activerRue(true);absents(true);RUE.blackout(0);G.grace=3;emit('save');refreshHud()}});
  steps.push({t:fin+.05,fn:()=>{}});
  cine(steps).then(()=>{toast('Rejoins Kovac sans croiser le projecteur. Les abris te cachent.')});
}
on('chapitre3',lancer);
function majAnim(dt){
  if(!anim||!rue3)return;
  if(anim.descente>=0){anim.descente+=dt;const k=Math.min(1,anim.descente/6.5);rue3.fau.hCur=70+(rue3.fau.h-70)*(1-Math.pow(1-k,3))}
  rue3.liste.gardiens.forEach((g,i)=>{const c=rue3.cordes[i];
    if(anim.rappel<0){c.visible=false;return}
    anim.rappel+=dt/2;const k=Math.min(1,Math.max(0,anim.rappel*1.4-i*.25));g.g.position.y=13*(1-k);g.g.visible=true;
    c.visible=k<1&&anim.rappel<4;c.position.set(g.pos.x,12+g.g.position.y/2+1,g.pos.z);c.scale.y=1;});
}

/* ---------- Dialogues du chapitre 3 ---------- */
const kovacE0=DLG.kovac.entry;
DLG.kovac.entry=()=>S.chapter===3?(S.kovacAide?'c3go':S.kovacVerite?'c3ami':S.kovacMenace?'c3non':'c3prix'):kovacE0();
const ouvrir=()=>{S.kovacAide=true;heure(4*60+14);toast("Kovac déverrouille la porte de l'arrière-boutique.");emit('save');refreshHud()};
Object.assign(DLG.kovac.nodes,{
  c3ami:{t:"(Kovac a éteint ses néons à la main, par habitude.) Toi. Je savais que tu reviendrais. (Il montre sa main mécanique.) Elle tremble depuis tout à l'heure. Pas moi : elle. L'escalier des toits est derrière, viens.",act:ouvrir,c:()=>[{l:"Merci, Kovac. (Partir)",go:null}]},
  c3prix:{t:"Les toits ? Ça se paie aussi, ça. Trente crédits. Fin du monde ou pas.",c:()=>[{l:'Payer 30 crédits',if:()=>S.credits>=30,go:'c3paye'},{l:"À six heures, Helix grille ta main. Avec ou sans mes crédits.",go:'c3verite'},{l:"(Partir)",go:null}]},
  c3paye:{t:"Plaisir de faire affaire. Même un soir comme celui-là. La porte est derrière moi.",act:()=>{S.credits-=30;ouvrir()},c:()=>[{l:"(Partir)",go:null}]},
  c3verite:{t:"(Il regarde sa main un long moment. Elle tremble.) ...Ils peuvent faire ça ? (Il jure à voix basse.) Garde tes crédits. La porte est derrière moi.",act:()=>{S.kovacVerite=true;ouvrir()},c:()=>[{l:"(Partir)",go:null}]},
  c3non:{t:"Toi ? Après ce que tu m'as promis tout à l'heure avec mon comptoir ? (Il croise les bras, la main mécanique par-dessus.) Dégage. Va grimper ailleurs.",c:()=>[{l:"À six heures, Helix grille ta main. Je peux l'empêcher.",go:'c3non2'},{l:"(Partir)",go:null}]},
  c3non2:{t:"Tu me menaces, et maintenant tu me sauves. T'es pas net. (Un temps.) Non. Mais l'escalier de secours de l'hôtel, en face : il descend si on tire sur la chaîne, à droite. Personne ne le sait. Démerde-toi.",act:()=>{if(!S.escalier){S.escalier=true;toast("Nouvel accès : l'escalier de secours de l'hôtel, en face");refreshHud();emit('save')}},c:()=>[{l:"(Partir)",go:null}]},
  c3go:{t:"Qu'est-ce que t'attends ? La porte est ouverte. Et ne me ramène pas la Faucheuse.",c:()=>[{l:"(Partir)",go:null}]},
});
SHAKE.add('c3non');SHAKE.add('c3prix');
const noxE0=DLG.nox.entry;
DLG.nox.entry=()=>S.chapter===3?(S.noxWith?'c3avec':'c3'):noxE0();
Object.assign(DLG.nox.nodes,{
  c3:{t:()=>S.noxPaid?"(Ses diodes clignotent dans le noir.) Je t'ai vu passer. J'ai tout enregistré : la puce, le décodeur, les haut-parleurs. Si tu vas où je crois, emmène-moi. Une preuve, ça se rejoue.":"Hé, humain. Le courant est coupé, mes batteries tiennent. Pour combien de temps, je ne sais pas. J'enregistre tout, tu sais. Même ça.",
    c:()=>[{l:"Viens avec moi, Nox.",if:()=>S.noxPaid,go:'c3oui'},{l:"Tiens, 10 crédits. Et viens avec moi.",if:()=>!S.noxPaid&&S.credits>=10,go:'c3paye'},{l:"(Partir)",go:null}]},
  c3oui:{t:"Contrat accepté. Je passe par les égouts, j'ai l'habitude. On se retrouve chez les Canuts.",act:()=>{S.noxWith=true;toast('NOX-7 te rejoindra chez les Canuts');emit('save')},c:()=>[{l:"(Partir)",go:null}]},
  c3paye:{t:"Transaction acceptée. Je passe par les égouts, j'ai l'habitude. On se retrouve chez les Canuts. Et j'enregistre tout.",act:()=>{S.credits-=10;S.noxPaid=true;S.noxWith=true;toast('NOX-7 te rejoindra chez les Canuts');refreshHud();emit('save')},c:()=>[{l:"(Partir)",go:null}]},
  c3avec:{t:"Égouts, Canuts, enregistrement. Je n'ai pas oublié.",c:()=>[{l:"(Partir)",go:null}]},
});

/* ---------- Sur les toits : Mara en bas, le transformateur, Sid à la trappe ---------- */
TOITS.Z.talk=k=>openDialog(k);
DLG.sidToits={name:'Sid',entry:()=>'start',nodes:{
  start:{t:"Te voilà. J'ai cru que la Faucheuse t'avait eu. (Il soulève la trappe du bout du pied.) En bas, c'est les traboules : des passages à travers les immeubles, d'ici jusqu'à la Croix-Rousse. Les canuts les connaissaient par cœur. Moi aussi.",
    c:()=>[{l:"Et Mara ?",go:'mara'},{l:"On descend.",go:()=>emit('chapitre4')}]},
  mara:{t:()=>S.maraFree===true?"Elle est passée avant toi, essoufflée, le décodeur sous le bras. Elle nous attend chez les Canuts. Tu lui as rendu un sacré service, en bas.":S.maraFree===false?"Je l'ai vue monter dans le fourgon. (Il crache par-dessus le parapet.) S'ils l'emmènent à la tour, on la retrouvera là-bas. Mara, ça ne se perd pas.":"Pas vue. Elle sait se débrouiller, Mara. Viens.",
    c:()=>[{l:"On descend.",go:()=>emit('chapitre4')}]},
}};
let maraAnim=null;
function majToits(dt){
  const H=TOITS.H;if(!H.mara)return;
  if(state==='play'&&!S.maraVue&&P.pos.x>-13.5&&P.pos.x<-4&&P.pos.z>-5.2&&P.pos.z<-2.2){S.maraVue=true;heure(4*60+28);voirMara()}
  if(state==='play'&&S.maraVue&&S.maraFree===null&&P.pos.z<-17){S.maraFree=false;fourgonPart();toast('En bas, le fourgon démarre. Mara est à l\'intérieur.');refreshHud();emit('save')}
  if(maraAnim){maraAnim.t+=dt;const k=Math.min(1,maraAnim.t/maraAnim.dur);maraAnim.f(k);if(k>=1)maraAnim=null}
}
function voirMara(){
  const H=TOITS.H,x=P.pos.x;
  cine([
    {t:0,cam:{p:[x,2.4,-2.2],l:[-10.5,-15.5,6],dur:0,fov:42}},
    {t:.2,sub:{qui:'',texte:'(En bas, deux Gardiens poussent Mara vers un fourgon. L\'un d\'eux porte le décodeur.)',dur:3.6}},
    {t:3.9,cam:{p:[x,2.4,-2.2],l:[-10.5,-15.5,6],l2:[-5.5,-10.6,4],dur:1.6,fov:42}},
    {t:4,sub:{qui:'',texte:'(Le transformateur, sur le poteau… Une balle, et toute la rue retombe dans le noir.)',dur:3.4}},
    {t:7.5,fn:()=>{refreshHud();emit('save')}},
  ]).then(()=>{P.yaw=Math.atan2(-(-5.5-P.pos.x),-(4-P.pos.z));P.pitch=-.95});
}
function fourgonPart(){const H=TOITS.H;H.mara.visible=false;for(const g of H.gardesBas)g.visible=false;const z0=H.fourgon.position.z,p0=H.phares.position.z;maraAnim={t:0,dur:4,f:k=>{H.fourgon.position.z=z0+k*k*30;H.phares.position.z=p0+k*k*30;H.phares.target.position.z=p0+8+k*k*30}}}
on('lampeCassee',l=>{
  const H=TOITS.H;if(!l.transfo||S.maraFree!==null)return;
  S.maraFree=true;heure(4*60+31);
  const v=new V3(-5.5,-10.4,4);burst(v,90);crashSound();tone(90,.6,'sawtooth',.06,40);
  for(const b of H.lampesBas){b.l.intensity=0;b.b.visible=false}H.gyroL.intensity=0;H.reverbere.intensity=0;H.phares.intensity=.6;for(const g of H.gyro)g.visible=false;
  const m0=H.mara.position.clone();maraAnim={t:0,dur:3,f:k=>{H.mara.position.set(m0.x-k*12,m0.y,m0.z+k*7);H.mara.rotation.y=-2.2;H.gardesBas[0].rotation.y=-2.2+k*3;if(k>=1)H.mara.visible=false}};
  toast('Le transformateur saute. Dans le noir, Mara se dégage et disparaît.');refreshHud();emit('save');
});
// Nouvelle partie : la scène du fourgon reprend sa place.
function resetToits(){const H=TOITS.H;if(!H.mara)return;H.mara.visible=true;H.mara.position.set(-9.5,-16,7.6);for(const g of H.gardesBas)g.visible=true;H.fourgon.position.z=5.5;
  for(const b of H.lampesBas){b.l.intensity=1.4;b.b.visible=true}H.gyroL.intensity=1.6;H.reverbere.intensity=2.2;H.phares.intensity=3}
// État des toits restauré au chargement
function appliquerToits(S){
  const H=TOITS.H;if(!H.mara)return;
  if(S.maraFree===true){H.mara.visible=false;for(const b of H.lampesBas){b.l.intensity=0;b.b.visible=false}H.gyroL.intensity=0;H.reverbere.intensity=0;H.phares.intensity=.6;for(const g of H.gyro)g.visible=false}
  if(S.maraFree===false){H.mara.visible=false;for(const g of H.gardesBas)g.visible=false;H.fourgon.position.z=35}
}

/* ---------- Le chapitre ---------- */
defineChapter(3,{
  zone:S=>S.toits?'toits':'rue',
  objectives(S,L){
    if(S.toits){
      L.push(["Rejoins Sid près de la trappe, de l'autre côté des toits",'']);
      if(S.maraVue&&S.maraFree===null){L.push(['Aide Mara : tire sur le transformateur, en bas','sub']);L.push(['Ou laisse faire et continue','sub'])}
      else L.push(['Évite le projecteur : abrite-toi sous les citernes','sub']);
    }else if(S.kovacAide)L.push(["Passe par l'arrière-boutique de Kovac",'']);
    else if(S.escalier)L.push(["Monte par l'escalier de secours de l'hôtel, en face",'']);
    else{L.push(['Rejoins le bar de Kovac sans croiser le projecteur','']);L.push(['Abris : auvent du bar, abribus, alcôve du décodeur','sub'])}
  },
  checkpoint(S){
    if(!S.toits)return[-4.6,17.6,Math.PI/2];
    if(P.pos.z<-17)return[-11.95,-21.2,0];if(P.pos.x<-2)return[-4.4,-9.5,Math.PI/2];if(P.pos.z<0)return[6.7,-4.2,0];return[1.9,8.4,0];
  },
  reset(){if(rue3)activerRue(false);absents(false);RUE.rallumerRue();rallumer(RUE.Z);if(TOITS.Z.construite){rallumer(TOITS.Z);resetToits()}anim=null;maraAnim=null},
  apply(S){if(S.chapter<3)return;installerRue();activerRue(S.chapter===3);absents(true);RUE.blackout(0);rue3.fau.hCur=rue3.fau.h;anim=null;majAnim(0);appliquerToits(S)},
  describe(S){return S.toits?(S.maraFree===true?'chapitre 3 · Mara libérée':S.maraFree===false?'chapitre 3 · Mara capturée':'chapitre 3 · les toits'):'chapitre 3 · black-out'},
  droneOpts(){return{boost:false,showTut:true}},
});
// Mise à jour propre au chapitre (appelée à chaque image par la zone)
const rueUpdate0=RUE.Z.update;RUE.Z.update=(dt,S)=>{rueUpdate0(dt,S);majAnim(dt)};
const toitsUpdate0=TOITS.Z.update;TOITS.Z.update=(dt,S)=>{toitsUpdate0(dt,S);majToits(dt)};

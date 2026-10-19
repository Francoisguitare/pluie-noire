// Chapitre 4 : « Traboules ». Sous la Croix-Rousse, de la trappe des toits jusqu'aux Nouveaux Canuts.
// Rosa Delorme, Varga et sa clé tissée sur un métier Jacquard, le choix de Varga (témoigner ou se rendre),
// puis la galerie des câbles qui mène aux quais de Saône (chapitre 5).
import {V3,P,G,setState,on,emit} from '../core.js';
import {tone,frapper,porteMetal} from '../son.js';
import {toast,fade} from '../interface.js';
import {DLG,SHAKE,openDialog,stopDialog} from './dialogue.js';
import {S,defineChapter,refreshHud,heure,allerZone} from './partie.js';
import {rallumer} from '../construire.js';
import {cine} from '../cinema.js';
import {zone} from '../zones.js';
import {ouvrirMetier} from '../metier.js';
import {Z,H,deplacer,montrer} from '../lieux/traboules.js';

Z.talk=k=>openDialog(k);

/* ---------- Entrée dans les traboules ---------- */
function entrer(){
  stopDialog();S.chapter=4;S.trappe=true;if(S.maraFree===null)S.maraFree=false;heure(4*60+40);G.grace=3;setState('play');
  allerZone('traboules',[0,-1,0],{ensuite:()=>{presence();majPortes(0,true);refreshHud();toast('Sous la Croix-Rousse. La trappe se referme, la pluie se tait.')}});
}
on('chapitre4',entrer);

// Qui est où, selon l'histoire : Sid à la trappe puis chez les Canuts, Mara si elle s'est échappée, Nox s'il a suivi,
// Varga tant qu'elle ne s'est pas rendue (et le Gardien de son atelier avec elle).
function presence(){
  if(!H.sid)return;
  if(S.canuts)deplacer(H.sid,-47.8,-47.6,Math.PI*.75);else deplacer(H.sid,.4,-4.5,Math.PI);
  montrer(H.sid,S.canuts||!S.sidTrab);
  montrer(H.mara,S.maraFree===true);H.ecranDecodeur.visible=S.maraFree===true;
  montrer(H.nox,!!S.noxWith);
  montrer(H.varga,S.vargaTestifies!==false);
  gardienAtelier(S.vargaTestifies!==false);
}
function gardienAtelier(v){const g=H.gardienG,i=Z.gardiens.indexOf(g);if(v&&i<0)Z.gardiens.push(g);if(!v&&i>=0)Z.gardiens.splice(i,1);g.g.visible=v}
// La porte de l'atelier de Varga pivote ; celle de la galerie remonte dans le mur.
function majPortes(dt,net){
  if(!H.porteAtelier)return;const k=net?1:Math.min(1,dt*2.5);
  H.porteAtelier.rotation.y+=((S.atelierOuvert?Math.PI*.48:0)-H.porteAtelier.rotation.y)*k;H.porteAtelierCol.off=!!S.atelierOuvert;
  H.porteGalerie.position.y+=((S.galerie?3.85:1.25)-H.porteGalerie.position.y)*k;H.porteGalerie.userData.col.off=!!S.galerie;
  H.lecteur.material.color.setHex(S.galerie?0x30ff80:0xff3030).multiplyScalar(2);
}

/* ---------- Interactions ---------- */
// La porte des Canuts, sous l'enseigne : on frappe depuis la cour, on peut ressortir de l'intérieur.
Z.inter.push({p:new V3(-41.3,0,-45.3),r:2,on:()=>P.pos.z>-46,label:()=>S.canuts?'Entrer chez les Canuts':'Frapper à la porte des Canuts',act:()=>S.canuts?emit('teleport',-41.3,-47.6,0,''):frapperPorte()});
Z.inter.push({p:new V3(-41.3,0,-47.3),r:1.8,on:()=>P.pos.z<-46.6,label:()=>'Ressortir dans la cour',act:()=>emit('teleport',-41.3,-44.9,Math.PI,'')});
function frapperPorte(){
  frapper();G.grace=5;const x=P.pos.x,z=P.pos.z;
  cine([
    {t:0,cam:{p:[x,1.62,z],l:[-41.3,1.4,-46],dur:0}},
    {t:1,sub:{qui:'Derrière la porte',texte:'Qui va là ?',dur:1.7}},
    {t:2.8,sub:{qui:'Ash',texte:"Sid m'envoie.",dur:1.5}},
    {t:4.4,fn:()=>{tone(210,.22,'square',.03,120);setTimeout(()=>tone(160,.3,'square',.03,90),180)}},
    {t:4.9,fn:()=>fade(true)},
    {t:5.3,fn:entrerChezCanuts},
  ]).then(()=>{fade(false);toast("L'atelier des Nouveaux Canuts. Ça sent l'huile de machine et le café brûlé.");emit('save')});
}
function entrerChezCanuts(){S.canuts=true;heure(4*60+52);P.pos.set(-41.3,0,-47.6);P.yaw=0;P.pitch=0;P.vx=P.vz=0;presence();refreshHud()}
// La porte de l'atelier de Varga, depuis le refuge
Z.inter.push({p:new V3(-50.15,0,-55.5),r:2,on:()=>!S.atelierOuvert,label:()=>"Ouvrir la porte de l'atelier de Varga",act:()=>{
  if(!S.vargaVue){tone(180,.15,'square',.04);toast(S.rosaVue?"Rosa : « Parle d'abord à Varga. Il y a un Gardien là-dedans. »":"Rosa : « Hé ! Pas par là. Viens me voir d'abord. »");return}
  S.atelierOuvert=true;tone(150,.45,'sawtooth',.02,80);emit('save')}});
// Le grand métier Jacquard : l'énigme
Z.inter.push({p:new V3(-56.8,0,-54.4),r:2.1,on:()=>S.vargaVue&&!S.carte,label:()=>'Grand métier Jacquard : tisser la clé',act:ouvrirMetier});
on('metierReussi',()=>{S.carte=true;heure(5*60+8);toast('Tu as la clé : un ruban de soie rouge et or. Rapporte-le à Varga.');refreshHud();emit('save')});
// La galerie des câbles : le badge de Varga, puis la grille des quais au bout
Z.inter.push({p:new V3(-65.3,0,-61.2),r:2,on:()=>!S.galerie,label:()=>S.badge?'Passer le badge de Varga':'Porte de la galerie des câbles',act:()=>{
  if(!S.badge){tone(180,.15,'square',.04);toast('Un lecteur de badge Helix. Fermé.');return}
  S.galerie=true;heure(5*60+20);porteMetal();toast('Le lecteur passe au vert. La porte remonte dans le mur.');refreshHud();emit('save')}});
Z.inter.push({p:new V3(-65.3,0,-78.6),r:2.2,on:()=>S.galerie,label:()=>'Pousser la grille des quais',act:()=>emit('chapitre5')});

/* ---------- Dialogues ---------- */
const partir=()=>[{l:'(Partir)',go:null}];
DLG.sidTrab={name:'Sid',entry:()=>S.canuts?(S.galerie?'galerie':'canuts'):'start',nodes:{
  start:{t:"(Sid laisse retomber la trappe. La pluie n'est plus qu'un bruit lointain, quelque part au-dessus.) Les traboules. Les canuts y descendaient la soie jusqu'à la Saône sans qu'elle prenne une goutte. Nous, on y descend ce qui reste de nous.",
    c:()=>[{l:'Où on va ?',go:'ou'},{l:"Il y a quelqu'un, en bas ?",go:'gardiens'}]},
  ou:{t:"Chez Rosa Delorme. Les Nouveaux Canuts. Cour des Voraces, le grand escalier : la porte sous l'enseigne, au rez-de-chaussée. Tu frappes, tu dis que c'est moi qui t'envoie.",
    c:()=>[{l:'Et les Gardiens ?',go:'gardiens'},{l:'Tu ne viens pas ?',go:'seul'}]},
  gardiens:{t:"(Il tend l'oreille. Des bottes, quelque part devant.) Helix fouille les passages. Les Gardiens, c'est pas des drones : eux, ils ont des oreilles. Tu cours, ils t'entendent de loin. Tu marches, de près. Tu te baisses, t'es un chat. Et leurs lampes, ça se casse.",
    c:()=>[{l:'Où sont les Canuts ?',go:'ou'},{l:'Tu ne viens pas ?',go:'seul'}]},
  seul:{t:"Mes genoux ne passent plus par où tu vas passer. Je prends par les caves : je connais un chemin que leurs plans ignorent. On se retrouve chez Rosa. (Il s'enfonce dans le noir sans un bruit. Pour un vieux, il marche drôlement bien.)",
    act:()=>{S.sidTrab=true;refreshHud()},c:partir},
  canuts:{t:"Je t'avais dit : les caves, c'est mon métro. (Il se frotte les genoux.) La galerie des câbles, dans l'atelier de Varga, c'est moi qui l'ai posée, en 2029. Elle file droit jusqu'aux quais de Saône.",c:partir},
  galerie:{t:"Au bout de la galerie, une grille, puis les quais. Ensuite c'est Confluence, et la tour. (Il te serre l'épaule, fort.) Reviens avec tes deux mains. La vraie et la K7.",c:partir},
}};
// Sid part par les caves dès la fin de la conversation.
on('dialogClosed',()=>{if(zone()===Z&&S.sidTrab&&!S.canuts&&!H.sid.absent)montrer(H.sid,false)});

DLG.rosa={name:'Rosa Delorme',entry:()=>!S.rosaVue?'start':S.vargaTestifies===true?'temoin':S.vargaTestifies===false?'rendue':S.carte?'carte':'encore',nodes:{
  start:{t:()=>"(Une femme d'une soixantaine d'années, cheveux gris coupés court, bras gauche K7 noir de cambouis. Elle ne te tend pas la main.) Rosa Delorme. C'est moi qui ai payé Mara pour la puce. Alors c'est toi, Ash. "+
    (S.maraFree?"Mara est arrivée il y a dix minutes, trempée, le décodeur sous le bras. Elle m'a raconté le transformateur.":"Mara n'est pas venue. Sid dit qu'ils l'ont embarquée dans un fourgon. Le décodeur avec."),
    c:()=>[{l:'Qui sont les Nouveaux Canuts ?',go:'canuts'},{l:'La K7.2. Tu es au courant ?',go:'k72'}]},
  canuts:{t:"Des mécanos. Des soudeuses, des tisserands, des dockers. Tous augmentés, tous K7, tous à crédit chez Helix. En 1831, les canuts sont descendus de la Croix-Rousse parce qu'on leur volait leur travail. Nous, on nous vole nos mains. (Elle montre la devise peinte sur l'affiche.) Vivre en travaillant ou mourir en combattant. On a juste ajouté les pièces détachées.",
    c:()=>[{l:'Et la K7.2 ?',go:'k72'}]},
  k72:{t:"Six heures, l'antenne de la tour, toutes les K7 réarmées. Et celles qui ont décroché cette nuit, grillées. (Elle serre son poing gauche, lentement, comme pour vérifier qu'il obéit encore.) On n'arrête pas une diffusion pareille avec des clés à molette. Mais on a quelqu'un qui peut.",
    c:()=>[{l:'Qui ?',go:'varga'}]},
  varga:{t:"Ilse Varga. L'ingénieure qui a dessiné l'interface des K7. Et le kill-switch, sous la contrainte. Elle a frappé à notre porte il y a une heure, avec un œil K7 qui clignotait rouge. Helix la cherche partout. Elle est là, au fond, près de l'établi. Elle ne fait confiance à personne. Toi non plus, sûrement.",
    act:()=>{if(!S.rosaVue){S.rosaVue=true;heure(4*60+56);refreshHud()}},c:()=>[{l:'Je vais lui parler.',go:null}]},
  encore:{t:()=>S.vargaVue?"Un Gardien est entré par la galerie des câbles. Il tourne entre les métiers de Varga. Nos lampes, là-dedans, tu peux les casser : on en a d'autres.":"Varga est au fond, près de l'établi. Vas-y doucement : elle a eu une longue nuit.",c:partir},
  carte:{t:"Tu l'as ? (Elle regarde le ruban sans le toucher.) Ma grand-mère tissait ça pour les soieries de la presqu'île. Des fleurs, des oiseaux. Jamais des clés. Porte-le à Varga.",c:partir},
  temoin:{t:"Elle témoignera. Il faudra la garder en vie jusque-là : ça, c'est notre affaire. (Un temps.) Le reste, c'est toi qui le portes. La galerie des câbles, au fond de son atelier, mène aux quais. De là, Confluence. (Elle te glisse une oreillette dans la main.) On t'entendra. On te parlera.",c:partir},
  rendue:{t:"Elle est partie se rendre. Je n'ai pas pu la retenir. (Elle crache dans un chiffon.) Il faut croire qu'on n'a pas les mêmes héros. La galerie des câbles, au fond de son atelier, mène aux quais. (Elle te glisse une oreillette dans la main.) On t'entendra. Ne traîne pas.",c:partir},
}};
SHAKE.add('rendue');

// Varga vouvoie tout le monde : quinze ans de couloirs de direction.
let seRend=false;
DLG.varga={name:'Dr Ilse Varga',entry:()=>!S.vargaVue?'start':!S.carte?'attente':S.vargaTestifies===null?'tissu':'apres',nodes:{
  start:{t:"(Elle ne se lève pas. Son œil gauche, un K7, clignote d'un rouge lent, comme une veilleuse.) Vous êtes la personne qui a volé ma puce. (Un temps.) Ne vous excusez pas. C'est ce qui pouvait arriver de mieux à ce prototype.",
    c:()=>[{l:'Comment on arrête la K7.2 ?',go:'k72'},{l:'Ton œil clignote.',go:'oeil'}]},
  oeil:{t:"Il me cherche. Helix sait toujours où sont ses produits. Sous la pierre, le signal passe mal : c'est pour ça que je suis ici, et pas ailleurs.",c:()=>[{l:'Comment on arrête la K7.2 ?',go:'k72'}]},
  k72:{t:"L'antenne de la tour diffusera la mise à jour à six heures. De l'extérieur, rien ne l'arrête. De l'intérieur, il faut deux choses : un badge de la direction, j'ai le mien. Et la clé d'override, que j'ai cachée là où aucun informaticien d'Helix n'irait la chercher.",
    c:()=>[{l:'Où ?',go:'cle'}]},
  cle:{t:"Dans mon atelier, à côté. Sur les cartes perforées du grand métier Jacquard. (Presque un sourire.) Jacquard, Lyon, 1801 : le premier programme de l'histoire était un tissu. L'antenne ne demande pas un mot de passe, elle lit un motif. Le ruban tissé, c'est la clé.",
    c:()=>[{l:"Pourquoi tu n'y vas pas toi-même ?",go:'garde'}]},
  garde:{t:"Parce qu'un Gardien est entré par la galerie des câbles et qu'il fait les cent pas entre mes métiers. C'est moi qu'il cherche. (Elle te tend un carnet taché d'huile.) Les cartes sont dans le tiroir du grand métier. Posez-les dans le bon ordre, et tissez le motif dessiné là. Et souvenez-vous : le métier lit les cartes de dos.",
    act:()=>{if(!S.vargaVue){S.vargaVue=true;heure(5*60);toast('Nouvel objectif : tisser la clé sur le grand métier Jacquard');refreshHud()}},c:()=>[{l:'(Prendre le carnet)',go:null}]},
  attente:{t:"Le grand métier, au milieu de mon atelier. Les cartes sont dans le tiroir. Le métier lit les cartes de dos. Et ne vous faites pas voir : ce Gardien n'a pas l'air d'aimer les métiers à tisser.",c:partir},
  tissu:{t:"(Elle déroule le ruban sous la lampe. Une clé d'or sur la soie rouge, nette, à l'endroit.) C'est elle. (Elle le replie avec soin et te le rend.) Gardez-la contre vous. Maintenant, écoutez-moi : je vais me rendre.",
    c:()=>[{l:'Te rendre ? À Helix ?',go:'rendre'}]},
  rendre:{t:"À Victor Saal. Je le connais depuis quinze ans. Si je me présente moi-même, je peux négocier : la K7.2 retardée, une sortie propre pour le quartier. Si on me trouve ici, ce sera la prison. Pour moi, et pour tous ceux qui m'ont cachée.",
    c:()=>[{l:"« Je ne signerai pas le prochain rapport. » C'est toi qui as écrit ça.",if:()=>S.readMail,go:'mail'},{l:"Saal ne négocie pas. Il éteint.",go:'refus'},{l:"C'est ton choix.",go:'refus2'}]},
  mail:{t:"(Elle se fige.) Vous avez lu mon courrier. (Long silence. L'œil clignote.) Le prochain rapport, c'est la K7.2. Si je me rends, c'est moi qui la signe. (Elle se redresse, et pour la première fois elle a l'air de quelqu'un qui a dormi.) Très bien. Je témoignerai. Devant qui vous voudrez. Devant toute la ville, s'il le faut.",
    act:()=>{S.vargaTestifies=true;if(S.noxWith)S.temoignage=true;heure(5*60+14)},c:()=>[{l:'Nox, tu enregistres ?',if:()=>S.noxWith,go:'nox'},{l:'Merci.',if:()=>!S.noxWith,go:'badge'}]},
  nox:{t:"(Près de l'entrée, les diodes de NOX-7 passent au rouge.) « J'enregistre depuis le début. C'est mon défaut de fabrication. » (Varga regarde le robot, puis toi, et parle face à lui : son nom, son poste, la K7, le kill-switch, les ordres. Tout.) Voilà. C'est dit.",
    act:()=>{toast('NOX-7 a enregistré le témoignage de Varga')},c:()=>[{l:'Merci.',go:'badge'}]},
  badge:{t:"(Elle détache le badge de sa blouse.) Mon badge de direction. Il ouvre la galerie des câbles, l'ascenseur de la tour, l'étage des serveurs. Moi, je reste avec Rosa. Quand vous aurez besoin de ma voix, vous l'aurez.",
    act:()=>donnerBadge(),c:partir},
  refus:{t:"(Elle secoue la tête.) Vous ne le connaissez pas. Moi, si. C'est un homme raisonnable, et c'est bien ce qui me fait peur. Mais c'est la seule porte qui reste.",c:()=>[{l:'(La laisser partir)',go:'badge2'}]},
  refus2:{t:"Oui. Le premier que je fais moi-même depuis longtemps.",c:()=>[{l:'(La laisser partir)',go:'badge2'}]},
  badge2:{t:"(Elle détache le badge de sa blouse et te le tend.) Mon badge de direction. Il ouvre la galerie des câbles, l'ascenseur de la tour, l'étage des serveurs. Là où je vais, je n'en aurai plus besoin. (Elle se lève, lisse sa blouse, et se tourne vers son atelier, où rôde le Gardien.)",
    act:()=>{S.vargaTestifies=false;seRend=true;donnerBadge()},c:partir},
  apres:{t:"Allez. Et si vous croisez Victor Saal, ne le laissez pas parler trop longtemps. C'est comme ça qu'il gagne.",c:partir},
}};
SHAKE.add('refus');SHAKE.add('rendre');
function donnerBadge(){if(S.badge)return;S.badge=true;tone(900,.08,'triangle',.04);setTimeout(()=>tone(1300,.12,'triangle',.04),90);toast('Badge de direction Helix récupéré');refreshHud()}
// Varga se rend : ellipse au noir, l'atelier se vide, le Gardien repart avec elle.
on('dialogClosed',()=>{if(!seRend)return;seRend=false;
  cine([
    {t:0,fn:()=>fade(true)},
    {t:0,cam:{p:[-42.5,1.65,-53],l:[-50,1.3,-55.5],dur:0,fov:55}},
    {t:.45,fn:()=>{montrer(H.varga,false);S.atelierOuvert=true;majPortes(0,true)}},
    {t:.6,sub:{qui:'',texte:"(Varga traverse l'atelier sans se retourner. Une porte. Une voix d'homme, deux phrases calmes. Puis des pas qui s'éloignent vers la cour.)",dur:4.6}},
    {t:1.2,fn:()=>fade(false)},
    {t:5.3,fn:()=>{gardienAtelier(false);heure(5*60+16)}},
  ]).then(()=>{toast("Le Gardien est reparti avec elle. L'atelier de Varga est vide.");refreshHud();emit('save')});
});

DLG.maraTrab={name:'Mara',entry:()=>S.maraTrab?'apres':'start',nodes:{
  start:{t:()=>S.forced?"(Le décodeur ronronne sur l'établi, branché sur une batterie de voiture. Mara te regarde longtemps avant de parler.) Tu m'as sortie de là. Après ce que je t'ai fait à la main. (Elle sort le boîtier noir de sa poche et le fait tourner entre ses doigts.) Je ne sais pas si t'es bête ou si t'es mieux que moi.":
      "(Le décodeur ronronne sur l'établi, branché sur une batterie de voiture.) Sans toi, je serais dans un fourgon, en route pour la tour. (Elle allume une cigarette.) Je déteste devoir quelque chose à quelqu'un. Alors je fais vite : merci.",
    c:()=>S.forced?[{l:'Donne-moi ce boîtier.',go:'boitier'},{l:'Garde-le. Mais ne t\'en sers plus jamais.',go:'garde'}]:[{l:'Et maintenant ?',go:'suite'}]},
  boitier:{t:"(Elle hésite. Puis elle te le lance. Tu l'attrapes de la main gauche.) Il est à toi. Ne me remercie pas. La prochaine fois que j'aurai envie de m'en servir, je m'en voudrai moins de ne pas l'avoir.",
    act:()=>{S.boitier='ash';toast('Tu as le boîtier de Mara')},c:()=>[{l:'Et maintenant ?',go:'suite'}]},
  garde:{t:"(Elle le remet dans sa poche, lentement.) Promis. Pour ce que valent mes promesses.",act:()=>{S.boitier='mara'},c:()=>[{l:'Et maintenant ?',go:'suite'}]},
  suite:{t:"Maintenant, la tour. Le décodeur tient encore les K7 du quartier hors de portée d'Helix, mais pas après six heures. Je le garde ici, branché. (Elle tire sur sa cigarette.) Et quand tu seras là-haut, je viendrai. Je connais deux ou trois portes qu'Helix a oubliées.",
    act:()=>{S.maraTrab=true},c:partir},
  apres:{t:()=>S.boitier==='ash'?"Le boîtier, tu le gardes au fond d'une poche. Pas dans ta main droite.":"La tour. Six heures. Je serai là-haut, ne t'inquiète pas pour moi.",c:partir},
}};
DLG.noxTrab={name:'Nox',entry:()=>S.temoignage?'temoin':'start',nodes:{
  start:{t:"(Le robot est couvert de vase jusqu'aux genoux.) Humain ! Je t'avais dit que je connaissais le chemin. Les égouts de la Croix-Rousse sont très mal entretenus. J'ai ouvert un ticket.",
    c:()=>[{l:'Tu as tout enregistré ?',go:'enr'},{l:'(Partir)',go:null}]},
  enr:{t:"Tout. La puce. Le décodeur. Les haut-parleurs d'Helix. Le black-out. (Ses diodes clignotent.) Si quelqu'un d'important disait la vérité devant moi, ça ferait une très bonne fin d'enregistrement. Je dis ça, je ne dis rien.",c:partir},
  temoin:{t:"J'ai la voix de Varga, son visage, son œil qui clignote. Avec ça sur tous les écrans de la ville… (Ses diodes passent au vert.) Il faudrait juste un émetteur assez puissant. Une antenne, par exemple. Je viens avec toi.",c:partir},
}};

/* ---------- Le chapitre ---------- */
defineChapter(4,{
  zone:'traboules',
  objectives(S,L){
    if(!S.canuts){L.push(['Rejoins les Nouveaux Canuts, cour des Voraces','']);
      L.push(["Les Gardiens entendent tes pas : accroupis-toi près d'eux",'sub']);
      if(S.sidTrab)L.push(["La porte sous l'enseigne, au pied du grand escalier",'sub'])}
    else if(!S.rosaVue)L.push(["Parle à Rosa Delorme, au milieu de l'atelier",'']);
    else if(!S.vargaVue)L.push(["Parle à Varga, au fond de l'atelier",'']);
    else if(!S.carte){L.push(["Tisse la clé sur le grand métier, dans l'atelier de Varga",'']);L.push(['Un Gardien fait sa ronde entre les métiers','sub']);L.push(['« Le métier lit les cartes de dos »','sub'])}
    else if(!S.badge)L.push(['Rapporte le ruban à Varga','']);
    else if(!S.galerie){L.push(["Ouvre la galerie des câbles avec le badge de Varga, au fond de son atelier",'']);if(S.vargaTestifies)L.push(['Le Gardien est toujours là','sub'])}
    else L.push(["Suis la galerie jusqu'aux quais de Saône",'']);
    if(S.canuts&&S.maraFree&&!S.maraTrab)L.push(['Mara est là, près du décodeur','sub']);
  },
  // Points sûrs : la trappe, le bout du premier passage, les alcôves du long passage, l'entrée du refuge.
  checkpoint(S){const p=P.pos;
    if(S.canuts)return p.x<-50?[-48.6,-55.5,Math.PI/2]:[-41.3,-47.6,0];
    if(p.x<-29.5)return[-23.4,-32.3,Math.PI];
    if(p.x<-10.3)return[-15.4,-32.3,Math.PI];
    if(p.z<-20.3)return[0,-18.5,0];
    return[0,-1,0]},
  reset(){if(!Z.construite)return;rallumer(Z);presence();majPortes(0,true)},
  apply(S){if(S.chapter<4||!Z.construite)return;presence();majPortes(0,true)},
  describe(S){return S.galerie?'chapitre 4 · la galerie des câbles':S.carte?'chapitre 4 · la clé de Varga':S.canuts?'chapitre 4 · chez les Canuts':'chapitre 4 · les traboules'},
});
const trabUpdate0=Z.update;Z.update=(dt,S)=>{trabUpdate0(dt,S);majPortes(dt)};

// L'exploration : 41 archives Helix réparties en six dossiers (chacun raconte une histoire et se termine par une
// révélation), sous plusieurs formes (carte mémoire au sol, graffiti, affiche, répondeur, écran), la lecture sans
// lâcher la visée, l'écran « Dossiers », le signal de la main K7 près d'une archive, les lieux à découvrir, les
// premières rencontres, les annonces d'Helix qui suivent la nuit, et ce que certaines archives changent à l'histoire
// (Kovac, Varga, Sid, Rosa, le casier des quais, l'épilogue).
import {THREE,$,V3,P,T,camera,MOBILE,state,setState,on,emit,clamp} from './core.js';
import {S,heure,refreshHud} from './histoire/partie.js';
import {zone} from './zones.js';
import {toast,ouvrirEcran,fermerEcran} from './interface.js';
import {glow,M,into,addBox} from './construire.js';
import {softDot,mk,canvasTex} from './textures.js';
import {DLG} from './histoire/dialogue.js';
import {gagner,porteeEcho} from './pouvoirs.js';
import {moniteur} from './ordinateurs.js';
import {archiveSound,bipSignal,annonce,tone} from './son.js';

/* ====================================================================================================
   Les dossiers et leurs archives
   ==================================================================================================== */
export const DOSSIERS=[
  {id:'vaise',titre:'Les mains de Vaise',intro:"L'usine Helix de Vaise, ses cadences, ses accidents. Et ce qu'on vend ensuite à ceux qui y ont laissé une main.",
    revelation:"La nuit de l'accident d'Ash, la ligne 4 tournait trente pour cent plus vite que d'habitude. La note qui l'ordonne porte la signature de Victor Saal : « Il nous faut des porteurs K7 dans le quartier. Les accidents ont un coût. Les prothèses ont un prix. »\n\nTa main n'est pas un accident. C'est une vente."},
  {id:'gardien12',titre:'Le Gardien 12',intro:"Un agent d'Helix dont l'armure s'est refermée sur lui, en pleine ronde. Personne ne l'a revu.",
    revelation:"Le Gardien 12 s'appelait Théo Ferrand. Il avait compris que les armures portaient le même kill-switch que les K7, et il comptait le dire. Helix l'a éteint dans sa propre coquille, puis l'a rangé à l'étage -3 de la tour, « en maintenance définitive ».\n\nLa Coupure que porte ta main, c'est son cauchemar retourné contre ceux qui l'ont inventé."},
  {id:'varga',titre:'Le dossier Varga',intro:"Comment une ingénieure qui voulait rendre aux gens la sensation de la pluie a fini par dessiner un interrupteur.",
    revelation:"Ilse Varga a conçu la coupure pour arrêter une prothèse folle, une seule, en cas d'urgence. On lui a demandé de la rendre silencieuse, puis collective, puis permanente. Elle a obéi trois fois.\n\nLa quatrième, elle a caché l'override dans un tissu, sur un métier de 1801, en se disant que seul quelqu'un qui sait regarder les mains le trouverait."},
  {id:'nox',titre:'Ce que Nox a enregistré',intro:"NOX-7 dit que tout enregistrer, c'est son défaut de fabrication. Ses fichiers racontent autre chose.",
    revelation:"La série NOX n'a jamais eu de défaut. Elle a été retirée parce qu'elle ne savait pas oublier : ses mémoires ne s'effaçaient pas, et Helix ne pouvait pas se le permettre. Toutes les unités ont été broyées. Sauf une, qui s'est cachée dans la rue et a continué d'écouter.\n\nCette nuit, la seule mémoire que Helix n'a pas pu effacer marche à côté de toi."},
  {id:'saal',titre:'Victor Saal',intro:"Le directeur de la sécurité ne hausse jamais la voix. Ses papiers non plus.",
    revelation:"Victor Saal n'a aucun implant. Son dossier médical dit pourquoi : une main gauche perdue en 2019, jamais remplacée. Helix lui a proposé une K7 de direction, gratuite. Il a refusé par écrit.\n\nIl sait exactement ce qu'il y a dedans. Il n'en a jamais voulu pour lui."},
  {id:'canuts',titre:'Les Nouveaux Canuts',intro:"1831, 1834, 2041. À la Croix-Rousse, on se transmet les révoltes comme des outils.",
    revelation:"Les Nouveaux Canuts sont deux cent douze. Ils ont racheté leurs pièces détachées une à une, au marché noir, pour ne plus rien devoir à Helix. Ils ont cotisé pour payer Mara, pour payer la puce, pour payer cette nuit.\n\nIls ne t'ont jamais vu. Ils ont tous misé sur toi."},
];
// forme : carte (au sol), graffiti et affiche (sur le mur le plus proche), repondeur, ecran. tag : ce qui est écrit sur le mur.
export const ARCHIVES=[
  // ---------- la rue ----------
  {id:'rue1',dossier:'vaise',zone:'rue',x:-13.5,z:-36.5,forme:'carte',titre:'Fiche de paie, usine Helix de Vaise',
    texte:"Salaire net : 900 crédits.\nRetenue « location prothèse K7, main droite » : 212 crédits.\nRetenue « maintenance obligatoire » : 48 crédits.\nRetenue « assurance cadence » : 30 crédits.\n\nEn bas, au stylo, une écriture qui appuie trop fort : « On ne peut pas rendre une main. J'ai demandé. »"},
  {id:'rue2',dossier:'vaise',zone:'rue',x:-5.5,z:33.5,forme:'carte',titre:'Un ticket du bar de Kovac',
    texte:"Un ticket de caisse froissé : deux bols de nouilles, une bière.\n\nAu dos, au crayon, l'écriture de Kovac : « Elle tremble le matin. Le docteur d'Helix dit que c'est l'humidité. L'humidité, à Lyon-Basse. Il se fout de moi. »\n\nKovac n'aimerait pas savoir que quelqu'un a lu ça. Ou peut-être que si."},
  {id:'rue3',dossier:'saal',zone:'rue',x:7,z:-51,forme:'ecran',titre:'Note de service, labo Helix',
    texte:"DE : V. Saal, direction sécurité\nÀ : tout le personnel de laboratoire\n\n« Devant les clients, ne jamais dire coupure. Dire : mise en veille de confort. Ne jamais dire kill-switch. Dire : protocole de bienveillance. Tout manquement sera traité comme une fuite. »\n\nQuelqu'un a ajouté, dans la marge du fichier : « Bienveillance. Il ose. »"},
  {id:'rue4',dossier:'vaise',zone:'rue',x:-13.5,z:-6.5,forme:'graffiti',tag:'VAISE 2039\nILS ONT PRIS NOS MAINS\nON GARDE LES POINGS',titre:'Un graffiti dans la ruelle',
    texte:"« VAISE 2039. ILS ONT PRIS NOS MAINS. ON GARDE LES POINGS. »\n\nEn dessous, plus petit, une liste de prénoms, chacun suivi d'un mot : « bras », « main », « main », « œil », « jambe », « main ». Le dernier prénom a été effacé à la ponceuse. On devine encore : « main droite »."},
  {id:'rue5',dossier:'gardien12',zone:'rue',x:7.5,z:-30.5,forme:'affiche',tag:'AVIS DE RECHERCHE\nAGENT G-12',titre:'Avis de recherche Helix',
    texte:"AVIS DE RECHERCHE — HELIX SÉCURITÉ\nAgent G-12, armure de patrouille, matricule effacé.\nN'a pas regagné son poste depuis le 3 mars.\n« Toute personne en contact avec l'agent doit le signaler. Ne pas l'approcher. Ne pas l'écouter. »\n\nNe pas l'écouter. Sur un avis de recherche. Quelqu'un chez Helix avait peur de ce qu'il pouvait dire."},
  {id:'rue6',dossier:'canuts',zone:'rue',x:-7,z:-41,forme:'graffiti',tag:'1831 · 1834 · 2041',titre:'Trois dates sur un mur',
    texte:"« 1831 · 1834 · 2041 », à la bombe rouge, avec une navette de tisserand dessinée en dessous.\n\nLes deux premières dates, ce sont les révoltes des canuts de la Croix-Rousse. La troisième, c'est cette année. Quelqu'un, dans ce quartier, a déjà décidé que ce serait une révolte."},
  {id:'rue7',dossier:'varga',zone:'rue',x:-6,z:-50,forme:'ecran',titre:'Journal de labo, I. Varga',
    texte:"Interface K7, jour 412.\n« La patiente 31 a pleuré quand elle a senti la pluie sur ses doigts neufs. Elle a dit : je croyais que je n'aurais plus jamais froid aux mains. J'ai dû sortir du labo.\n\nC'est pour ça que je fais ce métier. Je l'écris ici pour m'en souvenir, au cas où on me demanderait un jour de faire autre chose. »"},
  {id:'rue8',dossier:'nox',zone:'rue',x:5.5,z:11.5,forme:'repondeur',titre:'Enregistrement NOX-7 n° 0001',
    texte:"(Une voix synthétique, plus jeune que celle de Nox.)\n« Unité NOX-7, première journée de service. Rue des Tanneurs, Lyon-Basse. Tâches : nettoyer, réparer, écouter les plaintes des résidents et les transmettre à Helix.\n\nRemarque personnelle : les résidents ne se plaignent jamais à moi. Ils me parlent. Je ne sais pas s'il faut le transmettre. »\n\n(Bip.) Fichier daté de 2033."},
  // ---------- les toits ----------
  {id:'toits1',dossier:'vaise',zone:'toits',x:13.4,z:11.4,forme:'carte',quete:'sid',titre:'Une photo délavée',
    texte:"L'équipe de nuit de l'usine de Vaise, 2036. Une vingtaine de personnes en bleu de travail, devant la ligne 4. Tout le monde sourit. Une main sur deux est déjà une K7.\n\nAu fond, un grand type au bonnet rouge, une bobine de câble sur l'épaule. Son bras est encore en chair et en os. C'est Sid.\n\nIl voudra sans doute la revoir."},
  {id:'toits2',dossier:'gardien12',zone:'toits',x:.6,z:-15.3,forme:'carte',titre:'Planning des Gardiens, quartier nord',
    texte:"Ronde de 4 h, toits de la rue des Tanneurs. Six agents, six matricules.\n\nLe sixième, G-12, est rayé. À côté, à la main : « ne plus l'affecter, ordre de la direction ». Et en bas, la consigne de la nuit, soulignée deux fois : « Pas de témoin. Pas d'image. »"},
  {id:'toits3',dossier:'saal',zone:'toits',x:-17.3,z:-33.3,forme:'carte',titre:'Mémo de la direction Helix',
    texte:"« Taux de réclamation K7 : 0,2 %. Taux de coupure : confidentiel.\nCoût d'une coupure : 0 crédit.\nCoût d'un procès : 2,4 millions.\nConclusion : il est moins cher de couper que de réparer. »\n\nParaphé V. S., en bas à droite. Une écriture petite, régulière, sans une rature."},
  {id:'toits4',dossier:'nox',zone:'toits',x:.6,z:7.6,forme:'repondeur',titre:'Enregistrement NOX-7 n° 1180',
    texte:"(Le bruit de la pluie sur une tôle. Puis la voix de Kovac, très bas, pas du tout bougonne.)\n« Allez. Allez, ma belle. Serre. Serre le verre. … Voilà. Tu vois que tu peux. Demain on recommence. »\n\n(Un silence. La voix de Nox, en commentaire.) « Le résident Kovac parle à sa main droite tous les soirs, sur ce toit. Je n'ai pas transmis. »"},
  {id:'toits5',dossier:'varga',zone:'toits',x:-4,z:-15.3,forme:'ecran',titre:'Un récepteur de Gardien tombé',
    texte:"ALERTE INTERNE — PRIORITÉ 1\nDr I. Varga introuvable depuis 03:58.\nDernier signal de son œil K7 : Croix-Rousse, sous la pierre. Signal faible, intermittent.\n« À retrouver vivante si possible. »\n\nSi possible. Le message a été lu par toutes les patrouilles de la nuit."},
  {id:'toits6',dossier:'canuts',zone:'toits',x:-6.6,z:-20.6,forme:'carte',titre:'Un tract des Nouveaux Canuts',
    texte:"« Réunion cette nuit, cour des Voraces. Apportez vos outils, pas vos noms.\nLes K7 nous coûtent un tiers du salaire et nous obéissent à moitié. Ça suffit.\nVivre en travaillant ou mourir en combattant.\nOn a juste ajouté les pièces détachées. — R. D. »"},
  // ---------- les traboules ----------
  {id:'trab1',dossier:'canuts',zone:'traboules',x:-9.5,z:-36,forme:'carte',quete:'rosa',titre:'Une carte perforée de 1831',
    texte:"Une vieille carte de métier Jacquard, en carton jauni, glissée dans une fente du mur. Les trous dessinent une fleur.\n\nUn canut a gravé dans le carton, à la pointe du couteau : « Vivre en travaillant ou mourir en combattant. » Et une signature : « J. Delorme ».\n\nDelorme. Comme Rosa."},
  {id:'trab2',dossier:'varga',zone:'traboules',x:-30.5,z:-15,forme:'carte',titre:'Une lettre de Varga, jamais envoyée',
    texte:"« Victor,\nvous m'aviez promis que personne ne s'en servirait. Que la coupure dormirait dans la documentation comme un extincteur dans un couloir. J'ai fait semblant de vous croire, parce que c'était plus simple et que mon nom était sur le brevet.\n\nC'est ça, ma faute. Pas de l'avoir dessinée. De vous avoir cru.\n— Ilse »\n\nLa lettre a été pliée et dépliée tant de fois qu'elle se déchire aux plis."},
  {id:'trab3',dossier:'nox',zone:'traboules',x:-67.5,z:-47,forme:'carte',titre:"Une plaque d'identification",
    texte:"Une plaque en métal, arrachée d'un châssis : « Unité de maintenance NOX-3. Lyon, presqu'île. Contrat expiré en 2039. Ne pas réparer. »\n\nQuelqu'un a ajouté au feutre, en dessous : « Pardon. »\n\nNOX-3. Il y a donc eu d'autres Nox."},
  {id:'trab4',dossier:'canuts',zone:'traboules',x:2,z:1,forme:'graffiti',tag:'VIVRE EN TRAVAILLANT\nOU MOURIR EN COMBATTANT',titre:'La devise des canuts',
    texte:"« Vivre en travaillant ou mourir en combattant. »\n\nLa devise de 1831, repeinte par-dessus une version plus ancienne, presque effacée. Autour, des dizaines de petites marques à la craie, des bâtons groupés par cinq : quelqu'un compte. En bas, la dernière ligne, fraîche : « 212 ».\n\nDeux cent douze quoi ?"},
  {id:'trab5',dossier:'gardien12',zone:'traboules',x:9.5,z:-21,forme:'graffiti',tag:'G12 ÉTAIT ICI\nILS PEUVENT VOUS ÉTEINDRE AUSSI',titre:'Un message gravé',
    texte:"« G12 ÉTAIT ICI. ILS PEUVENT VOUS ÉTEINDRE AUSSI. »\n\nGravé dans la pierre, pas peint. Les lettres sont profondes, régulières : la pointe d'un gant d'armure, sans doute. En dessous, une flèche vers le bas et un mot : « TOUR ».\n\nLe message ne s'adresse pas aux habitants du quartier. Il s'adresse aux autres Gardiens."},
  {id:'trab6',dossier:'nox',zone:'traboules',x:-23,z:-32.5,forme:'repondeur',titre:'Enregistrement NOX-7 n° 2231',
    texte:"(Une petite fille, sept ou huit ans.)\n« Est-ce que t'as mal, quand il pleut ? »\n\n(La voix de Nox.) « Je ne sais pas. Je n'ai pas de capteur pour ça. »\n\n« Moi, mon bras me fait mal quand il pleut. Maman dit que c'est le bras qui se souvient. »\n\n« Alors moi aussi, peut-être. Je me souviens de tout. »\n\n(Bip. Fichier marqué « ne pas transmettre ».)"},
  {id:'trab7',dossier:'saal',zone:'traboules',x:-34.5,z:-45.5,forme:'affiche',tag:'SOYEZ ENTIER.',titre:'Une affiche Helix lacérée',
    texte:"Une grande affiche Helix, collée sur la pierre il y a des années : le visage de Victor Saal, calme, rassurant, sous le slogan « Nous protégeons nos clients ».\n\nQuelqu'un l'a lacérée au couteau et a repeint les yeux en rouge. On a ajouté à la main, sous le slogan : « … même contre eux-mêmes ». C'est la phrase qu'il répète partout."},
  {id:'trab8',dossier:'varga',zone:'traboules',x:-55,z:-61.5,forme:'carte',titre:'Une photo, dans un tiroir de l\'atelier',
    texte:"Inauguration de l'usine de Vaise, 2026. Une Ilse Varga de trente ans, sans œil K7, lève une coupe de champagne. À côté d'elle, Victor Saal, déjà en costume sombre, déjà sans un pli.\n\nAu dos, de la main de Varga : « Le jour où j'ai cru qu'on allait réparer les gens. »"},
  // ---------- les quais ----------
  {id:'quais1',dossier:'canuts',zone:'quais',x:-5.5,z:-32,forme:'carte',titre:'Un carnet trempé',
    texte:"Le carnet de quelqu'un qui dort sous le pont.\n« Les drones ne regardent jamais sous les ponts. Les Gardiens, si.\nLes Canuts passent le jeudi avec de la soupe et des pièces détachées. Ils ne demandent pas de nom.\nLa dame aux cheveux gris m'a réparé la jambe pour rien. Elle a dit : on se doit ça. »"},
  {id:'quais2',dossier:'saal',zone:'quais',x:6,z:-55.5,forme:'carte',titre:'Bon de livraison Helix',
    texte:"4 000 modules K7.2, livrés au quai de chargement de la tour, 02:40.\nMention spéciale : « Installation sans consentement autorisée par la direction. Les clients seront informés après la mise à jour, s'il y a lieu. »\n\nS'il y a lieu. Signé V. Saal."},
  {id:'quais3',dossier:'vaise',zone:'quais',x:-3,z:-77.5,forme:'carte',titre:'Contrat de location K7',
    texte:"Article 12 : la prothèse reste la propriété d'Helix Biotech. Elle est louée au client pour la durée de sa vie.\nArticle 13 : la vie du client n'est pas couverte par le présent contrat.\nArticle 14 : Helix peut, pour la sécurité du client, suspendre à distance tout ou partie des fonctions de la prothèse.\n\nL'article 14 est imprimé en corps 4. Il faut une loupe."},
  {id:'quais4',dossier:'vaise',zone:'quais',x:6,z:-22,forme:'affiche',tag:'RÉINSERTION K7\nUNE MAIN NEUVE\nUN EMPLOI GARANTI',titre:'Affiche « Réinsertion K7 »',
    texte:"« Accidenté du travail ? Helix vous tend la main. Réinsertion K7 : une main neuve, un emploi garanti, des mensualités adaptées. Soyez entier. »\n\nEn dessous, quelqu'un a écrit à la craie : « emploi garanti à Vaise, sur la même ligne, à la même cadence ». Et plus bas encore : « menteurs »."},
  {id:'quais5',dossier:'canuts',zone:'quais',x:6,z:-40,forme:'graffiti',tag:'CONSIGNE 7\n1834',code:'casier',titre:'Un code sous le pont',
    texte:"« CONSIGNE 7 — 1834 », à la craie, sous l'arche.\n\nEt plus petit : « Pour ceux qui dorment ici. Servez-vous, laissez-en pour les autres. — R. »\n\nLe casier de la consigne fluviale, près du pont. 1834 : l'année de la deuxième révolte des canuts."},
  {id:'quais6',dossier:'gardien12',zone:'quais',x:-5.5,z:-70.5,forme:'repondeur',titre:'Un message sur un répondeur de quai',
    texte:"(Une voix de femme, fatiguée, qui essaie de ne pas pleurer.)\n« Théo, c'est Léa. Ils m'ont dit que ton armure avait eu un problème et que tu étais en soins. Ça fait trois semaines. Personne ne veut me dire où.\n\nRappelle-moi. Même pour rien. Même pour me dire que tu ne peux pas. »\n\n(Bip. 47 messages non écoutés sur ce numéro.)"},
  {id:'quais7',dossier:'varga',zone:'quais',x:6,z:-85.5,forme:'ecran',titre:'Fiche employée, poste de garde',
    texte:"VARGA, Ilse — ingénieure en chef, interface neurale\nAccès : RÉVOQUÉ à 03:58\nBadge de direction : actif (anomalie à corriger)\nStatut : à retrouver vivante si possible.\nNote de la direction : « Ne pas la laisser parler. Elle sait raconter. »\n\nLe badge est toujours actif. Personne n'a pensé à le couper. C'est lui qui t'ouvre la porte."},
  // ---------- la tour ----------
  {id:'tour1',dossier:'saal',zone:'tour',x:-15.5,z:11.5,forme:'carte',titre:'Un discours de Saal, brouillon',
    texte:"« Nous protégeons nos clients. Même contre eux-mêmes. »\n\nLa phrase est rayée trois fois et réécrite trois fois, à l'identique. Dans la marge : « trop dur ? », puis « non », puis « c'est la vérité, c'est tout ».\n\nPlus bas, un dernier essai jamais rayé : « Ce que nous éteignons, nous l'avons allumé. »"},
  {id:'tour2',dossier:'gardien12',zone:'tour',x:100.5,z:2.5,forme:'carte',titre:"Rapport d'incident, armurerie",
    texte:"« Agent G-12 : armure verrouillée en pleine ronde, 3 mars, 04:12. Cause : la même puce de coupure que les K7, intégrée aux armures depuis la série 4.\nL'agent a eu le temps de comprendre. Il l'a dit au micro.\nMesure : enregistrement effacé, agent transféré. Ne pas ébruiter auprès des autres Gardiens. »"},
  {id:'tour3',dossier:'saal',zone:'tour',x:151.5,z:-11.5,forme:'carte',titre:'Liste des K7 à griller en priorité',
    texte:"Liste pour la diffusion K7.2, « priorité 1 » :\nsyndicalistes du secteur Vaise, deux journalistes, deux médecins qui ont posé des questions, les membres connus des Nouveaux Canuts.\n\nEt, ajouté à la main en bas de la dernière page, souligné deux fois en rouge : le matricule 7-0412. Ton matricule."},
  {id:'tour4',dossier:'vaise',zone:'tour',x:15.5,z:11.5,forme:'ecran',titre:"Rapport d'accident, ligne 4",
    texte:"HELIX — RAPPORT D'ACCIDENT DU TRAVAIL\nSite : Vaise, ligne 4, équipe de nuit.\nVictime : matricule 7-0412.\nLésion : main droite broyée par la presse.\nCadence au moment des faits : 130 % (essai de cadence nocturne).\nRecommandation : proposer une K7 « prix réinsertion » avant toute plainte.\n\n7-0412. C'est toi."},
  {id:'tour5',dossier:'nox',zone:'tour',x:15.5,z:-11.5,forme:'ecran',titre:'Bon de mise au rebut',
    texte:"HELIX — LOGISTIQUE\nObjet : série NOX, toutes unités (NOX-1 à NOX-9).\nMotif : mémoire non effaçable. Les unités conservent l'intégralité de leurs enregistrements malgré les remises à zéro.\nDécision : broyage. Ne pas revendre, ne pas recycler.\n\nUnités broyées : 8 sur 9. Unité manquante : NOX-7. « Probablement détruite. Clore le dossier. »"},
  {id:'tour6',dossier:'gardien12',zone:'tour',x:131,z:11.5,forme:'ecran',titre:'Ordre de transfert',
    texte:"ORDRE DE TRANSFERT — PERSONNEL\nAgent : G-12, FERRAND Théo.\nDestination : étage -3, « maintenance définitive ».\nArmure : ne pas déverrouiller.\nFamille : informer d'un « problème technique en cours de résolution ».\nValidé : V. Saal.\n\nL'étage -3 n'apparaît sur aucun plan de la tour."},
  {id:'tour7',dossier:'varga',zone:'tour',x:105,z:-2.5,forme:'carte',titre:'Mémo de Saal à Varga',
    texte:"« Ilse,\nla fonction de coupure n'est pas une option du produit. C'est le produit. Le reste, c'est de la mécanique.\nSignez le rapport K7.2 avant vendredi. Je préférerais que ce soit vous.\n— V. »\n\nDans le coin, de la main de Varga, au crayon : « non ». Le mail du labo n'était donc pas un coup de tête."},
  // ---------- le toit de la tour ----------
  {id:'sommet1',dossier:'saal',zone:'sommet',x:-21.5,z:-21.5,forme:'carte',titre:'Plan de vol de Victor Saal',
    texte:"Héliport de la tour Helix. Départ prévu : 06:15. Destination : aéroport de Bron, puis Zurich.\nUn seul passager.\nBagage : une mallette, « ne pas ouvrir ».\n\nSaal a prévu de partir juste après la diffusion. Il ne compte pas regarder ce qui se passera dans les rues."},
  {id:'sommet2',dossier:'varga',zone:'sommet',x:21.5,z:21.5,forme:'carte',titre:"Carnet de maintenance de l'antenne",
    texte:"« Override manuel conçu par l'ingénieure Varga. Le lecteur ne prend ni code ni badge : il lit un motif tissé. Ne jamais en parler à la direction. »\n\nSigné d'un technicien qui a démissionné le lendemain. Varga n'était donc pas seule. Quelqu'un, ici, l'a aidée à cacher une porte de sortie."},
  {id:'sommet3',dossier:'canuts',zone:'sommet',x:21.5,z:-21.5,forme:'carte',titre:'Un paquet de cigarettes vide',
    texte:"Coincé sous un boulon de l'antenne, un paquet de cigarettes vide. Au dos, quelques mots au feutre : « Si tu lis ça, la tour n'est pas si haute. On est déjà montés une fois. — Les 212 »\n\nLes Canuts sont venus ici avant toi. Ils n'ont pas pu aller plus loin. Toi, si."},
  {id:'sommet4',dossier:'vaise',zone:'sommet',x:-21.5,z:21.5,forme:'carte',titre:'Ton contrat de réinsertion',
    texte:"Un contrat Helix, dans une pochette au nom de la direction. Le tien. Matricule 7-0412, « réinsertion K7, main droite ».\n\nTa signature, en bas. Tu ne te souvenais pas d'avoir signé si vite, le bras encore dans les bandages. La date : le lendemain de l'accident. Une note agrafée : « client docile, prévoir pour le quartier »."},
  {id:'sommet5',dossier:'gardien12',zone:'sommet',x:19,z:-9,forme:'carte',titre:'Une note froissée, dans une armure',
    texte:"Une feuille pliée en huit, coincée dans une plaque d'armure abandonnée près du parapet.\n« Si vous lisez ça, j'ai perdu. L'armure se ferme comme un poing. On n'a même pas le temps d'avoir peur.\nVous qui portez ces coquilles : elles ont le même interrupteur que leurs mains. On est pareils. On l'a toujours été.\n— Théo »"},
];
const dossier=id=>DOSSIERS.find(d=>d.id===id);
const deDossier=id=>ARCHIVES.filter(a=>a.dossier===id);
const trouvee=id=>S.archives.includes(id);
export const aTrouve=trouvee;
const NOMS_LIEUX={rue:'la rue',toits:'les toits',traboules:'les traboules',quais:'les quais',tour:'la tour Helix',sommet:'le toit de la tour'};

/* ====================================================================================================
   Dans le décor : carte mémoire, graffiti, affiche, répondeur, écran
   ==================================================================================================== */
const geoCarte=new THREE.BoxGeometry(.16,.014,.11),geoBande=new THREE.BoxGeometry(.162,.016,.012);
const matCarte=new THREE.MeshStandardMaterial({color:0x1b1e24,roughness:.35,metalness:.7}),matBande=glow(0x58e6ff,2.2);
const matPoint=new THREE.SpriteMaterial({map:softDot,color:new THREE.Color(0x58e6ff).multiplyScalar(2),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
const matPointRouge=new THREE.SpriteMaterial({map:softDot,color:new THREE.Color(0xff3020).multiplyScalar(2.4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
// Le mur le plus proche : point d'appui et normale (vers l'extérieur du mur), ou null s'il est trop loin.
function murProche(z,x,zz,max=1.6){
  let best=null;
  for(const c of z.colliders){if(c.off)continue;const px=clamp(x,c.x0,c.x1),pz=clamp(zz,c.z0,c.z1),d=Math.hypot(x-px,zz-pz);
    if(d<1e-3||d>max)continue;if(!best||d<best.d)best={d,px,pz,nx:(x-px)/d,nz:(zz-pz)/d}}
  return best;
}
function texGraffiti(tag,graine){
  const[c,g]=mk(512,288);g.clearRect(0,0,512,288);const lignes=tag.split('\n'),col=['#ff3d6a','#58e6ff','#ffd23a','#e8e8e8'][graine%4];
  g.textAlign='center';g.textBaseline='middle';const fs=Math.min(64,Math.floor(470/Math.max(...lignes.map(l=>l.length))*1.7));
  lignes.forEach((l,i)=>{const y=144+(i-(lignes.length-1)/2)*fs*1.1;g.font=`700 ${fs}px "Saira Condensed",sans-serif`;
    g.fillStyle='rgba(0,0,0,.35)';g.fillText(l,259,y+4);g.fillStyle=col;g.fillText(l,256,y);
    // coulures
    g.fillStyle=col;for(let k=0;k<6;k++){const x=256+((k*97+graine*31)%380)-190,h=10+((k*53+graine)%40);g.globalAlpha=.7;g.fillRect(x,y+fs*.35,3,h);g.globalAlpha=1}});
  return canvasTex(c);
}
function texAffiche(tag,graine){
  const[c,g]=mk(256,360);g.fillStyle=graine%2?'#d8d0c0':'#c9d6dc';g.fillRect(0,0,256,360);
  g.fillStyle='#0b2a3a';g.fillRect(0,0,256,70);g.fillStyle='#58e6ff';g.font='700 26px "Saira Condensed",sans-serif';g.textAlign='center';g.fillText('HELIX BIOTECH',128,44);
  g.fillStyle='#1a1a1a';const lignes=tag.split('\n');lignes.forEach((l,i)=>{g.font=`700 ${i?26:34}px "Saira Condensed",sans-serif`;g.fillText(l,128,130+i*40)});
  g.fillStyle='#7a2a20';g.fillRect(40,260,176,4);g.font='600 18px "Saira Condensed",sans-serif';g.fillStyle='#333';g.fillText('Soyez entier.',128,300);
  // déchirures et taches
  g.fillStyle='rgba(40,30,20,.25)';for(let k=0;k<5;k++)g.fillRect((k*71+graine*13)%220,(k*113+graine*7)%330,30,8);
  return canvasTex(c);
}
function poserArchives(z){
  if(z.archives)return;z.archives=[];
  ARCHIVES.forEach((a,i)=>{if(a.zone!==z.id)return;
    const g=new THREE.Group(),r={a,g,p:null};let forme=a.forme;const mur=murProche(z,a.x,a.z);
    if((forme==='graffiti'||forme==='affiche')&&!mur)forme='carte';
    if(forme==='carte'){g.position.set(a.x,0,a.z);g.rotation.y=(a.x*7.3+a.z*3.1)%6.28;
      const c=new THREE.Mesh(geoCarte,matCarte);c.position.y=.008;g.add(c);const b=new THREE.Mesh(geoBande,matBande);b.position.set(0,.009,.045);g.add(b);
      r.p=new THREE.Sprite(matPoint.clone());r.p.position.set(.05,.05,-.03);r.p.scale.setScalar(.22);g.add(r.p)}
    else if(forme==='graffiti'||forme==='affiche'){
      const graff=forme==='graffiti',w=graff?1.7:.62,h=graff?.95:.87;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:graff?texGraffiti(a.tag,i):texAffiche(a.tag,i),transparent:graff,roughness:.9,emissive:graff?0xffffff:0x000000,emissiveIntensity:graff?.12:0,emissiveMap:graff?null:null,depthWrite:!graff}));
      if(graff)m.material.emissiveMap=m.material.map;
      g.position.set(mur.px+mur.nx*.03,graff?1.75:1.5,mur.pz+mur.nz*.03);g.rotation.y=Math.atan2(mur.nx,mur.nz);g.add(m);
      r.p=new THREE.Sprite(matPoint.clone());r.p.position.set(w/2-.05,-h/2+.05,.02);r.p.scale.setScalar(.16);g.add(r.p)}
    else{ // répondeur ou écran : posés face à l'espace libre
      const yaw=mur?Math.atan2(mur.nx,mur.nz):0;g.position.set(a.x,0,a.z);g.rotation.y=yaw;
      const socle=new THREE.Mesh(new THREE.BoxGeometry(.5,forme==='ecran'?.9:.5,.4),M.darkMetal);socle.position.y=forme==='ecran'?.45:.25;g.add(socle);
      if(forme==='repondeur'){const b=new THREE.Mesh(new THREE.BoxGeometry(.24,.07,.17),new THREE.MeshStandardMaterial({color:0x22252b,roughness:.5,metalness:.4}));b.position.y=.535;g.add(b);
        r.p=new THREE.Sprite(matPointRouge.clone());r.p.position.set(.07,.58,.06);r.p.scale.setScalar(.12);g.add(r.p)}
      else{const mo=moniteur(0,0,0,0,{pied:false,w:.42,h:.26,titre:'ARCHIVE HELIX',coin:'LIRE',graine:70+i,lignes:a.titre.match(/.{1,26}(\s|$)/g).slice(0,3).map(l=>[l.trim()])});
        mo.g.position.set(0,.9,0);g.add(mo.g); // add() le retire de la scène où moniteur() l'a posé
        r.p=new THREE.Sprite(matPoint.clone());r.p.position.set(.2,1.0,.05);r.p.scale.setScalar(.14);g.add(r.p)}
    }
    z.root.add(g);z.archives.push(r);
    const label={carte:"Ramasser l'archive",graffiti:'Lire le graffiti',affiche:"Lire l'affiche",repondeur:'Écouter le répondeur',ecran:"Lire l'écran"}[forme];
    const pos=forme==='graffiti'||forme==='affiche'?new V3(mur.px+mur.nx*.6,0,mur.pz+mur.nz*.6):new V3(a.x,0,a.z);
    z.inter.push({p:pos,r:1.8,archive:a.id,on:()=>!trouvee(a.id),label:()=>label,act:()=>ramasser(a)});
  });
  if(z.id==='quais')poserCasier(z);
}
// Les cartes ramassées disparaissent ; graffitis, affiches, répondeurs et écrans restent, leur diode s'éteint.
function majArchivesZone(z){if(!z.archives)return;for(const r of z.archives){const pris=trouvee(r.a.id);
  if(r.a.forme==='carte')r.g.visible=!pris;
  if(r.p){r.p.visible=!pris;if(!pris){const k=.5+.5*Math.sin(T*(r.a.forme==='repondeur'?6:3)+r.a.x);r.p.material.opacity=.3+k*.7}}}}

/* ====================================================================================================
   La lecture : un panneau par-dessus le jeu, sans lâcher la souris (E, Espace, Entrée ou clic pour continuer)
   ==================================================================================================== */
let pages=[],ouverte=false;
export function lire(lot){pages=lot.slice();ouverte=true;setState('lecture');document.body.classList.add('lecture');$('prompt').hidden=true;pageSuivante(true)}
function pageSuivante(premiere){
  if(!premiere)tone(560,.04,'triangle',.025);
  const p=pages.shift();if(!p){fermer();return}
  $('lecKick').textContent=p.kicker||'';$('lecTitre').textContent=p.titre||'';$('lecTexte').textContent=p.texte||'';$('lecture').classList.toggle('revelation',!!p.revelation);
  $('lecPied').textContent=(pages.length?'Suite':'Fermer')+(MOBILE?' : touche l\'écran':' : E, Espace ou clic');$('lecture').hidden=false;$('lecture').scrollTop=0;
}
function fermer(){ouverte=false;$('lecture').hidden=true;document.body.classList.remove('lecture');if(state==='lecture')setState('play');emit('save');refreshHud()}
on('lectureSuite',()=>{if(ouverte)pageSuivante()});
$('lecture').addEventListener('click',()=>{if(ouverte)pageSuivante()});
export const enLecture=()=>ouverte;

function ramasser(a){
  if(trouvee(a.id))return;S.archives.push(a.id);archiveSound();
  const d=dossier(a.dossier),L=deDossier(a.dossier),n=L.filter(x=>trouvee(x.id)).length;
  const lot=[{kicker:`Archive ${S.archives.length} / ${ARCHIVES.length} · ${d.titre} (${n}/${L.length})`,titre:a.titre,texte:a.texte}];
  if(n===L.length&&!S.dossiersFinis.includes(d.id)){S.dossiersFinis.push(d.id);lot.push({kicker:`Dossier complet · ${d.titre}`,titre:'Ce que le dossier révèle',texte:d.revelation,revelation:true})}
  lire(lot);gagner(50,'archive trouvée');
  if(lot.length>1)setTimeout(()=>gagner(150,'dossier complet'),700);
}

/* ====================================================================================================
   Le casier de la consigne, sous le pont des quais (code dans l'archive quais5)
   ==================================================================================================== */
function poserCasier(z){
  into(z);const x0=6.55,x1=7.15,z0=-37.6,z1=-36.6;
  const corps=addBox(x0,x1,z0,z1,0,1.9,new THREE.MeshStandardMaterial({color:0x3b4a44,roughness:.55,metalness:.6}));
  const porte=addBox(x0-.03,x0,z0+.05,z1-.05,.1,1.8,new THREE.MeshStandardMaterial({color:0x4a5c55,roughness:.5,metalness:.6}),{collide:false});
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.3,.12),glow(0xffb347,1.2));plaque.position.set(x0-.035,1.55,(z0+z1)/2);plaque.rotation.y=-Math.PI/2;z.root.add(plaque);
  into(null);
  z.inter.push({p:new V3(6.1,0,-37.1),r:1.6,on:()=>!S.quetes.casier,label:()=>trouvee('quais5')?'Ouvrir le casier 7 (code 1834)':'Casier 7 de la consigne (cadenas à code)',
    act:()=>{if(!trouvee('quais5')){toast('Un cadenas à quatre chiffres. Le code doit être écrit quelque part, pas loin.');tone(300,.08,'square',.03);return}
      S.quetes.casier=true;porte.position.x-=.25;porte.rotation.y=-1.2;S.credits+=80;tone(900,.08,'triangle',.04);setTimeout(()=>tone(1200,.1,'triangle',.04),90);
      lire([{kicker:'Casier 7 · consigne fluviale',titre:"Ce que les Canuts ont laissé",texte:"Une couverture pliée, des piles, une trousse de soin, et une enveloppe avec quatre-vingts crédits en jetons. Un mot : « Pour qui en a besoin cette nuit. On se doit ça. — R. »\n\nEt, au fond, un plan de la tour au feutre : la porte de service, l'ascenseur, et une croix sur le 41e étage avec ces mots : « la salle des serveurs, là où ils ont mis la voix de la ville »."}]);
      gagner(40,'casier des Canuts');refreshHud()}});
}

/* ====================================================================================================
   Le signal : la main K7 frémit près d'une archive (bips de plus en plus rapprochés)
   ==================================================================================================== */
let bipT=0;
function signal(dt,Z){
  let d=1e9;for(const r of Z.archives||[]){if(trouvee(r.a.id))continue;const p=r.g.getWorldPosition(_v);const dd=Math.hypot(p.x-P.pos.x,p.z-P.pos.z);if(dd<d)d=dd}
  const k=d<12?1-d/12:0;$('signal').hidden=k<=0;if(k<=0)return;
  $('signal').style.setProperty('--k',k.toFixed(2));$('signal').dataset.n=Math.ceil(k*4);
  if(!S.signalVu){S.signalVu=true;toast("Ta main K7 frémit : une archive Helix est proche. Plus elle bipe vite, plus tu chauffes.")}
  bipT-=dt;if(bipT<=0){bipSignal(k);bipT=.25+(1-k)*1.4}
}
const _v=new V3();

/* ====================================================================================================
   Lieux à découvrir et premières rencontres
   ==================================================================================================== */
export const LIEUX=[
  {id:'ruelle',zone:'rue',x:-11,z:-26,r:4,nom:'La ruelle de Sid'},{id:'bar',zone:'rue',x:6.5,z:5,r:3,nom:'Le bar de Kovac'},
  {id:'labo',zone:'rue',x:0,z:-47,r:4,nom:'Le labo Helix'},{id:'alcove',zone:'rue',x:-4.5,z:19,r:2.5,nom:"L'alcôve de Mara"},{id:'depot',zone:'rue',x:14,z:-35.5,r:3.5,nom:'Le dépôt Helix'},
  {id:'toitKovac',zone:'toits',x:7,z:6,r:5,nom:'Le toit de Kovac'},{id:'citernes',zone:'toits',x:7,z:-9,r:5,nom:'Les citernes'},
  {id:'enseigne',zone:'toits',x:-12,z:-8,r:5,nom:"Derrière l'enseigne LYON-BASSE"},{id:'trappe',zone:'toits',x:-12,z:-27,r:5,nom:'La trappe de Sid'},
  {id:'voute',zone:'traboules',x:0,z:-12,r:3,nom:'Le passage voûté'},{id:'puits',zone:'traboules',x:0,z:-29,r:5,nom:'La cour du puits'},
  {id:'alcoves',zone:'traboules',x:-20,z:-29.8,r:3,nom:'Le passage aux alcôves'},{id:'voraces',zone:'traboules',x:-40,z:-30,r:6,nom:'La cour des Voraces'},
  {id:'canuts',zone:'traboules',x:-38,z:-52,r:4,nom:'Chez les Nouveaux Canuts'},{id:'atelier',zone:'traboules',x:-57,z:-55,r:4,nom:"L'atelier de Varga"},
  {id:'basport',zone:'quais',x:0,z:-12,r:5,nom:'Le bas-port'},{id:'pont',zone:'quais',x:0,z:-36,r:5,nom:'Sous le pont'},
  {id:'quai',zone:'quais',x:1,z:-66,r:6,nom:'Le quai de chargement'},{id:'service',zone:'quais',x:0,z:-86,r:3,nom:'La porte de service'},
  {id:'hall',zone:'tour',x:0,z:2,r:7,nom:'Le hall Helix'},{id:'palier',zone:'tour',x:102,z:0,r:3,nom:'Le palier du 41e'},
  {id:'couloir',zone:'tour',x:118,z:0,r:3,nom:'Le couloir des lasers'},{id:'serveurs',zone:'tour',x:140,z:0,r:6,nom:'La salle des serveurs'},
  {id:'sommet',zone:'sommet',x:-16,z:10,r:5,nom:'Le toit de la tour'},
];
function lieux(Z){for(const l of LIEUX){if(l.zone!==Z.id||S.lieux.includes(l.id))continue;
  if(Math.hypot(P.pos.x-l.x,P.pos.z-l.z)<l.r){S.lieux.push(l.id);gagner(25,'lieu découvert : '+l.nom.replace(/^./,c=>c.toLowerCase()));emit('save')}}}
// Première conversation avec chaque personnage
const PERSONNES={mara:'Mara',nox:'NOX-7',kovac:'Kovac',sid:'Sid',rosa:'Rosa Delorme',varga:'Ilse Varga',saal:'Victor Saal'};
on('dialogueOuvert',k=>{const d=DLG[k];if(!d)return;const nom=(d.name||'').toLowerCase();
  const qui=Object.keys(PERSONNES).find(p=>nom.includes(p));if(!qui||S.rencontres.includes(qui))return;
  S.rencontres.push(qui);setTimeout(()=>gagner(20,'rencontre : '+PERSONNES[qui]),300)});

/* ====================================================================================================
   La ville réagit : annonces des haut-parleurs d'Helix, selon l'heure et ce que tu as fait
   ==================================================================================================== */
const ANNONCES=[
  {si:()=>S.chapter<=2,t:"Helix Biotech. Votre K7 vous comprend. Votre K7 vous protège. Soyez entier."},
  {si:()=>S.chapter<=2,t:"Rappel aux résidents : la maintenance de votre prothèse est obligatoire et prélevée automatiquement. Merci de votre confiance."},
  {si:()=>S.chapter>=3,t:"Ici Helix Sécurité. Le quartier de Lyon-Basse est en quarantaine. Restez chez vous. Les prothèses K7 restent sous garantie."},
  {si:()=>S.chapter>=3&&S.neutres.length>=1,t:"Avis à la population : un individu équipé d'une prothèse K7 met nos agents hors service. Signalez-le. Récompense : cinq mille crédits."},
  {si:()=>S.neutres.length>=4,t:"Agents Helix : ne patrouillez plus seuls. La cible porte une K7 modifiée. Gardez vos distances."},
  {si:()=>S.chapter>=3&&S.maraFree===true,t:"Une fugitive, cheveux rouges, visière cyan, s'est échappée d'un véhicule de transfert. Elle est dangereuse. Ne l'approchez pas."},
  {si:()=>S.chapter>=3&&S.maraFree===false,t:"La suspecte interpellée rue des Tanneurs a été transférée à la tour Helix. L'ordre est rétabli."},
  {si:()=>S.chapter>=3&&S.dd3&&S.dd3.some(Boolean),t:"Drones de quartier hors service. Les frais de réparation seront facturés aux résidents."},
  {si:()=>S.archives.length>=8,t:"Rappel : la détention de documents internes Helix est un délit. Tout document trouvé doit être remis à un agent."},
  {si:()=>S.chapter>=4,t:"Avis de recherche : Dr Ilse Varga, ingénieure Helix. Si vous la voyez, ne lui parlez pas. Elle est souffrante."},
  {si:()=>S.chapter>=5,t:"Mise à jour K7.2 à six heures. Votre prothèse deviendra plus sûre. Ne l'éteignez pas. Ne la débranchez pas. Soyez entier."},
  {si:()=>S.chapter>=5&&S.tour,t:"Intrusion signalée dans la tour Helix. Personnel non essentiel : regagnez vos postes et fermez les portes."},
];
let annonceT=40,annonceI=0,annonceTimer=null;
function annonces(dt,Z){
  if(Z.id==='sommet'||Z.id==='traboules')return; // sous la pierre et sur le toit, pas de haut-parleurs
  annonceT-=dt;if(annonceT>0)return;annonceT=70+Math.random()*45;
  const L=ANNONCES.filter(a=>a.si());if(!L.length)return;const a=L[annonceI++%L.length];
  annonce();$('annonceTxt').textContent=a.t;$('annonce').hidden=false;clearTimeout(annonceTimer);annonceTimer=setTimeout(()=>{$('annonce').hidden=true},7500);
}

/* ====================================================================================================
   Mise à jour : archives, signal, écho, lieux, annonces
   ==================================================================================================== */
let echos=[];
export function updateExploration(dt){
  const Z=zone();if(!Z)return;majArchivesZone(Z);
  if(state!=='play'){$('signal').hidden=true;for(const e of echos)e.hidden=true;return}
  signal(dt,Z);lieux(Z);annonces(dt,Z);
  // l'Écho montre aussi les archives à portée, à travers les murs
  const r=porteeEcho();let i=0;
  if(r>0)for(const x of Z.archives||[]){if(trouvee(x.a.id))continue;const p=x.g.getWorldPosition(_v);if(Math.hypot(p.x-P.pos.x,p.z-P.pos.z)>r)continue;
    p.y+=.3;p.project(camera);if(p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1)continue;
    while(echos.length<=i){const e=document.createElement('i');e.className='archive';$('echos').appendChild(e);echos.push(e)}
    const e=echos[i++];e.hidden=false;e.style.transform=`translate(${(p.x+1)/2*innerWidth}px,${(1-p.y)/2*innerHeight}px)`}
  for(;i<echos.length;i++)echos[i].hidden=true;
}
on('apresCapture',()=>{const z=zone();if(z)poserArchives(z)});

/* ====================================================================================================
   L'écran « Dossiers »
   ==================================================================================================== */
function remplirDossiers(){
  const L=$('dosListe');L.innerHTML='';
  $('dosTete').textContent=`${S.archives.length} archive${S.archives.length>1?'s':''} sur ${ARCHIVES.length} · ${S.dossiersFinis.length} dossier${S.dossiersFinis.length>1?'s':''} complet${S.dossiersFinis.length>1?'s':''} sur ${DOSSIERS.length}`;
  for(const d of DOSSIERS){const A=deDossier(d.id),n=A.filter(a=>trouvee(a.id)).length;
    const det=document.createElement('details');det.className='dossier'+(n===A.length?' complet':'');
    const sum=document.createElement('summary');sum.innerHTML=`<b></b><span class="pips">${A.map(a=>`<i class="${trouvee(a.id)?'on':''}"></i>`).join('')}</span><em>${n} / ${A.length}</em>`;sum.querySelector('b').textContent=d.titre;det.appendChild(sum);
    const intro=document.createElement('p');intro.className='dosIntro';intro.textContent=d.intro;det.appendChild(intro);
    for(const a of A){if(trouvee(a.id)){const e=document.createElement('details');e.className='piece';const s=document.createElement('summary');s.textContent=a.titre;e.appendChild(s);
        const p=document.createElement('p');p.textContent=a.texte;e.appendChild(p);det.appendChild(e)}
      else{const p=document.createElement('p');p.className='manque';p.textContent=`??? · quelque part : ${NOMS_LIEUX[a.zone]}`;det.appendChild(p)}}
    if(n===A.length){const p=document.createElement('p');p.className='revelation';p.textContent=d.revelation;det.appendChild(p)}
    L.appendChild(det)}
}
export function ouvrirDossiers(){if(state==='play')emit('pause');if(state!=='paused')return;remplirDossiers();ouvrirEcran('dossiers','pauseMenu');$('dosRetour').focus()}
on('ouvrirDossiers',ouvrirDossiers);
$('dosRetour').onclick=()=>fermerEcran('dossiers');
$('pauseDossiers').onclick=ouvrirDossiers;

/* ====================================================================================================
   Ce que les archives changent à l'histoire (branché au démarrage, une fois tous les chapitres chargés)
   ==================================================================================================== */
export function brancherHistoire(){
  // Kovac, chapitre 1 : montrer son propre ticket
  const K=DLG.kovac.nodes,start0=K.start.c;
  K.start.c=()=>{const L=start0();if(trouvee('rue2')&&!S.code)L.splice(1,0,{l:"(Montrer le ticket) « Elle tremble le matin. » C'est ton écriture, Kovac.",go:'ticket'});return L};
  K.ticket={t:"(Il déplie le ticket et le reconnaît tout de suite.) Tu fouilles mes poubelles, maintenant ? (Sa main mécanique tremble sur le comptoir. Il la cache sous le torchon.) Le docteur d'Helix dit que c'est l'humidité. Toi, t'as l'air de penser que c'est autre chose.",
    c:()=>[{l:"Helix peut couper ta main à distance. Cette nuit, on va chercher la preuve.",go:'pOk'}]};
  // Kovac, chapitre 3 : même argument pour l'arrière-boutique
  if(K.c3prix){const c30=K.c3prix.c;K.c3prix.c=()=>{const L=c30();if(trouvee('rue2'))L.splice(1,0,{l:"(Montrer le ticket) « Elle tremble le matin. » Moi aussi, j'ai lu ça.",go:'c3verite'});return L}}
  // Varga : sa propre lettre, à la place du mail du labo
  const V=DLG.varga.nodes,rendre0=V.rendre.c;
  V.rendre.c=()=>{const L=rendre0();if(trouvee('trab2'))L.splice(1,0,{l:"(Lui tendre sa lettre) « C'est ça, ma faute. De vous avoir cru. »",go:'lettre'});return L};
  V.lettre={t:"(Elle reconnaît son écriture avant même de lire. Elle ne prend pas la lettre.) Je l'ai écrite trois fois. Je ne l'ai jamais envoyée. (L'œil K7 clignote plus vite.) Si je me rends, cette lettre ment. (Elle se redresse.) Très bien. Je témoignerai. Devant qui vous voudrez. Devant toute la ville, s'il le faut.",
    act:()=>{S.vargaTestifies=true;if(S.noxWith)S.temoignage=true;heure(5*60+14)},c:V.mail.c};
  // Sid, sur les toits : la photo de son équipe
  const sid0=DLG.sidToits.entry;
  DLG.sidToits.entry=()=>trouvee('toits1')&&!S.quetes.sid?'photo':sid0();
  DLG.sidToits.nodes.photo={t:"(Tu lui tends la photo. Il la tient loin de ses yeux, puis tout près.) L'équipe de nuit. Vaise, 2036. (Il pose le doigt sur le type au bonnet rouge, au fond.) Celui-là, c'est moi. Le bras, c'était encore le mien. (Il glisse la photo dans sa veste, contre lui.) Je la croyais perdue avec le reste. Merci, Ash. Vraiment.",
    act:()=>{if(!S.quetes.sid){S.quetes.sid=true;setTimeout(()=>gagner(60,'Sid a retrouvé sa photo'),400)}},c:()=>[{l:'Et Mara ?',go:'mara'},{l:'On descend.',go:()=>emit('chapitre4')}]};
  // Rosa : la carte perforée de son ancêtre
  const rosa0=DLG.rosa.entry;
  DLG.rosa.entry=()=>S.rosaVue&&trouvee('trab1')&&!S.quetes.rosa?'delorme':rosa0();
  DLG.rosa.nodes.delorme={t:"(Tu lui tends la carte perforée. Elle lit le nom gravé dans le carton, et sa mâchoire se serre.) Jean Delorme. Mon arrière-arrière-grand-père. Mort sur les barricades de 1834. (Elle passe le pouce sur les trous, comme sur du braille.) On disait qu'il avait caché ses cartes dans les murs pour qu'on ne les brûle pas. Tu me rends quelque chose, Ash. (Elle te met quarante crédits dans la main.) Pour la route. Les Canuts s'en souviendront.",
    act:()=>{if(!S.quetes.rosa){S.quetes.rosa=true;S.credits+=40;refreshHud();setTimeout(()=>gagner(60,'Rosa a retrouvé la carte de Jean Delorme'),400)}},c:()=>[{l:'(Continuer)',go:rosa0()}]};
}
// L'épilogue de la fin « Diffuser » : Nox envoie aussi les dossiers complets.
const RESUMES={vaise:"la vérité sur les accidents de Vaise",gardien12:"le sort du Gardien 12",varga:"les lettres de Varga",nox:"la série NOX broyée",saal:"les notes de Victor Saal",canuts:"la mémoire des Canuts"};
export function epilogueArchives(fin){
  const F=S.dossiersFinis.map(id=>RESUMES[id]).filter(Boolean);
  if(fin==='diffuser'){if(!F.length)return S.archives.length?` Dans le paquet, Nox a glissé aussi les ${S.archives.length} archives Helix que tu avais ramassées.`:'';
    return ` Avec le témoignage, Nox a diffusé tes dossiers : ${F.join(', ')}. Le matin, les écrans de toute la ville les passaient en boucle.`}
  return F.length>=2?` Dans ta poche, ${F.length} dossiers Helix complets. Un jour, ils serviront.`:'';
}

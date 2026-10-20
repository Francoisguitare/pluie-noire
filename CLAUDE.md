# Pluie Noire — mémoire du projet

Jeu d'infiltration à la première personne, cyberpunk, dans le navigateur (ordinateur et téléphone en paysage). Projet de François. Tout le jeu est en français.

- L'histoire, les personnages, les chapitres et les choix sont dans **`docs/histoire.md`**. La lire avant d'écrire la moindre réplique.
- Le site est publié par **GitHub Pages** depuis la branche `main`, sans étape de compilation : ce qui est dans le dépôt est ce qui est servi.

## Règles d'écriture (textes du jeu)

- Français naturel, tutoiement, phrases courtes, ton polar. Gestes entre parenthèses dans les répliques.
- **Ash n'a pas de genre** : jamais d'accord au féminin ou au masculin qui se rapporte à Ash. Reformuler.
- Pas de majuscules à chaque mot dans les titres. Apostrophe typographique ’ ou droite ', mais cohérente dans un même texte (le code actuel utilise la droite).
- Les textes visibles par le joueur restent dans le code (dialogues, objectifs, toasts) ; garder les identifiants et commentaires du code en français, comme le reste.

## Architecture

Modules ES sans compilation. `index.html` contient le HTML et le CSS (HUD, dialogues, écrans) et charge `src/main.js`. Three.js r128 et ses modules complémentaires sont hébergés dans `lib/three/` (imports réécrits en chemins relatifs, pas d'import map : ça marche aussi sur les vieux iPhone). Rien n'est chargé depuis l'extérieur.

- `src/core.js` — utilitaires, bus d'événements (`on`/`emit`), état courant (`state` + `setState`, temps `T`, `G`, joueur `P`), moteur de rendu, scène, caméra, qualité.
- `src/textures.js` — textures dessinées au canvas. `src/construire.js` — briques du décor (`addBox`, `building`, `neon`, `plight`, `shaft`, `Particles`, `steam`, `cable`…). Ce qui est construit entre `into(zone)` et `into(null)` appartient à la zone.
- `src/zones.js` — les lieux : une zone = groupe 3D + collisions + interactions + personnages + drones + effets. Une seule affichée à la fois (`enterZone`).
- `src/lieux/` — les lieux, chacun avec son `Z` (zone) et son `H` (objets que l'histoire modifie) : `rue.js` (chapitres 1 à 3), `toits.js` (chapitre 3), `traboules.js` (chapitre 4), `quais.js`, `tour.js` et `sommet.js` (chapitre 5).
- `src/ciel.js`, `src/pluie.js` — ciel, silhouette de la ville, orage, pluie : communs aux zones extérieures.
- `src/personnages.js` — chargement glTF (`assets/models/*.glb`, compressés meshopt + WebP), retargeting, implants, pose de Sid, silhouettes de secours.
- `src/pouvoirs.js` — la Coupure (main K7 : neutralise Gardiens, drones, caméras ; visée, arc électrique, recharge), XP et niveaux, améliorations (écran « Pouvoirs »).
- `src/exploration.js` — 41 archives en six dossiers (`DOSSIERS`, `ARCHIVES` : texte, forme, quête), lecture, écran « Dossiers », signal de la main, lieux à découvrir (`LIEUX`), premières rencontres, annonces d'Helix (`ANNONCES`), casier des quais, et les effets des archives sur l'histoire (`brancherHistoire`, `epilogueArchives`).
- `src/compilation.js` — rendu sans gel : lumières rattachées à la racine du lieu (`stabiliserLumieres`, intensité 0 quand leur objet est caché), préparation complète d'un lieu (`compilerZone`).
- `src/musique.js` — fonds sonores par lieu, sirènes, gouttes, corne, sons d'interface, monde étouffé en pause et en lecture, musique générative discrète (sections et silences, pulsation en alerte), réglage « Musique » (pause, `localStorage` `pn-musique`).
- `src/ordinateurs.js` — moniteurs, claviers, écrans d'interface (`texEcran`), baies de serveurs (`rangeeBaies`, `facadeBaies`, diodes qui clignotent), chemins de câbles, dalles perforées.
- `src/drones.js`, `src/gardiens.js`, `src/faucheuse.js`, `src/cameras.js` (les ennemis), `src/joueur.js` (déplacement, pas, arme, main K7), `src/controles.js` (clavier, souris, tactile), `src/son.js`, `src/ambiance.js` (sons placés), `src/interface.js`, `src/rendu.js` (post-traitement, reflets), `src/physique.js` (collisions 2D sur XZ), `src/sauvegarde.js`, `src/cinema.js` (cinématiques), `src/metier.js` (énigme du métier Jacquard).
- `src/histoire/partie.js` — état de l'histoire `S` (tous les drapeaux dans `S0`), chapitres (`defineChapter`), objectifs, captures, fins, nouvelle partie, reprise, `allerZone`. `src/histoire/dialogue.js` — moteur de dialogue. `chapitre1.js` (chapitres 1 et 2), `chapitre3.js` (Black-out), `chapitre4.js` (Traboules), `chapitre5.js` (Confluence, fins, aube, fin de saison).
- `src/main.js` — construit le monde **dans l'ordre** (ciel, rue, pluie, voitures : la suite aléatoire `rnd` en dépend, ne pas réordonner), branche les écrans et fait tourner la boucle. Avec `?debug` dans l'adresse, `window.__pn` expose l'état et `step(n, dt)` pour les tests.

Repères :
- Les modèles regardent vers +Z, sauf `soldier` (Kovac) qui regarde vers −Z, d'où `flip:true` pour lui seul.
- Personnages des zones construites à la demande : `habiller(n, look)` avec `LOOKS` (`personnages.js`) clone un modèle de `MODELES` (préparé au chargement de la rue). Le modèle michelle sert à plusieurs femmes : `teinte({cheveux, pantalon, haut, rouge})` recolore dans le shader (avec `customProgramCacheKey`, sinon Three.js réutilise le premier shader pour tous), `coiffer(n, {chignon, foulard})` rabat les chignons contre le crâne, `vetir(n, {col, long, sauf})` accroche veste ou blouse au squelette. Saal est le modèle de Sid avec son costume et son chapeau d'origine.
- Figurants animés : `zone.figurants` (mixers mis à jour par `main.js`) ; `gardienImmobile` pour les Gardiens des scènes.
- PNJ qui se tournent vers Ash : `pivoter(n, cible, vitesse, dt)` (`personnages.js`) mélange la marche sur place (`clips.marche`, action `n.pas`) à l'attente (`n.idle`) selon la vitesse de rotation (`n.pasW`) ; Sid et Saal, posés à la main, plient les jambes dans `poseSid`.
- Dialogues : nœuds `t` (texte), `c` (choix), `act` (action) ; `SHAKE` liste les nœuds où le personnage secoue la tête.
- Sauvegarde (`src/sauvegarde.js`) : `localStorage`, clé `pluie-noire-v2` = `{v:2, partie, saisons}` ; l'ancien format v1 est converti. Écrite toutes les 4 s et à chaque étape (`emit('save')`) ; `emit('saveNow')` force l'envoi en ligne. `finSaison(n, rec)` garde la fin de saison pour la suivante.
- Transfert sans compte (`src/transfert.js`) : code `PN2z-…` (JSON compressé + somme de contrôle) et QR code vers `…#import=<code>`.
- Comptes (`src/compte.js`) : Firebase, inactif tant que `src/config.js` contient `FIREBASE=null`. Mise en route : `docs/comptes-firebase.md`, règles `firestore.rules`, page `confidentialite.html`.
- Son : tout est synthétisé (Web Audio). Les pas sont calés au niveau du fond de pluie (mesuré hors ligne) ; accroupi, aucun pas.
- Sur ordinateur, Échap ou P ouvre la pause.
- Téléphone : commandes tactiles en arc autour d'« Agir » dans le coin bas droit (Tirer, Couper, Accroupi, Courir tous les 30°, plus serré sous 370 px de haut) ; le reste de la moitié droite sert à regarder. HUD plus compact (`body.touch`). Le test `mobile.mjs` vérifie qu'aucun bouton ne chevauche un autre ni le HUD.
- Plein écran (`pleinEcran` dans `controles.js`) : demandé dès le toucher de « Jouer », « Continuer » ou « Reprendre » (le navigateur refuse si trop de temps passe après le geste, d'où l'appel avant tout chargement), bouton « Plein écran » sur l'écran titre et en pause, bouton en haut au centre en jeu sur téléphone. Sur iPhone, impossible dans Safari : `manifest.webmanifest` (`display: fullscreen`, paysage) et les balises Apple permettent d'installer le jeu sur l'écran d'accueil (icônes dans `assets/icones/`).
- Coupure et pistolet : le pistolet plonge hors de l'écran (`gunBas`, `joueur.js`) avant que la main K7 se lève, et revient une fois la main redescendue.
- Écran de chargement (`#chargement` dans `index.html`) : `etape(texte, fraction)` dans `main.js` (ville, téléchargement des modèles via `loadRueCharacters(prog)`, compilation des shaders) ; la boucle de rendu ne démarre qu'après. Une erreur au démarrage s'y affiche (`pnEchec`).
- Cinématiques (`src/cinema.js`) : `cine([{t,cam:{p,l,p2,l2,dur,fov,suivre}},{t,fn},{t,sub:{qui,texte,dur}}])`. Passer exécute tous les `fn` restants : chaque `fn` doit laisser le monde dans un état cohérent.
- Pouvoirs (`pouvoirs.js`) : Coupure sur R, clic droit ou bouton « Couper », disponible dès le black-out du chapitre 3 (`coupureDispo`). Un Gardien neutralisé (`neutraliser`/`relever` dans `gardiens.js`) tombe raide et reste à terre : `S.neutres` garde `{k:'zone:num', x, z, yaw, sens}` (`num` = rang dans `zone.tousGardiens`, stable quand l'histoire ajoute ou retire des Gardiens), réappliqué à chaque `apresCapture`. XP : `gagner(n, raison)` ; `S.xpChap` paie 100 XP par étape franchie (les anciennes sauvegardes les touchent à la reprise). Améliorations dans `AMELIS` (`S.ameli`), un point par niveau ; niveaux de plus en plus chers (`seuilNiveau`, `niveauDe` dans `partie.js` : 100, 250, 450, 700…).
- Archives (`exploration.js`) : six dossiers (Vaise, Gardien 12, Varga, Nox, Saal, Canuts), chacun avec une révélation quand il est complet (+150 XP). Formes : `carte` (au sol), `graffiti` et `affiche` (posées sur le mur le plus proche, trouvé dans les collisions ; sinon carte), `repondeur`, `ecran`. Posées au premier `apresCapture` de leur zone. Lecture dans l'état `lecture` (monde figé, souris gardée ; E, Espace, Entrée ou clic : `lectureSuite`). Écran « Dossiers » (touche J, menu pause) avec les « ??? » et leur lieu. Signal : la main bipe à moins de 12 m d'une archive ; l'Écho les montre à travers les murs. XP : archive 50, lieu découvert 25 (`LIEUX`, `S.lieux`), première rencontre 20 (`S.rencontres`). Effets : ticket de Kovac (code, arrière-boutique), lettre de Varga (témoignage, comme le mail), photo pour Sid et carte de Jean Delorme pour Rosa (`S.quetes`), code du casier des quais (80 crédits), épilogue des fins (`epilogueArchives`). Annonces d'Helix (`ANNONCES`) toutes les 70 à 115 s hors traboules et toit, selon les choix.
- Visée : la souris reste verrouillée pendant les dialogues et l'énigme ; un curseur dessiné (`#curseur`, `controles.js`) suit ses mouvements et clique sur les réponses. Si le verrou est perdu (Échap), `reprendreVisee()` le reprend au choix suivant. Les cinématiques et la lecture gardent la souris.
- **Gels** : Three.js recompile tous les shaders d'un lieu quand le nombre de lumières visibles change ou qu'un matériau s'affiche pour la première fois (très lent sous Windows/Direct3D). Règles : ne jamais faire apparaître une lumière en cours de partie (les lumières portées sont rattachées par `stabiliserLumieres`, appelé à chaque entrée de lieu ; un objet caché éteint sa lumière) ; créer à l'avance ce qui arrive plus tard (`prechargerRue3`, Gardiens et Faucheuse du black-out créés au chargement) ; chaque lieu est préparé en entier à sa première visite (`compilerZone`, objets cachés compris) derrière l'écran de chargement (`chargement()` / `finChargement()` dans `interface.js`). Le test `rendu.mjs` le vérifie (nombre de programmes et de lumières constant).
- Archives posées sur le sol réel (`solSous`, rayon lancé à 60 cm : trottoirs, marches).
- Ennemis : drones (`drones.js`), Gardiens (`gardiens.js` : vue, ouïe via `P.noise`, lampe-torche, blindage contre le P-9, neutralisés par la Coupure), Faucheuse (`faucheuse.js` : projecteur, `zone.couverts` = abris vus d'en haut), caméras (`cameras.js` : balayage, vue sans ouïe, abattues au P-9, gardées dans `S.cams`), grilles laser de la tour (`majLasers` dans `lieux/tour.js`, cycles, boîtier à abattre). Lampes à abattre : `lampeCassable` (inscrites dans `zone.lumieres` ; dans le noir, les Gardiens et les caméras voient moins loin ; `cassable:false` pour un éclairage qui compte sans pouvoir être abattu). Événement `apresCapture` pour remettre les ennemis en place.
- Zones construites à la demande : `constructeurs[id]=fn` puis `allerZone(id,[x,z,yaw])` (fondu, ambiance, reflets, sauvegarde). Chaque zone a son propre `mulberry32(seed)`. Réglages de zone : `fog`, `fogD`, `hemi`, `ciel`, `cielY` (la ville au loin abaissée, au sommet de la tour), `pluie`, `indoor(p)`, `surfaceAt(p)`, `envPos` et `cacherEnv` (objets trop lumineux exclus de la capture des reflets, sinon ils éclairent tout).
- Décor : `fusion(maillages, matériau)` regroupe des pièces en un seul appel de dessin (métiers à tisser, pylône) ; `holoMat(canvas, couleur)` pour les hologrammes ; textures `texPierre`/`texPaves` dans `textures.js`.
- Fin de saison : `setAube(k)` (ciel, orage), `setPluie(k)` (son de la pluie), `zone.pluie=false`, puis `finSaison('1', …)` et `finish(fin, {kicker, saison})`. L'écran titre affiche la fin gardée.
- Horloge du HUD : `S.heure` en minutes (192 = 03:12), `heure(min)` aux moments clés, plafonnée à 05:58 avant la fin.
- Réalisme : ombres dynamiques en qualité ultra seulement (`spot`, `shadowPoint`, `ombre` dans `construire.js` ; carte d'ombre mise à jour une fois par image). Flammes : `flamme(x,y,z,w,h)`. Corniches automatiques sur les immeubles (`building` + `flushLedges` en fin de zone). Pas de tirage `rnd` dans le nouveau décor de la rue (sinon la ville change d'aspect).
- Sons placés (`src/ambiance.js`) : la zone déclare `Z.sons=[{type:'feu'|'vapeur'|'neon',pos,vol}]` ; chaque drone a son moteur. Niveaux mesurés hors ligne par rapport au fond de pluie.

## Tester

```
NODE_PATH=$(npm root -g) node tools/test/parcours.mjs /chemin/captures   # chapitres 1-2, deux branches, captures
NODE_PATH=$(npm root -g) node tools/test/mobile.mjs /chemin/captures     # démarrage en mode téléphone
NODE_PATH=$(npm root -g) node tools/test/pivot.mjs /chemin/captures      # écran de chargement, PNJ qui pivotent en faisant des pas
NODE_PATH=$(npm root -g) node tools/test/pouvoirs.mjs /chemin/captures   # Coupure, XP, améliorations
NODE_PATH=$(npm root -g) node tools/test/exploration.mjs /chemin/captures # 41 archives (une capture chacune), dossiers, quêtes, casier, lieux
NODE_PATH=$(npm root -g) node tools/test/rendu.mjs                       # aucun shader compilé en pleine partie (pistolet, black-out, lieux)
NODE_PATH=$(npm root -g) node tools/test/sauvegardes.mjs /chemin/captures # conversion v1, code de transfert, QR code, import
NODE_PATH=$(npm root -g) node tools/test/chapitre3.mjs /chemin/captures  # black-out, Kovac, toits, Mara
NODE_PATH=$(npm root -g) node tools/test/chapitre4.mjs /chemin/captures  # traboules, énigme, choix de Varga
NODE_PATH=$(npm root -g) node tools/test/chapitre5.mjs /chemin/captures  # quais, tour, toit, deux fins, fin de saison (environ 25 min)
```

L'environnement cloud n'a pas de GPU : Chromium rend en logiciel (SwiftShader), environ une image toutes les 3 s en 1280×720. Donc :
- avancer la simulation sans rendre (`avancer(n)` dans `tools/test/outils.mjs`, qui appelle `__pn.step`), puis faire une seule capture ;
- capturer en 960×540 ou moins ;
- le verrouillage du pointeur est désactivé dans les tests (sinon Chromium sans écran fait tourner la caméra) ;
- les CDN (cdnjs, jsdelivr) sont bloqués par le proxy de l'environnement ; le registre npm et GitHub (git) sont accessibles.

## Décisions prises

- **Three.js r128 conservé** : il fait déjà tout ce qui est prévu (ombres, occlusion, post-traitement, shaders sur mesure). La montée de version obligerait à réaccorder tout l'éclairage (unités physiques) sans gain visible pour le joueur. À reconsidérer seulement si un besoin précis l'exige.
- **Comptes et sauvegardes en ligne : Firebase** (Google), gratuit à notre échelle, connexion Google ou e-mail. Tant que la configuration n'est pas fournie, le jeu fonctionne sans compte (sauvegarde locale + code de transfert).
- Les Gardiens ne se combattent pas au P-9 (blindage). Depuis octobre 2026, à la demande de François, la Coupure les neutralise d'un coup (sans les tuer : l'armure se verrouille) : le jeu reste un jeu d'infiltration, mais avec un vrai outil et une progression (XP, améliorations, archives).

## Feuille de route

1. ~~Corrections rapides : Sid, pas, refus de la puce~~ (fait)
2. ~~Mémoire du projet et bible de l'histoire~~ (fait)
3. ~~Réorganiser le code en modules ES, dépendances hébergées dans le dépôt, modèles en `.glb`, harnais de test~~ (fait)
4. ~~Sauvegardes v2 : code de transfert, QR code, comptes Firebase (en attente du projet Firebase de François), page de confidentialité~~ (fait)
5. ~~Réalisme : ombres, flammes, façades, pluie, sons spatialisés, labo, look de Sid~~ (fait ; pistes suivantes : fenêtres avec intérieurs, passants, gouttes sur l'écran)
6. ~~Chapitres 3 à 5 (voir `docs/histoire.md`), fin de saison et sauvegarde pour la saison 2~~ (fait : environ 1 h 30 de jeu, quatre fins)
7. Pistes : faire jouer la saison par de vrais joueurs (équilibrage de la discrétion, durée réelle), animations de marche pour Mara et Varga, vraies voix ou sons de voix, saison 2 (lire `saisons['1']`).

## Git

- Travail sur une branche, publication par fusion dans `main` (pull request).
- Messages de commit en français.

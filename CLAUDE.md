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
- `src/lieux/rue.js` — la rue des chapitres 1 et 2 ; `H` regroupe les objets que l'histoire modifie.
- `src/ciel.js`, `src/pluie.js` — ciel, silhouette de la ville, orage, pluie : communs aux zones extérieures.
- `src/personnages.js` — chargement glTF (`assets/models/*.glb`, compressés meshopt + WebP), retargeting, implants, pose de Sid, silhouettes de secours.
- `src/drones.js`, `src/joueur.js` (déplacement, pas, arme, main K7), `src/controles.js` (clavier, souris, tactile), `src/son.js`, `src/interface.js`, `src/rendu.js` (post-traitement, reflets), `src/physique.js` (collisions 2D sur XZ), `src/sauvegarde.js`.
- `src/histoire/partie.js` — état de l'histoire `S`, chapitres (`defineChapter`), objectifs, captures, fins, nouvelle partie, reprise. `src/histoire/dialogue.js` — moteur de dialogue. `src/histoire/chapitre1.js` — chapitres 1 et 2 (dialogues, actions, interactions).
- `src/main.js` — construit le monde **dans l'ordre** (ciel, rue, pluie, voitures : la suite aléatoire `rnd` en dépend, ne pas réordonner), branche les écrans et fait tourner la boucle. Avec `?debug` dans l'adresse, `window.__pn` expose l'état et `step(n, dt)` pour les tests.

Repères :
- Les modèles regardent vers +Z, sauf `soldier` (Kovac) qui regarde vers −Z, d'où `flip:true` pour lui seul.
- Dialogues : nœuds `t` (texte), `c` (choix), `act` (action) ; `SHAKE` liste les nœuds où le personnage secoue la tête.
- Sauvegarde (`src/sauvegarde.js`) : `localStorage`, clé `pluie-noire-v2` = `{v:2, partie, saisons}` ; l'ancien format v1 est converti. Écrite toutes les 4 s et à chaque étape (`emit('save')`) ; `emit('saveNow')` force l'envoi en ligne. `finSaison(n, rec)` garde la fin de saison pour la suivante.
- Transfert sans compte (`src/transfert.js`) : code `PN2z-…` (JSON compressé + somme de contrôle) et QR code vers `…#import=<code>`.
- Comptes (`src/compte.js`) : Firebase, inactif tant que `src/config.js` contient `FIREBASE=null`. Mise en route : `docs/comptes-firebase.md`, règles `firestore.rules`, page `confidentialite.html`.
- Son : tout est synthétisé (Web Audio). Les pas sont calés au niveau du fond de pluie (mesuré hors ligne) ; accroupi, aucun pas.
- Sur ordinateur, Échap ou P ouvre la pause.
- Cinématiques (`src/cinema.js`) : `cine([{t,cam:{p,l,p2,l2,dur,fov,suivre}},{t,fn},{t,sub:{qui,texte,dur}}])`. Passer exécute tous les `fn` restants : chaque `fn` doit laisser le monde dans un état cohérent.
- Ennemis : drones (`drones.js`), Gardiens (`gardiens.js` : vue, ouïe via `P.noise`, lampe-torche, blindage), Faucheuse (`faucheuse.js` : projecteur, `zone.couverts` = abris vus d'en haut). Lampes à abattre : `lampeCassable` (inscrites dans `zone.lumieres` ; dans le noir, les Gardiens voient moins loin). Événement `apresCapture` pour remettre les ennemis en place.
- Zones construites à la demande : `constructeurs[id]=fn` puis `allerZone(id,[x,z,yaw])` (fondu, ambiance, reflets, sauvegarde). Chaque zone a son propre `mulberry32(seed)`.
- Horloge du HUD : `S.heure` en minutes (192 = 03:12), `heure(min)` aux moments clés, plafonnée à 05:58 avant la fin.
- Réalisme : ombres dynamiques en qualité ultra seulement (`spot`, `shadowPoint`, `ombre` dans `construire.js` ; carte d'ombre mise à jour une fois par image). Flammes : `flamme(x,y,z,w,h)`. Corniches automatiques sur les immeubles (`building` + `flushLedges` en fin de zone). Pas de tirage `rnd` dans le nouveau décor de la rue (sinon la ville change d'aspect).
- Sons placés (`src/ambiance.js`) : la zone déclare `Z.sons=[{type:'feu'|'vapeur'|'neon',pos,vol}]` ; chaque drone a son moteur. Niveaux mesurés hors ligne par rapport au fond de pluie.

## Tester

```
NODE_PATH=$(npm root -g) node tools/test/parcours.mjs /chemin/captures   # chapitres 1-2, deux branches, captures
NODE_PATH=$(npm root -g) node tools/test/mobile.mjs /chemin/captures     # démarrage en mode téléphone
NODE_PATH=$(npm root -g) node tools/test/sauvegardes.mjs /chemin/captures # conversion v1, code de transfert, QR code, import
```

L'environnement cloud n'a pas de GPU : Chromium rend en logiciel (SwiftShader), environ une image toutes les 3 s en 1280×720. Donc :
- avancer la simulation sans rendre (`avancer(n)` dans `tools/test/outils.mjs`, qui appelle `__pn.step`), puis faire une seule capture ;
- capturer en 960×540 ou moins ;
- le verrouillage du pointeur est désactivé dans les tests (sinon Chromium sans écran fait tourner la caméra) ;
- les CDN (cdnjs, jsdelivr) sont bloqués par le proxy de l'environnement ; le registre npm et GitHub (git) sont accessibles.

## Décisions prises

- **Three.js r128 conservé** : il fait déjà tout ce qui est prévu (ombres, occlusion, post-traitement, shaders sur mesure). La montée de version obligerait à réaccorder tout l'éclairage (unités physiques) sans gain visible pour le joueur. À reconsidérer seulement si un besoin précis l'exige.
- **Comptes et sauvegardes en ligne : Firebase** (Google), gratuit à notre échelle, connexion Google ou e-mail. Tant que la configuration n'est pas fournie, le jeu fonctionne sans compte (sauvegarde locale + code de transfert).
- Les Gardiens ne se combattent pas (blindage) : le jeu reste un jeu d'infiltration.

## Feuille de route

1. ~~Corrections rapides : Sid, pas, refus de la puce~~ (fait)
2. ~~Mémoire du projet et bible de l'histoire~~ (fait)
3. ~~Réorganiser le code en modules ES, dépendances hébergées dans le dépôt, modèles en `.glb`, harnais de test~~ (fait)
4. ~~Sauvegardes v2 : code de transfert, QR code, comptes Firebase (en attente du projet Firebase de François), page de confidentialité~~ (fait)
5. ~~Réalisme : ombres, flammes, façades, pluie, sons spatialisés, labo, look de Sid~~ (fait ; pistes suivantes : fenêtres avec intérieurs, passants, gouttes sur l'écran)
6. Chapitres 3 à 5 (voir `docs/histoire.md`), fin de saison et sauvegarde pour la saison 2 — chapitre 3 fait (`histoire/chapitre3.js`, `lieux/toits.js`, test `tools/test/chapitre3.mjs`)

## Git

- Travail sur une branche, publication par fusion dans `main` (pull request).
- Messages de commit en français.

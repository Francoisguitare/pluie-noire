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

État au moment de l'écriture : tout le jeu tient dans `index.html` (HTML, CSS et un script), avec Three.js r128 chargé depuis des CDN et les personnages glTF encodés en base64 dans `models/*.js`. Une réorganisation en modules ES est en cours (voir la feuille de route) ; cette section sera réécrite quand elle sera faite.

Repères dans le code actuel :
- Monde : textures dessinées au canvas (`facade`, `asphaltCanvas`, `puddleCanvas`), boîtes à collisions (`addBox`, `building`), néons (`neon`), lumières (`plight`), faisceaux (`shaft`), particules (`Particles`, `steam`).
- Collisions en 2D sur le plan XZ (rectangles `colliders`, `collide`, `los`).
- Personnages : `loadCharacters` (retargeting des animations de Xbot), `poseSid` (pose procédurale de Sid). Les modèles regardent vers +Z, sauf `soldier` (Kovac) qui regarde vers −Z, d'où `flip:true` pour lui seul.
- Histoire : état `S` (drapeaux), dialogues `DLG` (nœuds `t` texte, `c` choix, `act` action), objectifs dans `updHud`, fins dans `ENDS`.
- Sauvegarde : `localStorage` clé `pluie-noire-save-v1`, toutes les 4 s et à la fermeture.
- Son : tout est synthétisé en Web Audio (`tone`, `nz`, `click`, `footstep`…). Les pas sont calés pour sonner à peu près au niveau du fond de pluie (mesuré hors ligne) ; accroupi, aucun pas.

## Tester

L'environnement cloud n'a pas de GPU : Chromium rend en logiciel (SwiftShader), environ une image toutes les 3 s en 1280×720. Donc :
- avancer la simulation sans rendre (fonction `step(n, dt)` exposée en mode debug), puis faire une seule capture ;
- capturer en 960×540 ou moins ;
- les CDN (cdnjs, jsdelivr) sont bloqués par le proxy de l'environnement ; le registre npm est accessible (`npm pack three@0.128.0`).

Playwright est installé globalement (`NODE_PATH=/opt/node22/lib/node_modules`).

## Décisions prises

- **Three.js r128 conservé** : il fait déjà tout ce qui est prévu (ombres, occlusion, post-traitement, shaders sur mesure). La montée de version obligerait à réaccorder tout l'éclairage (unités physiques) sans gain visible pour le joueur. À reconsidérer seulement si un besoin précis l'exige.
- **Comptes et sauvegardes en ligne : Firebase** (Google), gratuit à notre échelle, connexion Google ou e-mail. Tant que la configuration n'est pas fournie, le jeu fonctionne sans compte (sauvegarde locale + code de transfert).
- Les Gardiens ne se combattent pas (blindage) : le jeu reste un jeu d'infiltration.

## Feuille de route

1. ~~Corrections rapides : Sid, pas, refus de la puce~~ (fait)
2. ~~Mémoire du projet et bible de l'histoire~~ (fait)
3. Réorganiser le code en modules ES, dépendances hébergées dans le dépôt, modèles en `.glb`, harnais de test
4. Sauvegardes v2 : chapitres et points de reprise, code de transfert, comptes Firebase, page de confidentialité
5. Réalisme : ombres, flammes, façades, pluie, sons spatialisés
6. Chapitres 3 à 5 (voir `docs/histoire.md`), fin de saison et sauvegarde pour la saison 2

## Git

- Travail sur une branche, publication par fusion dans `main` (pull request).
- Messages de commit en français.

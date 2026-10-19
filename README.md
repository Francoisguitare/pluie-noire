# Pluie Noire

Jeu d'infiltration cyberpunk à la première personne, jouable dans le navigateur, sur ordinateur (clavier + souris) ou sur téléphone (en mode paysage).

Lyon-Basse, 2041, de 3 h 12 à l'aube. Vole une puce dans le labo Helix, survis au black-out, traverse les toits puis les traboules de la Croix-Rousse, et monte jusqu'au sommet de la tour Helix avant que la mise à jour K7.2 ne grille toutes les prothèses de la ville. Cinq chapitres, environ une heure et demie, des choix qui comptent et quatre fins (saison 1 : « Avant l'aube »). Ta main K7 apprend à couper les armures d'Helix : chaque Gardien neutralisé, chaque archive cachée rapporte de l'expérience pour améliorer ce pouvoir.

## Jouer

Ouvre la page GitHub Pages du dépôt. La partie est sauvegardée automatiquement dans le navigateur ; « Transférer ma partie » donne un code ou un QR code pour la reprendre sur un autre appareil. La fin choisie est gardée pour la saison 2.

## Technique

- JavaScript en modules ES, sans étape de compilation : le dépôt est servi tel quel
- [Three.js r128](https://threejs.org) (WebGL) et shaders GLSL, hébergé dans `lib/`
- Sons générés en direct avec Web Audio
- Tests automatiques avec Playwright (`tools/test/`)

## Crédits

- Personnages : modèles des exemples de Three.js (`Xbot`, `Michelle`, `Soldier` issus de Mixamo ; avatar Ready Player Me), optimisés dans `assets/models/`
- Polices : Saira Condensed et IBM Plex Mono, sous licence SIL Open Font License (`assets/fonts/`)
- Three.js : licence MIT (`lib/three/LICENSE`)

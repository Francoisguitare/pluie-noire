# Pluie Noire

Mini FPS d'infiltration cyberpunk jouable dans le navigateur, sur ordinateur (clavier + souris) ou sur téléphone (en mode paysage).

Lyon-Basse, 2041. Vole une puce dans le labo Helix, parle aux bonnes personnes, évite ou abats les drones, et alimente le décodeur de Mara.

## Jouer

Ouvre la page GitHub Pages du dépôt. La partie est sauvegardée automatiquement dans le navigateur.

## Technique

- JavaScript en modules ES, sans étape de compilation : le dépôt est servi tel quel
- [Three.js r128](https://threejs.org) (WebGL) et shaders GLSL, hébergé dans `lib/`
- Sons générés en direct avec Web Audio
- Tests automatiques avec Playwright (`tools/test/`)

## Crédits

- Personnages : modèles des exemples de Three.js (`Xbot`, `Michelle`, `Soldier` issus de Mixamo ; avatar Ready Player Me), optimisés dans `assets/models/`
- Polices : Saira Condensed et IBM Plex Mono, sous licence SIL Open Font License (`assets/fonts/`)
- Three.js : licence MIT (`lib/three/LICENSE`)

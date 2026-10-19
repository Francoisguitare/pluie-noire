// Comptes et sauvegardes en ligne (Firebase).
// Laisser FIREBASE à null tant que le projet Firebase n'existe pas : le jeu fonctionne alors sans compte
// (sauvegarde dans le navigateur + code de transfert). Pour activer les comptes, suivre docs/comptes-firebase.md
// et coller ici l'objet « firebaseConfig » donné par la console Firebase (ces valeurs sont publiques par nature).
export const FIREBASE=null;
// Version du SDK Firebase chargée depuis le CDN officiel (gstatic), seulement quand on ouvre l'écran du compte.
export const FIREBASE_VERSION='12.19.0';

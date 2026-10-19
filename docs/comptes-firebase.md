# Activer les comptes (sauvegarde en ligne)

Le code des comptes est déjà dans le jeu (`src/compte.js`). Il reste inactif tant que `src/config.js` contient `FIREBASE=null`. Pour l'activer, il faut un projet Firebase, gratuit, créé avec ton compte Google. Compte une quinzaine de minutes.

## 1. Créer le projet

1. Va sur <https://console.firebase.google.com> avec ton compte Google.
2. **Créer un projet** → nom : `pluie-noire` → désactive Google Analytics (inutile ici) → **Créer**.

## 2. Déclarer le site

1. Sur la page d'accueil du projet, clique sur l'icône **Web** (`</>`).
2. Nom de l'application : `Pluie Noire`. Ne coche pas « Firebase Hosting ».
3. Firebase affiche un bloc `const firebaseConfig = { … }`. **Copie-le** : c'est ce qu'il faut coller dans `src/config.js` (ou me l'envoyer). Ces valeurs ne sont pas secrètes, elles sont faites pour être dans la page.

## 3. Choisir les façons de se connecter

1. Menu **Authentication** → **Commencer**.
2. Onglet **Méthode de connexion** :
   - **Google** → Activer → choisis ton adresse comme e-mail d'assistance → Enregistrer.
   - **Adresse e-mail/Mot de passe** → Activer (la première option seulement) → Enregistrer.
3. Onglet **Paramètres** → **Domaines autorisés** → **Ajouter un domaine** → `francoisguitare.github.io`.
4. Onglet **Modèles** (facultatif) : passe la langue des e-mails en français.

## 4. Créer la base des sauvegardes

1. Menu **Firestore Database** → **Créer une base de données**.
2. Emplacement : `europe-west9 (Paris)` (ou `eur3`). Ce choix est définitif.
3. Mode **production**.
4. Onglet **Règles** → remplace tout par le contenu du fichier `firestore.rules` du dépôt → **Publier**.

## 5. Brancher le jeu

Dans `src/config.js`, remplace `null` par l'objet copié à l'étape 2 :

```js
export const FIREBASE={
  apiKey:"…",
  authDomain:"pluie-noire-xxxx.firebaseapp.com",
  projectId:"pluie-noire-xxxx",
  storageBucket:"…",
  messagingSenderId:"…",
  appId:"…"
};
```

Ajoute aussi une adresse de contact dans `confidentialite.html` (commentaire « Contact »).

Le bouton « Mon compte » apparaît alors sur l'écran titre et dans la pause.

## Ce que ça coûte

Rien à cette échelle : le forfait gratuit (Spark) de Firebase couvre la connexion et des dizaines de milliers de lectures et d'écritures par jour. Le jeu n'envoie la sauvegarde en ligne qu'au plus une fois par minute pendant le jeu, et à chaque pause ou retour à l'écran titre.

## Comment ça marche

- Une fiche par joueur dans Firestore : `saves/{identifiant}`, avec la sauvegarde complète (le même contenu que le code de transfert).
- À la connexion, le jeu compare la partie de l'appareil et celle en ligne : la plus récente gagne, et il demande avant d'écraser une partie locale.
- Les saisons terminées (pour la saison 2) sont fusionnées : rien ne se perd.
- Sans compte, tout continue de marcher : sauvegarde dans le navigateur et code de transfert / QR code.

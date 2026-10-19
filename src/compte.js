// Comptes et sauvegarde en ligne (Firebase : connexion Google ou e-mail, une fiche Firestore par joueur).
// Tout est inactif tant que src/config.js ne contient pas la configuration du projet Firebase.
// Le SDK n'est chargé que si l'on ouvre l'écran du compte, ou au démarrage si une session existait déjà.
import {FIREBASE,FIREBASE_VERSION} from './config.js';
import {$,on,emit} from './core.js';
import {lire,remplacer,decrire,showSaveInfo} from './sauvegarde.js';
import {ask,toast,ouvrirEcran,fermerEcran} from './interface.js';

export const comptesActifs=!!FIREBASE;
const FLAG='pluie-noire-compte';
let fb=null,user=null,lastPush=0,enCours=null;
const ref=()=>fb.F.doc(fb.db,'saves',user.uid);
const message=t=>{$('cMsg').textContent=t||''};
const ERR={'auth/invalid-email':"Cette adresse e-mail n'est pas valide.",'auth/missing-email':'Indique ton adresse e-mail.','auth/missing-password':'Indique ton mot de passe.',
  'auth/email-already-in-use':'Un compte existe déjà avec cette adresse : connecte-toi.','auth/weak-password':'Mot de passe trop court (6 caractères minimum).',
  'auth/invalid-credential':'Adresse ou mot de passe incorrect.','auth/wrong-password':'Adresse ou mot de passe incorrect.','auth/user-not-found':'Aucun compte avec cette adresse.',
  'auth/popup-closed-by-user':'Connexion annulée.','auth/cancelled-popup-request':'Connexion annulée.','auth/popup-blocked':'Le navigateur a bloqué la fenêtre de connexion. Autorise-la et recommence.',
  'auth/network-request-failed':'Pas de connexion internet.','auth/too-many-requests':"Trop d'essais. Réessaie dans quelques minutes.",
  'auth/requires-recent-login':'Par sécurité, déconnecte-toi, reconnecte-toi, puis recommence.','auth/unauthorized-domain':"Ce site n'est pas encore autorisé dans Firebase (voir docs/comptes-firebase.md).",
  'permission-denied':'Accès refusé par le serveur (règles Firestore à vérifier).','unavailable':'Service momentanément indisponible. Réessaie plus tard.'};
const erreur=e=>ERR[e&&e.code]||(e&&e.message==='sdk'?'Impossible de joindre le service des comptes.':'Quelque chose a coincé. Réessaie.');

async function charger(){
  if(fb)return fb;
  if(enCours)return enCours;
  enCours=(async()=>{
    const U=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
    let app,A,F;
    try{[app,A,F]=await Promise.all([import(U+'firebase-app.js'),import(U+'firebase-auth.js'),import(U+'firebase-firestore.js')])}catch(e){throw new Error('sdk')}
    const a=app.initializeApp(FIREBASE);
    fb={A,F,auth:A.getAuth(a),db:F.getFirestore(a)};fb.auth.languageCode='fr';
    A.onAuthStateChanged(fb.auth,u=>{user=u;afficher();if(u){try{localStorage.setItem(FLAG,'1')}catch(e){}synchroniser()}});
    return fb;
  })();
  try{return await enCours}finally{enCours=null}
}
function afficher(){$('cOut').hidden=!!user;$('cIn').hidden=!user;if(user)$('cWho').textContent=user.email||user.displayName||'ton compte'}

// À la connexion : on compare avec la fiche en ligne. La plus récente gagne (on demande avant d'écraser une partie locale).
async function synchroniser(){
  try{
    const snap=await fb.F.getDoc(ref()),local=lire();
    if(snap.exists()){
      const distant=JSON.parse(snap.data().data||'{}'),saisons=Object.assign({},distant.saisons||{});
      for(const k in local.saisons)if(!saisons[k]||local.saisons[k].at>saisons[k].at)saisons[k]=local.saisons[k];
      const dp=distant.partie,lp=local.partie;
      if(dp&&(!lp||dp.at>lp.at+5000)){
        const ok=!lp||await ask('Partie en ligne plus récente',decrire(distant)+'. La charger sur cet appareil ?','Charger','Garder celle-ci');
        if(ok){remplacer({v:2,partie:dp,saisons});lastPush=Date.now();toast('Partie en ligne chargée');emit('partieImportee');showSaveInfo();return}
      }
      remplacer(Object.assign(local,{saisons}));
    }
    await pousser(true);
  }catch(e){message(erreur(e))}
}
async function pousser(force){
  if(!user||!fb)return;const now=Date.now();if(!force&&now-lastPush<60000)return;
  lastPush=now;const d=lire();
  try{await fb.F.setDoc(ref(),{data:JSON.stringify({v:2,partie:d.partie,saisons:d.saisons}),at:now,maj:fb.F.serverTimestamp()});
    $('cSync').textContent='Sauvegarde en ligne à jour ('+new Date(now).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+').'}
  catch(e){message(erreur(e))}
}
on('saved',()=>pousser(false));
on('saveNow',()=>pousser(true));

const action=fn=>async()=>{message('');try{await fn()}catch(e){message(erreur(e))}};
const champs=()=>[$('cMail').value.trim(),$('cPass').value];
$('cGoogle').onclick=action(async()=>{await charger();await fb.A.signInWithPopup(fb.auth,new fb.A.GoogleAuthProvider())});
$('cLogin').onclick=action(async()=>{await charger();const[m,p]=champs();await fb.A.signInWithEmailAndPassword(fb.auth,m,p)});
$('cSignup').onclick=action(async()=>{await charger();const[m,p]=champs();await fb.A.createUserWithEmailAndPassword(fb.auth,m,p)});
$('cReset').onclick=action(async()=>{await charger();await fb.A.sendPasswordResetEmail(fb.auth,champs()[0]);message('Un e-mail pour changer de mot de passe vient de partir.')});
$('cLogout').onclick=action(async()=>{await pousser(true);await fb.A.signOut(fb.auth);try{localStorage.removeItem(FLAG)}catch(e){}message('Session fermée. Ta partie reste sur cet appareil.')});
$('cDelete').onclick=action(async()=>{
  if(!await ask('Supprimer ton compte ?','Ta sauvegarde en ligne sera effacée. Celle de cet appareil reste.','Supprimer','Annuler'))return;
  await fb.F.deleteDoc(ref());await fb.A.deleteUser(user);try{localStorage.removeItem(FLAG)}catch(e){}message('Compte supprimé.')});
$('cClose').onclick=()=>fermerEcran('compte');

export function ouvrirCompte(depuis){ouvrirEcran('compte',depuis);message('');afficher();charger().catch(e=>message(erreur(e)))}
// Au démarrage : on ne charge le SDK que si une session a déjà été ouverte sur cet appareil.
export function initComptes(){
  for(const id of['compteBtn','pauseCompte'])$(id).hidden=!comptesActifs;
  let deja=false;try{deja=localStorage.getItem(FLAG)==='1'}catch(e){}
  if(comptesActifs&&deja)charger().catch(()=>{});
}

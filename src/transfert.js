// Transférer sa partie d'un appareil à l'autre, sans compte : QR code à scanner ou code à copier-coller.
// Le QR code ouvre le jeu avec « #import=<code> » : la partie est proposée à l'import dès le chargement.
import qrcode from '../lib/qrcode/qrcode.mjs';
import {$,state,emit} from './core.js';
import {lire,exportCode,importCode,remplacer,decrire,showSaveInfo,saveGame} from './sauvegarde.js';
import {ask,toast,ouvrirEcran,fermerEcran} from './interface.js';

let qrCases=0; // côté du QR code en cases, marges comprises
export async function ouvrirTransfert(depuis){
  if(state==='paused')saveGame();
  ouvrirEcran('transfer',depuis);$('transferMsg').textContent='';$('codeIn').value='';petitQR();
  const d=lire(),rien=!d.partie&&!Object.keys(d.saisons).length;
  $('transferOut').hidden=rien;$('transferNone').hidden=!rien;if(rien)return;
  const code=await exportCode();$('codeOut').value=code;
  try{const q=qrcode(0,'L');q.addData(location.origin+location.pathname+'#import='+code,'Byte');q.make();qrCases=q.getModuleCount()+6;$('qrImg').src=q.createDataURL(4,3);$('qrImg').hidden=false}
  catch(e){$('qrImg').hidden=true}
}
$('copyCode').onclick=async()=>{const t=$('codeOut');
  try{await navigator.clipboard.writeText(t.value);$('transferMsg').textContent='Code copié.'}
  catch(e){t.focus();t.select();$('transferMsg').textContent='Code sélectionné : copie-le avec Ctrl+C (ou un appui long).'}};
function petitQR(){$('qrImg').parentElement.classList.remove('grand');$('qrImg').style.width=''}
$('closeTransfer').onclick=()=>{petitQR();fermerEcran('transfer')};
// Touché, le QR code prend tout l'écran, avec un nombre entier de pixels par case : net, plus facile à scanner quand
// une partie avancée le rend très fin. Touché encore, il revient.
$('qrImg').parentElement.onclick=e=>{const grand=e.currentTarget.classList.toggle('grand'),k=devicePixelRatio||1;
  $('qrImg').style.width=grand&&qrCases?Math.max(1,Math.floor(Math.min(innerWidth,innerHeight)*.94*k/qrCases))*qrCases/k+'px':''};
$('importCode').onclick=async()=>{
  try{await proposerImport(await importCode($('codeIn').value))}
  catch(e){$('transferMsg').textContent=e.message}
};
// Demande confirmation puis remplace la sauvegarde de cet appareil.
export async function proposerImport(d){
  const ok=await ask('Importer cette partie ?',decrire(d)+(lire().partie?'. La partie enregistrée sur cet appareil sera remplacée.':'.'),'Importer','Annuler');
  if(!ok)return false;
  remplacer(d);toast('Partie importée');
  if(!$('transfer').hidden)fermerEcran('transfer');
  emit('partieImportee');showSaveInfo();return true;
}
// Au chargement : code passé dans l'adresse par le QR code.
export async function importDepuisAdresse(){
  const m=location.hash.match(/^#import=(.+)$/);if(!m)return;
  history.replaceState(null,'',location.pathname+location.search);
  try{await proposerImport(await importCode(decodeURIComponent(m[1])))}
  catch(e){await ask('Import impossible',e.message,'OK','')}
}

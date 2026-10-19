// Sauvegardes v2 : conversion de l'ancien format, code de transfert aller-retour, QR code, import par l'adresse.
import {ouvrir,verifier} from './outils.mjs';
const sortie=process.argv[2];
// 1. Ancien format converti
let g=await ouvrir({largeur:960,hauteur:540});
await g.pn(()=>{localStorage.clear();localStorage.setItem('pluie-noire-save-v1',JSON.stringify({S:{quest:true,code:true,credits:20,chip:true,door:true,spotted:1,dd:[false,false,false],elapsed:120000},p:[0,-45,3.1],at:Date.now()-3600e3}))});
await g.p.reload();await g.p.waitForSelector('#play:not([disabled])',{timeout:180000});
const conv=await g.pn(()=>({v2:!!localStorage.getItem('pluie-noire-v2'),v1:!!localStorage.getItem('pluie-noire-save-v1'),cont:!document.getElementById('cont').hidden,info:document.getElementById('saveInfo').textContent}));
verifier(conv.v2&&!conv.v1,'ancienne sauvegarde convertie au format 2');
verifier(conv.cont&&/puce récupérée/.test(conv.info)&&/il y a 1 h/.test(conv.info),'écran titre : « '+conv.info+' »');
verifier(await g.pn(()=>document.getElementById('compteBtn').hidden),'bouton « Mon compte » caché tant que Firebase n\'est pas configuré');
// 2. Reprise de la partie convertie
await g.p.click('#cont');await g.avancer(5);
const s=await g.pn(()=>({chip:window.__pn.S.chip,z:window.__pn.P.pos.z,zone:window.__pn.zone().id}));
verifier(s.chip&&Math.abs(s.z+45)<.5&&s.zone==='rue','la partie reprend au bon endroit');
await g.pn(()=>window.__pn.saveGame());
// 3. Code de transfert aller-retour
const code=await g.pn(()=>window.__pn.exportCode());
verifier(/^PN2z?-[A-Za-z0-9_-]+\.[0-9a-z]{4}$/.test(code),`code de transfert produit (${code.length} caractères)`);
const rt=await g.pn(async c=>{const d=await window.__pn.importCode(c),l=window.__pn.lire();return JSON.stringify(d.partie)===JSON.stringify(l.partie)},code);
verifier(rt,'le code redonne exactement la même partie');
const faute=await g.pn(async c=>{try{await window.__pn.importCode(c.slice(0,-6)+'x'+c.slice(-5));return 'accepté'}catch(e){return e.message}},code);
verifier(/faute de frappe|incomplet/.test(faute),'une faute de frappe est détectée : « '+faute+' »');
// 4. Écran de transfert (depuis la pause)
await g.pn(()=>window.__pn.G);await g.p.keyboard.press('KeyP');await g.avancer(2);
await g.p.click('#pauseTransfer');await g.p.waitForFunction(()=>document.getElementById('codeOut').value.length>20);
verifier(await g.pn(()=>!document.getElementById('qrImg').hidden&&document.getElementById('qrImg').naturalWidth>100),'QR code affiché');
if(sortie)await g.capture(sortie+'/transfert.png');
await g.p.click('#closeTransfer');
verifier(await g.pn(()=>!document.getElementById('pauseMenu').hidden),'retour au menu pause');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();
// 5. Import par l'adresse (QR code scanné sur un autre appareil)
g=await ouvrir({largeur:844,hauteur:390,mobile:true,hash:'#import='+code});
await g.p.waitForFunction(()=>!document.getElementById('ask').hidden,null,{timeout:30000});
const q=await g.pn(()=>document.getElementById('askText').textContent);
verifier(/puce récupérée/.test(q),'import proposé : « '+q+' »');
await g.p.tap('#askYes');await g.avancer(2);
const imp=await g.pn(()=>({chip:window.__pn.lire().partie.S.chip,cont:!document.getElementById('cont').hidden,hash:location.hash}));
verifier(imp.chip&&imp.cont&&!imp.hash,'partie importée, « Continuer » disponible, adresse nettoyée');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();
console.log('Sauvegardes : terminé.');

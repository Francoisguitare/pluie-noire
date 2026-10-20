// Écran de chargement, plein écran, puis PNJ qui pivotent vers Ash en faisant des pas (Mara, Nox, Kovac, Sid).
// Usage : NODE_PATH=$(npm root -g) node tools/test/pivot.mjs [dossier-captures]
import {ouvrir,verifier,viser} from './outils.mjs';
import {createRequire} from 'module';
const sortie=process.argv[2];
// 1. L'écran de chargement, visible tant que les modèles arrivent (on retarde leur envoi)
{const {chromium}=createRequire(import.meta.url)('playwright');const {servir}=await import('./outils.mjs');
  const srv=await servir(),b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:960,height:540}});
  await p.route(/\.glb$/,async r=>{await new Promise(z=>setTimeout(z,8000));r.continue()});
  await p.goto(`http://127.0.0.1:${srv.address().port}/index.html?debug`);
  await p.waitForFunction(()=>/personnages/.test(document.getElementById('lstep').textContent),null,{timeout:120000});
  verifier(await p.isVisible('#chargement'),'écran de chargement affiché pendant le téléchargement');
  if(sortie)await p.screenshot({path:sortie+'/chargement.png',timeout:180000});
  await p.waitForSelector('#chargement',{state:'hidden',timeout:180000});
  verifier(!(await p.isDisabled('#play')),'écran de chargement retiré, bouton Jouer actif');
  await b.close();srv.close()}
// 2. Le plein écran depuis l'écran titre (ordinateur)
const g=await ouvrir();
verifier(await g.pn(()=>!document.getElementById('titrePlein').hidden&&getComputedStyle(document.getElementById('titrePlein')).display!=='none'),'écran titre : bouton « Plein écran »');
await g.p.click('#titrePlein');await g.p.waitForFunction(()=>!!document.fullscreenElement,null,{timeout:10000}).catch(()=>{});
verifier(await g.pn(()=>!!document.fullscreenElement&&document.getElementById('titrePlein').textContent==='Quitter le plein écran'),'plein écran activé, le bouton propose d\'en sortir');
await g.p.click('#titrePlein');await g.p.waitForFunction(()=>!document.fullscreenElement,null,{timeout:10000}).catch(()=>{});
verifier(await g.pn(()=>!document.fullscreenElement),'sortie du plein écran');
// 3. Les PNJ pivotent en faisant des pas
await g.jouer();await g.avancer(5);
for(const k of['mara','nox','kovac','sid']){
  const n=await g.pn(k=>{const n=window.__pn.zone().npcs.find(n=>n.key===k);return{x:n.x,z:n.z,yaw:n.yaw}},k);
  // Ash arrive dans son dos (ou sur le côté si un mur l'en empêche) : le PNJ doit se retourner
  for(const a of[Math.PI,1.6,-1.6,1.1,-1.1]){const x=n.x+Math.sin(n.yaw+a)*2.6,z=n.z+Math.cos(n.yaw+a)*2.6;
    await g.placer(x,z,viser(x,z,n.x,n.z),-.12);await g.avancer(1);
    if(await g.pn(([x,z])=>Math.hypot(window.__pn.P.pos.x-x,window.__pn.P.pos.z-z)<.05,[x,z]))break}
  await g.avancer(8);
  const r=await g.pn(k=>{const n=window.__pn.zone().npcs.find(n=>n.key===k);return{w:n.pasW,p:n.pas?n.pas.getEffectiveWeight():null}},k);
  verifier(r.w>.3,`${k} pivote en faisant des pas (poids ${r.w.toFixed(2)}${r.p!==null?', marche '+r.p.toFixed(2):''})`);
  if(sortie)await g.capture(`${sortie}/pivot-${k}.png`);
  await g.avancer(90);
  const f=await g.pn(k=>{const n=window.__pn.zone().npcs.find(n=>n.key===k);return n.pasW},k);
  verifier(f<.1,`${k} s'arrête face à Ash (${f.toFixed(2)})`);
}
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Pivots : terminé.');

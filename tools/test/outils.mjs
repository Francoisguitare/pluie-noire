// Outils de test : petit serveur statique du dépôt + Chromium piloté par Playwright, sur la page en mode ?debug.
// Sans GPU, le rendu est logiciel (lent) : on avance la simulation avec avancer() et on ne capture qu'au besoin.
import http from 'http';import fs from 'fs';import path from 'path';import {createRequire} from 'module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright'); // installé globalement : lancer avec NODE_PATH=$(npm root -g)
export const RACINE=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.woff2':'font/woff2','.json':'application/json','.png':'image/png','.css':'text/css','.txt':'text/plain','.md':'text/plain','.webmanifest':'application/manifest+json'};
export function servir(port=0){return new Promise(res=>{
  const srv=http.createServer((req,rep)=>{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';
    const f=path.join(RACINE,p);if(!f.startsWith(RACINE)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rep.writeHead(404);rep.end();return}
    rep.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(rep)});
  srv.listen(port,'127.0.0.1',()=>res(srv))})}
export async function ouvrir({largeur=960,hauteur=540,page='index.html',mobile=false,hash=''}={}){
  const srv=await servir();const url=`http://127.0.0.1:${srv.address().port}/${page}?debug${hash}`;
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage(mobile?{viewport:{width:largeur,height:hauteur},hasTouch:true,isMobile:true,deviceScaleFactor:2}:{viewport:{width:largeur,height:hauteur}});
  const erreurs=[],externes=[];
  p.on('console',m=>{if(m.type()==='error')erreurs.push(m.text())});p.on('pageerror',e=>erreurs.push(e.message));
  // Pas de verrouillage du pointeur : sinon Chromium sans écran envoie des petits mouvements qui tournent la caméra.
  await p.addInitScript(()=>{Element.prototype.requestPointerLock=function(){return Promise.resolve()}});
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>{externes.push(r.request().url());r.abort()}); // le jeu ne doit rien charger d'extérieur
  await p.goto(url);await p.waitForSelector('#play:not([disabled])',{timeout:180000});await p.waitForSelector('#chargement',{state:'hidden',timeout:30000});
  return{b,p,srv,erreurs,externes,
    jouer:()=>mobile?p.tap('#play'):p.click('#play'),
    pn:(fn,arg)=>p.evaluate(fn,arg),
    placer:(x,z,yaw,pitch=0)=>p.evaluate(([x,z,yaw,pitch])=>{const P=window.__pn.P;P.pos.set(x,0,z);P.yaw=yaw;P.pitch=pitch;P.vx=P.vz=0},[x,z,yaw,pitch]),
    avancer:(n,dt=1/30)=>p.evaluate(([n,dt])=>window.__pn.step(n,dt),[n,dt]),
    choisir:async(...cs)=>{for(const c of cs){await p.evaluate(c=>window.__pn.pickChoice(c),c);await p.evaluate(()=>window.__pn.step(2))}},
    capture:async nom=>{await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.screenshot({path:nom,timeout:180000})},
    fermer:async()=>{await b.close();srv.close()}};
}
// Angle de visée (yaw) pour regarder de (x,z) vers (tx,tz).
export const viser=(x,z,tx,tz)=>Math.atan2(-(tx-x),-(tz-z));
export function verifier(cond,msg){if(!cond)throw new Error('ÉCHEC : '+msg);console.log('  ok ·',msg)}

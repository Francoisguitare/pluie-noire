// La Faucheuse destructible : une vraie balle de P-9 dans un réacteur, la riposte, la fumée, la chute en vrille, l'épave
// en flammes, l'XP et le pourcentage, la reprise d'une sauvegarde (toujours à terre), la Coupure (trois balles, projecteur
// aveuglé), celle du toit de la tour qui ne tombe pas, et une nouvelle partie où elle revole.
// Usage : NODE_PATH=$(npm root -g) node tools/test/faucheuse.mjs [dossier-captures]
import {ouvrir,verifier} from './outils.mjs';
const sortie=process.argv[2];
const g=await ouvrir();await g.jouer();await g.avancer(3);
const S=()=>g.pn(()=>JSON.parse(JSON.stringify(window.__pn.S)));
const capture=async nom=>{if(sortie)await g.capture(sortie+'/'+nom+'.png')};
const fau=()=>g.pn(()=>{const f=window.__pn.zone().faucheuses[0];return f&&{pv:f.pv,abattue:f.abattue,chute:!!f.chute,aveugle:f.aveugle,y:f.g.position.y,feux:f.feux.every(e=>e.visible),fumee:f.fumee.o.rate,blindee:f.blindee}});
// Vise un point (x,y,z) depuis la caméra d'Ash
const viserPoint=([x,y,z])=>g.pn(([x,y,z])=>{const pn=window.__pn,P=pn.P,dx=x-P.pos.x,dz=z-P.pos.z,dy=y-(1.66-.62*P.crouch);P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz))},[x,y,z]);

// Chapitre 3, armé : la Faucheuse tourne au-dessus de la rue
await g.pn(()=>{const pn=window.__pn;Object.assign(pn.S,{quest:true,code:true,chip:true,door:true,ch2:true,armed:true,battery:true,decoded:true,gate:true});pn.saveGame();pn.applySave(pn.readSave());pn.emit('chapitre3')});
await g.avancer(10);await g.pn(()=>window.__pn.passerCine());await g.avancer(5);
verifier((await fau()).pv===10&&!(await fau()).abattue,'la Faucheuse de la rue, intacte');
// 1. Une vraie balle de P-9 dans un réacteur
await g.pn(()=>{window.__pn.G.grace=1e6});await g.placer(0,-3,0);await g.avancer(1);
const xp0=(await S()).xp;
for(let i=0;i<3;i++){const r=await g.pn(()=>{const f=window.__pn.zone().faucheuses[0],v=f.reacteurs[0].getWorldPosition(f.g.position.clone());return[v.x,v.y,v.z]});
  await viserPoint(r);await g.avancer(1);await g.pn(()=>window.__pn.emit('shoot'));await g.p.waitForTimeout(700);await g.avancer(14)}
verifier((await fau()).pv<10,`une balle dans le réacteur compte (${10-(await fau()).pv} sur 3)`);
// 2. La coque encaisse
const pv1=(await fau()).pv;
await g.pn(()=>{window.__fau=window.__pn.zone().faucheuses[0]});
await g.pn(async()=>{const {toucheFaucheuse}=await import('/src/faucheuse.js');toucheFaucheuse(window.__fau,false,window.__fau.g.position.clone())});
verifier((await fau()).pv===pv1&&await g.pn(()=>window.__fau.verrou>0),'une balle sur la coque ricoche, mais le projecteur cherche le tireur');
// 3. Elle fume à mi-chemin, puis tombe
await g.pn(async()=>{const {toucheFaucheuse}=await import('/src/faucheuse.js');const f=window.__fau;while(f.pv>5)toucheFaucheuse(f,true,f.g.position.clone())});await g.avancer(5);
verifier((await fau()).fumee>0,'un réacteur touché fume');
await capture('faucheuse-fume');
await g.pn(async()=>{const {toucheFaucheuse}=await import('/src/faucheuse.js');const f=window.__fau;while(f.pv>0)toucheFaucheuse(f,true,f.g.position.clone())});
verifier((await fau()).chute,'elle part en vrille');
await g.placer(12,-3,-Math.PI/2);
for(let i=0;i<40&&(await fau()).chute;i++)await g.avancer(10);
let f=await fau(),s=await S();
verifier(!f.chute&&f.abattue&&f.y<1.2&&f.feux&&f.fumee>0,'au sol : épave en flammes, fumée');
verifier(s.faucheuses.includes('rue:0')&&s.xp>=xp0+150,`abattue pour de bon, ${s.xp-xp0} XP`);
verifier(await g.pn(()=>window.__pn.completion().det.find(d=>d.id==='faucheuses').fait===1),'comptée dans le pourcentage (1 sur 3)');
await g.pn(()=>{const pn=window.__pn,f=window.__fau;pn.P.pos.set(f.g.position.x+7,0,f.g.position.z+3);pn.P.yaw=Math.atan2(-(f.g.position.x-pn.P.pos.x),-(f.g.position.z-pn.P.pos.z));pn.P.pitch=-.12});await g.avancer(20);
await capture('faucheuse-epave');
// 4. Reprise d'une sauvegarde : toujours à terre
await g.pn(()=>{const pn=window.__pn;pn.saveGame();pn.applySave(pn.readSave())});await g.avancer(3);
f=await fau();verifier(f.abattue&&f.y<1.2&&f.feux,'reprise : la Faucheuse est toujours au sol');
// 5. La Coupure, sur la Faucheuse des toits : trois balles, et le projecteur aveuglé
await g.pn(()=>{const pn=window.__pn;pn.S.ameli.portee=3;pn.allerZone('toits',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
const sous=await g.pn(()=>{const f=window.__pn.zone().faucheuses[0];return[f.g.position.x,f.g.position.y,f.g.position.z]});
await g.placer(sous[0]+4,sous[2]+4,0);await viserPoint(sous);await g.avancer(1);
await g.pn(()=>window.__pn.emit('couper'));await g.p.waitForTimeout(500);await g.avancer(2);
f=await fau();verifier(f.pv===7&&f.aveugle>0,`la Coupure : trois balles d'un coup, projecteur aveuglé (${f.pv} PV, ${f.aveugle.toFixed(1)} s)`);
// 6. Celle du toit de la tour ne tombe pas
await g.pn(()=>{const pn=window.__pn;pn.allerZone('sommet',null,{fondu:false});pn.G.grace=1e6});await g.avancer(3);
await g.pn(async()=>{const {toucheFaucheuse}=await import('/src/faucheuse.js');const f=window.__pn.zone().faucheuses[0];for(let i=0;i<12;i++)toucheFaucheuse(f,true,f.g.position.clone())});
f=await fau();verifier(f.blindee&&f.pv===10&&!f.abattue,'la Faucheuse de Saal a des réacteurs carénés');
// 7. Nouvelle partie : elle revole
await g.pn(()=>window.__pn.newGame());await g.avancer(2);
verifier(await g.pn(()=>!window.__fau.abattue&&window.__fau.pv===10&&!window.__fau.feux[0].visible),'nouvelle partie : la Faucheuse de la rue revole');
verifier(!g.erreurs.length,'aucune erreur'+(g.erreurs.length?' : '+g.erreurs.join(' | '):''));
await g.fermer();console.log('Faucheuse : terminé.');

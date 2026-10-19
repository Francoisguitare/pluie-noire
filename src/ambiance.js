// Sons d'ambiance placés dans l'espace : ceux décrits par la zone (feu, vapeur, néon) et un moteur par drone.
// Créés quand le son est activé et qu'on entre dans la zone, coupés quand on la quitte.
import {AC,source3d,bruitBoucle,ronronnement,crepitement,updateListener} from './son.js';
import {camera,state} from './core.js';
let zoneSons=null,actifs=[];
function creer(def){
  const[x,y,z]=def.pos,s=source3d(x,y,z,def);if(!s)return null;
  if(def.type==='feu'){bruitBoucle(s,'lowpass',650,.7,.55);bruitBoucle(s,'bandpass',2400,.8,.05);s.feu=true}
  else if(def.type==='vapeur')bruitBoucle(s,'highpass',2600,.6,.35);
  else if(def.type==='neon'){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=100;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1200;f.Q.value=4;o.connect(f);f.connect(s.in);o.start();s.nodes.push(o)}
  s.vol(def.vol??1,.8);return s;
}
export function updateAmbiance(dt,z){
  if(!AC)return;
  updateListener(camera);
  if(zoneSons!==z){for(const s of actifs)s&&s.stop();actifs=(z.sons||[]).map(creer);zoneSons=z;for(const d of z.drones)d.son=null}
  for(const s of actifs)if(s&&s.feu&&Math.random()<dt*9)crepitement(s);
  // Drones : un moteur chacun, qui suit sa position et monte dans les aigus quand il s'alarme.
  for(const d of z.drones){
    const on=!d.dead&&d.g.visible;
    if(on&&!d.son){d.son=source3d(d.g.position.x,d.g.position.y,d.g.position.z,{ref:2,rolloff:1.4});d.moteur=ronronnement(d.son,150+Math.random()*20,.1);d.son.vol(d.passive?.45:1,.6)}
    if(!d.son)continue;
    if(!on){d.son.stop();d.son=null;continue}
    d.son.set(d.g.position.x,d.g.position.y,d.g.position.z);
    const f=(150+d.s*90)*(d.passive?.8:1);d.moteur.o1.frequency.setTargetAtTime(f,AC.currentTime,.2);d.moteur.o2.frequency.setTargetAtTime(f*2.01,AC.currentTime,.2);
  }
}

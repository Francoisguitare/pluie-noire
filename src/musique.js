// L'habillage sonore, tout synthétisé : fonds par lieu (ville lointaine, vent des toits, eau des quais, gouttes des
// traboules, ventilation de la tour), petits événements (sirènes au loin, corne de péniche, gouttes), sons d'interface,
// le monde étouffé en pause et pendant la lecture, et une musique très discrète : des nappes lentes qui viennent et
// repartent, avec de longs silences pour laisser la pluie, et une pulsation grave quand on est repéré.
// Réglage « Musique » dans le menu pause (gardé sur l'appareil) ; la touche M coupe tout.
import {$,P,G,state,on,MOBILE} from './core.js';
import {zone} from './zones.js';
import {AC,busMonde,busMaitre,bruitBlanc,etouffer,tone} from './son.js';

let pret=false,fonds={},mus=null;
const lire=k=>{try{return localStorage.getItem(k)}catch(e){return null}},ecrire=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let musiqueOn=lire('pn-musique')!=='0';

/* ---------- Fonds sonores ---------- */
// Un bruit filtré en boucle, au volume réglable (cible, lissée).
function bruit(type,f,q,lfo){
  const b=AC.createBufferSource();b.buffer=bruitBlanc();b.loop=true;b.playbackRate.value=.8+Math.random()*.4;
  const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=AC.createGain();g.gain.value=0;
  b.connect(fl);fl.connect(g);g.connect(busMonde());b.start();
  if(lfo){const o=AC.createOscillator(),og=AC.createGain();o.frequency.value=lfo.v;og.gain.value=lfo.amp;o.connect(og);og.connect(fl.frequency);o.start()}
  return{g,fl,cible:0};
}
function preparer(){
  if(pret||!AC)return;pret=true;
  fonds={
    ville:bruit('lowpass',140,.7),                          // la ville au loin, un grondement continu
    vent:bruit('bandpass',420,.9,{v:.07,amp:180}),           // le vent sur les toits, qui enfle et retombe
    eau:bruit('lowpass',320,1.2,{v:.18,amp:120}),            // l'eau qui clapote contre le quai
    cave:bruit('bandpass',220,2.5),                          // la résonance sourde des traboules
    clim:bruit('lowpass',95,1.5),                            // la ventilation de la tour
    serveurs:bruit('bandpass',1300,1.2),                     // les ventilateurs de la salle des serveurs
  };
  mus=creerMusique();
}
const NIVEAUX={rue:{ville:.05},toits:{ville:.04,vent:.11},traboules:{cave:.05},quais:{ville:.03,eau:.09,vent:.03},tour:{clim:.07},sommet:{vent:.16,ville:.02}};
function majFonds(dt,Z){
  const N=Object.assign({},NIVEAUX[Z.id]||{});
  if(Z.id==='tour'&&P.pos.x>129){N.serveurs=.045;N.clim=.03}
  const t=AC.currentTime,actif=state!=='title'&&state!=='end';
  for(const k in fonds){const v=actif?(N[k]||0):0;if(fonds[k].cible!==v){fonds[k].cible=v;fonds[k].g.gain.setTargetAtTime(v,t,1.2)}}
}

/* ---------- Petits événements, au hasard ---------- */
let prochain=12;
function sirene(){ // une sirène loin, qui passe et s'éloigne
  const t=AC.currentTime,o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain(),d=6+Math.random()*3;
  o.type='triangle';o.frequency.setValueAtTime(620,t);for(let k=0;k<d;k+=.9){o.frequency.linearRampToValueAtTime(820,t+k+.45);o.frequency.linearRampToValueAtTime(620,t+k+.9)}
  f.type='bandpass';f.frequency.value=700;f.Q.value=1.5;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.012,t+2);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(f);f.connect(g);g.connect(busMonde());o.start(t);o.stop(t+d+.1);
}
function goutte(){ // une goutte qui tombe dans une flaque, sous la voûte (avec son écho)
  const t=AC.currentTime,fr=1100+Math.random()*1600;
  for(const[k,v]of[[0,.03],[.19,.012],[.38,.005]]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(fr,t+k);o.frequency.exponentialRampToValueAtTime(fr*.55,t+k+.09);
    g.gain.setValueAtTime(v,t+k);g.gain.exponentialRampToValueAtTime(.0001,t+k+.12);o.connect(g);g.connect(busMonde());o.start(t+k);o.stop(t+k+.15)}
}
function corne(){ // une corne de péniche, au loin sur la Saône
  const t=AC.currentTime;for(const fr of[92,138]){const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.value=fr;f.type='lowpass';f.frequency.value=400;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.02,t+.6);g.gain.setValueAtTime(.02,t+2.6);g.gain.exponentialRampToValueAtTime(.0001,t+4);o.connect(f);f.connect(g);g.connect(busMonde());o.start(t);o.stop(t+4.1)}
}
function evenements(dt,Z){
  prochain-=dt;if(prochain>0)return;
  if(Z.id==='traboules'){goutte();prochain=1.5+Math.random()*5;return}
  if(Z.id==='quais'&&Math.random()<.35){corne();prochain=50+Math.random()*60;return}
  if(Z.id==='rue'||Z.id==='toits'||Z.id==='quais'){sirene();prochain=45+Math.random()*70;return}
  prochain=20;
}

/* ---------- La musique ---------- */
// Ré mineur, quatre accords lents ; chaque note : deux dents de scie désaccordées dans un filtre qui respire.
const ACCORDS=[[50,53,57,60,64],[46,50,53,57],[43,46,50,53,57],[45,50,52,55]],GAMME=[62,65,67,69,72,74,77];
const hz=m=>440*Math.pow(2,(m-69)/12);
function creerMusique(){
  const bus=AC.createGain();bus.gain.value=musiqueOn?1:0;bus.connect(busMaitre());
  const filtre=AC.createBiquadFilter();filtre.type='lowpass';filtre.frequency.value=700;filtre.Q.value=.7;filtre.connect(bus);
  const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=.05;lg.gain.value=250;lfo.connect(lg);lg.connect(filtre.frequency);lfo.start();
  // un écho pour les notes isolées
  const delai=AC.createDelay(2),retour=AC.createGain();delai.delayTime.value=.62;retour.gain.value=.38;delai.connect(retour);retour.connect(delai);delai.connect(bus);
  // la pulsation de la tension
  const pouls=AC.createOscillator(),pg=AC.createGain();pouls.type='sine';pouls.frequency.value=55;pg.gain.value=0;pouls.connect(pg);pg.connect(bus);pouls.start();
  return{bus,filtre,delai,pg,joue:false,t:0,phase:-25,accord:0,tension:0,battement:0};
}
function accord(m,notes,dur){
  const t=AC.currentTime;
  for(const n of notes)for(const det of[-6,6]){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.value=hz(n);o.detune.value=det;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.0065,t+4);g.gain.setValueAtTime(.0065,t+dur-4);g.gain.exponentialRampToValueAtTime(.0001,t+dur+1.5);
    o.connect(g);g.connect(m.filtre);o.start(t);o.stop(t+dur+1.6)}
}
function note(m){const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=hz(GAMME[Math.floor(Math.random()*GAMME.length)]);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.02,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+2.2);o.connect(g);g.connect(m.bus);g.connect(m.delai);o.start(t);o.stop(t+2.3)}
// Des sections de 2 à 3 minutes, puis 1 à 2 minutes de silence : la pluie seule.
function majMusique(dt){
  const m=mus,jeu=state==='play'||state==='dialogue'||state==='lecture'||state==='cine';
  if(jeu){m.phase+=dt;
    if(!m.joue&&m.phase>0){m.joue=true;m.phase=-(120+Math.random()*60);m.t=0}
    else if(m.joue&&m.phase>0){m.joue=false;m.phase=-(60+Math.random()*60)}
    if(m.joue){m.t-=dt;if(m.t<=0){accord(m,ACCORDS[m.accord++%ACCORDS.length],13);m.t=12}if(Math.random()<dt*.12)note(m)}}
  // la tension : une pulsation grave quand un ennemi te voit
  const cible=state==='play'?Math.max(0,(G.alertLvl-.3)/.7):0;m.tension+=(cible-m.tension)*Math.min(1,dt*2);
  m.battement+=dt*(1.6+m.tension*1.4);const k=Math.pow(Math.max(0,Math.sin(m.battement*Math.PI)),6);
  m.pg.gain.setTargetAtTime(m.tension*.05*k,AC.currentTime,.02);
}
export function basculerMusique(){musiqueOn=!musiqueOn;ecrire('pn-musique',musiqueOn?'1':'0');if(mus)mus.bus.gain.setTargetAtTime(musiqueOn?1:0,AC.currentTime,.5);majBouton();return musiqueOn}
function majBouton(){const b=$('pauseMusique');if(b)b.textContent='Musique : '+(musiqueOn?'oui':'non')}
majBouton();
$('pauseMusique').onclick=()=>basculerMusique();

/* ---------- Sons d'interface ---------- */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b||!AC)return;
  if(b.classList.contains('go')||b.classList.contains('lien'))tone(b.classList.contains('alt')||b.classList.contains('lien')?640:820,.05,'triangle',.025)},true);
let etatAvant='';
function interface_(){
  if(state===etatAvant)return;
  if(state==='paused'){tone(420,.12,'sine',.03,300)}             // pause : le monde s'éloigne
  else if(etatAvant==='paused'&&state==='play'){tone(300,.12,'sine',.03,420)}
  etatAvant=state;
}

/* ---------- Chaque image ---------- */
export function updateMusique(dt){
  if(!AC)return;preparer();const Z=zone();if(!Z)return;
  majFonds(dt,Z);if(state==='play')evenements(dt,Z);majMusique(dt);interface_();
  // le monde s'étouffe en pause et pendant la lecture d'une archive
  const f=state==='paused'?450:state==='lecture'?1400:20000;if(f!==filtreAvant){filtreAvant=f;etouffer(f)}
}
let filtreAvant=0;

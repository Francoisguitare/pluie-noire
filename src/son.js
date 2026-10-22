// Tout le son est synthétisé en direct (Web Audio) : fond de pluie, bourdonnement, effets, pas.
export let AC=null;
let out=null,noiseBuf=null,muted=false,room=null,rainG=null,rainLP=null,rainIn=false,etouffe=null,maitre=null;
// out (le monde) → etouffe (filtre : pause, lecture) → maitre (coupure du son, touche M) → haut-parleurs ; la musique entre dans maitre.
export function initAudio(){
  if(AC){AC.resume&&AC.resume();return}
  try{
    AC=new(window.AudioContext||window.webkitAudioContext)();out=AC.createGain();out.gain.value=.7;
    etouffe=AC.createBiquadFilter();etouffe.type='lowpass';etouffe.frequency.value=20000;maitre=AC.createGain();out.connect(etouffe);etouffe.connect(maitre);maitre.connect(AC.destination);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    // Réverbération courte pour les intérieurs (labo)
    const ir=AC.createBuffer(2,AC.sampleRate*.7|0,AC.sampleRate);for(let c=0;c<2;c++){const b=ir.getChannelData(c);for(let i=0;i<b.length;i++)b[i]=(Math.random()*2-1)*Math.pow(1-i/b.length,3.2)}
    room=AC.createConvolver();room.buffer=ir;const rg=AC.createGain();rg.gain.value=.35;room.connect(rg);rg.connect(out);
    const r=AC.createBufferSource();r.buffer=noiseBuf;r.loop=true;
    const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;
    const g=AC.createGain();g.gain.value=.1;r.connect(hp);hp.connect(lp);lp.connect(g);g.connect(out);r.start();rainG=g;rainLP=lp;
    const hum=AC.createOscillator();hum.type='sawtooth';hum.frequency.value=50;const hl=AC.createBiquadFilter();hl.type='lowpass';hl.frequency.value=130;
    const hg=AC.createGain();hg.gain.value=.03;hum.connect(hl);hl.connect(hg);hg.connect(out);hum.start();
  }catch(e){AC=null}
}
export function toggleMute(){muted=!muted;if(maitre)maitre.gain.value=muted?0:1;return muted}
// Pour musique.js : le bus du monde, le bus final, le bruit blanc ; et le filtre qui étouffe le monde (pause, lecture).
export const busMonde=()=>out,busMaitre=()=>maitre,bruitBlanc=()=>noiseBuf;
export function etouffer(f){if(etouffe)etouffe.frequency.setTargetAtTime(f,AC.currentTime,.25)}
// La pluie s'étouffe à l'intérieur.
let pluieK=1;
export function setIndoor(v){if(!rainG||v===rainIn)return;rainIn=v;const t=AC.currentTime;rainG.gain.setTargetAtTime((v?.035:.1)*pluieK,t,.3);rainLP.frequency.setTargetAtTime(v?800:2600,t,.3)}
// La pluie s'arrête (k = 0) ou reprend (k = 1), en quelques secondes.
export function setPluie(k){pluieK=k;if(!rainG)return;rainG.gain.setTargetAtTime((rainIn?.035:.1)*k,AC.currentTime,1.5)}
export function tone(f,dur,type,vol,f2){
  if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);
}
// Pas : talon puis semelle, timbre selon la surface, alternance gauche/droite. Accroupi : aucun son (voir joueur.js).
// STEP_VOL cale un pas sur l'asphalte un peu au-dessus du fond de pluie.
const STEP_VOL=10;let stepSide=0;
export function footstep(surf,run){
  if(!AC)return;const t=AC.currentTime+.005,R=Math.random;stepSide^=1;
  const bus=AC.createGain();bus.gain.value=(run?1.4:1)*(.8+R()*.4)*STEP_VOL;
  const pan=AC.createStereoPanner?AC.createStereoPanner():null;
  if(pan){pan.pan.value=stepSide?.14:-.14;bus.connect(pan);pan.connect(out)}else bus.connect(out);
  if(surf==='tile'&&room){const s=AC.createGain();s.gain.value=.6;bus.connect(s);s.connect(room)}
  const pv=1+(R()-.5)*.16,toe=t+(run?.03:.055)+R()*.025;
  const n=(at,type,f,q,v,a,d)=>nz(at,type,f*pv,q,v,a,d,undefined,bus);
  if(surf==='tile'){n(t,'bandpass',2600,2.5,.12,.001,.025);n(t,'lowpass',650,.8,.1,.002,.04);n(toe,'bandpass',3800,3,.05,.001,.02);return}
  if(surf==='bois'){n(t,'lowpass',320,.9,.12,.002,.06);n(t+.004,'bandpass',900,2.2,.05,.002,.05);n(toe,'bandpass',1500,2,.03,.002,.03);return}
  if(surf==='metal'){n(t,'bandpass',900,3,.045,.001,.04);n(toe,'bandpass',3200,4,.022,.001,.02);
    for(const[f,v]of[[470,.007],[1210,.0035]]){const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f*pv;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.4)}
    return}
  n(t,'lowpass',420,.8,.09,.002,.05);
  if(surf==='puddle'){n(t+.004,'bandpass',1100,1,.035,.003,.12);n(t+.01,'highpass',2800,.7,.025,.005,.18);for(let i=0;i<4;i++)n(t+.04+R()*.16,'bandpass',3000+R()*2500,8,.01,.001,.015);return}
  n(t,'bandpass',1400,1.2,.03,.001,.03);n(toe,'bandpass',2600,1.5,.028,.002,.035);n(t+.01,'highpass',3200,.7,.022,.004,.07);
}
export function lockSound(){
  if(!AC)return;const t=AC.currentTime;
  const o=AC.createOscillator(),lp=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(140,t+.75);
  lp.type='lowpass';lp.frequency.value=2400;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.8);
  o.connect(lp);lp.connect(g);g.connect(out);o.start(t);o.stop(t+.85);
  nz(t+.72,'lowpass',220,.7,.3,.004,.25);click(t+.74,1600,.06);
  for(let i=0;i<7;i++)nz(t+.05+Math.random()*.6,'bandpass',2500+Math.random()*3000,6,.05,.001,.012);
}
export function unlockSound(){
  if(!AC)return;const t=AC.currentTime;
  const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(760,t+.4);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.04,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+.45);o.connect(g);g.connect(out);o.start(t);o.stop(t+.5);
  for(let i=0;i<4;i++)click(t+.1+i*.07,1800+i*300,.03);
}
export function click(t,f,v){const o=AC.createOscillator(),bp=AC.createBiquadFilter(),g=AC.createGain();o.type='square';o.frequency.value=f;bp.type='bandpass';bp.frequency.value=f;bp.Q.value=5;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.025);o.connect(bp);bp.connect(g);g.connect(out);o.start(t);o.stop(t+.04)}
export function nz(t,type,f,q,v,att,dec,off,dest){const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;fl.type=type;fl.frequency.value=f;fl.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec);s.connect(fl);fl.connect(g);g.connect(dest||out);s.start(t,off??Math.random()*1.5,att+dec+.05);return fl}
export function shotSound(){
  if(!AC)return;const t=AC.currentTime;
  const f=nz(t,'lowpass',5200,.5,.5,.003,.1);f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(600,t+.1);
  nz(t,'highpass',2500,.6,.12,.002,.05);
  const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(50,t+.08);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.28,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.1);o.connect(g);g.connect(out);o.start(t);o.stop(t+.12);
  click(t+.03,3400,.06);click(t+.07,2300,.05);
}
export function droneHitSound(){
  if(!AC)return;const t=AC.currentTime+.04;
  for(const[f,v]of[[880,.08],[1330,.05],[2210,.03]]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(out);o.start(t);o.stop(t+.4)}
  for(let i=0;i<6;i++)nz(t+i*.04+Math.random()*.03,'bandpass',2600+Math.random()*1500,3,.09,.002,.03);
  const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(260,t);o.frequency.exponentialRampToValueAtTime(35,t+.9);
  g.gain.setValueAtTime(.045,t);g.gain.exponentialRampToValueAtTime(.0001,t+.95);o.connect(g);g.connect(out);o.start(t);o.stop(t+1);
}
export function crashSound(){if(!AC)return;const t=AC.currentTime;nz(t,'lowpass',380,.7,.4,.005,.3);click(t+.02,1800,.07);click(t+.09,1300,.05);click(t+.16,2100,.035)}
export function thunder(){
  if(!AC)return;const t=AC.currentTime+.9+Math.random(),s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;s.loop=true;
  f.type='lowpass';f.frequency.value=180;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.5,t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+3.2);
  s.connect(f);f.connect(g);g.connect(out);s.start(t);s.stop(t+3.4);
}

/* ---------- Sons placés dans l'espace (HRTF) : feu, vapeur, drones… ---------- */
// L'auditeur suit la caméra (position, regard, haut).
export function updateListener(cam){
  if(!AC)return;const L=AC.listener,e=cam.matrixWorld.elements;
  if(L.positionX){L.positionX.value=e[12];L.positionY.value=e[13];L.positionZ.value=e[14];L.forwardX.value=-e[8];L.forwardY.value=-e[9];L.forwardZ.value=-e[10];L.upX.value=e[4];L.upY.value=e[5];L.upZ.value=e[6]}
  else{L.setPosition(e[12],e[13],e[14]);L.setOrientation(-e[8],-e[9],-e[10],e[4],e[5],e[6])}
}
// Une source : on y branche des générateurs (bruitBoucle, ronronnement) ; vol() règle son niveau, stop() l'éteint.
export function source3d(x,y,z,o={}){
  if(!AC)return null;
  const p=AC.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=o.ref||1.5;p.rolloffFactor=o.rolloff||1.3;p.maxDistance=80;
  const g=AC.createGain();g.gain.value=0;g.connect(p);p.connect(out);
  const s={p,in:g,nodes:[],
    set(x,y,z){if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z}else p.setPosition(x,y,z)},
    vol(v,tc=.15){g.gain.setTargetAtTime(v,AC.currentTime,tc)},
    stop(){g.gain.setTargetAtTime(0,AC.currentTime,.1);setTimeout(()=>{for(const n of s.nodes)try{n.stop()}catch(e){}try{p.disconnect()}catch(e){}},500)}};
  s.set(x,y,z);return s;
}
export function bruitBoucle(s,type,f,q,v){
  const b=AC.createBufferSource();b.buffer=noiseBuf;b.loop=true;b.playbackRate.value=.85+Math.random()*.3;
  const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=AC.createGain();g.gain.value=v;
  b.connect(fl);fl.connect(g);g.connect(s.in);b.start(AC.currentTime,Math.random()*1.5);s.nodes.push(b);return{fl,g};
}
// Moteur de drone : dent de scie + carré filtrés, avec le battement des rotors.
export function ronronnement(s,f,v){
  const o1=AC.createOscillator(),o2=AC.createOscillator();o1.type='sawtooth';o2.type='square';o1.frequency.value=f;o2.frequency.value=f*2.01;
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.Q.value=2;
  const am=AC.createGain();am.gain.value=v;const lfo=AC.createOscillator();lfo.frequency.value=34+Math.random()*6;const lg=AC.createGain();lg.gain.value=v*.5;lfo.connect(lg);lg.connect(am.gain);
  const g2=AC.createGain();g2.gain.value=.4;o2.connect(g2);g2.connect(lp);o1.connect(lp);lp.connect(am);am.connect(s.in);
  const t=AC.currentTime;o1.start(t);o2.start(t);lfo.start(t);s.nodes.push(o1,o2,lfo);return{o1,o2,lp};
}
// Une brindille qui claque dans le feu (à appeler au hasard).
export function crepitement(s){if(!AC||!s)return;const t=AC.currentTime+Math.random()*.05;nz(t,'bandpass',1800+Math.random()*3500,4,.12+Math.random()*.25,.001,.012+Math.random()*.02,undefined,s.in)}

// Verre qui éclate (lampe abattue) et étincelles.
export function verreSound(){if(!AC)return;const t=AC.currentTime;nz(t,'highpass',3500,.7,.18,.001,.08);for(let i=0;i<7;i++){const k=t+.02+Math.random()*.25;nz(k,'bandpass',4000+Math.random()*4000,9,.05,.001,.02+Math.random()*.03)}click(t+.01,2400,.05)}
// Grondement de la Faucheuse et coupure de courant.
export function coupure(){if(!AC)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(30,t+.8);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(g);g.connect(out);o.start(t);o.stop(t+1);nz(t,'lowpass',200,.7,.35,.004,.5)}
export function clac(){if(!AC)return;const t=AC.currentTime;click(t,900+Math.random()*600,.05);nz(t,'bandpass',2500,3,.06,.001,.03)}
// Haut-parleurs d'Helix : un « ding » descendant avant l'annonce.
export function annonce(){if(!AC)return;tone(880,.35,'sine',.05,660);setTimeout(()=>tone(660,.5,'sine',.05,440),300)}
// Trois coups contre une porte en bois.
export function frapper(){if(!AC)return;const t=AC.currentTime;for(let i=0;i<3;i++){const k=t+i*.28;nz(k,'lowpass',240,.9,.55,.002,.08);nz(k+.002,'bandpass',750,2,.12,.002,.035)}}
// Porte métallique qui coulisse (badge accepté).
export function porteMetal(){if(!AC)return;const t=AC.currentTime;click(t,2400,.04);click(t+.08,3000,.04);const f=nz(t+.15,'bandpass',300,1.5,.12,.08,1.1);f.frequency.setValueAtTime(220,t+.15);f.frequency.linearRampToValueAtTime(520,t+1.2);nz(t+1.25,'lowpass',180,.8,.25,.004,.2)}
/* ---------- La Coupure, l'XP, les archives ---------- */
// L'arc : un claquement électrique, une montée aiguë et un grésillement (k : 1 = coup plein, moins = geste à vide).
export function arcSound(k=1){
  if(!AC)return;const t=AC.currentTime;
  const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(1900*k+200,t+.12);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06*k+.01,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);g.connect(out);o.start(t);o.stop(t+.32);
  nz(t,'highpass',3000,.7,.22*k,.001,.06);
  for(let i=0;i<Math.round(9*k);i++)nz(t+.02+i*.025+Math.random()*.02,'bandpass',3000+Math.random()*4000,6,.1*k,.001,.015);
}
// Une armure qui tombe d'un bloc sur le sol : choc sourd et cliquetis de plaques.
export function chuteArmure(){if(!AC)return;const t=AC.currentTime;nz(t,'lowpass',260,.8,.6,.004,.35);nz(t,'bandpass',900,2,.12,.002,.12);click(t+.03,1400,.06);click(t+.1,900,.05);click(t+.19,1700,.03)}
export function niveauSound(){if(!AC)return;[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.28,'triangle',.045),i*90))}
// Le signal de la main K7 près d'une archive : un bip bref, plus aigu quand on s'approche (k de 0 à 1).
export function bipSignal(k){if(!AC)return;tone(700+k*700,.05,'sine',.012+k*.012)}
export function archiveSound(){if(!AC)return;tone(1320,.5,'sine',.04,1760);setTimeout(()=>tone(1980,.6,'sine',.025),110)}

/* ---------- Combat ---------- */
// Un tir ennemi, pas silencieux : claquement, corps, grondement ; plus faible au loin (d en mètres). lourd : la Faucheuse.
export function tirEnnemi(d,lourd){
  if(!AC)return;const t=AC.currentTime+Math.min(.12,d/340),k=1/(1+d/9);
  nz(t,'highpass',lourd?1800:2600,.6,.3*k,.001,.04);
  const f=nz(t,'lowpass',lourd?2400:3800,.5,.55*k,.002,lourd?.16:.11);f.frequency.setValueAtTime(lourd?2400:3800,t);f.frequency.exponentialRampToValueAtTime(lourd?260:420,t+(lourd?.16:.11));
  const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(lourd?90:120,t);o.frequency.exponentialRampToValueAtTime(38,t+.14);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35*k,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+(lourd?.22:.14));o.connect(g);g.connect(out);o.start(t);o.stop(t+.25);
  if(room&&d>6)nz(t+.02,'lowpass',900,.6,.12*k,.01,.35,undefined,room); // l'écho dans la rue
}
// Une balle qui passe tout près.
export function sifflement(){if(!AC)return;const t=AC.currentTime,f=nz(t,'bandpass',4200,7,.09,.004,.11);f.frequency.setValueAtTime(4200,t);f.frequency.exponentialRampToValueAtTime(1300,t+.12)}
// Une balle qui frappe le sol à côté.
export function ricochet(){if(!AC)return;const t=AC.currentTime;click(t,1900+Math.random()*900,.05);tone(2600+Math.random()*800,.09,'sine',.012,1500)}
// Un coup encaissé : un choc sourd.
export function impactJoueur(){
  if(!AC)return;const t=AC.currentTime;nz(t,'lowpass',160,.7,.7,.003,.22);click(t+.005,700,.06);
  const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(85,t);o.frequency.exponentialRampToValueAtTime(36,t+.25);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);g.connect(out);o.start(t);o.stop(t+.32);
}
// La fléchette d'un drone : décharge électrique.
export function taserSon(){
  if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.value=62;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.45);o.connect(g);g.connect(out);o.start(t);o.stop(t+.5);
  for(let i=0;i<10;i++)nz(t+i*.035+Math.random()*.02,'bandpass',2500+Math.random()*4500,5,.12,.001,.018);
}
// Une grille laser qui brûle.
export function brulure(){if(!AC)return;const t=AC.currentTime;nz(t,'highpass',4800,.7,.25,.002,.3);tone(1500,.25,'square',.02,500);impactJoueur()}
// Le cœur qui cogne quand la santé est basse.
export function coeur(k){if(!AC)return;const t=AC.currentTime;for(const[d,v]of[[0,1],[.17,.6]]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(58,t+d);o.frequency.exponentialRampToValueAtTime(40,t+d+.12);
  g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.2*k*v,t+d+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d+.16);o.connect(g);g.connect(out);o.start(t+d);o.stop(t+d+.2)}}
// À terre : le choc, puis un sifflement d'oreilles qui s'éteint.
export function chuteJoueur(){
  if(!AC)return;const t=AC.currentTime;nz(t,'lowpass',200,.7,.8,.004,.5);nz(t+.12,'lowpass',260,.8,.4,.004,.3);
  const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=3300;g.gain.setValueAtTime(.0001,t+.1);g.gain.exponentialRampToValueAtTime(.02,t+.4);g.gain.exponentialRampToValueAtTime(.0001,t+2.6);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+2.7);
}
// Un Gardien arme son canon d'épaule : deux déclics et un servomoteur.
export function armement(d){if(!AC)return;const t=AC.currentTime,k=1/(1+d/8);click(t,1300,.07*k);click(t+.09,1800,.06*k);const f=nz(t+.03,'bandpass',900,3,.08*k,.02,.25);f.frequency.setValueAtTime(700,t+.03);f.frequency.linearRampToValueAtTime(1500,t+.28)}
// L'alarme d'une caméra.
export function alarme(){if(!AC)return;for(let i=0;i<4;i++)setTimeout(()=>tone(i%2?700:940,.2,'square',.022),i*210)}

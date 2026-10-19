// Tout le son est synthétisé en direct (Web Audio) : fond de pluie, bourdonnement, effets, pas.
export let AC=null;
let out=null,noiseBuf=null,muted=false,room=null,rainG=null,rainLP=null,rainIn=false;
export function initAudio(){
  if(AC){AC.resume&&AC.resume();return}
  try{
    AC=new(window.AudioContext||window.webkitAudioContext)();out=AC.createGain();out.gain.value=.7;out.connect(AC.destination);
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
export function toggleMute(){muted=!muted;if(out)out.gain.value=muted?0:.7;return muted}
// La pluie s'étouffe à l'intérieur.
export function setIndoor(v){if(!rainG||v===rainIn)return;rainIn=v;const t=AC.currentTime;rainG.gain.setTargetAtTime(v?.035:.1,t,.3);rainLP.frequency.setTargetAtTime(v?800:2600,t,.3)}
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

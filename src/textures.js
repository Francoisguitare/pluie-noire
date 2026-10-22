// Textures dessinées au canvas : façades, flaques, asphalte. PUD est le premier tirage de rnd : ne pas déplacer.
import {THREE,rnd,mulberry32} from './core.js';

export function canvasTex(c,rep,linear){const t=new THREE.CanvasTexture(c);if(!linear)t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=8;return t}
export function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')]}
// Ce qu'on devine derrière une fenêtre allumée : des stores, des rideaux à moitié tirés, un plafonnier et des meubles,
// une télé dans une pièce sombre, une rampe de néon au-dessus de plantes. Personne : les silhouettes, ce sont les
// fenêtres vivantes (fenetres.js), animées.
function interieur(ge,r,wx,wy,ww,wh,odd){
  const t=r(),ombre=a=>`rgba(10,6,4,${a})`;
  if(t<.28){ge.fillStyle='rgba(0,0,0,.55)';for(let k=0;k<wh;k+=4)ge.fillRect(wx,wy+k,ww,2)} // stores
  else if(t<.52){ // rideaux tirés à moitié, avec leurs plis
    const a=5+r()*11,b=5+r()*11;ge.fillStyle=ombre(.55);ge.fillRect(wx,wy,a,wh);ge.fillRect(wx+ww-b,wy,b,wh);
    ge.fillStyle='rgba(0,0,0,.28)';for(let k=wx+2;k<wx+a;k+=3)ge.fillRect(k,wy,1,wh);for(let k=wx+ww-b+1;k<wx+ww;k+=3)ge.fillRect(k,wy,1,wh)}
  else if(t<.76){ // une pièce : le plafonnier, un dossier de canapé, une étagère, parfois une plante
    ge.fillStyle='rgba(255,240,210,.55)';ge.beginPath();ge.arc(wx+ww*(.3+r()*.4),wy+4,4,0,7);ge.fill();
    ge.fillStyle=ombre(.7);ge.fillRect(wx+2,wy+wh-9,ww*(.35+r()*.2),9);ge.fillRect(wx+ww-9,wy+7,7,wh-7);
    ge.fillStyle=ombre(.45);for(let k=0;k<3;k++)ge.fillRect(wx+ww-9,wy+11+k*7,7,1);
    if(r()<.5){ge.fillStyle=ombre(.6);ge.beginPath();ge.arc(wx+ww*.62,wy+wh-12,4,0,7);ge.fill();ge.fillRect(wx+ww*.62-1,wy+wh-9,2,9)}}
  else if(t<.9){ // une télé allumée dans le noir
    ge.fillStyle='rgba(0,0,0,.62)';ge.fillRect(wx,wy,ww,wh);ge.fillStyle='#8ab4ff';ge.globalAlpha=.85;ge.fillRect(wx+ww*.3,wy+wh*.42,ww*.36,wh*.28);
    ge.globalAlpha=.22;ge.fillRect(wx+ww*.12,wy+wh*.25,ww*.76,wh*.65);ge.globalAlpha=1}
  else{ // une rampe de néon, des plantes en culture
    ge.fillStyle=odd[Math.floor(r()*odd.length)];ge.fillRect(wx+3,wy+2,ww-6,2);ge.fillStyle='rgba(0,0,0,.5)';for(let k=0;k<5;k++)ge.fillRect(wx+4+k*7,wy+wh-7-r()*8,3,14)}
  if(r()<.25){ge.fillStyle='rgba(0,0,0,.7)';ge.fillRect(wx,wy,ww*(.2+r()*.3),wh)}
}
function facade(seed,density){
  const r=mulberry32(seed),S=512,cell=64;
  const[ce,ge]=mk(S,S),[cd,gd]=mk(S,S);
  ge.fillStyle='#000';ge.fillRect(0,0,S,S);
  gd.fillStyle='#34363e';gd.fillRect(0,0,S,S);
  for(let i=0;i<9000;i++){const v=40+Math.floor(r()*40);gd.fillStyle=`rgba(${v},${v+2},${v+8},.5)`;gd.fillRect(r()*S,r()*S,2,2)}
  const warm=['#ffd59a','#ffc47a','#ffe2b8','#ffb060'],cool=['#9fd8ff','#c8f0ff','#8ab4ff'],odd=['#ff8fd0','#b48cff','#7dffc8'];
  for(let y=0;y<8;y++){
    gd.fillStyle='rgba(0,0,0,.45)';gd.fillRect(0,y*cell+58,S,4);
    gd.fillStyle='rgba(255,255,255,.05)';gd.fillRect(0,y*cell+62,S,2);
    for(let x=0;x<8;x++){
      const wx=x*cell+12,wy=y*cell+12,ww=40,wh=36;
      gd.fillStyle='#0b0c10';gd.fillRect(wx-3,wy-3,ww+6,wh+6);
      gd.fillStyle='#14171e';gd.fillRect(wx,wy,ww,wh);
      if(r()<density){
        const pal=r()<.62?warm:r()<.8?cool:odd,col=pal[Math.floor(r()*pal.length)];
        const gr=ge.createLinearGradient(0,wy,0,wy+wh);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(40,20,10,1)');
        ge.globalAlpha=.55+r()*.45;ge.fillStyle=gr;ge.fillRect(wx,wy,ww,wh);ge.globalAlpha=1;
        interieur(ge,r,wx,wy,ww,wh,odd);
      }else if(r()<.25){ge.fillStyle='rgba(30,40,70,.35)';ge.fillRect(wx,wy,ww,wh)}
      ge.fillStyle='#000';ge.fillRect(wx+ww/2-1,wy,2,wh);
    }
  }
  for(let i=0;i<90;i++){const x=r()*S,y=r()*S,l=40+r()*180;const gr=gd.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(0,0,0,.28)');gr.addColorStop(1,'rgba(0,0,0,0)');gd.fillStyle=gr;gd.fillRect(x,y,1+r()*3,l)}
  return{em:canvasTex(ce,true),df:canvasTex(cd,true)};
}
export const FAC=[facade(11,.32),facade(23,.22),facade(37,.4),facade(51,.28)];
function puddleCanvas(){
  const[c,g]=mk(512,512);g.fillStyle='#000';g.fillRect(0,0,512,512);
  const blob=(x,y,r,a)=>{for(const[dx,dy]of[[0,0],[512,0],[-512,0],[0,512],[0,-512]]){const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(.55,`rgba(255,255,255,${a*.8})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x+dx,y+dy,r,0,7);g.fill()}};
  for(let i=0;i<34;i++){const x=rnd()*512,y=rnd()*512;for(let k=0;k<4;k++)blob(x+(rnd()-.5)*60,y+(rnd()-.5)*40,18+rnd()*46,.9)}
  for(let i=0;i<400;i++)blob(rnd()*512,rnd()*512,2+rnd()*6,.5);
  return c;
}
export const PUD=puddleCanvas();
// Masque des flaques lu côté processeur (sons de pas), même échantillonnage que le shader du sol.
export const PUDD=(()=>{const d=PUD.getContext('2d').getImageData(0,0,512,512).data,a=new Uint8Array(512*512);for(let i=0;i<a.length;i++)a[i]=d[i*4];return a})();
export function asphaltCanvas(){
  const[c,g]=mk(512,512);g.fillStyle='#24252b';g.fillRect(0,0,512,512);
  for(let i=0;i<26000;i++){const v=20+Math.floor(rnd()*40);g.fillStyle=`rgb(${v},${v},${v+4})`;g.fillRect(rnd()*512,rnd()*512,1+rnd()*2,1+rnd()*2)}
  g.strokeStyle='rgba(8,8,10,.8)';g.lineWidth=2;
  for(let i=0;i<14;i++){g.beginPath();let x=rnd()*512,y=rnd()*512;g.moveTo(x,y);for(let k=0;k<8;k++){x+=(rnd()-.5)*50;y+=(rnd()-.5)*50;g.lineTo(x,y)}g.stroke()}
  return c;
}
export function roughCanvas(){const[c,g]=mk(512,512);g.fillStyle='#b4b4b4';g.fillRect(0,0,512,512);g.globalCompositeOperation='difference';g.drawImage(PUD,0,0);g.globalCompositeOperation='source-over';
  const d=g.getImageData(0,0,512,512),a=d.data;for(let i=0;i<a.length;i+=4){const v=Math.max(30,a[i]*.9);a[i]=a[i+1]=a[i+2]=v}g.putImageData(d,0,0);return c}
export const softDot=(()=>{const[c,g]=mk(64,64);const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();

/* ---------- Pierre de taille et pavés (traboules, quais) : r est la suite aléatoire de la zone ---------- */
export function texPierre(r){const[c,g]=mk(512,512);g.fillStyle='#3e3a35';g.fillRect(0,0,512,512);
  for(let y=0;y<512;){const h=34+Math.floor(r()*22);for(let x=-Math.floor(r()*80);x<512;){const w=70+Math.floor(r()*70),v=52+Math.floor(r()*28);g.fillStyle=`rgb(${v+6},${v+2},${v-4})`;g.fillRect(x+3,y+3,w-6,h-6);
      for(let k=0;k<30;k++){const q=v-12+Math.floor(r()*24);g.fillStyle=`rgba(${q},${q},${q-6},.5)`;g.fillRect(x+3+r()*(w-8),y+3+r()*(h-8),2+r()*4,2+r()*3)}x+=w}y+=h}
  for(let i=0;i<40;i++){const x=r()*512,l=60+r()*200;const gr=g.createLinearGradient(0,512-l,0,512);gr.addColorStop(0,'rgba(20,24,16,0)');gr.addColorStop(1,'rgba(20,28,14,.45)');g.fillStyle=gr;g.fillRect(x,512-l,8+r()*20,l)}
  return c}
export function texPaves(r){const[c,g]=mk(512,512);g.fillStyle='#16161a';g.fillRect(0,0,512,512);
  for(let j=0;j<16;j++)for(let i=0;i<16;i++){const off=j%2?16:0,x=i*32+off+2,y=j*32+2,v=58+Math.floor(r()*30);g.fillStyle=`rgb(${v},${v-2},${v-6})`;g.beginPath();g.roundRect?g.roundRect(x,y,28,28,7):g.rect(x,y,28,28);g.fill();
    g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x+4,y+4,12,6)}
  return c}

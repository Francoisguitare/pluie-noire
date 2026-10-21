// Les pouvoirs d'Ash. La puce a laissé dans sa main K7 les codes de coupure d'Helix : la Coupure les renvoie à l'envoyeur.
// Un Gardien (son armure est une K7) tombe raide, un drone s'écrase, une caméra s'éteint. Pas de munitions, seulement
// le temps que la main se refroidisse. L'XP (neutralisations, archives cachées, chapitres) donne des points de pouvoir
// à dépenser dans l'écran « Pouvoirs » (pause, ou Tab) : portée, recharge, discrétion, arc, écho.
import {THREE,$,V3,P,T,camera,scene,MOBILE,state,on,emit,clamp} from './core.js';
import {S,niveauDe,seuilNiveau} from './histoire/partie.js';
import {zone} from './zones.js';
import {los} from './physique.js';
import {toast,ouvrirEcran,fermerEcran} from './interface.js';
import {glow} from './construire.js';
import {killDrone,burst} from './drones.js';
import {detruireCamera} from './cameras.js';
import {neutraliser,relever,remettre,bruitDeChute} from './gardiens.js';
import {gesteCoupure,boutDesDoigts,handLocked} from './joueur.js';
import {arcSound,chuteArmure,niveauSound} from './son.js';

/* ---------- Améliorations : un point par rang ---------- */
const virgule=v=>String(v).replace('.',',');
export const AMELIS=[
  {id:'portee',nom:'Portée',val:[12,17,23,30],effet:v=>`${v} m`,desc:"Jusqu'où le signal porte."},
  {id:'recharge',nom:'Recharge',val:[6,4.2,2.8,1.5],effet:v=>`${virgule(v)} s entre deux coupures`,desc:'Le temps que la main refroidisse.'},
  {id:'discretion',nom:'Discrétion',val:[9,4,0],effet:v=>v?`la chute s'entend à ${v} m`:'chute silencieuse',desc:"Une armure qui tombe, ça s'entend. Les autres Gardiens vont voir le corps."},
  {id:'arc',nom:'Arc',val:[0,1,2],effet:v=>v?`rebondit sur ${v} cible${v>1?'s':''} proche${v>1?'s':''}`:'une seule cible',desc:"Le signal saute d'une armure à l'autre, jusqu'à 7 m."},
  {id:'echo',nom:'Écho',val:[0,18,32],effet:v=>v?`signaux Helix repérés à ${v} m, à travers les murs`:'aucun repérage',desc:'Ta main entend les Gardiens, les drones et les caméras autour de toi.'},
];
const rang=id=>S.ameli[id]||0;
const val=id=>AMELIS.find(a=>a.id===id).val[rang(id)];
export const niveau=()=>niveauDe(S.xp);
export const NB_ARCHIVES=41;
// portée de l'Écho (0 si pas encore appris) : exploration.js s'en sert pour montrer les archives à travers les murs
export const porteeEcho=()=>val('echo');
export const pointsDispo=()=>niveau()-Object.values(S.ameli).reduce((a,b)=>a+b,0);
// La Coupure arrive au chapitre 3, une fois la rue plongée dans le noir (Mara l'explique dans la cinématique).
export const coupureDispo=()=>S.chapter>=4||(S.chapter===3&&S.blackout);
export function ameliorer(id){const a=AMELIS.find(a=>a.id===id);if(!a||pointsDispo()<1||rang(id)>=a.val.length-1)return false;S.ameli[id]=rang(id)+1;niveauSound();emit('save');majHud();return true}

/* ---------- XP ---------- */
export function gagner(n,raison){
  const avant=niveau();S.xp+=n;popXp(`+${n} XP · ${raison}`);majHud();
  if(niveau()>avant){niveauSound();setTimeout(()=>toast(`Niveau ${niveau()} : un point de pouvoir à dépenser (${MOBILE?'menu II, puis Pouvoirs':'touche Tab'})`),500)}
}
function popXp(t){const e=document.createElement('div');e.className='xpPop';e.textContent=t;$('xpPops').appendChild(e);setTimeout(()=>e.remove(),1900)}
on('droneKilled',(d,instant)=>{if(!instant&&state!=='title')gagner(20,'drone abattu')});
on('cameraDetruite',(c,instant)=>{if(!instant)gagner(15,'caméra éteinte')});
// Chaque étape de l'histoire franchie rapporte 100 XP (les parties d'avant les pouvoirs les touchent à la reprise).
const etape=()=>S.chapter>=3?S.chapter:S.ch2?2:1;

/* ---------- Viser ---------- */
const _o=new V3(),_d=new V3(),_v=new V3();
function cibles(Z){
  const L=[];
  for(const g of Z.gardiens)if(!g.neutre&&g.g.visible)L.push({k:'gardien',o:g,x:g.pos.x,y:1.25,z:g.pos.z,r:.5,s:g.s});
  for(const d of Z.drones)if(!d.dead&&d.g.visible)L.push({k:'drone',o:d,x:d.g.position.x,y:d.g.position.y,z:d.g.position.z,r:.55,s:d.s});
  for(const c of Z.cameras)if(!c.mort)L.push({k:'camera',o:c,x:c.x,y:c.y,z:c.z,r:.35,s:c.s});
  return L;
}
// La cible sous le viseur, avec un peu d'aide à la visée ; même hors de portée (le viseur le dit).
function viser(){
  camera.getWorldDirection(_d);camera.getWorldPosition(_o);let best=null,bs=1e9;
  for(const c of cibles(zone())){_v.set(c.x,c.y,c.z).sub(_o);const t=_v.dot(_d);if(t<.8||t>45)continue;const off=_v.addScaledVector(_d,-t).length();
    if(off>c.r+t*.04)continue;const sc=t+off*10;if(sc<bs&&los(_o.x,_o.z,c.x,c.z)){best=c;bs=sc;c.dist=Math.hypot(c.x-_o.x,c.z-_o.z)}}
  return best;
}

/* ---------- L'arc électrique : deux rubans face à la caméra, redessinés à chaque image ---------- */
const N=16,arcs=[];
function ruban(couleur,k){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((N+1)*6),3));
  const idx=[];for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(couleur).multiplyScalar(k),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));
  m.frustumCulled=false;m.renderOrder=6;scene.add(m);return m; // dans la scène dès le départ : shader compilé au chargement
}
for(let i=0;i<3;i++)arcs.push({coeur:ruban(0xeaffff,2.2),halo:ruban(0x58e6ff,1.4),a:new V3(),b:new V3(),t:0});
const _p=new V3(),_q=new V3(),_s=new V3(),_cam=new V3();
function dessinerArc(r,dt){
  r.t-=dt;const vis=r.t>0;r.coeur.visible=r.halo.visible=vis;if(!vis)return;
  const k=clamp(r.t/.3,0,1);camera.getWorldPosition(_cam);const L=r.a.distanceTo(r.b);
  for(const[m,w]of[[r.coeur,.018],[r.halo,.07]]){const pos=m.geometry.attributes.position;
    for(let i=0;i<=N;i++){const f=i/N;_p.lerpVectors(r.a,r.b,f);
      if(i>0&&i<N){const amp=Math.sin(f*Math.PI)*Math.min(.45,.08+L*.03);_p.x+=(Math.random()-.5)*amp;_p.y+=(Math.random()-.5)*amp;_p.z+=(Math.random()-.5)*amp}
      _q.subVectors(r.b,r.a).normalize();_s.subVectors(_p,_cam).cross(_q).normalize().multiplyScalar(w*(.5+k*.5));
      pos.setXYZ(i*2,_p.x+_s.x,_p.y+_s.y,_p.z+_s.z);pos.setXYZ(i*2+1,_p.x-_s.x,_p.y-_s.y,_p.z-_s.z)}
    pos.needsUpdate=true;m.material.opacity=k}
}
function lancerArc(a,b){const r=arcs.find(r=>r.t<=0)||arcs[0];r.a.copy(a);r.b.copy(b);r.t=.3}

/* ---------- La Coupure ---------- */
let recharge=0,rechargeMax=1;
function couper(){
  if(state!=='play'||!coupureDispo())return;
  if(handLocked()){toast('Ta main ne répond plus.');return}
  if(recharge>0)return;
  const c=viser();gesteCoupure();
  if(!c){arcSound(.25);recharge=rechargeMax=.5;return}
  if(c.dist>val('portee')){arcSound(.25);toast(`Trop loin : la Coupure porte à ${val('portee')} m.`);recharge=rechargeMax=.5;return}
  recharge=rechargeMax=val('recharge');arcSound(1);
  frapper(c,boutDesDoigts(new V3()),val('arc'),new Set());
}
on('couper',couper);
function frapper(c,depuis,rebonds,deja){
  deja.add(c.o);lancerArc(depuis,_v.set(c.x,c.y,c.z));
  setTimeout(()=>{if(state!=='play'&&state!=='caught')return;appliquer(c);
    if(rebonds>0){const n=voisin(c,deja);if(n){arcSound(.6);frapper(n,new V3(c.x,c.y,c.z),rebonds-1,deja)}}},110);
}
function voisin(c,deja){let b=null,bd=7;for(const o of cibles(zone())){if(deja.has(o.o))continue;const d=Math.hypot(o.x-c.x,o.z-c.z);if(d<bd&&los(c.x,c.z,o.x,o.z)){b=o;bd=d}}return b}
function appliquer(c){
  const Z=zone();burst(_v.set(c.x,c.y,c.z),45);
  if(c.k==='drone'){killDrone(c.o);return}
  if(c.k==='camera'){detruireCamera(c.o);return}
  const g=c.o;if(g.neutre)return;
  const discret=g.s<.25&&g.etat!=='enquete'&&g.etat!=='fouille';
  // il tombe à l'opposé d'Ash
  const sens=Math.sin(g.yaw)*(g.pos.x-P.pos.x)+Math.cos(g.yaw)*(g.pos.z-P.pos.z)>0?1:-1;
  neutraliser(g,sens);bruitDeChute(Z,g,val('discretion'));
  S.neutres.push({k:Z.id+':'+g.num,x:+g.pos.x.toFixed(2),z:+g.pos.z.toFixed(2),yaw:+g.yaw.toFixed(3),sens});
  gagner(discret?45:30,discret?'Gardien neutralisé sans être vu':'Gardien neutralisé');emit('save');
}
on('gardienAuSol',()=>chuteArmure());
// Remet chaque Gardien de la zone dans l'état de la partie : à terre s'il a été neutralisé, debout sinon (nouvelle partie).
function appliquerNeutres(z){
  for(const d of z.tousGardiens||[]){const e=S.neutres.find(n=>n.k===z.id+':'+d.num);
    if(e&&!d.neutre){d.pos.set(e.x,0,e.z);d.yaw=e.yaw;neutraliser(d,e.sens,true)}
    else if(!e&&d.neutre){relever(d);remettre(d)}}
}

on('apresCapture',()=>{const z=zone();if(z)appliquerNeutres(z)});
on('partieAppliquee',()=>{const z=zone();if(z)appliquerNeutres(z)});

/* ---------- Affichage : viseur, écho, jauges ---------- */
const echos=[];
function marque(i){while(echos.length<=i){const e=document.createElement('i');$('echos').appendChild(e);echos.push(e)}return echos[i]}
const proj=(x,y,z)=>{_p.set(x,y,z).project(camera);return _p.z<1&&Math.abs(_p.x)<1.2&&Math.abs(_p.y)<1.2?[(_p.x+1)/2*innerWidth,(1-_p.y)/2*innerHeight]:null};
export function majHud(){
  const n=niveau(),a=seuilNiveau(n),b=seuilNiveau(n+1),pts=pointsDispo();
  $('xpNiv').textContent=n;$('xpBar').style.width=((S.xp-a)/(b-a)*100).toFixed(1)+'%';
  $('xpPts').textContent=pts>0?`+${pts}`:'';$('xpPts').title=pts>0?`${pts} point${pts>1?'s':''} de pouvoir à dépenser`:'';$('pvBadge').textContent=pts>0?pts:'';$('pvBadge').hidden=pts<1;
}
on('hudRafraichi',majHud);
let vuDispo=false;
export function updatePouvoirs(dt){
  const Z=zone();if(!Z)return;
  for(const r of arcs)dessinerArc(r,dt);
  const jeu=state==='play',dispo=coupureDispo();
  document.body.classList.toggle('coupure',dispo&&jeu);
  if(!jeu){$('cible').hidden=true;for(const e of echos)e.hidden=true;return}
  if(etape()>S.xpChap){const k=etape()-S.xpChap;S.xpChap=etape();gagner(100*k,k>1?'chapitres terminés':'chapitre terminé')}
  if(dispo&&!S.coupureVue){S.coupureVue=true;setTimeout(()=>toast(MOBILE?'Coupure : vise un Gardien, puis touche Couper. Il tombe raide.':'Coupure : vise un Gardien, puis R ou clic droit. Il tombe raide.'),4200)}
  if(!dispo){$('cible').hidden=true;for(const e of echos)e.hidden=true;return}
  recharge=Math.max(0,recharge-dt);const kr=1-recharge/rechargeMax;
  $('coupeBar').style.width=(kr*100).toFixed(1)+'%';document.body.classList.toggle('coupePrete',recharge<=0);$('tCoupe').style.setProperty('--k',kr.toFixed(3));
  // viseur : un cadre sur la cible, cyan si la Coupure peut partir
  const c=viser(),el=$('cible');let pos=c&&proj(c.x,c.y,c.z);
  if(pos){const t=clamp(900/Math.max(c.dist,1),26,90),ok=c.dist<=val('portee');el.hidden=false;el.style.transform=`translate(${pos[0]-t/2}px,${pos[1]-t/2}px)`;el.style.width=el.style.height=t+'px';
    el.classList.toggle('pret',ok&&recharge<=0);el.classList.toggle('loin',!ok);$('cibleTxt').textContent=ok?(recharge<=0?'Couper':'…'):`${Math.round(c.dist)} m`}
  else el.hidden=true;
  // écho : les signaux Helix à portée, même derrière les murs
  const r=val('echo');let i=0;
  if(r>0)for(const o of cibles(Z)){if(Math.hypot(o.x-P.pos.x,o.z-P.pos.z)>r)continue;const q=proj(o.x,o.y,o.z);if(!q)continue;const e=marque(i++);e.hidden=false;
    e.style.transform=`translate(${q[0]}px,${q[1]}px) rotate(45deg)`;e.className=o.s>.5?'alerte':o.s>.1?'doute':''}
  for(;i<echos.length;i++)echos[i].hidden=true;
}

/* ---------- L'écran « Pouvoirs » ---------- */
function remplir(){
  const n=niveau(),pts=pointsDispo();
  $('pvNiv').textContent=`Niveau ${n} · ${S.xp} XP · prochain point dans ${seuilNiveau(n+1)-S.xp} XP`;
  $('pvPts').textContent=pts>0?`${pts} point${pts>1?'s':''} à dépenser`:'Aucun point à dépenser';
  $('pvIntro').textContent=coupureDispo()?"Ta main K7 a lu la puce : elle renvoie à Helix ses propres codes de coupure. Vise un Gardien, un drone ou une caméra.":"Ta main K7 garde un secret que tu découvriras bientôt. Les points gagnés t'attendent.";
  $('pvArch').textContent=`Archives Helix trouvées : ${S.archives.length} / ${NB_ARCHIVES} · Gardiens neutralisés : ${S.neutres.length}`;
  $('pvListe').innerHTML='';
  for(const a of AMELIS){const r=rang(a.id),max=a.val.length-1;
    const li=document.createElement('div');li.className='pvRang';
    li.innerHTML=`<div><b>${a.nom}</b><span class="pips">${'<i class="on"></i>'.repeat(r)}${'<i></i>'.repeat(max-r)}</span></div><p>${a.desc}</p><p class="effet">${a.effet(a.val[r])}${r<max?` <span>→ ${a.effet(a.val[r+1])}</span>`:''}</p>`;
    const b=document.createElement('button');b.className='go alt';b.textContent=r>=max?'Au maximum':'Améliorer';b.disabled=r>=max||pts<1;
    b.onclick=()=>{if(ameliorer(a.id))remplir()};li.appendChild(b);$('pvListe').appendChild(li)}
}
export function ouvrirPouvoirs(){if(state==='play')emit('pause');if(state!=='paused')return;remplir();ouvrirEcran('pouvoirs','pauseMenu');($('pvListe').querySelector('button:not(:disabled)')||$('pvRetour')).focus()}
on('ouvrirPouvoirs',ouvrirPouvoirs);
$('pvRetour').onclick=()=>fermerEcran('pouvoirs');
$('pausePouvoirs').onclick=ouvrirPouvoirs;

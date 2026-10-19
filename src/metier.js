// Énigme du chapitre 4 : le grand métier Jacquard de Varga. On pose des cartes perforées dans l'ordre, puis on tisse.
// Un trou dans la carte laisse passer l'aiguille : le fil d'or se lève. Mais le métier lit les cartes de dos,
// donc chaque rang du tissu est la carte vue en miroir. Les cartes pièges donnent la clé… à l'envers.
import {$,state,setState,emit,on,MOBILE} from './core.js';
import {tone,clac} from './son.js';
import {toast} from './interface.js';

// La clé à obtenir, telle qu'elle doit apparaître sur le tissu (1 = fil d'or)
export const CIBLE=['01100000','10011111','10010101','01100100'];
const miroir=s=>[...s].reverse().join('');
// Le tiroir : les quatre bonnes cartes (le motif retourné) et quatre pièges (le motif tel quel)
export const CARTES=[
  {id:'A',trous:'10011111'},{id:'B',trous:'00100110'},{id:'C',trous:'01100000'},{id:'D',trous:'11111001'},
  {id:'E',trous:'10010101'},{id:'F',trous:'00000110'},{id:'G',trous:'01100100'},{id:'H',trous:'10101001'},
];
let poses=[],ouvert=false,tissage=null;

function grille(el,rangs,classe){el.innerHTML='';el.style.setProperty('--n',CIBLE[0].length);
  for(const r of rangs)for(const c of r){const i=document.createElement('i');if(c==='1')i.className=classe;el.appendChild(i)}}
function bande(c){return`<b>${c.id}</b><span class="trous">${[...c.trous].map(t=>`<i class="${t==='1'?'trou':''}"></i>`).join('')}</span>`}
function afficher(){
  grille($('metierCible'),CIBLE,'or');
  const sl=$('metierSlots');sl.innerHTML='';
  for(let i=0;i<CIBLE.length;i++){const b=document.createElement('button');b.className='carte'+(poses[i]?'':' vide');b.type='button';
    b.innerHTML=poses[i]?bande(poses[i]):`<b>${i+1}</b><span class="trous">${'<i></i>'.repeat(8)}</span>`;
    b.setAttribute('aria-label',poses[i]?`Rang ${i+1} : carte ${poses[i].id}, retirer`:`Rang ${i+1} : vide`);
    b.onclick=()=>retirer(i);sl.appendChild(b)}
  const cs=$('metierCartes');cs.innerHTML='';
  for(const c of CARTES){const b=document.createElement('button');b.className='carte';b.type='button';b.innerHTML=bande(c);b.disabled=poses.includes(c);
    b.setAttribute('aria-label',`Carte ${c.id}, poser`);b.onclick=()=>poser(c.id);cs.appendChild(b)}
  $('metierTisser').disabled=poses.filter(Boolean).length<CIBLE.length||!!tissage;
}
export function ouvrirMetier(){
  if(ouvert)return;ouvert=true;poses=[];tissage=null;setState('puzzle');document.body.classList.add('puzzle');
  if(document.pointerLockElement)document.exitPointerLock();
  grille($('metierTissu'),CIBLE.map(r=>'0'.repeat(r.length)),'');$('metierMsg').textContent='';afficher();$('metier').hidden=false;
  tone(300,.15,'triangle',.03);
}
export function fermerMetier(){
  if(!ouvert)return;ouvert=false;clearInterval(tissage);tissage=null;$('metier').hidden=true;document.body.classList.remove('puzzle');
  if(state==='puzzle'){setState('play');if(!document.pointerLockElement&&!MOBILE)toast('Clique dans la scène pour reprendre la visée')}
}
// Pose une carte (par sa lettre) dans le premier rang libre.
export function poser(id){if(tissage)return;const c=CARTES.find(c=>c.id===id),i=[0,1,2,3].find(i=>!poses[i]);if(!c||poses.includes(c)||i===undefined)return;poses[i]=c;clac();$('metierMsg').textContent='';afficher()}
export function retirer(i){if(tissage||!poses[i])return;poses[i]=null;tone(420,.05,'triangle',.02);afficher()}
// Tisse rang par rang (le métier lit chaque carte de dos), puis compare au motif.
export function tisser(){
  if(tissage||poses.filter(Boolean).length<CIBLE.length)return;
  const rangs=poses.map(c=>miroir(c.trous)),el=$('metierTissu');let k=0;
  grille(el,CIBLE.map(r=>'0'.repeat(r.length)),'');$('metierMsg').textContent='Le métier claque, la navette file…';afficher();
  tissage=setInterval(()=>{
    const cells=el.children,n=CIBLE[0].length;for(let j=0;j<n;j++)cells[k*n+j].className=rangs[k][j]==='1'?'or':'';
    clac();tone(140,.08,'square',.02);k++;
    if(k<rangs.length)return;
    clearInterval(tissage);tissage=null;
    if(rangs.join()===CIBLE.join()){$('metierMsg').textContent="Une clé d'or sur la soie rouge, nette, à l'endroit. Tu coupes le ruban.";tone(660,.3,'triangle',.04,990);
      setTimeout(()=>{fermerMetier();emit('metierReussi')},1600)}
    else if(rangs.join()===CIBLE.map(miroir).join())$('metierMsg').textContent="C'est bien une clé… mais tournée à l'envers. Varga l'a dit : le métier lit les cartes de dos.";
    else $('metierMsg').textContent="Ce n'est pas le motif du carnet. Compare le tissu rang par rang.";
    afficher();
  },MOBILE?260:220);
}
$('metierTisser').onclick=tisser;$('metierQuitter').onclick=fermerMetier;
addEventListener('keydown',e=>{if(state!=='puzzle'||e.repeat)return;if(e.code==='Escape')fermerMetier();
  const m=e.code.match(/^Key([A-H])$/);if(m)poser(m[1]);if(e.code==='Backspace'){const i=[3,2,1,0].find(i=>poses[i]);if(i!==undefined)retirer(i)}});
on('fermerMetier',fermerMetier);

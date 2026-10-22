// La Faucheuse : l'appareil de combat d'Helix. Elle tourne au-dessus de la zone et balaie le sol avec son projecteur.
// Rester dans le cercle de lumière à découvert (pas sous un auvent, une citerne, un abri) : son projecteur s'accroche à toi
// et sa mitrailleuse tire par rafales (combat.js) tant que tu restes dans la lumière.
import {THREE,V3,P,G,T,DIFF,clamp,emit,on} from './core.js';
import {add,glow,shaftMat,M} from './construire.js';
import {zone} from './zones.js';

const metal=new THREE.MeshStandardMaterial({color:0x15181e,roughness:.35,metalness:.85,envMapIntensity:1.2});
const metal2=new THREE.MeshStandardMaterial({color:0x2a2f37,roughness:.5,metalness:.7,envMapIntensity:1});
export function couvert(z,p){for(const c of z.couverts)if(p.x>c.x0&&p.x<c.x1&&p.z>c.z0&&p.z<c.z1)return true;return false}
// o : {cx,cz,rx,rz,h,v (vitesse angulaire),R (rayon du cercle de détection)}
export function makeFaucheuse(z,o){
  const g=new THREE.Group();add(g);
  const B=(w,h,d,m,x,y,zz)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,zz);g.add(b);return b};
  const corps=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),metal);corps.scale.set(1.05,.7,3.4);g.add(corps);
  B(1.3,.5,2.6,metal2,0,-.55,.4);B(.5,.4,3.2,metal,0,.15,-3.6);B(.08,1.1,1.1,metal,0,.8,-4.6);
  const vitre=new THREE.Mesh(new THREE.SphereGeometry(.62,18,12,0,Math.PI*2,0,Math.PI*.42),glow(0x58e6ff,.9));vitre.scale.set(1.1,.6,1.8);vitre.position.set(0,.35,2.1);g.add(vitre);
  const rotors=[];
  for(const sx of[-1,1]){
    B(1.6,.18,.6,metal,sx*1.5,0,.2);
    const anneau=new THREE.Mesh(new THREE.TorusGeometry(1.05,.16,10,32),metal2);anneau.rotation.x=Math.PI/2;anneau.position.set(sx*2.75,0,.2);g.add(anneau);
    const pale=new THREE.Mesh(new THREE.BoxGeometry(1.9,.04,.22),metal);pale.position.set(sx*2.75,0,.2);g.add(pale);rotors.push(pale);
    const reac=new THREE.Mesh(new THREE.CircleGeometry(.95,24),glow(0xff7a2a,.7));reac.rotation.x=Math.PI/2;reac.position.set(sx*2.75,-.12,.2);g.add(reac);
    const nav=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),glow(sx<0?0xff2020:0x20ff60,3));nav.position.set(sx*3.85,0,.2);g.add(nav);
  }
  const bal=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),glow(0xff2020,3));bal.position.set(0,.95,-4.6);g.add(bal);
  // Feux de position le long de la coque, et l'œil du projecteur sous le ventre : on la voit arriver dans le noir.
  for(const sx of[-1,1]){const b=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,4.2),glow(0x9fd8ff,2.2));b.position.set(sx*1.02,-.05,-.2);g.add(b)}
  const oeil=new THREE.Mesh(new THREE.SphereGeometry(.28,16,10),glow(0xeaf4ff,4));oeil.position.set(0,-.72,.6);g.add(oeil);
  // Projecteur : vraie lumière et faisceau visible
  const light=new THREE.SpotLight(0xd8e8ff,o.lum??7,90,o.angle??.15,.35,1.2);g.add(light);add(light.target);
  const cone=new THREE.Mesh(new THREE.CylinderGeometry(.35,1,1,28,1,true),shaftMat(0xcfe2ff,.3));cone.geometry.translate(0,-.5,0);cone.material.uniforms.opacity.value=.3;add(cone);
  const f={g,light,cone,rotors,bal,cx:o.cx,cz:o.cz,rx:o.rx,rz:o.rz,h:o.h,hCur:o.h,v:o.v??.09,R:o.R??3.4,t:o.t0??0,cible:new V3(o.cx,0,o.cz),s:0,verrou:0,actif:true};
  z.faucheuses.push(f);poser(f,0);return f;
}
const _p=new V3(),_d=new V3(),_up=new V3(0,1,0);
function poser(f,dt){
  const a=f.t,x=f.cx+Math.cos(a)*f.rx,zz=f.cz+Math.sin(a)*f.rz;
  f.g.position.set(x,f.hCur+Math.sin(T*.7)*.4,zz);
  const tx=-Math.sin(a)*f.rx,tz=Math.cos(a)*f.rz;f.g.rotation.set(0,Math.atan2(tx,tz),Math.sin(T*.5)*.05-.08);
  // Le projecteur balaie autour de la verticale, ou s'accroche au joueur repéré.
  const bx=x+Math.sin(T*.61)*7,bz=zz+Math.cos(T*.47)*7;
  if(f.verrou>0)f.cible.lerp(_p.set(P.pos.x,0,P.pos.z),Math.min(1,dt*3));else f.cible.lerp(_p.set(bx,0,bz),Math.min(1,dt*1.5));
  f.light.position.set(0,-.7,.6);f.light.target.position.copy(f.cible);
  const src=f.g.localToWorld(_d.set(0,-.7,.6)),dir=_p.copy(f.cible).sub(src),L=dir.length();
  f.cone.position.copy(src);f.cone.scale.set(f.R*1.0,L,f.R*1.0);f.cone.quaternion.setFromUnitVectors(_up,dir.normalize().negate());
  f.cone.scale.x=f.cone.scale.z=Math.max(.6,Math.tan(f.light.angle)*L*.95);
}
export function resetFaucheuses(z){for(const f of z.faucheuses){f.s=0;f.verrou=0;f.combat=false;f.balles=0}}
on('apresCapture',()=>{const z=zone();if(z&&z.faucheuses)resetFaucheuses(z)});
// Renvoie le niveau de détection (0..1).
export function updateFaucheuses(dt,active,z){
  let maxS=0;
  for(const f of z.faucheuses){
    f.t+=dt*f.v;for(const r of f.rotors)r.rotation.y+=dt*30;f.bal.visible=Math.sin(T*4)>0;
    poser(f,dt);
    if(active&&f.actif){
      const dans=Math.hypot(P.pos.x-f.cible.x,P.pos.z-f.cible.z)<f.R&&!couvert(z,P.pos)&&G.grace<=0,D=DIFF.faucheuse;
      if(dans){f.s+=dt*1.6;f.verrou=1.2}else{f.s=Math.max(0,f.s-dt*.35);f.verrou=Math.max(0,f.verrou-dt)}
      if(f.s>=1){f.s=1;if(!f.combat){f.combat=true;f.tir=D.reaction;f.balles=0;emit('engagement',f)}}
      // une rafale tant que tu restes dans la lumière ; à couvert, elle te perd au bout d'un moment
      if(f.combat){if(dans){f.tir-=dt;if(f.tir<=0&&!(f.balles>0)){f.tir=D.cadence;f.balles=D.balles;f.entre=0}}else if(f.verrou<=0)f.combat=false}
      if(f.balles>0){f.entre-=dt;if(f.entre<=0){f.balles--;f.entre=D.entre;emit('tirFaucheuse',f,dans)}}
    }
    f.light.color.setHex(f.s>.3?0xff6050:0xd8e8ff);
    maxS=Math.max(maxS,f.s);
  }
  return maxS;
}

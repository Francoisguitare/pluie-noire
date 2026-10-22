// Collisions et lignes de vue, en 2D sur le plan XZ : des rectangles par zone.
import {clamp} from './core.js';
import {zone} from './zones.js';

export function collide(p,r){
  const cs=zone().colliders;
  for(let pass=0;pass<2;pass++)for(const c of cs){
    if(c.off)continue;
    const cx=clamp(p.x,c.x0,c.x1),cz=clamp(p.z,c.z0,c.z1);let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;
    if(d2>=r*r)continue;
    if(d2>1e-9){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d)}
    else{const o=[[c.x0-r-p.x,0],[c.x1+r-p.x,0],[0,c.z0-r-p.z],[0,c.z1+r-p.z]].sort((a,b)=>Math.abs(a[0]+a[1])-Math.abs(b[0]+b[1]))[0];p.x+=o[0];p.z+=o[1]}
  }
}
export function segHits(ax,az,bx,bz,c){
  let t0=0,t1=1;const dx=bx-ax,dz=bz-az;
  for(const[a,d,mn,mx]of[[ax,dx,c.x0,c.x1],[az,dz,c.z0,c.z1]]){
    if(Math.abs(d)<1e-9){if(a<mn||a>mx)return false}
    else{let ta=(mn-a)/d,tb=(mx-a)/d;if(ta>tb){const t=ta;ta=tb;tb=t}t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return false}
  }return true;
}
export function los(ax,az,bx,bz){for(const c of zone().colliders){if(c.off||!c.los)continue;if(segHits(ax,az,bx,bz,c))return false}return true}
// Un obstacle bas (caisse, comptoir, muret : il ne cache pas la vue debout) entre a et b, à moins de r de b.
// Accroupi derrière, on n'est plus vu par un Gardien ; debout, on est plus dur à toucher.
export function couvertBas(ax,az,bx,bz,r=1.7){
  for(const c of zone().colliders){
    if(c.off||c.los||c.pnj||c.x1-c.x0<.5||c.z1-c.z0<.5)continue;
    const cx=clamp(bx,c.x0,c.x1),cz=clamp(bz,c.z0,c.z1);if((bx-cx)**2+(bz-cz)**2>r*r)continue;
    if(segHits(ax,az,bx,bz,c))return true;
  }return false;
}

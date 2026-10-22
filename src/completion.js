// Le pourcentage de la partie (« Partie terminée à X % »). Chaque catégorie compte pour un poids ; les modules inscrivent
// les leurs avec categorie() : l'histoire (partie.js), les archives, les dossiers, les lieux, les rencontres et les quêtes
// (exploration.js), les pouvoirs (pouvoirs.js)… 100 % : toute l'histoire, tout trouvé, tout le monde rencontré, toutes les
// quêtes faites et tous les pouvoirs au maximum. Affiché dans l'écran « Dossiers », en pause et à la fin.
export const CATEGORIES=[];
// c : {id, nom, poids, fait() → nombre fait, total() → nombre à faire}
export const categorie=c=>{CATEGORIES.push(c);return c};
export function completion(){
  let p=0,w=0;const det=[];
  for(const c of CATEGORIES){const t=c.total();if(!t)continue;const f=Math.min(t,c.fait());p+=c.poids*f/t;w+=c.poids;det.push({id:c.id,nom:c.nom,fait:f,total:t})}
  return{pct:w?Math.floor(p/w*100+1e-9):0,det};
}
export const texteCompletion=()=>`Partie terminée à ${completion().pct} %`;

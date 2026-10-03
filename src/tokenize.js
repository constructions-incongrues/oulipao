// Découpage en mots partagé par tous les étiqueteurs, la page et la comparaison.
// Un mot = une suite de lettres ; chiffres et ponctuation ne sont pas des mots.
// ponytail: règles minimales (élisions, clitiques après trait d'union). Les mots composés
// (« peut-être », « porte-monnaie ») restent un seul mot ; à affiner si la mesure le montre.

const SUITE = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;
const ELISION = /^(?:l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu|quoiqu)['’]/iu;
const CLITIQUE = /-(?:t-)?(je|tu|il|elle|on|nous|vous|ils|elles|ce|moi|toi|le|la|les|lui|leur|y|en)$/iu;

/** @returns {{mot: string, debut: number, fin: number}[]} */
export function tokenize(texte) {
  const mots = [];
  for (const m of texte.matchAll(SUITE)) {
    let debut = m.index;
    let reste = m[0];
    let e;
    while ((e = reste.match(ELISION))) {
      mots.push({ mot: e[0], debut, fin: debut + e[0].length });
      debut += e[0].length;
      reste = reste.slice(e[0].length);
    }
    // « dit-il », « a-t-elle », « donne-le-moi » : les clitiques sont des mots à part.
    const queue = [];
    let c;
    while ((c = reste.match(CLITIQUE))) {
      const finReste = debut + reste.length;
      queue.unshift({ mot: c[1], debut: finReste - c[1].length, fin: finReste });
      reste = reste.slice(0, c.index);
    }
    if (reste) mots.push({ mot: reste, debut, fin: debut + reste.length });
    mots.push(...queue);
  }
  return mots;
}

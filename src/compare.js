// Compare la sortie d'un étiqueteur à une référence annotée (reference/FORMAT.md).
// `estAmbigu(mot)` est facultatif : fourni par un lexique, il permet de compter les mots
// dont la forme admet plusieurs catégories.

export function comparer(sortie, reference, { estAmbigu } = {}) {
  const attendus = reference.mots;
  if (sortie.length !== attendus.length) {
    throw new Error(`${sortie.length} mots étiquetés, ${attendus.length} dans la référence`);
  }
  const erreurs = [];
  let contenuTotal = 0;
  let contenuCorrects = 0;
  let ambigus = estAmbigu ? 0 : null;
  attendus.forEach((a, i) => {
    const s = sortie[i];
    if (s.mot !== a.mot) throw new Error(`mot ${i} : « ${s.mot} » ≠ « ${a.mot} »`);
    const juste = s.categorie === a.categorie;
    if (!juste) erreurs.push({ index: i, mot: a.mot, attendu: a.categorie, obtenu: s.categorie });
    // Mots de contenu : tout ce qui n'est pas « autre » dans la référence. Le score global
    // est gonflé par les mots-outils, faciles à classer ; celui-ci ne l'est pas.
    if (a.categorie !== 'autre') {
      contenuTotal++;
      if (juste) contenuCorrects++;
    }
    if (estAmbigu && estAmbigu(a.mot)) ambigus++;
  });
  return {
    total: attendus.length,
    corrects: attendus.length - erreurs.length,
    contenu: { total: contenuTotal, corrects: contenuCorrects },
    ambigus,
    erreurs,
  };
}

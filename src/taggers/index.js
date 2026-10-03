// Registre des étiqueteurs.
// Contrat : un étiqueteur est une fonction (texte) -> [{mot, categorie}] (éventuellement async),
// un élément par mot de tokenize(texte), dans le même ordre, categorie ∈ CATEGORIES.
// Le registre vérifie ce contrat à chaque appel : page et comparaison peuvent s'y fier.
import { CATEGORIES } from '../categories.js';
import { tokenize } from '../tokenize.js';

const etiqueteurs = new Map();

export function enregistrer(nom, fonction) {
  etiqueteurs.set(nom, fonction);
}

export function lister() {
  return [...etiqueteurs.keys()];
}

export async function etiqueter(nom, texte) {
  const fonction = etiqueteurs.get(nom);
  if (!fonction) throw new Error(`Étiqueteur inconnu : ${nom}`);
  const sortie = await fonction(texte);
  const mots = tokenize(texte);
  if (sortie.length !== mots.length) {
    throw new Error(`${nom} : ${sortie.length} mots rendus, ${mots.length} attendus`);
  }
  sortie.forEach((s, i) => {
    if (s.mot !== mots[i].mot) throw new Error(`${nom} : mot ${i} « ${s.mot} » ≠ « ${mots[i].mot} »`);
    if (!CATEGORIES.includes(s.categorie)) throw new Error(`${nom} : catégorie inconnue « ${s.categorie} » pour « ${s.mot} »`);
  });
  return sortie;
}

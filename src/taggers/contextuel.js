// Étiqueteur contextuel : fr-compromise 0.3.1 (MIT, vendor/fr-compromise.mjs), un étiqueteur
// à règles qui tient compte des mots voisins. Tout s'exécute localement.
import nlp from '../../vendor/fr-compromise.mjs';
import { enregistrer } from './index.js';
import { tokenize } from '../tokenize.js';

function categorie(tags) {
  const a = (t) => tags.includes(t);
  // fr-compromise range pronoms et possessifs sous « Noun » : les écarter d'abord.
  if (a('Pronoun') || a('Possessive') || a('Determiner') || a('Preposition') || a('Conjunction') || a('ProperNoun')) return 'autre';
  if (a('Verb') || a('Auxiliary')) return 'verbe';
  if (a('Adjective')) return 'adjectif';
  if (a('Adverb')) return 'adverbe';
  if (a('Noun')) return 'nom';
  return 'autre';
}

export function etiqueterParContexte(texte) {
  // fr-compromise découpe autrement que nous (« l'est » = un terme + un terme implicite,
  // « a-t-elle » = un terme, « là-haut » = deux). On regroupe ses termes par étendue de
  // caractères, puis on y range nos mots : le i-ème mot d'une étendue prend le i-ème terme.
  const groupes = [];
  for (const phrase of nlp(texte).json({ offset: true })) {
    for (const terme of phrase.terms) {
      const { start, length } = terme.offset;
      if (length > 0) groupes.push({ debut: start, fin: start + length, termes: [terme] });
      else groupes.at(-1)?.termes.push(terme);
    }
  }
  let g = 0;
  let rang = 0;
  let dernier = -1;
  return tokenize(texte).map(({ mot, debut }) => {
    while (g < groupes.length - 1 && groupes[g].fin <= debut) g++;
    rang = g === dernier ? rang + 1 : 0;
    dernier = g;
    const groupe = groupes[g];
    if (!groupe || debut < groupe.debut) return { mot, categorie: 'autre' };
    const terme = groupe.termes[Math.min(rang, groupe.termes.length - 1)];
    return { mot, categorie: categorie(terme.tags) };
  });
}

enregistrer('fr-compromise (règles contextuelles)', etiqueterParContexte);

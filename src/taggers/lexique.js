// Étiqueteur par simple consultation du lexique (data/lexique-potao.tsv, dérivé de Grammalecte).
// Aucun contexte : pour une forme ambiguë, il prend la première catégorie dans l'ordre de
// préférence fixé par scripts/construire-lexique.js. C'est le plancher de l'essai.
import { enregistrer } from './index.js';
import { tokenize } from '../tokenize.js';

const CODES = { n: 'nom', v: 'verbe', a: 'adjectif', r: 'adverbe', o: 'autre' };
const URL_LEXIQUE = new URL('../../data/lexique-potao.tsv', import.meta.url);

let lexique;
export async function chargerLexique() {
  if (lexique) return lexique;
  // fetch ne lit pas file:// sous Node : on passe par fs hors navigateur.
  const brut = URL_LEXIQUE.protocol === 'file:'
    ? await (await import('node:fs/promises')).readFile(URL_LEXIQUE, 'utf8')
    : await (await fetch(URL_LEXIQUE)).text();
  lexique = new Map();
  for (const ligne of brut.split('\n')) {
    if (!ligne || ligne[0] === '#') continue;
    const i = ligne.indexOf('\t');
    lexique.set(ligne.slice(0, i), ligne.slice(i + 1));
  }
  return lexique;
}

// Codes possibles d'une forme, ou undefined si elle est inconnue du lexique.
function codes(lex, mot) {
  const m = mot.replaceAll("'", '’'); // le lexique écrit l'apostrophe typographique
  return lex.get(m) ?? lex.get(m.toLowerCase());
}

/** Le mot admet-il plusieurs des cinq catégories ? (pour le décompte des ambiguïtés) */
export async function predicatAmbigu() {
  const lex = await chargerLexique();
  return (mot) => (codes(lex, mot)?.length ?? 0) > 1;
}

export async function etiqueterParLexique(texte) {
  const lex = await chargerLexique();
  return tokenize(texte).map(({ mot }) => {
    const c = codes(lex, mot);
    // Inconnu : une majuscule fait un nom propre (autre) ; sinon la classe ouverte la plus
    // fréquente, le nom.
    const code = c ? c[0] : /^\p{Lu}/u.test(mot) ? 'o' : 'n';
    return { mot, categorie: CODES[code] };
  });
}

enregistrer('lexique (consultation seule)', etiqueterParLexique);

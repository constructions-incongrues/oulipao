import type { MorphologyRepository } from '../ports/morphology.ts';
import type { Category } from './categories.ts';

/**
 * Le dictionnaire connaît-il ce mot dans sa piste ? Sert à distinguer « absent du dictionnaire »
 * de « aucun voisin » quand un filtre laisse un mot tel quel, une fois la recherche de voisin
 * échouée. Seuls les noms et les adjectifs l'exigent : leur voisin se cherche à partir de leur
 * lecture. Un adverbe se place dans l'ordre du dictionnaire sans y figurer (« ne », « jamais ») ;
 * les mots-outils de même. Ils sont donc tenus pour connus.
 */
export function knownForm(word: string, category: Category, morphology: MorphologyRepository): boolean {
  const lower = word.toLowerCase();
  if (category === 'noun') return morphology.nounReadings(lower).length > 0;
  if (category === 'adjective') return morphology.adjectiveReadings(lower).length > 0;
  return true;
}

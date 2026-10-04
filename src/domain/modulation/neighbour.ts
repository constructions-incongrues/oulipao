import type { Category } from '../categories.ts';

/** Une fin de phrase dans le blanc qui précède un mot. */
const SENTENCE_END = /[.!?…]/;

/**
 * Le voisin du k-ième mot : le plus proche de la piste voulue, avant ou après lui, sans passer une
 * fin de phrase. `gaps[k]` est le texte entre le mot k − 1 et le mot k.
 */
export function neighbourOf(k: number, track: Category, side: 'before' | 'after', categories: readonly Category[], gaps: readonly string[]): number | undefined {
  if (side === 'after') {
    for (let j = k + 1; j < categories.length; j++) {
      if (SENTENCE_END.test(gaps[j]!)) return undefined;
      if (categories[j] === track) return j;
    }
    return undefined;
  }
  for (let j = k - 1; j >= 0; j--) {
    if (SENTENCE_END.test(gaps[j + 1]!)) return undefined;
    if (categories[j] === track) return j;
  }
  return undefined;
}

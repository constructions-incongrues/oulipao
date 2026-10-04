import type { Category } from '../categories.ts';
import type { Source } from './schema.ts';

/** Le nombre de syllabes d'un mot ; absent tant que les prononciations ne sont pas là. */
export type SyllableCounter = (word: string, category: Category) => number | undefined;

/** Les lettres sans accent, en minuscules : « Élève » → « eleve ». */
const bare = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const VOWELS = new Set([...'aeiouyœæ']);

/** Une source de mot lue sur un mot : lettres, syllabes, voyelles ou occurrences d'une lettre. */
export function wordValue(source: Source, word: string, category: Category, syllables?: SyllableCounter): number | undefined {
  switch (source.kind) {
    case 'letters':
      // Les lettres seules : ni apostrophe ni trait d'union (« porte-clés » en a 9).
      return [...word.matchAll(/\p{L}/gu)].length;
    case 'vowels':
      return [...bare(word)].filter((char) => VOWELS.has(char)).length;
    case 'letter': {
      const wanted = bare(source.letter);
      return [...bare(word)].filter((char) => char === wanted).length;
    }
    case 'syllables':
      return syllables?.(word, category);
    default:
      throw new Error(`${source.kind} n’est pas une source de mot`);
  }
}

/**
 * Une source de position, pour le i-ième des `count` mots traités : son rang, le motif répété, ou
 * la rampe arrondie. La ligne se lit ailleurs, sur le texte.
 */
export function positionValue(source: Source, i: number, count: number): number {
  switch (source.kind) {
    case 'rank':
      return i + 1;
    case 'pattern':
      return source.values[i % source.values.length]!;
    case 'ramp':
      return count > 1 ? Math.round(source.from + ((source.to - source.from) * i) / (count - 1)) : source.from;
    default:
      throw new Error(`${source.kind} n’est pas une source de position`);
  }
}

/** Le numéro de ligne de chaque mot, à partir de 1 : les sauts de ligne se lisent dans les blancs qui précèdent les mots. */
export function lineNumbers(gaps: readonly string[]): number[] {
  let line = 1;
  return gaps.map((gap) => (line += [...gap.matchAll(/\n/g)].length));
}

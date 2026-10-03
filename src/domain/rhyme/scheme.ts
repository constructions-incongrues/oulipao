import { z } from 'zod';
import type { Category } from '../categories.ts';
import type { GenderSetting, RhymeGender } from '../phonetics/rhyme.ts';

/** Les schémas de rimes nommés. */
export const SchemeSchema = z.enum(['plates', 'croisees', 'embrassees', 'etreinte', 'bisexuelle']);
export type Scheme = z.infer<typeof SchemeSchema>;

export const SCHEME_LABELS: Record<Scheme, string> = {
  plates: 'rimes plates (AABB)',
  croisees: 'rimes croisées (ABAB)',
  embrassees: 'rimes embrassées (ABBA)',
  etreinte: 'étreinte (ABC…CBA)',
  bisexuelle: 'rime bisexuelle (AAA)',
};

/** Le motif de chaque schéma de longueur fixe, en rangs de lettre (0 = A). */
const PATTERNS: Record<Exclude<Scheme, 'etreinte'>, readonly number[]> = {
  plates: [0, 0, 1, 1],
  croisees: [0, 1, 0, 1],
  embrassees: [0, 1, 1, 0],
  bisexuelle: [0, 0, 0],
};

const letter = (rank: number) => String.fromCharCode(65 + (rank % 26));

/**
 * La lettre de chaque vers d'une strophe. Un schéma de longueur fixe se répète avec des lettres
 * nouvelles (six vers croisés : ABAB CD) ; l'étreinte se lit en miroir sur toute la strophe
 * (ABCCBA), et le vers du milieu d'une strophe impaire est libre (`null`).
 */
export function lettersFor(scheme: Scheme, stanzaLength: number): (string | null)[] {
  if (scheme === 'etreinte') {
    const half = Math.floor(stanzaLength / 2);
    return Array.from({ length: stanzaLength }, (_, k) => (k < half ? letter(k) : k >= stanzaLength - half ? letter(stanzaLength - 1 - k) : null));
  }
  const pattern = PATTERNS[scheme];
  const width = Math.max(...pattern) + 1;
  return Array.from({ length: stanzaLength }, (_, k) => letter(Math.floor(k / pattern.length) * width + pattern[k % pattern.length]!));
}

/**
 * Le genre voulu pour le k-ième vers d'une strophe (compté depuis 0) : en alterné, celui du premier
 * vers sur les rangs pairs, l'autre sur les rangs impairs ; sinon le réglage tel quel.
 */
export function wantedGender(setting: GenderSetting, position: number, first: RhymeGender): Exclude<GenderSetting, 'alternate'> {
  if (setting !== 'alternate') return setting;
  return position % 2 === 0 ? first : first === 'masculine' ? 'feminine' : 'masculine';
}

/** Un mot de la sortie d'une chaîne, à sa place d'origine. */
export interface LaidWord {
  gap: string;
  output: string;
  category: Category;
}

const FULL_WORDS: ReadonlySet<Category> = new Set(['noun', 'adjective', 'verb', 'adverb']);

/**
 * La lettre de chaque fin de vers d'une sortie, un élément par mot (`undefined` hors des fins de
 * vers et pour un vers libre). Les vers et les strophes se lisent dans les blancs, comme
 * `layoutVerse`, mais mot d'origine par mot d'origine : un mot retiré ne finit aucun vers.
 */
export function schemeLetters(words: readonly LaidWord[], scheme: Scheme): (string | undefined)[] {
  const ends: number[][] = [[]];
  let lineEnd: number | undefined;
  const close = (stanza: boolean) => {
    if (lineEnd !== undefined) ends.at(-1)!.push(lineEnd);
    lineEnd = undefined;
    if (stanza && ends.at(-1)!.length) ends.push([]);
  };
  words.forEach((word, index) => {
    if (index && /\n[^\S\n]*\n/.test(word.gap)) close(true);
    else if (index && word.gap.includes('\n')) close(false);
    if (word.output && FULL_WORDS.has(word.category)) lineEnd = index;
  });
  close(false);
  const letters: (string | undefined)[] = words.map(() => undefined);
  for (const stanza of ends) lettersFor(scheme, stanza.length).forEach((letter, k) => (letters[stanza[k]!] = letter ?? undefined));
  return letters;
}

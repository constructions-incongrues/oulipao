import { z } from 'zod';
import { CATEGORIES, CategorySchema, type Category } from './categories.ts';
import type { OutputWord } from './s7/types.ts';
import type { TaggedWord } from './tagged-word.ts';
import { tokenize } from './tokenizer.ts';

/** L'état d'une piste : muette, ou en solo. */
export const TrackStateSchema = z.object({ muted: z.boolean(), solo: z.boolean() });
export type TrackState = z.infer<typeof TrackStateSchema>;

/** Une piste par catégorie de mots ; « other » est la piste des mots-outils. */
export const TracksSchema = z.record(CategorySchema, TrackStateSchema);
export type Tracks = z.infer<typeof TracksSchema>;

/** Pistes qu'on entend : sans solo, toutes les pistes non muettes ; sinon les seules pistes en solo. */
export function audibleCategories(tracks: Tracks): Set<Category> {
  const soloed = CATEGORIES.filter((category) => tracks[category].solo);
  return new Set(soloed.length ? soloed : CATEGORIES.filter((category) => !tracks[category].muted));
}

/** Les mots d'un texte tel quel, sous la forme que rend le moteur : sert quand aucun plugin n'agit. */
export function plainWords(text: string): { words: OutputWord[]; tail: string } {
  const tokens = tokenize(text);
  const words = tokens.map((token, index) => ({
    index,
    output: token.word,
    gap: text.slice(index === 0 ? 0 : tokens[index - 1]!.end, token.start),
  }));
  return { words, tail: tokens.length ? text.slice(tokens.at(-1)!.end) : text };
}

/** Un morceau du texte résultant : un mot (avec sa position dans le texte d'origine) ou ce qui les sépare. */
export interface MixedSegment {
  text: string;
  index?: number;
  /** Le morceau appartient à un refrain : il recopie le vers de ce numéro (compté depuis 1). */
  copyOf?: number;
}

// Bornes d'un mot pendant le nettoyage : caractères d'usage privé, absents d'un texte réel.
const OPEN = '';
const MIDDLE = '';
const CLOSE = '';

/**
 * Le texte résultant, en morceaux : les mots des pistes inaudibles disparaissent, le texte se
 * resserre, la ponctuation reste. La règle s'applique telle quelle, sans réparer la phrase
 * (« la horloge »). Chaque mot entendu garde sa position, pour que l'interface puisse le marquer.
 *
 * @param words la sortie du moteur (ou `plainWords`), un élément par mot du texte d'origine
 * @param tagged les mots d'origine étiquetés, dans le même ordre
 * @param tidy resserrer le texte même si aucune piste n'est coupée : des mots ont été retirés par un plugin
 */
export function mixSegments(
  words: readonly OutputWord[],
  tagged: readonly TaggedWord[],
  audible: ReadonlySet<Category>,
  tail: string,
  tidy = false,
): MixedSegment[] {
  if (words.length !== tagged.length) throw new Error('les mots à mixer ne correspondent pas aux mots étiquetés');
  let silenced = tidy;
  let out = '';
  words.forEach((word, i) => {
    const heard = audible.has(tagged[i]!.category);
    if (!heard) silenced = true;
    out += word.gap + (heard && word.output ? `${OPEN}${i}${MIDDLE}${word.output}${CLOSE}` : '');
  });
  out += tail;
  if (silenced) {
    out = out
      .replace(/[^\S\n]+/g, ' ') // un seul espace entre deux mots
      .replace(/ ?,(?: ?,)+/g, ',') // virgules qui se suivent
      .replace(/,(?= ?[.!?…;:])/g, '') // virgule devenue inutile avant une ponctuation forte
      .replace(/([.!?…;:]) ?,/g, '$1') // ou juste après
      .replace(/ +([,.…])/g, '$1') // pas d'espace avant une virgule ou un point
      .replace(/^[ ,]+| +$/gm, ''); // ni en début ou fin de ligne
  }
  const segments: MixedSegment[] = [];
  for (const [, between, index, word] of out.matchAll(new RegExp(`([^${OPEN}]*)(?:${OPEN}(\\d+)${MIDDLE}([^${CLOSE}]*)${CLOSE})?`, 'g'))) {
    if (between) segments.push({ text: between });
    if (index !== undefined) segments.push({ text: word!, index: Number(index) });
  }
  return segments;
}

/** Le texte résultant, d'un seul tenant. */
export function mixText(words: readonly OutputWord[], tagged: readonly TaggedWord[], audible: ReadonlySet<Category>, tail: string): string {
  return mixSegments(words, tagged, audible, tail)
    .map((segment) => segment.text)
    .join('');
}

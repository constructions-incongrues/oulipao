import type { Category } from './categories.ts';
import type { TaggedWord } from './tagged-word.ts';
import { tokenize } from './tokenizer.ts';

/** La place d'un mot dans le poème : son vers, sa strophe (comptés depuis 1), et s'il finit son vers. */
export interface VersePlace {
  line: number;
  stanza: number;
  lineEnd: boolean;
}

/** Les pistes dont un mot peut finir un vers : les mots-outils et la ponctuation ne comptent pas. */
const FULL_WORDS: ReadonlySet<Category> = new Set(['noun', 'adjective', 'verb', 'adverb']);

/**
 * Le texte découpé en vers et en strophes, d'après les blancs entre les mots : un saut de ligne
 * ouvre un vers, une ligne vide une strophe. Un élément par mot de `tokenize(text)`. Les filtres
 * ne déplacent ni n'ajoutent de saut de ligne : la découpe vaut pour toute la chaîne.
 */
export function layoutVerse(text: string, tagged: readonly TaggedWord[]): VersePlace[] {
  const tokens = tokenize(text);
  let [line, stanza] = [1, 1];
  const places = tokens.map((token, k) => {
    const gap = text.slice(k ? tokens[k - 1]!.end : 0, token.start);
    if (k && /\n[^\S\n]*\n/.test(gap)) [line, stanza] = [line + 1, stanza + 1];
    else if (k && gap.includes('\n')) line++;
    return { line, stanza, lineEnd: false };
  });
  // Le dernier mot plein de chaque vers.
  for (let k = places.length - 1, seen = 0; k >= 0; k--) {
    if (places[k]!.line === seen) continue;
    if (FULL_WORDS.has(tagged[k]!.category)) {
      places[k]!.lineEnd = true;
      seen = places[k]!.line;
    }
  }
  return places;
}

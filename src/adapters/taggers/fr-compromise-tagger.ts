import nlp, { type FrCompromiseSentence, type FrCompromiseTerm } from '../../../vendor/fr-compromise.mjs';
import type { Category } from '../../domain/categories.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import type { Tagger } from '../../ports/tagger.ts';

const OTHER_TAGS = ['Pronoun', 'Possessive', 'Determiner', 'Preposition', 'Conjunction', 'ProperNoun'];

/** Étiquettes de fr-compromise -> nos cinq catégories. */
export function categoryOf(tags: string[]): Category {
  const has = (tag: string) => tags.includes(tag);
  // fr-compromise range pronoms et possessifs sous « Noun » : les écarter d'abord.
  if (OTHER_TAGS.some(has)) return 'other';
  if (has('Verb') || has('Auxiliary')) return 'verb';
  if (has('Adjective')) return 'adjective';
  if (has('Adverb')) return 'adverb';
  if (has('Noun')) return 'noun';
  return 'other';
}

/**
 * fr-compromise découpe autrement que nous (« l'est » = un terme + un terme implicite,
 * « a-t-elle » = un terme, « là-haut » = deux). On regroupe ses termes par étendue de
 * caractères, puis on y range nos mots : le i-ème mot d'une étendue prend le i-ème terme.
 */
export function alignTerms(text: string, sentences: FrCompromiseSentence[]): TaggedWord[] {
  const spans: { start: number; end: number; terms: FrCompromiseTerm[] }[] = [];
  for (const sentence of sentences) {
    for (const term of sentence.terms) {
      const { start, length } = term.offset;
      if (length > 0) spans.push({ start, end: start + length, terms: [term] });
      else spans.at(-1)?.terms.push(term);
    }
  }
  let current = 0;
  let rank = 0;
  let previous = -1;
  return tokenize(text).map(({ word, start }) => {
    while (current < spans.length - 1 && spans[current]!.end <= start) current++;
    rank = current === previous ? rank + 1 : 0;
    previous = current;
    const span = spans[current];
    if (!span || start < span.start) return { word, category: 'other' };
    const term = span.terms[Math.min(rank, span.terms.length - 1)]!;
    return { word, category: categoryOf(term.tags) };
  });
}

/** Étiqueteur à règles contextuelles : fr-compromise 0.3.1 (MIT), exécuté localement. */
export class FrCompromiseTagger implements Tagger {
  readonly name = 'fr-compromise (règles contextuelles)';

  tag(text: string): TaggedWord[] {
    return alignTerms(text, nlp(text).json({ offset: true }));
  }
}

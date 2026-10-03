import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { Category } from '../categories.ts';
import type { TaggedWord } from '../tagged-word.ts';
import type { Token } from '../tokenizer.ts';

// Syntaxe de voisinage : pas d'analyse, seulement ce qui se lit dans la suite des mots.
// Les règles sont prudentes là où une erreur créerait une faute absente du texte d'origine.

const CONJUNCTIONS = new Set(['et', 'ou', 'mais', 'ni']);
/** Prépositions qui rattachent un nom au nom précédent (« la porte du grenier », « le chat sur la table »). */
export const LINKING_PREPOSITIONS = new Set(['de', "d'", 'à', 'en', 'sur', 'sous', 'dans', 'pour', 'par', 'avec', 'sans', 'chez', 'vers']);

const ETRE = /^(est|sont|était|étaient|fut|furent|sera|seront|serait|seraient|soit|soient|fût|fussent|été|être|étant)$/;
const REGULAR_LINKING = /^(sembl|demeur|rest)(e|es|ent|ait|aient|a|èrent|era|eront|erait|eraient|ât|é|ée|és|ées|er)$/;
const IRREGULAR_LINKING = new Set([
  'paraît', 'parait', 'paraissent', 'paraissait', 'paraissaient', 'parut', 'parurent', 'paraîtra', 'paraitra',
  'paraîtront', 'paraitront', 'paraîtrait', 'paraitrait', 'paru', 'paraître', 'paraitre',
  'devient', 'deviennent', 'devenait', 'devenaient', 'devint', 'devinrent', 'deviendra', 'deviendront',
  'deviendrait', 'deviendraient', 'devienne', 'devenu', 'devenue', 'devenus', 'devenues', 'devenir',
]);

/** Pronoms sujets de reprise : genre et nombre. */
export const SUBJECT_PRONOUNS: Record<string, { gender: 'm' | 'f'; number: 's' | 'p' }> = {
  il: { gender: 'm', number: 's' }, elle: { gender: 'f', number: 's' },
  ils: { gender: 'm', number: 'p' }, elles: { gender: 'f', number: 'p' },
};
export const subjectPronoun = (gender: 'm' | 'f', number: 's' | 'p') => (gender === 'm' ? 'il' : 'elle') + (number === 'p' ? 's' : '');

// Après « il », ces mots signalent un sujet impersonnel (« il faut », « il y a », « il pleut »).
const IMPERSONAL = new Set([
  'y', 'faut', 'fallait', 'fallut', 'faudra', 'faudrait', "s'", 'pleut', 'pleuvait', 'neige', 'neigeait',
  'existe', 'reste', 'restait', 'arrive', 'suffit', 'suffisait', 'vaut', 'valait', 'semble', 'semblait', 'paraît',
  'parait', 'convient', 'importe',
]);

/** « il » impersonnel : il ne reprend aucun nom. Ne reconnaît pas « il est » + heure ou adjectif. */
export function isImpersonal(view: TextView, i: number): boolean {
  if (view.lower(i) !== 'il') return false;
  let next = i + 1;
  while (next < view.length && view.follows(next) && ['ne', "n'"].includes(view.lower(next))) next++;
  return next < view.length && view.follows(next) && IMPERSONAL.has(view.lower(next));
}

/** Le texte vu comme une suite de mots étiquetés, avec ce qui les sépare. */
export class TextView {
  readonly text: string;
  readonly tokens: readonly Token[];
  readonly tagged: readonly TaggedWord[];
  readonly #sentences: number[] = [];

  constructor(text: string, tokens: readonly Token[], tagged: readonly TaggedWord[]) {
    this.text = text;
    this.tokens = tokens;
    this.tagged = tagged;
    let sentence = 0;
    tokens.forEach((_, i) => {
      if (/[.!?…\n]/.test(this.gap(i))) sentence++;
      this.#sentences.push(sentence);
    });
  }

  get length(): number {
    return this.tokens.length;
  }
  /** Ce qui sépare le mot `i` du précédent. */
  gap(i: number): string {
    return this.text.slice(i === 0 ? 0 : this.tokens[i - 1]!.end, this.tokens[i]!.start);
  }
  /** Le mot `i` suit-il le précédent sans rien d'autre que de l'espace ? */
  follows(i: number): boolean {
    return i > 0 && i < this.length && /^\s*$/.test(this.gap(i));
  }
  /** Le mot `i` est-il séparé du précédent par une simple virgule ? */
  afterComma(i: number): boolean {
    return i > 0 && i < this.length && /^\s*,\s*$/.test(this.gap(i));
  }
  is(i: number, category: Category): boolean {
    return this.tagged[i]?.category === category;
  }
  lower(i: number): string {
    return this.tokens[i]!.word.toLowerCase().replace('’', "'");
  }
  sentenceOf(i: number): number {
    return this.#sentences[i]!;
  }
}

/**
 * Adjectifs qui suivent le mot `from` : contigus, apposés après une virgule, ou coordonnés
 * (« gratuit, chauffé et ouvert »), un adverbe pouvant précéder chacun (« plus grande »).
 */
export function adjectiveChain(view: TextView, from: number, claimed: ReadonlySet<number>): number[] {
  const found: number[] = [];
  let position = from;
  for (;;) {
    let i = position + 1;
    if (!view.follows(i) && !view.afterComma(i)) break;
    let detached = view.afterComma(i);
    if (view.is(i, 'other') && CONJUNCTIONS.has(view.lower(i)) && view.follows(i + 1)) {
      detached = true;
      i++;
    }
    while (view.is(i, 'adverb') && !claimed.has(i) && view.follows(i + 1)) i++;
    if (!view.is(i, 'adjective') || claimed.has(i)) break;
    // Après une virgule ou une conjonction, un adjectif suivi d'un nom appartient à ce nom-là.
    if (detached && view.follows(i + 1) && view.is(i + 1, 'noun')) break;
    found.push(i);
    position = i;
  }
  return found;
}

export interface Predicate {
  /** Participes après « être », à accorder avec le sujet. */
  participles: number[];
  /** Attributs du sujet après un verbe d'état. */
  attributes: number[];
}

const isLinking = (word: string) => ETRE.test(word) || REGULAR_LINKING.test(word) || IRREGULAR_LINKING.has(word);

/**
 * Ce qui, après un sujet finissant au mot `subjectEnd`, s'accorde avec lui : le participe qui
 * suit « être » (« est ouverte », « a été vendue », « est devenue ») et l'attribut après un verbe
 * d'état (« paraissait plus grande et plus froide »).
 */
export function findPredicate(view: TextView, subjectEnd: number, claimed: ReadonlySet<number>, morphology: MorphologyRepository): Predicate {
  const verbs: number[] = [];
  for (let i = subjectEnd + 1; view.follows(i) && !claimed.has(i) && (view.is(i, 'verb') || view.is(i, 'adverb')); i++) {
    if (view.is(i, 'verb')) verbs.push(i);
  }
  const participles: number[] = [];
  let afterEtre = false;
  for (const i of verbs) {
    const word = view.lower(i);
    if (afterEtre && morphology.adjectiveReadings(word).length) participles.push(i);
    if (ETRE.test(word)) afterEtre = true;
  }
  const last = verbs.at(-1);
  const attributes = last !== undefined && isLinking(view.lower(last)) ? adjectiveChain(view, last, claimed) : [];
  return { participles, attributes };
}

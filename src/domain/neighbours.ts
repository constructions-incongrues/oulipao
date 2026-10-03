import type { MorphologyRepository } from '../ports/morphology.ts';
import { compatible, pickReading, positionOf, type NounChoice, type NounHints } from './s7/substitution.ts';

/**
 * `among`, dans les fonctions qui suivent : les seules formes que `accept` peut retenir (par exemple
 * celles qui ont la même rime). La recherche ne visite alors que leurs lemmes, dans l'ordre du tour,
 * au lieu de tout le dictionnaire ; le résultat est le même si `accept(forme)` implique que la forme
 * est dans `among`.
 */

import type { AdjectiveForm, ConcreteGender, ConcreteNumber, NounForm } from './s7/types.ts';

// Les voisins d'un mot dans le dictionnaire qui passent un critère : le premier pour le lipogramme
// (sans la lettre), le n-ième pour les filtres de rime (qui riment). Même genre, même nombre.

const collator = new Intl.Collator('fr');

// Un mot ordinaire : lettres du français, trait d'union, apostrophe. Écarte les abréviations du
// lexique (« viiᵉ », « Mᵐᵉ ») qui feraient de drôles de voisins.
const PLAIN_WORD = /^[a-zàâäçéèêëîïôöùûüÿœæ'’-]+$/i;
export const plain = (form: string) => PLAIN_WORD.test(form);

/** Les entrées qui suivent `start` (ou le précèdent si `step` est négatif), en faisant le tour une fois. */
function* around<T>(entries: readonly T[], start: number, step: number): Generator<T> {
  for (let k = 1; k < entries.length; k++) yield entries[(((start + k * step) % entries.length) + entries.length) % entries.length]!;
}

/**
 * Les positions que `around` rencontrerait en partant de `start`, réduites à `sorted` (positions
 * triées, sans doublon) et dans le même ordre : le tour restreint aux entrées qui peuvent passer le
 * critère. Une recherche dichotomique trouve le départ ; on ne trie rien à chaque appel.
 */
export function* aroundAmong(sorted: readonly number[], start: number, step: number): Generator<number> {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (sorted[middle]! < start) low = middle + 1;
    else high = middle;
  }
  // `low` : la première position >= start.
  const at = low < sorted.length && sorted[low] === start ? low : -1;
  const count = sorted.length - (at >= 0 ? 1 : 0);
  let k = step > 0 ? (at >= 0 ? low + 1 : low) : low - 1;
  for (let seen = 0; seen < count; seen++, k += step) {
    const index = ((k % sorted.length) + sorted.length) % sorted.length;
    yield sorted[index]!;
  }
}

// Les positions triées des lemmes d'un ensemble de candidates, calculées une fois par ensemble, par
// liste et par variante : un filtre de rime redonne le même ensemble pour tous les mots d'une même
// rime. La variante distingue des `keysOf` différents sur le même ensemble (les traits d'un verbe).
const sortedPositions = new WeakMap<readonly string[], WeakMap<ReadonlySet<string>, Map<string, number[]>>>();
export function candidatePositions(list: readonly string[], among: ReadonlySet<string>, keysOf: (form: string) => Iterable<string>, variant = ''): number[] {
  let byList = sortedPositions.get(list);
  if (!byList) sortedPositions.set(list, (byList = new WeakMap()));
  let byVariant = byList.get(among);
  if (!byVariant) byList.set(among, (byVariant = new Map()));
  let sorted = byVariant.get(variant);
  if (!sorted) {
    const positions = new Set<number>();
    for (const form of among) for (const key of keysOf(form)) {
      const position = positionOf(list, key);
      if (position !== undefined) positions.add(position);
    }
    byVariant.set(variant, (sorted = [...positions].sort((a, b) => a - b)));
  }
  return sorted;
}

/**
 * Le `count`-ième élément qui passe le critère, en tournant à partir de `start` ; rien s'il n'y en
 * a pas assez. Avec `among`, seules ces positions sont essayées : le résultat est le même tant
 * qu'aucune autre entrée ne peut passer le critère.
 */
function nth<T, R>(entries: readonly T[], start: number, offset: number, pick: (entry: T) => R | undefined, among?: readonly number[]): R | undefined {
  let remaining = Math.abs(offset);
  const step = Math.sign(offset) || 1;
  const tour = among ? (function* () { for (const position of aroundAmong(among, start, step)) yield entries[position]!; })() : around(entries, start, step);
  for (const entry of tour) {
    const found = pick(entry);
    if (found !== undefined && --remaining === 0) return found;
  }
  return undefined;
}

/** Forme la plus proche des traits voulus : nombre exact, puis genre exact, puis ordre du dictionnaire. */
function closest<T extends { form: string; gender: string; number: string }>(forms: readonly T[], gender: string, number: string): T | undefined {
  const distance = (f: T) => Number(f.number !== number) + Number(f.gender !== gender);
  return [...forms].sort((a, b) => distance(a) - distance(b) || collator.compare(a.form, b.form))[0];
}

/**
 * Le n-ième nom qui suit (`offset` négatif : qui précède) dans le dictionnaire et qui a une forme
 * au même genre et au même nombre que le nom dans la phrase, forme que `accept` retient.
 */
export function nthNoun(
  word: string,
  hints: NounHints,
  offset: number,
  accept: (form: string) => boolean,
  morphology: MorphologyRepository,
  among?: ReadonlySet<string>,
): NounChoice {
  const reading = pickReading(word, hints, morphology);
  const lemmas = morphology.nounLemmas();
  const start = reading && positionOf(lemmas, reading.lemma);
  const gender: ConcreteGender = !reading || reading.gender === 'e' ? (hints.gender ?? 'm') : reading.gender;
  const number: ConcreteNumber = !reading || reading.number === 'i' ? (hints.number ?? 's') : reading.number;
  const unchanged = (status: NounChoice['status']): NounChoice => ({ status, replacement: word.toLowerCase(), gender, number, originalGender: gender });
  if (!reading || start === undefined) return unchanged('unknown-noun');

  const fits = (form: NounForm) => plain(form.form) && compatible(form.gender, gender) && (form.number === number || form.number === 'i') && accept(form.form);
  const candidates = among && candidatePositions(lemmas, among, (form) => morphology.nounReadings(form).map((r) => r.lemma));
  const best = nth(lemmas, start, offset, (lemma) => closest(morphology.nounForms(lemma).filter(fits), gender, number), candidates);
  return best ? { status: 'replaced', replacement: best.form, gender, number, originalGender: gender } : unchanged('missing-form');
}

/**
 * Le n-ième adjectif qui suit dans le dictionnaire et qui a, au même genre et au même nombre, une
 * forme que `accept` retient. Rien si l'adjectif est inconnu ou n'a pas assez de voisins.
 */
export function nthAdjective(
  word: string,
  wanted: { gender?: ConcreteGender; number?: ConcreteNumber },
  offset: number,
  accept: (form: string) => boolean,
  morphology: MorphologyRepository,
  among?: ReadonlySet<string>,
): AdjectiveForm | undefined {
  const readings = morphology.adjectiveReadings(word.toLowerCase());
  const reading = readings.find((r) => (!wanted.gender || compatible(r.gender, wanted.gender)) && (!wanted.number || r.number === wanted.number || r.number === 'i')) ?? readings[0];
  const paradigms = morphology.adjectiveParadigms();
  const start = reading ? paradigms.indexOf(reading.paradigm) : -1;
  if (!reading || start < 0) return undefined;
  const gender = wanted.gender ?? (reading.gender === 'e' ? 'm' : reading.gender);
  const number = wanted.number ?? (reading.number === 'i' ? 's' : reading.number);
  const fits = (form: AdjectiveForm) => plain(form.form) && compatible(form.gender, gender) && (form.number === number || form.number === 'i') && accept(form.form);
  const candidates = among && candidatePositions(paradigms, among, (form) => morphology.adjectiveReadings(form).map((r) => r.paradigm));
  return nth(paradigms, start, offset, (paradigm) => closest(morphology.adjectiveForms(paradigm).filter(fits), gender, number), candidates);
}

/** Le n-ième adverbe qui suit dans le dictionnaire et que `accept` retient. */
export function nthAdverb(word: string, offset: number, accept: (form: string) => boolean, morphology: MorphologyRepository, among?: ReadonlySet<string>): string | undefined {
  const adverbs = morphology.adverbs();
  const lower = word.toLowerCase();
  // Un adverbe absent du dictionnaire part de la place qu'il y aurait.
  let start = adverbs.indexOf(lower);
  if (start < 0) start = adverbs.findIndex((adverb) => collator.compare(adverb, lower) > 0) - 1;
  return nth(adverbs, start < 0 ? adverbs.length - 1 : start, offset, (adverb) => (plain(adverb) && accept(adverb) ? adverb : undefined), among && candidatePositions(adverbs, among, (form) => [form]));
}

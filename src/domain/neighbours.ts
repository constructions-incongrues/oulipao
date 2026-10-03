import type { MorphologyRepository } from '../ports/morphology.ts';
import { compatible, pickReading, positionOf, type NounChoice, type NounHints } from './s7/substitution.ts';
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

/** Le `count`-ième élément qui passe le critère, en tournant à partir de `start` ; rien s'il n'y en a pas assez. */
function nth<T, R>(entries: readonly T[], start: number, offset: number, pick: (entry: T) => R | undefined): R | undefined {
  let remaining = Math.abs(offset);
  for (const entry of around(entries, start, Math.sign(offset) || 1)) {
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
export function nthNoun(word: string, hints: NounHints, offset: number, accept: (form: string) => boolean, morphology: MorphologyRepository): NounChoice {
  const reading = pickReading(word, hints, morphology);
  const lemmas = morphology.nounLemmas();
  const start = reading && positionOf(lemmas, reading.lemma);
  const gender: ConcreteGender = !reading || reading.gender === 'e' ? (hints.gender ?? 'm') : reading.gender;
  const number: ConcreteNumber = !reading || reading.number === 'i' ? (hints.number ?? 's') : reading.number;
  const unchanged = (status: NounChoice['status']): NounChoice => ({ status, replacement: word.toLowerCase(), gender, number, originalGender: gender });
  if (!reading || start === undefined) return unchanged('unknown-noun');

  const fits = (form: NounForm) => plain(form.form) && compatible(form.gender, gender) && (form.number === number || form.number === 'i') && accept(form.form);
  const best = nth(lemmas, start, offset, (lemma) => closest(morphology.nounForms(lemma).filter(fits), gender, number));
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
): AdjectiveForm | undefined {
  const readings = morphology.adjectiveReadings(word.toLowerCase());
  const reading = readings.find((r) => (!wanted.gender || compatible(r.gender, wanted.gender)) && (!wanted.number || r.number === wanted.number || r.number === 'i')) ?? readings[0];
  const paradigms = morphology.adjectiveParadigms();
  const start = reading ? paradigms.indexOf(reading.paradigm) : -1;
  if (!reading || start < 0) return undefined;
  const gender = wanted.gender ?? (reading.gender === 'e' ? 'm' : reading.gender);
  const number = wanted.number ?? (reading.number === 'i' ? 's' : reading.number);
  const fits = (form: AdjectiveForm) => plain(form.form) && compatible(form.gender, gender) && (form.number === number || form.number === 'i') && accept(form.form);
  return nth(paradigms, start, offset, (paradigm) => closest(morphology.adjectiveForms(paradigm).filter(fits), gender, number));
}

/** Le n-ième adverbe qui suit dans le dictionnaire et que `accept` retient. */
export function nthAdverb(word: string, offset: number, accept: (form: string) => boolean, morphology: MorphologyRepository): string | undefined {
  const adverbs = morphology.adverbs();
  const lower = word.toLowerCase();
  // Un adverbe absent du dictionnaire part de la place qu'il y aurait.
  let start = adverbs.indexOf(lower);
  if (start < 0) start = adverbs.findIndex((adverb) => collator.compare(adverb, lower) > 0) - 1;
  return nth(adverbs, start < 0 ? adverbs.length - 1 : start, offset, (adverb) => (plain(adverb) && accept(adverb) ? adverb : undefined));
}

import type { MorphologyRepository } from '../../ports/morphology.ts';
import { compatible, pickReading, positionOf, type NounChoice, type NounHints } from '../s7/substitution.ts';
import type { AdjectiveForm, ConcreteGender, ConcreteNumber, NounForm } from '../s7/types.ts';

const collator = new Intl.Collator('fr');

/** Le mot contient-il la lettre ? Sans tenir compte de la casse ; « é » n'est pas « e ». */
export const containsLetter = (word: string, letter: string) => word.toLowerCase().includes(letter.toLowerCase());

// Un mot ordinaire : lettres du français, trait d'union, apostrophe. Écarte les abréviations du
// lexique (« viiᵉ », « Mᵐᵉ ») qui feraient de drôles de voisins.
const PLAIN_WORD = /^[a-zàâäçéèêëîïôöùûüÿœæ'’-]+$/i;
const plain = (form: string) => PLAIN_WORD.test(form);

/** Les entrées qui suivent `start` dans l'ordre du dictionnaire, en faisant le tour une fois. */
function* after<T>(entries: readonly T[], start: number): Generator<T> {
  for (let step = 1; step < entries.length; step++) yield entries[(start + step) % entries.length]!;
}

/** Forme la plus proche des traits voulus : nombre exact, puis genre exact, puis ordre du dictionnaire. */
function closest<T extends { form: string; gender: string; number: string }>(forms: readonly T[], gender: string, number: string): T | undefined {
  const distance = (f: T) => Number(f.number !== number) + Number(f.gender !== gender);
  return [...forms].sort((a, b) => distance(a) - distance(b) || collator.compare(a.form, b.form))[0];
}

/**
 * Le voisin d'un nom sans la lettre : le premier lemme qui le suit dans le dictionnaire et qui a,
 * sans la lettre, une forme au même genre et au même nombre que le nom dans la phrase.
 */
export function neighbourNoun(word: string, hints: NounHints, letter: string, morphology: MorphologyRepository): NounChoice {
  const reading = pickReading(word, hints, morphology);
  const lemmas = morphology.nounLemmas();
  const start = reading && positionOf(lemmas, reading.lemma);
  const gender: ConcreteGender = !reading || reading.gender === 'e' ? (hints.gender ?? 'm') : reading.gender;
  const number: ConcreteNumber = !reading || reading.number === 'i' ? (hints.number ?? 's') : reading.number;
  const unchanged = (status: NounChoice['status']): NounChoice => ({ status, replacement: word.toLowerCase(), gender, number, originalGender: gender });
  if (!reading || start === undefined) return unchanged('unknown-noun');

  const fits = (form: NounForm) => plain(form.form) && compatible(form.gender, gender) && (form.number === number || form.number === 'i') && !containsLetter(form.form, letter);
  for (const lemma of after(lemmas, start)) {
    const best = closest(morphology.nounForms(lemma).filter(fits), gender, number);
    if (best) return { status: 'replaced', replacement: best.form, gender, number, originalGender: gender };
  }
  return unchanged('missing-form');
}

/**
 * Le voisin d'un adjectif sans la lettre : le premier adjectif qui le suit dans le dictionnaire et
 * qui a, sans la lettre, une forme au même genre et au même nombre. Rien si l'adjectif est inconnu
 * ou n'a pas de voisin.
 */
export function neighbourAdjective(
  word: string,
  wanted: { gender?: ConcreteGender; number?: ConcreteNumber },
  letter: string,
  morphology: MorphologyRepository,
): AdjectiveForm | undefined {
  const readings = morphology.adjectiveReadings(word.toLowerCase());
  const reading = readings.find((r) => (!wanted.gender || compatible(r.gender, wanted.gender)) && (!wanted.number || r.number === wanted.number || r.number === 'i')) ?? readings[0];
  const paradigms = morphology.adjectiveParadigms();
  const start = reading ? paradigms.indexOf(reading.paradigm) : -1;
  if (!reading || start < 0) return undefined;
  const gender = wanted.gender ?? (reading.gender === 'e' ? 'm' : reading.gender);
  const number = wanted.number ?? (reading.number === 'i' ? 's' : reading.number);
  const fits = (form: AdjectiveForm) => plain(form.form) && compatible(form.gender, gender) && (form.number === number || form.number === 'i') && !containsLetter(form.form, letter);
  for (const paradigm of after(paradigms, start)) {
    const best = closest(morphology.adjectiveForms(paradigm).filter(fits), gender, number);
    if (best) return best;
  }
  return undefined;
}

/** Le voisin d'un adverbe sans la lettre : le premier adverbe qui le suit dans le dictionnaire. */
export function neighbourAdverb(word: string, letter: string, morphology: MorphologyRepository): string | undefined {
  const adverbs = morphology.adverbs();
  const lower = word.toLowerCase();
  // Un adverbe absent du dictionnaire part de la place qu'il y aurait.
  let start = adverbs.indexOf(lower);
  if (start < 0) start = adverbs.findIndex((adverb) => collator.compare(adverb, lower) > 0) - 1;
  for (const adverb of after(adverbs, start < 0 ? adverbs.length - 1 : start)) if (plain(adverb) && !containsLetter(adverb, letter)) return adverb;
  return undefined;
}

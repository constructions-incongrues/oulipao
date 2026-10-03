import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { AdjectiveForm, ConcreteGender, ConcreteNumber } from './types.ts';

// Formes du masculin singulier employées devant voyelle ou h muet (« un bel arbre »).
const BEFORE_VOWEL = new Set(['bel', 'nouvel', 'vieil', 'fol', 'mol']);

const collator = new Intl.Collator('fr');

export interface AgreementTarget {
  gender: ConcreteGender;
  number: ConcreteNumber;
  /**
   * Pour un adjectif placé juste avant un mot : ce mot appelle-t-il l'élision ?
   * `undefined` pour un adjectif placé après le nom.
   */
  nextElides?: boolean;
}

export interface Agreement {
  form: string;
  /** `unknown` : adjectif absent du lexique. `missing` : pas de forme au genre voulu. */
  status: 'agreed' | 'unknown' | 'missing';
}

const fits = (candidate: AdjectiveForm, target: AgreementTarget) =>
  (candidate.gender === target.gender || candidate.gender === 'e') &&
  (candidate.number === target.number || candidate.number === 'i');

/**
 * Les formes d'un adjectif (par son lemme) qui conviennent au genre et au nombre voulus ; au
 * masculin singulier, la forme euphonique (« bel », « vieil ») seulement devant une voyelle.
 */
function candidatesIn(paradigm: string, target: AgreementTarget, morphology: MorphologyRepository): AdjectiveForm[] {
  let candidates = morphology.adjectiveForms(paradigm).filter((c) => fits(c, target));
  if (target.gender === 'm' && target.number === 's') {
    const euphonic = candidates.filter((c) => BEFORE_VOWEL.has(c.form));
    const plain = candidates.filter((c) => !BEFORE_VOWEL.has(c.form));
    candidates = target.nextElides && euphonic.length ? euphonic : plain.length ? plain : candidates;
  }
  return candidates;
}

/** La forme exacte avant l'épicène ou l'invariable, puis l'ordre du dictionnaire. */
function closest(candidates: readonly AdjectiveForm[], target: AgreementTarget): AdjectiveForm | undefined {
  const exact = (c: AdjectiveForm) => Number(c.gender !== target.gender) + Number(c.number !== target.number);
  return [...candidates].sort((a, b) => exact(a) - exact(b) || collator.compare(a.form, b.form))[0];
}

/** La forme d'un adjectif (par son lemme) au genre et au nombre voulus ; rien s'il n'en a pas. */
export function formInParadigm(paradigm: string, target: AgreementTarget, morphology: MorphologyRepository): string | undefined {
  return closest(candidatesIn(paradigm, target, morphology), target)?.form;
}

/** Met un adjectif épithète au genre et au nombre voulus ; le laisse tel quel s'il ne sait pas. */
export function agreeAdjective(word: string, target: AgreementTarget, morphology: MorphologyRepository): Agreement {
  const lower = word.toLowerCase();
  const readings = morphology.adjectiveReadings(word).length
    ? morphology.adjectiveReadings(word)
    : morphology.adjectiveReadings(lower);
  if (!readings.length) return { form: word, status: 'unknown' };
  // À lectures multiples, préférer celle dont le nombre est celui du groupe.
  const reading = readings.find((r) => r.number === target.number || r.number === 'i') ?? readings[0]!;
  const candidates = candidatesIn(reading.paradigm, target, morphology);
  if (!candidates.length) return { form: word, status: 'missing' };
  // Ne rien changer si le mot convient déjà.
  if (candidates.some((c) => c.form === lower)) return { form: word, status: 'agreed' };
  return { form: closest(candidates, target)!.form, status: 'agreed' };
}

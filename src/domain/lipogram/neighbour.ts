import type { MorphologyRepository } from '../../ports/morphology.ts';
import { bare } from '../letters.ts';
import { nthAdjective, nthAdverb, nthNoun } from '../neighbours.ts';
import type { NounChoice, NounHints } from '../s7/substitution.ts';
import type { AdjectiveForm, ConcreteGender, ConcreteNumber } from '../s7/types.ts';


/** Le mot contient-il l'une des lettres bannies ? `letters` en tient une ou plusieurs : « e », « ae ». */
export const containsLetter = (word: string, letters: string) => {
  const form = bare(word); // une fois par mot, pas une fois par lettre
  return [...bare(letters)].some((letter) => form.includes(letter));
};

/** Le test « sans ces lettres », les lettres déjà normalisées. */
const without = (letters: string) => {
  const banned = [...bare(letters)];
  return (form: string) => {
    const plain = bare(form);
    return !banned.some((letter) => plain.includes(letter));
  };
};

type Pool = 'noun' | 'adjective' | 'adverb';

/** Les formes d'un dictionnaire et leur version nue (sans accents, ligatures défaites), une fois par dictionnaire. */
const plainForms = new WeakMap<object, Map<string, readonly [string, string][]>>();

/** Les formes d'une source, nues, calculées une fois : un nouveau jeu de lettres ne fait plus que filtrer. */
export function bareForms(source: object, kind: string, forms: () => Iterable<string>): readonly [string, string][] {
  let byKind = plainForms.get(source);
  if (!byKind) plainForms.set(source, (byKind = new Map()));
  let pairs = byKind.get(kind);
  if (!pairs) byKind.set(kind, (pairs = [...new Set(forms())].map((form) => [form, bare(form)] as [string, string])));
  return pairs;
}

const pools = new WeakMap<object, Map<string, ReadonlySet<string>>>();

/** Les formes d'une source qui évitent ces lettres, une fois par jeu de lettres. */
export function poolWithout(source: object, kind: string, letters: string, forms: () => Iterable<string>): ReadonlySet<string> {
  let byKey = pools.get(source);
  if (!byKey) pools.set(source, (byKey = new Map()));
  const banned = [...bare(letters)];
  const key = `${kind}\t${banned.join('')}`;
  let set = byKey.get(key);
  if (!set) {
    set = new Set(bareForms(source, kind, forms).filter(([, plain]) => !banned.some((letter) => plain.includes(letter))).map(([form]) => form));
    byKey.set(key, set);
  }
  return set;
}

/**
 * Les formes d'une piste qui évitent ces lettres : la recherche du voisin ne visite plus que les
 * entrées qui en ont une, au lieu de parcourir tout le dictionnaire pour chaque mot (le premier
 * suspect de RISK-08). Les formes nues se calculent une fois par dictionnaire ; un nouveau jeu de
 * lettres ne fait que filtrer.
 */
function pool(kind: Pool, letters: string, morphology: MorphologyRepository): ReadonlySet<string> {
  return poolWithout(morphology, kind, letters, function* () {
    if (kind === 'noun') for (const lemma of morphology.nounLemmas()) for (const form of morphology.nounForms(lemma)) yield form.form;
    if (kind === 'adjective') for (const paradigm of morphology.adjectiveParadigms()) for (const form of morphology.adjectiveForms(paradigm)) yield form.form;
    if (kind === 'adverb') yield* morphology.adverbs();
  });
}

/**
 * Le voisin d'un nom sans la lettre : le premier lemme qui le suit dans le dictionnaire et qui a,
 * sans la lettre, une forme au même genre et au même nombre que le nom dans la phrase.
 */
export const neighbourNoun = (word: string, hints: NounHints, letter: string, morphology: MorphologyRepository): NounChoice =>
  nthNoun(word, hints, 1, without(letter), morphology, pool('noun', letter, morphology));

/**
 * Le voisin d'un adjectif sans la lettre : le premier adjectif qui le suit dans le dictionnaire et
 * qui a, sans la lettre, une forme au même genre et au même nombre. Rien si l'adjectif est inconnu
 * ou n'a pas de voisin.
 */
export const neighbourAdjective = (
  word: string,
  wanted: { gender?: ConcreteGender; number?: ConcreteNumber },
  letter: string,
  morphology: MorphologyRepository,
): AdjectiveForm | undefined => nthAdjective(word, wanted, 1, without(letter), morphology, pool('adjective', letter, morphology));

/** Le voisin d'un adverbe sans la lettre : le premier adverbe qui le suit dans le dictionnaire. */
export const neighbourAdverb = (word: string, letter: string, morphology: MorphologyRepository): string | undefined =>
  nthAdverb(word, 1, without(letter), morphology, pool('adverb', letter, morphology));

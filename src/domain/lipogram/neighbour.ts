import type { MorphologyRepository } from '../../ports/morphology.ts';
import { nthAdjective, nthAdverb, nthNoun } from '../neighbours.ts';
import type { NounChoice, NounHints } from '../s7/substitution.ts';
import type { AdjectiveForm, ConcreteGender, ConcreteNumber } from '../s7/types.ts';

/** Le mot contient-il la lettre ? Sans tenir compte de la casse ; « é » n'est pas « e ». */
/** Le mot sans accents ni ligatures, comme chez Perec : « é » compte pour « e », « œ » pour « o » et « e ». */
const bare = (word: string) => word.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');

/** Le mot contient-il l'une des lettres bannies ? `letters` en tient une ou plusieurs : « e », « ae ». */
export const containsLetter = (word: string, letters: string) => [...bare(letters)].some((letter) => bare(word).includes(letter));

const without = (letter: string) => (form: string) => !containsLetter(form, letter);

/**
 * Le voisin d'un nom sans la lettre : le premier lemme qui le suit dans le dictionnaire et qui a,
 * sans la lettre, une forme au même genre et au même nombre que le nom dans la phrase.
 */
export const neighbourNoun = (word: string, hints: NounHints, letter: string, morphology: MorphologyRepository): NounChoice =>
  nthNoun(word, hints, 1, without(letter), morphology);

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
): AdjectiveForm | undefined => nthAdjective(word, wanted, 1, without(letter), morphology);

/** Le voisin d'un adverbe sans la lettre : le premier adverbe qui le suit dans le dictionnaire. */
export const neighbourAdverb = (word: string, letter: string, morphology: MorphologyRepository): string | undefined =>
  nthAdverb(word, 1, without(letter), morphology);

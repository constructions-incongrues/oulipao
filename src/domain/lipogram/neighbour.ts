import type { MorphologyRepository } from '../../ports/morphology.ts';
import { nthAdjective, nthAdverb, nthNoun } from '../neighbours.ts';
import type { NounChoice, NounHints } from '../s7/substitution.ts';
import type { AdjectiveForm, ConcreteGender, ConcreteNumber } from '../s7/types.ts';

/** Le mot contient-il la lettre ? Sans tenir compte de la casse ; « é » n'est pas « e ». */
export const containsLetter = (word: string, letter: string) => word.toLowerCase().includes(letter.toLowerCase());

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

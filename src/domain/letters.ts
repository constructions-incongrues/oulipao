import type { MorphologyRepository } from '../ports/morphology.ts';
import { matchCase } from './removal.ts';
import { elides } from './s7/elision.ts';
import type { OutputWord } from './s7/types.ts';

// Les lettres d'un mot, comme chez Perec : partagées par le lipogramme et le tautogramme.

/** Le mot sans accents ni ligatures, comme chez Perec : « é » compte pour « e », « œ » pour « o » et « e ». */
export const bare = (word: string) => word.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');

/** Les lettres d'une saisie, nues et dans l'ordre : « Hélène-Marie » donne « helenemarie ». */
export const lettersOf = (input: string) => bare(input).replace(/[^a-z]/g, '');

/** « le », « la » devant une voyelle ou un h muet : « l’ », collé au mot suivant (modifie la sortie en place). */
export function elide(words: OutputWord[], index: number, apostrophe: string, morphology: MorphologyRepository) {
  const word = words[index]!;
  // Seulement devant le mot qui suit immédiatement : s'il a été retiré, l'article reste tel quel.
  const next = words[index + 1];
  if (!next?.output || !/^(le|la)$/i.test(word.output) || !elides(next.output, morphology)) return;
  word.output = `${word.output[0]}${apostrophe}`;
  next.gap = '';
}

/**
 * L'inverse : « l’ » devant un mot nouveau qui commence par une consonne redevient « le » ou « la »
 * (modifie la sortie en place). Le genre est celui du mot nouveau, sinon du mot d'origine, sinon le masculin.
 */
export function restoreArticle(words: OutputWord[], index: number, original: string, morphology: MorphologyRepository) {
  const previous = words[index - 1];
  const word = words[index]!;
  if (!previous || !/^l['’]$/i.test(previous.output) || elides(word.output, morphology)) return;
  const readings = [word.output, original].flatMap((form) => [...morphology.nounReadings(form.toLowerCase()), ...morphology.adjectiveReadings(form.toLowerCase())]);
  const article = readings.find((reading) => reading.gender !== 'e')?.gender === 'f' ? 'la' : 'le';
  previous.output = matchCase(previous.output, article);
  word.gap = ' ';
}

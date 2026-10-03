import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { Category } from '../categories.ts';
import { guessReading } from './fallback.ts';
import { ipaOf, isVowel, phonemesOf, type PhoneticReading } from './phoneme.ts';
import { endsWithMuteE, RHYME_GENDER_LABELS, rhymeGender, rhymeOf } from './rhyme.ts';

export const GUESSED = 'prononciation devinée';
export const PHONETICS_LOADING = 'prononciations en cours de chargement';

/** La prononciation d'un mot : celle du lexique pour sa catégorie, sinon pour une autre, sinon devinée. */
export function pronounce(word: string, category: Category | undefined, phonetics: PhoneticsRepository): PhoneticReading | undefined {
  const lower = word.toLowerCase();
  return (
    (category && phonetics.readings(lower, category)[0]) ??
    phonetics.readings(lower)[0] ??
    guessReading(lower)
  );
}

/** Le nombre de syllabes d'une prononciation : ses voyelles (« l' » élidé n'en a aucune). */
export const syllableCount = (reading: PhoneticReading) => phonemesOf(reading).filter(isVowel).length;

/**
 * Une prononciation en clair : « /ʃɛz/ · 1 syllabe · rime /ɛz/ », le genre de la rime si l'on donne
 * le mot écrit (« rime /ɛz/ féminine »), et « devinée » s'il le faut.
 */
export function describeReading(reading: PhoneticReading, word?: string): string {
  const count = syllableCount(reading);
  const phonemes = phonemesOf(reading);
  const gender = word === undefined ? '' : ` ${RHYME_GENDER_LABELS[rhymeGender(word, phonemes)]}`;
  const text = `/${ipaOf(reading).replaceAll('.', '')}/ · ${count} syllabe${count > 1 ? 's' : ''} · rime /${rhymeOf(phonemes)}/${gender}`;
  return reading.guessed ? `${text} · devinée` : text;
}

/** Un mot d'un vers, avec sa catégorie pour choisir la bonne prononciation. */
export interface VerseWord {
  word: string;
  category?: Category;
}

/**
 * Le nombre de syllabes d'un vers : celles de chaque mot, plus le e muet d'un mot suivi, dans le
 * vers, d'un mot qui commence par une consonne (« rêve » compte deux syllabes devant « dort »,
 * une devant « étrange » ou en fin de vers). Rien si le vers n'a pas de mot prononçable.
 */
export function lineSyllables(words: readonly VerseWord[], phonetics: PhoneticsRepository): number | undefined {
  const readings = words.map(({ word, category }) => pronounce(word, category, phonetics));
  let count = 0;
  readings.forEach((reading, k) => {
    if (!reading) return;
    count += syllableCount(reading);
    const next = readings.slice(k + 1).find(Boolean);
    if (next && endsWithMuteE(words[k]!.word, phonemesOf(reading)) && !isVowel(phonemesOf(next)[0]!)) count++;
  });
  return readings.some(Boolean) ? count : undefined;
}

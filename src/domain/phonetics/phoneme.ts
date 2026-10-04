import { z } from 'zod';

/** Les voyelles du français en API, nasales comprises (la tilde est un caractère combinant). */
export const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y', 'ɔ', 'ə', 'ɛ', 'ɑ', 'œ', 'ø', 'ɑ̃', 'ɔ̃', 'ɛ̃', 'œ̃'] as const;
/** Les consonnes et semi-voyelles du français en API. */
export const CONSONANTS = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'm', 'n', 'ɲ', 'ŋ', 'l', 'ʁ', 'j', 'w', 'ɥ'] as const;

export const PhonemeSchema = z.enum([...VOWELS, ...CONSONANTS]);
export type Phoneme = z.infer<typeof PhonemeSchema>;

const VOWEL_SET = new Set<string>(VOWELS);
// Les phonèmes du français, pour valider un symbole sans passer par zod à chaque lettre (un million d'appels au chargement).
const PHONEME_SET = new Set<string>([...VOWELS, ...CONSONANTS]);
export const isVowel = (phoneme: string) => VOWEL_SET.has(phoneme);

const TILDE = '̃';

/** Découpe une suite API en phonèmes ; `undefined` si un symbole n'est pas un phonème du français. */
export function splitPhonemes(ipa: string): Phoneme[] | undefined {
  const phonemes: Phoneme[] = [];
  for (let i = 0; i < ipa.length; i++) {
    const symbol = ipa[i + 1] === TILDE ? ipa[i]! + ipa[++i]! : ipa[i]!;
    if (!PHONEME_SET.has(symbol)) return undefined;
    phonemes.push(symbol as Phoneme);
  }
  return phonemes;
}

/** Une prononciation : ses syllabes, chacune une suite de phonèmes ; `guessed` si elle vient des règles. */
export const PhoneticReadingSchema = z.object({
  syllables: z.array(z.array(PhonemeSchema).min(1)).min(1),
  guessed: z.boolean(),
});
export type PhoneticReading = z.infer<typeof PhoneticReadingSchema>;

/** Lit une prononciation écrite en API, syllabes séparées par un point (« ʃɛz », « ku.vɑ̃ »). */
export function parseReading(ipa: string, guessed = false): PhoneticReading | undefined {
  const syllables = ipa.split('.').map(splitPhonemes);
  if (syllables.some((syllable) => !syllable?.length)) return undefined;
  return { syllables: syllables as Phoneme[][], guessed };
}

export const phonemesOf = (reading: PhoneticReading): Phoneme[] => reading.syllables.flat();

/** La prononciation écrite en API, syllabes séparées par un point. */
export const ipaOf = (reading: PhoneticReading) => reading.syllables.map((syllable) => syllable.join('')).join('.');

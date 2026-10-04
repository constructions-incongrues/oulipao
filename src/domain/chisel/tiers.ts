import { matchCase } from '../text-case.ts';

// La Ciselure travaille sur l'écrit : ce que la page montre, que la voix dit tel quel.

const VOWEL = /[aeiouyàâäéèêëîïôöùûüÿœæ]/i;
const isVowel = (letter: string) => VOWEL.test(letter);

/** Le souffle : ce qui reste d'un mot au dernier palier. */
export const BREATH = 'pfou';

/**
 * La première syllabe écrite : les consonnes d'attaque, le groupe de voyelles, puis une consonne de
 * coda seulement si une autre consonne la suit (« vieux » → « vieu », « chat » → « cha », « dort »
 * → « dor »).
 */
// ponytail: une heuristique d'écrit, pas une syllabation ; plafond : « oignon », « second » ;
// passer par la syllabation phonétique si les coupes gênent.
export function firstWrittenSyllable(word: string): string {
  const letters = [...word];
  let at = 0;
  while (at < letters.length && !isVowel(letters[at]!)) at++;
  if (at === letters.length) return word; // pas de voyelle (« pff ») : le mot tient en une syllabe
  while (at < letters.length && isVowel(letters[at]!)) at++;
  if (at + 1 < letters.length && !isVowel(letters[at]!) && !isVowel(letters[at + 1]!)) at++;
  return letters.slice(0, at).join('');
}

/** Les voyelles d'un mot, dans l'ordre ; sans voyelle, son initiale. */
export function vowelsOf(word: string): string {
  const vowels = [...word].filter(isVowel).join('');
  return vowels ? matchCase(word, vowels) : initialOf(word);
}

/** L'initiale d'un mot. */
export const initialOf = (word: string) => [...word][0] ?? '';

import { z } from 'zod';
import { isVowel, type Phoneme } from './phoneme.ts';

/** Pauvre : la dernière voyelle. Suffisante : avec une consonne voisine. Riche : trois phonèmes au moins. */
export const RichnessSchema = z.enum(['poor', 'sufficient', 'rich']);
export type Richness = z.infer<typeof RichnessSchema>;

export const RICHNESS_LABELS: Record<Richness, string> = { poor: 'pauvre', sufficient: 'suffisante', rich: 'riche' };

/** Phonèmes communs, comptés depuis la fin, que demande chaque richesse. */
const SHARED: Record<Richness, number> = { poor: 1, sufficient: 2, rich: 3 };

/**
 * La rime : la dernière voyelle prononcée et ce qui la suit (« ʃɛz » → « ɛz »). Le e muet final
 * n'est pas prononcé, il n'est donc pas dans les phonèmes. Sans voyelle, tout le mot.
 */
export function rhymeOf(phonemes: readonly Phoneme[]): string {
  let last = phonemes.length - 1;
  while (last > 0 && !isVowel(phonemes[last]!)) last--;
  return phonemes.slice(last).join('');
}

/** Le nombre de phonèmes communs aux deux mots, comptés depuis la fin. */
function sharedSuffix(a: readonly Phoneme[], b: readonly Phoneme[]): number {
  let shared = 0;
  while (shared < a.length && shared < b.length && a[a.length - 1 - shared] === b[b.length - 1 - shared]) shared++;
  return shared;
}

/** Les deux mots riment-ils à cette richesse ? Même rime, et assez de phonèmes communs. */
export function rhymes(a: readonly Phoneme[], b: readonly Phoneme[], richness: Richness): boolean {
  return rhymeOf(a) === rhymeOf(b) && sharedSuffix(a, b) >= SHARED[richness];
}

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

/** Le genre voulu d'une rime : indifférent, masculin, féminin, ou alterné de vers en vers. */
export const GenderSchema = z.enum(['any', 'masculine', 'feminine', 'alternate']);
export type GenderSetting = z.infer<typeof GenderSchema>;
export type RhymeGender = 'masculine' | 'feminine';

export const GENDER_LABELS: Record<GenderSetting, string> = { any: 'genre indifférent', masculine: 'rimes masculines', feminine: 'rimes féminines', alternate: 'rimes alternées' };
export const RHYME_GENDER_LABELS: Record<RhymeGender, string> = { masculine: 'masculine', feminine: 'féminine' };

/** Le mot finit-il par un e muet écrit (« rêve », « chantent ») que la prononciation n'a pas ? */
export function endsWithMuteE(word: string, phonemes: readonly Phoneme[]): boolean {
  const last = phonemes.at(-1);
  return /(?:e|es|ent)$/i.test(word) && last !== undefined && !isVowel(last);
}

/** Une rime est féminine quand le mot finit par un e muet (« rose », « chantent »), masculine sinon (« souvent », « été »). */
export const rhymeGender = (word: string, phonemes: readonly Phoneme[]): RhymeGender => (endsWithMuteE(word, phonemes) ? 'feminine' : 'masculine');

/** Un mot a-t-il le genre voulu ? `any` et `alternate` (résolu ailleurs, vers par vers) acceptent tout. */
export const hasGender = (word: string, phonemes: readonly Phoneme[], wanted: GenderSetting | RhymeGender) =>
  wanted === 'any' || wanted === 'alternate' || rhymeGender(word, phonemes) === wanted;

/** La rime découpée : sa voyelle, et les consonnes qui la suivent (« /ɛʁ/ » → « ɛ » et « ʁ »). */
export function splitRhyme(phonemes: readonly Phoneme[]): { vowel: string; coda: string } {
  let last = phonemes.length - 1;
  while (last > 0 && !isVowel(phonemes[last]!)) last--;
  return { vowel: phonemes[last] ?? '', coda: phonemes.slice(last + 1).join('') };
}

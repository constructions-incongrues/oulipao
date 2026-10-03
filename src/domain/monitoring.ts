import type { MixedSegment } from './mixing.ts';
import { tokenize } from './tokenizer.ts';

/**
 * Les mots dits à un pas : ceux que le texte résultant met à la place du mot d'origine, dans
 * l'ordre, sans la ponctuation. Rien si le mot ne s'entend pas (piste muette, autre piste en solo,
 * mot retiré) : ces mots sont absents des segments. Un vers recopié par un refrain ne se dit qu'à
 * son pas d'origine.
 */
export function wordsAtStep(segments: readonly MixedSegment[], index: number): string[] {
  return segments.filter((segment) => segment.index === index && segment.copyOf === undefined).flatMap((segment) => tokenize(segment.text).map((token) => token.word));
}

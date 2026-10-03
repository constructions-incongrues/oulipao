import { z } from 'zod';
import type { MixedSegment } from '../mixing.ts';

/** Les formes à refrain : elles se posent sur le texte résultant, après la chaîne. */
export const FormSchema = z.enum(['none', 'rondel', 'villanelle']);
export type Form = z.infer<typeof FormSchema>;

export const FORM_LABELS: Record<Form, string> = { none: 'aucune', rondel: 'rondel', villanelle: 'villanelle' };

/** Une place de la forme : un vers neuf de l'auteur (`0`), ou la copie du vers de ce numéro. */
type Place = number;
const A = 0;

/** Les strophes de chaque forme. Rondel : 7 et 8 recopient 1 et 2, 13 recopie 1. Villanelle : 6, 12, 18 recopient 1 ; 9, 15, 19 recopient 3. */
export const FORM_STANZAS: Record<Exclude<Form, 'none'>, readonly (readonly Place[])[]> = {
  rondel: [[A, A, A, A], [A, A, 1, 2], [A, A, A, A, 1]],
  villanelle: [[A, A, A], [A, A, 1], [A, A, 3], [A, A, 1], [A, A, 3], [A, A, 1, 3]],
};

/** Le texte mis en forme, et le nombre de vers de l'auteur qui manquent pour la remplir. */
export interface FormedText {
  segments: MixedSegment[];
  missing: number;
}

/** Les vers du texte, morceaux par morceaux ; les lignes vides (sauts de strophe) tombent. */
function linesOf(segments: readonly MixedSegment[]): MixedSegment[][] {
  const lines: MixedSegment[][] = [[]];
  for (const segment of segments) {
    if (segment.index !== undefined) {
      lines.at(-1)!.push(segment);
      continue;
    }
    segment.text.split('\n').forEach((piece, k) => {
      if (k) lines.push([]);
      if (piece) lines.at(-1)!.push({ text: piece });
    });
  }
  return lines.filter((line) => line.some((segment) => segment.text.trim()));
}

/**
 * Pose une forme à refrain sur le texte résultant. Les vers de l'auteur sont pris dans l'ordre,
 * ses sauts de strophe ignorés ; un refrain recopie un vers déjà posé, ses mots gardent l'index de
 * leur mot d'origine. La forme s'arrête au premier vers neuf qui manque ; les vers en trop suivent,
 * dans une strophe à part. Sans forme, le texte reste tel quel.
 */
export function layoutForm(segments: readonly MixedSegment[], form: Form): FormedText {
  if (form === 'none') return { segments: [...segments], missing: 0 };
  const lines = linesOf(segments);
  const stanzas: MixedSegment[][][] = [];
  const placed: MixedSegment[][] = [];
  let next = 0;
  let missing = 0;
  for (const places of FORM_STANZAS[form]) {
    const stanza: MixedSegment[][] = [];
    for (const place of places) {
      if (missing || (place === A && next >= lines.length)) {
        if (place === A) missing++;
        continue;
      }
      const line = place === A ? lines[next++]! : placed[place - 1]!.map(({ copyOf: _, ...segment }) => ({ ...segment, copyOf: place }));
      placed.push(line);
      stanza.push(line);
    }
    if (stanza.length) stanzas.push(stanza);
  }
  if (next < lines.length) stanzas.push(lines.slice(next));
  const out: MixedSegment[] = [];
  stanzas.forEach((stanza, s) => {
    stanza.forEach((line, l) => {
      if (s || l) out.push({ text: l ? '\n' : '\n\n' });
      out.push(...line);
    });
  });
  return { segments: out, missing };
}

import { z } from 'zod';
import { CategorySchema } from './categories.ts';
import type { ReferenceText } from './reference-text.ts';
import type { TaggedWord } from './tagged-word.ts';

export const TaggingErrorSchema = z.object({
  index: z.number().int().nonnegative(),
  word: z.string(),
  expected: CategorySchema,
  actual: CategorySchema,
});
export type TaggingError = z.infer<typeof TaggingErrorSchema>;

export const ComparisonSchema = z.object({
  total: z.number().int(),
  correct: z.number().int(),
  /** Mots de contenu : tout ce qui n'est pas `other` dans la référence. */
  content: z.object({ total: z.number().int(), correct: z.number().int() }),
  /** Mots dont la forme admet plusieurs catégories ; `null` sans prédicat d'ambiguïté. */
  ambiguous: z.number().int().nullable(),
  errors: z.array(TaggingErrorSchema),
});
export type Comparison = z.infer<typeof ComparisonSchema>;

export interface CompareOptions {
  /** Fourni par un lexique : la forme admet-elle plusieurs catégories ? */
  isAmbiguous?: (word: string) => boolean;
}

/** Compare la sortie d'un étiqueteur à un texte de référence. */
export function compare(output: TaggedWord[], reference: ReferenceText, options: CompareOptions = {}): Comparison {
  const expected = reference.words;
  if (output.length !== expected.length) {
    throw new Error(`${output.length} mots étiquetés, ${expected.length} dans la référence`);
  }
  const { isAmbiguous } = options;
  const errors: TaggingError[] = [];
  const content = { total: 0, correct: 0 };
  let ambiguous = isAmbiguous ? 0 : null;
  expected.forEach((want, index) => {
    const got = output[index]!;
    if (got.word !== want.word) throw new Error(`mot ${index} : « ${got.word} » ≠ « ${want.word} »`);
    const right = got.category === want.category;
    if (!right) errors.push({ index, word: want.word, expected: want.category, actual: got.category });
    // Le score global est gonflé par les mots-outils, faciles à classer ; celui-ci ne l'est pas.
    if (want.category !== 'other') {
      content.total++;
      if (right) content.correct++;
    }
    if (ambiguous !== null && isAmbiguous!(want.word)) ambiguous++;
  });
  return { total: expected.length, correct: expected.length - errors.length, content, ambiguous, errors };
}

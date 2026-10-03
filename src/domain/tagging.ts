import { z } from 'zod';
import type { Tagger } from '../ports/tagger.ts';
import { TaggedWordSchema, type TaggedWord } from './tagged-word.ts';
import { tokenize } from './tokenizer.ts';

const TaggerOutputSchema = z.array(TaggedWordSchema);

/**
 * Étiquette un texte et vérifie le contrat du port : sortie conforme au schéma, un mot par
 * mot du découpage, dans le même ordre. La page et la comparaison peuvent s'y fier.
 */
export async function tagText(tagger: Tagger, text: string): Promise<TaggedWord[]> {
  const parsed = TaggerOutputSchema.safeParse(await tagger.tag(text));
  if (!parsed.success) {
    throw new Error(`${tagger.name} : sortie non conforme — ${parsed.error.issues[0]?.message}`);
  }
  const output = parsed.data;
  const tokens = tokenize(text);
  if (output.length !== tokens.length) {
    throw new Error(`${tagger.name} : ${output.length} mots rendus, ${tokens.length} attendus`);
  }
  tokens.forEach((token, i) => {
    if (output[i]!.word !== token.word) {
      throw new Error(`${tagger.name} : mot ${i} « ${output[i]!.word} » ≠ « ${token.word} »`);
    }
  });
  return output;
}

import { z } from 'zod';
import type { Category } from '../../domain/categories.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import type { Tagger } from '../../ports/tagger.ts';
import type { TextSource } from '../../ports/text-source.ts';

const CATEGORY_OF: Record<string, Category> = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb', o: 'other' };

/** Entrée du lexique dérivé : une forme et ses codes, dans l'ordre de préférence. */
const LexiconEntrySchema = z.object({
  form: z.string().min(1),
  codes: z.string().regex(/^[nvaro]+$/),
});

/** Lit data/lexique-potao.tsv ; lève si une ligne n'est pas conforme. */
export function parseLexicon(tsv: string): Map<string, string> {
  const lexicon = new Map<string, string>();
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const tab = line.indexOf('\t');
    const entry = LexiconEntrySchema.safeParse({ form: line.slice(0, tab), codes: line.slice(tab + 1) });
    if (!entry.success) throw new Error(`lexique : ligne non conforme « ${line} »`);
    lexicon.set(entry.data.form, entry.data.codes);
  }
  return lexicon;
}

/**
 * Étiqueteur par simple consultation du lexique. Aucun contexte : pour une forme ambiguë, il
 * prend la première catégorie dans l'ordre de préférence du lexique dérivé. C'est le plancher.
 */
export class LexiconLookupTagger implements Tagger {
  readonly name = 'lexique (consultation seule)';
  #lexicon: Promise<Map<string, string>> | undefined;
  readonly #source: TextSource;

  constructor(source: TextSource) {
    this.#source = source;
  }

  #load(): Promise<Map<string, string>> {
    return (this.#lexicon ??= this.#source().then(parseLexicon));
  }

  // Codes possibles d'une forme, ou undefined si elle est inconnue du lexique.
  static #codes(lexicon: Map<string, string>, word: string): string | undefined {
    const form = word.replaceAll("'", '’'); // le lexique écrit l'apostrophe typographique
    return lexicon.get(form) ?? lexicon.get(form.toLowerCase());
  }

  /** La forme admet-elle plusieurs des cinq catégories ? (décompte des ambiguïtés) */
  async ambiguityPredicate(): Promise<(word: string) => boolean> {
    const lexicon = await this.#load();
    return (word) => (LexiconLookupTagger.#codes(lexicon, word)?.length ?? 0) > 1;
  }

  async tag(text: string): Promise<TaggedWord[]> {
    const lexicon = await this.#load();
    return tokenize(text).map(({ word }) => {
      const codes = LexiconLookupTagger.#codes(lexicon, word);
      // Inconnu : une majuscule fait un nom propre (other) ; sinon la classe ouverte la plus
      // fréquente, le nom.
      const code = codes ? codes[0]! : /^\p{Lu}/u.test(word) ? 'o' : 'n';
      return { word, category: CATEGORY_OF[code]! };
    });
  }
}

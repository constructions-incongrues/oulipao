import { z } from 'zod';
import type { Category } from './categories.ts';
import { TaggedWordSchema } from './tagged-word.ts';
import { tokenize } from './tokenizer.ts';

/** Texte de référence annoté à la main (reference/FORMAT.md). */
export const ReferenceTextSchema = z
  .object({
    title: z.string().min(1),
    source: z.string().min(1),
    annotator: z.string().min(1),
    text: z.string().min(1),
    words: z.array(TaggedWordSchema).min(1),
  })
  .refine(
    (ref) => {
      const tokens = tokenize(ref.text);
      return tokens.length === ref.words.length && tokens.every((t, i) => t.word === ref.words[i]!.word);
    },
    { message: 'words ne correspond pas au découpage de text' },
  );
export type ReferenceText = z.infer<typeof ReferenceTextSchema>;

const CODES: Record<string, Category> = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb', o: 'other' };
const ANNOTATION = /\{([nvaro])\}/g;
const DEFAULT_ANNOTATOR =
  "assistant IA (Claude), 2026-10-03, avant tout essai d'étiqueteur — acceptée telle quelle par le fondateur";

/**
 * Lit le format annoté (`mot{n}`) : chaque mot est suivi de son code entre accolades ; les
 * lignes « # clé: valeur » en tête donnent `titre`, `source` et, au besoin, `annotateur`.
 * C'est ce format qu'on relit et corrige à la main ; le JSON en est dérivé.
 */
export function parseAnnotatedText(source: string): ReferenceText {
  const lines = source.split('\n');
  const meta: Record<string, string> = {};
  while (lines[0]?.startsWith('#')) {
    const header = lines.shift()!.match(/^#\s*(\w+):\s*(.*)$/);
    if (!header) throw new Error('en-tête illisible : attendu « # clé: valeur »');
    meta[header[1]!] = header[2]!;
  }
  const annotated = lines.join('\n').trim();
  const codes = [...annotated.matchAll(ANNOTATION)].map((m) => m[1]!);
  const text = annotated.replace(ANNOTATION, '');
  if (/[{}]/.test(text)) throw new Error('accolade ou code inconnu restant');
  const tokens = tokenize(text);
  if (tokens.length !== codes.length) {
    throw new Error(`${tokens.length} mots mais ${codes.length} annotations`);
  }
  // Chaque annotation doit suivre immédiatement son mot : on revérifie en réannotant.
  let rebuilt = '';
  let end = 0;
  tokens.forEach((token, i) => {
    rebuilt += `${text.slice(end, token.end)}{${codes[i]}}`;
    end = token.end;
  });
  if (rebuilt + text.slice(end) !== annotated) throw new Error("une annotation n'est pas collée à son mot");
  return ReferenceTextSchema.parse({
    title: meta['titre'],
    source: meta['source'],
    annotator: meta['annotateur'] ?? DEFAULT_ANNOTATOR,
    text,
    words: tokens.map((token, i) => ({ word: token.word, category: CODES[codes[i]!] })),
  });
}

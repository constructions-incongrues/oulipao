import type { Category } from '../domain/categories.ts';
import type { TaggedWord } from '../domain/tagged-word.ts';
import { tokenize } from '../domain/tokenizer.ts';

/** Libellés affichés : l'interface reste en français. */
export const CATEGORY_LABELS: Record<Category, string> = {
  noun: 'nom',
  verb: 'verbe',
  adjective: 'adjectif',
  adverb: 'adverbe',
  other: 'autre',
};

export interface Segment {
  text: string;
  /** Absent pour l'espace et la ponctuation entre les mots. */
  category?: Category;
}

/** Découpe le texte en segments à afficher : les mots avec leur catégorie, le reste tel quel. */
export function toSegments(text: string, tagged: TaggedWord[]): Segment[] {
  const segments: Segment[] = [];
  let end = 0;
  tokenize(text).forEach((token, i) => {
    if (token.start > end) segments.push({ text: text.slice(end, token.start) });
    segments.push({ text: token.word, category: tagged[i]!.category });
    end = token.end;
  });
  if (end < text.length) segments.push({ text: text.slice(end) });
  return segments;
}

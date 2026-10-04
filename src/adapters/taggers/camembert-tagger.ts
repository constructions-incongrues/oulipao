import { z } from 'zod';
import type { Category } from '../../domain/categories.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import type { Tagger } from '../../ports/tagger.ts';

/** Un sous-mot du modèle et son étiquette (jeu du French Treebank). */
export const LabelledPieceSchema = z.object({ piece: z.string(), label: z.string() });
export type LabelledPiece = z.infer<typeof LabelledPieceSchema>;
const ClassifierOutputSchema = z.array(LabelledPieceSchema);

/** Ce que l'étiqueteur attend du modèle : les sous-mots étiquetés d'une phrase, dans l'ordre. */
export interface PieceClassifier {
  classify(sentence: string): Promise<LabelledPiece[]>;
}

// Étiquettes du French Treebank -> nos catégories. NPP (nom propre) va dans `other`.
const CATEGORY_OF: Record<string, Category> = {
  NC: 'noun',
  V: 'verb', VIMP: 'verb', VINF: 'verb', VPP: 'verb', VPR: 'verb', VS: 'verb',
  ADJ: 'adjective', ADJWH: 'adjective',
  ADV: 'adverb', ADVWH: 'adverb',
};

export function categoryOfLabel(label: string | undefined): Category {
  return (label !== undefined && CATEGORY_OF[label]) || 'other';
}

/**
 * Les mots au plus par morceau envoyé au modèle. CamemBERT accepte 512 sous-mots, et un mot français
 * en donne en moyenne de 1,3 à 2 : 200 mots restent sous la limite, marqueurs compris.
 */
export const MAX_WORDS = 200;

type Piece = { sentence: string; offset: number };

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Coupe un morceau trop long en fenêtres de `maxWords` mots, sur des frontières de mot. */
function windows({ sentence, offset }: Piece, maxWords: number): Piece[] {
  const out: Piece[] = [];
  const starts = [...sentence.matchAll(/\S+/g)].map((m) => m.index);
  for (let k = 0; k < starts.length; k += maxWords) {
    const from = k === 0 ? 0 : starts[k]!;
    const to = k + maxWords < starts.length ? starts[k + maxWords]! : sentence.length;
    out.push({ sentence: sentence.slice(from, to), offset: offset + from });
  }
  return out;
}

/** Regroupe les lignes d'une phrase trop longue en morceaux de `maxWords` mots au plus ; une ligne trop longue est fenêtrée. */
function byLines(piece: Piece, maxWords: number): Piece[] {
  const out: Piece[] = [];
  let current: Piece | undefined;
  for (const m of piece.sentence.matchAll(/[^\n]*\n|[^\n]+$/g)) {
    const line = { sentence: m[0], offset: piece.offset + m.index };
    if (wordCount(line.sentence) > maxWords) {
      if (current) out.push(current);
      current = undefined;
      out.push(...windows(line, maxWords));
    } else if (current && wordCount(current.sentence) + wordCount(line.sentence) <= maxWords) {
      current.sentence += line.sentence;
    } else {
      if (current) out.push(current);
      current = { ...line };
    }
  }
  if (current) out.push(current);
  return out;
}

/**
 * Une phrase à la fois : le modèle accepte 512 sous-mots au plus. Une phrase sans ponctuation forte
 * trop longue (un poème sans point) est coupée aux retours à la ligne, puis par fenêtres de mots.
 */
export function splitSentences(text: string, maxWords = MAX_WORDS): Piece[] {
  return [...text.matchAll(/[^.!?…]+[.!?…]*\s*/g)].flatMap((m) => {
    const piece = { sentence: m[0], offset: m.index };
    return wordCount(piece.sentence) > maxWords ? byLines(piece, maxWords) : [piece];
  });
}

/** Retrouve la position de chaque sous-mot dans la phrase ; ignore ceux qu'on ne retrouve pas. */
export function locatePieces(sentence: string, offset: number, pieces: LabelledPiece[]): { start: number; label: string }[] {
  const located: { start: number; label: string }[] = [];
  let position = 0;
  for (const { piece, label } of pieces) {
    const trimmed = piece.trim();
    if (!trimmed) continue; // marqueurs de début et de fin
    const start = sentence.indexOf(trimmed, position);
    if (start < 0) continue; // sous-mot normalisé, introuvable tel quel
    position = start + trimmed.length;
    located.push({ start: offset + start, label });
  }
  return located;
}

/**
 * Étiqueteur neuronal : CamemBERT affiné pour l'étiquetage, exécuté localement. Un mot prend
 * l'étiquette de son premier sous-mot.
 */
export class CamembertTagger implements Tagger {
  readonly name = 'CamemBERT (modèle neuronal local)';
  readonly #classifier: PieceClassifier;

  constructor(classifier: PieceClassifier) {
    this.#classifier = classifier;
  }

  async tag(text: string): Promise<TaggedWord[]> {
    const pieces: { start: number; label: string }[] = [];
    for (const { sentence, offset } of splitSentences(text)) {
      const output = ClassifierOutputSchema.parse(await this.#classifier.classify(sentence));
      pieces.push(...locatePieces(sentence, offset, output));
    }
    let cursor = 0;
    return tokenize(text).map(({ word, start, end }) => {
      while (cursor < pieces.length && pieces[cursor]!.start < start) cursor++;
      const piece = pieces[cursor];
      return { word, category: categoryOfLabel(piece && piece.start < end ? piece.label : undefined) };
    });
  }
}

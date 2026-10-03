import { CATEGORIES, type Category } from '../../domain/categories.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import type { Block, ScoreLayout, System } from './types.ts';

/** Largeur d'un système, en caractères, quand l'appelant n'en donne pas. */
export const DEFAULT_WIDTH = 64;

/** Bornes de la largeur d'un système : assez pour une phrase, pas plus qu'une ligne lisible. */
export const MIN_WIDTH = 48;
export const MAX_WIDTH = 72;

/**
 * La largeur d'un système d'après la place disponible dans la colonne, en caractères de la
 * police de la partition ; bornée entre 48 et 72. Une mesure absente (colonne cachée) donne 48.
 */
export function systemWidth(availableChars: number): number {
  if (!Number.isFinite(availableChars)) return MIN_WIDTH;
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.floor(availableChars)));
}

const emptyLanes = () => Object.fromEntries(CATEGORIES.map((category) => [category, [] as Block[]])) as Record<Category, Block[]>;

/**
 * Dispose le texte en partition : il revient à la ligne en systèmes, comme une partition de
 * musique. Chaque système a pour règle une ligne du texte d'origine, et pose chaque mot sur la
 * piste de sa catégorie, à sa colonne dans la règle. On ne coupe jamais un mot : un mot plus
 * long que la largeur occupe seul un système plus large.
 * ponytail: les colonnes comptent des caractères ; juste avec une police à chasse fixe et des
 * caractères simples, approximatif pour les émojis.
 *
 * @param labels le mot à afficher pour certains mots (par position), à la place du mot d'origine
 */
export function layoutScore(
  text: string,
  tagged: readonly TaggedWord[],
  labels: ReadonlyMap<number, string> = new Map(),
  width: number = DEFAULT_WIDTH,
): ScoreLayout {
  const tokens = tokenize(text);
  if (tokens.length !== tagged.length) throw new Error('les mots étiquetés ne correspondent pas au découpage du texte');

  // Étendue de chaque système : on remplit jusqu'à la largeur, on coupe entre deux blocs de texte.
  const spans: { start: number; end: number }[] = [];
  let lineStart = 0;
  for (const line of text.split('\n')) {
    let start: number | undefined;
    let end = 0;
    for (const chunk of line.matchAll(/\S+/g)) {
      const chunkStart = lineStart + chunk.index;
      const chunkEnd = chunkStart + chunk[0].length;
      if (start !== undefined && chunkEnd - start > width) {
        spans.push({ start, end });
        start = undefined;
      }
      start ??= chunkStart;
      end = chunkEnd;
    }
    if (start !== undefined) spans.push({ start, end });
    lineStart += line.length + 1;
  }

  let next = 0; // premier mot pas encore posé
  const systems: System[] = spans.map(({ start, end }) => {
    const lanes = emptyLanes();
    for (; next < tokens.length && tokens[next]!.start < end; next++) {
      const token = tokens[next]!;
      const lane = lanes[tagged[next]!.category];
      const column = token.start - start;
      const previous = lane.at(-1);
      // Un mot remplacé plus long que l'original : le bloc précédent ne déborde pas sur celui-ci.
      if (previous) previous.width = Math.min(previous.width, Math.max(1, column - previous.column - 1));
      const label = labels.get(next) ?? token.word;
      lane.push({ index: next, label, column, width: Math.max(token.word.length, label.length) });
    }
    // Le dernier bloc d'une piste ne dépasse pas la fin du système.
    for (const lane of Object.values(lanes)) {
      const last = lane.at(-1);
      if (last) last.width = Math.max(1, Math.min(last.width, Math.max(end - start, width) - last.column));
    }
    return { ruler: text.slice(start, end), lanes };
  });
  return { systems };
}

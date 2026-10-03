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

// Blanc réservé après un mot dont le remplaçant est plus long : un caractère d'usage privé,
// pour que le découpage en systèmes ne sépare pas le mot de sa réserve.
const PAD = '\uE003';

/**
 * Dispose le texte en partition : il revient à la ligne en systèmes, comme une partition de
 * musique. Chaque système a pour règle une ligne du texte d'origine, et pose chaque mot sur la
 * piste de sa catégorie, à sa colonne dans la règle. Les mots s'écrivent toujours en entier :
 * quand un remplaçant est plus long que le mot d'origine, la règle reçoit des blancs après ce
 * mot, et ce qui suit se décale d'autant. On ne coupe jamais un mot : un mot plus long que la
 * largeur occupe seul un système plus large.
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

  // Le texte élargi : chaque mot suivi de la place que demande son remplaçant.
  let expanded = '';
  let cursor = 0;
  const starts = tokens.map((token, i) => {
    expanded += text.slice(cursor, token.start);
    const start = expanded.length;
    const label = labels.get(i) ?? token.word;
    expanded += token.word + PAD.repeat(Math.max(0, label.length - token.word.length));
    cursor = token.end;
    return start;
  });
  expanded += text.slice(cursor);

  // Étendue de chaque système : on remplit jusqu'à la largeur, on coupe entre deux blocs de texte.
  const spans: { start: number; end: number }[] = [];
  let lineStart = 0;
  for (const line of expanded.split('\n')) {
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
    for (; next < tokens.length && starts[next]! < end; next++) {
      const word = tokens[next]!.word;
      const label = labels.get(next) ?? word;
      lanes[tagged[next]!.category].push({ index: next, label, column: starts[next]! - start, width: Math.max(word.length, label.length) });
    }
    return { ruler: expanded.slice(start, end).replaceAll(PAD, ' '), lanes };
  });
  return { systems };
}

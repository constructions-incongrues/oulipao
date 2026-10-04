import type { OutputWord } from './s7/types.ts';
import { matchCase } from './text-case.ts';

// La règle commune du retrait d'un mot : son blanc (ponctuation, sauts de ligne) ne disparaît pas
// avec lui, il se fond dans celui du mot suivant. Partagée par toutes les contraintes qui retirent.

const STRONG = /[.!?…]/;
const MIDDLE = /[;:]/;
const PUNCTUATION = /[.!?…;:,]/;
/** Ce qui ferme : se colle au mot d'avant, avant la ponctuation. */
const CLOSING = /[»”)\]]/;
const PAIRS: Record<string, string> = { '«': '»', '“': '”', '(': ')', '[': ']' };

const strength = (mark: string) => (STRONG.test(mark) ? 3 : MIDDLE.test(mark) ? 2 : 1);

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
export { matchCase } from './text-case.ts';

/** Les espaces insécables du français : fine (devant « ; ! ? ») et normale (devant « : »). */
export const NARROW_NBSP = '\u202F';
export const NBSP = '\u00A0';

/**
 * Fond deux blancs qui se suivent, celui d'un mot retiré puis celui du mot d'après : les sauts de
 * ligne restent (le plus long des deux), une suite de ponctuation se réduit à son signe le plus
 * fort, les espaces suivent l'usage français. En tête de texte (`first`), la ponctuation tombe.
 */
export function mergeGaps(removed: string, next: string, first = false): string {
  const chars = [...removed, ...next];
  let closing = chars.filter((char) => CLOSING.test(char));
  let others = chars.filter((char) => !/\s/.test(char) && !PUNCTUATION.test(char) && !CLOSING.test(char));
  // Des guillemets ou des parenthèses qui n'entourent plus rien tombent ensemble.
  for (const [open, close] of Object.entries(PAIRS)) {
    if (others.includes(open) && closing.includes(close)) {
      others = others.filter((char) => char !== open);
      closing = closing.filter((char) => char !== close);
    }
  }
  const lines = Math.max(removed.split('\n').length, next.split('\n').length) - 1;
  // Le premier signe le plus fort ; une suite de signes forts (« ?! », « ... ») reste entière.
  const runs = chars.join('').match(/[.!?…]+|[;:,]/g) ?? [];
  const top = Math.max(0, ...runs.map((run) => strength(run[0]!)));
  const kept = first ? '' : (runs.find((run) => strength(run[0]!) === top) ?? '');
  // « ; : ! ? » prennent une espace avant eux ; la virgule et le point, non. Une espace insécable
  // (fine U+202F ou normale U+00A0) du texte d'origine reste celle qu'il avait choisie.
  const space = chars.find((char) => char === NARROW_NBSP || char === NBSP) ?? ' ';
  const punctuation = /^[;:!?]/.test(kept) ? `${space}${kept}` : kept;
  // En tête de texte, ni ponctuation ni blanc avant le premier mot.
  const separator = first || !chars.some((char) => /\s/.test(char)) ? '' : lines ? '\n'.repeat(lines) : ' ';
  // Le guillemet français fermant garde l'espace (fine, insécable ou simple) qui le précédait.
  const closingSpace = (removed.match(/[ \u00A0\u202F](?=»)/) ?? next.match(/[ \u00A0\u202F](?=»)/))?.[0] ?? '';
  const closed = closing.map((char) => (char === '»' ? `${closingSpace}»` : char)).join('');
  // Le guillemet français ouvrant prend une espace après lui.
  const opening = others.map((char) => (char === '«' ? '« ' : char)).join('');
  return `${first ? '' : closed}${punctuation}${separator}${opening}`;
}

/**
 * Retire le mot `index` : il ne garde ni sa sortie ni son blanc, qui passe au premier mot encore
 * visible après lui (ou à la fin du texte). Un mot retiré en tête de phrase lègue sa majuscule.
 * Rend la fin du texte, changée si le mot retiré était le dernier visible.
 */
/**
 * `previous` : la position du dernier mot encore visible avant `index` (-1 s'il n'y en a pas), quand
 * l'appelant la connaît parce qu'il retire dans l'ordre du texte ; sans elle, on la cherche. Un
 * retrait en boucle qui la passe reste linéaire même quand presque tout disparaît (le Bord en prose).
 */
export function removeWord(words: OutputWord[], index: number, tail: string, previous?: number): string {
  const word = words[index]!;
  // Le mot visible le plus proche de chaque côté, sans recopier le tableau : un retrait en boucle reste linéaire.
  let before = previous ?? index - 1;
  while (before >= 0 && !words[before]!.output) before--;
  const first = before < 0;
  const sentenceStart = first || STRONG.test(word.gap);
  let after = index + 1;
  while (after < words.length && !words[after]!.output) after++;
  const next = words[after];
  if (next && sentenceStart && word.output[0] !== word.output[0]!.toLowerCase()) next.output = matchCase(word.output, next.output);
  const gap = word.gap;
  word.output = '';
  word.gap = '';
  if (next) {
    next.gap = mergeGaps(gap, next.gap, first);
    return tail;
  }
  // En fin de texte, rien ne suit : seuls les blancs que la fin avait déjà restent.
  return mergeGaps(gap, tail, first).replace(/\s+$/, '') + tail.match(/\s*$/)![0];
}

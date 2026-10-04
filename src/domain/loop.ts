// La boucle de tours : la chaîne entière rejouée sur son propre résultat, tour après tour.
//
//   tour 0 (texte d'origine) ──chaîne──► tour 1 ──réétiquetage + chaîne──► tour 2 ──► … ──► tour n
//
// Ce module est pur : il repère un point fixe ou un cycle, et relie les mots d'un tour au suivant.
import { ownersOf, type OwnedSpan } from './plugin-chain.ts';
import { tokenize } from './tokenizer.ts';

/** Le dernier tour redonne un tour précédent : à partir de `from`, la suite se répète tous les `length` tours. */
export interface Repeat {
  from: number;
  /** 1 : point fixe ; plus : cycle. */
  length: number;
}

/**
 * Le dernier texte redonne-t-il, au caractère près, le texte d'un tour d'indice ≥ 1 ? Le tour 0 est
 * le texte d'origine, pas un résultat de la chaîne : le retrouver n'est pas une répétition.
 */
export function findRepeat(texts: readonly string[]): Repeat | undefined {
  const last = texts.length - 1;
  for (let j = last - 1; j >= 1; j--) {
    if (texts[j] === texts[last]) return { from: j, length: last - j };
  }
  return undefined;
}

/** Un morceau du texte résultant d'un tour : son texte, et le mot d'origine du tour qu'il remplace. */
export interface TourSegment {
  text: string;
  index?: number;
}

/**
 * Relie chaque mot d'origine d'un tour au premier mot de la source du tour suivant qui en descend.
 * La source du tour suivant est le texte résultant, réétiqueté : `tagText` garantit que ses mots
 * sont les jetons de `tokenize`, dans l'ordre. Un mot retiré n'a pas de descendant.
 */
export function alignTour(segments: readonly TourSegment[]): Map<number, number> {
  let text = '';
  const spans: OwnedSpan[] = [];
  for (const segment of segments) {
    if (segment.index !== undefined) spans.push({ index: segment.index, start: text.length, end: text.length + segment.text.length });
    text += segment.text;
  }
  const tokens = tokenize(text);
  const byIndex = new Map(spans.map((span) => [span.index, span]));
  const first = new Map<number, number>();
  ownersOf(spans, tokens).forEach((owner, k) => {
    // Un jeton hors de tout morceau rattaché revient au dernier mot commencé avant lui : ce n'est pas un descendant.
    const span = byIndex.get(owner);
    const inside = span !== undefined && tokens[k]!.start >= span.start && tokens[k]!.start < span.end;
    if (inside && !first.has(owner)) first.set(owner, k);
  });
  return first;
}

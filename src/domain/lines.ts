import type { OutputWord } from './s7/types.ts';

/**
 * Les lignes d'un texte, mot par mot : les positions des mots visibles de chaque ligne. Une ligne
 * commence au premier mot dont le blanc contient un saut de ligne ; un mot vide (retiré ou absorbé
 * par son voisin) n'appartient à aucune.
 */
export function linesOf(words: readonly OutputWord[]): number[][] {
  const lines: number[][] = [];
  for (const word of words) {
    if (!word.output) continue;
    if (!lines.length || word.gap.includes('\n')) lines.push([]);
    lines.at(-1)!.push(word.index);
  }
  return lines;
}

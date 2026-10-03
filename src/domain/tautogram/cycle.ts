import type { Category } from '../categories.ts';
import type { TaggedWord } from '../tagged-word.ts';

/**
 * La lettre de chaque mot que le filtre atteint : un mot d'une piste visée (hors mots-outils) dont
 * le pas n'est pas bouché prend la lettre suivante de la liste, dans l'ordre du texte, en boucle.
 * Le calcul se fait sur l'étiquetage, pour que le cycle ne dépende pas des remplacements.
 */
export function assignLetters(
  tagged: readonly TaggedWord[],
  targets: ReadonlySet<Category>,
  skip: ReadonlySet<number>,
  letters: readonly string[],
): Map<number, string> {
  const assigned = new Map<number, string>();
  if (!letters.length) return assigned;
  tagged.forEach((word, index) => {
    if (word.category === 'other' || !targets.has(word.category) || skip.has(index)) return;
    assigned.set(index, letters[assigned.size % letters.length]!);
  });
  return assigned;
}

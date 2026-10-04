import type { ScaleCategory, ScaleOrder } from '../domain/s7/types.ts';

/**
 * Port : les échelles affectives (valence, intensité, concrétude) des noms et des adjectifs, tirées de
 * normes publiées. Elles rangent la liste que parcourt le S+n quand son ordre n'est pas alphabétique.
 */
export interface ScaleRepository {
  /** Les lemmes notés d'une catégorie, de la note la plus basse à la plus haute ; vide si l'échelle n'existe pas. */
  scale(order: ScaleOrder, category: ScaleCategory): readonly string[];
  /** La note d'un lemme, de 0 à 100, ou rien s'il n'est pas noté. */
  score(order: ScaleOrder, category: ScaleCategory, lemma: string): number | undefined;
}

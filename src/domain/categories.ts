import { z } from 'zod';

/**
 * Les cinq catégories de l'essai. `noun` = nom commun ; les noms propres vont dans `other`
 * (conventions d'annotation : reference/FORMAT.md).
 */
export const CATEGORIES = ['noun', 'verb', 'adjective', 'adverb', 'other'] as const;

export const CategorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof CategorySchema>;

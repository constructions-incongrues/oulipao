import { z } from 'zod';
import type { ConcreteGender, ConcreteNumber } from './types.ts';

/**
 * Table des déterminants que le moteur sait réaccorder et élider. `de-definite` et
 * `a-definite` sont les articles contractés (du, de la, de l', des ; au, à la, à l', aux) ;
 * `de` est la préposition nue devant un nom sans article (« beaucoup de », « d'habitants »).
 */
export const DeterminerKindSchema = z.enum([
  'definite', 'indefinite', 'de-definite', 'a-definite', 'demonstrative', 'possessive', 'de',
]);
export type DeterminerKind = z.infer<typeof DeterminerKindSchema>;

export const DeterminerSchema = z.object({
  kind: DeterminerKindSchema,
  /** Absent quand la forme ne dit pas le nombre (« de »). */
  number: z.enum(['s', 'p']).optional(),
  /** Absent quand la forme ne dit pas le genre (« l' », « les », « mon » devant voyelle…). */
  gender: z.enum(['m', 'f']).optional(),
  /** Possessif : m (mon), t (ton), s (son). */
  owner: z.enum(['m', 't', 's']).optional(),
});
export type Determiner = z.infer<typeof DeterminerSchema>;

const d = (kind: DeterminerKind, number?: ConcreteNumber, gender?: ConcreteGender, owner?: 'm' | 't' | 's'): Determiner =>
  ({ kind, ...(number && { number }), ...(gender && { gender }), ...(owner && { owner }) });

/** Formes en un mot (minuscules, apostrophe droite). */
const SINGLE: Record<string, Determiner> = {
  le: d('definite', 's', 'm'), la: d('definite', 's', 'f'), "l'": d('definite', 's'), les: d('definite', 'p'),
  un: d('indefinite', 's', 'm'), une: d('indefinite', 's', 'f'), des: d('indefinite', 'p'),
  du: d('de-definite', 's', 'm'), au: d('a-definite', 's', 'm'), aux: d('a-definite', 'p'),
  ce: d('demonstrative', 's', 'm'), cet: d('demonstrative', 's', 'm'), cette: d('demonstrative', 's', 'f'),
  ces: d('demonstrative', 'p'),
  // « mon amie » : mon/ton/son devant voyelle ne dit pas le genre.
  mon: d('possessive', 's', undefined, 'm'), ma: d('possessive', 's', 'f', 'm'), mes: d('possessive', 'p', undefined, 'm'),
  ton: d('possessive', 's', undefined, 't'), ta: d('possessive', 's', 'f', 't'), tes: d('possessive', 'p', undefined, 't'),
  son: d('possessive', 's', undefined, 's'), sa: d('possessive', 's', 'f', 's'), ses: d('possessive', 'p', undefined, 's'),
  de: d('de'), "d'": d('de'),
};

const normalize = (word: string) => word.toLowerCase().replace('’', "'");

export interface IdentifiedDeterminer {
  determiner: Determiner;
  /** Nombre de mots occupés par le déterminant (2 pour « de la », « à l' »). */
  consumed: 1 | 2;
}

/**
 * Reconnaît le déterminant dans les mots qui précèdent le groupe nominal.
 * @param preceding les mots juste avant le groupe, le plus proche en dernier
 */
export function identifyDeterminer(preceding: readonly string[]): IdentifiedDeterminer | undefined {
  const last = preceding.at(-1);
  if (last === undefined) return undefined;
  const determiner = SINGLE[normalize(last)];
  if (!determiner) return undefined;
  const before = preceding.length > 1 ? normalize(preceding.at(-2)!) : undefined;
  // « de la », « de l' », « à la », « à l' » : article contracté écrit en deux mots.
  if (determiner.kind === 'definite' && determiner.number === 's' && normalize(last) !== 'le') {
    if (before === 'de') return { determiner: { ...determiner, kind: 'de-definite' }, consumed: 2 };
    if (before === 'à') return { determiner: { ...determiner, kind: 'a-definite' }, consumed: 2 };
  }
  return { determiner, consumed: 1 };
}

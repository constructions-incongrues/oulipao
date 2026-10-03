import { z } from 'zod';
import type { ConcreteGender, ConcreteNumber } from './types.ts';

/**
 * Table des déterminants que le moteur sait réaccorder et élider. `de-definite` et
 * `a-definite` sont les articles contractés (du, de la, de l', des ; au, à la, à l', aux) ;
 * `de` est la préposition nue devant un nom sans article (« beaucoup de », « d'habitants »).
 * `variable` : déterminant à quatre formes (certain, quel, tout…). `invariable` : même forme aux
 * deux genres (plusieurs, chaque, notre…), reconnu pour le nombre qu'il indique.
 */
export const DeterminerKindSchema = z.enum([
  'definite', 'indefinite', 'de-definite', 'a-definite', 'demonstrative', 'possessive', 'de',
  'variable', 'invariable',
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
  /** `variable` : l'entrée de la table des formes. `invariable` : le mot lui-même. */
  lemma: z.string().optional(),
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

/** Déterminants variables : masculin singulier, féminin singulier, masculin pluriel, féminin pluriel. */
export const VARIABLE_FORMS: Record<string, readonly [string, string, string, string]> = {
  certain: ['certain', 'certaine', 'certains', 'certaines'],
  quel: ['quel', 'quelle', 'quels', 'quelles'],
  tout: ['tout', 'toute', 'tous', 'toutes'],
  aucun: ['aucun', 'aucune', 'aucuns', 'aucunes'],
  nul: ['nul', 'nulle', 'nuls', 'nulles'],
  tel: ['tel', 'telle', 'tels', 'telles'],
  maint: ['maint', 'mainte', 'maints', 'maintes'],
  divers: ['divers', 'diverse', 'divers', 'diverses'],
  différent: ['différent', 'différente', 'différents', 'différentes'],
};
for (const [lemma, forms] of Object.entries(VARIABLE_FORMS)) {
  forms.forEach((form, i) => {
    // « divers » : même forme au masculin singulier et pluriel ; on retient le pluriel, seul emploi comme déterminant.
    SINGLE[form] = { kind: 'variable', lemma, number: i < 2 ? 's' : 'p', gender: i % 2 ? 'f' : 'm' };
  });
}
const INVARIABLE: Record<string, ConcreteNumber> = {
  notre: 's', votre: 's', leur: 's', chaque: 's', nos: 'p', vos: 'p', leurs: 'p', quelques: 'p', plusieurs: 'p',
};
for (const [form, number] of Object.entries(INVARIABLE)) SINGLE[form] = { kind: 'invariable', lemma: form, number };

const normalize = (word: string) => word.toLowerCase().replace('’', "'");

/** « tout » devant un autre déterminant (« toute la ville ») : forme au genre et au nombre voulus. */
export function isTout(word: string): boolean {
  return VARIABLE_FORMS['tout']!.includes(normalize(word));
}

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

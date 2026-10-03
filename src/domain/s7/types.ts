import { z } from 'zod';

/** Genre : masculin, féminin, épicène (les deux). */
export const GenderSchema = z.enum(['m', 'f', 'e']);
export type Gender = z.infer<typeof GenderSchema>;
/** Genre effectif d'un groupe nominal dans une phrase : jamais épicène. */
export type ConcreteGender = Exclude<Gender, 'e'>;

/** Nombre : singulier, pluriel, invariable. */
export const GrammaticalNumberSchema = z.enum(['s', 'p', 'i']);
export type GrammaticalNumber = z.infer<typeof GrammaticalNumberSchema>;
export type ConcreteNumber = Exclude<GrammaticalNumber, 'i'>;

export const NounFormSchema = z.object({
  form: z.string().min(1),
  lemma: z.string().min(1),
  gender: GenderSchema,
  number: GrammaticalNumberSchema,
});
export type NounForm = z.infer<typeof NounFormSchema>;

export const AdjectiveFormSchema = z.object({
  form: z.string().min(1),
  /** Ce qui relie les formes d'un même adjectif : son lemme (l'infinitif pour un participe). */
  paradigm: z.string().min(1),
  gender: GenderSchema,
  number: GrammaticalNumberSchema,
});
export type AdjectiveForm = z.infer<typeof AdjectiveFormSchema>;

/** `same-gender` : on ne compte que les noms du même genre. `reagree` : S+7 strict, puis réaccord. */
export const S7ModeSchema = z.enum(['same-gender', 'reagree']);
export type S7Mode = z.infer<typeof S7ModeSchema>;

export const S7OptionsSchema = z.object({
  /** Le « 7 » du S+7 ; négatif pour revenir en arrière. */
  offset: z.number().int().default(7),
  mode: S7ModeSchema.default('same-gender'),
  /** Catégorie visée. Seuls les noms sont pris en charge ; le paramètre réserve la place des autres. */
  category: z.enum(['noun']).default('noun'),
});
export type S7Options = z.infer<typeof S7OptionsSchema>;
export type S7OptionsInput = z.input<typeof S7OptionsSchema>;

/** `unknown-noun` : absent du dictionnaire. `missing-form` : le nouveau lemme n'a pas la forme voulue. */
export const SubstitutionStatusSchema = z.enum(['replaced', 'unknown-noun', 'missing-form']);
export type SubstitutionStatus = z.infer<typeof SubstitutionStatusSchema>;

export const SubstitutionSchema = z.object({
  /** Position du nom dans le découpage du texte d'origine. */
  index: z.number().int().nonnegative(),
  original: z.string(),
  /** Égal à `original` si le nom n'a pas été remplacé. */
  replacement: z.string(),
  status: SubstitutionStatusSchema,
  /** Le groupe nominal (déterminant, adjectifs, nom) avant et après. */
  before: z.string(),
  after: z.string(),
});
export type Substitution = z.infer<typeof SubstitutionSchema>;

export const S7ResultSchema = z.object({ text: z.string(), substitutions: z.array(SubstitutionSchema) });
export type S7Result = z.infer<typeof S7ResultSchema>;

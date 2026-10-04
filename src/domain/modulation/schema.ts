import { z } from 'zod';
import { CategorySchema } from '../categories.ts';

// Un modulateur fait varier un paramètre verrouillable mot par mot, selon une source qu'on énonce
// en une phrase ; une porte décide, avec la même source, quels mots l'instance traite.

/** Les bornes d'un entier saisi dans un modulateur (base, profondeur, motif, rampe, k, n). */
const Int = z.number().int().min(-999).max(999);

/** Ce qu'on lit : une propriété du mot, ou sa place parmi les mots que l'instance traite. */
export const SourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('letters') }),
  z.object({ kind: z.literal('syllables') }),
  z.object({ kind: z.literal('vowels') }),
  /** Les occurrences d'une lettre, accents ignorés. */
  z.object({ kind: z.literal('letter'), letter: z.string().regex(/^\p{L}$/u) }),
  z.object({ kind: z.literal('rank') }),
  z.object({ kind: z.literal('line') }),
  /** Des valeurs répétées sur les mots traités. */
  z.object({ kind: z.literal('pattern'), values: z.array(Int).min(1).max(32) }),
  /** D'une valeur au premier mot traité à une autre au dernier. */
  z.object({ kind: z.literal('ramp'), from: Int, to: Int }),
]);
export type Source = z.infer<typeof SourceSchema>;

/** Les sources qui lisent un mot, et peuvent donc lire son voisin. */
export const WORD_SOURCES: readonly Source['kind'][] = ['letters', 'syllables', 'vowels', 'letter'];
export const isWordSource = (source: Source) => WORD_SOURCES.includes(source.kind);

/** Le mot lu : celui que reçoit l'instance, ou le plus proche d'une piste avant ou après lui dans sa phrase. */
export const ReadSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('self') }),
  z.object({ kind: z.literal('neighbour'), track: CategorySchema, side: z.enum(['before', 'after']) }),
]);
export type Read = z.infer<typeof ReadSchema>;

const SELF: Read = { kind: 'self' };

/** Seule une source de mot peut lire un voisin. */
const readsAWord = (value: { source: Source; read: Read }) => value.read.kind === 'self' || isWordSource(value.source);
const NEIGHBOUR_ERROR = { message: 'seule une source de mot lit un voisin', path: ['read'] };

/** Un modulateur : `base + profondeur × source`, replié dans les bornes du paramètre. */
export const ModulatorSchema = z
  .object({ source: SourceSchema, read: ReadSchema.default(SELF), base: Int.default(0), depth: Int.default(1) })
  .refine(readsAWord, NEIGHBOUR_ERROR);
export type Modulator = z.infer<typeof ModulatorSchema>;

/** Le test d'une porte ; l'Euclide E(k,n) ne se pose que sur le rang. */
export const GateTestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('even') }),
  z.object({ kind: z.literal('odd') }),
  z.object({ kind: z.literal('at-least'), k: Int }),
  z.object({ kind: z.literal('at-most'), k: Int }),
  z.object({ kind: z.literal('euclid'), k: z.number().int().min(0).max(64), n: z.number().int().min(1).max(64) }).refine((test) => test.k <= test.n, {
    message: 'k ne dépasse pas n',
  }),
]);
export type GateTest = z.infer<typeof GateTestSchema>;

/** Une porte : le mot est traité seulement si la source passe le test. */
export const GateSchema = z
  .object({ source: SourceSchema, read: ReadSchema.default(SELF), test: GateTestSchema })
  .refine(readsAWord, NEIGHBOUR_ERROR)
  .refine((gate) => gate.test.kind !== 'euclid' || gate.source.kind === 'rank', { message: 'l’Euclide se pose sur le rang', path: ['test'] });
export type Gate = z.infer<typeof GateSchema>;

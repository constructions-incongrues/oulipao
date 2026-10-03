import { z } from 'zod';
import { CategorySchema, type Category } from '../../domain/categories.ts';
import { TracksSchema } from '../../domain/mixing.ts';
import { ParameterValuesSchema } from '../../domain/plugin.ts';

/** Nom des pistes, tel qu'affiché. */
export const TRACK_NAMES: Record<Category, string> = {
  noun: 'Noms',
  verb: 'Verbes',
  adjective: 'Adjectifs',
  adverb: 'Adverbes',
  other: 'Autres',
};

/** Les mots d'une piste, au singulier et au pluriel : « 1 nom remplacé », « 3 noms remplacés ». */
export const TRACK_UNITS: Record<Category, [string, string]> = {
  noun: ['nom', 'noms'],
  verb: ['verbe', 'verbes'],
  adjective: ['adjectif', 'adjectifs'],
  adverb: ['adverbe', 'adverbes'],
  other: ['mot', 'mots'],
};

/** L'état d'une contrainte branchée : en marche ou coupée, et ses réglages. */
export const PluginStateSchema = z.object({ enabled: z.boolean(), params: ParameterValuesSchema });
export type PluginState = z.infer<typeof PluginStateSchema>;

/** Un verrou : la valeur propre d'un paramètre entier de l'instance pour un mot d'origine. */
export const LockSchema = z.object({ index: z.number().int().nonnegative(), key: z.string().min(1), value: z.number().int() });
export type Lock = z.infer<typeof LockSchema>;

/** Une instance de filtre : un exemplaire d'une contrainte, avec ses réglages et ses pistes visées. */
export const InstanceSchema = PluginStateSchema.extend({
  id: z.string().min(1),
  /** L'identifiant du type de contrainte (« s7 », « lipogram »). */
  type: z.string().min(1),
  targets: z.array(CategorySchema).min(1),
  /** Absent : aucun verrou. */
  locks: z.array(LockSchema).optional(),
});
export type Instance = z.infer<typeof InstanceSchema>;

/** L'état de la table de mixage : les pistes, et les instances dans l'ordre de la chaîne. */
export const MixerStateSchema = z.object({
  tracks: TracksSchema,
  instances: z.array(InstanceSchema),
  /** Les mots d’origine aux pas bouchés : aucun filtre ne les touche. Absent : aucun. */
  closed: z.array(z.number().int().nonnegative()).optional(),
});
export type MixerState = z.infer<typeof MixerStateSchema>;

/** Les gestes possibles sur la table. */
export const MixerActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('toggle-mute'), category: CategorySchema }),
  z.object({ type: z.literal('toggle-solo'), category: CategorySchema }),
  z.object({ type: z.literal('toggle-instance'), id: z.string().min(1) }),
  z.object({ type: z.literal('set-param'), id: z.string().min(1), key: z.string().min(1), value: z.union([z.number(), z.string()]) }),
  /** Les pistes visées par une instance : au moins une, parmi celles de son type. */
  z.object({ type: z.literal('set-targets'), id: z.string().min(1), targets: z.array(CategorySchema).min(1) }),
  /** Ajoute une instance d'un type, en fin de chaîne. */
  z.object({ type: z.literal('add-instance'), plugin: z.string().min(1) }),
  z.object({ type: z.literal('duplicate-instance'), id: z.string().min(1) }),
  z.object({ type: z.literal('remove-instance'), id: z.string().min(1) }),
  /** Place une instance à une position de la chaîne. */
  z.object({ type: z.literal('move-instance'), id: z.string().min(1), position: z.number().int().nonnegative() }),
  /** Bouche le pas d'un mot d'origine, ou le rouvre. */
  z.object({ type: z.literal('toggle-step'), index: z.number().int().nonnegative() }),
  /** Verrouille un paramètre entier d'une instance pour un mot d'origine. */
  z.object({ type: z.literal('set-lock'), id: z.string().min(1), index: z.number().int().nonnegative(), key: z.string().min(1), value: z.number().int() }),
  z.object({ type: z.literal('clear-lock'), id: z.string().min(1), index: z.number().int().nonnegative(), key: z.string().min(1) }),
  /** Rouvre tous les pas et retire tous les verrous : à chaque nouvel étiquetage. */
  z.object({ type: z.literal('reset-steps') }),
]);
export type MixerAction = z.infer<typeof MixerActionSchema>;

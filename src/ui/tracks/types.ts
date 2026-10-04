import { z } from 'zod';
import { CategorySchema, type Category } from '../../domain/categories.ts';
import { TracksSchema } from '../../domain/mixing.ts';
import { ParameterValuesSchema } from '../../domain/plugin.ts';
import { FormSchema } from '../../domain/forms/form.ts';
import { GateSchema, ModulatorSchema } from '../../domain/modulation/schema.ts';

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

/** Une instance de contrainte : un exemplaire, avec ses réglages et ses pistes visées. */
export const InstanceSchema = PluginStateSchema.extend({
  id: z.string().min(1),
  /** L'identifiant du type de contrainte (« s7 », « lipogram »). */
  type: z.string().min(1),
  targets: z.array(CategorySchema).min(1),
  /** Absent : aucun verrou. */
  locks: z.array(LockSchema).optional(),
  /**
   * Les paramètres modulés, par clé ; absent : aucun. Un modulateur illisible (carnet ancien ou
   * abîmé) est oublié sans perdre l'instance, qui garde ses valeurs fixes.
   */
  modulators: z.record(z.string(), ModulatorSchema).optional().catch(undefined),
  /** La porte : les mots que l'instance laisse passer ; absente : tous. Illisible, elle est oubliée. */
  gate: GateSchema.optional().catch(undefined),
  /**
   * Le nom de la recette qui l'a branchée, avec son choix (« Monovocalisme (a) ») ; absent pour un
   * moteur branché nu. Il tombe dès qu'on règle l'instance autrement que la recette.
   */
  recipe: z.string().min(1).optional(),
});
export type Instance = z.infer<typeof InstanceSchema>;

/** L'état de la table de mixage : les pistes, et les instances dans l'ordre de la chaîne. */
export const MixerStateSchema = z.object({
  tracks: TracksSchema,
  instances: z.array(InstanceSchema),
  /** Les mots d’origine aux pas bouchés : aucune contrainte ne les touche. Absent : aucun. */
  closed: z.array(z.number().int().nonnegative()).optional(),
  /** La forme à refrain posée sur le texte résultant, après la chaîne. Absente : aucune. */
  form: FormSchema.optional(),
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
  /**
   * Branche une recette en fin de chaîne : son réglage choisi, s'il en a un, et le jour du
   * branchement (« 2026-10-03 »), pour que le geste reste rejouable.
   */
  z.object({ type: z.literal('add-recipe'), recipe: z.string().min(1), choice: z.string().min(1).optional(), today: z.string().date() }),
  z.object({ type: z.literal('duplicate-instance'), id: z.string().min(1) }),
  z.object({ type: z.literal('remove-instance'), id: z.string().min(1) }),
  /** Place une instance à une position de la chaîne. */
  z.object({ type: z.literal('move-instance'), id: z.string().min(1), position: z.number().int().nonnegative() }),
  /** Bouche le pas d'un mot d'origine, ou le rouvre. */
  z.object({ type: z.literal('toggle-step'), index: z.number().int().nonnegative() }),
  /** Verrouille un paramètre entier d'une instance pour un mot d'origine. */
  z.object({ type: z.literal('set-lock'), id: z.string().min(1), index: z.number().int().nonnegative(), key: z.string().min(1), value: z.number().int() }),
  z.object({ type: z.literal('clear-lock'), id: z.string().min(1), index: z.number().int().nonnegative(), key: z.string().min(1) }),
  /** Module un paramètre verrouillable d'une instance. */
  z.object({ type: z.literal('set-modulator'), id: z.string().min(1), key: z.string().min(1), modulator: ModulatorSchema }),
  /** Rend au paramètre sa valeur fixe. */
  z.object({ type: z.literal('clear-modulator'), id: z.string().min(1), key: z.string().min(1) }),
  z.object({ type: z.literal('set-gate'), id: z.string().min(1), gate: GateSchema }),
  z.object({ type: z.literal('clear-gate'), id: z.string().min(1) }),
  /** Rouvre tous les pas et retire tous les verrous : à chaque nouvel étiquetage. */
  z.object({ type: z.literal('reset-steps') }),
  /** Choisit la forme à refrain du texte résultant. */
  z.object({ type: z.literal('set-form'), form: FormSchema }),
]);
export type MixerAction = z.infer<typeof MixerActionSchema>;

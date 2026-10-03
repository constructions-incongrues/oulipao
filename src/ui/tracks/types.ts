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

/** Le plugin branché sur sa piste : en marche ou coupé, et ses réglages. */
export const PluginStateSchema = z.object({ enabled: z.boolean(), params: ParameterValuesSchema });
export type PluginState = z.infer<typeof PluginStateSchema>;

/** L'état de la table de mixage : les pistes, les plugins installés (par identifiant) et l'ordre de leur chaîne. */
export const MixerStateSchema = z.object({
  tracks: TracksSchema,
  plugins: z.record(z.string(), PluginStateSchema),
  order: z.array(z.string()),
});
export type MixerState = z.infer<typeof MixerStateSchema>;

/** Les gestes possibles sur la table. */
export const MixerActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('toggle-mute'), category: CategorySchema }),
  z.object({ type: z.literal('toggle-solo'), category: CategorySchema }),
  z.object({ type: z.literal('toggle-plugin'), id: z.string().min(1) }),
  z.object({ type: z.literal('set-param'), id: z.string().min(1), key: z.string().min(1), value: z.union([z.number(), z.string()]) }),
  /** Place un plugin à une position de la chaîne. */
  z.object({ type: z.literal('move-plugin'), id: z.string().min(1), position: z.number().int().nonnegative() }),
]);
export type MixerAction = z.infer<typeof MixerActionSchema>;

/** Un mot posé sur sa piste. */
export const BlockSchema = z.object({
  /** Position du mot dans le découpage du texte d'origine. */
  index: z.number().int().nonnegative(),
  /** Le mot affiché : le mot d'origine, ou celui qui le remplace quand le plugin agit. */
  label: z.string().min(1),
  /** Colonne du mot dans la règle du système, en caractères. */
  column: z.number().int().nonnegative(),
  /** Largeur affichée, en caractères. */
  width: z.number().int().positive(),
});
export type Block = z.infer<typeof BlockSchema>;

/** Un système : une ligne du texte d'origine (la règle) et ses pistes. */
export const SystemSchema = z.object({
  ruler: z.string(),
  lanes: z.record(CategorySchema, z.array(BlockSchema)),
});
export type System = z.infer<typeof SystemSchema>;

export const ScoreLayoutSchema = z.object({ systems: z.array(SystemSchema) });
export type ScoreLayout = z.infer<typeof ScoreLayoutSchema>;

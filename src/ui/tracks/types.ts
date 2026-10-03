import { z } from 'zod';
import { CategorySchema, type Category } from '../../domain/categories.ts';
import { TracksSchema } from '../../domain/mixing.ts';
import { S7ModeSchema } from '../../domain/s7/types.ts';

/** Nom des pistes, tel qu'affiché. */
export const TRACK_NAMES: Record<Category, string> = {
  noun: 'Noms',
  verb: 'Verbes',
  adjective: 'Adjectifs',
  adverb: 'Adverbes',
  other: 'Autres',
};

/** Bornes du décalage du S+7. */
export const MIN_OFFSET = -99;
export const MAX_OFFSET = 99;
export const OffsetSchema = z.number().int().min(MIN_OFFSET).max(MAX_OFFSET);

/** Le plugin S+7 branché sur la piste des noms. */
export const PluginStateSchema = z.object({
  enabled: z.boolean(),
  offset: OffsetSchema,
  mode: S7ModeSchema,
});
export type PluginState = z.infer<typeof PluginStateSchema>;

/** L'état de la table de mixage : les pistes et le plugin. */
export const MixerStateSchema = z.object({ tracks: TracksSchema, plugin: PluginStateSchema });
export type MixerState = z.infer<typeof MixerStateSchema>;

/** Les gestes possibles sur la table. */
export const MixerActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('toggle-mute'), category: CategorySchema }),
  z.object({ type: z.literal('toggle-solo'), category: CategorySchema }),
  z.object({ type: z.literal('toggle-plugin') }),
  z.object({ type: z.literal('set-offset'), offset: OffsetSchema }),
  z.object({ type: z.literal('set-mode'), mode: S7ModeSchema }),
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

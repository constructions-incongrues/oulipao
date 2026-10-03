import { z } from 'zod';
import type { MorphologyRepository } from '../ports/morphology.ts';
import { CategorySchema } from './categories.ts';
import type { OutputWord } from './s7/types.ts';
import type { TaggedWord } from './tagged-word.ts';

// Le contrat entre l'hôte (la page à pistes) et une contrainte. Contrat interne : il n'est ni
// versionné ni publié ; la stratégie attend trois contraintes avant d'ouvrir un format.

/** Un paramètre entier, borné : l'hôte en fait un champ numérique. */
export const IntegerParameterSchema = z.object({
  kind: z.literal('integer'),
  key: z.string().min(1),
  label: z.string().min(1),
  min: z.number().int(),
  max: z.number().int(),
});

/** Un paramètre à choix : l'hôte en fait une liste. */
export const ChoiceParameterSchema = z.object({
  kind: z.literal('choice'),
  key: z.string().min(1),
  label: z.string().min(1),
  options: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(1),
});

export const ParameterSchema = z.discriminatedUnion('kind', [IntegerParameterSchema, ChoiceParameterSchema]);
export type Parameter = z.infer<typeof ParameterSchema>;

/** Les valeurs des paramètres, par clé. */
export const ParameterValuesSchema = z.record(z.string(), z.union([z.number(), z.string()]));
export type ParameterValues = z.infer<typeof ParameterValuesSchema>;

/** Ce que la contrainte a fait d'un mot : remplacé, retiré, ou laissé tel quel et pourquoi. */
export const WordMarkSchema = z.object({
  index: z.number().int().nonnegative(),
  original: z.string(),
  /** Présent si le mot a été remplacé. */
  replacement: z.string().optional(),
  /** Présent si le mot a été retiré du texte. */
  removed: z.literal(true).optional(),
  /** Présent si le mot a été laissé tel quel : la raison, en clair. */
  reason: z.string().optional(),
});
export type WordMark = z.infer<typeof WordMarkSchema>;

/** Une piste, ou toutes : une contrainte comme le lipogramme agit partout, comme un effet sur le bus master. */
export const PluginTrackSchema = z.union([CategorySchema, z.literal('all')]);
export type PluginTrack = z.infer<typeof PluginTrackSchema>;

/** Le texte transformé, mot par mot, et ce que la contrainte a fait des mots qu'elle a touchés. */
export interface PluginResult {
  /** Un élément par mot du texte d'origine, comme `plainWords`. */
  words: OutputWord[];
  tail: string;
  marks: WordMark[];
}

/** Ce que l'hôte prête à une contrainte : ses textbanks. */
export interface PluginResources {
  morphology: MorphologyRepository;
}

export interface ConstraintPlugin {
  id: string;
  /** Le nom court, sur le bouton de marche : « S+7 ». */
  name: string;
  /** La piste sur laquelle la contrainte se branche, ou toutes. */
  track: PluginTrack;
  /** Les paramètres, dans l'ordre d'affichage. */
  parameters: Parameter[];
  /** Les valeurs à l'ouverture. */
  defaults: ParameterValues;
  /** Valide des valeurs et complète celles qui manquent ; lève si elles ne conviennent pas. */
  parse(values: ParameterValues): ParameterValues;
  /** Ces réglages changent-ils le texte ? (Le S+0, non.) */
  acts(values: ParameterValues): boolean;
  /** Le titre court du réglage en cours : « S+3 ». */
  title(values: ParameterValues): string;
  /** Le réglage en clair, pour le résumé et la mention : « S+3, parmi tous les noms ». */
  label(values: ParameterValues): string;
  /** L'effet du réglage en une phrase. */
  help(values: ParameterValues): string;
  /**
   * Applique la contrainte au texte étiqueté. Dans une chaîne, la page lui passe la sortie du
   * plugin précédent, relue comme un texte (voir `plugin-chain.ts`).
   */
  apply(text: string, tagged: readonly TaggedWord[], values: ParameterValues, resources: PluginResources): PluginResult;
}

const DeclarationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  track: PluginTrackSchema,
  parameters: z.array(ParameterSchema),
});

/** Déclare une contrainte : vérifie sa déclaration et que ses valeurs d'ouverture lui conviennent. */
export function definePlugin(plugin: ConstraintPlugin): ConstraintPlugin {
  DeclarationSchema.parse(plugin);
  const keys = plugin.parameters.map((parameter) => parameter.key);
  if (new Set(keys).size !== keys.length) throw new Error(`${plugin.id} : deux paramètres portent la même clé`);
  for (const parameter of plugin.parameters) {
    if (parameter.kind === 'integer' && parameter.min > parameter.max) throw new Error(`${plugin.id} : bornes inversées pour ${parameter.key}`);
  }
  plugin.parse(plugin.defaults);
  return plugin;
}

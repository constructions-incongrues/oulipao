import { z } from 'zod';
import type { MorphologyRepository } from '../ports/morphology.ts';
import type { PhoneticsRepository } from '../ports/phonetics.ts';
import type { VerbRepository } from '../ports/verbs.ts';
import { CATEGORIES, CategorySchema, type Category } from './categories.ts';
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
  /** Un mot peut recevoir sa propre valeur (un verrou) : seulement si `apply` lit `scope.overrides` pour ce paramètre. */
  lockable: z.literal(true).optional(),
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

/**
 * Ce que la contrainte a fait d'un mot : remplacé, retiré, remis en ligne (seul son blanc a
 * changé), ou laissé tel quel et pourquoi.
 */
export const WordMarkSchema = z.object({
  index: z.number().int().nonnegative(),
  original: z.string(),
  /** Présent si le mot a été remplacé. */
  replacement: z.string().optional(),
  /** Présent si le mot a été retiré du texte. */
  removed: z.literal(true).optional(),
  /** Présent si seul le blanc qui précède le mot a changé (une coupe de ligne). */
  relaid: z.literal(true).optional(),
  /** Présent si le mot a été laissé tel quel : la raison, en clair. */
  reason: z.string().optional(),
});
export type WordMark = z.infer<typeof WordMarkSchema>;

/**
 * La portée d'une contrainte mot par mot, en positions du texte qu'elle reçoit : les mots qu'elle
 * laisse (pas bouchés) et les valeurs propres à certains mots (verrous).
 */
export const WordScopeSchema = z.object({
  skip: z.array(z.number().int().nonnegative()),
  overrides: z.array(z.object({ index: z.number().int().nonnegative(), values: ParameterValuesSchema })),
});
export type WordScope = z.infer<typeof WordScopeSchema>;

/** Aucune exception : la contrainte traite tous les mots de ses pistes avec ses réglages. */
export const FULL_SCOPE: WordScope = { skip: [], overrides: [] };

/** Le texte transformé, mot par mot, et ce que la contrainte a fait des mots qu'elle a touchés. */
export interface PluginResult {
  /** Un élément par mot du texte d'origine, comme `plainWords`. */
  words: OutputWord[];
  tail: string;
  marks: WordMark[];
}

/** Ce que l'hôte prête à une contrainte : ses textbanks. Les verbes et les prononciations arrivent après, à la demande. */
export interface PluginResources {
  morphology: MorphologyRepository;
  verbs?: VerbRepository;
  phonetics?: PhoneticsRepository;
}

export interface ConstraintPlugin {
  id: string;
  /**
   * `false` : la contrainte agit sur tout le texte, sans choix de pistes (une mise en page). Elle
   * déclare alors les cinq pistes, toutes visées par défaut.
   */
  targetable?: false;
  /** Le nom court, sur le bouton de marche : « S+7 ». */
  name: string;
  /** Les pistes que la contrainte sait traiter : une instance choisit les siennes parmi elles. */
  tracks: readonly Category[];
  /** La contrainte a-t-elle besoin des prononciations ? L'hôte les charge alors à la demande. */
  phonetic?: boolean;
  /** Les pistes visées par une instance qu'on vient d'ajouter. */
  defaultTargets: readonly Category[];
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
  /** L'effet du réglage en une phrase, sur les pistes visées (par défaut, celles du type). */
  help(values: ParameterValues, targets?: ReadonlySet<Category>): string;
  /**
   * Applique la contrainte au texte étiqueté, sur les pistes visées (parmi `tracks`). Dans une
   * chaîne, la page lui passe la sortie de l'instance précédente, relue comme un texte (voir
   * `plugin-chain.ts`). `scope` dit quels mots laisser et lesquels traiter avec leurs propres
   * valeurs ; une valeur propre se complète des réglages de l'instance et passe par `parse`.
   */
  apply(
    text: string,
    tagged: readonly TaggedWord[],
    values: ParameterValues,
    resources: PluginResources,
    targets: ReadonlySet<Category>,
    scope?: WordScope,
  ): PluginResult;
}

const DeclarationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tracks: z.array(CategorySchema).min(1),
  defaultTargets: z.array(CategorySchema).min(1),
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
  if (plugin.defaultTargets.some((track) => !plugin.tracks.includes(track))) throw new Error(`${plugin.id} : une piste par défaut n'est pas traitée`);
  if (plugin.targetable === false && (plugin.tracks.length !== CATEGORIES.length || plugin.defaultTargets.length !== CATEGORIES.length))
    throw new Error(`${plugin.id} : une contrainte non ciblable vise les cinq pistes`);
  plugin.parse(plugin.defaults);
  return plugin;
}

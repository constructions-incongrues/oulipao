import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories, mixSegments, type MixedSegment } from '../../domain/mixing.ts';
import type { ConstraintPlugin } from '../../domain/plugin.ts';
import { runChain, type ChainStep, type StepReport } from '../../domain/plugin-chain.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import { pluginById } from './mixer-state.ts';
import { layoutScore } from './score-layout.ts';
import { TRACK_NAMES, TRACK_UNITS, type MixerState, type ScoreLayout } from './types.ts';

/** Un texte collé et étiqueté : on ne l'étiquette qu'une fois, puis chaque geste rejoue la suite. */
export interface Session {
  text: string;
  tagged: TaggedWord[];
}

/** Ce que la chaîne de plugins a fait d'un mot : remplacé, retiré, ou laissé tel quel, et pourquoi. */
export interface Mark {
  state: 'replaced' | 'removed' | 'kept';
  original: string;
  /** Pour un mot laissé tel quel : la raison, en clair. */
  reason?: string;
}

/** Ce que la page affiche pour un texte et un état de la table. */
export interface TracksView {
  layout: ScoreLayout;
  /** Le texte résultant : chaîne de plugins appliquée, puis pistes coupées. */
  result: string;
  /** Le même, en morceaux : chaque mot garde sa position dans le texte d'origine. */
  segments: MixedSegment[];
  /** Aucun mot ne s'entend : il ne reste rien à lire ni à copier. */
  empty: boolean;
  /** Nombre de mots par piste. */
  counts: Record<Category, number>;
  /** Ce que chaque plugin actif a fait, dans l'ordre de la chaîne. */
  steps: StepReport[];
  /** Les mots touchés par la chaîne, par position ; vide quand aucun plugin n'agit. */
  marks: ReadonlyMap<number, Mark>;
  audible: ReadonlySet<Category>;
}

/** Retrouve un plugin par son identifiant : les plugins installés, sauf en test. */
export type PluginLookup = (id: string) => ConstraintPlugin;

/** Les plugins de la chaîne qui sont en marche, dans l'ordre. */
const enabledPlugins = (mixer: MixerState, lookup: PluginLookup): ConstraintPlugin[] =>
  mixer.order.map(lookup).filter((plugin) => mixer.plugins[plugin.id]!.enabled);

/** Les plugins qui changent le texte : en marche, et réglés pour agir (le S+0, non). */
export function activeSteps(mixer: MixerState, lookup: PluginLookup = pluginById): ChainStep[] {
  return enabledPlugins(mixer, lookup)
    .map((plugin) => ({ plugin, values: mixer.plugins[plugin.id]!.params }))
    .filter(({ plugin, values }) => plugin.acts(values));
}

/** Rejoue la chaîne de plugins, puis le mixage et la disposition, sans réétiqueter. */
export function buildView(
  session: Session,
  mixer: MixerState,
  morphology: MorphologyRepository,
  width?: number,
  lookup: PluginLookup = pluginById,
): TracksView {
  const { text, tagged } = session;
  const chain = runChain(text, tagged, activeSteps(mixer, lookup), { morphology });
  const labels = new Map<number, string>();
  const marks = new Map<number, Mark>();
  for (const { index, original, replacement, removed, reason } of chain.marks.values()) {
    if (replacement !== undefined) {
      labels.set(index, replacement);
      marks.set(index, { state: 'replaced', original });
    } else if (removed) {
      marks.set(index, { state: 'removed', original });
    } else {
      marks.set(index, { state: 'kept', original, reason });
    }
  }
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category, tagged.filter((word) => word.category === category).length]),
  ) as Record<Category, number>;
  const audible = audibleCategories(mixer.tracks);
  const segments = mixSegments(chain.words, tagged, audible, chain.tail, chain.steps.some((step) => step.removed > 0));
  return {
    layout: layoutScore(text, tagged, labels, width),
    result: segments.map((segment) => segment.text).join(''),
    segments,
    empty: !segments.some((segment) => segment.index !== undefined),
    counts,
    steps: chain.steps,
    marks,
    audible,
  };
}

/** Les pistes qu'on n'entend pas, par leur nom en minuscules. */
const cutTracks = (audible: ReadonlySet<Category>) =>
  CATEGORIES.filter((category) => !audible.has(category)).map((category) => TRACK_NAMES[category].toLowerCase());

const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;

/**
 * Ce qu'un plugin a fait, en une phrase. Sur une piste : « S+7, parmi tous les noms : 12 noms
 * remplacés sur 13. » Sur toutes : « lipogramme en e : 63 mots remplacés, 4 retirés, 9 laissés
 * tels quels. »
 */
function stepSentence(plugin: ConstraintPlugin, mixer: MixerState, view: TracksView): string {
  const params = mixer.plugins[plugin.id]!.params;
  if (!plugin.acts(params)) return plugin.help(params);
  const { replaced, removed, kept } = view.steps.find((step) => step.id === plugin.id)!;
  if (plugin.track === 'all') {
    return `${plugin.label(params)} : ${plural(replaced, 'mot remplacé', 'mots remplacés')}, ${plural(removed, 'retiré', 'retirés')}, ${plural(kept, 'laissé tel quel', 'laissés tels quels')}.`;
  }
  const [one, many] = TRACK_UNITS[plugin.track];
  return `${plugin.label(params)} : ${plural(replaced, `${one} remplacé`, `${many} remplacés`)} sur ${view.counts[plugin.track]}.`;
}

/** La phrase qui résume l'état du texte, affichée et annoncée après chaque geste. */
export function summarize(mixer: MixerState, view: TracksView, lookup: PluginLookup = pluginById): string {
  const plugins = enabledPlugins(mixer, lookup);
  const rule = plugins.length
    ? plugins.map((plugin) => stepSentence(plugin, mixer, view)).join(' ')
    : `${mixer.order.length > 1 ? 'Plugins coupés' : 'Plugin coupé'} : texte d’origine.`;
  const cut = cutTracks(view.audible);
  return cut.length ? `${rule} Pistes coupées : ${cut.join(', ')}.` : rule;
}

/**
 * La mention ajoutée au texte copié : ce qui a changé le texte, et d'où il vient. Rien quand le
 * texte copié est le texte d'origine (aucun plugin n'agit, toutes les pistes entendues).
 */
export function ruleMention(mixer: MixerState, audible: ReadonlySet<Category>, lookup: PluginLookup = pluginById): string {
  const parts = activeSteps(mixer, lookup).map(({ plugin, values }) => plugin.label(values));
  const cut = cutTracks(audible);
  if (cut.length) parts.push(`pistes coupées : ${cut.join(', ')}`);
  return parts.length ? `\n\n— ${parts.join(' · ')} (Potao)` : '';
}

/** Les mots dont le texte a changé d'une vue à l'autre, par position : ce sont eux qui s'éclairent. */
export function changedWords(before: TracksView | undefined, after: TracksView): Set<number> {
  if (!before) return new Set();
  const previous = new Map(before.segments.filter((s) => s.index !== undefined).map((s) => [s.index!, s.text]));
  return new Set(after.segments.filter((s) => s.index !== undefined && previous.has(s.index) && previous.get(s.index) !== s.text).map((s) => s.index!));
}

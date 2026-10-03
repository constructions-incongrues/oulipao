import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories, mixSegments, plainWords, type MixedSegment } from '../../domain/mixing.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import { installedPlugin } from './mixer-state.ts';
import { layoutScore } from './score-layout.ts';
import { TRACK_NAMES, TRACK_UNITS, type MixerState, type PluginState, type ScoreLayout } from './types.ts';

/** Un texte collé et étiqueté : on ne l'étiquette qu'une fois, puis chaque geste rejoue la suite. */
export interface Session {
  text: string;
  tagged: TaggedWord[];
}

/** Ce que le plugin a fait d'un mot de sa piste : remplacé, ou laissé tel quel, et pourquoi. */
export interface Mark {
  state: 'replaced' | 'kept';
  original: string;
  /** Pour un mot laissé tel quel : la raison, en clair. */
  reason?: string;
}

/** Ce que la page affiche pour un texte et un état de la table. */
export interface TracksView {
  layout: ScoreLayout;
  /** Le texte résultant : contrainte appliquée, puis pistes coupées. */
  result: string;
  /** Le même, en morceaux : chaque mot garde sa position dans le texte d'origine. */
  segments: MixedSegment[];
  /** Aucun mot ne s'entend : il ne reste rien à lire ni à copier. */
  empty: boolean;
  /** Nombre de mots par piste. */
  counts: Record<Category, number>;
  /** Mots remplacés par le plugin, sur le nombre de mots de sa piste. */
  replaced: number;
  targets: number;
  /** Les mots touchés par le plugin, par position ; vide quand il n'agit pas. */
  marks: ReadonlyMap<number, Mark>;
  audible: ReadonlySet<Category>;
}

/** Le plugin change-t-il quelque chose ? Coupé, ou réglé pour ne rien faire (S+0), non. */
export const pluginActs = (plugin: PluginState) => plugin.enabled && installedPlugin.acts(plugin.params);

/** Rejoue la chaîne plugin → mixage → disposition, sans réétiqueter. */
export function buildView(session: Session, mixer: MixerState, morphology: MorphologyRepository, width?: number): TracksView {
  const { text, tagged } = session;
  const labels = new Map<number, string>();
  const marks = new Map<number, Mark>();
  let words;
  let tail;
  if (pluginActs(mixer.plugin)) {
    const result = installedPlugin.apply(text, tagged, mixer.plugin.params, { morphology });
    ({ words, tail } = result);
    for (const { index, original, replacement, reason } of result.marks) {
      if (replacement !== undefined) {
        labels.set(index, replacement);
        marks.set(index, { state: 'replaced', original });
      } else {
        marks.set(index, { state: 'kept', original, reason });
      }
    }
  } else {
    ({ words, tail } = plainWords(text));
  }
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category, tagged.filter((word) => word.category === category).length]),
  ) as Record<Category, number>;
  const audible = audibleCategories(mixer.tracks);
  const segments = mixSegments(words, tagged, audible, tail);
  return {
    layout: layoutScore(text, tagged, labels, width),
    result: segments.map((segment) => segment.text).join(''),
    segments,
    empty: !segments.some((segment) => segment.index !== undefined),
    counts,
    replaced: labels.size,
    targets: counts[installedPlugin.track],
    marks,
    audible,
  };
}

/** Les pistes qu'on n'entend pas, par leur nom en minuscules. */
const cutTracks = (audible: ReadonlySet<Category>) =>
  CATEGORIES.filter((category) => !audible.has(category)).map((category) => TRACK_NAMES[category].toLowerCase());

/** La phrase qui résume l'état du texte, affichée et annoncée après chaque geste. */
export function summarize(mixer: MixerState, view: TracksView): string {
  const { enabled, params } = mixer.plugin;
  const [one, many] = TRACK_UNITS[installedPlugin.track];
  const rule = !enabled
    ? 'Plugin coupé : texte d’origine.'
    : !installedPlugin.acts(params)
      ? installedPlugin.help(params)
      : `${installedPlugin.label(params)} : ${view.replaced} ${view.replaced > 1 ? `${many} remplacés` : `${one} remplacé`} sur ${view.targets}.`;
  const cut = cutTracks(view.audible);
  return cut.length ? `${rule} Pistes coupées : ${cut.join(', ')}.` : rule;
}

/**
 * La mention ajoutée au texte copié : ce qui a changé le texte, et d'où il vient. Rien quand le
 * texte copié est le texte d'origine (plugin coupé ou sans effet, toutes les pistes entendues).
 */
export function ruleMention(mixer: MixerState, audible: ReadonlySet<Category>): string {
  const parts: string[] = [];
  if (pluginActs(mixer.plugin)) parts.push(installedPlugin.label(mixer.plugin.params));
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

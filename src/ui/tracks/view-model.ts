import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories, mixSegments, plainWords, type MixedSegment } from '../../domain/mixing.ts';
import { applyS7 } from '../../domain/s7/engine.ts';
import type { SubstitutionStatus } from '../../domain/s7/types.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import { layoutScore } from './score-layout.ts';
import { TRACK_NAMES, type MixerState, type PluginState, type ScoreLayout } from './types.ts';

/** Un texte collé et étiqueté : on ne l'étiquette qu'une fois, puis chaque geste rejoue la suite. */
export interface Session {
  text: string;
  tagged: TaggedWord[];
}

/** Ce que le plugin a fait d'un nom : remplacé, ou laissé tel quel, et pourquoi. */
export interface NounMark {
  state: 'replaced' | 'kept';
  original: string;
  /** Pour un nom laissé tel quel : la raison, en clair. */
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
  /** Noms remplacés par le plugin, sur le nombre de noms. */
  replaced: number;
  nouns: number;
  /** Les noms touchés par le plugin, par position ; vide quand il n'agit pas. */
  marks: ReadonlyMap<number, NounMark>;
  audible: ReadonlySet<Category>;
}

const REASONS: Record<Exclude<SubstitutionStatus, 'replaced'>, string> = {
  'unknown-noun': 'absent du dictionnaire',
  'missing-form': 'aucun nom au bon genre et au bon nombre',
};

/** Le plugin change-t-il quelque chose ? Coupé ou à S+0, non. */
export const pluginActs = (plugin: PluginState) => plugin.enabled && plugin.offset !== 0;

/** Rejoue la chaîne moteur → mixage → disposition, sans réétiqueter. */
export function buildView(session: Session, mixer: MixerState, morphology: MorphologyRepository, width?: number): TracksView {
  const { text, tagged } = session;
  const labels = new Map<number, string>();
  const marks = new Map<number, NounMark>();
  let words;
  let tail;
  if (pluginActs(mixer.plugin)) {
    const s7 = applyS7(text, tagged, { offset: mixer.plugin.offset, mode: mixer.plugin.mode }, morphology);
    ({ words, tail } = s7);
    for (const { index, original, replacement, status } of s7.substitutions) {
      if (status === 'replaced') {
        labels.set(index, replacement);
        marks.set(index, { state: 'replaced', original });
      } else {
        marks.set(index, { state: 'kept', original, reason: REASONS[status] });
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
    nouns: counts.noun,
    marks,
    audible,
  };
}

/** « S+7 », « S−3 » : le nom du réglage, avec un vrai signe moins. */
export const ruleName = (offset: number) => `S${offset < 0 ? '−' : '+'}${Math.abs(offset)}`;

const AMONG: Record<PluginState['mode'], string> = { reagree: 'parmi tous les noms', 'same-gender': 'parmi les noms du même genre' };

/** Les pistes qu'on n'entend pas, par leur nom en minuscules. */
const cutTracks = (audible: ReadonlySet<Category>) =>
  CATEGORIES.filter((category) => !audible.has(category)).map((category) => TRACK_NAMES[category].toLowerCase());

/** La phrase qui résume l'état du texte, affichée et annoncée après chaque geste. */
export function summarize(mixer: MixerState, view: TracksView): string {
  const plugin = mixer.plugin;
  const rule = !plugin.enabled
    ? 'Plugin coupé : texte d’origine.'
    : plugin.offset === 0
      ? 'S+0 : aucun changement.'
      : `${ruleName(plugin.offset)}, ${AMONG[plugin.mode]} : ${view.replaced} ${view.replaced > 1 ? 'noms remplacés' : 'nom remplacé'} sur ${view.nouns}.`;
  const cut = cutTracks(view.audible);
  return cut.length ? `${rule} Pistes coupées : ${cut.join(', ')}.` : rule;
}

/**
 * La mention ajoutée au texte copié : ce qui a changé le texte, et d'où il vient. Rien quand le
 * texte copié est le texte d'origine (plugin coupé ou S+0, toutes les pistes entendues).
 */
export function ruleMention(mixer: MixerState, audible: ReadonlySet<Category>): string {
  const parts: string[] = [];
  if (pluginActs(mixer.plugin)) parts.push(`${ruleName(mixer.plugin.offset)}, ${AMONG[mixer.plugin.mode]}`);
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

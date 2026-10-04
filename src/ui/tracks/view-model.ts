import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories, mixSegments, type MixedSegment } from '../../domain/mixing.ts';
import type { ConstraintPlugin, ParameterValues } from '../../domain/plugin.ts';
import type { WordModulation } from '../../domain/modulation/apply.ts';
import { runChain, type ChainStep, type StageWord, type StepReport } from '../../domain/plugin-chain.ts';
import { describeReading, lineSyllables, PHONETICS_LOADING, pronounce, type VerseWord } from '../../domain/phonetics/lookup.ts';
import { FORM_LABELS, layoutForm } from '../../domain/forms/form.ts';
import { rhymeSchemePlugin, schemeOf } from '../../domain/rhyme/rhyme-scheme.ts';
import { schemeLetters } from '../../domain/rhyme/scheme.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { VerbRepository } from '../../ports/verbs.ts';
import { pluginById } from './mixer-state.ts';
import { gateStatement, modulatedLabel, modulatorStatement } from './modulation-statement.ts';
import { TRACK_NAMES, TRACK_UNITS, type Instance, type MixerState } from './types.ts';

/** Un texte collé et étiqueté : on ne l'étiquette qu'une fois, puis chaque geste rejoue la suite. */
export interface Session {
  text: string;
  tagged: TaggedWord[];
}

/** Ce que la chaîne de plugins a fait d'un mot : remplacé, retiré, remis en ligne, ou laissé tel quel, et pourquoi. */
export interface Mark {
  state: 'replaced' | 'removed' | 'relaid' | 'kept';
  original: string;
  /** Pour un mot laissé tel quel : la raison, en clair. */
  reason?: string;
}

/** Ce que la page affiche pour un texte et un état de la table. */
/** Une bande de l'inspecteur : le texte tel qu'une étape de la chaîne l'a laissé, un mot par mot d'origine. */
export interface Stage {
  /** `origin` pour le texte d'origine, sinon l'identifiant de l'instance. */
  id: string;
  /** « Origine », ou la contrainte nommée comme dans le résumé : « S+7 sur les noms ». */
  label: string;
  /** Un élément par mot d'origine : chaîne vide pour un mot retiré, et s'il a été mis à la ligne. */
  words: StageWord[];
  /** Ce que les modulateurs et la porte de l'instance ont fait, par mot d'origine ; absent : rien. */
  modulation?: ReadonlyMap<number, WordModulation>;
}

export interface TracksView {
  /** Le texte d'origine, puis la sortie de chaque contrainte active, dans l'ordre de la chaîne. */
  stages: Stage[];
  /** La piste de chaque mot d'origine. */
  tracks: Category[];
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
  /** La prononciation de chaque mot d'origine, en clair ; vide tant que les prononciations ne sont pas chargées. */
  pronunciations: string[];
  /** Le nombre de syllabes de chaque ligne du texte résultant, quand un filtre phonétique est en marche. */
  syllables?: (number | undefined)[];
  /** Sous une forme à refrain : les vers de l'auteur qui manquent pour la remplir. */
  missing?: number;
  /** Les paramètres modulés dont une valeur a été repliée, par instance : la mention dit « modulo ». */
  folded: Readonly<Record<string, readonly string[]>>;
}

/**
 * Le nombre de syllabes de chaque ligne du texte résultant ; une ligne sans mot (entre deux
 * strophes) n'en a pas. Un morceau qui porte plusieurs mots les prend tous dans la piste de son mot d'origine.
 */
export function segmentSyllables(segments: readonly MixedSegment[], tracks: readonly Category[], phonetics: PhoneticsRepository): (number | undefined)[] {
  const lines: (number | undefined)[] = [];
  let words: VerseWord[] = [];
  const close = () => {
    lines.push(words.length ? lineSyllables(words, phonetics) : undefined);
    words = [];
  };
  for (const { text, index } of segments) {
    if (index !== undefined) words.push(...tokenize(text).map((token) => ({ word: token.word, category: tracks[index] })));
    else for (const _ of text.matchAll(/\n/g)) close();
  }
  close();
  return lines;
}

/** Retrouve un type de contrainte par son identifiant : les types installés, sauf en test. */
export type PluginLookup = (id: string) => ConstraintPlugin;

/** Les instances en marche, dans l'ordre de la chaîne. */
const enabledInstances = (mixer: MixerState): Instance[] => mixer.instances.filter((instance) => instance.enabled);

/** Les instances qui changent le texte : en marche, et réglées pour agir (le S+0, non). */
export function activeSteps(mixer: MixerState, lookup: PluginLookup = pluginById): ChainStep[] {
  const closed = new Set(mixer.closed ?? []);
  return enabledInstances(mixer)
    .map((instance) => ({
      id: instance.id,
      plugin: lookup(instance.type),
      values: instance.params,
      targets: new Set(instance.targets),
      closed,
      locks: locksOf(instance),
      ...(modulated(instance) && { modulators: instance.modulators }),
      ...(instance.gate && { gate: instance.gate }),
    }))
    // Un S+0 modulé agit : ses mots reçoivent leur propre décalage.
    .filter(({ plugin, values, modulators }) => plugin.acts(values) || modulators !== undefined);
}

/** L'instance lit-elle des syllabes, par un modulateur ou par sa porte ? Il lui faut alors les prononciations. */
export const readsSyllables = (instance: Instance) =>
  Object.values(instance.modulators ?? {}).some((modulator) => modulator.source.kind === 'syllables') || instance.gate?.source.kind === 'syllables';

/** L'instance a-t-elle au moins un paramètre modulé ? */
const modulated = (instance: Instance) => Object.keys(instance.modulators ?? {}).length > 0;

/** Ce qui précise la règle d'une instance dans la chaîne : une instance avant elle, et ses paramètres repliés. */
export interface DescribeContext {
  earlier?: boolean;
  folded?: readonly string[];
}

/** Les verrous d'une instance, par mot d'origine : les valeurs propres de ce mot. */
function locksOf(instance: Instance): Map<number, ParameterValues> {
  const locks = new Map<number, ParameterValues>();
  for (const { index, key, value } of instance.locks ?? []) locks.set(index, { ...locks.get(index), [key]: value });
  return locks;
}

/** Un pas de la grille : percé (une contrainte agit), en contour (aucune contrainte ne vise sa piste), ou bouché. */
export interface GridStep {
  /** Position du mot d'origine. */
  index: number;
  word: string;
  track: Category;
  state: 'punched' | 'outline' | 'closed';
  /** Les verrous posés sur ce mot, instance par instance, dans l'ordre de la chaîne. */
  locks: { id: string; key: string; value: number }[];
  /** Ce que les modulateurs ont donné à ce mot, étape par étape : « +4 », « porte fermée » ; absent : rien. */
  modulated?: string[];
}

/** Les pas de la grille, un par mot d'origine ; `stages` (ceux de la vue) donne les valeurs modulées. */
export function gridSteps(mixer: MixerState, tracks: readonly Category[], words: readonly string[], lookup: PluginLookup = pluginById, stages: readonly Stage[] = []): GridStep[] {
  const closed = new Set(mixer.closed ?? []);
  const acting = activeSteps(mixer, lookup);
  const modulatedAt = (index: number) => {
    const modulated = stages.flatMap((stage) => {
      const instance = mixer.instances.find((candidate) => candidate.id === stage.id);
      const text = modulationText(stage.modulation?.get(index), instance && lookup(instance.type));
      return text ? [text] : [];
    });
    return modulated.length ? { modulated } : {};
  };
  return tracks.map((track, index) => ({
    index,
    word: words[index]!,
    track,
    state: closed.has(index) ? 'closed' : acting.some((step) => step.targets.has(track)) ? 'punched' : 'outline',
    locks: mixer.instances.flatMap((instance) =>
      (instance.locks ?? []).filter((lock) => lock.index === index).map(({ key, value }) => ({ id: instance.id, key, value })),
    ),
    ...modulatedAt(index),
  }));
}

/** Le nombre de pas par page : seize sur un écran large, huit sur une tablette, quatre sur un téléphone. */
export const stepsPerPage = (width: number) => (width >= 1024 ? 16 : width >= 640 ? 8 : 4);

/** La page qui contient un pas, à un nombre de pas par page donné. */
export const pageOf = (index: number, perPage: number) => Math.floor(index / perPage);

/** « les noms », « les noms et les adjectifs », « les noms, les verbes et les adjectifs ». */
function tracksPhrase(targets: readonly Category[]): string {
  const names = targets.map((track) => `les ${TRACK_NAMES[track].toLowerCase()}`);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0]!;
}

/**
 * Le nom d'une instance dans le résumé et la mention : son réglage, et ses pistes visées sauf
 * quand elle vise toutes celles que son type sait traiter (« S+7 sur les noms », « lipogramme en e ») ;
 * puis la règle de ses modulateurs et de sa porte, entre parenthèses, une phrase chacun.
 */
export function describeInstance(instance: Instance, lookup: PluginLookup = pluginById, context: DescribeContext = {}): string {
  const plugin = lookup(instance.type);
  const label = modulatedLabel(plugin, instance.params, instance.modulators);
  const named = plugin.tracks.every((track) => instance.targets.includes(track)) ? label : `${label}${label.includes(',') ? ',' : ''} sur ${tracksPhrase(instance.targets)}`;
  const statement = { earlier: context.earlier ?? false, folded: false };
  const rules = [
    ...Object.entries(instance.modulators ?? {}).map(([key, modulator]) =>
      modulatorStatement(plugin, key, modulator, instance.targets, { ...statement, folded: context.folded?.includes(key) ?? false }),
    ),
    ...(instance.gate ? [gateStatement(instance.gate, instance.targets, statement)] : []),
  ];
  return rules.length ? `${named} (${rules.join(' ; ')})` : named;
}

/** Rejoue la chaîne de contraintes, puis le mixage, sans réétiqueter. */
export function buildView(
  session: Session,
  mixer: MixerState,
  morphology: MorphologyRepository,
  lookup: PluginLookup = pluginById,
  verbs?: VerbRepository,
  phonetics?: PhoneticsRepository,
): TracksView {
  const { text, tagged } = session;
  const steps = activeSteps(mixer, lookup);
  const chain = runChain(text, tagged, steps, { morphology, verbs, phonetics });
  const active = mixer.instances.filter((instance) => chain.steps.some((step) => step.id === instance.id));
  const marks = new Map<number, Mark>();
  for (const { index, original, replacement, removed, relaid, reason } of chain.marks.values()) {
    if (replacement !== undefined) {
      marks.set(index, { state: 'replaced', original });
    } else if (removed) {
      marks.set(index, { state: 'removed', original });
    } else if (relaid) {
      marks.set(index, { state: 'relaid', original });
    } else {
      marks.set(index, { state: 'kept', original, reason });
    }
  }
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category, tagged.filter((word) => word.category === category).length]),
  ) as Record<Category, number>;
  const audible = audibleCategories(mixer.tracks);
  // La forme se pose après la chaîne et le mixage : la chaîne reste alignée mot à mot. Éclipse
  // reçoit le texte d'origine, qu'elle met devant.
  const formed = layoutForm(mixSegments(chain.words, tagged, audible, chain.tail, chain.steps.some((step) => step.removed > 0)), mixer.form ?? 'none', text);
  const segments = formed.segments;
  // La lettre de chaque fin de vers sous le dernier schéma de rimes actif.
  // ponytail: lue sur la sortie finale, pas sur le texte qui entre dans le schéma ; une mise en vers
  // placée après lui déplace les lettres. Relire l'étape d'entrée si ça trompe.
  const scheme = steps.findLast((step) => step.plugin.id === rhymeSchemePlugin.id);
  const letters = scheme && schemeLetters(chain.words.map((word, index) => ({ ...word, category: tagged[index]!.category })), schemeOf(scheme.values));
  return {
    stages: [
      { id: 'origin', label: 'Origine', words: tagged.map((word) => ({ output: word.word, newline: false })) },
      ...active.map((instance, k) => ({
        id: instance.id,
        label: describeInstance(instance, lookup, { earlier: k > 0, folded: chain.modulation[k]!.folded }),
        words: chain.stages[k]!,
        ...(chain.modulation[k]!.words.size > 0 && { modulation: chain.modulation[k]!.words }),
      })),
    ],
    folded: Object.fromEntries(active.flatMap((instance, k) => (chain.modulation[k]!.folded.length ? [[instance.id, chain.modulation[k]!.folded]] : []))),
    tracks: tagged.map((word) => word.category),
    result: segments.map((segment) => segment.text).join(''),
    segments,
    empty: !segments.some((segment) => segment.index !== undefined),
    counts,
    steps: chain.steps,
    marks,
    audible,
    ...(mixer.form && mixer.form !== 'none' && { missing: formed.missing }),
    pronunciations: phonetics ? tagged.map(({ word, category }, index) => {
      const reading = pronounce(word, category, phonetics);
      if (!reading) return '';
      const letter = letters?.[index];
      return `${describeReading(reading, word)}${letter ? ` · lettre ${letter}` : ''}`;
    }) : [],
    ...(phonetics && steps.some((step) => step.plugin.phonetic) && { syllables: segmentSyllables(segments, tagged.map((word) => word.category), phonetics) }),
  };
}

/** Les pistes qu'on n'entend pas, par leur nom en minuscules. */
const cutTracks = (audible: ReadonlySet<Category>) =>
  CATEGORIES.filter((category) => !audible.has(category)).map((category) => TRACK_NAMES[category].toLowerCase());

const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;

/**
 * Ce qu'une instance a fait, en une phrase. Sur une piste : « S+7 sur les noms : 12 noms
 * remplacés sur 13. » Sur plusieurs : « lipogramme en e : 63 mots remplacés, 4 retirés, 9 laissés
 * tels quels. »
 */
function stepSentence(instance: Instance, view: TracksView, lookup: PluginLookup): string {
  const plugin = lookup(instance.type);
  if (!plugin.acts(instance.params) && !modulated(instance)) return plugin.help(instance.params);
  // Les bandes de la vue suivent la chaîne active : la première est l'origine.
  const name = describeInstance(instance, lookup, { earlier: view.stages.findIndex((stage) => stage.id === instance.id) > 1, folded: view.folded[instance.id] ?? [] });
  const { replaced, removed, relaid, kept } = view.steps.find((step) => step.id === instance.id)!;
  // « 12 noms remplacés sur 13 » ne vaut que pour une contrainte qui a remplacé des mots.
  const substitution = plugin.targetable !== false && relaid === 0 && replaced > 0;
  if (substitution && instance.targets.length > 1) {
    return `${name} : ${plural(replaced, 'mot remplacé', 'mots remplacés')}, ${plural(removed, 'retiré', 'retirés')}, ${plural(kept, 'laissé tel quel', 'laissés tels quels')}.`;
  }
  if (substitution && removed === 0) {
    const [track] = instance.targets as [Category];
    const [one, many] = TRACK_UNITS[track];
    return `${name} : ${plural(replaced, `${one} remplacé`, `${many} remplacés`)} sur ${view.counts[track]}.`;
  }
  // Un retrait ou une mise en page : seulement ce qui a eu lieu.
  const parts = (
    [
      [replaced, 'remplacé', 'remplacés'],
      [removed, 'retiré', 'retirés'],
      [relaid, 'remis en ligne', 'remis en ligne'],
      [kept, 'laissé tel quel', 'laissés tels quels'],
    ] as const
  ).filter(([count]) => count > 0);
  if (!parts.length) return `${name} : aucun changement.`;
  // Le premier compte nomme les mots : « 12 mots remis en ligne, 3 retirés ».
  const counts = parts.map(([count, one, many], k) => (k ? plural(count, one, many) : plural(count, `mot ${one}`, `mots ${many}`)));
  return `${name} : ${counts.join(', ')}.`;
}

/** La phrase qui résume l'état du texte, affichée et annoncée après chaque geste. */
export function summarize(mixer: MixerState, view: TracksView, lookup: PluginLookup = pluginById): string {
  const enabled = enabledInstances(mixer);
  const rule = enabled.length
    ? enabled.map((instance) => stepSentence(instance, view, lookup)).join(' ')
    : !mixer.instances.length
      ? 'Aucune contrainte : texte d’origine.'
      : `${mixer.instances.length > 1 ? 'Contraintes coupées' : 'Contrainte coupée'} : texte d’origine.`;
  const cut = cutTracks(view.audible);
  const form = mixer.form && mixer.form !== 'none' ? ` Forme : ${FORM_LABELS[mixer.form]}${view.missing ? `, il manque ${plural(view.missing, 'vers', 'vers')}` : ''}.` : '';
  return `${cut.length ? `${rule} Pistes coupées : ${cut.join(', ')}.` : rule}${form}`;
}

/**
 * La mention ajoutée au texte copié : ce qui a changé le texte, et d'où il vient. Rien quand le
 * texte copié est le texte d'origine (aucune instance n'agit, toutes les pistes entendues).
 */
export function ruleMention(
  mixer: MixerState,
  audible: ReadonlySet<Category>,
  lookup: PluginLookup = pluginById,
  folded: Readonly<Record<string, readonly string[]>> = {},
): string {
  const { form } = mixer;
  const active = new Set(activeSteps(mixer, lookup).map((step) => step.id));
  const parts = mixer.instances
    .filter((instance) => active.has(instance.id))
    .map((instance, k) => describeInstance(instance, lookup, { earlier: k > 0, folded: folded[instance.id] ?? [] }));
  const cut = cutTracks(audible);
  if (cut.length) parts.push(`pistes coupées : ${cut.join(', ')}`);
  if (form && form !== 'none') parts.push(FORM_LABELS[form]);
  return parts.length ? `\n\n— ${parts.join(' · ')} (Oulipao)` : '';
}

/**
 * La mention, quand le texte a été réglé en écoutant : « réglé en écoutant » en dernière partie
 * (« — S+7 … · réglé en écoutant (Oulipao) »), ou seule quand aucune règle n'agit.
 */
export function withListening(mention: string, listened: boolean): string {
  if (!listened) return mention;
  return mention ? mention.replace(/ \(Oulipao\)$/, ' · réglé en écoutant (Oulipao)') : '\n\n— réglé en écoutant (Oulipao)';
}

/** Les mots dont le texte a changé d'une vue à l'autre, par position : ce sont eux qui s'éclairent. */
export function changedWords(before: TracksView | undefined, after: TracksView): Set<number> {
  if (!before) return new Set();
  const previous = new Map(before.segments.filter((s) => s.index !== undefined).map((s) => [s.index!, s.text]));
  return new Set(after.segments.filter((s) => s.index !== undefined && previous.has(s.index) && previous.get(s.index) !== s.text).map((s) => s.index!));
}

/** Une colonne de l'inspecteur : un mot d'origine et sa distance au mot choisi. */
export interface InspectorColumn {
  index: number;
  distance: number;
}

/** Une case de l'inspecteur : le mot à cette étape (« · » s'il est retiré), et si l'étape l'a mis à la ligne. */
export interface InspectorCell {
  text: string;
  newline: boolean;
  /** Ce que le modulateur a donné à ce mot à cette étape : « +4 », « porte fermée », « pas de voisin ». */
  modulation?: string;
}

const NOTES: Record<NonNullable<WordModulation['note']>, string> = { 'no-neighbour': 'pas de voisin', loading: PHONETICS_LOADING };

/** « +4 » pour un paramètre signé, « 4 » sinon ; puis la porte fermée et ce qui manquait. */
export function modulationText(word: WordModulation | undefined, plugin: ConstraintPlugin | undefined): string | undefined {
  if (!word) return undefined;
  const parts = Object.entries(word.values).map(([key, value]) => {
    const parameter = plugin?.parameters.find((candidate) => candidate.key === key);
    const signed = parameter?.kind === 'integer' && parameter.min < 0;
    return signed ? `${value < 0 ? '−' : '+'}${Math.abs(value)}` : String(value);
  });
  if (word.gate === 'closed') parts.push('porte fermée');
  if (word.note) parts.push(NOTES[word.note]);
  return parts.length ? parts.join(' · ') : undefined;
}

/** Ce que montre l'inspecteur : les colonnes autour du mot choisi, et chaque bande sur ces colonnes. */
export interface InspectorWindow {
  columns: InspectorColumn[];
  bands: { id: string; label: string; cells: InspectorCell[] }[];
}

/** La fenêtre de l'inspecteur : le mot choisi et `radius` voisins de chaque côté, bornés au texte ; « · » pour un mot retiré. */
export function inspectorWindow(view: TracksView, index: number, radius: number, plugins: (id: string) => ConstraintPlugin | undefined = () => undefined): InspectorWindow {
  const from = Math.max(0, index - radius);
  const to = Math.min(view.tracks.length - 1, index + radius);
  const columns = Array.from({ length: to - from + 1 }, (_, k) => ({ index: from + k, distance: Math.abs(from + k - index) }));
  return {
    columns,
    bands: view.stages.map(({ id, label, words, modulation }) => ({
      id,
      label,
      cells: columns.map((column) => {
        const text = modulationText(modulation?.get(column.index), plugins(id));
        return { text: words[column.index]!.output || '·', newline: words[column.index]!.newline, ...(text && { modulation: text }) };
      }),
    })),
  };
}

/** Un champ de verrou de l'inspecteur : un paramètre verrouillable d'une instance, pour le mot choisi. */
export interface LockField {
  key: string;
  label: string;
  min: number;
  max: number;
  /** La valeur verrouillée ; absente : le mot suit l'instance. */
  value?: number;
}

/** Les verrous qu'on peut poser sur un mot : par instance en marche qui vise sa piste. */
export interface InstanceLocks {
  id: string;
  fields: LockField[];
  /** « S+3 sur ce mot » quand un verrou est posé ; absent sinon. */
  note?: string;
}

/** Les champs de verrou de l'inspecteur pour un mot d'origine et sa piste. */
export function inspectorLocks(mixer: MixerState, index: number, track: Category, lookup: PluginLookup = pluginById): InstanceLocks[] {
  return enabledInstances(mixer)
    .filter((instance) => instance.targets.includes(track))
    .flatMap((instance) => {
      const plugin = lookup(instance.type);
      const fields = plugin.parameters.flatMap((parameter) =>
        parameter.kind === 'integer' && parameter.lockable
          ? [{ key: parameter.key, label: parameter.label, min: parameter.min, max: parameter.max, value: instance.locks?.find((lock) => lock.index === index && lock.key === parameter.key)?.value }]
          : [],
      );
      if (!fields.length) return [];
      const locked = Object.fromEntries(fields.filter((field) => field.value !== undefined).map((field) => [field.key, field.value!]));
      const note = Object.keys(locked).length ? `${plugin.title({ ...instance.params, ...locked })} sur ce mot` : undefined;
      return [{ id: instance.id, fields, ...(note && { note }) }];
    });
}

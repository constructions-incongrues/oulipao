import type { Category } from './categories.ts';
import { plainWords } from './mixing.ts';
import { modulate, type WordModulation } from './modulation/apply.ts';
import type { Gate, Modulator } from './modulation/schema.ts';
import type { SyllableCounter } from './modulation/sources.ts';
import { pronounce, syllableCount } from './phonetics/lookup.ts';
import type { ConstraintPlugin, ParameterValues, PluginResources, WordMark, WordScope } from './plugin.ts';
import type { OutputWord } from './s7/types.ts';
import type { TaggedWord } from './tagged-word.ts';
import { tokenize } from './tokenizer.ts';

/** Une instance de la chaîne : son type, ses réglages et ses pistes visées. */
export interface ChainStep {
  /** Identifiant de l'instance : deux instances d'un même type ont chacune le leur. */
  id: string;
  plugin: ConstraintPlugin;
  values: ParameterValues;
  targets: ReadonlySet<Category>;
  /** Les mots d'origine qu'aucune contrainte ne touche (pas bouchés), communs à toute la chaîne. */
  closed?: ReadonlySet<number>;
  /** Les valeurs propres à certains mots d'origine pour cette instance (verrous). */
  locks?: ReadonlyMap<number, ParameterValues>;
  /** Les paramètres modulés de l'instance, par clé : une valeur par mot, sous les verrous. */
  modulators?: Readonly<Record<string, Modulator>>;
  /** La porte de l'instance : les mots qu'elle laisse passer. */
  gate?: Gate;
}

/** Ce que les modulateurs et la porte d'une étape ont fait, par mot d'origine. */
export interface StageModulation {
  words: Map<number, WordModulation>;
  /** Les paramètres dont une valeur a été repliée dans ses bornes. */
  folded: string[];
}

/** Un mot d'origine à la sortie d'une étape. */
export interface StageWord {
  output: string;
  /** L'étape a mis un saut de ligne devant ce mot, qui n'y était pas avant elle. */
  newline: boolean;
}

/** Ce qu'un plugin a fait, une fois ses marques ramenées aux mots d'origine. */
export interface StepReport {
  id: string;
  replaced: number;
  removed: number;
  relaid: number;
  kept: number;
}

export interface ChainResult {
  /** Un élément par mot du texte d'origine. */
  words: OutputWord[];
  tail: string;
  /** Ce que la chaîne a fait de chaque mot d'origine touché, par position. */
  marks: Map<number, WordMark>;
  steps: StepReport[];
  /**
   * La sortie de chaque étape, un mot par mot d'origine (chaîne vide pour un mot retiré), et si
   * l'étape a mis ce mot à la ligne.
   */
  stages: StageWord[][];
  /** Ce que les modulateurs ont fait à chaque étape ; vide pour une étape sans modulateur ni porte. */
  modulation: StageModulation[];
}

/** Une sortie relue comme un texte neuf ; `origin[k]` est le mot d'origine d'où vient le k-ième mot relu. */
interface Reread {
  text: string;
  tagged: TaggedWord[];
  origin: number[];
  /** Le texte qui précède chaque mot relu, depuis la fin du précédent. */
  gaps: string[];
}

/**
 * Relit une sortie mot par mot comme un texte : chaque mot relu garde la catégorie du mot
 * d'origine dont il vient. Une contraction peut donner deux mots relus (« du » → « de la »), un
 * mot absorbé n'en donne aucun.
 */
function reread(words: readonly OutputWord[], tail: string, tagged: readonly TaggedWord[]): Reread {
  let text = '';
  const spans: { index: number; start: number; end: number }[] = [];
  for (const word of words) {
    text += word.gap;
    spans.push({ index: word.index, start: text.length, end: text.length + word.output.length });
    text += word.output;
  }
  text += tail;
  const tokens = tokenize(text);
  // Un mot relu appartient au mot de sortie qui le contient ; à défaut, au dernier commencé avant lui.
  // Mots relus et mots de sortie sont tous deux dans l'ordre du texte : un seul parcours, à deux pointeurs.
  let owner = spans[0]?.index ?? 0;
  let next = 0;
  const origin = tokens.map((token) => {
    while (next < spans.length && spans[next]!.start <= token.start) {
      if (spans[next]!.end > spans[next]!.start) owner = spans[next]!.index;
      next++;
    }
    return owner;
  });
  const gaps = tokens.map((token, k) => text.slice(k ? tokens[k - 1]!.end : 0, token.start));
  return { text, tagged: tokens.map((token, k) => ({ word: token.word, category: tagged[origin[k]!]!.category })), origin, gaps };
}

/**
 * Traduit la portée par mot d'origine en positions du texte relu : un mot d'origine relu en deux
 * mots (« du » → « de la ») les fait tous deux sauter ou verrouiller. Les valeurs modulées et les
 * sauts de la porte sont déjà en positions relues ; un verrou l'emporte sur une valeur modulée.
 */
function scopeOf(
  origin: readonly number[],
  closed: ReadonlySet<number>,
  locks: ReadonlyMap<number, ParameterValues>,
  modulated: ReadonlyMap<number, ParameterValues> = new Map(),
  gated: ReadonlySet<number> = new Set(),
): WordScope {
  const scope: WordScope = { skip: [], overrides: [], origin: [...origin] };
  origin.forEach((index, k) => {
    if (closed.has(index) || gated.has(k)) scope.skip.push(k);
    const values = { ...modulated.get(k), ...locks.get(index) };
    if (Object.keys(values).length) scope.overrides.push({ index: k, values });
  });
  return scope;
}

/** Le compte des syllabes d'un mot, lu dans les prononciations ; aucun tant qu'elles ne sont pas là. */
const syllablesFrom = (resources: PluginResources): SyllableCounter => (word, category) => {
  const reading = resources.phonetics && pronounce(word, category, resources.phonetics);
  return reading && syllableCount(reading);
};

/** La raison d'un mot que la porte de l'instance a laissé. */
export const GATE_CLOSED = 'porte fermée';

/** Ramène la sortie d'un plugin, mot relu par mot relu, aux mots d'origine. */
function fold(output: readonly OutputWord[], origin: readonly number[], count: number): OutputWord[] {
  const words: OutputWord[] = Array.from({ length: count }, (_, index) => ({ index, output: '', gap: '' }));
  const seen = new Set<number>();
  output.forEach((word, k) => {
    const target = words[origin[k]!]!;
    if (seen.has(target.index)) {
      target.output += word.gap + word.output;
    } else {
      seen.add(target.index);
      target.gap = word.gap;
      target.output = word.output;
    }
  });
  return words;
}

/**
 * Applique des plugins l'un après l'autre : chacun lit la sortie du précédent, relue comme un
 * texte. Le résultat reste aligné sur les mots du texte d'origine, pour que la page puisse couper
 * des pistes et disposer la partition sans connaître les plugins.
 */
export function runChain(text: string, tagged: readonly TaggedWord[], steps: readonly ChainStep[], resources: PluginResources): ChainResult {
  let { words, tail } = plainWords(text);
  const marks = new Map<number, WordMark>();
  const reports: StepReport[] = [];
  const stages: StageWord[][] = [];
  const earlier = new Map<string, ParameterValues[]>();
  const modulation: StageModulation[] = [];
  for (const { id, plugin, values, targets, closed = new Set<number>(), locks = new Map<number, ParameterValues>(), modulators, gate } of steps) {
    const current = reread(words, tail, tagged);
    const sameType = earlier.get(plugin.id) ?? [];
    const own = plugin.inherit ? plugin.inherit(values, sameType) : values;
    earlier.set(plugin.id, [...sameType, values]);
    const modulated = modulators || gate
      ? modulate(
          { words: current.tagged.map((word) => word.word), categories: current.tagged.map((word) => word.category), gaps: current.gaps },
          {
            targets,
            closed: new Set(current.origin.flatMap((index, k) => (closed.has(index) ? [k] : []))),
            modulators,
            gate,
            parameters: plugin.parameters,
            syllables: syllablesFrom(resources),
          },
        )
      : undefined;
    const gated = new Set(modulated?.skip);
    // Un mot d'origine relu en plusieurs mots montre ce que le premier a reçu.
    const byOrigin = new Map<number, WordModulation>();
    for (const [k, word] of modulated?.words ?? []) if (!byOrigin.has(current.origin[k]!)) byOrigin.set(current.origin[k]!, word);
    modulation.push({ words: byOrigin, folded: [...(modulated?.folded ?? [])] });
    const result = plugin.apply(current.text, current.tagged, own, resources, targets, scopeOf(current.origin, closed, locks, modulated?.overrides, gated));
    if (result.words.length !== current.origin.length) throw new Error(`${plugin.id} : la sortie ne suit pas les mots du texte`);
    const before = words;
    words = fold(result.words, current.origin, tagged.length);
    tail = result.tail;
    stages.push(words.map((word, i) => ({ output: word.output, newline: word.gap.includes('\n') && !before[i]!.gap.includes('\n') })));
    const report: StepReport = { id, replaced: 0, removed: 0, relaid: 0, kept: 0 };
    for (const mark of result.marks) {
      const index = current.origin[mark.index]!;
      const original = marks.get(index)?.original ?? tagged[index]!.word;
      if (mark.removed) {
        marks.set(index, { index, original, removed: true });
        report.removed++;
      } else if (mark.replacement !== undefined) {
        marks.set(index, { index, original, replacement: mark.replacement });
        report.replaced++;
      } else if (mark.relaid) {
        // Une coupe de ligne n'efface pas un remplacement ni un retrait d'une étape précédente.
        const previous = marks.get(index);
        if (!previous || previous.reason !== undefined) marks.set(index, { index, original, relaid: true });
        report.relaid++;
      } else {
        // Laissé tel quel : on garde ce qu'un plugin précédent en a fait, s'il l'a touché.
        if (!marks.has(index)) marks.set(index, { index, original, reason: gated.has(mark.index) ? GATE_CLOSED : mark.reason });
        report.kept++;
      }
    }
    reports.push(report);
  }
  // Un mot remplacé porte au bout du compte ce que la chaîne entière en a fait.
  for (const mark of marks.values()) if (mark.replacement !== undefined) mark.replacement = words[mark.index]!.output;
  return { words, tail, marks, steps: reports, stages, modulation };
}

import type { Category } from './categories.ts';
import { plainWords } from './mixing.ts';
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
  /** Les mots d'origine qu'aucun filtre ne touche (pas bouchés), communs à toute la chaîne. */
  closed?: ReadonlySet<number>;
  /** Les valeurs propres à certains mots d'origine pour cette instance (verrous). */
  locks?: ReadonlyMap<number, ParameterValues>;
}

/** Ce qu'un plugin a fait, une fois ses marques ramenées aux mots d'origine. */
export interface StepReport {
  id: string;
  replaced: number;
  removed: number;
  kept: number;
}

export interface ChainResult {
  /** Un élément par mot du texte d'origine. */
  words: OutputWord[];
  tail: string;
  /** Ce que la chaîne a fait de chaque mot d'origine touché, par position. */
  marks: Map<number, WordMark>;
  steps: StepReport[];
  /** La sortie de chaque étape, un mot par mot d'origine (chaîne vide pour un mot retiré). */
  stages: string[][];
}

/** Une sortie relue comme un texte neuf ; `origin[k]` est le mot d'origine d'où vient le k-ième mot relu. */
interface Reread {
  text: string;
  tagged: TaggedWord[];
  origin: number[];
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
  const origin = tokens.map((token) => {
    let owner = spans[0]!.index;
    for (const span of spans) {
      if (span.start > token.start) break;
      if (span.end > span.start) owner = span.index;
    }
    return owner;
  });
  return { text, tagged: tokens.map((token, k) => ({ word: token.word, category: tagged[origin[k]!]!.category })), origin };
}

/**
 * Traduit la portée par mot d'origine en positions du texte relu : un mot d'origine relu en deux
 * mots (« du » → « de la ») les fait tous deux sauter ou verrouiller.
 */
function scopeOf(origin: readonly number[], closed: ReadonlySet<number>, locks: ReadonlyMap<number, ParameterValues>): WordScope {
  const scope: WordScope = { skip: [], overrides: [] };
  origin.forEach((index, k) => {
    if (closed.has(index)) scope.skip.push(k);
    const values = locks.get(index);
    if (values) scope.overrides.push({ index: k, values });
  });
  return scope;
}

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
  const stages: string[][] = [];
  for (const { id, plugin, values, targets, closed = new Set<number>(), locks = new Map<number, ParameterValues>() } of steps) {
    const current = reread(words, tail, tagged);
    const result = plugin.apply(current.text, current.tagged, values, resources, targets, scopeOf(current.origin, closed, locks));
    if (result.words.length !== current.origin.length) throw new Error(`${plugin.id} : la sortie ne suit pas les mots du texte`);
    words = fold(result.words, current.origin, tagged.length);
    tail = result.tail;
    stages.push(words.map((word) => word.output));
    const report: StepReport = { id, replaced: 0, removed: 0, kept: 0 };
    for (const mark of result.marks) {
      const index = current.origin[mark.index]!;
      const original = marks.get(index)?.original ?? tagged[index]!.word;
      if (mark.removed) {
        marks.set(index, { index, original, removed: true });
        report.removed++;
      } else if (mark.replacement !== undefined) {
        marks.set(index, { index, original, replacement: mark.replacement });
        report.replaced++;
      } else {
        // Laissé tel quel : on garde ce qu'un plugin précédent en a fait, s'il l'a touché.
        if (!marks.has(index)) marks.set(index, { index, original, reason: mark.reason });
        report.kept++;
      }
    }
    reports.push(report);
  }
  // Un mot remplacé porte au bout du compte ce que la chaîne entière en a fait.
  for (const mark of marks.values()) if (mark.replacement !== undefined) mark.replacement = words[mark.index]!.output;
  return { words, tail, marks, steps: reports, stages };
}

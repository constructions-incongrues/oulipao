import type { Category } from '../categories.ts';
import type { Parameter, ParameterValues } from '../plugin.ts';
import { modulatedValue } from './fold.ts';
import { passes } from './gate.ts';
import { neighbourOf } from './neighbour.ts';
import { isWordSource, type Gate, type Modulator, type Read, type Source } from './schema.ts';
import { lineNumbers, positionValue, wordValue, type SyllableCounter } from './sources.ts';

/** Le texte tel qu'une instance le reçoit : ses mots, leur piste, et le blanc qui précède chacun. */
export interface ModulationStage {
  words: readonly string[];
  categories: readonly Category[];
  gaps: readonly string[];
}

/** Ce qu'une instance module, et sur quels mots elle agit. */
export interface ModulationInput {
  targets: ReadonlySet<Category>;
  /** Les positions bouchées : ni lues, ni comptées. */
  closed: ReadonlySet<number>;
  /** Un modulateur par paramètre verrouillable, par clé. */
  modulators?: Readonly<Record<string, Modulator>>;
  gate?: Gate;
  parameters: readonly Parameter[];
  syllables?: SyllableCounter;
}

/** Pourquoi un mot n'a pas reçu de valeur : pas de voisin dans sa phrase, ou prononciations pas encore là. */
export type ModulationNote = 'no-neighbour' | 'loading';

/** Ce que le modulateur a fait d'un mot : ses valeurs, ce que la porte en a dit, et ce qui manquait. */
export interface WordModulation {
  values: Record<string, number>;
  gate?: 'open' | 'closed';
  note?: ModulationNote;
}

export interface Modulation {
  /** Les positions que la porte laisse. */
  skip: number[];
  /** Les valeurs modulées, par position (comme des verrous). */
  overrides: Map<number, ParameterValues>;
  words: Map<number, WordModulation>;
  /** Les paramètres dont une valeur a été repliée dans ses bornes. */
  folded: Set<string>;
}

/**
 * Module une instance sur le texte qu'elle reçoit. La porte se décide d'abord, sur les mots de ses
 * pistes ni bouchés ni retirés (un mot retiré n'est plus dans le texte reçu) ; les valeurs se
 * calculent ensuite sur les mots qu'elle laisse passer, que le rang, le motif et la rampe comptent.
 */
export function modulate(stage: ModulationStage, input: ModulationInput): Modulation {
  const { words, categories, gaps } = stage;
  const result: Modulation = { skip: [], overrides: new Map(), words: new Map(), folded: new Set() };
  const entry = (k: number) => result.words.get(k) ?? result.words.set(k, { values: {} }).get(k)!;
  const lines = lineNumbers(gaps);

  /** La source au k-ième mot, i-ième de `count` ; une note quand elle n'a rien à lire. */
  const read = (source: Source, how: Read, k: number, i: number, count: number): number | ModulationNote => {
    if (source.kind === 'line') return lines[k]!;
    if (!isWordSource(source)) return positionValue(source, i, count);
    const at = how.kind === 'self' ? k : neighbourOf(k, how.track, how.side, categories, gaps);
    if (at === undefined) return 'no-neighbour';
    return wordValue(source, words[at]!, categories[at]!, input.syllables) ?? 'loading';
  };

  const eligible = categories.flatMap((category, k) => (input.targets.has(category) && !input.closed.has(k) ? [k] : []));
  let treated = eligible;
  if (input.gate) {
    const { source, read: how, test } = input.gate;
    treated = eligible.filter((k, i) => {
      const value = read(source, how, k, i, eligible.length);
      // Rien à lire : la porte reste ouverte, et l'inspecteur dit pourquoi.
      if (typeof value === 'string') {
        entry(k).note = value;
        return true;
      }
      const open = passes(test, value);
      entry(k).gate = open ? 'open' : 'closed';
      if (!open) result.skip.push(k);
      return open;
    });
  }

  for (const [key, modulator] of Object.entries(input.modulators ?? {})) {
    const parameter = input.parameters.find((candidate) => candidate.key === key);
    if (parameter?.kind !== 'integer' || !parameter.lockable) continue;
    treated.forEach((k, i) => {
      const source = read(modulator.source, modulator.read, k, i, treated.length);
      if (typeof source === 'string') {
        entry(k).note = source;
        return;
      }
      const { value, folded } = modulatedValue(modulator.base, modulator.depth, source, parameter.min, parameter.max);
      if (folded) result.folded.add(key);
      entry(k).values[key] = value;
      result.overrides.set(k, { ...result.overrides.get(k), [key]: value });
    });
  }
  return result;
}

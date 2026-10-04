import { z } from 'zod';
import { CATEGORIES } from '../categories.ts';
import { linesOf } from '../lines.ts';
import { plainWords } from '../mixing.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { removeWord } from '../removal.ts';
import { CLOSED } from '../reasons.ts';

const ParamsSchema = z.object({
  mode: z.enum(['ends', 'head-tail', 'inside']).default('ends'),
  n: z.number().int().min(1).max(9).default(1),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const MODES = { ends: 'fins de vers', 'head-tail': 'tête-à-queue', inside: 'intérieur' } as const;

const words = (n: number) => `${n} ${n > 1 ? 'mots' : 'mot'}`;

/** Les mots qu'un mode garde dans une ligne, selon sa place dans le texte. */
function keptOf(line: readonly number[], mode: keyof typeof MODES, n: number, outer: boolean): number[] {
  switch (mode) {
    case 'ends':
      return line.slice(-n);
    case 'head-tail':
      return [...line.slice(0, n), ...line.slice(-n)];
    case 'inside':
      return outer ? [] : line.slice(n, -n);
  }
}

/**
 * Bord : ne garde que les fins de vers (Haï-kaïsation), les débuts et fins (tête-à-queue), ou
 * l'intérieur du poème, sans premier ni dernier vers, ni les n premiers et derniers mots des
 * autres. Agit sur tout le texte ; un pas bouché garde son mot.
 */
export const edgePlugin = definePlugin({
  id: 'edge',
  name: 'Bord',
  targetable: false,
  tracks: [...CATEGORIES],
  defaultTargets: [...CATEGORIES],
  parameters: [
    { kind: 'choice', key: 'mode', label: 'Mode', options: Object.entries(MODES).map(([value, label]) => ({ value, label })) },
    { kind: 'integer', key: 'n', label: 'Mots', min: 1, max: 9 },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Bord',
  label: (values) => {
    const { mode, n } = params(values);
    return `bord : ${MODES[mode]}, ${words(n)}`;
  },
  help(values) {
    const { mode, n } = params(values);
    switch (mode) {
      // Un seul mot se dit « le dernier mot », pas « les 1 mot ».
      case 'ends':
        return n === 1 ? 'Ne garde que le dernier mot de chaque vers.' : `Ne garde que les ${words(n)} de la fin de chaque vers.`;
      case 'head-tail':
        return n === 1
          ? 'Ne garde que le premier et le dernier mot de chaque vers.'
          : `Ne garde que les ${words(n)} du début et de la fin de chaque vers.`;
      case 'inside':
        return n === 1
          ? 'Ôte le premier et le dernier vers, puis le premier et le dernier mot des autres.'
          : `Ôte le premier et le dernier vers, puis les ${words(n)} du début et de la fin des autres.`;
    }
  },
  apply(text, tagged, values, _resources, _targets, scope = FULL_SCOPE) {
    const { mode, n } = params(values);
    const skip = new Set(scope.skip);
    const plain = plainWords(text);
    const output = plain.words;
    let tail = plain.tail;
    const lines = linesOf(output);
    const kept = new Set(lines.flatMap((line, k) => keptOf(line, mode, n, k === 0 || k === lines.length - 1)));
    const marks: WordMark[] = [];
    // Le dernier mot resté visible : les retraits vont dans l'ordre du texte, il suffit de le suivre.
    let visible = -1;
    for (const index of lines.flat()) {
      if (kept.has(index)) {
        visible = index;
        continue;
      }
      const original = tagged[index]!.word;
      if (skip.has(index)) {
        marks.push({ index, original, reason: CLOSED });
        visible = index;
        continue;
      }
      tail = removeWord(output, index, tail, visible);
      marks.push({ index, original, removed: true });
    }
    return { words: output, tail, marks };
  },
});

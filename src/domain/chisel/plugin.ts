import { z } from 'zod';
import { CATEGORIES } from '../categories.ts';
import { linesOf } from '../lines.ts';
import { plainWords } from '../mixing.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { removeWord } from '../removal.ts';
import { CLOSED } from '../reasons.ts';
import { BREATH, firstWrittenSyllable, initialOf, vowelsOf } from './tiers.ts';

const ParamsSchema = z.object({
  final: z.number().int().min(1).max(5).default(5),
  perTier: z.number().int().min(1).max(9).default(1),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** Les paliers, du texte au souffle. */
const TIERS = ['texte', 'mots pleins', 'syllabe', 'voyelles', 'lettre', 'souffle'] as const;

/** Ce que devient un mot plein à un palier (de 2 à 5) ; au palier 1, il reste entier. */
const CARVE: Record<number, (word: string) => string> = {
  2: firstWrittenSyllable,
  3: vowelsOf,
  4: initialOf,
  5: () => BREATH,
};

/** Le palier d'un vers : le premier reste intact, puis on descend d'un palier tous les `perTier` vers. */
export const tierOf = (line: number, final: number, perTier: number) => Math.min(final, Math.ceil(line / perTier));

/**
 * Ciselure : à la manière d'Isou, défait le texte vers par vers. Le premier vers reste intact ;
 * ensuite chaque groupe de vers descend d'un palier, sans remonter : les mots-outils tombent,
 * puis chaque mot se réduit à sa première syllabe écrite, à ses voyelles, à son initiale, enfin à
 * un souffle. Agit sur tout le texte ; un pas bouché garde son mot.
 */
export const chiselPlugin = definePlugin({
  id: 'chisel',
  name: 'Ciselure',
  targetable: false,
  tracks: [...CATEGORIES],
  defaultTargets: [...CATEGORIES],
  parameters: [
    { kind: 'integer', key: 'final', label: 'Palier final', min: 1, max: 5 },
    { kind: 'integer', key: 'perTier', label: 'Vers par palier', min: 1, max: 9 },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Ciselure',
  label: (values) => {
    const { final, perTier } = params(values);
    return `ciselure jusqu’au palier ${TIERS[final]}, ${perTier} vers par palier`;
  },
  help(values) {
    const { final, perTier } = params(values);
    const steps = TIERS.slice(1, final + 1).join(', puis ');
    return `Le premier vers reste intact ; ensuite le texte descend d’un palier tous les ${perTier > 1 ? `${perTier} vers` : 'vers'} : ${steps}. Un texte d’un seul vers ne change pas : placez une Mise en vers avant la Ciselure.`;
  },
  apply(text, tagged, values, _resources, _targets, scope = FULL_SCOPE) {
    const { final, perTier } = params(values);
    const skip = new Set(scope.skip);
    const plain = plainWords(text);
    const output = plain.words;
    let tail = plain.tail;
    const marks: WordMark[] = [];
    // Le dernier mot resté visible : les retraits vont dans l'ordre du texte, il suffit de le suivre.
    let visible = -1;
    linesOf(output).forEach((line, n) => {
      const tier = tierOf(n, final, perTier);
      for (const index of line) {
        const word = output[index]!;
        const original = tagged[index]!.word;
        if (tier === 0) {
          visible = index;
          continue;
        }
        if (skip.has(index)) {
          marks.push({ index, original, reason: CLOSED });
          visible = index;
          continue;
        }
        if (tagged[index]!.category === 'other') {
          tail = removeWord(output, index, tail, visible);
          marks.push({ index, original, removed: true });
          continue;
        }
        visible = index;
        const carved = CARVE[tier]?.(word.output) ?? word.output;
        if (carved === word.output) continue;
        word.output = carved;
        marks.push({ index, original, replacement: carved });
      }
    });
    return { words: output, tail, marks };
  },
});

import { z } from 'zod';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { applyRhymeFilter } from './engine.ts';

const ParamsSchema = z.object({ offset: z.number().int().min(1).max(9).default(1) });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** Les homophonies : chaque mot devient un mot de sa catégorie qui se prononce pareil (« vers » → « ver »). */
export const homophonyPlugin = definePlugin({
  id: 'homophony',
  name: 'Homophonies',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun'],
  phonetic: true,
  parameters: [{ kind: 'integer', key: 'offset', label: 'Rang', min: 1, max: 9 }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Homophonies',
  label: (values) => (params(values).offset === 1 ? 'homophonies' : `homophonies, rang ${params(values).offset}`),
  help: (values) => {
    const { offset } = params(values);
    const rank = offset === 1 ? 'le premier' : `le ${offset}e`;
    return `Chaque mot devient ${rank} mot de sa catégorie qui le suit dans le dictionnaire et se prononce exactement pareil, en faisant le tour ; un mot sans homophone reste.`;
  },
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const settings = params(values);
    const locked = new Map(scope.overrides.map(({ index, values: own }) => [index, params({ ...values, ...own }).offset]));
    return applyRhymeFilter(text, tagged, resources, targets, scope, {
      eligible: () => true,
      decide(index, word, category, sounds) {
        const original = sounds.of(word, category);
        const same = original ? sounds.homophones(original, category) : new Set<string>();
        const lower = word.toLowerCase();
        if (![...same].some((form) => form !== lower)) return { reason: 'aucun homophone' };
        return { offset: locked.get(index) ?? settings.offset, accept: (form) => form !== lower && same.has(form), none: 'aucun homophone' };
      },
    });
  },
});

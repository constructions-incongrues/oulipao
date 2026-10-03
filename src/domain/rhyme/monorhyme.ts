import { z } from 'zod';
import { rhymeOf } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { applyRhymeFilter } from './engine.ts';
import { FREQUENT_RHYMES } from './frequent-rhymes.ts';

const RHYMES = FREQUENT_RHYMES.map(({ rhyme }) => rhyme) as [string, ...string[]];
const EXAMPLES = new Map(FREQUENT_RHYMES.map(({ rhyme, example }) => [rhyme, example]));

const ParamsSchema = z.object({ rhyme: z.enum(RHYMES).default(RHYMES.includes('ɔ̃') ? 'ɔ̃' : RHYMES[0]) });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** « /ɔ̃/ (formation) » : la rime en API et un nom qui la porte. */
const named = (rhyme: string) => `/${rhyme}/ (${EXAMPLES.get(rhyme)})`;

/** Le monorime : chaque fin de vers prend la rime choisie, celle du premier voisin qui la porte. */
export const monorhymePlugin = definePlugin({
  id: 'monorhyme',
  name: 'Monorime',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  phonetic: true,
  parameters: [{ kind: 'choice', key: 'rhyme', label: 'Rime', options: RHYMES.map((rhyme) => ({ value: rhyme, label: named(rhyme) })) }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: (values) => `Monorime en /${params(values).rhyme}/`,
  label: (values) => `monorime en ${named(params(values).rhyme)}`,
  help: (values) =>
    `Chaque fin de vers devient le premier mot de sa catégorie qui la suit dans le dictionnaire et finit en /${params(values).rhyme}/ ; une fin de vers qui y est déjà reste.`,
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const { rhyme } = params(values);
    return applyRhymeFilter(text, tagged, resources, targets, scope, {
      eligible: (index, places) => places[index]!.lineEnd,
      decide(_index, word, category, sounds) {
        const original = sounds.of(word, category);
        if (original && rhymeOf(original) === rhyme) return { reason: 'déjà sur la rime' };
        return {
          offset: 1,
          accept: (form) => {
            const sound = sounds.of(form, category);
            return !!sound && rhymeOf(sound) === rhyme;
          },
          none: 'aucun mot sur cette rime',
        };
      },
    });
  },
});

import { z } from 'zod';
import { GENDER_LABELS, GenderSchema, hasGender, RHYME_GENDER_LABELS, rhymeGender, rhymeOf } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { planByVerse } from './engine.ts';
import { FREQUENT_RHYMES } from './frequent-rhymes.ts';
import { wantedGender } from './scheme.ts';

const RHYMES = FREQUENT_RHYMES.map(({ rhyme }) => rhyme) as [string, ...string[]];
const EXAMPLES = new Map(FREQUENT_RHYMES.map(({ rhyme, example }) => [rhyme, example]));

const ParamsSchema = z.object({
  rhyme: z.enum(RHYMES).default(RHYMES.includes('ɔ̃') ? 'ɔ̃' : RHYMES[0]),
  gender: GenderSchema.default('any'),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** « /ɔ̃/ (formation) » : la rime en API et un nom qui la porte. */
const named = (rhyme: string) => `/${rhyme}/ (${EXAMPLES.get(rhyme)})`;
const genderNote = (values: ParameterValues) => {
  const { gender } = params(values);
  return gender === 'any' ? '' : `, ${GENDER_LABELS[gender]}`;
};

/**
 * Le monorime : chaque fin de vers prend la rime choisie, celle du premier voisin qui la porte. Le
 * genre restreint les voisins ; alterné, il change de vers en vers dans la strophe, en partant de
 * celui du premier vers (le sonnet monorime).
 */
export const monorhymePlugin = definePlugin({
  id: 'monorhyme',
  name: 'Monorime',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  phonetic: true,
  parameters: [
    { kind: 'choice', key: 'rhyme', label: 'Rime', options: RHYMES.map((rhyme) => ({ value: rhyme, label: named(rhyme) })) },
    { kind: 'choice', key: 'gender', label: 'Genre', options: GenderSchema.options.map((value) => ({ value, label: GENDER_LABELS[value] })) },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: (values) => `Monorime en /${params(values).rhyme}/`,
  label: (values) => `monorime en ${named(params(values).rhyme)}${genderNote(values)}`,
  help: (values) =>
    `Chaque fin de vers devient le premier mot de sa catégorie qui la suit dans le dictionnaire et finit en /${params(values).rhyme}/${genderNote(values) && ` (${GENDER_LABELS[params(values).gender]})`} ; une fin de vers qui y est déjà reste.`,
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const { rhyme, gender } = params(values);
    return planByVerse(text, tagged, resources, targets, scope, (place) => place.lineEnd, (slots, { sounds, settle }) => {
      const voiced = slots.filter((slot) => slot.sound);
      const first = voiced[0] && rhymeGender(voiced[0].word, voiced[0].sound!);
      voiced.forEach((slot, position) => {
        if (!slot.open) return;
        const wanted = wantedGender(gender, position, first!);
        const fits = (form: string, sound: Parameters<typeof rhymeOf>[0] | undefined) => !!sound && rhymeOf(sound) === rhyme && hasGender(form, sound, wanted);
        if (fits(slot.word, slot.sound)) return void settle(slot, { reason: 'déjà sur la rime' });
        settle(slot, {
          offset: 1,
          accept: (form) => fits(form, sounds.of(form, slot.category)),
          none: wanted === 'any' ? 'aucun mot sur cette rime' : `aucun mot sur cette rime, en rime ${RHYME_GENDER_LABELS[wanted]}`,
        });
      });
    });
  },
});

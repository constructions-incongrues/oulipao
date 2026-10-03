import { z } from 'zod';
import { rhymes, RICHNESS_LABELS, RichnessSchema } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { applyRhymeFilter, candidatesFor } from './engine.ts';

const MIN_OFFSET = -20;
const MAX_OFFSET = 20;

/** Où agit un filtre de rime : sur tous les mots de ses pistes, ou seulement en fin de vers. */
export const ReachSchema = z.enum(['all', 'line-ends']);
export const REACH_OPTIONS = [
  { value: 'all', label: 'tous les mots' },
  { value: 'line-ends', label: 'fins de vers' },
];
export const RICHNESS_OPTIONS = RichnessSchema.options.map((value) => ({ value, label: RICHNESS_LABELS[value] }));

const ParamsSchema = z.object({
  offset: z.number().int().min(MIN_OFFSET).max(MAX_OFFSET).default(7),
  richness: RichnessSchema.default('sufficient'),
  reach: ReachSchema.default('all'),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** « R+7 », « R−3 » : avec un vrai signe moins. */
const title = (values: ParameterValues) => {
  const { offset } = params(values);
  return `R${offset < 0 ? '−' : '+'}${Math.abs(offset)}`;
};

/**
 * Le R+n : chaque mot devient le n-ième mot qui le suit dans le dictionnaire, dans sa catégorie,
 * parmi ceux qui riment avec lui, accordé comme au S+n.
 */
export const rnPlugin = definePlugin({
  id: 'rn',
  name: 'R+n',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun'],
  phonetic: true,
  parameters: [
    { kind: 'integer', key: 'offset', label: 'Décalage', min: MIN_OFFSET, max: MAX_OFFSET, lockable: true },
    { kind: 'choice', key: 'richness', label: 'Rime', options: RICHNESS_OPTIONS },
    { kind: 'choice', key: 'reach', label: 'Où', options: REACH_OPTIONS },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: (values) => params(values).offset !== 0,
  title,
  label(values) {
    const { richness, reach } = params(values);
    return `${title(values)}, rime ${RICHNESS_LABELS[richness]}${reach === 'line-ends' ? ', fins de vers' : ''}`;
  },
  help(values) {
    const { offset, richness, reach } = params(values);
    if (offset === 0) return 'R+0 : aucun changement.';
    const rank = `${Math.abs(offset)}${Math.abs(offset) === 1 ? 'er' : 'e'}`;
    const where = reach === 'line-ends' ? 'Chaque fin de vers' : 'Chaque mot';
    return `${where} devient le ${rank} mot de sa catégorie qui le ${offset > 0 ? 'suit' : 'précède'} dans le dictionnaire et rime avec lui (rime ${RICHNESS_LABELS[richness]}) ; la phrase est réaccordée.`;
  },
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const settings = params(values);
    // Un verrou se complète des réglages de l'instance et passe par la même validation.
    const locked = new Map(scope.overrides.map(({ index, values: own }) => [index, params({ ...values, ...own }).offset]));
    return applyRhymeFilter(text, tagged, resources, targets, scope, {
      eligible: (index, places) => settings.reach === 'all' || places[index]!.lineEnd,
      decide(index, word, category, sounds) {
        const original = sounds.of(word, category);
        const offset = locked.get(index) ?? settings.offset;
        if (!original) return { reason: 'prononciation inconnue' };
        if (offset === 0) return { reason: 'R+0 sur ce mot' };
        return {
          offset,
          // Rimer à cette richesse suppose de partager la finale exigée du mot (vide s'il est trop court).
          among: candidatesFor(sounds, original, settings.richness, category),
          accept: (form) => {
            const sound = sounds.of(form, category);
            return !!sound && form.toLowerCase() !== word.toLowerCase() && rhymes(original, sound, settings.richness);
          },
          none: `aucune rime ${RICHNESS_LABELS[settings.richness]}`,
        };
      },
    });
  },
});

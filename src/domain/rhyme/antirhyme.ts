import { z } from 'zod';
import type { Phoneme } from '../phonetics/phoneme.ts';
import { rhymes, RICHNESS_LABELS, RichnessSchema } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { planByVerse } from './engine.ts';
import { RICHNESS_OPTIONS } from './rn.ts';

const ParamsSchema = z.object({ richness: RichnessSchema.default('sufficient') });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/**
 * L'antirime : dans chaque strophe, une fin de vers qui rime avec une fin de vers précédente
 * devient le premier mot qui la suit dans le dictionnaire et ne rime avec aucune d'elles.
 */
export const antirhymePlugin = definePlugin({
  id: 'antirhyme',
  name: 'Antirime',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  phonetic: true,
  parameters: [{ kind: 'choice', key: 'richness', label: 'Rime', options: RICHNESS_OPTIONS }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Antirime',
  label: (values) => `antirime, rime ${RICHNESS_LABELS[params(values).richness]}`,
  help: (values) =>
    `Dans chaque strophe, une fin de vers qui rime (rime ${RICHNESS_LABELS[params(values).richness]}) avec une fin de vers précédente devient le premier mot qui la suit dans le dictionnaire et ne rime plus avec aucune.`,
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const { richness } = params(values);
    // Le plan se fait vers par vers, dans l'ordre : une fin remplacée compte ensuite par sa rime nouvelle.
    // ponytail: la rime nouvelle est prévue sans le contexte de la phrase ; un accord différent
    // (pluriel) la change rarement, puisque le s final ne s'entend pas.
    return planByVerse(text, tagged, resources, targets, scope, (place) => place.lineEnd, (slots, { sounds, settle }) => {
      const kept: (readonly Phoneme[])[] = [];
      for (const slot of slots) {
        const { sound, category } = slot;
        if (!sound) continue;
        if (!slot.open || !kept.some((other) => rhymes(sound, other, richness))) {
          kept.push(sound);
          continue;
        }
        const before = [...kept];
        kept.push(
          settle(slot, {
            offset: 1,
            accept: (form) => {
              const candidate = sounds.of(form, category);
              return !!candidate && !before.some((other) => rhymes(candidate, other, richness));
            },
            none: 'aucun voisin sans cette rime',
          })!,
        );
      }
    });
  },
});

import { z } from 'zod';
import { rhymeOf, rhymes, RICHNESS_LABELS, RichnessSchema } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { planByVerse } from './engine.ts';
import { RICHNESS_OPTIONS } from './rn.ts';

const ParamsSchema = z.object({ richness: RichnessSchema.default('sufficient') });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/**
 * L'antérime : la rime passe au début des vers. Dans chaque strophe, par paires de vers, le premier
 * mot plein du second vers devient le premier voisin qui rime avec celui du premier. Les fins de
 * vers ne changent pas.
 */
export const anterhymePlugin = definePlugin({
  id: 'anterhyme',
  name: 'Antérime',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  phonetic: true,
  parameters: [{ kind: 'choice', key: 'richness', label: 'Rime', options: RICHNESS_OPTIONS }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Antérime',
  label: (values) => `antérime, rime ${RICHNESS_LABELS[params(values).richness]}`,
  help: (values) =>
    `Par paires de vers, le premier mot plein du second vers devient le premier voisin qui rime (rime ${RICHNESS_LABELS[params(values).richness]}) avec le premier mot plein du vers qui le précède.`,
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const { richness } = params(values);
    return planByVerse(text, tagged, resources, targets, scope, (place) => place.lineStart, (slots, { sounds, settle }) => {
      for (let k = 1; k < slots.length; k += 2) {
        const [head, slot] = [slots[k - 1]!.sound, slots[k]!];
        if (!head || !slot.sound || !slot.open || rhymes(slot.sound, head, richness)) continue;
        settle(slot, {
          offset: 1,
          among: sounds.rhyming(rhymeOf(head), slot.category), // rimer suppose la même rime
          accept: (form) => {
            const candidate = sounds.of(form, slot.category);
            return !!candidate && rhymes(candidate, head, richness);
          },
          none: `aucun voisin en /${rhymeOf(head)}/`,
        });
      }
    });
  },
});

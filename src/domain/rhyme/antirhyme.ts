import { z } from 'zod';
import type { Phoneme } from '../phonetics/phoneme.ts';
import { rhymes, RICHNESS_LABELS, RichnessSchema } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { layoutVerse } from '../verse.ts';
import { applyRhymeFilter, probe, soundsFor, type Decision } from './engine.ts';
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
    const sounds = soundsFor(resources);
    // Le plan se fait vers par vers, dans l'ordre : une fin remplacée compte ensuite par sa rime nouvelle.
    // ponytail: la rime nouvelle est prévue sans le contexte de la phrase ; un accord différent
    // (pluriel) la change rarement, puisque le s final ne s'entend pas.
    const plan = new Map<number, Decision>();
    if (sounds) {
      const places = layoutVerse(text, tagged);
      const skip = new Set(scope.skip);
      let stanza = 0;
      let kept: (readonly Phoneme[])[] = [];
      places.forEach((place, index) => {
        if (!place.lineEnd) return;
        if (place.stanza !== stanza) [stanza, kept] = [place.stanza, []];
        const { word, category } = tagged[index]!;
        const sound = sounds.of(word, category);
        if (!sound) return;
        if (!kept.some((other) => rhymes(sound, other, richness)) || !targets.has(category) || skip.has(index)) return void kept.push(sound);
        const before = [...kept];
        const decision: Decision = {
          offset: 1,
          accept: (form) => {
            const candidate = sounds.of(form, category);
            return !!candidate && !before.some((other) => rhymes(candidate, other, richness));
          },
          none: 'aucun voisin sans cette rime',
        };
        plan.set(index, decision);
        const replacement = probe(word, category, decision, resources);
        const replaced = replacement && sounds.of(replacement, category);
        kept.push(replaced || sound);
      });
    }
    return applyRhymeFilter(
      text,
      tagged,
      resources,
      targets,
      scope,
      {
        // Sans prononciations, toutes les fins de vers attendent ; ensuite, seules celles du plan changent.
        eligible: (index, places) => places[index]!.lineEnd && (!sounds || plan.has(index) || scope.skip.includes(index)),
        decide: (index) => plan.get(index) ?? { reason: 'aucune rime avant elle' },
      },
      sounds,
    );
  },
});

import { z } from 'zod';
import type { Phoneme } from '../phonetics/phoneme.ts';
import { GENDER_LABELS, GenderSchema, hasGender, rhymeGender, rhymeOf, rhymes, RICHNESS_LABELS, RichnessSchema, type RhymeGender } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues } from '../plugin.ts';
import { planByVerse } from './engine.ts';
import { RICHNESS_OPTIONS } from './rn.ts';
import { lettersFor, SCHEME_LABELS, SchemeSchema, wantedGender } from './scheme.ts';

const SchemeGenderSchema = GenderSchema.extract(['any', 'alternate']);
const ParamsSchema = z.object({
  scheme: SchemeSchema.default('embrassees'),
  richness: RichnessSchema.default('sufficient'),
  gender: SchemeGenderSchema.default('any'),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** Le schéma choisi dans des réglages du filtre. */
export const schemeOf = (values: ParameterValues) => params(values).scheme;

const opposite = (gender: RhymeGender): RhymeGender => (gender === 'masculine' ? 'feminine' : 'masculine');

/**
 * Le schéma de rimes : dans chaque strophe, chaque fin de vers reçoit une lettre. Le premier vers
 * d'une lettre garde sa fin et fixe la rime de la lettre ; les vers suivants de la même lettre
 * deviennent le premier voisin qui porte cette rime ; un vers d'une autre lettre qui rime par
 * accident devient le premier voisin qui ne rime plus. La rime bisexuelle impose ses genres : dans
 * chaque tercet, les deux premiers vers d'un genre, le troisième de l'autre.
 */
export const rhymeSchemePlugin = definePlugin({
  id: 'rhyme-scheme',
  name: 'Schéma de rimes',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  phonetic: true,
  parameters: [
    { kind: 'choice', key: 'scheme', label: 'Schéma', options: SchemeSchema.options.map((value) => ({ value, label: SCHEME_LABELS[value] })) },
    { kind: 'choice', key: 'richness', label: 'Rime', options: RICHNESS_OPTIONS },
    { kind: 'choice', key: 'gender', label: 'Genre', options: SchemeGenderSchema.options.map((value) => ({ value, label: GENDER_LABELS[value] })) },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: (values) => SCHEME_LABELS[params(values).scheme].replace(/ \(.*\)$/, '').replace(/^./, (c) => c.toUpperCase()),
  label: (values) => {
    const { scheme, richness, gender } = params(values);
    return `${SCHEME_LABELS[scheme]}, rime ${RICHNESS_LABELS[richness]}${gender === 'alternate' && scheme !== 'bisexuelle' ? `, ${GENDER_LABELS[gender]}` : ''}`;
  },
  help: (values) =>
    `Dans chaque strophe, les fins de vers suivent le schéma ${SCHEME_LABELS[params(values).scheme]} : le premier vers d'une lettre fixe sa rime, les suivants prennent le premier voisin qui la porte, un vers d'une autre lettre qui rime par accident prend le premier voisin qui ne rime plus.`,
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const { scheme, richness, gender } = params(values);
    return planByVerse(text, tagged, resources, targets, scope, (place) => place.lineEnd, (slots, { sounds, settle }) => {
      const letters = lettersFor(scheme, slots.length);
      const voiced = slots.find((slot) => slot.sound);
      const first = voiced ? rhymeGender(voiced.word, voiced.sound!) : 'masculine';
      const references = new Map<string, readonly Phoneme[]>();
      let group: RhymeGender = first;
      slots.forEach((slot, position) => {
        const letter = letters[position];
        if (scheme === 'bisexuelle' && position % 3 === 0) group = slot.sound ? rhymeGender(slot.word, slot.sound) : first;
        if (letter == null || !slot.sound) return;
        const wanted = scheme === 'bisexuelle' ? (position % 3 === 0 ? 'any' : position % 3 === 1 ? group : opposite(group)) : wantedGender(gender, position, first);
        const reference = references.get(letter);
        const others = [...references].filter(([other]) => other !== letter).map(([, sound]) => sound);
        const fits = (form: string, sound: readonly Phoneme[] | undefined) =>
          !!sound && hasGender(form, sound, wanted) && (reference ? rhymes(sound, reference, richness) : !others.some((other) => rhymes(sound, other, richness)));
        if (!slot.open || fits(slot.word, slot.sound)) {
          if (!reference) references.set(letter, slot.sound);
          return;
        }
        const settled = settle(slot, {
          offset: 1,
          // Une lettre déjà posée : le voisin doit avoir sa rime. Sinon le critère est de ne plus
          // rimer, ce que l'index ne sert pas : parcours complet.
          ...(reference && { among: sounds.rhyming(rhymeOf(reference), slot.category) }),
          accept: (form) => fits(form, sounds.of(form, slot.category)),
          none: reference ? `aucun voisin en /${rhymeOf(reference)}/ (${letter})` : `aucun voisin hors des autres rimes (${letter})`,
        });
        if (!reference) references.set(letter, settled!);
      });
    });
  },
});

import { z } from 'zod';
import { plainWords } from '../mixing.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { shiftAdjectives } from './adjective-shift.ts';
import { rewriteVerbs, shiftVerb } from '../verb.ts';
import { applyS7 } from './engine.ts';
import { elides } from './elision.ts';
import { S7ModeSchema, type SubstitutionStatus } from './types.ts';

/** Bornes du décalage. */
const MIN_OFFSET = -99;
const MAX_OFFSET = 99;

const ParamsSchema = z.object({
  offset: z.number().int().min(MIN_OFFSET).max(MAX_OFFSET).default(7),
  mode: S7ModeSchema.default('reagree'),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const AMONG = { reagree: 'tous les noms', 'same-gender': 'les noms du même genre' } as const;

const REASONS: Record<Exclude<SubstitutionStatus, 'replaced'>, string> = {
  'unknown-noun': 'absent du dictionnaire',
  'missing-form': 'aucun nom au bon genre et au bon nombre',
};

/** La raison d'un mot laissé parce que son pas est bouché. */
export const CLOSED = 'pas bouché';

/** « S+7 », « S−3 » : avec un vrai signe moins. */
const title = (values: ParameterValues) => {
  const { offset } = params(values);
  return `S${offset < 0 ? '−' : '+'}${Math.abs(offset)}`;
};

/** Le S+7 de Jean Lescure : chaque nom devient le n-ième nom qui le suit dans le dictionnaire. */
export const s7Plugin = definePlugin({
  id: 's7',
  name: 'S+7',
  // Les noms, les adjectifs (au même genre et au même nombre) et les verbes (au même temps et à la
  // même personne : le V+7).
  tracks: ['noun', 'adjective', 'verb'],
  defaultTargets: ['noun'],
  parameters: [
    { kind: 'integer', key: 'offset', label: 'Décalage', min: MIN_OFFSET, max: MAX_OFFSET, lockable: true },
    {
      kind: 'choice',
      key: 'mode',
      label: 'Parmi',
      options: [
        { value: 'reagree', label: AMONG.reagree },
        { value: 'same-gender', label: AMONG['same-gender'] },
      ],
    },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: (values) => params(values).offset !== 0,
  title,
  // « parmi tous les noms » est le réglage par défaut : on ne le dit que s'il change.
  label: (values) => (params(values).mode === 'reagree' ? title(values) : `${title(values)}, parmi ${AMONG['same-gender']}`),
  help(values, targets = new Set(['noun'])) {
    const { offset, mode } = params(values);
    if (offset === 0) return 'S+0 : aucun changement.';
    const rank = `${Math.abs(offset)}${Math.abs(offset) === 1 ? 'er' : 'e'}`;
    const direction = offset > 0 ? 'suit' : 'précède';
    const sentences: string[] = [];
    if (targets.has('noun'))
      sentences.push(
        mode === 'reagree'
          ? `Chaque nom devient le ${rank} nom qui le ${direction} dans le dictionnaire ; la phrase est réaccordée.`
          : `Chaque nom devient le ${rank} nom de même genre qui le ${direction} dans le dictionnaire.`,
      );
    if (targets.has('adjective')) sentences.push(`Chaque adjectif devient le ${rank} adjectif qui le ${direction} dans le dictionnaire, au même genre et au même nombre.`);
    if (targets.has('verb')) sentences.push(`Chaque verbe devient le ${rank} verbe qui le ${direction} dans le dictionnaire, au même temps et à la même personne ; « être » et « avoir » restent.`);
    return sentences.join(' ');
  },
  apply(text, tagged, values, { morphology, verbs }, targets, scope = FULL_SCOPE) {
    const settings = params(values);
    const skip = new Set(scope.skip);
    // Un verrou se complète des réglages de l'instance et passe par la même validation.
    const locked = new Map(scope.overrides.map(({ index, values: own }) => [index, params({ ...values, ...own }).offset]));
    const offsetAt = (index: number) => locked.get(index) ?? settings.offset;
    let words;
    let tail;
    const marks: WordMark[] = [];
    // Les noms d'abord : leur remplacement réaccorde les adjectifs, que le décalage lit ensuite.
    if (targets.has('noun')) {
      const s7 = applyS7(text, tagged, settings, morphology, { skip, offsetAt });
      ({ words, tail } = s7);
      for (const { index, original, replacement, status } of s7.substitutions) {
        if (skip.has(index)) marks.push({ index, original, reason: CLOSED });
        else marks.push(status === 'replaced' ? { index, original, replacement } : { index, original, reason: REASONS[status] });
      }
    } else {
      ({ words, tail } = plainWords(text));
    }
    const apostrophe = text.includes('’') ? '’' : "'";
    if (targets.has('adjective')) {
      marks.push(...shiftAdjectives(words, tagged, (index) => (skip.has(index) ? undefined : offsetAt(index)), apostrophe, morphology));
    }
    if (targets.has('verb')) {
      // Les pas bouchés gardent leur raison ; les autres verbes reçoivent leur propre décalage.
      for (const index of skip) if (tagged[index]?.category === 'verb') marks.push({ index, original: tagged[index]!.word, reason: CLOSED });
      marks.push(
        ...rewriteVerbs(
          words,
          tagged,
          (index) => !skip.has(index),
          (word, previous, repository, index) => shiftVerb(word, previous, offsetAt(index), repository),
          verbs,
          apostrophe,
          (word) => elides(word, { blocksElision: (form) => !!verbs?.blocksElision(form) || morphology.blocksElision(form) }),
        ),
      );
    }
    return { words, tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

import { z } from 'zod';
import { plainWords } from '../mixing.ts';
import { definePlugin, type ParameterValues, type WordMark } from '../plugin.ts';
import { shiftAdjectives } from './adjective-shift.ts';
import { applyS7 } from './engine.ts';
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

/** « S+7 », « S−3 » : avec un vrai signe moins. */
const title = (values: ParameterValues) => {
  const { offset } = params(values);
  return `S${offset < 0 ? '−' : '+'}${Math.abs(offset)}`;
};

/** Le S+7 de Jean Lescure : chaque nom devient le n-ième nom qui le suit dans le dictionnaire. */
export const s7Plugin = definePlugin({
  id: 's7',
  name: 'S+7',
  // Les noms, et les adjectifs : le n-ième adjectif suivant, au même genre et au même nombre.
  tracks: ['noun', 'adjective'],
  defaultTargets: ['noun'],
  parameters: [
    { kind: 'integer', key: 'offset', label: 'Décalage', min: MIN_OFFSET, max: MAX_OFFSET },
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
    const adjectives = `adjectif devient le ${rank} adjectif qui le ${direction} dans le dictionnaire, au même genre et au même nombre.`;
    if (!targets.has('noun')) return `Chaque ${adjectives}`;
    const nouns =
      mode === 'reagree'
        ? `Chaque nom devient le ${rank} nom qui le ${direction} dans le dictionnaire ; la phrase est réaccordée.`
        : `Chaque nom devient le ${rank} nom de même genre qui le ${direction} dans le dictionnaire.`;
    return targets.has('adjective') ? `${nouns} Chaque ${adjectives}` : nouns;
  },
  apply(text, tagged, values, { morphology }, targets) {
    const settings = params(values);
    let words;
    let tail;
    const marks: WordMark[] = [];
    // Les noms d'abord : leur remplacement réaccorde les adjectifs, que le décalage lit ensuite.
    if (targets.has('noun')) {
      const s7 = applyS7(text, tagged, settings, morphology);
      ({ words, tail } = s7);
      for (const { index, original, replacement, status } of s7.substitutions) {
        marks.push(status === 'replaced' ? { index, original, replacement } : { index, original, reason: REASONS[status] });
      }
    } else {
      ({ words, tail } = plainWords(text));
    }
    if (targets.has('adjective')) {
      marks.push(...shiftAdjectives(words, tagged, settings.offset, text.includes('’') ? '’' : "'", morphology));
    }
    return { words, tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

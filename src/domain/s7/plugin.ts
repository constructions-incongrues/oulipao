import { z } from 'zod';
import { definePlugin, type ParameterValues } from '../plugin.ts';
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
  track: 'noun',
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
  label: (values) => `${title(values)}, parmi ${AMONG[params(values).mode]}`,
  help(values) {
    const { offset, mode } = params(values);
    if (offset === 0) return 'S+0 : aucun changement.';
    const rank = `${Math.abs(offset)}${Math.abs(offset) === 1 ? 'er' : 'e'}`;
    const direction = offset > 0 ? 'suit' : 'précède';
    return mode === 'reagree'
      ? `Chaque nom devient le ${rank} nom qui le ${direction} dans le dictionnaire ; la phrase est réaccordée.`
      : `Chaque nom devient le ${rank} nom de même genre qui le ${direction} dans le dictionnaire.`;
  },
  apply(text, tagged, values, { morphology }) {
    const { words, tail, substitutions } = applyS7(text, tagged, params(values), morphology);
    const marks = substitutions.map(({ index, original, replacement, status }) =>
      status === 'replaced' ? { index, original, replacement } : { index, original, reason: REASONS[status] },
    );
    return { words, tail, marks };
  },
});

import { z } from 'zod';
import { plainWords } from '../mixing.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { shiftAdjectives } from './adjective-shift.ts';
import { rewriteVerbs, shiftVerb } from '../verb.ts';
import { applyS7 } from './engine.ts';
import { elides } from './elision.ts';
import { rankedMorphology } from './ranked-morphology.ts';
import { S7ModeSchema, S7OrderSchema, type S7Order, type ScaleCategory, type SubstitutionStatus } from './types.ts';

/** Bornes du décalage. */
const MIN_OFFSET = -99;
const MAX_OFFSET = 99;

const MAX_SEED = 9_999_999;

const ParamsSchema = z.object({
  offset: z.number().int().min(MIN_OFFSET).max(MAX_OFFSET).default(7),
  mode: S7ModeSchema.default('reagree'),
  /** La liste parcourue : l'ordre du dictionnaire, ou une échelle affective. */
  order: S7OrderSchema.default('alphabetical'),
  /** Le décalage : le même pour tous les mots, ou tiré au dé pour chacun (le S+dé). */
  draw: z.enum(['fixed', 'dice']).default('fixed'),
  seed: z.number().int().min(1).max(MAX_SEED).default(1),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const AMONG = { reagree: 'tous les noms', 'same-gender': 'les noms du même genre' } as const;

const REASONS: Record<Exclude<SubstitutionStatus, 'replaced'>, string> = {
  'unknown-noun': 'absent du dictionnaire',
  'missing-form': 'aucun nom au bon genre et au bon nombre',
};

/** La lettre du titre, et le nom de l'échelle dans l'aide et la note : « V+3 », « valence ». */
const ORDERS: Record<S7Order, { letter: string; label: string; scale: string }> = {
  alphabetical: { letter: 'S', label: 'alphabétique', scale: 'dans le dictionnaire' },
  valence: { letter: 'V', label: 'valence', scale: 'sur l’échelle de valence, du plus sombre au plus clair' },
  arousal: { letter: 'I', label: 'intensité', scale: 'sur l’échelle d’intensité, du plus calme au plus intense' },
  concreteness: { letter: 'C', label: 'concrétude', scale: 'sur l’échelle de concrétude, du plus abstrait au plus concret' },
};

/** La raison d'un mot laissé parce qu'il n'a pas de note sur l'échelle choisie. */
export const UNSCORED = 'sans note';
/** La raison des mots laissés tant que les échelles ne sont pas chargées. */
export const SCALES_LOADING = 'échelles en cours de chargement';

/** La raison d'un mot laissé parce que son pas est bouché. */
export const CLOSED = 'pas bouché';

/**
 * Le dé du S+dé : une face de 1 à 6, déduite de la graine et de la position du mot seulement, pour
 * que le tirage soit le même à chaque calcul et à chaque réouverture (mélange de Murmur3, 32 bits).
 */
export function dieRoll(seed: number, index: number): number {
  let h = Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b9), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) % 6) + 1;
}

/** « S+7 », « S−3 » : avec un vrai signe moins ; « S+dé » quand le décalage est tiré au dé. */
const title = (values: ParameterValues) => {
  const { offset, draw, order } = params(values);
  const { letter } = ORDERS[order];
  if (draw === 'dice') return `${letter}+dé`;
  return `${letter}${offset < 0 ? '−' : '+'}${Math.abs(offset)}`;
};

/** Le S+7 de Jean Lescure : chaque nom devient le n-ième nom qui le suit dans le dictionnaire. */
export const s7Plugin = definePlugin({
  id: 's7',
  name: 'S+7',
  nameOf: (values) => {
    const { draw, order } = params(values);
    if (draw === 'dice') return `${ORDERS[order].letter}+dé`;
    return order === 'alphabetical' ? 'S+7' : `${ORDERS[order].letter}+n`;
  },
  needsScales: (values) => params(values).order !== 'alphabetical',
  // Les noms, les adjectifs (au même genre et au même nombre) et les verbes (au même temps et à la
  // même personne : le V+7).
  tracks: ['noun', 'adjective', 'verb'],
  defaultTargets: ['noun'],
  parameters: [
    { kind: 'integer', key: 'offset', label: 'Décalage', min: MIN_OFFSET, max: MAX_OFFSET, lockable: true, when: { key: 'draw', values: ['fixed'] } },
    {
      kind: 'choice',
      key: 'order',
      label: 'Ordre',
      options: S7OrderSchema.options.map((value) => ({ value, label: ORDERS[value].label })),
    },
    {
      kind: 'choice',
      key: 'mode',
      label: 'Parmi',
      options: [
        { value: 'reagree', label: AMONG.reagree },
        { value: 'same-gender', label: AMONG['same-gender'] },
      ],
    },
    {
      kind: 'choice',
      key: 'draw',
      label: 'Tirage',
      options: [
        { value: 'fixed', label: 'fixe' },
        { value: 'dice', label: 'au dé' },
      ],
    },
    { kind: 'integer', key: 'seed', label: 'Graine', min: 1, max: MAX_SEED, when: { key: 'draw', values: ['dice'] } },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: (values) => params(values).draw === 'dice' || params(values).offset !== 0,
  title,
  // « parmi tous les noms » est le réglage par défaut : on ne le dit que s'il change.
  label: (values) => (params(values).mode === 'reagree' ? title(values) : `${title(values)}, parmi ${AMONG['same-gender']}`),
  help(values, targets = new Set(['noun'])) {
    const { offset, mode, draw, order } = params(values);
    const { letter, scale } = ORDERS[order];
    // L'échelle vient de normes publiées, et ne note que les noms et les adjectifs.
    const source =
      order === 'alphabetical'
        ? ''
        : ` Échelle tirée de normes affectives du français (openlexicon) ; un mot sans note reste${targets.has('verb') ? ', et les verbes aussi' : ''}.`;
    if (draw === 'dice') return `${letter}+dé : chaque mot visé avance ${scale} d’un nombre de places tiré au dé, de 1 à 6, selon la graine ; changez la graine pour relancer le dé. Un verrou garde son décalage.${source}`;
    if (offset === 0) return `${letter}+0 : aucun changement.`;
    const rank = `${Math.abs(offset)}${Math.abs(offset) === 1 ? 'er' : 'e'}`;
    const direction = offset > 0 ? 'suit' : 'précède';
    const sentences: string[] = [];
    if (targets.has('noun'))
      sentences.push(
        mode === 'reagree'
          ? `Chaque nom devient le ${rank} nom qui le ${direction} ${scale} ; la phrase est réaccordée.`
          : `Chaque nom devient le ${rank} nom de même genre qui le ${direction} ${scale}.`,
      );
    if (targets.has('adjective')) sentences.push(`Chaque adjectif devient le ${rank} adjectif qui le ${direction} ${scale}, au même genre et au même nombre.`);
    if (targets.has('verb') && order === 'alphabetical') sentences.push(`Chaque verbe devient le ${rank} verbe qui le ${direction} dans le dictionnaire, au même temps et à la même personne ; « être » et « avoir » restent.`);
    return sentences.join(' ') + source;
  },
  apply(text, tagged, values, resources, targets, scope = FULL_SCOPE) {
    const settings = params(values);
    const { verbs, scales } = resources;
    const skip = new Set(scope.skip);
    const ordered = settings.order !== 'alphabetical';
    // Sans ses échelles, un S+n ordonné laisse le texte : l'hôte les charge, puis recalcule.
    if (settings.order !== 'alphabetical' && !scales) {
      const marks: WordMark[] = [];
      tagged.forEach((word, index) => targets.has(word.category) && marks.push({ index, original: word.word, reason: skip.has(index) ? CLOSED : SCALES_LOADING }));
      return { ...plainWords(text), marks };
    }
    const morphology = settings.order !== 'alphabetical' ? rankedMorphology(resources.morphology, scales!, settings.order) : resources.morphology;
    // Un verrou se complète des réglages de l'instance et passe par la même validation.
    const locked = new Map(scope.overrides.map(({ index, values: own }) => [index, params({ ...values, ...own }).offset]));
    const offsetAt = (index: number) => locked.get(index) ?? (settings.draw === 'dice' ? dieRoll(settings.seed, index) : settings.offset);
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
    // Les échelles ne notent pas les verbes : un S+n ordonné les laisse.
    if (targets.has('verb') && !ordered) {
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
    if (settings.order !== 'alphabetical') {
      const order = settings.order;
      // Un lemme noté de la forme, parmi ses lectures dans sa catégorie.
      const scoreOf = (form: string, category: ScaleCategory) => {
        const lemmas = category === 'noun' ? morphology.nounReadings(form.toLowerCase()).map((r) => r.lemma) : morphology.adjectiveReadings(form.toLowerCase()).map((r) => r.paradigm);
        return lemmas.map((lemma) => scales!.score(order, category, lemma)).find((score) => score !== undefined);
      };
      for (const mark of marks) {
        if (mark.reason === REASONS['unknown-noun']) mark.reason = UNSCORED;
        const category = tagged[mark.index]?.category;
        if (mark.replacement === undefined || (category !== 'noun' && category !== 'adjective')) continue;
        const [before, after] = [scoreOf(mark.original, category), scoreOf(mark.replacement, category)];
        if (before !== undefined && after !== undefined) mark.detail = `${ORDERS[order].label} ${before} → ${after}`;
      }
    }
    return { words, tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

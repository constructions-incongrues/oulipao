import { z } from 'zod';
import { CATEGORIES } from '../categories.ts';
import { plainWords } from '../mixing.ts';
import { lineSyllables } from '../phonetics/lookup.ts';
import { definePlugin, type ParameterValues, type WordMark } from '../plugin.ts';
import type { TaggedWord } from '../tagged-word.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';

const MAX_NUMBER = 9_999_999;

const ParamsSchema = z.object({
  cut: z.enum(['every', 'syllables', 'punctuation', 'number']).default('every'),
  n: z.number().int().min(1).max(99).default(6),
  syllables: z.number().int().min(1).max(99).default(8),
  number: z.number().int().min(1).max(MAX_NUMBER).default(1_234_567),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const CUTS = { every: 'tous les n mots', syllables: 'tous les n syllabes', punctuation: 'aux ponctuations', number: 'selon un nombre' } as const;
const PUNCTUATION = /[.!?…;:,]/;
const OPENING = /[«“([]/;

/** Le blanc d'un mot mis à la ligne : sa ponctuation reste en fin de ligne, un guillemet ouvrant passe à la ligne. */
function broken(gap: string): string {
  const core = gap.replace(/\s+/g, ' ').trim();
  const at = core.search(OPENING);
  const before = at < 0 ? core : core.slice(0, at).trim();
  const after = at < 0 ? '' : core.slice(at);
  // « ; : ! ? » gardent leur espace avant eux, insécable si le texte d'origine l'était.
  const space = gap.match(/[\u00A0\u202F]/)?.[0] ?? ' ';
  return `${/^[;:!?]/.test(before) ? `${space}${before}` : before}\n${after === '«' ? '« ' : after}`;
}

// Avant que les prononciations n'arrivent, chaque mot a sa prononciation devinée.
const GUESSED: PhoneticsRepository = { readings: () => [], homophones: () => [], rhyming: () => [], ending: () => [] };

/**
 * Les positions (parmi les mots comptés) qui ouvrent une ligne quand chaque vers prend au moins
 * `n` syllabes : un mot ne se coupe pas, le vers qui l'atteint s'arrête après lui.
 */
function syllableBreaks(groups: readonly TaggedWord[][], n: number, phonetics: PhoneticsRepository): Set<number> {
  const breaks = new Set<number>();
  let line: TaggedWord[] = [];
  groups.forEach((group, k) => {
    line.push(...group);
    if (k + 1 < groups.length && (lineSyllables(line, phonetics) ?? 0) >= n) {
      breaks.add(k + 1);
      line = [];
    }
  });
  return breaks;
}

/** Les positions (parmi les mots comptés) qui ouvrent une ligne. */
function breaksOf(gaps: readonly string[], cut: Exclude<keyof typeof CUTS, 'syllables'>, n: number, number: number): Set<number> {
  const breaks = new Set<number>();
  if (cut === 'every') {
    for (let k = n; k < gaps.length; k += n) breaks.add(k);
  } else if (cut === 'punctuation') {
    gaps.forEach((gap, k) => k > 0 && PUNCTUATION.test(gap) && breaks.add(k));
  } else {
    // Les chiffres du nombre, zéros sautés, donnent la longueur des lignes successives, en boucle.
    const lengths = [...String(number)].map(Number).filter(Boolean);
    for (let k = 0, line = 0; k < gaps.length; line++) {
      k += lengths[line % lengths.length]!;
      if (k < gaps.length) breaks.add(k);
    }
  }
  return breaks;
}

/**
 * Mise en vers : coupe les lignes tous les n mots (Poème de bandit), tous les n syllabes, après chaque ponctuation,
 * ou selon les chiffres d'un nombre (Juliennes). Les mots ne changent pas, seuls leurs blancs ;
 * les sauts de ligne d'avant sont remplacés. Agit sur tout le texte.
 */
export const lineationPlugin = definePlugin({
  id: 'lineation',
  name: 'Mise en vers',
  targetable: false,
  tracks: [...CATEGORIES],
  defaultTargets: [...CATEGORIES],
  parameters: [
    { kind: 'choice', key: 'cut', label: 'Coupe', options: Object.entries(CUTS).map(([value, label]) => ({ value, label })) },
    { kind: 'integer', key: 'n', label: 'Mots par vers', min: 1, max: 99, when: { key: 'cut', values: ['every'] } },
    { kind: 'integer', key: 'syllables', label: 'Syllabes par vers', min: 1, max: 99, when: { key: 'cut', values: ['syllables'] } },
    { kind: 'integer', key: 'number', label: 'Nombre', min: 1, max: MAX_NUMBER, when: { key: 'cut', values: ['number'] } },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  needsPhonetics: (values) => params(values).cut === 'syllables',
  acts: () => true,
  title: () => 'Mise en vers',
  label: (values) => {
    const { cut, n, syllables, number } = params(values);
    if (cut === 'every') return `mise en vers tous les ${n} mots`;
    if (cut === 'syllables') return `mise en vers tous les ${syllables} syllabes`;
    if (cut === 'punctuation') return 'mise en vers aux ponctuations';
    return `mise en vers selon ${number}`;
  },
  help(values) {
    const { cut, n, syllables, number } = params(values);
    if (cut === 'every') return `Va à la ligne tous les ${n} mots ; les mots ne changent pas.`;
    if (cut === 'syllables') return `Va à la ligne dès que le vers compte ${syllables} syllabes, sans couper de mot ; les mots ne changent pas.`;
    if (cut === 'punctuation') return 'Va à la ligne après chaque ponctuation ; les mots ne changent pas.';
    return `Les chiffres de ${number} donnent le nombre de mots de chaque vers, en boucle, zéros sautés.`;
  },
  apply(text, tagged, values, resources) {
    const { cut, n, syllables, number } = params(values);
    const { words, tail } = plainWords(text);
    // Un mot collé au précédent (« l’horloge ») compte avec lui et ne passe jamais à la ligne.
    const counted = words.filter((word, index) => index === 0 || word.gap !== '');
    const breaks =
      cut === 'syllables'
        ? syllableBreaks(
            counted.map((word, k) => tagged.slice(word.index, counted[k + 1]?.index ?? words.length)),
            syllables,
            resources.phonetics ?? GUESSED,
          )
        : breaksOf(counted.map((word) => word.gap), cut, n, number);
    const marks: WordMark[] = [];
    counted.forEach((word, k) => {
      if (k === 0) return;
      const gap = breaks.has(k) ? broken(word.gap) : word.gap.replace(/\s*\n\s*/g, ' ');
      if (gap === word.gap) return;
      word.gap = gap;
      marks.push({ index: word.index, original: tagged[word.index]!.word, relaid: true });
    });
    return { words, tail, marks };
  },
});

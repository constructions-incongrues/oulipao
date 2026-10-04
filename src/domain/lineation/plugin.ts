import { z } from 'zod';
import { CATEGORIES } from '../categories.ts';
import { plainWords } from '../mixing.ts';
import { definePlugin, type ParameterValues, type WordMark } from '../plugin.ts';

const MAX_NUMBER = 9_999_999;

const ParamsSchema = z.object({
  cut: z.enum(['every', 'punctuation', 'number']).default('every'),
  n: z.number().int().min(1).max(99).default(6),
  number: z.number().int().min(1).max(MAX_NUMBER).default(1_234_567),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const CUTS = { every: 'tous les n mots', punctuation: 'aux ponctuations', number: 'selon un nombre' } as const;
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

/** Les positions (parmi les mots comptés) qui ouvrent une ligne. */
function breaksOf(gaps: readonly string[], cut: keyof typeof CUTS, n: number, number: number): Set<number> {
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
 * Mise en vers : coupe les lignes tous les n mots (Poème de bandit), après chaque ponctuation,
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
    { kind: 'integer', key: 'number', label: 'Nombre', min: 1, max: MAX_NUMBER, when: { key: 'cut', values: ['number'] } },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Mise en vers',
  label: (values) => {
    const { cut, n, number } = params(values);
    if (cut === 'every') return `mise en vers tous les ${n} mots`;
    if (cut === 'punctuation') return 'mise en vers aux ponctuations';
    return `mise en vers selon ${number}`;
  },
  help(values) {
    const { cut, n, number } = params(values);
    if (cut === 'every') return `Va à la ligne tous les ${n} mots ; les mots ne changent pas.`;
    if (cut === 'punctuation') return 'Va à la ligne après chaque ponctuation ; les mots ne changent pas.';
    return `Les chiffres de ${number} donnent le nombre de mots de chaque vers, en boucle, zéros sautés.`;
  },
  apply(text, tagged, values) {
    const { cut, n, number } = params(values);
    const { words, tail } = plainWords(text);
    // Un mot collé au précédent (« l’horloge ») compte avec lui et ne passe jamais à la ligne.
    const counted = words.filter((word, index) => index === 0 || word.gap !== '');
    const breaks = breaksOf(counted.map((word) => word.gap), cut, n, number);
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

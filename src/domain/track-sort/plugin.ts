import { z } from 'zod';
import { CATEGORIES, type Category } from '../categories.ts';
import { plainWords } from '../mixing.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { removeWord } from '../removal.ts';
import { CLOSED } from '../reasons.ts';

const ParamsSchema = z.object({
  mode: z.enum(['remove', 'keep']).default('remove'),
  layout: z.enum(['as-is', 'one-per-line']).default('as-is'),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const PLURALS: Record<Category, string> = { noun: 'noms', verb: 'verbes', adjective: 'adjectifs', adverb: 'adverbes', other: 'autres mots' };
const MODES = { remove: 'retirer', keep: 'ne garder que' } as const;
const LAYOUTS = { 'as-is': 'telle quelle', 'one-per-line': 'un mot par ligne' } as const;

/** « les noms et les adjectifs » : les pistes visées, dans l'ordre de la table. */
const phrase = (targets: ReadonlySet<Category>) => {
  const names = CATEGORIES.filter((track) => targets.has(track)).map((track) => `les ${PLURALS[track]}`);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0]!;
};

const label = (values: ParameterValues) => {
  const { mode, layout } = params(values);
  const name = mode === 'remove' ? 'retrait' : 'inventaire';
  return layout === 'one-per-line' ? `${name}, un mot par ligne` : name;
};

/**
 * Tri par piste : retire les mots des pistes visées, ou ne garde qu'eux (Liponymie, La rien que
 * la toute la, Inventaire). Le blanc d'un mot retiré passe au suivant ; en disposition « un mot
 * par ligne », chaque mot restant prend sa ligne, sans ponctuation.
 */
export const trackSortPlugin = definePlugin({
  id: 'track-sort',
  name: 'Tri par piste',
  tracks: [...CATEGORIES],
  defaultTargets: ['noun'],
  parameters: [
    { kind: 'choice', key: 'mode', label: 'Mode', options: [{ value: 'remove', label: MODES.remove }, { value: 'keep', label: MODES.keep }] },
    {
      kind: 'choice',
      key: 'layout',
      label: 'Disposition',
      options: [{ value: 'as-is', label: LAYOUTS['as-is'] }, { value: 'one-per-line', label: LAYOUTS['one-per-line'] }],
    },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: (values) => (params(values).mode === 'remove' ? 'Retrait' : 'Inventaire'),
  label,
  help(values, targets = new Set<Category>(['noun'])) {
    const { mode, layout } = params(values);
    const sentence = mode === 'remove' ? `Retire ${phrase(targets)}.` : `Ne garde que ${phrase(targets)}.`;
    return layout === 'one-per-line' ? `${sentence} Un mot par ligne, sans ponctuation.` : sentence;
  },
  apply(text, tagged, values, _resources, targets, scope = FULL_SCOPE) {
    const { mode, layout } = params(values);
    const skip = new Set(scope.skip);
    const plain = plainWords(text);
    const words = plain.words;
    let tail = plain.tail;
    const marks: WordMark[] = [];
    // Le dernier mot resté visible : les retraits vont dans l'ordre du texte, il suffit de le suivre.
    let visible = -1;
    tagged.forEach(({ word, category }, index) => {
      if (targets.has(category) !== (mode === 'remove')) return void (words[index]!.output && (visible = index));
      if (skip.has(index)) {
        visible = index;
        return void marks.push({ index, original: word, reason: CLOSED });
      }
      tail = removeWord(words, index, tail, visible);
      marks.push({ index, original: word, removed: true });
    });
    if (layout === 'one-per-line') {
      const marked = new Set(marks.map((mark) => mark.index));
      let first = true;
      for (const word of words) {
        if (!word.output) continue;
        // Un mot collé au précédent (« l’horloge ») reste collé.
        const gap = first ? '' : word.gap === '' ? '' : '\n';
        if (gap !== word.gap && !marked.has(word.index)) marks.push({ index: word.index, original: tagged[word.index]!.word, relaid: true });
        word.gap = gap;
        first = false;
      }
      tail = '';
    }
    return { words, tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

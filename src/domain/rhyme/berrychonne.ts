import { rhymeOf, splitRhyme } from '../phonetics/rhyme.ts';
import { definePlugin, FULL_SCOPE } from '../plugin.ts';
import { planByVerse } from './engine.ts';

/**
 * La rime berrychonne : dans chaque strophe, la fin de chaque troisième vers devient le premier
 * voisin dont la rime croise les deux précédentes, la voyelle de l'une et les consonnes finales de
 * l'autre (/aʁ/ et /ɔl/ donnent /ɔʁ/ ou /al/).
 */
export const berrychonnePlugin = definePlugin({
  id: 'berrychonne',
  name: 'Rime berrychonne',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  phonetic: true,
  parameters: [],
  defaults: {},
  parse: () => ({}),
  acts: () => true,
  title: () => 'Rime berrychonne',
  label: () => 'rime berrychonne',
  help: () =>
    'La fin de chaque troisième vers devient le premier voisin dont la rime prend la voyelle de l’une des deux fins précédentes et les consonnes finales de l’autre.',
  apply(text, tagged, _values, resources, targets, scope = FULL_SCOPE) {
    return planByVerse(text, tagged, resources, targets, scope, (place) => place.lineEnd, (slots, { sounds, settle }) => {
      for (let k = 2; k < slots.length; k += 3) {
        const [a, b, slot] = [slots[k - 2]!.sound, slots[k - 1]!.sound, slots[k]!];
        if (!a || !b || !slot.sound || !slot.open) continue;
        const [x, y] = [splitRhyme(a), splitRhyme(b)];
        const crossed = new Set([x.vowel + y.coda, y.vowel + x.coda]);
        if (crossed.has(rhymeOf(slot.sound))) continue;
        settle(slot, {
          offset: 1,
          accept: (form) => {
            const candidate = sounds.of(form, slot.category);
            return !!candidate && crossed.has(rhymeOf(candidate));
          },
          none: `aucun voisin en ${[...crossed].map((r) => `/${r}/`).join(' ni ')}`,
        });
      }
    });
  },
});

// Un plugin d'essai sur toutes les pistes : retire les mots qui contiennent une lettre, et laisse
// tels quels les verbes. Sert à éprouver la page sans le vrai lipogramme.
import { plainWords } from '../../src/domain/mixing.ts';
import { definePlugin, type ConstraintPlugin, type WordMark } from '../../src/domain/plugin.ts';

export const sansPlugin: ConstraintPlugin = definePlugin({
  id: 'sans',
  name: 'Sans',
  track: 'all',
  parameters: [{ kind: 'choice', key: 'lettre', label: 'Lettre', options: [{ value: 'e', label: 'e' }, { value: 'a', label: 'a' }] }],
  defaults: { lettre: 'e' },
  parse: (values) => ({ lettre: 'e', ...values }),
  acts: () => true,
  title: (values) => `Sans ${values['lettre']}`,
  label: (values) => `sans ${values['lettre']}`,
  help: () => 'Retire les mots qui contiennent la lettre.',
  apply(text, tagged, values) {
    const letter = String(values['lettre'] ?? 'e');
    const { words, tail } = plainWords(text);
    const marks: WordMark[] = [];
    for (const [i, word] of tagged.entries()) {
      if (!word.word.toLowerCase().includes(letter)) continue;
      if (word.category === 'verb') {
        marks.push({ index: i, original: word.word, reason: 'verbe' });
        continue;
      }
      words[i] = { ...words[i]!, output: '', gap: '' };
      marks.push({ index: i, original: word.word, removed: true });
    }
    return { words, tail, marks };
  },
});

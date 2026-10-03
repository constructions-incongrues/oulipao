import assert from 'node:assert/strict';
import { test } from 'node:test';
import { definePlugin, type ConstraintPlugin } from '../../src/domain/plugin.ts';
import { plainWords } from '../../src/domain/mixing.ts';

const base: ConstraintPlugin = {
  id: 'essai',
  name: 'Essai',
  track: 'verb',
  parameters: [
    { kind: 'integer', key: 'n', label: 'N', min: 0, max: 3 },
    { kind: 'choice', key: 'sens', label: 'Sens', options: [{ value: 'haut', label: 'vers le haut' }] },
  ],
  defaults: { n: 1, sens: 'haut' },
  parse: (values) => {
    if (typeof values['n'] !== 'number' || values['n'] > 3) throw new Error('n invalide');
    return values;
  },
  acts: () => true,
  title: () => 'Essai',
  label: () => 'Essai',
  help: () => 'Un essai.',
  apply: (text) => ({ ...plainWords(text), marks: [] }),
};

test('definePlugin : accepte une déclaration correcte et la rend telle quelle', () => {
  assert.equal(definePlugin(base), base);
});

test('definePlugin : refuse une déclaration incohérente', () => {
  assert.throws(() => definePlugin({ ...base, id: '' }));
  assert.throws(() => definePlugin({ ...base, track: 'pronom' as never }));
  assert.throws(() => definePlugin({ ...base, parameters: [{ kind: 'choice', key: 'x', label: 'X', options: [] }] }));
  assert.throws(() => definePlugin({ ...base, parameters: [base.parameters[0]!, base.parameters[0]!] }), /même clé/);
  assert.throws(() => definePlugin({ ...base, parameters: [{ kind: 'integer', key: 'n', label: 'N', min: 3, max: 0 }] }), /bornes inversées/);
  assert.throws(() => definePlugin({ ...base, defaults: { n: 9, sens: 'haut' } }), /n invalide/); // valeurs d'ouverture refusées
});

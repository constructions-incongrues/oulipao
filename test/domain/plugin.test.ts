import assert from 'node:assert/strict';
import { test } from 'node:test';
import { definePlugin, visibleParameters, type ConstraintPlugin } from '../../src/domain/plugin.ts';
import { lineationPlugin } from '../../src/domain/lineation/plugin.ts';
import { s7Plugin } from '../../src/domain/s7/plugin.ts';
import { plainWords } from '../../src/domain/mixing.ts';

const base: ConstraintPlugin = {
  id: 'essai',
  name: 'Essai',
  tracks: ['verb'],
  defaultTargets: ['verb'],
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

test('definePlugin : accepte un paramètre texte', () => {
  const text = { ...base, parameters: [{ kind: 'text' as const, key: 'lettres', label: 'Lettres', maxLength: 40 }] };
  assert.equal(definePlugin(text), text);
});

test('definePlugin : refuse une déclaration incohérente', () => {
  assert.throws(() => definePlugin({ ...base, id: '' }));
  assert.throws(() => definePlugin({ ...base, tracks: ['pronom' as never] }));
  assert.throws(() => definePlugin({ ...base, defaultTargets: ['noun'] }), /piste par défaut/);
  assert.throws(() => definePlugin({ ...base, parameters: [{ kind: 'choice', key: 'x', label: 'X', options: [] }] }));
  assert.throws(() => definePlugin({ ...base, parameters: [{ kind: 'text', key: 'x', label: 'X', maxLength: 0 }] }));
  assert.throws(() => definePlugin({ ...base, parameters: [base.parameters[0]!, base.parameters[0]!] }), /même clé/);
  assert.throws(() => definePlugin({ ...base, parameters: [{ kind: 'integer', key: 'n', label: 'N', min: 3, max: 0 }] }), /bornes inversées/);
  assert.throws(() => definePlugin({ ...base, defaults: { n: 9, sens: 'haut' } }), /n invalide/); // valeurs d'ouverture refusées
  // une contrainte non ciblable vise les cinq pistes, toutes par défaut
  assert.throws(() => definePlugin({ ...base, targetable: false }), /non ciblable/);
  const all = ['noun', 'verb', 'adjective', 'adverb', 'other'] as const;
  assert.throws(() => definePlugin({ ...base, targetable: false, tracks: [...all], defaultTargets: ['noun'] }), /non ciblable/);
  assert.equal(definePlugin({ ...base, targetable: false, tracks: [...all], defaultTargets: [...all] }).targetable, false);
});

test('visibleParameters : un paramètre ne paraît qu’avec les choix qui s’en servent ; une instance ancienne prend le choix par défaut', () => {
  const keys = (plugin: ConstraintPlugin, values: Record<string, number | string>) => visibleParameters(plugin, values).map((parameter) => parameter.key);
  assert.deepEqual(keys(lineationPlugin, { ...lineationPlugin.defaults, cut: 'every' }), ['cut', 'n']);
  assert.deepEqual(keys(lineationPlugin, { ...lineationPlugin.defaults, cut: 'number' }), ['cut', 'number']);
  assert.deepEqual(keys(lineationPlugin, { ...lineationPlugin.defaults, cut: 'punctuation' }), ['cut']);
  assert.deepEqual(keys(s7Plugin, { offset: 7, mode: 'reagree' }), ['offset', 'mode', 'draw']);
  assert.deepEqual(keys(s7Plugin, { ...s7Plugin.defaults, draw: 'dice' }), ['mode', 'draw', 'seed']);
  assert.deepEqual(keys(base, base.defaults), ['n', 'sens']);
});

test('definePlugin : un paramètre ne dépend que d’un choix déclaré et de ses valeurs', () => {
  const [n, sens] = base.parameters;
  assert.ok(definePlugin({ ...base, parameters: [{ ...n!, when: { key: 'sens', values: ['haut'] } }, sens!] }));
  assert.throws(() => definePlugin({ ...base, parameters: [{ ...n!, when: { key: 'absent', values: ['haut'] } }, sens!] }), /dépend d'un choix inconnu/);
  assert.throws(() => definePlugin({ ...base, parameters: [n!, { ...sens!, when: { key: 'n', values: ['1'] } }] }), /dépend d'un choix inconnu/);
  assert.throws(() => definePlugin({ ...base, parameters: [{ ...n!, when: { key: 'sens', values: ['bas'] } }, sens!] }), /dépend d'un choix inconnu/);
});

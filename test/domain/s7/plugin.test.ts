import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyS7 } from '../../../src/domain/s7/engine.ts';
import { s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { morphology, tag } from '../../support/morphology.ts';

const m = morphology();

test('déclaration : sur la piste des noms, Décalage borné à ±99 et Parmi ; S+7 réaccordé à l’ouverture', () => {
  assert.deepEqual(s7Plugin.tracks, ['noun', 'adjective']);
  assert.deepEqual(s7Plugin.defaultTargets, ['noun']);
  assert.deepEqual(s7Plugin.parameters.map((p) => p.label), ['Décalage', 'Parmi']);
  assert.deepEqual(s7Plugin.defaults, { offset: 7, mode: 'reagree' });
  assert.deepEqual(s7Plugin.parse({ offset: -99 }), { offset: -99, mode: 'reagree' });
  assert.throws(() => s7Plugin.parse({ offset: 100 }));
  assert.throws(() => s7Plugin.parse({ offset: 1.5 }));
  assert.throws(() => s7Plugin.parse({ mode: 'au hasard' }));
});

test('titre, libellé, aide et neutralité selon le réglage', () => {
  assert.equal(s7Plugin.title({ offset: -3 }), 'S−3');
  assert.equal(s7Plugin.label({ offset: 7, mode: 'same-gender' }), 'S+7, parmi les noms du même genre');
  assert.equal(s7Plugin.help({ offset: 7 }), 'Chaque nom devient le 7e nom qui le suit dans le dictionnaire ; la phrase est réaccordée.');
  assert.equal(s7Plugin.help({ offset: -1, mode: 'same-gender' }), 'Chaque nom devient le 1er nom de même genre qui le précède dans le dictionnaire.');
  assert.equal(s7Plugin.help({ offset: 0 }), 'S+0 : aucun changement.');
  // sur les adjectifs, seuls ou avec les noms
  assert.equal(s7Plugin.help({ offset: 3 }, new Set(['adjective'])), 'Chaque adjectif devient le 3e adjectif qui le suit dans le dictionnaire, au même genre et au même nombre.');
  assert.match(s7Plugin.help({ offset: 3 }, new Set(['noun', 'adjective'])), /réaccordée\. Chaque adjectif devient le 3e adjectif/);
  assert.equal(s7Plugin.acts({ offset: 0 }), false);
  assert.equal(s7Plugin.acts({ offset: 2 }), true);
});

test('apply : la sortie du moteur, et ce qu’il a fait de chaque nom', () => {
  const text = 'La vieille ferme et la Zorglub.';
  const tagged = tag(text, { Zorglub: 'noun' });
  const result = s7Plugin.apply(text, tagged, { offset: 1, mode: 'reagree' }, { morphology: m }, new Set(['noun']));
  const engine = applyS7(text, tagged, { offset: 1, mode: 'reagree' }, m);
  assert.deepEqual(result.words, engine.words);
  assert.equal(result.tail, engine.tail);
  assert.deepEqual(result.marks, [
    { index: 2, original: 'ferme', replacement: 'fermoir' },
    { index: 5, original: 'Zorglub', reason: 'absent du dictionnaire' },
  ]);
  const odd = s7Plugin.apply('La ferme.', tag('La ferme.'), { offset: 99, mode: 'same-gender' }, { morphology: m }, new Set(['noun']));
  assert.ok(odd.marks.every((mark) => mark.replacement !== undefined || mark.reason === 'aucun nom au bon genre et au bon nombre'));
});

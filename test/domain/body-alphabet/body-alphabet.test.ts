import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES } from '../../../src/domain/categories.ts';
import { bodyAlphabetPlugin, embodyGap, embodyWord } from '../../../src/domain/body-alphabet/plugin.ts';
import { definePlugin, type WordScope } from '../../../src/domain/plugin.ts';
import { installedPlugins } from '../../../src/domain/registry.ts';
import { morphology, tag } from '../../support/morphology.ts';

const run = (text: string, replace = 'punctuation', scope?: WordScope) => {
  const result = bodyAlphabetPlugin.apply(text, tag(text), bodyAlphabetPlugin.parse({ replace }), { morphology: morphology() }, new Set(CATEGORIES), scope);
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};

test('ponctuation : virgule, point, ! et ? deviennent des mots ; les mots ne changent pas', () => {
  assert.equal(run('Le chat dort, la pluie tombe.').text, 'Le chat dort pfou la pluie tombe clac');
  assert.equal(run('Il pleut ! Tu viens ?').text, 'Il pleut fuit Tu viens fuit');
  assert.equal(run('Un vers,\nun autre.').text, 'Un vers pfou\nun autre clac');
  assert.equal(embodyGap(' '), ' ');
});

test('sons : les lettres qui portent /s/, /f/ et /k/ deviennent tss, pf et tk, collées ; une lettre muette reste', () => {
  assert.equal(embodyWord('garçon'), 'gartsson');
  assert.equal(embodyWord('temps'), 'temps');
  assert.equal(embodyWord('photo'), 'pfoto');
  assert.equal(embodyWord('Café'), 'Tkapfé');
  assert.equal(embodyWord('taxi'), 'tatktssi');
  // rejoué, le moteur ne retravaille pas ses propres sons, ni le souffle de la Ciselure
  for (const word of ['gartsson', 'pfoto', 'Tkapfé', 'pfou', 'clac', 'fuit']) assert.equal(embodyWord(word), word);
  assert.equal(run('Le garçon dort, la pluie tombe.', 'sounds').text, 'Le gartsson dort, la pluie tombe.');
  assert.equal(run('Le garçon dort, la pluie tombe.', 'both').text, 'Le gartsson dort pfou la pluie tombe clac');
});

test('pas bouché : le mot reste ; les marques disent ce qui a changé', () => {
  const closed = run('Le garçon dort, la pluie tombe.', 'both', { skip: [1], overrides: [] });
  assert.equal(closed.text, 'Le garçon dort pfou la pluie tombe clac');
  assert.ok(closed.marks.some((mark) => mark.index === 1 && mark.reason === 'pas bouché'));
  assert.ok(closed.marks.some((mark) => mark.index === 3 && mark.relaid));
  const sounds = run('Le garçon dort, la pluie tombe.', 'sounds');
  assert.ok(sounds.marks.some((mark) => mark.index === 1 && mark.replacement === 'gartsson'));
  assert.ok(run('Le chat dort, la pluie.', 'both').marks.some((mark) => mark.index === 3 && mark.relaid && !mark.replacement));
});

test('Alphabet augmenté : déclaré, inscrit, réglable, nommé, sans textbank', () => {
  assert.equal(definePlugin(bodyAlphabetPlugin), bodyAlphabetPlugin);
  assert.ok(installedPlugins.includes(bodyAlphabetPlugin));
  assert.equal(bodyAlphabetPlugin.targetable, false);
  assert.ok(!bodyAlphabetPlugin.phonetic);
  assert.deepEqual(bodyAlphabetPlugin.defaults, { replace: 'punctuation' });
  assert.equal(bodyAlphabetPlugin.title(bodyAlphabetPlugin.defaults), 'Alphabet augmenté');
  assert.equal(bodyAlphabetPlugin.label({ replace: 'both' }), 'alphabet augmenté : les deux');
  assert.match(bodyAlphabetPlugin.help({ replace: 'punctuation' }), /la virgule devient « pfou »/);
  assert.match(bodyAlphabetPlugin.help({ replace: 'sounds' }), /\/s\/ devient « tss »/);
  assert.match(bodyAlphabetPlugin.help({ replace: 'both' }), /« pfou ».* ; dans les mots/);
  assert.ok(bodyAlphabetPlugin.acts(bodyAlphabetPlugin.defaults));
});

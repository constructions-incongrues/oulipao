import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES } from '../../src/domain/categories.ts';
import { tagText } from '../../src/domain/tagging.ts';
import { tokenize } from '../../src/domain/tokenizer.ts';
import type { Tagger } from '../../src/ports/tagger.ts';

const fake = (tag: Tagger['tag']): Tagger => ({ name: 'factice', tag });

test('tagText : un étiqueteur factice rend des catégories connues', async () => {
  const tagger = fake((text) => tokenize(text).map(({ word }) => ({ word, category: 'other' })));
  const output = await tagText(tagger, 'Le chat dort.');
  assert.equal(output.length, 3);
  assert.ok(output.every((o) => CATEGORIES.includes(o.category)));
});

test('tagText : refuse une catégorie hors schéma', async () => {
  const tagger = fake(() => [{ word: 'Le', category: 'NOUN' as never }]);
  await assert.rejects(tagText(tagger, 'Le'), /factice : sortie non conforme/);
});

test('tagText : refuse un découpage différent', async () => {
  await assert.rejects(tagText(fake(() => []), 'Le chat'), /0 mots rendus, 2 attendus/);
  const shifted = fake(() => [{ word: 'chat', category: 'noun' }, { word: 'Le', category: 'other' }]);
  await assert.rejects(tagText(shifted, 'Le chat'), /mot 0 « chat » ≠ « Le »/);
});

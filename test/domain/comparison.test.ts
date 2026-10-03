import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare } from '../../src/domain/comparison.ts';
import type { ReferenceText } from '../../src/domain/reference-text.ts';
import type { TaggedWord } from '../../src/domain/tagged-word.ts';

const reference: ReferenceText = {
  title: 't', source: 's', annotator: 'a', text: 'La ferme est grande',
  words: [
    { word: 'La', category: 'other' }, { word: 'ferme', category: 'noun' },
    { word: 'est', category: 'verb' }, { word: 'grande', category: 'adjective' },
  ],
};
const allOther: TaggedWord[] = reference.words.map(({ word }) => ({ word, category: 'other' }));

test('compare : score, mots de contenu, erreurs, ambigus', () => {
  const result = compare(allOther, reference, { isAmbiguous: (w) => w === 'ferme' || w === 'est' });
  assert.equal(result.total, 4);
  assert.equal(result.correct, 1);
  assert.deepEqual(result.content, { total: 3, correct: 0 });
  assert.equal(result.ambiguous, 2);
  assert.deepEqual(result.errors[0], { index: 1, word: 'ferme', expected: 'noun', actual: 'other' });
});

test('compare : sortie parfaite, sans prédicat d’ambiguïté', () => {
  const result = compare(reference.words, reference);
  assert.equal(result.correct, 4);
  assert.deepEqual(result.content, { total: 3, correct: 3 });
  assert.equal(result.ambiguous, null);
  assert.deepEqual(result.errors, []);
});

test('compare : refuse une sortie non alignée', () => {
  assert.throws(() => compare(allOther.slice(1), reference), /3 mots étiquetés, 4 dans la référence/);
  const shifted = [...allOther.slice(1), allOther[0]!];
  assert.throws(() => compare(shifted, reference), /mot 0 : « ferme » ≠ « La »/);
});

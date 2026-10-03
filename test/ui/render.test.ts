import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES } from '../../src/domain/categories.ts';
import { CATEGORY_LABELS, toSegments } from '../../src/ui/render.ts';

test('toSegments : mots avec catégorie, ponctuation et espaces tels quels', () => {
  const segments = toSegments(' Le chat. ', [{ word: 'Le', category: 'other' }, { word: 'chat', category: 'noun' }]);
  assert.deepEqual(segments, [
    { text: ' ' }, { text: 'Le', category: 'other' }, { text: ' ' }, { text: 'chat', category: 'noun' }, { text: '. ' },
  ]);
  assert.equal(segments.map((s) => s.text).join(''), ' Le chat. ');
  assert.deepEqual(toSegments('Oui', [{ word: 'Oui', category: 'other' }]), [{ text: 'Oui', category: 'other' }]);
});

test('chaque catégorie a un libellé français', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABELS), [...CATEGORIES]);
});

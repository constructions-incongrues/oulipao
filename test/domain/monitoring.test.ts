import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, type Category } from '../../src/domain/categories.ts';
import { audibleCategories, mixSegments, plainWords, TracksSchema } from '../../src/domain/mixing.ts';
import { wordsAtStep } from '../../src/domain/monitoring.ts';
import type { OutputWord } from '../../src/domain/s7/types.ts';
import { tag } from '../support/morphology.ts';

const TEXT = 'Le vieux chat dort.';
const segments = (words: OutputWord[], changes: Partial<Record<Category, { muted?: boolean; solo?: boolean }>> = {}) => {
  const tracks = TracksSchema.parse(Object.fromEntries(CATEGORIES.map((c) => [c, { muted: false, solo: false, ...changes[c] }])));
  return mixSegments(words, tag(TEXT, { dort: 'verb' }), audibleCategories(tracks), '.', true);
};
const plain = () => plainWords(TEXT).words;

test('wordsAtStep : le mot du pas, sans ponctuation', () => {
  assert.deepEqual(wordsAtStep(segments(plain()), 2), ['chat']);
  assert.deepEqual(wordsAtStep(segments(plain()), 3), ['dort']);
});

test('wordsAtStep : un remplacement en plusieurs mots se dit en entier, dans l’ordre', () => {
  const words = plain().map((word) => (word.index === 2 ? { ...word, output: 'pomme de terre' } : word));
  assert.deepEqual(wordsAtStep(segments(words), 2), ['pomme', 'de', 'terre']);
});

test('wordsAtStep : rien pour un mot retiré, une piste muette ou une autre piste en solo', () => {
  const removed = plain().map((word) => (word.index === 1 ? { ...word, output: '' } : word));
  assert.deepEqual(wordsAtStep(segments(removed), 1), []);
  assert.deepEqual(wordsAtStep(segments(plain(), { noun: { muted: true } }), 2), []);
  assert.deepEqual(wordsAtStep(segments(plain(), { adjective: { solo: true } }), 2), []);
  assert.deepEqual(wordsAtStep(segments(plain(), { adjective: { solo: true } }), 1), ['vieux']);
});

test('wordsAtStep : un vers recopié par un refrain ne se dit qu’à son pas d’origine', () => {
  const refrain = [
    { text: 'chat', index: 2 },
    { text: '\n' },
    { text: 'chat', index: 2, copyOf: 1 },
  ];
  assert.deepEqual(wordsAtStep(refrain, 2), ['chat']);
});

test('originalWordsAtStep : le mot d’origine si sa piste s’entend, sans ponctuation ; rien sinon', async () => {
  const { originalWordsAtStep } = await import('../../src/domain/monitoring.ts');
  const all = new Set<Category>(CATEGORIES);
  assert.deepEqual(originalWordsAtStep('chat', 'noun', all), ['chat']);
  assert.deepEqual(originalWordsAtStep('« chat »,', 'noun', all), ['chat']);
  assert.deepEqual(originalWordsAtStep('chat', 'noun', new Set<Category>(['verb'])), []); // muette, ou une autre piste en solo
});

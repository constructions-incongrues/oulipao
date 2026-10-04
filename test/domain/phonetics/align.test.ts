import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alignLetters } from '../../../src/domain/phonetics/fallback.ts';

const carriers = (word: string, sound: string) =>
  alignLetters(word).filter((span) => span.phonemes.includes(sound as never)).map((span) => word.slice(span.start, span.end));

test('alignLetters : les lettres qui portent chaque son', () => {
  assert.deepEqual(carriers('garçon', 's'), ['ç']);
  assert.deepEqual(carriers('photo', 'f'), ['ph']);
  assert.deepEqual(carriers('qui', 'k'), ['qu']);
  assert.deepEqual(carriers('temps', 's'), []); // le s final ne se prononce pas
  assert.deepEqual(carriers('Garçon', 's'), ['ç']); // positions du mot donné, casse comprise
});

test('alignLetters : les morceaux couvrent le mot sans trou ni chevauchement ; une lettre hors table est muette', () => {
  for (const word of ['garçon', 'temps', 'œil', 'hôtel', 'x-ray', 'naïve']) {
    const spans = alignLetters(word);
    assert.equal(spans[0]!.start, 0);
    assert.equal(spans.at(-1)!.end, word.length);
    spans.slice(1).forEach((span, k) => assert.equal(span.start, spans[k]!.end));
  }
  assert.deepEqual(alignLetters('-').map((span) => span.phonemes), [[]]);
});

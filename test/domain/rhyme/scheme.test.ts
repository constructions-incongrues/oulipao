import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lettersFor } from '../../../src/domain/rhyme/scheme.ts';

const read = (letters: (string | null)[]) => letters.map((l) => l ?? '·').join('');

test('lettres des schémas sur un quatrain', () => {
  assert.equal(read(lettersFor('plates', 4)), 'AABB');
  assert.equal(read(lettersFor('croisees', 4)), 'ABAB');
  assert.equal(read(lettersFor('embrassees', 4)), 'ABBA');
  assert.equal(read(lettersFor('etreinte', 4)), 'ABBA');
  assert.equal(read(lettersFor('bisexuelle', 3)), 'AAA');
});

test('reprise : un schéma plus court que la strophe repart avec des lettres nouvelles', () => {
  assert.equal(read(lettersFor('croisees', 6)), 'ABABCD');
  assert.equal(read(lettersFor('plates', 5)), 'AABBC');
  assert.equal(read(lettersFor('embrassees', 3)), 'ABB');
  assert.equal(read(lettersFor('bisexuelle', 6)), 'AAABBB');
});

test('étreinte en miroir : le vers du milieu d’une strophe impaire est libre', () => {
  assert.equal(read(lettersFor('etreinte', 5)), 'AB·BA');
  assert.equal(read(lettersFor('etreinte', 6)), 'ABCCBA');
  assert.equal(read(lettersFor('etreinte', 3)), 'A·A');
  assert.equal(read(lettersFor('etreinte', 1)), '·');
});

test('lettres d’une sortie : par strophe, sur les fins de vers ; un mot retiré ne finit aucun vers', async () => {
  const { schemeLetters } = await import('../../../src/domain/rhyme/scheme.ts');
  const w = (gap: string, output: string, category: 'noun' | 'other' = 'noun') => ({ gap, output, category });
  const words = [w('', 'la', 'other'), w(' ', 'chaise'), w('\n', 'la', 'other'), w(' ', 'table'), w(' ', ''), w('\n\n', 'la', 'other'), w(' ', 'rose')];
  assert.deepEqual(schemeLetters(words, 'plates'), [undefined, 'A', undefined, 'A', undefined, undefined, 'A']);
  assert.deepEqual(schemeLetters([w('', 'la', 'other')], 'plates'), [undefined]);
  assert.deepEqual(schemeLetters([w('', 'chat'), w('\n', 'chien'), w('\n', 'loup')], 'etreinte'), ['A', undefined, 'A']);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tokenize } from '../../src/domain/tokenizer.ts';

const words = (text: string) => tokenize(text).map((t) => t.word);

test('tokenize : élisions, clitiques, ponctuation', () => {
  assert.deepEqual(words("L'homme qu'il a vu aujourd'hui, dit-il."),
    ["L'", 'homme', "qu'", 'il', 'a', 'vu', "aujourd'hui", 'dit', 'il']);
  assert.deepEqual(words('Y a-t-elle pensé ? Peut-être, en 2026.'),
    ['Y', 'a', 'elle', 'pensé', 'Peut-être', 'en']);
  assert.deepEqual(words('Donne-le-moi, jusqu’au bout.'), ['Donne', 'le', 'moi', 'jusqu’', 'au', 'bout']);
});

test('tokenize : positions dans le texte', () => {
  assert.deepEqual(tokenize('  été '), [{ word: 'été', start: 2, end: 5 }]);
  const text = 'dit-il';
  assert.deepEqual(tokenize(text).map((t) => text.slice(t.start, t.end)), ['dit', 'il']);
  assert.deepEqual(tokenize('… 42 !'), []);
});

test('tokenize : les composés lexicalisés restent entiers, les clitiques se coupent toujours', () => {
  assert.deepEqual(words('Le rendez-vous est pris, viens chez-moi.'), ['Le', 'rendez-vous', 'est', 'pris', 'viens', 'chez-moi']);
  assert.deepEqual(words('Un on-dit, un m’as-tu-vu, Rendez-Vous.'), ['Un', 'on-dit', 'un', 'm’as-tu-vu', 'Rendez-Vous']);
  assert.deepEqual(words('Viens, dit-il ; donne-le.'), ['Viens', 'dit', 'il', 'donne', 'le']);
});

test('tokenize : l’apostrophe modificative vaut l’apostrophe ; élision en capitales', () => {
  assert.deepEqual(words('lʼarbre et l’arbre'), ['lʼ', 'arbre', 'et', 'l’', 'arbre']);
  assert.deepEqual(words("QU'IL VIENNE"), ["QU'", 'IL', 'VIENNE']);
});

test('tokenize : texte vide ou blancs seuls', () => {
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('  \n\t '), []);
});

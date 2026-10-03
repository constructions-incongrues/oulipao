import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InMemoryMorphology } from '../../../src/adapters/morphology/in-memory-morphology.ts';
import { substituteNoun, type NounHints } from '../../../src/domain/s7/substitution.ts';
import type { S7Mode } from '../../../src/domain/s7/types.ts';
import { morphology, NOUNS } from '../../support/morphology.ts';

const m = morphology();
// Le genre d'origine est vérifié à part : on le retire des comparaisons d'ensemble.
const sub = (word: string, offset: number, mode: S7Mode, hints: NounHints = {}) => {
  const { originalGender: _, ...choice } = substituteNoun(word, hints, { offset, mode }, m);
  return choice;
};

test('S+n strict : n-ième lemme suivant, genre de l’entrée du dictionnaire', () => {
  assert.deepEqual(sub('ferme', 1, 'reagree'), { status: 'replaced', replacement: 'fermoir', gender: 'm', number: 's' });
  assert.deepEqual(sub('ferme', 7, 'reagree'), { status: 'replaced', replacement: 'oncle', gender: 'm', number: 's' });
  assert.deepEqual(sub('village', 1, 'reagree'), { status: 'replaced', replacement: 'ville', gender: 'f', number: 's' });
  assert.equal(sub('ferme', -1, 'reagree').replacement, 'école');
  assert.equal(sub('ferme', 0, 'reagree').replacement, 'ferme');
  assert.equal(sub('ville', 1, 'reagree').replacement, 'voisin'); // forme égale au lemme, pas « voisine »
});

test('le genre d’origine est rendu avec le choix', () => {
  assert.equal(substituteNoun('ferme', {}, { offset: 1, mode: 'reagree' }, m).originalGender, 'f');
  assert.equal(substituteNoun('livre', { gender: 'f' }, { offset: 1, mode: 'reagree' }, m).originalGender, 'f');
  assert.equal(substituteNoun('zorglub', { gender: 'f' }, { offset: 1, mode: 'reagree' }, m).originalGender, 'f');
});

test('le dictionnaire boucle', () => {
  assert.equal(sub('voisin', 1, 'reagree').replacement, 'aire');
  assert.equal(sub('aire', -1, 'reagree').replacement, 'voisin');
  assert.equal(sub('ferme', 17, 'reagree').replacement, 'ferme');
});

test('le nombre est conservé', () => {
  assert.deepEqual(sub('chevaux', -1, 'reagree'), { status: 'replaced', replacement: 'chats', gender: 'm', number: 'p' });
  assert.equal(sub('fermes', 1, 'reagree').replacement, 'fermoirs');
  assert.equal(sub('Fermes', 1, 'reagree').replacement, 'fermoirs'); // majuscule de début de phrase
});

test('mode même genre : seuls comptent les lemmes de ce genre', () => {
  assert.deepEqual(sub('ferme', 1, 'same-gender'), { status: 'replaced', replacement: 'horloge', gender: 'f', number: 's' });
  assert.equal(sub('ferme', 2, 'same-gender').replacement, 'livre'); // épicène : compte pour les deux genres
  assert.equal(sub('fermoir', 1, 'same-gender').replacement, 'héros');
  assert.equal(sub('ville', 1, 'same-gender').replacement, 'voisine');
  assert.equal(sub('horloge', -1, 'same-gender').replacement, 'ferme');
});

test('épicène et invariable : genre et nombre viennent du déterminant', () => {
  assert.deepEqual(sub('livre', 1, 'same-gender', { gender: 'f' }), { status: 'replaced', replacement: 'maison', gender: 'f', number: 's' });
  assert.deepEqual(sub('livre', 1, 'same-gender', { gender: 'm' }), { status: 'replaced', replacement: 'oncle', gender: 'm', number: 's' });
  assert.equal(sub('livre', 1, 'same-gender').gender, 'm'); // sans indice : masculin
  assert.deepEqual(sub('héros', -1, 'reagree', { number: 'p' }), { status: 'replaced', replacement: 'fermoirs', gender: 'm', number: 'p' });
  assert.equal(sub('héros', -1, 'reagree').replacement, 'fermoir'); // sans indice : singulier
  // remplaçant épicène : le groupe garde son genre
  assert.deepEqual(sub('horloge', 2, 'reagree'), { status: 'replaced', replacement: 'livre', gender: 'f', number: 's' });
  assert.deepEqual(sub('hôtel', 1, 'reagree'), { status: 'replaced', replacement: 'livre', gender: 'm', number: 's' });
  // remplaçant invariable : convient au pluriel
  assert.equal(sub('horloges', -1, 'reagree').replacement, 'héros');
});

test('nom inconnu ou forme manquante : laissé tel quel et signalé', () => {
  assert.deepEqual(sub('Zorglub', 7, 'reagree'), { status: 'unknown-noun', replacement: 'zorglub', gender: 'm', number: 's' });
  assert.deepEqual(sub('zorglub', 7, 'reagree', { gender: 'f', number: 'p' }), { status: 'unknown-noun', replacement: 'zorglub', gender: 'f', number: 'p' });
  // « aire » n'a pas de pluriel dans ce dictionnaire
  assert.deepEqual(sub('arbres', -1, 'reagree'), { status: 'missing-form', replacement: 'arbres', gender: 'm', number: 'p' });
});

test('+n puis −n redonne le nom d’origine, en mode même genre', () => {
  for (const { form } of NOUNS.filter((x) => x.gender !== 'e' && x.number !== 'i')) {
    const there = sub(form, 3, 'same-gender');
    if (there.status !== 'replaced') continue;
    const back = substituteNoun(there.replacement, { gender: there.gender, number: there.number }, { offset: -3, mode: 'same-gender' }, m);
    assert.equal(back.replacement, form, form);
  }
});

test('déterministe : même entrée, même sortie', () => {
  assert.deepEqual(sub('maison', 7, 'same-gender'), sub('maison', 7, 'same-gender'));
});

test('homographes : la lecture compatible avec le déterminant, sinon l’entrée du dictionnaire', () => {
  const homographs = new InMemoryMorphology({
    nouns: [
      { form: 'fils', lemma: 'fil', gender: 'm', number: 'p' }, { form: 'fil', lemma: 'fil', gender: 'm', number: 's' },
      { form: 'fils', lemma: 'fils', gender: 'm', number: 'i' },
      { form: 'filtre', lemma: 'filtre', gender: 'm', number: 's' }, { form: 'filtres', lemma: 'filtre', gender: 'm', number: 'p' },
      { form: 'tours', lemma: 'tour', gender: 'f', number: 'p' }, { form: 'tours', lemma: 'tourd', gender: 'm', number: 'p' },
      { form: 'tour', lemma: 'tour', gender: 'f', number: 's' }, { form: 'tourd', lemma: 'tourd', gender: 'm', number: 's' },
      { form: 'tourds', lemma: 'tourd', gender: 'm', number: 'p' },
    ],
    adjectives: [], noElision: [],
  });
  const pick = (word: string, hints: NounHints) => substituteNoun(word, hints, { offset: 1, mode: 'reagree' }, homographs).replacement;
  assert.equal(pick('fils', { number: 's' }), 'filtre'); // lemme « fils », invariable -> filtre
  assert.equal(pick('fils', {}), 'filtre'); // sans indice : l'entrée « fils »
  assert.equal(pick('tours', { gender: 'm' }), 'fils'); // lemme « tourd » -> boucle sur « fil »
  assert.equal(pick('tours', { gender: 'f' }), 'tourds'); // lemme « tour » -> « tourd », au pluriel
  assert.equal(pick('tours', {}), 'tourds'); // sans indice : premier lemme dans l'ordre, « tour »
  // dictionnaire sans lemme du genre voulu : le garde-fou arrête la recherche
  const lonely = new InMemoryMorphology({ nouns: [{ form: 'aire', lemma: 'aire', gender: 'f', number: 's' }], adjectives: [], noElision: [] });
  assert.equal(substituteNoun('aire', { gender: 'm' }, { offset: 1, mode: 'same-gender' }, lonely).status, 'replaced');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InMemoryMorphology } from '../../../src/adapters/morphology/in-memory-morphology.ts';
import { containsLetter, neighbourAdjective, neighbourAdverb, neighbourNoun } from '../../../src/domain/lipogram/neighbour.ts';
import { morphology } from '../../support/morphology.ts';

const m = morphology();

test('containsLetter : sans tenir compte de la casse ni des accents, comme chez Perec ; plusieurs lettres', () => {
  assert.equal(containsLetter('Ferme', 'e'), true);
  assert.equal(containsLetter('FERME', 'e'), true);
  assert.equal(containsLetter('école', 'e'), true);
  assert.equal(containsLetter('héros', 'e'), true);
  assert.equal(containsLetter('Âtre', 'a'), true);
  assert.equal(containsLetter('à', 'a'), true);
  assert.equal(containsLetter('cœur', 'e'), true);
  assert.equal(containsLetter('chat', 'ei'), false);
  assert.equal(containsLetter('chat', 'ea'), true);
});

test('neighbourNoun : le premier nom suivant, au même genre et au même nombre, sans la lettre', () => {
  // ferme (f, s) : fermoir est masculin, hôtel aussi ; héros et horloge contiennent « e » ; maison convient.
  assert.deepEqual(neighbourNoun('ferme', {}, 'e', m), { status: 'replaced', replacement: 'maison', gender: 'f', number: 's', originalGender: 'f' });
  // chats (m, p) : chevaux, fermoirs, héros contiennent « e » ; voisins non
  assert.equal(neighbourNoun('chats', {}, 'e', m).replacement, 'voisins');
  // la majuscule ne trompe pas la lecture
  assert.equal(neighbourNoun('Ferme', {}, 'e', m).replacement, 'maison');
  // un nom épicène prend le genre de la phrase
  assert.equal(neighbourNoun('livre', { gender: 'f' }, 'e', m).replacement, 'maison');
});

test('neighbourNoun : nom inconnu, ou sans voisin', () => {
  assert.deepEqual(neighbourNoun('zorglub', { number: 'p' }, 'e', m), { status: 'unknown-noun', replacement: 'zorglub', gender: 'm', number: 'p', originalGender: 'm' });
  const tiny = new InMemoryMorphology({ nouns: [{ form: 'pomme', lemma: 'pomme', gender: 'f', number: 's' }, { form: 'reine', lemma: 'reine', gender: 'f', number: 's' }], adjectives: [], noElision: [] });
  assert.equal(neighbourNoun('pomme', {}, 'e', tiny).status, 'missing-form');
  // une abréviation du lexique n'est pas un voisin
  const odd = new InMemoryMorphology({ nouns: [{ form: 'pomme', lemma: 'pomme', gender: 'f', number: 's' }, { form: 'viiᵉ', lemma: 'viiᵉ', gender: 'f', number: 's' }], adjectives: [], adverbs: ['très', 'xᵉ', 'ici'], noElision: [] });
  assert.equal(neighbourNoun('pomme', {}, 'e', odd).status, 'missing-form');
  assert.equal(neighbourAdverb('très', 'e', odd), 'ici');
});

test('neighbourAdjective : le premier adjectif suivant, aux mêmes traits, sans la lettre', () => {
  assert.equal(neighbourAdjective('gris', { gender: 'm', number: 's' }, 'a', m)?.form, 'petit');
  // traits pris de la lecture quand la phrase n'en dit rien
  assert.equal(neighbourAdjective('rapide', {}, 'i', m)?.form, 'beau');
  // au féminin, « beau » sans « l » : « enceinte »
  assert.equal(neighbourAdjective('beau', { gender: 'f' }, 'l', m)?.form, 'enceinte');
  // aucun adjectif féminin sans « e » dans le petit dictionnaire
  assert.equal(neighbourAdjective('vieille', {}, 'e', m), undefined);
  assert.equal(neighbourAdjective('inconnu', {}, 'e', m), undefined);
});

test('neighbourAdverb : le premier adverbe suivant sans la lettre, même pour un adverbe inconnu', () => {
  assert.equal(neighbourAdverb('très', 'e', m), 'ainsi'); // « vite » contient « e » : on repart au début
  assert.equal(neighbourAdverb('plus', 'u', m), 'très');
  assert.equal(neighbourAdverb('Jamais', 'a', m), 'plus');
  assert.equal(neighbourAdverb('doucement', 'e', m), 'ici'); // place entre « bien » et « ici »
  assert.equal(neighbourAdverb('zzz', 'e', m), 'ainsi'); // après le dernier : on repart au début
  assert.equal(neighbourAdverb('très', 'e', new InMemoryMorphology({ nouns: [], adjectives: [], noElision: [] })), undefined);
});

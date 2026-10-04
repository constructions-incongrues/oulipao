import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainWords } from '../../src/domain/mixing.ts';
import { matchCase, mergeGaps, removeWord } from '../../src/domain/removal.ts';

/** Retire les mots donnés, de gauche à droite, et rend le texte. */
const without = (text: string, ...removed: string[]) => {
  let { words, tail } = plainWords(text);
  words.forEach((word, index) => {
    if (removed.includes(word.output)) tail = removeWord(words, index, tail);
  });
  return words.map((word) => word.gap + word.output).join('') + tail;
};

test('ponctuation gardée : réduite au signe le plus fort', () => {
  assert.equal(without('Le chat dort, tranquille.', 'tranquille'), 'Le chat dort.');
  assert.equal(without('Le chat noir dort.', 'chat', 'noir', 'dort'), 'Le.');
  assert.equal(without('Le chat, noir, dort.', 'noir'), 'Le chat, dort.');
  assert.equal(without('Il dort ; vraiment, il dort.', 'vraiment'), 'Il dort ; il dort.');
  assert.equal(without('Le chat dort, hélas !', 'hélas'), 'Le chat dort !');
});

test('majuscule léguée en tête de phrase, ponctuation tombée en tête de texte', () => {
  assert.equal(without('Hier, le chat dormait.', 'Hier'), 'Le chat dormait.');
  assert.equal(without('Il pleut. Hier, le chat dormait.', 'Hier'), 'Il pleut. Le chat dormait.');
  // Un nom propre au milieu d'une phrase ne lègue rien.
  assert.equal(without('Le chat de Paul dort.', 'Paul'), 'Le chat de dort.');
});

test('vers gardés : un mot retiré en tête de vers laisse le saut de ligne', () => {
  assert.equal(without('Le chat dort\nsur le mur', 'sur'), 'Le chat dort\nle mur');
  assert.equal(without('Le chat dort,\nsur le mur.', 'sur', 'le', 'mur'), 'Le chat dort.');
  assert.equal(without('Un vers\nseul\ndernier', 'seul'), 'Un vers\ndernier');
  assert.equal(without('Strophe une\n\nseul\ndeux', 'seul'), 'Strophe une\n\ndeux');
});

test('guillemets et parenthèses suivent', () => {
  assert.equal(without('Il dit « bonjour » et part.', 'bonjour'), 'Il dit et part.');
  assert.equal(without('Un chat (noir) dort.', 'noir'), 'Un chat dort.');
  assert.equal(without('Il dit « bonjour toi » et part.', 'bonjour'), 'Il dit « toi » et part.');
  assert.equal(without('Quoi ?! Rien.', 'Rien'), 'Quoi ?!');
});

test('le guillemet fermant garde l’espace qui le précède', () => {
  assert.equal(without('« Le chat\u202F», dit-il.', 'chat'), '« Le\u202F», dit-il.');
  assert.equal(without('« Le chat dort\u00A0». Il', 'chat', 'dort'), '« Le\u00A0». Il');
  assert.equal(without('« Le chat ». Il', 'chat'), '« Le ». Il');
  assert.equal(without('« Le chat». Il', 'chat'), '« Le». Il');
});

test('mergeGaps et matchCase', () => {
  assert.equal(mergeGaps('', ''), '');
  assert.equal(mergeGaps(', ', ''), ', ');
  assert.equal(mergeGaps(', ', ' ', true), '');
  assert.equal(mergeGaps(' ', ': '), ' : ');
  assert.equal(matchCase('Chat', 'mur'), 'Mur');
  assert.equal(matchCase('chat', 'mur'), 'mur');
});

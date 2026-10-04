import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXAMPLES, exampleOf } from '../../../src/ui/tracks/examples.ts';

test('les exemples : cinq textes courts, déjà en NFC, dans l’ordre de la rotation', () => {
  assert.deepEqual(EXAMPLES.map((example) => example.author), ['Marcel Proust', 'Jean de La Fontaine', 'Arthur Rimbaud', 'Paul Verlaine', 'Victor Hugo']);
  for (const { title, text } of EXAMPLES) {
    assert.ok(text.split(/\s+/).length <= 150, title);
    assert.equal(text, text.normalize('NFC'), title);
  }
  // un vers par ligne, strophes séparées par une ligne vide : le sonnet a quatre strophes de 4, 4, 3 et 3 vers
  assert.deepEqual(EXAMPLES[2]!.text.split('\n\n').map((stanza) => stanza.split('\n').length), [4, 4, 3, 3]);
});

test('exampleOf : reconnaît un exemple tel quel, pas un exemple retouché', () => {
  assert.equal(exampleOf(EXAMPLES[3]!.text), EXAMPLES[3]);
  assert.equal(exampleOf(EXAMPLES[3]!.text.replace('longs', 'long')), undefined);
  assert.equal(exampleOf(''), undefined);
});

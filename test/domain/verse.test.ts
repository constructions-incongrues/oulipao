import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runChain } from '../../src/domain/plugin-chain.ts';
import { s7Plugin } from '../../src/domain/s7/plugin.ts';
import { tokenize } from '../../src/domain/tokenizer.ts';
import { layoutVerse } from '../../src/domain/verse.ts';
import { morphology, tag } from '../support/morphology.ts';

const places = (text: string, categories: Record<string, 'noun' | 'verb' | 'adjective' | 'adverb'> = {}) =>
  layoutVerse(text, tokenize(text).map(({ word }) => ({ word, category: categories[word] ?? 'other' })));

test('deux strophes : cinq vers, le quatrième commence la deuxième strophe', () => {
  const text = 'un deux\ntrois\nquatre\n\ncinq six\nsept';
  const layout = places(text);
  assert.deepEqual(layout.map((place) => place.line), [1, 1, 2, 3, 4, 4, 5]);
  assert.deepEqual(layout.map((place) => place.stanza), [1, 1, 1, 1, 2, 2, 2]);
  assert.deepEqual(places('un\n  \n\ndeux').map((place) => [place.line, place.stanza]), [[1, 1], [2, 2]]); // plusieurs lignes vides : une seule strophe de plus
});

test('prose : un seul vers, une seule strophe', () => {
  const layout = places('Le vieux chat dort sur la chaise.');
  assert.ok(layout.every((place) => place.line === 1 && place.stanza === 1));
});

test('ponctuation finale : « chaise » finit le vers', () => {
  const layout = places('Le vieux chat dort sur la chaise.', { vieux: 'adjective', chat: 'noun', dort: 'verb', chaise: 'noun' });
  assert.deepEqual(layout.map((place) => place.lineEnd), [false, false, false, false, false, false, true]);
});

test('mot-outil final : « pense » finit le vers « Il pense à elle »', () => {
  const layout = places('Il pense à elle\nElle dort', { pense: 'verb', dort: 'verb' });
  assert.deepEqual(layout.map((place) => place.lineEnd), [false, true, false, false, false, true]);
  assert.ok(places('à elle').every((place) => !place.lineEnd)); // un vers sans mot plein n'a pas de fin
});

test('article initial : « vieux » ouvre le vers « Le vieux chat dort sur la chaise. »', () => {
  const layout = places('Le vieux chat dort\nsur la chaise.', { vieux: 'adjective', chat: 'noun', dort: 'verb', chaise: 'noun' });
  assert.deepEqual(layout.map((place) => place.lineStart), [false, true, false, false, false, false, true]);
  assert.ok(places('à elle').every((place) => !place.lineStart)); // un vers sans mot plein n'a pas de début
});

test('après un S+7 : chaque mot garde son vers et sa strophe', () => {
  const text = 'Le chat\ndort dans la maison\n\nLe voisin';
  const tagged = tag(text, { dort: 'verb', dans: 'other' });
  const chain = runChain(text, tagged, [{ id: 's', plugin: s7Plugin, values: { offset: 1 }, targets: new Set(['noun']) }], { morphology: morphology() });
  const output = chain.words.map((word) => word.gap + word.output).join('') + chain.tail;
  assert.notEqual(output, text);
  const before = layoutVerse(text, tagged).map(({ line, stanza }) => [line, stanza]);
  const after = layoutVerse(output, tagged).map(({ line, stanza }) => [line, stanza]);
  assert.deepEqual(after, before);
});

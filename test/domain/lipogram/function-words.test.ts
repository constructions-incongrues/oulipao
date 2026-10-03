import assert from 'node:assert/strict';
import { test } from 'node:test';
import { functionWordWithout, isFunctionWord, tableFor } from '../../../src/domain/lipogram/function-words.ts';

test('functionWordWithout : le premier équivalent sans la lettre', () => {
  assert.equal(functionWordWithout('le', 'e'), 'un');
  assert.equal(functionWordWithout('Les', 'e'), 'nos'); // sans tenir compte de la casse
  assert.equal(functionWordWithout('de', 'e'), 'à');
  assert.equal(functionWordWithout('et', 'e'), 'ou');
  assert.equal(functionWordWithout('elle', 'e'), 'on');
  assert.equal(functionWordWithout('la', 'a'), 'une');
});

test('functionWordWithout : rien sans équivalent, ou hors de la table', () => {
  assert.equal(functionWordWithout('je', 'e'), undefined);
  assert.equal(functionWordWithout('ne', 'e'), undefined);
  assert.equal(functionWordWithout('ou', 't'), undefined); // « et », seul équivalent, contient « t »
  assert.equal(functionWordWithout('Marthe', 'e'), undefined);
});

test('isFunctionWord, et la table pour une lettre', () => {
  assert.equal(isFunctionWord('Les'), true);
  assert.equal(isFunctionWord('horloge'), false);
  const e = new Map(tableFor('e'));
  assert.equal(e.get('le'), 'un');
  assert.equal(e.get('je'), '(retiré)');
  assert.ok(!e.has('la'));
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bare, lettersOf } from '../../src/domain/letters.ts';

test('bare : accents et ligatures ramenés aux lettres nues', () => {
  assert.equal(bare('Âtre'), 'atre');
  assert.equal(bare('cœur'), 'coeur');
  assert.equal(bare('Lætitia'), 'laetitia');
});

test('lettersOf : seules les lettres comptent, dans l’ordre de la saisie', () => {
  assert.equal(lettersOf('Hélène-Marie'), 'helenemarie');
  assert.equal(lettersOf('a, e'), 'ae');
  assert.equal(lettersOf('R2-D2 !'), 'rd');
  assert.equal(lettersOf(''), '');
});

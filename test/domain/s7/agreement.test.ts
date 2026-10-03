import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agreeAdjective } from '../../../src/domain/s7/agreement.ts';
import { morphology } from '../../support/morphology.ts';

const m = morphology();
const agree = (word: string, gender: 'm' | 'f', number: 's' | 'p', nextElides?: boolean) =>
  agreeAdjective(word, { gender, number, nextElides }, m);

test('change de genre en gardant le nombre', () => {
  assert.deepEqual(agree('vieille', 'm', 's', false), { form: 'vieux', status: 'agreed' });
  assert.deepEqual(agree('petit', 'f', 's', false), { form: 'petite', status: 'agreed' });
  assert.deepEqual(agree('petits', 'f', 'p'), { form: 'petites', status: 'agreed' });
  assert.deepEqual(agree('grises', 'm', 'p'), { form: 'gris', status: 'agreed' });
});

test('garde le mot quand il convient déjà', () => {
  assert.deepEqual(agree('rapide', 'f', 's'), { form: 'rapide', status: 'agreed' });
  assert.deepEqual(agree('Petite', 'f', 's'), { form: 'Petite', status: 'agreed' });
  assert.deepEqual(agree('gris', 'm', 's'), { form: 'gris', status: 'agreed' });
});

test('masculin singulier devant voyelle : bel, vieil', () => {
  assert.equal(agree('vieux', 'm', 's', true).form, 'vieil');
  assert.equal(agree('vieil', 'm', 's', false).form, 'vieux');
  assert.equal(agree('belle', 'm', 's', true).form, 'bel');
  assert.equal(agree('belle', 'm', 's', false).form, 'beau');
  assert.equal(agree('bel', 'm', 's').form, 'beau'); // après le nom : jamais la forme devant voyelle
  assert.equal(agree('petite', 'm', 's', true).form, 'petit'); // pas de forme particulière
});

test('lecture multiple : préfère celle du nombre voulu', () => {
  assert.equal(agree('fermé', 'f', 's').form, 'fermée');
  assert.equal(agree('fermés', 'm', 'p').form, 'fermés');
});

test('adjectif inconnu ou sans forme au genre voulu : laissé tel quel et signalé', () => {
  assert.deepEqual(agree('zinzolin', 'f', 's'), { form: 'zinzolin', status: 'unknown' });
  assert.deepEqual(agree('enceinte', 'm', 's'), { form: 'enceinte', status: 'missing' });
  assert.deepEqual(agree('beau', 'f', 'p'), { form: 'beau', status: 'missing' });
});

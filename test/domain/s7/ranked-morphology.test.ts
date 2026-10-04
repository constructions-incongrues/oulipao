import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InMemoryScales } from '../../../src/adapters/morphology/in-memory-scales.ts';
import { rankedMorphology } from '../../../src/domain/s7/ranked-morphology.ts';
import { morphology } from '../../support/morphology.ts';

const m = morphology();
const scales = new InMemoryScales([
  { order: 'valence', category: 'noun', lemma: 'maison', score: 30 },
  { order: 'valence', category: 'noun', lemma: 'ferme', score: 10 },
  { order: 'valence', category: 'adjective', lemma: 'beau', score: 90 },
]);

test('vue ordonnée : les listes de l’échelle, la même à chaque appel ; le reste vient du dictionnaire', () => {
  const ranked = rankedMorphology(m, scales, 'valence');
  assert.deepEqual(ranked.nounLemmas(), ['ferme', 'maison']);
  assert.equal(ranked.nounLemmas(), ranked.nounLemmas());
  assert.deepEqual(ranked.adjectiveParadigms(), ['beau']);
  assert.deepEqual(ranked.nounReadings('fermes'), m.nounReadings('fermes'));
  assert.deepEqual(ranked.nounForms('ferme'), m.nounForms('ferme'));
  assert.deepEqual(ranked.adjectiveReadings('belle'), m.adjectiveReadings('belle'));
  assert.deepEqual(ranked.adjectiveForms('beau'), m.adjectiveForms('beau'));
  assert.deepEqual(ranked.adverbs(), m.adverbs());
  assert.equal(ranked.blocksElision('héros'), true);
});

test('vue ordonnée : une échelle absente donne une liste vide', () => {
  assert.deepEqual(rankedMorphology(m, scales, 'concreteness').adjectiveParadigms(), []);
});

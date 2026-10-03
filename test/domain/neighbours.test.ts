import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aroundAmong, nthAdjective, nthAdverb, nthNoun } from '../../src/domain/neighbours.ts';
import { nthVerb } from '../../src/domain/verb.ts';
import { RHYME_NOUNS, rhymeMorphology, rhymeVerbs } from '../support/phonetics.ts';

// Restreindre la recherche aux formes candidates ne change rien, tant que `accept` n'en retient pas d'autres.

test('aroundAmong : les positions dans l’ordre du tour, sans le point de départ', () => {
  assert.deepEqual([...aroundAmong([2, 7, 8, 9], 7, 1)], [8, 9, 2]);
  assert.deepEqual([...aroundAmong([2, 8, 9], 7, -1)], [2, 9, 8]);
  assert.deepEqual([...aroundAmong([2, 8, 9], 7, 1)], [8, 9, 2]);
  assert.deepEqual([...aroundAmong([2, 7, 8, 9], 7, -1)], [2, 9, 8]);
  assert.deepEqual([...aroundAmong([3], 3, 1)], []);
  assert.deepEqual([...aroundAmong([], 3, 1)], []);
});

const morphology = rhymeMorphology();
const verbs = rhymeVerbs();
const criteria: [string, (form: string) => boolean][] = [
  ['finit en « aise »', (form) => form.endsWith('aise')],
  ['finit en « on »', (form) => form.endsWith('on')],
  ['contient un « e »', (form) => form.includes('e')],
  ['aucune', () => false],
];

test('noms : mêmes voisins avec ou sans les candidates, dans les deux sens et en faisant le tour', () => {
  for (const [, accept] of criteria) {
    const among = new Set(RHYME_NOUNS.map((noun) => noun.form).filter(accept));
    for (const { form } of RHYME_NOUNS)
      for (const offset of [1, 2, 3, -1, -4])
        assert.deepEqual(nthNoun(form, {}, offset, accept, morphology, among), nthNoun(form, {}, offset, accept, morphology), `${form} ${offset}`);
  }
});

test('adjectifs, adverbes et verbes : mêmes voisins avec ou sans les candidates', () => {
  const adjectives = morphology.adjectiveParadigms().flatMap((paradigm) => morphology.adjectiveForms(paradigm).map((f) => f.form));
  const verbForms = verbs.infinitives().flatMap((infinitive) => verbs.forms(infinitive).map((f) => f.form));
  for (const [name, accept] of criteria) {
    for (const offset of [1, 2, -1]) {
      const amongAdjectives = new Set(adjectives.filter(accept));
      for (const form of adjectives)
        assert.deepEqual(nthAdjective(form, {}, offset, accept, morphology, amongAdjectives), nthAdjective(form, {}, offset, accept, morphology), `${name} ${form} ${offset}`);
      const amongAdverbs = new Set(morphology.adverbs().filter(accept));
      for (const form of morphology.adverbs())
        assert.equal(nthAdverb(form, offset, accept, morphology, amongAdverbs), nthAdverb(form, offset, accept, morphology), `${name} ${form} ${offset}`);
      const amongVerbs = new Set(verbForms.filter(accept));
      for (const form of verbForms)
        assert.deepEqual(nthVerb(form, [], offset, accept, verbs, 'rien', amongVerbs), nthVerb(form, [], offset, accept, verbs, 'rien'), `${name} ${form} ${offset}`);
    }
  }
});

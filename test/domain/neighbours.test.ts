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

test('Sounds.rhyming : une rime ou plusieurs, le même ensemble d’un passage à l’autre', async () => {
  const { soundsFor } = await import('../../src/domain/rhyme/engine.ts');
  const { rhymeResources } = await import('../support/phonetics.ts');
  const resources = rhymeResources();
  const [first, second] = [soundsFor(resources)!, soundsFor(resources)!];
  const ez = first.rhyming('ɛz', 'noun');
  assert.ok(ez.has('chaise'));
  assert.equal(second.rhyming('ɛz', 'noun'), ez); // gardé d'un passage à l'autre
  assert.equal(first.rhyming(['ɛz'], 'noun'), ez);
  const both = first.rhyming(['ɔ̃', 'ɛz'], 'noun');
  assert.deepEqual([...both].sort(), [...new Set([...ez, ...first.rhyming('ɔ̃', 'noun')])].sort());
  assert.equal(second.rhyming(['ɛz', 'ɔ̃', 'ɛz'], 'noun'), both); // même réunion, quel que soit l'ordre
});

test('candidatesFor : la finale exigée ; un mot trop court n’a aucune candidate, et rien n’est essayé', async () => {
  const { candidatesFor, soundsFor } = await import('../../src/domain/rhyme/engine.ts');
  const { rhymeResources } = await import('../support/phonetics.ts');
  const { splitPhonemes } = await import('../../src/domain/phonetics/phoneme.ts');
  const sounds = soundsFor(rhymeResources())!;
  const chaise = splitPhonemes('ʃɛz')!;
  assert.ok(candidatesFor(sounds, chaise, 'sufficient', 'noun').has('chaise'));
  assert.equal(candidatesFor(sounds, chaise, 'sufficient', 'noun'), sounds.ending(splitPhonemes('ɛz')!, 'noun'));
  const ans = candidatesFor(sounds, splitPhonemes('ɑ̃')!, 'sufficient', 'noun');
  assert.equal(ans.size, 0);
  let tried = 0;
  const choice = nthNoun('chaise', {}, 7, () => (tried++, true), morphology, ans);
  assert.equal(choice.status, 'missing-form');
  assert.equal(tried, 0); // l'échec est constaté sans parcours
});

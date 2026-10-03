import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alignTerms, categoryOf, FrCompromiseTagger } from '../../src/adapters/taggers/fr-compromise-tagger.ts';
import { tagText } from '../../src/domain/tagging.ts';

test('categoryOf : pronoms et possessifs avant Noun', () => {
  assert.equal(categoryOf(['Noun', 'Pronoun']), 'other');
  assert.equal(categoryOf(['Noun', 'Possessive']), 'other');
  assert.equal(categoryOf(['Verb', 'Copula']), 'verb');
  assert.equal(categoryOf(['Auxiliary']), 'verb');
  assert.equal(categoryOf(['Adjective']), 'adjective');
  assert.equal(categoryOf(['Adverb']), 'adverb');
  assert.equal(categoryOf(['Noun', 'Singular']), 'noun');
  assert.equal(categoryOf(['Date']), 'other');
});

const term = (text: string, start: number, length: number, tags: string[]) =>
  ({ text, tags, offset: { index: 0, start, length } });

test('alignTerms : terme implicite, terme couvrant deux mots, mot hors de toute étendue', () => {
  //            0123456789
  const text = "l'est a-t-il vu";
  const sentences = [{ terms: [
    term("l'est", 0, 5, ['Determiner']), term('', 5, 0, ['Noun']), // « l' » + « est » implicite
    term('a-t-il', 6, 6, ['Verb']),                                 // un terme pour « a » et « il »
  ] }];
  assert.deepEqual(alignTerms(text, sentences), [
    { word: "l'", category: 'other' }, { word: 'est', category: 'noun' },
    { word: 'a', category: 'verb' }, { word: 'il', category: 'verb' },
    { word: 'vu', category: 'verb' }, // au-delà de la dernière étendue : rattaché à la dernière
  ]);
  assert.deepEqual(alignTerms('Oh là', [{ terms: [term('', 0, 0, ['Noun']), term('là', 3, 2, ['Adverb'])] }]),
    [{ word: 'Oh', category: 'other' }, { word: 'là', category: 'adverb' }]);
  assert.deepEqual(alignTerms('Oh', []), [{ word: 'Oh', category: 'other' }]);
});

test('FrCompromiseTagger respecte le contrat sur un texte à élisions et clitiques', async () => {
  const text = "L'homme qu'il a vu aujourd'hui dit-il vite, là-haut, jusqu'au camion. Y a-t-elle pensé ?";
  const output = await tagText(new FrCompromiseTagger(), text);
  assert.equal(output.find((o) => o.word === 'homme')!.category, 'noun');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LexiconLookupTagger, parseLexicon } from '../../src/adapters/taggers/lexicon-lookup-tagger.ts';
import { fileTextSource } from '../../src/adapters/text-sources/file-text-source.ts';
import { tagText } from '../../src/domain/tagging.ts';

const TSV = '# en-tête\nle\to\nchat\tn\ncourt\tva\nvite\tra\nl’\to\nMarthe\to\n';
const tagger = () => new LexiconLookupTagger(async () => TSV);

test('parseLexicon : lit les entrées, ignore commentaires et lignes vides', () => {
  const lexicon = parseLexicon(TSV);
  assert.equal(lexicon.size, 6);
  assert.equal(lexicon.get('court'), 'va');
});

test('parseLexicon : refuse une ligne non conforme', () => {
  assert.throws(() => parseLexicon('chat\tx'), /ligne non conforme « chat\tx »/);
  assert.throws(() => parseLexicon('sans tabulation'), /ligne non conforme/);
});

test('étiquette par première lecture ; apostrophe droite, majuscule initiale, mots inconnus', async () => {
  const output = await tagText(tagger(), "Le chat court vite, l'ornithorynque Zorglub Marthe.");
  assert.deepEqual(output.map((o) => o.category),
    ['other', 'noun', 'verb', 'adverb', 'other', 'noun', 'other', 'other']);
});

test('ambiguityPredicate : plusieurs catégories pour une forme', async () => {
  const isAmbiguous = await tagger().ambiguityPredicate();
  assert.equal(isAmbiguous('court'), true);
  assert.equal(isAmbiguous('chat'), false);
  assert.equal(isAmbiguous('inconnu'), false);
});

test('le lexique dérivé versionné est conforme et se charge une seule fois', async () => {
  let reads = 0;
  const source = fileTextSource(new URL('../../data/lexique-potao.tsv', import.meta.url));
  const real = new LexiconLookupTagger(() => (reads++, source()));
  const output = await tagText(real, 'La ferme est vite fermée.');
  assert.equal(output.find((o) => o.word === 'vite')!.category, 'adverb');
  assert.equal((await real.ambiguityPredicate())('ferme'), true);
  assert.equal(reads, 1);
});

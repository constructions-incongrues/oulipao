import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CamembertTagger, categoryOfLabel, locatePieces, splitSentences, type PieceClassifier,
} from '../../src/adapters/taggers/camembert-tagger.ts';
import { tagText } from '../../src/domain/tagging.ts';

test('categoryOfLabel : étiquettes du French Treebank', () => {
  assert.equal(categoryOfLabel('NC'), 'noun');
  assert.equal(categoryOfLabel('NPP'), 'other');
  assert.equal(categoryOfLabel('VPP'), 'verb');
  assert.equal(categoryOfLabel('ADJ'), 'adjective');
  assert.equal(categoryOfLabel('ADVWH'), 'adverb');
  assert.equal(categoryOfLabel('DET'), 'other');
  assert.equal(categoryOfLabel(undefined), 'other');
});

test('splitSentences : une phrase à la fois, avec sa position', () => {
  assert.deepEqual(splitSentences('Il dort. Elle lit ! Fin'), [
    { sentence: 'Il dort. ', offset: 0 }, { sentence: 'Elle lit ! ', offset: 9 }, { sentence: 'Fin', offset: 20 },
  ]);
});

test('locatePieces : positions, marqueurs vides et sous-mots introuvables ignorés', () => {
  const pieces = [
    { piece: '', label: 'NC' }, { piece: 'La', label: 'DET' }, { piece: ' ferme', label: 'NC' },
    { piece: 'œ', label: 'NC' }, { piece: '.', label: 'PONCT' },
  ];
  assert.deepEqual(locatePieces('La ferme.', 10, pieces), [
    { start: 10, label: 'DET' }, { start: 13, label: 'NC' }, { start: 18, label: 'PONCT' },
  ]);
});

// Classifieur factice : un sous-mot par mot connu, coupé en deux pour « fermement ».
const LABELS: Record<string, string> = { La: 'DET', ferme: 'NC', est: 'V', grande: 'ADJ', Il: 'CLS', parle: 'V', fermement: 'ADV' };
const fake: PieceClassifier = {
  async classify(sentence) {
    const pieces = [{ piece: '', label: 'NC' }];
    for (const [word] of sentence.matchAll(/\p{L}+|[.!?]/gu)) {
      if (word === 'fermement') pieces.push({ piece: 'ferme', label: 'ADV' }, { piece: 'ment', label: 'NC' });
      else if (word !== 'inconnu') pieces.push({ piece: word, label: LABELS[word] ?? 'PONCT' });
    }
    return pieces;
  },
};

test('CamembertTagger : premier sous-mot du mot, phrase par phrase', async () => {
  const output = await tagText(new CamembertTagger(fake), 'La ferme est grande. Il parle fermement inconnu');
  assert.deepEqual(output.map((o) => o.category),
    ['other', 'noun', 'verb', 'adjective', 'other', 'verb', 'adverb', 'other']);
});

test('CamembertTagger : refuse une sortie de modèle non conforme', async () => {
  const broken = { classify: async () => [{ piece: 'La' }] } as unknown as PieceClassifier;
  await assert.rejects(tagText(new CamembertTagger(broken), 'La'));
});

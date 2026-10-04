import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CamembertTagger, categoryOfLabel, locatePieces, MAX_WORDS, splitSentences, type PieceClassifier,
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

/** Les morceaux recollés redonnent le texte, et chaque décalage pointe sur son morceau. */
const covers = (text: string, pieces: { sentence: string; offset: number }[]) => {
  assert.equal(pieces.map((piece) => piece.sentence).join(''), text);
  for (const piece of pieces) assert.equal(text.slice(piece.offset, piece.offset + piece.sentence.length), piece.sentence);
};
const count = (text: string) => text.split(/\s+/).filter(Boolean).length;

test('splitSentences : une phrase courte reste entière, comme avant', () => {
  const text = 'Le chat dort. Il rêve !';
  assert.deepEqual(splitSentences(text, 5), [{ sentence: 'Le chat dort. ', offset: 0 }, { sentence: 'Il rêve !', offset: 14 }]);
});

test('splitSentences : un poème sans point est regroupé par vers, sans dépasser la borne', () => {
  const poem = ['un deux trois', 'quatre cinq six', 'sept huit', 'neuf dix onze douze'].join('\n');
  const pieces = splitSentences(poem, 6);
  covers(poem, pieces);
  assert.ok(pieces.every((piece) => count(piece.sentence) <= 6));
  assert.deepEqual(pieces.map((piece) => piece.sentence), ['un deux trois\nquatre cinq six\n', 'sept huit\nneuf dix onze douze']);
});

test('splitSentences : un vers trop long est coupé en fenêtres de mots', () => {
  const line = 'a b c d e f g h i j k';
  const text = `court\n${line}\nfin`;
  const pieces = splitSentences(text, 4);
  covers(text, pieces);
  assert.ok(pieces.every((piece) => count(piece.sentence) <= 4));
  assert.deepEqual(pieces.map((piece) => piece.sentence.trim()), ['court', 'a b c d', 'e f g h', 'i j k', 'fin']);
});

test('un texte long sans ponctuation est étiqueté morceau par morceau, sans mot perdu', async () => {
  const line = 'le chat du notaire dormit au soleil sur le mur de la mairie';
  const poem = Array.from({ length: 50 }, () => line).join('\n'); // 650 mots, aucun point
  const calls: number[] = [];
  const tagger = new CamembertTagger({
    async classify(sentence) {
      calls.push(count(sentence));
      if (count(sentence) > MAX_WORDS) throw new Error('séquence trop longue pour le modèle');
      return sentence.split(/\s+/).filter(Boolean).map((piece) => ({ piece, label: piece === 'chat' ? 'NC' : 'DET' }));
    },
  });
  const words = await tagger.tag(poem);
  assert.equal(words.length, 650);
  assert.ok(calls.length > 1 && calls.every((n) => n <= MAX_WORDS));
  assert.equal(words.filter((word) => word.category === 'noun').length, 50);
});

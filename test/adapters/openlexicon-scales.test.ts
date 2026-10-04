import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoriesOf, deriveScales, lemmaOf, parseTable, percentileRanks, type ScaleSource } from '../../src/adapters/lexicon/openlexicon-scales.ts';
import { InMemoryMorphology } from '../../src/adapters/morphology/in-memory-morphology.ts';

const morphology = new InMemoryMorphology({
  nouns: [
    { form: 'deuil', lemma: 'deuil', gender: 'm', number: 's' },
    { form: 'fête', lemma: 'fête', gender: 'f', number: 's' },
    { form: 'maton', lemma: 'maton', gender: 'm', number: 's' },
    { form: 'matons', lemma: 'maton', gender: 'm', number: 'p' },
    { form: 'triste', lemma: 'triste', gender: 'e', number: 's' },
  ],
  adjectives: [
    { form: 'triste', paradigm: 'triste', gender: 'e', number: 's' },
    { form: 'gai', paradigm: 'gai', gender: 'm', number: 's' },
  ],
  adverbs: [],
  noElision: [],
});

// Deux petites bases à la façon de Gobin (catégorie par mot, CRLF) et de Bonin (des noms).
const SOURCES: ScaleSource[] = [
  { name: 'A', file: 'a.tsv', word: 'Word', scores: { valence: 'Val', arousal: 'Aro' }, category: { column: 'C.gram' } },
  { name: 'B', file: 'b.tsv', word: 'Word', scores: { valence: 'Val' }, category: 'noun' },
];
const TABLES = {
  'a.tsv': 'Word\tC.gram\tVal\tAro\r\ndeuil\tnom\t-3\t5\r\nmatons\tnom\t-1\t\r\ntriste\tadj./nom\t-2\t2\r\nbattre\tverbe\t0\t4\r\nque\tconj.\t0\t1\r\nfête\tnom\t3\tNA\r\n',
  'b.tsv': 'Word\tVal\nFête\t1\nDeuil\t5\n',
};

test('table : les cellules rangées sous leur colonne, CRLF compris', () => {
  assert.deepEqual(parseTable('a\tb\r\n1\t2\r\n\r\n'), [{ a: '1', b: '2' }]);
  assert.deepEqual(parseTable(''), []);
});

test('catégories de Gobin : nom, adjectif, les deux, aucune', () => {
  assert.deepEqual(categoriesOf('nom'), ['noun']);
  assert.deepEqual(categoriesOf('adj./nom/verbe'), ['noun', 'adjective']);
  assert.deepEqual(categoriesOf('adj.'), ['adjective']);
  assert.deepEqual(categoriesOf('verbe'), []);
});

test('lemme : une forme fléchie revient à son lemme, un mot inconnu n’en a pas', () => {
  assert.equal(lemmaOf('Matons', 'noun', morphology), 'maton');
  assert.equal(lemmaOf('triste', 'adjective', morphology), 'triste');
  assert.equal(lemmaOf('battre', 'noun', morphology), undefined);
});

test('rangs : de 0 à 1, les ex aequo partagent leur rang moyen', () => {
  assert.deepEqual(percentileRanks([10, 30, 20]), [0, 1, 0.5]);
  assert.deepEqual(percentileRanks([1, 1, 2]), [0.25, 0.25, 1]);
  assert.deepEqual(percentileRanks([7]), [0]);
});

test('échelles : rang moyen d’une base à l’autre, mots hors morphologie écartés et comptés', () => {
  const { lines, stats } = deriveScales(TABLES, morphology, SOURCES);
  // Valence dans A (6 notes) : deuil 0, triste 0.2, matons 0.4, battre et que 0.7, fête 1 ; dans B : fête 0, deuil 1.
  assert.deepEqual(lines, [
    'arousal\tadjective\ttriste\t33',
    'arousal\tnoun\tdeuil\t100',
    'arousal\tnoun\ttriste\t33',
    'valence\tadjective\ttriste\t20',
    'valence\tnoun\tdeuil\t50',
    'valence\tnoun\tfête\t50',
    'valence\tnoun\tmaton\t40',
    'valence\tnoun\ttriste\t20',
  ]);
  assert.deepEqual(stats.discarded, { A: 2, B: 0 });
  assert.deepEqual(stats.kept, { 'arousal adjective': 1, 'arousal noun': 2, 'valence adjective': 1, 'valence noun': 4 });
});

test('échelles : une base absente ne donne rien', () => {
  assert.deepEqual(deriveScales({}, morphology, SOURCES).lines, []);
});

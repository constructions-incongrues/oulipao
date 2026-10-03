import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveVerbs, verbRowsOf } from '../../src/adapters/lexicon/grammalecte-verbs.ts';
import { InMemoryVerbs, loadVerbs, parseVerbs } from '../../src/adapters/morphology/in-memory-verbs.ts';

// Ligne au format du lexique Grammalecte : forme en 3e colonne, lemme en 4e, étiquettes en 5e, notes en 8e.
const row = (form: string, lemma: string, tags: string, notes = '') =>
  ['0', '1', form, lemma, tags, 'x', 'x', notes, ...Array<string>(12).fill('x')].join('\t');

test('verbRowsOf : une ligne par temps et par personne', () => {
  assert.deepEqual(verbRowsOf(row('mange', 'manger', 'v1_it_x__a ipre spre 1sg 3sg')), [
    'V\tmange\tmanger\tindicative-present\t1s\t0',
    'V\tmange\tmanger\tindicative-present\t3s\t0',
    'V\tmange\tmanger\tsubjunctive-present\t1s\t0',
    'V\tmange\tmanger\tsubjunctive-present\t3s\t0',
  ]);
  assert.deepEqual(verbRowsOf(row('manger', 'manger', 'v1_it_x__a infi')), ['V\tmanger\tmanger\tinfinitive\t-\t0']);
  assert.deepEqual(verbRowsOf(row('mangeant', 'manger', 'v1_it_x__a ppre')), ['V\tmangeant\tmanger\tpresent-participle\t-\t0']);
});

test('verbRowsOf : participe passé, h aspiré, auxiliaires, formes d’inversion', () => {
  assert.deepEqual(verbRowsOf(row('mangées', 'manger', 'v1_it_x__a ppas adj fem pl')), ['V\tmangées\tmanger\tpast-participle\tfp\t0']);
  assert.deepEqual(verbRowsOf(row('fallu', 'falloir', 'v3__tnem_a ppas epi inv')), ['V\tfallu\tfalloir\tpast-participle\tei\t0']);
  assert.deepEqual(verbRowsOf(row('été', 'être', 'v0ei_____a ppas')), ['V\tété\têtre\tpast-participle\tei\t0']);
  assert.deepEqual(verbRowsOf(row('hait', 'haïr', 'v2_it_q__a ipre 3sg', 'pel')), ['V\thait\thaïr\tindicative-present\t3s\t1']);
  assert.deepEqual(verbRowsOf(row('sont', 'être', 'v0ei_____a ipre 3pl!')), ['V\tsont\têtre\tindicative-present\t3p\t0']);
  assert.deepEqual(verbRowsOf(row('puissé', 'pouvoir', 'v3_it_xx_a simp 1isg')), []);
  assert.deepEqual(verbRowsOf(row('maison', 'maison', 'nom fem sg')), []);
  assert.deepEqual(verbRowsOf('trop court'), []);
});

test('deriveVerbs : sans doublon, dans l’ordre du lexique', () => {
  const line = row('mange', 'manger', 'v1_it_x__a impe 2sg');
  assert.deepEqual(deriveVerbs([line, line]), ['V\tmange\tmanger\timperative\t2s\t0']);
});

const TSV = [
  '# en-tête',
  'V\tmangeait\tmanger\tindicative-imperfect\t3s\t0',
  'V\tmanger\tmanger\tinfinitive\t-\t0',
  'V\tmangée\tmanger\tpast-participle\tfs\t0',
  'V\thait\thaïr\tindicative-present\t3s\t1',
  'V\test\têtre\tindicative-present\t3s\t0',
  '',
].join('\n');

test('Formes de « manger »', async () => {
  const verbs = await loadVerbs(async () => TSV);
  assert.deepEqual(verbs.readings('mangeait'), [{ form: 'mangeait', infinitive: 'manger', tense: 'indicative-imperfect', person: '3s' }]);
  assert.deepEqual(verbs.readings('mangée'), [{ form: 'mangée', infinitive: 'manger', tense: 'past-participle', gender: 'f', number: 's' }]);
  assert.equal(verbs.forms('manger').length, 3);
  assert.deepEqual(verbs.forms('inconnu'), []);
  assert.deepEqual(verbs.readings('inconnu'), []);
  // Les auxiliaires ont leurs lectures, mais pas de place dans le dictionnaire.
  assert.deepEqual(verbs.infinitives(), ['haïr', 'manger']);
  assert.equal(verbs.readings('est').length, 1);
  assert.equal(verbs.blocksElision('hait'), true);
  assert.equal(verbs.blocksElision('mangeait'), false);
});

test('Ligne non conforme', () => {
  assert.throws(() => parseVerbs('V\tmange\tmanger\tpresent\t3s\t0'), /verbes : ligne non conforme « V\tmange\tmanger\tpresent/);
  assert.throws(() => parseVerbs('V\tmange\tmanger\tindicative-present\t4s\t0'), /non conforme/);
  assert.throws(() => parseVerbs('N\tmange\tmanger\tindicative-present\t3s\t0'), /non conforme/);
});

test('InMemoryVerbs : ordre du dictionnaire, accents ignorés', () => {
  const v = (infinitive: string) => ({ form: infinitive, infinitive, tense: 'infinitive' as const });
  assert.deepEqual(new InMemoryVerbs([v('étendre'), v('finir'), v('aimer'), v('avoir')]).infinitives(), ['aimer', 'étendre', 'finir']);
});

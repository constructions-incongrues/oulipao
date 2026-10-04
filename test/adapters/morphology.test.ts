import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveMorphology, morphologyRowsOf } from '../../src/adapters/lexicon/grammalecte-morphology.ts';
import { InMemoryMorphology, loadMorphology, parseMorphology } from '../../src/adapters/morphology/in-memory-morphology.ts';
import { fileTextSource } from '../../src/adapters/text-sources/file-text-source.ts';
import { applyS7 } from '../../src/domain/s7/engine.ts';
import { tag } from '../support/morphology.ts';

// Ligne au format du lexique Grammalecte : forme en 3e colonne, lemme en 4e, étiquettes en 5e, notes en 8e.
const row = (form: string, lemma: string, tags: string, notes = '') =>
  ['0', '1', form, lemma, tags, 'x', 'x', notes, ...Array<string>(12).fill('x')].join('\t');

test('morphologyRowsOf : noms, adjectifs, participes adjectivés, interdiction d’élision', () => {
  assert.deepEqual(morphologyRowsOf(row('horloge', 'horloge', 'nom fem sg', 'hm')), ['N\thorloge\thorloge\tf\ts\t0']);
  assert.deepEqual(morphologyRowsOf(row('héros', 'héros', 'nom mas inv', 'pel')), ['N\théros\théros\tm\ti\t1']);
  assert.deepEqual(morphologyRowsOf(row('bel', 'beau', 'nom adj mas sg')), ['N\tbel\tbeau\tm\ts\t0', 'A\tbel\tbeau\tm\ts\t0']);
  assert.deepEqual(morphologyRowsOf(row('pressés', 'presser', 'v1_it_q_zz ppas adj mas pl')), ['A\tpressés\tpresser\tm\tp\t0']);
  assert.deepEqual(morphologyRowsOf(row('livre', 'livre', 'nom epi')), ['N\tlivre\tlivre\te\ti\t0']);
});

test('morphologyRowsOf : adverbes invariables, avec leur seule forme', () => {
  assert.deepEqual(morphologyRowsOf(row('vite', 'vite', 'adv')), ['R\tvite\tvite\te\ti\t0']);
  assert.deepEqual(morphologyRowsOf(row('plus', 'plus', 'mg adv negadv')), ['R\tplus\tplus\te\ti\t0']);
});

test('morphologyRowsOf : ignore ce qui n’est ni nom, ni adjectif, ni adverbe, et les lignes hors données', () => {
  assert.deepEqual(morphologyRowsOf(row('ferme', 'fermer', 'v1_itnq__a ipre 3sg')), []);
  assert.deepEqual(morphologyRowsOf(row('Marthe', 'Marthe', 'prn fem inv')), []);
  assert.deepEqual(morphologyRowsOf('# commentaire'), []);
  assert.deepEqual(morphologyRowsOf(row('Flexion', 'Lemme', 'Étiquettes')), []);
  assert.deepEqual(morphologyRowsOf(row('BeSO₃', 'BeSO₃', 'nom mas inv')), []);
  assert.deepEqual(morphologyRowsOf(row('ET', 'T', 'nom mas inv', 'symb')), []);
});

test('deriveMorphology : sans doublon', () => {
  const line = row('est', 'est', 'nom mas sg');
  assert.deepEqual(deriveMorphology([line, line, '# x']), ['N\test\test\tm\ts\t0']);
});

test('parseMorphology : lit le fichier dérivé, refuse une ligne non conforme', () => {
  const data = parseMorphology('# en-tête\nN\théros\théros\tm\ti\t1\nA\tbel\tbeau\tm\ts\t0\nR\tvite\tvite\te\ti\t0\n\n');
  assert.deepEqual(data, {
    nouns: [{ form: 'héros', lemma: 'héros', gender: 'm', number: 'i' }],
    adjectives: [{ form: 'bel', paradigm: 'beau', gender: 'm', number: 's' }],
    adverbs: ['vite'],
    noElision: ['héros'],
  });
  assert.throws(() => parseMorphology('X\ta\ta\tm\ts\t0'), /ligne non conforme/);
  assert.throws(() => parseMorphology('N\ta\ta\tneutre\ts\t0'), /ligne non conforme/);
  assert.throws(() => parseMorphology('A\ta\ta\tm\tduel\t0'), /ligne non conforme/);
  assert.throws(() => parseMorphology('N\ta\ta\tm'), /ligne non conforme/);
});

test('InMemoryMorphology : consultation et ordre du dictionnaire français', () => {
  const m = new InMemoryMorphology({
    nouns: [
      { form: 'zèbre', lemma: 'zèbre', gender: 'm', number: 's' },
      { form: 'école', lemma: 'école', gender: 'f', number: 's' }, { form: 'écoles', lemma: 'école', gender: 'f', number: 'p' },
      { form: 'eau', lemma: 'eau', gender: 'f', number: 's' }, { form: 'effet', lemma: 'effet', gender: 'm', number: 's' },
    ],
    adjectives: [{ form: 'bel', paradigm: 'beau', gender: 'm', number: 's' }],
    noElision: ['onze'],
  });
  assert.deepEqual(m.nounLemmas(), ['eau', 'école', 'effet', 'zèbre']); // « é » se range avec « e »
  assert.equal(m.nounForms('école').length, 2);
  assert.equal(m.nounReadings('écoles')[0]!.number, 'p');
  assert.equal(m.adjectiveReadings('bel')[0]!.paradigm, 'beau');
  assert.deepEqual(m.adjectiveParadigms(), ['beau']);
  assert.deepEqual(m.adverbs(), []); // sans adverbes fournis
  assert.equal(m.adjectiveForms('beau').length, 1);
  assert.deepEqual([m.nounReadings('x'), m.nounForms('x'), m.adjectiveReadings('x'), m.adjectiveForms('x')], [[], [], [], []]);
  assert.equal(m.blocksElision('onze'), true);
  assert.equal(m.blocksElision('eau'), false);
});

test('le fichier de morphologie versionné se charge et sert le moteur', async () => {
  const m = await loadMorphology(fileTextSource(new URL('../../data/morpho-oulipao.tsv', import.meta.url)));
  assert.ok(m.nounLemmas().length > 50000);
  assert.deepEqual(m.nounReadings('horloge'), [{ form: 'horloge', lemma: 'horloge', gender: 'f', number: 's' }]);
  assert.equal(m.blocksElision('héros'), true);
  assert.equal(m.blocksElision('horloge'), false);
  assert.equal(m.nounReadings('chevaux')[0]!.lemma, 'cheval');
  const text = 'La vieille ferme du village.';
  const first = applyS7(text, tag(text), { offset: 7, mode: 'reagree' }, m);
  assert.equal(first.substitutions.length, 2);
  assert.ok(first.substitutions.every((s) => s.status === 'replaced'));
  assert.deepEqual(applyS7(text, tag(text), { offset: 7, mode: 'reagree' }, m), first);
});

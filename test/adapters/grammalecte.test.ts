import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveLexicon, isChemicalFormula, isUnitSymbol, readingsOf } from '../../src/adapters/lexicon/grammalecte.ts';

// Lignes au format du lexique Grammalecte : 20 colonnes, forme en 3e, lemme en 4e, étiquettes en 5e.
const row = (form: string, lemma: string, tags: string) =>
  ['0', '1', form, lemma, tags, ...Array<string>(15).fill('x')].join('\t');

test('readingsOf : rang de préférence par étiquette', () => {
  assert.deepEqual(readingsOf('mg det fem sg'), [[0, 'o']]);
  assert.deepEqual(readingsOf('mg adv negadv'), [[2, 'r']]);
  assert.deepEqual(readingsOf('nom adj mas sg'), [[3, 'n'], [5, 'a']]);
  assert.deepEqual(readingsOf('v0ei_____a ipre 3sg'), [[1, 'v']]);
  assert.deepEqual(readingsOf('v1__tnq__a ipre 3sg'), [[4, 'v']]);
  assert.deepEqual(readingsOf('prn fem inv'), [[6, 'o']]);
});

test('deriveLexicon : fusionne les lectures, trie, compte', () => {
  const { entries, stats } = deriveLexicon([
    '# commentaire',
    'id\tfid\tFlexion\tLemme\tÉtiquettes' + '\tx'.repeat(15),
    row('ferme', 'ferme', 'adj epi sg'),
    row('ferme', 'ferme', 'nom fem sg'),
    row('ferme', 'fermer', 'v1_itnq__a ipre 3sg'),
    row('est', 'être', 'v0ei_____a ipre 3sg'),
    row('est', 'est', 'nom mas sg'),
    row('est', 'est', 'nom mas sg'),
    row('Marthe', 'Marthe', 'prn fem inv'),
  ]);
  assert.deepEqual(entries, ['Marthe\to', 'est\tvn', 'ferme\tnva']);
  assert.deepEqual(stats, { forms: 3, ambiguous: 2, nounRowsWithGender: 3, nounLemmasWithGender: 2 });
});

test('isChemicalFormula : formules écartées, sigles et unités gardés', () => {
  assert.equal(isChemicalFormula('AgBF₄', 'chim'), true);
  assert.equal(isChemicalFormula('CO₂', ''), true);
  assert.equal(isChemicalFormula('NaCl', 'phys chim'), true);
  assert.equal(isChemicalFormula('CO2', 'chim'), true);
  assert.equal(isChemicalFormula('RMN', 'phys chim'), false);
  assert.equal(isChemicalFormula('GHz', 'phys'), false);
  assert.equal(isChemicalFormula('azote', 'chim'), false);
});

test('deriveLexicon : sans formule chimique', () => {
  const chem = (form: string, domains: string) =>
    ['0', '1', form, form, 'nom mas inv', 'x', 'x', 'cc', domains, ...Array<string>(11).fill('x')].join('\t');
  const { entries } = deriveLexicon([chem('BeSO₃', 'chim'), chem('NaCl', 'chim'), chem('RMN', 'phys chim')]);
  assert.deepEqual(entries, ['RMN\tn']);
});

test('deriveLexicon : sans symbole d’unité', () => {
  const unit = (form: string, notes: string) =>
    ['0', '1', form, form, 'nom mas inv', 'x', 'x', notes, '', ...Array<string>(11).fill('x')].join('\t');
  assert.equal(isUnitSymbol('symb'), true);
  assert.equal(isUnitSymbol('pel'), false);
  assert.deepEqual(deriveLexicon([unit('ET', 'symb'), unit('ONU', '')]).entries, ['ONU\tn']);
});

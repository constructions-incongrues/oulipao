import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from '../src/categories.js';
import { tokenize } from '../src/tokenize.js';
import { enregistrer, lister, etiqueter } from '../src/taggers/index.js';
import { comparer } from '../src/compare.js';

const mots = (t) => tokenize(t).map((m) => m.mot);

test('tokenize : élisions, clitiques, ponctuation', () => {
  assert.deepEqual(mots("L'homme qu'il a vu aujourd'hui, dit-il."),
    ["L'", 'homme', "qu'", 'il', 'a', 'vu', "aujourd'hui", 'dit', 'il']);
  assert.deepEqual(mots('Y a-t-elle pensé ? Peut-être, en 2026.'),
    ['Y', 'a', 'elle', 'pensé', 'Peut-être', 'en']);
  const [t] = tokenize('  été ');
  assert.deepEqual(t, { mot: 'été', debut: 2, fin: 5 });
});

test('registre : un étiqueteur factice rend des catégories de la constante', async () => {
  enregistrer('factice', (texte) => tokenize(texte).map(({ mot }) => ({ mot, categorie: 'autre' })));
  assert.ok(lister().includes('factice'));
  const sortie = await etiqueter('factice', 'Le chat dort.');
  assert.equal(sortie.length, 3);
  assert.ok(sortie.every((s) => CATEGORIES.includes(s.categorie)));
});

test('registre : refuse une catégorie hors constante ou un découpage différent', async () => {
  enregistrer('faux', () => [{ mot: 'Le', categorie: 'NOUN' }]);
  await assert.rejects(etiqueter('faux', 'Le'), /catégorie inconnue/);
  enregistrer('court', () => []);
  await assert.rejects(etiqueter('court', 'Le chat'), /attendus/);
});

test('comparer : score, mots de contenu, erreurs, ambigus', () => {
  const reference = { mots: [
    { mot: 'La', categorie: 'autre' }, { mot: 'ferme', categorie: 'nom' },
    { mot: 'est', categorie: 'verbe' }, { mot: 'grande', categorie: 'adjectif' },
  ] };
  const sortie = reference.mots.map(({ mot }) => ({ mot, categorie: 'autre' }));
  const r = comparer(sortie, reference, { estAmbigu: (m) => m === 'ferme' || m === 'est' });
  assert.equal(r.total, 4);
  assert.equal(r.corrects, 1);
  assert.deepEqual(r.contenu, { total: 3, corrects: 0 });
  assert.equal(r.ambigus, 2);
  assert.deepEqual(r.erreurs[0], { index: 1, mot: 'ferme', attendu: 'nom', obtenu: 'autre' });
  assert.equal(comparer(sortie, reference).ambigus, null);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bare, lettersOf, restoreArticle } from '../../src/domain/letters.ts';
import { morphology } from '../support/morphology.ts';

test('bare : accents et ligatures ramenés aux lettres nues', () => {
  assert.equal(bare('Âtre'), 'atre');
  assert.equal(bare('cœur'), 'coeur');
  assert.equal(bare('Lætitia'), 'laetitia');
});

test('lettersOf : seules les lettres comptent, dans l’ordre de la saisie', () => {
  assert.equal(lettersOf('Hélène-Marie'), 'helenemarie');
  assert.equal(lettersOf('a, e'), 'ae');
  assert.equal(lettersOf('R2-D2 !'), 'rd');
  assert.equal(lettersOf(''), '');
});

const words = (...outputs: string[]) => outputs.map((output, index) => ({ index, gap: index === 0 ? '' : ' ', output }));

test('restoreArticle : « l’ » devant un mot nouveau à initiale consonantique redevient « le » ou « la »', () => {
  const m = morphology();
  // Genre du mot nouveau : « petite » est féminin.
  const feminine = words("L'", 'petite', 'maison');
  feminine[1]!.gap = '';
  restoreArticle(feminine, 1, 'enceinte', m);
  assert.deepEqual(feminine.slice(0, 2).map(({ gap, output }) => ({ gap, output })), [{ gap: '', output: 'La' }, { gap: ' ', output: 'petite' }]);
  // Épicène : le genre du mot d'origine (« enceinte ») ; sans lecture du tout, le masculin.
  const epicene = words('l’', 'rapide');
  epicene[1]!.gap = '';
  restoreArticle(epicene, 1, 'enceinte', m);
  assert.equal(epicene[0]!.output, 'la');
  const unknown = words('l’', 'plus');
  unknown[1]!.gap = '';
  restoreArticle(unknown, 1, 'ici', m);
  assert.equal(unknown[0]!.output, 'le');
  // Devant une voyelle, un h muet ou après autre chose qu'un « l’ », rien ne bouge.
  for (const [previous, word] of [['l’', 'ici'], ['l’', 'hôtel'], ['d’', 'petit'], ['le', 'petit']] as const) {
    const kept = words(previous, word);
    restoreArticle(kept, 1, word, m);
    assert.equal(kept[0]!.output, previous);
  }
  restoreArticle(words('petit'), 0, 'petit', m);
});

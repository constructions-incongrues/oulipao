import assert from 'node:assert/strict';
import { test } from 'node:test';
import { alignTour, findRepeat } from '../../src/domain/loop.ts';

test('findRepeat : point fixe, cycle de 2, aucune répétition', () => {
  assert.deepEqual(findRepeat(['A', 'B', 'B']), { from: 1, length: 1 });
  assert.deepEqual(findRepeat(['A', 'B', 'C', 'D', 'C']), { from: 2, length: 2 });
  assert.equal(findRepeat(['A', 'B', 'C', 'D']), undefined);
});

test('findRepeat : retrouver le texte d’origine (tour 0) n’est pas une répétition', () => {
  assert.equal(findRepeat(['A', 'B', 'A']), undefined);
});

test('findRepeat : moins de trois textes, rien à comparer', () => {
  assert.equal(findRepeat([]), undefined);
  assert.equal(findRepeat(['A']), undefined);
  assert.equal(findRepeat(['A', 'A']), undefined);
});

test('alignTour : remplacement simple, en deux mots, mot retiré', () => {
  // « Le livre du chat dort. » → « Le livret de la chatte . »… : chaque mot d'origine vers son premier descendant
  const segments = [
    { text: 'Le', index: 0 },
    { text: ' ' },
    { text: 'livret', index: 1 },
    { text: ' ' },
    { text: 'de la', index: 2 },
    { text: ' ' },
    { text: '', index: 3 },
    { text: 'dort', index: 4 },
    { text: '.' },
  ];
  // jetons relus : Le(0) livret(1) de(2) la(3) dort(4)
  assert.deepEqual([...alignTour(segments)], [
    [0, 0],
    [1, 1],
    [2, 2],
    [4, 4],
  ]);
});

test('alignTour : élision et trait d’union suivent le découpage du domaine', () => {
  const segments = [
    { text: 'l’', index: 0 },
    { text: 'arbre', index: 1 },
    { text: ' ' },
    { text: 'peut-être', index: 2 },
  ];
  const aligned = alignTour(segments);
  assert.equal(aligned.get(0), 0);
  assert.equal(aligned.get(1), 1);
  assert.equal(aligned.has(2), true);
});

test('alignTour : un mot répété garde sa place, et un texte hors morceau n’est le descendant de personne', () => {
  const segments = [
    { text: 'Refrain ' },
    { text: 'chat', index: 0 },
    { text: ' et ' },
    { text: 'chat', index: 1 },
  ];
  // jetons : Refrain(0) chat(1) et(2) chat(3)
  assert.deepEqual([...alignTour(segments)], [
    [0, 1],
    [1, 3],
  ]);
});

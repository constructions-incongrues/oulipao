import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countByStatus, renderReviewGrid } from '../../src/adapters/reports/review-grid.ts';
import type { S7Result } from '../../src/domain/s7/types.ts';

const result: S7Result = {
  text: 'Le fermoir.\nLa Zorglub | les arbres\n',
  words: [],
  tail: '',
  substitutions: [
    { index: 1, original: 'ferme', replacement: 'fermoir', status: 'replaced', before: 'La ferme', after: 'Le fermoir' },
    { index: 3, original: 'Zorglub', replacement: 'Zorglub', status: 'unknown-noun', before: 'La Zorglub |', after: 'La Zorglub |' },
    { index: 5, original: 'arbres', replacement: 'arbres', status: 'missing-form', before: 'les\narbres', after: 'les\narbres' },
  ],
};

test('countByStatus', () => {
  assert.deepEqual(countByStatus(result), { replaced: 1, unknown: 1, missing: 1 });
});

test('renderReviewGrid : texte cité, décompte, une ligne par substitution', () => {
  assert.equal(renderReviewGrid('Texte 1 — réaccord', result), [
    '## Texte 1 — réaccord',
    '',
    '> Le fermoir.',
    '> La Zorglub | les arbres',
    '',
    '3 noms : 1 remplacés, 1 inconnus du dictionnaire, 1 sans forme au nombre voulu.',
    '',
    '| # | Avant | Après | Statut | Correct ? |',
    '|---|---|---|---|---|',
    '| 1 | La ferme | Le fermoir | remplacé |  |',
    '| 2 | La Zorglub \\| | La Zorglub \\| | nom inconnu |  |',
    '| 3 | les arbres | les arbres | forme manquante |  |',
    '',
  ].join('\n'));
});

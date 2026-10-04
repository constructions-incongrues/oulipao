import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { goldenRuns, loadResources, type GoldenRun } from '../support/chain-golden.ts';

// Les sorties du banc de référence : un changement interne (linéarisation, cache, extraction) ne
// change aucun résultat. Un changement voulu se fige à nouveau avec scripts/chain-golden.ts, et le
// diff de chain-golden.json montre exactement ce qui a changé.
const expected = JSON.parse(readFileSync(new URL('../support/chain-golden.json', import.meta.url), 'utf8')) as GoldenRun[];

test('le banc de référence des contraintes rend les sorties figées', async () => {
  const actual = goldenRuns(await loadResources());
  assert.equal(actual.length, expected.length);
  for (const [k, run] of actual.entries()) assert.deepEqual(run, expected[k], `${run.text} · ${run.chain}`);
});

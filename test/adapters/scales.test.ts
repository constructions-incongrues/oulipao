import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InMemoryScales, loadScales, parseScales } from '../../src/adapters/morphology/in-memory-scales.ts';
import { fileTextSource } from '../../src/adapters/text-sources/file-text-source.ts';

const TSV = '# en-tête\nvalence\tnoun\tfête\t90\nvalence\tnoun\tdeuil\t3\nvalence\tnoun\tbal\t90\nvalence\tadjective\tgai\t80\narousal\tnoun\tdeuil\t70\n';

test('échelles : de la note la plus basse à la plus haute, les ex aequo dans l’ordre du dictionnaire', () => {
  const scales = new InMemoryScales(parseScales(TSV));
  assert.deepEqual(scales.scale('valence', 'noun'), ['deuil', 'bal', 'fête']);
  assert.deepEqual(scales.scale('valence', 'adjective'), ['gai']);
  assert.equal(scales.scale('valence', 'noun'), scales.scale('valence', 'noun'));
});

test('échelles : une échelle absente est vide, un lemme absent n’a pas de note', () => {
  const scales = new InMemoryScales(parseScales(TSV));
  assert.deepEqual(scales.scale('concreteness', 'adjective'), []);
  assert.equal(scales.score('arousal', 'noun', 'deuil'), 70);
  assert.equal(scales.score('valence', 'noun', 'table'), undefined);
});

test('échelles : une ligne non conforme est refusée', () => {
  for (const line of ['alphabetical\tnoun\tdeuil\t3', 'valence\tverb\tpleurer\t3', 'valence\tnoun\tdeuil\t101', 'valence\tnoun\tdeuil\t', 'valence\tnoun\t\t3', 'valence\tnoun\tdeuil\t2.5'])
    assert.throws(() => parseScales(`${line}\n`), /échelles : ligne non conforme/);
});

test('échelles : le fichier livré se charge', async () => {
  const scales = await loadScales(fileTextSource(new URL('../../data/echelles-oulipao.tsv', import.meta.url)));
  assert.ok(scales.scale('valence', 'noun').length > 2000);
  assert.ok(scales.scale('concreteness', 'noun').length > 1000);
  assert.deepEqual(scales.scale('concreteness', 'adjective'), []);
});

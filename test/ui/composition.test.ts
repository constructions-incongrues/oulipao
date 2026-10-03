import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMorphologyLoader, createNeuralTagger, createNeuralTagging, createTaggers, MORPHOLOGY_VERSION } from '../../src/ui/composition.ts';

test('les trois étiqueteurs de l’essai, le neuronal en premier', () => {
  const taggers = createTaggers('http://localhost/dist/page.js');
  assert.deepEqual(taggers.map((t) => t.name), [
    'CamemBERT (modèle neuronal local)', 'fr-compromise (règles contextuelles)', 'lexique (consultation seule)',
  ]);
  assert.equal(createNeuralTagger().name, taggers[0]!.name);
  const { tagger, preload } = createNeuralTagging();
  assert.equal(tagger.name, taggers[0]!.name);
  assert.equal(typeof preload, 'function');
});

test('le dictionnaire est cherché à côté de dist/, une seule fois', async () => {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (url) => (urls.push(String(url)), new Response('N\thorloge\thorloge\tf\ts\t0\n'));
  try {
    const load = createMorphologyLoader('http://localhost/dist/tracks.js');
    const [a, b] = await Promise.all([load(), load()]);
    assert.equal(a, b);
    assert.deepEqual(a.nounLemmas(), ['horloge']);
    assert.deepEqual(urls, [`http://localhost/data/morpho-potao.tsv?v=${MORPHOLOGY_VERSION}`]); // versionné : pas de copie périmée
  } finally {
    globalThis.fetch = original;
  }
});

test('dictionnaire injoignable (D12) : l’échec n’est pas gardé, le prochain essai recharge', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => (calls++ === 0 ? new Response('', { status: 503 }) : new Response('N\thorloge\thorloge\tf\ts\t0\n'));
  try {
    const load = createMorphologyLoader('http://localhost/dist/tracks.js');
    await assert.rejects(load());
    assert.deepEqual((await load()).nounLemmas(), ['horloge']);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});

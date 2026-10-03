import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchTextSource } from '../../src/adapters/text-sources/fetch-text-source.ts';
import { fileTextSource } from '../../src/adapters/text-sources/file-text-source.ts';

test('fileTextSource lit un fichier local', async () => {
  const text = await fileTextSource(new URL('../../reference/FORMAT.md', import.meta.url))();
  assert.match(text, /Format des textes de référence/);
});

test('fetchTextSource lit une ressource et signale un échec', async () => {
  assert.equal(await fetchTextSource('data:text/plain,chat%09n')(), 'chat\tn');
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 404 });
  try {
    await assert.rejects(fetchTextSource('http://localhost/absent.tsv')(), /absent\.tsv : 404/);
  } finally {
    globalThis.fetch = original;
  }
});

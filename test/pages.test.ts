import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// La politique de sécurité du contenu des deux pages publiées (spec mise-en-ligne).
const policyOf = (page: string) => {
  const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
  const match = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html);
  assert.ok(match, `${page} : pas de politique de sécurité du contenu`);
  return new Map(match[1]!.split(';').map((directive) => directive.trim().split(/\s+/)).map(([name, ...sources]) => [name!, sources]));
};

test('les deux pages déclarent la même politique, qui borne les connexions aux trois fournisseurs', () => {
  const tracks = policyOf('tracks.html');
  assert.deepEqual(policyOf('index.html'), tracks);
  assert.deepEqual(tracks.get('connect-src'), ["'self'", 'https://cdn.jsdelivr.net', 'https://huggingface.co', 'https://*.hf.co']);
  // blob: : le moteur ONNX importe son module depuis une copie en mémoire.
  assert.deepEqual(tracks.get('script-src'), ["'self'", 'https://cdn.jsdelivr.net', "'wasm-unsafe-eval'", 'blob:']);
  assert.deepEqual(tracks.get('default-src'), ["'self'"]);
  for (const name of ['object-src', 'base-uri', 'form-action']) assert.deepEqual(tracks.get(name), ["'none'"]);
});

test('la page d’essai réserve dans son introduction le lien de version vers le journal', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<a id="version" href="https:\/\/github\.com\/constructions-incongrues\/oulipao\/blob\/main\/CHANGELOG\.md">/);
});

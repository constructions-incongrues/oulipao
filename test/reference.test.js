import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { CATEGORIES } from '../src/categories.js';
import { tokenize } from '../src/tokenize.js';

const dossier = new URL('../reference/', import.meta.url);
for (const fichier of readdirSync(dossier).filter((f) => f.endsWith('.json'))) {
  test(`${fichier} est conforme à reference/FORMAT.md`, () => {
    const ref = JSON.parse(readFileSync(new URL(fichier, dossier), 'utf8'));
    assert.deepEqual(ref.mots.map((m) => m.mot), tokenize(ref.texte).map((m) => m.mot));
    assert.ok(ref.mots.every((m) => CATEGORIES.includes(m.categorie)));
  });
}

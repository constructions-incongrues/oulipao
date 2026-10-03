// Dérive data/morpho-potao.tsv du lexique Grammalecte v7.7 (MPL 2.0).
// Entrée : data/brut/lexique-grammalecte-fr-v7.7.txt (voir docs/lexiques.md).
// Usage : npm run build:morphology
import { readFileSync, writeFileSync } from 'node:fs';
import { DERIVED_MORPHOLOGY_HEADER, deriveMorphology } from '../src/adapters/lexicon/grammalecte-morphology.ts';

const input = new URL('../data/brut/lexique-grammalecte-fr-v7.7.txt', import.meta.url);
const output = new URL('../data/morpho-potao.tsv', import.meta.url);

const rows = deriveMorphology(readFileSync(input, 'utf8').split(/\r?\n/));
writeFileSync(output, `${[...DERIVED_MORPHOLOGY_HEADER, ...rows].join('\n')}\n`);
console.log(JSON.stringify({ rows: rows.length, nouns: rows.filter((r) => r.startsWith('N')).length }));

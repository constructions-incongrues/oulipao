// Dérive data/verbes-oulipao.tsv du lexique Grammalecte v7.7 (MPL 2.0).
// Entrée : data/brut/lexique-grammalecte-fr-v7.7.txt (voir docs/lexiques.md).
// Usage : npm run build:verbs
import { readFileSync, writeFileSync } from 'node:fs';
import { DERIVED_VERBS_HEADER, deriveVerbs } from '../src/adapters/lexicon/grammalecte-verbs.ts';

const input = new URL('../data/brut/lexique-grammalecte-fr-v7.7.txt', import.meta.url);
const output = new URL('../data/verbes-oulipao.tsv', import.meta.url);

const rows = deriveVerbs(readFileSync(input, 'utf8').split(/\r?\n/));
writeFileSync(output, `${[...DERIVED_VERBS_HEADER, ...rows].join('\n')}\n`);
const infinitives = new Set(rows.map((row) => row.split('\t')[2]));
console.log(JSON.stringify({ rows: rows.length, infinitives: infinitives.size }));

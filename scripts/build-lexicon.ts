// Dérive data/lexique-oulipao.tsv du lexique Grammalecte v7.7 (MPL 2.0).
// Entrée : data/brut/lexique-grammalecte-fr-v7.7.txt, à télécharger depuis
//   https://grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip  (voir docs/lexiques.md)
// Usage : npm run build:lexicon
import { readFileSync, writeFileSync } from 'node:fs';
import { DERIVED_LEXICON_HEADER, deriveLexicon } from '../src/adapters/lexicon/grammalecte.ts';

const input = new URL('../data/brut/lexique-grammalecte-fr-v7.7.txt', import.meta.url);
const output = new URL('../data/lexique-oulipao.tsv', import.meta.url);

const { entries, stats } = deriveLexicon(readFileSync(input, 'utf8').split(/\r?\n/));
writeFileSync(output, `${[...DERIVED_LEXICON_HEADER, ...entries].join('\n')}\n`);
console.log(JSON.stringify(stats));

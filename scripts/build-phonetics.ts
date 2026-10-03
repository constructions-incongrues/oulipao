// Dérive data/phonetique-oulipao.tsv de GLÀFF 1.2.2 (CC BY-SA 3.0), réduit aux formes connues de
// Grammalecte (data/lexique-oulipao.tsv), complété des formes candidates des filtres de rime
// (data/morpho-oulipao.tsv, data/verbes-oulipao.tsv), et la liste fermée des rimes du monorime.
// Entrée : data/brut/autres/glaff/GLAFF-1.2.2/glaff-1.2.2.txt (voir docs/lexiques.md).
// Usage : npm run build:phonetics
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { completePhonetics, DERIVED_PHONETICS_HEADER, derivePhonetics, frequentRhymes, glaffFrequency } from '../src/adapters/lexicon/glaff-phonetics.ts';

const input = new URL('../data/brut/autres/glaff/GLAFF-1.2.2/glaff-1.2.2.txt', import.meta.url);
const lexicon = new URL('../data/lexique-oulipao.tsv', import.meta.url);
const output = new URL('../data/phonetique-oulipao.tsv', import.meta.url);
const rhymesModule = new URL('../src/domain/rhyme/frequent-rhymes.ts', import.meta.url);
const dataLines = (name: string) => readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8').split('\n').filter((line) => line && !line.startsWith('#'));

const known = new Set(
  readFileSync(lexicon, 'utf8').split('\n').filter((line) => line && !line.startsWith('#')).map((line) => line.split('\t')[0]!),
);
const glaff = readFileSync(input, 'utf8').split(/\r?\n/);
const rows = derivePhonetics(glaff, (form) => known.has(form));
const frequencies = new Map<string, number>();
for (const line of glaff) if (line.split('|', 2)[1]?.startsWith('Nc')) frequencies.set(line.split('|', 1)[0]!, glaffFrequency(line));
// Les formes que les filtres de rime peuvent retenir : noms, adjectifs, adverbes, puis verbes.
const universe: [string, 'N' | 'A' | 'V' | 'R'][] = [
  ...dataLines('morpho-oulipao.tsv').map((line) => line.split('\t')).map(([kind, form]) => [form!, kind as 'N' | 'A' | 'R'] as [string, 'N' | 'A' | 'R']),
  ...dataLines('verbes-oulipao.tsv').map((line) => [line.split('\t')[1]!, 'V'] as [string, 'V']),
];
const extra = completePhonetics(rows, universe);
const content = `${[...DERIVED_PHONETICS_HEADER, ...rows, ...extra].join('\n')}\n`;
writeFileSync(output, content);

const rhymes = frequentRhymes(rows, 30, (form) => frequencies.get(form) ?? 0);
writeFileSync(
  rhymesModule,
  `// Généré par npm run build:phonetics : les rimes les plus fréquentes parmi les noms de GLÀFF
// (CC BY-SA 3.0), avec un nom exemple. Ne pas modifier à la main.
export const FREQUENT_RHYMES: readonly { rhyme: string; example: string }[] = ${JSON.stringify(rhymes, null, 2)};
`,
);

const covered = new Set(rows.map((row) => row.split('\t')[0]));
console.log(
  JSON.stringify({
    rows: rows.length,
    borrowed: extra.filter((row) => row.endsWith('\tA')).length,
    guessed: extra.filter((row) => row.endsWith('\tR')).length,
    forms: covered.size,
    knownForms: known.size,
    uncovered: `${(100 * (1 - covered.size / known.size)).toFixed(1)} %`,
    bytes: Buffer.byteLength(content),
    gzipBytes: gzipSync(content).length,
  }),
);

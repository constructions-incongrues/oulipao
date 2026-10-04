// Dérive data/echelles-oulipao.tsv de quatre normes affectives du français (openlexicon, CC BY-SA 4.0),
// réduites aux lemmes de noms et d'adjectifs connus de Grammalecte (data/morpho-oulipao.tsv).
// Entrée : data/brut/autres/openlexicon/*.tsv (voir docs/lexiques.md).
// Usage : npm run build:scales
import { readFileSync, writeFileSync } from 'node:fs';
import { DERIVED_SCALES_HEADER, deriveScales, SCALE_SOURCES } from '../src/adapters/lexicon/openlexicon-scales.ts';
import { loadMorphology } from '../src/adapters/morphology/in-memory-morphology.ts';
import { fileTextSource } from '../src/adapters/text-sources/file-text-source.ts';

const input = (file: string) => new URL(`../data/brut/autres/openlexicon/${file}`, import.meta.url);
const output = new URL('../data/echelles-oulipao.tsv', import.meta.url);

const morphology = await loadMorphology(fileTextSource(new URL('../data/morpho-oulipao.tsv', import.meta.url)));
const tables = Object.fromEntries(SCALE_SOURCES.map(({ file }) => [file, readFileSync(input(file), 'utf8')]));
const { lines, stats } = deriveScales(tables, morphology);
writeFileSync(output, `${[...DERIVED_SCALES_HEADER, ...lines].join('\n')}\n`);
console.log(`${lines.length} lignes écrites dans data/echelles-oulipao.tsv`);
for (const [group, count] of Object.entries(stats.kept)) console.log(`  gardés, ${group} : ${count}`);
for (const [source, count] of Object.entries(stats.discarded)) console.log(`  écartés, ${source} : ${count}`);

// Mesure chaque étiqueteur sur les textes de référence, puis le chargement des textbanks.
// Usage : npm run measure [-- --errors] (avec node --expose-gc, la mémoire retenue s'affiche aussi)
import { readdirSync, readFileSync } from 'node:fs';
import { CamembertTagger } from '../src/adapters/taggers/camembert-tagger.ts';
import { createCamembertClassifier } from '../src/adapters/taggers/camembert-model.ts';
import { FrCompromiseTagger } from '../src/adapters/taggers/fr-compromise-tagger.ts';
import { loadMorphology } from '../src/adapters/morphology/in-memory-morphology.ts';
import { loadPhonetics } from '../src/adapters/morphology/in-memory-phonetics.ts';
import { loadVerbs } from '../src/adapters/morphology/in-memory-verbs.ts';
import { LexiconLookupTagger } from '../src/adapters/taggers/lexicon-lookup-tagger.ts';
import { fileTextSource } from '../src/adapters/text-sources/file-text-source.ts';
import { compare } from '../src/domain/comparison.ts';
import { ReferenceTextSchema } from '../src/domain/reference-text.ts';
import { tagText } from '../src/domain/tagging.ts';
import type { Tagger } from '../src/ports/tagger.ts';

const directory = new URL('../reference/', import.meta.url);
const references = readdirSync(directory)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((file) => ({ file, reference: ReferenceTextSchema.parse(JSON.parse(readFileSync(new URL(file, directory), 'utf8'))) }));

const lexicon = new LexiconLookupTagger(fileTextSource(new URL('../data/lexique-oulipao.tsv', import.meta.url)));
const taggers: Tagger[] = [new CamembertTagger(createCamembertClassifier()), new FrCompromiseTagger(), lexicon];
const isAmbiguous = await lexicon.ambiguityPredicate();
const ratio = (a: number, b: number) => `${a}/${b} (${((100 * a) / b).toFixed(1)} %)`;

for (const tagger of taggers) {
  console.log(`\n## ${tagger.name}`);
  let correct = 0;
  let total = 0;
  for (const { file, reference } of references) {
    const result = compare(await tagText(tagger, reference.text), reference, { isAmbiguous });
    correct += result.correct;
    total += result.total;
    console.log(
      `${file} : tous les mots ${ratio(result.correct, result.total)} ; mots de contenu ${ratio(result.content.correct, result.content.total)} ; formes ambiguës ${result.ambiguous}`,
    );
    if (process.argv.includes('--errors')) {
      console.log(`  ${result.errors.map((e) => `${e.word} [${e.expected}→${e.actual}]`).join(', ')}`);
    }
  }
  console.log(`ensemble : ${ratio(correct, total)}`);
}

// Le chargement des textbanks, tel que la page le paie au premier filtre qui en a besoin.
console.log('\n## Chargement des textbanks');
const gc = (globalThis as { gc?: () => void }).gc;
const textbanks: [string, string, (text: () => Promise<string>) => Promise<unknown>][] = [
  ['dictionnaire', 'morpho-oulipao.tsv', loadMorphology],
  ['verbes', 'verbes-oulipao.tsv', loadVerbs],
  ['prononciations', 'phonetique-oulipao.tsv', loadPhonetics],
];
const kept: unknown[] = []; // gardées vivantes : sinon le ramasse-miettes les libère avant la mesure
for (const [name, file, load] of textbanks) {
  const text = readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8');
  gc?.();
  const before = process.memoryUsage().heapUsed;
  const start = performance.now();
  kept.push(await load(async () => text));
  const ms = Math.round(performance.now() - start);
  gc?.();
  const heap = gc ? `, ${Math.round((process.memoryUsage().heapUsed - before) / 1e6)} Mo retenus` : '';
  console.log(`${name} : ${ms} ms${heap}`);
}

// Mesure chaque étiqueteur sur les textes de référence.
// Usage : npm run measure [-- --errors]
import { readdirSync, readFileSync } from 'node:fs';
import { CamembertTagger } from '../src/adapters/taggers/camembert-tagger.ts';
import { createCamembertClassifier } from '../src/adapters/taggers/camembert-model.ts';
import { FrCompromiseTagger } from '../src/adapters/taggers/fr-compromise-tagger.ts';
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

const lexicon = new LexiconLookupTagger(fileTextSource(new URL('../data/lexique-potao.tsv', import.meta.url)));
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

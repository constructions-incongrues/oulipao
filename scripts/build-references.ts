// Construit reference/texte-N.json à partir de reference/texte-N.annote.txt.
// Usage : npm run build:references
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CATEGORIES } from '../src/domain/categories.ts';
import { parseAnnotatedText } from '../src/domain/reference-text.ts';

const directory = new URL('../reference/', import.meta.url);

for (const file of readdirSync(directory).filter((f) => f.endsWith('.annote.txt')).sort()) {
  let reference;
  try {
    reference = parseAnnotatedText(readFileSync(new URL(file, directory), 'utf8'));
  } catch (error) {
    throw new Error(`${file} : ${error instanceof Error ? error.message : error}`);
  }
  const target = file.replace('.annote.txt', '.json');
  writeFileSync(new URL(target, directory), `${JSON.stringify(reference, null, 2)}\n`);
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category, reference.words.filter((w) => w.category === category).length]),
  );
  console.log(target, reference.words.length, 'mots', JSON.stringify(counts));
}

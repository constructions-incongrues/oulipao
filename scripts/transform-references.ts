// Applique le S+7 aux textes de référence, dans chaque mode, avec les étiquettes de référence
// puis avec l'étiqueteur neuronal, et écrit les grilles de relecture dans resultats/s7/.
// Usage : npm run transform:references
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadMorphology } from '../src/adapters/morphology/in-memory-morphology.ts';
import { countByStatus, renderReviewGrid } from '../src/adapters/reports/review-grid.ts';
import { createCamembertClassifier } from '../src/adapters/taggers/camembert-model.ts';
import { CamembertTagger } from '../src/adapters/taggers/camembert-tagger.ts';
import { fileTextSource } from '../src/adapters/text-sources/file-text-source.ts';
import { ReferenceTextSchema } from '../src/domain/reference-text.ts';
import { applyS7 } from '../src/domain/s7/engine.ts';
import type { S7Mode } from '../src/domain/s7/types.ts';
import { tagText } from '../src/domain/tagging.ts';

const OFFSET = 7;
const MODES: [S7Mode, string][] = [['same-gender', 'même genre'], ['reagree', 'réaccord']];
const references = new URL('../reference/', import.meta.url);
const output = new URL('../resultats/s7/', import.meta.url);
mkdirSync(output, { recursive: true });

const morphology = await loadMorphology(fileTextSource(new URL('../data/morpho-potao.tsv', import.meta.url)));
const camembert = new CamembertTagger(createCamembertClassifier());

for (const file of readdirSync(references).filter((f) => f.endsWith('.json')).sort()) {
  const reference = ReferenceTextSchema.parse(JSON.parse(readFileSync(new URL(file, references), 'utf8')));
  const taggings = [
    ['étiquettes de référence', reference.words],
    ['étiquettes du modèle neuronal', await tagText(camembert, reference.text)],
  ] as const;
  const sections = [
    `# ${reference.title} — S+${OFFSET}`,
    '',
    'Grille de relecture. Une substitution est correcte si le groupe nominal se lit sans faute :',
    "nom au bon nombre, déterminant et adjectifs voisins accordés, élision et contraction justes.",
    'Remplir la colonne « Correct ? » par oui ou non.',
    '',
    `> ${reference.text}`,
    '',
  ];
  for (const [taggingLabel, tagged] of taggings) {
    for (const [mode, modeLabel] of MODES) {
      const result = applyS7(reference.text, tagged, { offset: OFFSET, mode }, morphology);
      sections.push(renderReviewGrid(`Mode « ${modeLabel} », ${taggingLabel}`, result));
      console.log(file, modeLabel, taggingLabel, JSON.stringify(countByStatus(result)));
    }
  }
  writeFileSync(new URL(file.replace('.json', '.md'), output), sections.join('\n'));
}

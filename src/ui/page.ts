// Page d'essai : branchement sur le DOM. Exclu de la couverture de tests ; la logique
// d'affichage testable est dans render.ts.
import { CamembertTagger } from '../adapters/taggers/camembert-tagger.ts';
import { createCamembertClassifier } from '../adapters/taggers/camembert-model.ts';
import { FrCompromiseTagger } from '../adapters/taggers/fr-compromise-tagger.ts';
import { LexiconLookupTagger } from '../adapters/taggers/lexicon-lookup-tagger.ts';
import { fetchTextSource } from '../adapters/text-sources/fetch-text-source.ts';
import { loadMorphology } from '../adapters/morphology/in-memory-morphology.ts';
import { CATEGORIES } from '../domain/categories.ts';
import { applyS7 } from '../domain/s7/engine.ts';
import type { TaggedWord } from '../domain/tagged-word.ts';
import type { MorphologyRepository } from '../ports/morphology.ts';
import { tagText } from '../domain/tagging.ts';
import type { Tagger } from '../ports/tagger.ts';
import { CATEGORY_LABELS, toSegments } from './render.ts';

// Le script assemblé est servi depuis dist/ : les données sont un cran au-dessus.
const taggers: Tagger[] = [
  new CamembertTagger(createCamembertClassifier()),
  new FrCompromiseTagger(),
  new LexiconLookupTagger(fetchTextSource(new URL('../data/lexique-potao.tsv', import.meta.url))),
];

// Le dictionnaire du S+7 n'est chargé qu'à la première transformation.
let morphology: Promise<MorphologyRepository> | undefined;
const getMorphology = () =>
  (morphology ??= loadMorphology(fetchTextSource(new URL('../data/morpho-potao.tsv', import.meta.url))));

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = byId<HTMLTextAreaElement>('text');
const select = byId<HTMLSelectElement>('tagger');
const status = byId('status');
const output = byId('output');
const offset = byId<HTMLInputElement>('offset');
const mode = byId<HTMLSelectElement>('mode');
const s7Status = byId('s7-status');
const s7Output = byId('s7-output');
// Dernier étiquetage affiché : le S+7 s'y applique sans réétiqueter.
let last: { text: string; tagged: TaggedWord[] } | undefined;

async function transform(): Promise<void> {
  if (!last) return;
  s7Status.className = '';
  s7Status.textContent = 'Transformation en cours…';
  try {
    const result = applyS7(last.text, last.tagged, { offset: Number(offset.value), mode: mode.value as never }, await getMorphology());
    s7Output.textContent = result.text;
    const replaced = result.substitutions.filter((s) => s.status === 'replaced').length;
    s7Status.textContent = `${replaced} noms remplacés sur ${result.substitutions.length}`;
  } catch (error) {
    s7Status.className = 'error';
    s7Status.textContent = error instanceof Error ? error.message : String(error);
  }
}

byId('legend').append(
  ...CATEGORIES.flatMap((category) => {
    const span = document.createElement('span');
    span.className = category;
    span.textContent = CATEGORY_LABELS[category];
    return [span, ' '];
  }),
);
taggers.forEach((tagger, i) => select.add(new Option(tagger.name, String(i))));

async function run(): Promise<void> {
  const text = input.value;
  status.className = '';
  status.textContent = 'Étiquetage en cours…';
  try {
    const started = performance.now();
    const tagged = await tagText(taggers[Number(select.value)]!, text);
    output.replaceChildren(
      ...toSegments(text, tagged).map((segment) => {
        if (!segment.category) return segment.text;
        const span = document.createElement('span');
        span.className = segment.category;
        span.title = CATEGORY_LABELS[segment.category];
        span.textContent = segment.text;
        return span;
      }),
    );
    status.textContent = `${tagged.length} mots, ${Math.round(performance.now() - started)} ms`;
    last = { text, tagged };
    await transform();
  } catch (error) {
    status.className = 'error';
    status.textContent = error instanceof Error ? error.message : String(error);
  }
}

byId('run').addEventListener('click', run);
offset.addEventListener('input', () => void transform());
mode.addEventListener('change', () => void transform());
select.addEventListener('change', () => {
  if (input.value) void run();
});

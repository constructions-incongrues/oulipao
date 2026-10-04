// Le banc de référence des contraintes : un jeu fixe de chaînes appliqué aux trois textes de
// référence (leur étiquetage annoté, sans modèle), avec les vraies textbanks. Ses sorties, figées
// dans chain-golden.json, prouvent qu'un changement interne ne change aucun résultat.
import { readdirSync, readFileSync } from 'node:fs';
import { loadMorphology } from '../../src/adapters/morphology/in-memory-morphology.ts';
import { loadPhonetics } from '../../src/adapters/morphology/in-memory-phonetics.ts';
import { loadVerbs } from '../../src/adapters/morphology/in-memory-verbs.ts';
import { fileTextSource } from '../../src/adapters/text-sources/file-text-source.ts';
import type { ParameterValues, PluginResources } from '../../src/domain/plugin.ts';
import { runChain, type ChainStep } from '../../src/domain/plugin-chain.ts';
import { ReferenceTextSchema } from '../../src/domain/reference-text.ts';
import { installedPlugins } from '../../src/domain/registry.ts';

const plugin = (id: string) => installedPlugins.find((candidate) => candidate.id === id)!;

/** Une étape : un type, ses réglages (complétés des valeurs par défaut), ses pistes par défaut. */
const step = (id: string, values: ParameterValues = {}): Omit<ChainStep, 'id'> => {
  const found = plugin(id);
  return { plugin: found, values: found.parse({ ...found.defaults, ...values }), targets: new Set(found.defaultTargets) };
};

/** Les chaînes du banc, par nom. */
export const GOLDEN_CHAINS: Record<string, Omit<ChainStep, 'id'>[]> = {
  's7': [step('s7')],
  's-de': [step('s7', { draw: 'dice', seed: 2461318 })],
  'tri': [step('track-sort')],
  'tri-puis-s-de': [step('track-sort'), step('s7', { draw: 'dice', seed: 2461318 })],
  'lipogramme-e': [step('lipogram')],
  'lipogramme-permises': [step('lipogram', { letters: 'esarintulo', mode: 'allowed' })],
  'tautogramme-p': [step('tautogram', { letters: 'p' })],
  'bord': [step('edge')],
  'mise-en-vers': [step('lineation')],
  's7-puis-lipogramme': [step('s7'), step('lipogram')],
  'rn': [step('rn')],
  'monorime': [step('monorhyme')],
  'schema-de-rimes': [step('rhyme-scheme')],
  'antirime': [step('antirhyme')],
  'anterime': [step('anterhyme')],
  'berrychonne': [step('berrychonne')],
  'homophonie': [step('homophony')],
};

export interface GoldenRun {
  text: string;
  chain: string;
  result: string;
  /** Ce que la chaîne a fait de chaque mot touché : « 3 remplacé », « 5 retiré », « 7 laissé : raison ». */
  marks: string[];
}

export async function loadResources(): Promise<Required<PluginResources>> {
  const data = (file: string) => fileTextSource(new URL(`../../data/${file}`, import.meta.url));
  const [morphology, verbs, phonetics] = await Promise.all([loadMorphology(data('morpho-oulipao.tsv')), loadVerbs(data('verbes-oulipao.tsv')), loadPhonetics(data('phonetique-oulipao.tsv'))]);
  return { morphology, verbs, phonetics };
}

export const references = () => {
  const directory = new URL('../../reference/', import.meta.url);
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => ({ file, reference: ReferenceTextSchema.parse(JSON.parse(readFileSync(new URL(file, directory), 'utf8'))) }));
};

/** Applique une chaîne du banc à un texte de référence. */
export function runGolden(chain: string, reference: ReturnType<typeof references>[number]['reference'], resources: PluginResources) {
  const steps = GOLDEN_CHAINS[chain]!.map((s, k) => ({ ...s, id: `${s.plugin.id}-${k + 1}` }));
  return runChain(reference.text, reference.words, steps, resources);
}

export function goldenRuns(resources: PluginResources): GoldenRun[] {
  const runs: GoldenRun[] = [];
  for (const { file, reference } of references()) {
    for (const chain of Object.keys(GOLDEN_CHAINS)) {
      const result = runGolden(chain, reference, resources);
      const text = result.words.map((word) => word.gap + word.output).join('') + result.tail;
      const marks = [...result.marks.values()]
        .sort((a, b) => a.index - b.index)
        .map((mark) => `${mark.index} ${mark.removed ? 'retiré' : mark.replacement !== undefined ? 'remplacé' : mark.relaid ? 'remis en ligne' : `laissé : ${mark.reason}`}`);
      runs.push({ text: file, chain, result: text, marks });
    }
  }
  return runs;
}

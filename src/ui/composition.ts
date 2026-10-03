// Câblage commun aux pages : quels adaptateurs servent les ports. Le script assemblé est servi
// depuis dist/ : les données sont un cran au-dessus.
import { loadMorphology } from '../adapters/morphology/in-memory-morphology.ts';
import { createCamembertClassifier } from '../adapters/taggers/camembert-model.ts';
import { CamembertTagger } from '../adapters/taggers/camembert-tagger.ts';
import { FrCompromiseTagger } from '../adapters/taggers/fr-compromise-tagger.ts';
import { LexiconLookupTagger } from '../adapters/taggers/lexicon-lookup-tagger.ts';
import { fetchTextSource } from '../adapters/text-sources/fetch-text-source.ts';
import type { MorphologyRepository } from '../ports/morphology.ts';
import type { Tagger } from '../ports/tagger.ts';

/** L'étiqueteur neuronal, le seul qui tienne le seuil de l'essai technique, et le préchargement de son modèle. */
export function createNeuralTagging(): { tagger: Tagger; preload: (onProgress: (loaded: number, total: number) => void) => Promise<void> } {
  const classifier = createCamembertClassifier();
  return { tagger: new CamembertTagger(classifier), preload: (onProgress) => classifier.load(onProgress) };
}

export const createNeuralTagger = (): Tagger => createNeuralTagging().tagger;

/** Les trois étiqueteurs de l'essai, pour la page qui les compare. */
export function createTaggers(base: string | URL): Tagger[] {
  return [
    createNeuralTagger(),
    new FrCompromiseTagger(),
    new LexiconLookupTagger(fetchTextSource(new URL('../data/lexique-potao.tsv', base))),
  ];
}

/**
 * Version du dictionnaire dérivé, ajoutée à son adresse : un navigateur qui en garde une copie
 * plus ancienne en cache va chercher la nouvelle. À changer à chaque `npm run build:morphology`.
 */
export const MORPHOLOGY_VERSION = '2026-10-03-adverbes';

/** Le dictionnaire des contraintes, chargé à la première demande seulement ; un échec n'est pas gardé. */
export function createMorphologyLoader(base: string | URL): () => Promise<MorphologyRepository> {
  let morphology: Promise<MorphologyRepository> | undefined;
  return () =>
    (morphology ??= loadMorphology(fetchTextSource(new URL(`../data/morpho-potao.tsv?v=${MORPHOLOGY_VERSION}`, base))).catch((error: unknown) => {
      morphology = undefined;
      throw error;
    }));
}

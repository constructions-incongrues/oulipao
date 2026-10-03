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

/** L'étiqueteur neuronal, le seul qui tienne le seuil de l'essai technique. */
export const createNeuralTagger = (): Tagger => new CamembertTagger(createCamembertClassifier());

/** Les trois étiqueteurs de l'essai, pour la page qui les compare. */
export function createTaggers(base: string | URL): Tagger[] {
  return [
    createNeuralTagger(),
    new FrCompromiseTagger(),
    new LexiconLookupTagger(fetchTextSource(new URL('../data/lexique-potao.tsv', base))),
  ];
}

/** Le dictionnaire du S+7, chargé à la première demande seulement. */
export function createMorphologyLoader(base: string | URL): () => Promise<MorphologyRepository> {
  let morphology: Promise<MorphologyRepository> | undefined;
  return () => (morphology ??= loadMorphology(fetchTextSource(new URL('../data/morpho-potao.tsv', base))));
}

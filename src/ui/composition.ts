// Câblage commun aux pages : quels adaptateurs servent les ports. Le script assemblé est servi
// depuis dist/ : les données sont un cran au-dessus.
import { loadMorphology } from '../adapters/morphology/in-memory-morphology.ts';
import { loadPhonetics } from '../adapters/morphology/in-memory-phonetics.ts';
import { loadScales } from '../adapters/morphology/in-memory-scales.ts';
import { loadVerbs } from '../adapters/morphology/in-memory-verbs.ts';
import { createCamembertClassifier } from '../adapters/taggers/camembert-model.ts';
import { CamembertTagger } from '../adapters/taggers/camembert-tagger.ts';
import { FrCompromiseTagger } from '../adapters/taggers/fr-compromise-tagger.ts';
import { LexiconLookupTagger } from '../adapters/taggers/lexicon-lookup-tagger.ts';
import { fetchTextSource } from '../adapters/text-sources/fetch-text-source.ts';
import type { MorphologyRepository } from '../ports/morphology.ts';
import type { PhoneticsRepository } from '../ports/phonetics.ts';
import type { ScaleRepository } from '../ports/scales.ts';
import type { Tagger } from '../ports/tagger.ts';
import type { VerbRepository } from '../ports/verbs.ts';

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
    new LexiconLookupTagger(fetchTextSource(new URL('../data/lexique-oulipao.tsv', base))),
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
    (morphology ??= loadMorphology(fetchTextSource(new URL(`../data/morpho-oulipao.tsv?v=${MORPHOLOGY_VERSION}`, base))).catch((error: unknown) => {
      morphology = undefined;
      throw error;
    }));
}

/** Version du fichier des verbes, ajoutée à son adresse. À changer à chaque `npm run build:verbs`. */
export const VERBS_VERSION = '2026-10-03-verbes';

/** Les verbes, chargés seulement quand une contrainte les vise ; un échec n'est pas gardé. */
export function createVerbsLoader(base: string | URL): () => Promise<VerbRepository> {
  let verbs: Promise<VerbRepository> | undefined;
  return () =>
    (verbs ??= loadVerbs(fetchTextSource(new URL(`../data/verbes-oulipao.tsv?v=${VERBS_VERSION}`, base))).catch((error: unknown) => {
      verbs = undefined;
      throw error;
    }));
}

/** Version du fichier des prononciations, ajoutée à son adresse. À changer à chaque `npm run build:phonetics`. */
export const PHONETICS_VERSION = '2026-10-03-index-des-rimes';

/** Les prononciations, chargées seulement quand un filtre phonétique est dans la chaîne ; un échec n'est pas gardé. */
export function createPhoneticsLoader(base: string | URL): () => Promise<PhoneticsRepository> {
  let phonetics: Promise<PhoneticsRepository> | undefined;
  return () =>
    (phonetics ??= loadPhonetics(fetchTextSource(new URL(`../data/phonetique-oulipao.tsv?v=${PHONETICS_VERSION}`, base))).catch((error: unknown) => {
      phonetics = undefined;
      throw error;
    }));
}

/** Version du fichier des échelles, ajoutée à son adresse. À changer à chaque `npm run build:scales`. */
export const SCALES_VERSION = '2026-10-04-v-n';

/** Les échelles affectives, chargées seulement quand un S+n prend un autre ordre que le dictionnaire ; un échec n'est pas gardé. */
export function createScalesLoader(base: string | URL): () => Promise<ScaleRepository> {
  let scales: Promise<ScaleRepository> | undefined;
  return () =>
    (scales ??= loadScales(fetchTextSource(new URL(`../data/echelles-oulipao.tsv?v=${SCALES_VERSION}`, base))).catch((error: unknown) => {
      scales = undefined;
      throw error;
    }));
}

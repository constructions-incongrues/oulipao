import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories, mixText, plainWords } from '../../domain/mixing.ts';
import { applyS7 } from '../../domain/s7/engine.ts';
import type { TaggedWord } from '../../domain/tagged-word.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import { layoutScore } from './score-layout.ts';
import type { MixerState, ScoreLayout } from './types.ts';

/** Un texte collé et étiqueté : on ne l'étiquette qu'une fois, puis chaque geste rejoue la suite. */
export interface Session {
  text: string;
  tagged: TaggedWord[];
}

/** Ce que la page affiche pour un texte et un état de la table. */
export interface TracksView {
  layout: ScoreLayout;
  /** Le texte résultant : contrainte appliquée, puis pistes coupées. */
  result: string;
  /** Nombre de mots par piste. */
  counts: Record<Category, number>;
  /** Noms remplacés par le plugin, sur le nombre de noms. */
  replaced: number;
  nouns: number;
}

/** Rejoue la chaîne moteur → mixage → disposition, sans réétiqueter. */
export function buildView(session: Session, mixer: MixerState, morphology: MorphologyRepository, width?: number): TracksView {
  const { text, tagged } = session;
  const labels = new Map<number, string>();
  let words;
  let tail;
  let replaced = 0;
  if (mixer.plugin.enabled) {
    const s7 = applyS7(text, tagged, { offset: mixer.plugin.offset, mode: mixer.plugin.mode }, morphology);
    ({ words, tail } = s7);
    for (const substitution of s7.substitutions) {
      if (substitution.status !== 'replaced') continue;
      labels.set(substitution.index, substitution.replacement);
      replaced++;
    }
  } else {
    ({ words, tail } = plainWords(text));
  }
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category, tagged.filter((word) => word.category === category).length]),
  ) as Record<Category, number>;
  return {
    layout: layoutScore(text, tagged, labels, width),
    result: mixText(words, tagged, audibleCategories(mixer.tracks), tail),
    counts,
    replaced,
    nouns: counts.noun,
  };
}

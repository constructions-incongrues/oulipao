import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { ScaleRepository } from '../../ports/scales.ts';
import type { ScaleOrder } from './types.ts';

/**
 * Le dictionnaire du S+n rangé par une échelle : les noms et les adjectifs sont ceux de l'échelle, de
 * la note la plus basse à la plus haute ; tout le reste vient du dictionnaire. Un mot sans note n'est
 * donc pas dans la liste, et le S+n le laisse comme un mot inconnu.
 */
export function rankedMorphology(morphology: MorphologyRepository, scales: ScaleRepository, order: ScaleOrder): MorphologyRepository {
  // La même liste à chaque appel : le S+n garde en cache la position des lemmes, par liste.
  const nouns = scales.scale(order, 'noun');
  const adjectives = scales.scale(order, 'adjective');
  return {
    nounLemmas: () => nouns,
    nounReadings: (form) => morphology.nounReadings(form),
    nounForms: (lemma) => morphology.nounForms(lemma),
    adjectiveReadings: (form) => morphology.adjectiveReadings(form),
    adjectiveForms: (paradigm) => morphology.adjectiveForms(paradigm),
    adjectiveParadigms: () => adjectives,
    adverbs: () => morphology.adverbs(),
    blocksElision: (form) => morphology.blocksElision(form),
  };
}

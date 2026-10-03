import type { AdjectiveForm, NounForm } from '../domain/s7/types.ts';

/**
 * Port : la morphologie dont le moteur S+7 a besoin. C'est aussi le « dictionnaire » de la
 * contrainte : changer d'implémentation, c'est changer de textbank.
 */
export interface MorphologyRepository {
  /** Lemmes des noms, dans l'ordre du dictionnaire. */
  nounLemmas(): readonly string[];
  /** Lectures d'une forme comme nom (plusieurs si homographes). */
  nounReadings(form: string): readonly NounForm[];
  /** Toutes les formes d'un lemme de nom. */
  nounForms(lemma: string): readonly NounForm[];
  /** Lectures d'une forme comme adjectif ou participe adjectivé. */
  adjectiveReadings(form: string): readonly AdjectiveForm[];
  /** Toutes les formes d'un adjectif. */
  adjectiveForms(paradigm: string): readonly AdjectiveForm[];
  /** Le mot interdit-il l'élision malgré son initiale (h aspiré, « onze », « yaourt ») ? */
  blocksElision(form: string): boolean;
}

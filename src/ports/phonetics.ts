import type { Category } from '../domain/categories.ts';
import type { PhoneticReading } from '../domain/phonetics/phoneme.ts';

/**
 * Port : ce qu'un mot fait entendre, chargé à part et seulement quand un filtre phonétique est
 * dans la chaîne. La rime et le compte des syllabes se calculent dans le domaine.
 */
export interface PhoneticsRepository {
  /** Les prononciations d'une forme dans une catégorie, la plus courante d'abord ; toutes catégories sans elle. */
  readings(form: string, category?: Category): readonly PhoneticReading[];
  /** Les formes d'une catégorie qui se prononcent exactement ainsi (phonèmes sans les points), dans l'ordre du dictionnaire. */
  homophones(phonemes: string, category: Category): readonly string[];
  /**
   * Les formes d'une catégorie dont la prononciation a cette rime, devinées comprises : toutes les
   * candidates d'un filtre de rime, sans parcourir le dictionnaire.
   */
  rhyming(rhyme: string, category: Category): readonly string[];
}

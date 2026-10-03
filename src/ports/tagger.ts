import type { TaggedWord } from '../domain/tagged-word.ts';

/**
 * Port : un étiqueteur rend un mot étiqueté par mot de `tokenize(text)`, dans le même ordre.
 * Le contrat est vérifié par `tagText` (domaine), pas par l'adaptateur.
 */
export interface Tagger {
  readonly name: string;
  tag(text: string): Promise<TaggedWord[]> | TaggedWord[];
}

// Déclaration minimale de fr-compromise 0.3.1 : seulement ce qu'Oulipao utilise.
export interface FrCompromiseTerm {
  text: string;
  tags: string[];
  offset: { index: number; start: number; length: number };
}
export interface FrCompromiseSentence {
  terms: FrCompromiseTerm[];
}
declare function nlp(text: string): { json(options: { offset: true }): FrCompromiseSentence[] };
export default nlp;

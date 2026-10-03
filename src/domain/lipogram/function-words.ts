import { z } from 'zod';
import { containsLetter } from './neighbour.ts';

/**
 * Pour chaque mot-outil courant, ses équivalents de même fonction, dans l'ordre de préférence.
 * Le lipogramme prend le premier qui ne contient pas la lettre interdite ; s'il n'y en a aucun,
 * le mot est retiré. Proposée par l'assistant, à valider par le fondateur.
 * ponytail: une table écrite à la main, sans genre ni nombre ; un « tu » ou un « je » sans
 * équivalent est retiré. À revoir si la relecture des textes de référence le demande.
 */
const TABLE: Record<string, string[]> = {
  // Articles et déterminants
  le: ['un', 'ce', 'mon', 'son', 'ton', 'tout', 'chaque'],
  la: ['une', 'cette', 'ma', 'sa', 'ta', 'toute'],
  les: ['des', 'ces', 'mes', 'ses', 'tes', 'nos', 'vos', 'tous'],
  un: ['le', 'ce', 'mon', 'son', 'ton', 'tout'],
  une: ['la', 'cette', 'ma', 'sa', 'ta', 'toute'],
  des: ['les', 'ces', 'mes', 'ses', 'nos', 'vos'],
  du: ['au'],
  au: ['du'],
  aux: ['des', 'nos'],
  ce: ['un', 'ça', 'mon', 'son'],
  cet: ['un', 'mon', 'son', 'ton'],
  cette: ['la', 'une', 'ma', 'sa', 'ta'],
  ces: ['les', 'des', 'mes', 'ses', 'nos', 'vos'],
  mon: ['ton', 'son', 'un', 'le'],
  ton: ['mon', 'son', 'un', 'le'],
  son: ['mon', 'ton', 'un', 'le'],
  ma: ['ta', 'sa', 'la', 'une'],
  ta: ['ma', 'sa', 'la', 'une'],
  sa: ['ma', 'ta', 'la', 'une'],
  mes: ['tes', 'ses', 'nos', 'vos', 'les', 'des'],
  tes: ['mes', 'ses', 'nos', 'vos', 'les', 'des'],
  ses: ['mes', 'tes', 'nos', 'vos', 'les', 'des'],
  notre: ['votre', 'mon', 'son', 'un'],
  votre: ['notre', 'ton', 'son', 'un'],
  nos: ['vos', 'mes', 'ses', 'les'],
  vos: ['nos', 'tes', 'ses', 'les'],
  leur: ['son', 'lui'],
  leurs: ['ses', 'nos', 'vos'],
  quelque: ['un', 'tout'],
  quelques: ['maints', 'nos', 'des'],
  chaque: ['tout', 'un'],
  tout: ['chaque', 'un'],
  toute: ['chaque', 'la'],
  tous: ['nos', 'vos', 'les'],
  toutes: ['nos', 'vos', 'tous', 'les'],
  aucun: ['nul', 'un'],
  aucune: ['nulle', 'nul', 'la'],
  // Prépositions
  de: ['à', 'par', 'pour'],
  à: ['de', 'pour', 'vers'],
  en: ['dans', 'à', 'sur'],
  dans: ['en', 'sur', 'sous', 'à'],
  pour: ['par', 'à'],
  par: ['pour', 'via'],
  sur: ['sous', 'dans'],
  sous: ['sur', 'dans'],
  avec: ['par', 'sans'],
  sans: ['avec', 'hors'],
  vers: ['à', 'pour', 'sur'],
  chez: ['à', 'par'],
  entre: ['parmi', 'dans'],
  parmi: ['entre', 'dans'],
  contre: ['sur', 'vers', 'à'],
  devant: ['avant', 'sur'],
  derrière: ['sous', 'dans'],
  depuis: ['dès', 'pour'],
  pendant: ['durant'],
  durant: ['pendant'],
  selon: ['d’après', 'pour'],
  // Conjonctions
  et: ['ou', 'puis', 'mais'],
  ou: ['et'],
  mais: ['or', 'et'],
  donc: ['ainsi', 'alors'],
  car: ['puisque', 'comme'],
  ni: ['ou', 'et'],
  que: ['quand', 'si', 'comme'],
  quand: ['lorsque', 'si'],
  lorsque: ['quand', 'si'],
  puisque: ['car', 'comme'],
  comme: ['quand', 'ainsi'],
  si: ['quand'],
  // Pronoms
  il: ['on', 'elle'],
  elle: ['on', 'il'],
  on: ['il', 'elle'],
  ils: ['elles'],
  elles: ['ils'],
  nous: ['on', 'vous'],
  vous: ['nous'],
  lui: ['leur'],
  qui: ['quoi'],
  quoi: ['qui'],
  dont: ['où'],
  où: ['dont'],
  cela: ['ça'],
  ça: ['cela'],
  je: [],
  tu: [],
  me: [],
  te: [],
  se: [],
  ne: [],
};

const TableSchema = z.record(z.string().min(1), z.array(z.string().min(1)));
const table = TableSchema.parse(TABLE);

/** Le mot est-il dans la table des mots-outils ? */
export const isFunctionWord = (word: string) => Object.hasOwn(table, word.toLowerCase());

/**
 * L'équivalent d'un mot-outil sans la lettre : le premier de la table qui ne la contient pas.
 * Rien si le mot n'est pas dans la table, ou si aucun équivalent ne convient.
 */
export function functionWordWithout(word: string, letter: string): string | undefined {
  return (table[word.toLowerCase()] ?? []).find((candidate) => !containsLetter(candidate, letter));
}

/** Les équivalents que la table donne pour la lettre « e » : sert à la relecture par le fondateur. */
export const tableFor = (letter: string) =>
  Object.keys(table)
    .filter((word) => containsLetter(word, letter))
    .map((word) => [word, functionWordWithout(word, letter) ?? '(retiré)'] as const);

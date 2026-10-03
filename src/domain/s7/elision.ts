import type { MorphologyRepository } from '../../ports/morphology.ts';
import { VARIABLE_FORMS, type Determiner } from './determiners.ts';
import type { ConcreteGender, ConcreteNumber } from './types.ts';

const VOWEL_OR_H = /^[aeiouyhàâäéèêëîïôöùûüœæ]/i;

/**
 * Le mot appelle-t-il l'élision du mot précédent ? Voyelle ou h muet, sauf interdiction du lexique :
 * la morphologie, les verbes, ou les deux à la fois.
 */
export function elides(word: string, lexicon: Pick<MorphologyRepository, 'blocksElision'>): boolean {
  if (!VOWEL_OR_H.test(word)) return false;
  return !lexicon.blocksElision(word) && !lexicon.blocksElision(word.toLowerCase());
}

export interface Realization {
  gender: ConcreteGender;
  /** Nombre du groupe ; utilisé quand la forme du déterminant ne le dit pas. */
  number: ConcreteNumber;
  /** Le mot qui suit le déterminant appelle-t-il l'élision ? */
  nextElides: boolean;
  /** Apostrophe à employer (droite ou typographique), pour suivre le texte d'origine. */
  apostrophe?: string;
}

/**
 * Forme écrite d'un déterminant devant un mot donné : genre, élision et contraction
 * (« le » / « l' », « du » / « de la » / « de l' », « au » / « à l' », « ce » / « cet », « ma » / « mon »).
 * Rend un ou deux mots ; un mot fini par une apostrophe se colle au suivant.
 */
export function realizeDeterminer(determiner: Determiner, realization: Realization): string[] {
  const { gender, nextElides, apostrophe = "'" } = realization;
  const plural = (determiner.number ?? realization.number) === 'p';
  const masculine = gender === 'm';
  const article = nextElides ? `l${apostrophe}` : masculine ? 'le' : 'la';
  switch (determiner.kind) {
    case 'definite':
      return [plural ? 'les' : article];
    case 'indefinite':
      return [plural ? 'des' : masculine ? 'un' : 'une'];
    case 'de-definite':
      if (plural) return ['des'];
      return !nextElides && masculine ? ['du'] : ['de', article];
    case 'a-definite':
      if (plural) return ['aux'];
      return !nextElides && masculine ? ['au'] : ['à', article];
    case 'demonstrative':
      if (plural) return ['ces'];
      return [masculine ? (nextElides ? 'cet' : 'ce') : 'cette'];
    case 'possessive': {
      const owner = determiner.owner ?? 's';
      if (plural) return [`${owner}es`];
      return [masculine || nextElides ? `${owner}on` : `${owner}a`];
    }
    case 'de':
      return [nextElides ? `d${apostrophe}` : 'de'];
    case 'variable':
      return [VARIABLE_FORMS[determiner.lemma!]![(plural ? 2 : 0) + (masculine ? 0 : 1)]!];
    case 'invariable':
      return [determiner.lemma!];
  }
}

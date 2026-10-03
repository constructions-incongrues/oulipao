import { isVowel, type Phoneme, type PhoneticReading } from './phoneme.ts';

// ponytail: une table de règles graphème→phonème, de la plus longue à la plus courte, qui suffit à
// donner une rime plausible à un mot que le lexique ignore, pas une prononciation exacte. Plafond :
// les exceptions (« femme », « second », « oignon ») ; passer à un modèle si les mots devinés gênent.

const LETTER = '[a-zàâäçéèêëîïôöùûüÿœæ]';
const VOWEL_LETTER = '[aeiouyàâäéèêëîïôöùûüÿœæ]';
/** Une nasale : « an », « on »… devant une consonne autre que n ou m, ou en fin de mot. */
const NASAL_END = `(?=[^aeiouyàâäéèêëîïôöùûüÿnmh]|$)`;

type Rule = [pattern: string, phonemes: Phoneme[]];

const RULES: Rule[] = [
  // Finales muettes ou propres à la fin du mot.
  ['eaux$', ['o']], ['aux$', ['o']], ['ent$', []], ['es$', []], ['er$', ['e']], ['ez$', ['e']], ['et$', ['ɛ']],
  // Le e final se tait après une autre voyelle (« table ») ; seul, il se dit (« de », « le »).
  [`(?<=${VOWEL_LETTER}.*)e$`, []], [`(?<=${LETTER})[stdxzp]$`, []],
  // Les finales mouillées : « œil », « soleil », « travail », « fauteuil », « grenouille ».
  ['(?:eu|ue|œ)ill?', ['œ', 'j']], ['eill?', ['ɛ', 'j']], ['aill?', ['a', 'j']], ['ouill', ['u', 'j']],
  // Voyelles composées et nasales.
  ['eau', ['o']], [`oin${NASAL_END}`, ['w', 'ɛ̃']], ['oi', ['w', 'a']], ['œu', ['ø']], ['eu', ['ø']], ['ou', ['u']], ['au', ['o']],
  [`ien${NASAL_END}`, ['j', 'ɛ̃']], [`[ae]in${NASAL_END}`, ['ɛ̃']], ['ai', ['ɛ']], ['ei', ['ɛ']],
  [`[ae][nm]${NASAL_END}`, ['ɑ̃']], [`o[nm]${NASAL_END}`, ['ɔ̃']], [`[iy][nm]${NASAL_END}`, ['ɛ̃']], [`u[nm]${NASAL_END}`, ['œ̃']],
  // Consonnes composées.
  ['ch', ['ʃ']], ['ph', ['f']], ['gn', ['ɲ']], ['qu', ['k']], ['gu(?=[eiy])', ['g']], ['ge(?=[aou])', ['ʒ']],
  ['c(?=[eiyéèê])', ['s']], ['g(?=[eiyéèê])', ['ʒ']], [`(?<=${VOWEL_LETTER})s(?=${VOWEL_LETTER})`, ['z']],
  ['ss', ['s']], ['ll', ['l']], ['tt', ['t']], ['nn', ['n']], ['mm', ['m']], ['rr', ['ʁ']], ['pp', ['p']], ['ff', ['f']], ['cc', ['k']],
  // Voyelles simples.
  ['[éë]', ['e']], ['[èê]', ['ɛ']], [`e(?=[^aeiouy]{2})`, ['ɛ']], ['e', ['ə']], ['[aàâä]', ['a']], ['[iîïy]', ['i']],
  ['[oôö]', ['ɔ']], ['[uûùü]', ['y']], ['œ', ['ø']], ['æ', ['e']],
  // Consonnes simples.
  ['ç', ['s']], ['c', ['k']], ['h', []], ['j', ['ʒ']], ['r', ['ʁ']], ['x', ['k', 's']], ['w', ['w']], ['q', ['k']],
  ['b', ['b']], ['d', ['d']], ['f', ['f']], ['g', ['g']], ['k', ['k']], ['l', ['l']], ['m', ['m']], ['n', ['n']],
  ['p', ['p']], ['s', ['s']], ['t', ['t']], ['v', ['v']], ['z', ['z']],
];
const COMPILED = RULES.map(([pattern, phonemes]) => [new RegExp(pattern, 'y'), phonemes] as const);

/** Découpe en syllabes : une syllabe par voyelle, les consonnes qui la précèdent avec elle. */
function syllabify(phonemes: readonly Phoneme[]): Phoneme[][] {
  const syllables: Phoneme[][] = [];
  let current: Phoneme[] = [];
  for (const phoneme of phonemes) {
    current.push(phoneme);
    if (isVowel(phoneme)) {
      syllables.push(current);
      current = [];
    }
  }
  if (current.length) {
    if (syllables.length) syllables.at(-1)!.push(...current);
    else syllables.push(current);
  }
  return syllables;
}

/** Les phonèmes d'un mot simple, règle après règle. */
function guessPhonemes(lower: string): Phoneme[] {
  const phonemes: Phoneme[] = [];
  for (let at = 0; at < lower.length; ) {
    const rule = COMPILED.find(([pattern]) => {
      pattern.lastIndex = at;
      return pattern.test(lower);
    });
    if (!rule) {
      at++; // une lettre étrangère à la table ne se prononce pas
      continue;
    }
    phonemes.push(...rule[1]);
    at = rule[0].lastIndex;
  }
  return phonemes;
}

/**
 * Devine la prononciation d'un mot par des règles, partie par partie pour un mot composé
 * (« œil-de-chat ») ; `undefined` s'il n'en reste rien (« h »).
 */
export function guessReading(word: string): PhoneticReading | undefined {
  const phonemes = word.toLowerCase().replace(/['’]/g, '').split('-').flatMap(guessPhonemes);
  return phonemes.length ? { syllables: syllabify(phonemes), guessed: true } : undefined;
}

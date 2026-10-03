import { z } from 'zod';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { matchCase, removeWord } from '../removal.ts';
import { keepNoun, rewriteNouns } from '../s7/engine.ts';
import { elides } from '../s7/elision.ts';
import type { OutputWord } from '../s7/types.ts';
import type { TaggedWord } from '../tagged-word.ts';
import { tokenize } from '../tokenizer.ts';
import { CATEGORIES } from '../categories.ts';
import { elide, lettersOf } from '../letters.ts';
import { neighbourVerb, rewriteVerbs } from '../verb.ts';
import { functionWordWithout } from './function-words.ts';
import { containsLetter, neighbourAdjective, neighbourAdverb, neighbourNoun } from './neighbour.ts';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const MAX_LETTERS = 40;

const ModeSchema = z.enum(['forbidden', 'allowed']);
type Mode = z.infer<typeof ModeSchema>;

const ParamsSchema = z.object({
  letters: z.string().max(MAX_LETTERS).default('e'),
  mode: ModeSchema.default('forbidden'),
  /** Les lettres bannies par les lipogrammes placés avant dans la chaîne (voir `inherit`). */
  banned: z.string().regex(/^[a-z]*$/).optional(),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** Les lettres saisies, nues, sans doublon, dans l'ordre de la saisie. */
const typed = (letters: string) => [...new Set(lettersOf(letters))];

/** Les lettres bannies : celles qu'on a tapées, ou toutes les autres (rien si rien n'est tapé). */
export function bannedLetters(letters: string, mode: Mode): string {
  const own = typed(letters);
  if (mode === 'forbidden' || own.length === 0) return own.join('');
  return [...ALPHABET].filter((letter) => !own.includes(letter)).join('');
}

/** « en a, e », « seulement en l, u, c, i, e » ; rien si aucune lettre n'est saisie. */
function naming(values: ParameterValues): string | undefined {
  const { letters, mode } = params(values);
  const own = typed(letters);
  if (!own.length) return undefined;
  return `${mode === 'allowed' ? 'seulement en' : 'en'} ${own.join(', ')}`;
}


const NO_NEIGHBOUR = 'aucun voisin sans la lettre';


/** Un mot de la sortie, une fois passé au lipogramme : remplacé, retiré, ou laissé et pourquoi. */
type Fate = { replacement: string } | { removed: true } | { reason: string };

/** Ce que devient un mot qui contient la lettre, selon sa piste (les verbes ont leur propre passe). */
function fateOf(output: string, category: Exclude<TaggedWord['category'], 'verb'>, letter: string, morphology: MorphologyRepository): Fate {
  switch (category) {
    case 'noun':
      // Les noms ont été remplacés avant, avec leur groupe ; il reste ceux qui n'ont pas de voisin.
      return { reason: NO_NEIGHBOUR };
    case 'adjective': {
      const reading = morphology.adjectiveReadings(output.toLowerCase())[0];
      const gender = reading && reading.gender !== 'e' ? reading.gender : undefined;
      const number = reading && reading.number !== 'i' ? reading.number : undefined;
      const neighbour = neighbourAdjective(output, { gender, number }, letter, morphology);
      return neighbour ? { replacement: matchCase(output, neighbour.form) } : { reason: NO_NEIGHBOUR };
    }
    case 'adverb': {
      const neighbour = neighbourAdverb(output, letter, morphology);
      return neighbour ? { replacement: matchCase(output, neighbour) } : { reason: NO_NEIGHBOUR };
    }
    case 'other': {
      // Une sortie de deux mots-outils (« de la ») se traite mot par mot.
      const parts = output.split(' ').flatMap((part) => {
        if (!containsLetter(part, letter)) return [part];
        const equivalent = functionWordWithout(part, letter);
        return equivalent ? [matchCase(part, equivalent)] : [];
      });
      return parts.length ? { replacement: parts.join(' ') } : { removed: true };
    }
  }
}

/**
 * Le lipogramme : chaque mot qui contient la lettre interdite devient le premier mot qui le suit
 * dans le dictionnaire, de même catégorie et de mêmes traits, sans la lettre. Les noms passent par
 * la réécriture du S+7 (déterminants et adjectifs réaccordés) ; les mots-outils par une table
 * d'équivalents, ou sont retirés ; les verbes gardent leur temps et leur personne. Seuls les mots des pistes
 * visées sont touchés.
 */
export const lipogramPlugin = definePlugin({
  id: 'lipogram',
  name: 'Lipogramme',
  tracks: [...CATEGORIES],
  defaultTargets: [...CATEGORIES],
  parameters: [
    { kind: 'text', key: 'letters', label: 'Lettres', maxLength: MAX_LETTERS, placeholder: 'e' },
    { kind: 'choice', key: 'mode', label: 'Mode', options: [{ value: 'forbidden', label: 'interdites' }, { value: 'allowed', label: 'permises' }] },
  ],
  defaults: ParamsSchema.parse({}),
  parse: params,
  inherit: (values, earlier) => ({
    ...values,
    banned: earlier.map((previous) => { const { letters, mode } = params(previous); return bannedLetters(letters, mode); }).join(''),
  }),
  acts: (values) => naming(values) !== undefined,
  title: (values) => { const name = naming(values); return name ? `Lipogramme ${name}` : 'Lipogramme'; },
  label: (values) => { const name = naming(values); return name ? `lipogramme ${name}` : 'lipogramme sans lettre'; },
  help: (values) => {
    const { letters, mode } = params(values);
    const own = typed(letters);
    const tail = 'les verbes gardent leur temps et leur personne, « être » et « avoir » restent.';
    if (!own.length) return 'Aucune lettre saisie : le lipogramme ne change rien.';
    const list = own.map((letter) => `« ${letter} »`).join(', ');
    return mode === 'allowed'
      ? `Chaque mot qui emploie une autre lettre que ${list} devient le premier mot qui le suit dans le dictionnaire sans autre lettre ; ${tail}`
      : `Chaque mot qui contient ${list} devient le premier mot qui le suit dans le dictionnaire sans ${own.length > 1 ? 'ces lettres' : 'cette lettre'} ; ${tail}`;
  },
  apply(text, tagged, values, { morphology, verbs }, targets, scope = FULL_SCOPE) {
    const { letters, mode, banned = '' } = params(values);
    // Les lettres de l'instance et celles des lipogrammes d'avant : aucune ne doit revenir.
    const letter = bannedLetters(letters, mode) + banned;
    const skip = new Set(scope.skip);
    const tokens = tokenize(text);
    const apostrophe = text.includes('’') ? '’' : "'";

    // 1. Les noms, avec leur groupe : déterminant, adjectifs, attribut, pronom de reprise.
    const nouns = rewriteNouns(
      text,
      tagged,
      // Un nom sans la lettre n'est pas touché : la réécriture laisse son groupe tel quel.
      (word, hints, index) =>
        targets.has('noun') && !skip.has(index) && containsLetter(word, letter) ? neighbourNoun(word, hints, letter, morphology) : keepNoun(word),
      morphology,
    );
    const words = nouns.words.map((word) => ({ ...word }));
    let tail = nouns.tail;
    const marks: WordMark[] = [];
    for (const substitution of nouns.substitutions) {
      if (substitution.status === 'replaced') marks.push({ index: substitution.index, original: substitution.original, replacement: words[substitution.index]!.output });
    }

    // 2. Les autres mots qui contiennent encore la lettre, piste par piste.
    const touched = new Set(marks.map((mark) => mark.index));
    words.forEach((word, index) => {
      // Seulement les pistes visées ; le réaccord d'un nom remplacé reste la seule exception.
      const category = tagged[index]!.category;
      if (category === 'verb' || touched.has(index) || skip.has(index) || !targets.has(category) || !containsLetter(word.output, letter)) return;
      const original = tokens[index]!.word;
      const fate = fateOf(word.output, category, letter, morphology);
      if ('replacement' in fate) {
        word.output = fate.replacement;
        marks.push({ index, original, replacement: fate.replacement });
      } else if ('removed' in fate) {
        // Son blanc passe au mot suivant ; en tête de phrase, sa majuscule aussi.
        tail = removeWord(words, index, tail);
        marks.push({ index, original, removed: true });
      } else {
        marks.push({ index, original, reason: fate.reason });
      }
    });

    // 3. Les verbes, au même temps et à la même personne ; le pronom élidé suit le verbe nouveau.
    if (targets.has('verb')) {
      marks.push(
        ...rewriteVerbs(
          words,
          tagged,
          (index) => !skip.has(index) && containsLetter(words[index]!.output, letter),
          (word, previous, repository) => neighbourVerb(word, previous, letter, repository),
          verbs,
          apostrophe,
          (word) => elides(word, { blocksElision: (form) => !!verbs?.blocksElision(form) || morphology.blocksElision(form) }),
        ),
      );
    }

    // 4. Élision des articles remplacés devant une voyelle : « une horloge » → « l’horloge ».
    for (const mark of marks) if (mark.replacement !== undefined) elide(words, mark.index, apostrophe, morphology);
    for (const mark of marks) if (mark.replacement !== undefined) mark.replacement = words[mark.index]!.output;

    return { words, tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

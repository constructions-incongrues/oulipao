import { z } from 'zod';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import { definePlugin, type ParameterValues, type WordMark } from '../plugin.ts';
import { rewriteNouns } from '../s7/engine.ts';
import { elides } from '../s7/elision.ts';
import type { NounChoice } from '../s7/substitution.ts';
import type { OutputWord } from '../s7/types.ts';
import type { TaggedWord } from '../tagged-word.ts';
import { tokenize } from '../tokenizer.ts';
import { functionWordWithout } from './function-words.ts';
import { containsLetter, neighbourAdjective, neighbourAdverb, neighbourNoun } from './neighbour.ts';

const LETTERS = [...'abcdefghijklmnopqrstuvwxyz'];

const ParamsSchema = z.object({ letter: z.enum(LETTERS as [string, ...string[]]).default('e') });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
const matchCase = (original: string, replacement: string) =>
  original[0] !== original[0]!.toLowerCase() ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;

const NO_NEIGHBOUR = 'aucun voisin sans la lettre';

/** Un nom laissé tel quel par la réécriture des noms. */
const untouched = (word: string): NounChoice => ({ status: 'unknown-noun', replacement: word.toLowerCase(), gender: 'm', number: 's', originalGender: 'm' });

/** Un mot de la sortie, une fois passé au lipogramme : remplacé, retiré, ou laissé et pourquoi. */
type Fate = { replacement: string } | { removed: true } | { reason: string };

/** Ce que devient un mot qui contient la lettre, selon sa piste. */
function fateOf(output: string, category: TaggedWord['category'], letter: string, morphology: MorphologyRepository): Fate {
  switch (category) {
    case 'noun':
      // Les noms ont été remplacés avant, avec leur groupe ; il reste ceux qui n'ont pas de voisin.
      return { reason: NO_NEIGHBOUR };
    case 'verb':
      return { reason: 'verbe, laissé en v1' };
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

/** « le », « la » devant une voyelle ou un h muet : « l’ », collé au mot suivant. */
function elide(words: OutputWord[], index: number, apostrophe: string, morphology: MorphologyRepository) {
  const word = words[index]!;
  // Seulement devant le mot qui suit immédiatement : s'il a été retiré, l'article reste tel quel.
  const next = words[index + 1];
  if (!next?.output || !/^(le|la)$/i.test(word.output) || !elides(next.output, morphology)) return;
  word.output = `${word.output[0]}${apostrophe}`;
  next.gap = '';
}

/**
 * Le lipogramme : chaque mot qui contient la lettre interdite devient le premier mot qui le suit
 * dans le dictionnaire, de même catégorie et de mêmes traits, sans la lettre. Les noms passent par
 * la réécriture du S+7 (déterminants et adjectifs réaccordés) ; les mots-outils par une table
 * d'équivalents, ou sont retirés ; les verbes restent tels quels en v1.
 */
export const lipogramPlugin = definePlugin({
  id: 'lipogram',
  name: 'Lipogramme',
  track: 'all',
  parameters: [{ kind: 'choice', key: 'letter', label: 'Lettre', options: LETTERS.map((letter) => ({ value: letter, label: letter })) }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: (values) => `Lipogramme en ${params(values).letter}`,
  label: (values) => `lipogramme en ${params(values).letter}`,
  help: (values) => {
    const { letter } = params(values);
    return `Chaque mot qui contient « ${letter} » devient le premier mot qui le suit dans le dictionnaire sans cette lettre ; les verbes restent tels quels.`;
  },
  apply(text, tagged, values, { morphology }) {
    const { letter } = params(values);
    const tokens = tokenize(text);
    const apostrophe = text.includes('’') ? '’' : "'";

    // 1. Les noms, avec leur groupe : déterminant, adjectifs, attribut, pronom de reprise.
    const nouns = rewriteNouns(
      text,
      tagged,
      // Un nom sans la lettre n'est pas touché : la réécriture laisse son groupe tel quel.
      (word, hints) => (containsLetter(word, letter) ? neighbourNoun(word, hints, letter, morphology) : untouched(word)),
      morphology,
    );
    const words = nouns.words.map((word) => ({ ...word }));
    const marks: WordMark[] = [];
    for (const substitution of nouns.substitutions) {
      if (substitution.status === 'replaced') marks.push({ index: substitution.index, original: substitution.original, replacement: words[substitution.index]!.output });
    }

    // 2. Les autres mots qui contiennent encore la lettre, piste par piste.
    const touched = new Set(marks.map((mark) => mark.index));
    words.forEach((word, index) => {
      if (touched.has(index) || !containsLetter(word.output, letter)) return;
      const original = tokens[index]!.word;
      const fate = fateOf(word.output, tagged[index]!.category, letter, morphology);
      if ('replacement' in fate) {
        word.output = fate.replacement;
        marks.push({ index, original, replacement: fate.replacement });
      } else if ('removed' in fate) {
        // Un mot retiré en tête de phrase lègue sa majuscule au suivant.
        const next = words[index + 1];
        if (next && word.output[0] !== word.output[0]!.toLowerCase()) next.output = matchCase(word.output, next.output);
        word.output = '';
        word.gap = '';
        marks.push({ index, original, removed: true });
      } else {
        marks.push({ index, original, reason: fate.reason });
      }
    });

    // 3. Élision des articles remplacés devant une voyelle : « une horloge » → « l’horloge ».
    for (const mark of marks) if (mark.replacement !== undefined) elide(words, mark.index, apostrophe, morphology);
    for (const mark of marks) if (mark.replacement !== undefined) mark.replacement = words[mark.index]!.output;

    return { words, tail: nouns.tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

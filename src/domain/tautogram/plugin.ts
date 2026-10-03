import { z } from 'zod';
import { bare, elide, lettersOf } from '../letters.ts';
import { nthAdjective, nthAdverb, nthNoun } from '../neighbours.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { matchCase } from '../removal.ts';
import { elides } from '../s7/elision.ts';
import { keepNoun, rewriteNouns } from '../s7/engine.ts';
import { tokenize } from '../tokenizer.ts';
import { nthVerb, rewriteVerbs } from '../verb.ts';
import { assignLetters } from './cycle.ts';

const MAX_LETTERS = 40;

const ParamsSchema = z.object({ letters: z.string().max(MAX_LETTERS).default('oulipo') });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** La forme commence-t-elle par la lettre ? « é » compte pour « e ». */
const startsWith = (letter: string) => (form: string) => bare(form).startsWith(letter);
const noNeighbour = (letter: string) => `aucun voisin à l'initiale ${letter}`;
/** D'où partir dans le dictionnaire : le mot à l'initiale changée (« maison » vers « p » : « paison »). */
const swapInitial = (letter: string) => (entry: string) => letter + entry.slice(1);

/** Les lettres telles que tapées, pour le titre et la mention ; rien si aucune lettre ne compte. */
const shown = (values: ParameterValues) => {
  const { letters } = params(values);
  return lettersOf(letters) ? letters.trim() : undefined;
};

/**
 * Le tautogramme progressif : les mots des pistes visées prennent tour à tour les lettres d'une
 * liste, en boucle. Chacun devient le premier mot du dictionnaire, de même catégorie et de mêmes
 * traits, qui commence par sa lettre en partant du mot à l'initiale changée : « maison » vers
 * « p » part de « paison ». Partir du mot lui-même donnerait toujours le premier mot de la lettre. Les mots-outils ne comptent pas. Les
 * noms passent par la réécriture du S+7 (groupe réaccordé) ; les verbes gardent leur temps et leur
 * personne, « être » et « avoir » restent.
 */
export const tautogramPlugin = definePlugin({
  id: 'tautogram',
  name: 'Tautogramme progressif',
  tracks: ['noun', 'adjective', 'verb', 'adverb'],
  defaultTargets: ['noun', 'adjective', 'verb', 'adverb'],
  parameters: [{ kind: 'text', key: 'letters', label: 'Lettres', maxLength: MAX_LETTERS, placeholder: 'oulipo' }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: (values) => shown(values) !== undefined,
  title: (values) => { const letters = shown(values); return letters ? `Tautogramme progressif en ${letters}` : 'Tautogramme progressif'; },
  label: (values) => { const letters = shown(values); return letters ? `tautogramme progressif en ${letters}` : 'tautogramme progressif sans lettre'; },
  help(values) {
    const letters = shown(values);
    if (!letters) return 'Aucune lettre saisie : le tautogramme ne change rien.';
    const list = [...lettersOf(letters)].join(', ');
    return `Les mots prennent tour à tour les lettres ${list}, en boucle ; chacun devient le premier mot du dictionnaire qui suit le mot à l'initiale changée (« maison » vers « p » : à partir de « paison »). Les mots-outils ne comptent pas dans la suite des lettres ; les verbes gardent leur temps et leur personne, « être » et « avoir » restent.`;
  },
  apply(text, tagged, values, { morphology, verbs }, targets, scope = FULL_SCOPE) {
    const assigned = assignLetters(tagged, targets, new Set(scope.skip), [...lettersOf(params(values).letters)]);
    // Le mot qui n'a pas encore l'initiale de sa lettre : c'est lui que le filtre change.
    const wants = (index: number, form: string) => {
      const letter = assigned.get(index);
      return letter !== undefined && !startsWith(letter)(form);
    };
    const tokens = tokenize(text);
    const apostrophe = text.includes('’') ? '’' : "'";

    // 1. Les noms, avec leur groupe : déterminant, adjectifs, attribut, pronom de reprise.
    const nouns = rewriteNouns(
      text,
      tagged,
      (word, hints, index) => (wants(index, word) ? nthNoun(word, hints, 1, startsWith(assigned.get(index)!), morphology, undefined, swapInitial(assigned.get(index)!)) : keepNoun(word)),
      morphology,
    );
    const words = nouns.words.map((word) => ({ ...word }));
    const marks: WordMark[] = [];
    for (const substitution of nouns.substitutions) {
      if (substitution.status === 'replaced') marks.push({ index: substitution.index, original: substitution.original, replacement: words[substitution.index]!.output });
    }

    // 2. Les adjectifs, les adverbes, et les noms restés sans voisin.
    const touched = new Set(marks.map((mark) => mark.index));
    words.forEach((word, index) => {
      const category = tagged[index]!.category;
      if (category === 'verb' || touched.has(index) || !wants(index, word.output)) return;
      const letter = assigned.get(index)!;
      const original = tokens[index]!.word;
      let replacement: string | undefined;
      if (category === 'adjective') {
        const reading = morphology.adjectiveReadings(word.output.toLowerCase())[0];
        const gender = reading && reading.gender !== 'e' ? reading.gender : undefined;
        const number = reading && reading.number !== 'i' ? reading.number : undefined;
        replacement = nthAdjective(word.output, { gender, number }, 1, startsWith(letter), morphology, undefined, swapInitial(letter))?.form;
      } else if (category === 'adverb') {
        replacement = nthAdverb(word.output, 1, startsWith(letter), morphology, undefined, swapInitial(letter));
      }
      if (replacement === undefined) return marks.push({ index, original, reason: noNeighbour(letter) });
      word.output = matchCase(word.output, replacement);
      marks.push({ index, original, replacement: word.output });
    });

    // 3. Les verbes, au même temps et à la même personne ; le pronom élidé suit le verbe nouveau.
    marks.push(
      ...rewriteVerbs(
        words,
        tagged,
        (index) => wants(index, words[index]!.output),
        (word, previous, repository, index) => nthVerb(word, previous, 1, startsWith(assigned.get(index)!), repository, noNeighbour(assigned.get(index)!), undefined, swapInitial(assigned.get(index)!)),
        verbs,
        apostrophe,
        (word) => elides(word, { blocksElision: (form) => !!verbs?.blocksElision(form) || morphology.blocksElision(form) }),
      ),
    );

    // 4. Élision des articles devant un mot nouveau qui commence par une voyelle.
    for (const mark of marks) if (mark.replacement !== undefined) elide(words, mark.index, apostrophe, morphology);
    for (const mark of marks) if (mark.replacement !== undefined) mark.replacement = words[mark.index]!.output;

    return { words, tail: nouns.tail, marks: marks.sort((a, b) => a.index - b.index) };
  },
});

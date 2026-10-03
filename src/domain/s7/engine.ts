import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { TaggedWord } from '../tagged-word.ts';
import { tokenize } from '../tokenizer.ts';
import { agreeAdjective } from './agreement.ts';
import { identifyDeterminer, isTout, VARIABLE_FORMS, type IdentifiedDeterminer } from './determiners.ts';
import { elides, realizeDeterminer } from './elision.ts';
import { substituteNoun, type NounChoice, type NounHints } from './substitution.ts';
import { adjectiveChain, findPredicate, isImpersonal, LINKING_PREPOSITIONS, SUBJECT_PRONOUNS, subjectPronoun, TextView } from './syntax.ts';
import { S7OptionsSchema, type ConcreteGender, type ConcreteNumber, type OutputWord, type S7OptionsInput, type S7Result, type Substitution } from './types.ts';

/** Ce qu'on change à un mot du texte : sa forme, et ce qui le sépare du mot précédent. */
interface Override {
  word?: string;
  gap?: string;
}

/** Un nom et ce qui s'accorde avec lui dans son voisinage immédiat. */
interface NounGroup {
  index: number;
  /** Premier et dernier mot du groupe, déterminant et adjectifs compris. */
  from: number;
  to: number;
  choice: NounChoice;
  /** Le groupe complète-t-il le groupe précédent (« la porte du grenier ») ? */
  linked: boolean;
}

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
function matchCase(original: string, replacement: string): string {
  const first = original[0]!;
  const capitalized = first !== first.toLowerCase();
  return capitalized ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;
}

/**
 * Choisit le remplaçant d'un nom, d'après ce que la phrase dit de son genre et de son nombre ;
 * `index` est sa position dans le texte, pour une portée par mot.
 */
export type NounChooser = (word: string, hints: NounHints, index: number) => NounChoice;

/** Un nom laissé tel quel : la réécriture laisse aussi son groupe (déterminant, adjectifs). */
export const keepNoun = (word: string): NounChoice => ({ status: 'unknown-noun', replacement: word.toLowerCase(), gender: 'm', number: 's', originalGender: 'm' });

/** La portée par mot du S+n : les noms à laisser, et le décalage de chaque nom (verrous). */
export interface NounScope {
  skip: ReadonlySet<number>;
  offsetAt: (index: number) => number;
}

/**
 * Applique la contrainte : chaque nom est remplacé par le n-ième suivant du dictionnaire, puis
 * ce qui s'accordait avec lui est remis d'aplomb : déterminant, adjectifs, attribut, participe
 * après « être », pronom de reprise, élision et contraction. Voir docs/s7.md.
 *
 * @param tagged les mots du texte étiquetés, alignés sur `tokenize(text)`
 */
export function applyS7(
  text: string,
  tagged: readonly TaggedWord[],
  options: S7OptionsInput,
  morphology: MorphologyRepository,
  scope?: NounScope,
): S7Result {
  const { offset, mode, category } = S7OptionsSchema.parse(options);
  const choose: NounChooser = (word, hints, index) =>
    scope?.skip.has(index) ? keepNoun(word) : substituteNoun(word, hints, { offset: scope?.offsetAt(index) ?? offset, mode }, morphology);
  return rewriteNouns(text, tagged, choose, morphology, category);
}

/**
 * Remplace chaque nom par ce que `choose` en fait, puis remet d'aplomb ce qui s'accordait avec
 * lui : la réécriture du S+7, partagée avec les contraintes qui remplacent aussi des noms
 * (le lipogramme).
 */
export function rewriteNouns(
  text: string,
  tagged: readonly TaggedWord[],
  choose: NounChooser,
  morphology: MorphologyRepository,
  category: TaggedWord['category'] = 'noun',
): S7Result {
  const tokens = tokenize(text);
  if (tagged.length !== tokens.length || tokens.some((token, i) => token.word !== tagged[i]!.word)) {
    throw new Error('les mots étiquetés ne correspondent pas au découpage du texte');
  }
  const view = new TextView(text, tokens, tagged);
  const apostrophe = text.includes('’') ? '’' : "'";
  const overrides = new Map<number, Override>();
  const claimed = new Set<number>();
  const wordAt = (i: number) => overrides.get(i)?.word ?? tokens[i]!.word;
  const isFree = (i: number, wanted: TaggedWord['category']) => view.is(i, wanted) && !claimed.has(i);

  const agree = (i: number, gender: ConcreteGender, number: ConcreteNumber, nextElides?: boolean) => {
    const agreed = agreeAdjective(tokens[i]!.word, { gender, number, nextElides }, morphology);
    overrides.set(i, { ...overrides.get(i), word: matchCase(tokens[i]!.word, agreed.form) });
    claimed.add(i);
  };

  const render = (from: number, to: number) => {
    let out = '';
    for (let i = from; i <= to; i++) {
      const override = overrides.get(i);
      out += (i === from ? '' : (override?.gap ?? view.gap(i))) + (override?.word ?? tokens[i]!.word);
    }
    return out;
  };

  // --- Première passe : chaque nom et son groupe ---
  const groups: NounGroup[] = [];
  tokens.forEach((token, index) => {
    if (!view.is(index, category)) return;

    // Adjectifs épithètes avant le nom ; un adverbe peut s'intercaler (« une très belle maison »).
    const before: number[] = [];
    let first = index;
    for (let i = index - 1; i >= 0 && view.follows(i + 1) && (isFree(i, 'adjective') || isFree(i, 'adverb')); i--) {
      if (view.is(i, 'adjective')) {
        before.unshift(i);
        first = i;
      }
    }
    // Début du groupe : l'adverbe qui précède le premier adjectif en fait partie.
    while (before.length && first > 0 && view.follows(first) && isFree(first - 1, 'adverb')) first--;
    // Adjectifs après le nom : contigus, apposés ou coordonnés.
    const after = adjectiveChain(view, index, claimed);
    const last = after.at(-1) ?? index;

    // Déterminant : le ou les deux mots collés au début du groupe.
    const preceding: string[] = [];
    if (view.follows(first) && !claimed.has(first - 1)) {
      if (view.follows(first - 1) && !claimed.has(first - 2)) preceding.push(tokens[first - 2]!.word);
      preceding.push(tokens[first - 1]!.word);
    }
    const identified: IdentifiedDeterminer | undefined = identifyDeterminer(preceding);
    let from = identified ? first - identified.consumed : first;
    // « toute la ville » : « tout » placé avant le déterminant s'accorde avec lui.
    const tout = identified && view.follows(from) && !claimed.has(from - 1) && isTout(tokens[from - 1]!.word) ? from - 1 : undefined;

    const choice = choose(token.word, { gender: identified?.determiner.gender, number: identified?.determiner.number }, index);

    // Complément du nom précédent ? Par un article contracté ou une préposition, sans rien entre les deux.
    const previous = groups.at(-1);
    const contracted = identified !== undefined && ['de', 'de-definite', 'a-definite'].includes(identified.determiner.kind);
    const preposition = !contracted && view.follows(from) && LINKING_PREPOSITIONS.has(view.lower(from - 1)) ? from - 1 : undefined;
    const linkStart = preposition ?? (contracted ? from : undefined);
    const linked = previous !== undefined && linkStart !== undefined && view.follows(linkStart) && previous.to === linkStart - 1;

    if (tout !== undefined) from = tout;
    groups.push({ index, from, to: last, choice, linked });
    for (let i = from; i <= last; i++) claimed.add(i);
    if (choice.status !== 'replaced') return;

    const { gender, number } = choice;
    overrides.set(index, { word: matchCase(token.word, choice.replacement) });

    // Accord : du nom vers la gauche, pour que chaque adjectif connaisse le mot qui le suit.
    for (const i of [...before].reverse()) agree(i, gender, number, elides(wordAt(i + 1), morphology));
    for (const i of after) agree(i, gender, number);

    // Élision et contraction : selon le premier mot du groupe, une fois accordé.
    if (identified) {
      const start = first - identified.consumed;
      const words = realizeDeterminer(identified.determiner, { gender, number, nextElides: elides(wordAt(first), morphology), apostrophe });
      overrides.set(start, { ...overrides.get(start), word: matchCase(tokens[start]!.word, words.join(' ')) });
      if (identified.consumed === 2) overrides.set(start + 1, { word: '', gap: '' });
      overrides.set(first, { ...overrides.get(first), gap: words.at(-1)!.endsWith(apostrophe) ? '' : ' ' });
      if (tout !== undefined) {
        const plural = (identified.determiner.number ?? number) === 'p';
        const form = VARIABLE_FORMS['tout']![(plural ? 2 : 0) + (gender === 'm' ? 0 : 1)]!;
        overrides.set(tout, { word: matchCase(tokens[tout]!.word, form) });
      }
    }
  });

  // La liste des substitutions décrit le groupe nominal : on la fige avant d'aller plus loin.
  const substitutions: Substitution[] = groups.map(({ index, from, to, choice }) => {
    const before = text.slice(tokens[from]!.start, tokens[to]!.end);
    return {
      index,
      original: tokens[index]!.word,
      replacement: wordAt(index),
      status: choice.status,
      before,
      after: choice.status === 'replaced' ? render(from, to) : before,
    };
  });

  /** Accorde avec un sujet ce qui le suit : participe après « être », attribut après un verbe d'état. */
  const agreePredicate = (subjectEnd: number, gender: ConcreteGender, number: ConcreteNumber) => {
    const { participles, attributes } = findPredicate(view, subjectEnd, claimed, morphology);
    for (const i of [...participles, ...attributes]) agree(i, gender, number);
  };

  // --- Deuxième passe : l'attribut suit la tête du groupe (« la porte du grenier est ouverte ») ---
  let head: NounGroup | undefined;
  groups.forEach((group, i) => {
    if (!group.linked || !head) head = group;
    const next = groups[i + 1];
    if (next?.linked) return; // l'attribut vient après le dernier complément
    if (head.choice.status === 'replaced') agreePredicate(group.to, head.choice.gender, head.choice.number);
  });

  // --- Troisième passe : pronom sujet de reprise, seulement si son antécédent est sans ambiguïté ---
  tokens.forEach((token, i) => {
    const pronoun = SUBJECT_PRONOUNS[view.lower(i)];
    if (!pronoun || !view.is(i, 'other') || claimed.has(i) || isImpersonal(view, i)) return;
    const sentence = view.sentenceOf(i);
    const candidates = groups.filter((g) => g.index < i && view.sentenceOf(g.index) === sentence);
    if (candidates.some((g) => g.choice.status !== 'replaced')) return;
    const antecedents = candidates.filter((g) => g.choice.originalGender === pronoun.gender && g.choice.number === pronoun.number);
    if (antecedents.length !== 1) return;
    // Un nom propre, ou un autre pronom sujet, avant lui dans la phrase : l'antécédent n'est plus sûr.
    for (let j = i - 1; j >= 0 && view.sentenceOf(j) === sentence; j--) {
      const word = tokens[j]!.word;
      if (view.is(j, 'other') && !claimed.has(j) && (word[0] !== word[0]!.toLowerCase() || SUBJECT_PRONOUNS[view.lower(j)])) return;
    }
    const { gender } = antecedents[0]!.choice;
    overrides.set(i, { word: matchCase(token.word, subjectPronoun(gender, pronoun.number)) });
    claimed.add(i);
    agreePredicate(i, gender, pronoun.number);
  });

  const words: OutputWord[] = tokens.map((token, index) => {
    const override = overrides.get(index);
    return { index, output: override?.word ?? token.word, gap: override?.gap ?? view.gap(index) };
  });
  const tail = tokens.length ? text.slice(tokens.at(-1)!.end) : text;
  return { text: words.map((w) => w.gap + w.output).join('') + tail, substitutions, words, tail };
}

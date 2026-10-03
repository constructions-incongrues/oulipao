import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { TaggedWord } from '../tagged-word.ts';
import { tokenize, type Token } from '../tokenizer.ts';
import { agreeAdjective } from './agreement.ts';
import { identifyDeterminer } from './determiners.ts';
import { elides, realizeDeterminer } from './elision.ts';
import { substituteNoun } from './substitution.ts';
import { S7OptionsSchema, type S7OptionsInput, type S7Result, type Substitution } from './types.ts';

/** Ce qu'on change à un mot du texte : sa forme, et ce qui le sépare du mot précédent. */
interface Override {
  word?: string;
  gap?: string;
}

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
function matchCase(original: string, replacement: string): string {
  const first = original[0]!;
  const capitalized = first !== first.toLowerCase();
  return capitalized ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;
}

/**
 * Applique la contrainte : chaque nom est remplacé par le n-ième suivant du dictionnaire, puis
 * son groupe nominal est remis d'aplomb (genre du déterminant et des adjectifs contigus,
 * élision, contraction). Étapes : substitution, accord, élision — voir docs/s7.md.
 *
 * @param tagged les mots du texte étiquetés, alignés sur `tokenize(text)`
 */
export function applyS7(
  text: string,
  tagged: readonly TaggedWord[],
  options: S7OptionsInput,
  morphology: MorphologyRepository,
): S7Result {
  const { offset, mode, category } = S7OptionsSchema.parse(options);
  const tokens = tokenize(text);
  if (tagged.length !== tokens.length || tokens.some((token, i) => token.word !== tagged[i]!.word)) {
    throw new Error('les mots étiquetés ne correspondent pas au découpage du texte');
  }
  const apostrophe = text.includes('’') ? '’' : "'";
  const overrides = new Map<number, Override>();
  const claimed = new Set<number>();
  const wordAt = (i: number) => overrides.get(i)?.word ?? tokens[i]!.word;
  const gapBefore = (i: number) => text.slice(i === 0 ? 0 : tokens[i - 1]!.end, tokens[i]!.start);
  // Deux mots se suivent s'il n'y a entre eux que de l'espace (ou rien, après une élision).
  const follows = (i: number) => i > 0 && /^\s*$/.test(gapBefore(i));
  const isFree = (i: number, wanted: TaggedWord['category']) => tagged[i]!.category === wanted && !claimed.has(i);

  const render = (from: number, to: number) => {
    let out = '';
    for (let i = from; i <= to; i++) {
      const override = overrides.get(i);
      out += (i === from ? '' : (override?.gap ?? gapBefore(i))) + (override?.word ?? tokens[i]!.word);
    }
    return out;
  };

  const pending: { index: number; from: number; to: number; choice: ReturnType<typeof substituteNoun> }[] = [];

  tokens.forEach((token: Token, index) => {
    if (tagged[index]!.category !== category) return;

    // Adjectifs épithètes contigus, avant et après le nom ; un adverbe peut s'intercaler (« très »).
    const before: number[] = [];
    let scanned = index;
    for (let i = index - 1; i >= 0 && follows(i + 1) && (isFree(i, 'adjective') || isFree(i, 'adverb')); i--) {
      if (tagged[i]!.category === 'adjective') before.unshift(i);
      scanned = i;
    }
    const after: number[] = [];
    for (let i = index + 1; i < tokens.length && follows(i) && (isFree(i, 'adjective') || isFree(i, 'adverb')); i++) {
      if (tagged[i]!.category === 'adjective') after.push(i);
    }
    // Début du groupe : le premier adjectif, ou l'adverbe qui le précède (« une très belle maison »).
    const first = before.length ? scanned : index;
    const last = after.at(-1) ?? index;

    // Déterminant : le ou les deux mots collés au début du groupe.
    const preceding: string[] = [];
    if (first > 0 && follows(first) && !claimed.has(first - 1)) {
      if (first > 1 && follows(first - 1) && !claimed.has(first - 2)) preceding.push(tokens[first - 2]!.word);
      preceding.push(tokens[first - 1]!.word);
    }
    const identified = identifyDeterminer(preceding);
    const from = identified ? first - identified.consumed : first;

    const choice = substituteNoun(
      token.word,
      { gender: identified?.determiner.gender, number: identified?.determiner.number },
      { offset, mode },
      morphology,
    );
    pending.push({ index, from, to: last, choice });
    for (let i = from; i <= last; i++) claimed.add(i);
    if (choice.status !== 'replaced') return;

    const { gender, number } = choice;
    overrides.set(index, { word: matchCase(token.word, choice.replacement) });

    // Accord : du nom vers la gauche, pour que chaque adjectif connaisse le mot qui le suit.
    for (const i of [...before].reverse()) {
      const agreed = agreeAdjective(tokens[i]!.word, { gender, number, nextElides: elides(wordAt(i + 1), morphology) }, morphology);
      overrides.set(i, { word: matchCase(tokens[i]!.word, agreed.form) });
    }
    for (const i of after) {
      overrides.set(i, { word: matchCase(tokens[i]!.word, agreeAdjective(tokens[i]!.word, { gender, number }, morphology).form) });
    }

    // Élision et contraction : selon le premier mot du groupe, une fois accordé.
    if (identified) {
      const words = realizeDeterminer(identified.determiner, { gender, number, nextElides: elides(wordAt(first), morphology), apostrophe });
      overrides.set(from, { ...overrides.get(from), word: matchCase(tokens[from]!.word, words.join(' ')) });
      if (identified.consumed === 2) overrides.set(from + 1, { word: '', gap: '' });
      overrides.set(first, { ...overrides.get(first), gap: words.at(-1)!.endsWith(apostrophe) ? '' : ' ' });
    }
  });

  const substitutions: Substitution[] = pending.map(({ index, from, to, choice }) => {
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

  let out = '';
  tokens.forEach((token, i) => {
    const override = overrides.get(i);
    out += (override?.gap ?? gapBefore(i)) + (override?.word ?? token.word);
  });
  const tail = tokens.length ? text.slice(tokens.at(-1)!.end) : text;
  return { text: out + tail, substitutions };
}

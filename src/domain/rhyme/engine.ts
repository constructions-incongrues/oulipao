import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { Category } from '../categories.ts';
import { plainWords } from '../mixing.ts';
import { nthAdjective, nthAdverb, nthNoun } from '../neighbours.ts';
import { pronounce, PHONETICS_LOADING } from '../phonetics/lookup.ts';
import { phonemesOf, type Phoneme } from '../phonetics/phoneme.ts';
import { requiredEnding, rhymeOf, type Richness } from '../phonetics/rhyme.ts';
import type { PluginResources, PluginResult, WordMark, WordScope } from '../plugin.ts';
import { fixElision } from '../s7/adjective-shift.ts';
import { elides } from '../s7/elision.ts';
import { keepNoun, rewriteNouns } from '../s7/engine.ts';
import type { ConcreteGender, OutputWord } from '../s7/types.ts';
import type { TaggedWord } from '../tagged-word.ts';
import { nthVerb, rewriteVerbs } from '../verb.ts';
import { layoutVerse, type VersePlace } from '../verse.ts';

/**
 * Ce qu'un filtre de rime fait d'un mot : le n-ième voisin que `accept` retient, ou la raison de le
 * laisser. `among`, s'il est donné, borne la recherche à ces formes : `accept` ne doit retenir
 * aucune forme hors de `among`, sinon des voisins seraient manqués.
 */
export type Decision = { offset: number; accept: (form: string) => boolean; none: string; among?: ReadonlySet<string> } | { reason: string };

/** La raison d'un mot laissé parce que son pas est bouché (comme au S+n). */
export const CLOSED = 'pas bouché';
const UNKNOWN = 'absent du dictionnaire';

/** Les prononciations du texte, retenues pour la durée d'un passage. */
export interface Sounds {
  /** Les phonèmes d'un mot dans une catégorie (lexique, puis règles) ; `undefined` s'il n'a pas de son. */
  of(word: string, category: Category): readonly Phoneme[] | undefined;
  /** Les formes d'une catégorie qui se prononcent exactement comme ces phonèmes. */
  homophones(phonemes: readonly Phoneme[], category: Category): ReadonlySet<string>;
  /**
   * Les formes d'une catégorie qui ont cette rime, ou l'une de ces rimes, devinées comprises : les
   * candidates d'un filtre qui veut une rime donnée. Le même ensemble est rendu d'un passage à l'autre.
   */
  rhyming(rhyme: string | readonly string[], category: Category): ReadonlySet<string>;
  /** Les formes d'une catégorie qui finissent par ces phonèmes (un à trois) ; le même ensemble d'un passage à l'autre. */
  ending(phonemes: readonly Phoneme[], category: Category): ReadonlySet<string>;
}

// Les candidates d'une rime, en ensemble, gardées d'un passage à l'autre : la textbank rend toujours
// le même tableau pour une rime, et les positions de ses lemmes se calculent une fois (neighbours.ts).
const asSets = new WeakMap<readonly string[], ReadonlySet<string>>();
const asSet = (forms: readonly string[]) => {
  let set = asSets.get(forms);
  if (!set) asSets.set(forms, (set = new Set(forms)));
  return set;
};

// La réunion des formes de plusieurs rimes (la rime berrychonne en croise deux), gardée par textbank.
const unions = new WeakMap<PhoneticsRepository, Map<string, ReadonlySet<string>>>();
function rhymingAll(phonetics: PhoneticsRepository, rhymes: readonly string[], category: Category): ReadonlySet<string> {
  const key = `${category}\t${[...new Set(rhymes)].sort().join('\t')}`;
  let byKey = unions.get(phonetics);
  if (!byKey) unions.set(phonetics, (byKey = new Map()));
  let union = byKey.get(key);
  if (!union) byKey.set(key, (union = new Set(rhymes.flatMap((rhyme) => phonetics.rhyming(rhyme, category)))));
  return union;
}

// Une mémoire par passage pour les prononciations. Les candidates d'une rime viennent de l'index de
// la textbank, qui couvre toutes les formes du dictionnaire (prononciations devinées comprises).
function soundsOf(phonetics: PhoneticsRepository): Sounds {
  const memo = new Map<string, readonly Phoneme[] | undefined>();
  return {
    of(word, category) {
      const key = `${category}\t${word.toLowerCase()}`;
      if (!memo.has(key)) {
        const reading = pronounce(word, category, phonetics);
        memo.set(key, reading && phonemesOf(reading));
      }
      return memo.get(key);
    },
    homophones: (phonemes, category) => asSet(phonetics.homophones(phonemes.join(''), category)),
    rhyming: (rhyme, category) =>
      typeof rhyme === 'string' ? asSet(phonetics.rhyming(rhyme, category)) : rhyme.length === 1 ? asSet(phonetics.rhyming(rhyme[0]!, category)) : rhymingAll(phonetics, rhyme, category),
    ending: (phonemes, category) => asSet(phonetics.ending(phonemes.join(''), category)),
  };
}

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
const matchCase = (original: string, replacement: string) =>
  original[0] !== original[0]!.toLowerCase() ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;

/** Ce qu'un filtre de rime fournit au moteur. */
export interface RhymeFilter {
  /** Le mot est-il visé, une fois la piste choisie (par exemple : seulement les fins de vers) ? */
  eligible: (index: number, places: readonly VersePlace[]) => boolean;
  /** Ce qu'il faut faire d'un mot visé ; appelé une fois par mot, les prononciations chargées. */
  decide: (index: number, word: string, category: Category, sounds: Sounds, places: readonly VersePlace[]) => Decision;
}

/** Le voisin qu'un mot recevrait, sans le contexte de la phrase : sert à prévoir une rime (antirime). */
export function probe(word: string, category: Category, decision: Decision, resources: PluginResources): string | undefined {
  if ('reason' in decision) return undefined;
  const { morphology, verbs } = resources;
  const { offset, accept, among } = decision;
  if (category === 'noun') {
    const choice = nthNoun(word, {}, offset, accept, morphology, among);
    return choice.status === 'replaced' ? choice.replacement : undefined;
  }
  if (category === 'adjective') return nthAdjective(word, {}, offset, accept, morphology, among)?.form;
  if (category === 'adverb') return nthAdverb(word, offset, accept, morphology, among);
  if (category === 'verb' && verbs) {
    const shift = nthVerb(word, [], offset, accept, verbs, '', among);
    return 'form' in shift ? shift.form : undefined;
  }
  return undefined;
}

const NO_CANDIDATE: ReadonlySet<string> = new Set();

/**
 * Les candidates d'une forme qui doit rimer avec `reference` à cette richesse : celles qui partagent
 * sa finale exigée (`requiredEnding`), ou aucune si elle est trop courte pour rimer ainsi. Au-delà de
 * trois phonèmes, la finale est la rime entière : l'index des rimes la sert.
 */
export function candidatesFor(sounds: Sounds, reference: readonly Phoneme[], richness: Richness, category: Category): ReadonlySet<string> {
  const ending = requiredEnding(reference, richness);
  if (!ending) return NO_CANDIDATE;
  return ending.length <= 3 ? sounds.ending(ending, category) : sounds.rhyming(rhymeOf(reference), category);
}

/** Les prononciations du passage, ou rien si elles ne sont pas encore chargées. */
export const soundsFor = (resources: PluginResources) => resources.phonetics && soundsOf(resources.phonetics);

/**
 * Applique un filtre de rime : chaque mot visé devient le voisin que le filtre décide, accordé
 * comme au S+n (le groupe du nom, l'élision devant l'adjectif, le pronom devant le verbe). Sans
 * prononciations chargées, chaque mot visé reste avec la raison du chargement.
 */
export function applyRhymeFilter(
  text: string,
  tagged: readonly TaggedWord[],
  resources: PluginResources,
  targets: ReadonlySet<Category>,
  scope: WordScope,
  filter: RhymeFilter,
  sounds: Sounds | undefined = soundsFor(resources),
): PluginResult {
  const { morphology, verbs } = resources;
  const skip = new Set(scope.skip);
  const places = layoutVerse(text, tagged);
  const visible = (index: number) => targets.has(tagged[index]!.category) && filter.eligible(index, places);

  if (!sounds) {
    const marks: WordMark[] = [];
    tagged.forEach((word, index) => visible(index) && marks.push({ index, original: word.word, reason: skip.has(index) ? CLOSED : PHONETICS_LOADING }));
    return { ...plainWords(text), marks };
  }

  const marks: WordMark[] = [];
  const decisions = new Map<number, Decision>();
  /** La décision pour un mot visé et ouvert ; `undefined` s'il n'est pas visé. La raison est notée une fois. */
  const ruleAt = (index: number, word: string): Exclude<Decision, { reason: string }> | undefined => {
    if (!visible(index)) return undefined;
    if (skip.has(index)) {
      marks.push({ index, original: tagged[index]!.word, reason: CLOSED });
      return undefined;
    }
    let decision = decisions.get(index);
    if (!decision) decisions.set(index, (decision = filter.decide(index, word, tagged[index]!.category, sounds, places)));
    if ('reason' in decision) {
      marks.push({ index, original: tagged[index]!.word, reason: decision.reason });
      return undefined;
    }
    return decision;
  };

  // 1. Les noms, avec leur groupe : déterminant, adjectifs, attribut, pronom de reprise.
  const nouns = rewriteNouns(
    text,
    tagged,
    (word, hints, index) => {
      if (tagged[index]!.category !== 'noun') return keepNoun(word);
      const rule = ruleAt(index, word);
      if (!rule) return keepNoun(word);
      const choice = nthNoun(word, hints, rule.offset, rule.accept, morphology, rule.among);
      if (choice.status !== 'replaced') marks.push({ index, original: word, reason: choice.status === 'unknown-noun' ? UNKNOWN : rule.none });
      return choice;
    },
    morphology,
  );
  const words: OutputWord[] = nouns.words.map((word) => ({ ...word }));
  for (const substitution of nouns.substitutions) {
    if (substitution.status === 'replaced') marks.push({ index: substitution.index, original: substitution.original, replacement: words[substitution.index]!.output });
  }

  // 2. Les adjectifs et les adverbes, au même genre et au même nombre que la forme en place.
  const apostrophe = text.includes('’') ? '’' : "'";
  words.forEach((word, index) => {
    const category = tagged[index]!.category;
    if ((category !== 'adjective' && category !== 'adverb') || !word.output) return;
    const rule = ruleAt(index, word.output);
    if (!rule) return;
    const original = word.output;
    let replacement: string | undefined;
    let gender: ConcreteGender = 'm';
    if (category === 'adjective') {
      const reading = morphology.adjectiveReadings(original.toLowerCase())[0];
      gender = reading && reading.gender !== 'e' ? reading.gender : 'm';
      const wanted = { ...(reading && reading.gender !== 'e' && { gender: reading.gender }), ...(reading && reading.number !== 'i' && { number: reading.number }) };
      replacement = nthAdjective(original, wanted, rule.offset, rule.accept, morphology, rule.among)?.form;
    } else {
      replacement = nthAdverb(original, rule.offset, rule.accept, morphology, rule.among);
    }
    if (!replacement) return marks.push({ index, original, reason: rule.none });
    word.output = matchCase(original, replacement);
    if (category === 'adjective') fixElision(words, index, gender, apostrophe, morphology);
    marks.push({ index, original, replacement: word.output });
  });

  // 3. Les verbes, au même temps et à la même personne ; le pronom élidé suit le verbe nouveau.
  const verbRules = new Map<number, Exclude<Decision, { reason: string }>>();
  marks.push(
    ...rewriteVerbs(
      words,
      tagged,
      (index) => {
        const rule = ruleAt(index, words[index]!.output);
        if (rule) verbRules.set(index, rule);
        return rule !== undefined;
      },
      (word, previous, repository, index) => {
        const rule = verbRules.get(index)!;
        return nthVerb(word, previous, rule.offset, rule.accept, repository, rule.none, rule.among);
      },
      verbs,
      apostrophe,
      (word) => elides(word, { blocksElision: (form) => !!verbs?.blocksElision(form) || morphology.blocksElision(form) }),
    ),
  );

  for (const mark of marks) if (mark.replacement !== undefined) mark.replacement = words[mark.index]!.output;
  return { words, tail: nouns.tail, marks: marks.sort((a, b) => a.index - b.index) };
}

/** Un mot que le plan d'un filtre de vers peut toucher, dans l'ordre du texte. */
export interface VerseSlot {
  index: number;
  place: VersePlace;
  word: string;
  category: Category;
  /** Ses phonèmes ; `undefined` s'il n'a pas de son. */
  sound: readonly Phoneme[] | undefined;
  /** Sa piste est visée et son pas n'est pas bouché : le plan peut le changer. */
  open: boolean;
}

/** Ce que le plan reçoit pour une strophe. */
export interface StanzaTools {
  sounds: Sounds;
  /** Note la décision pour ce mot et rend la prononciation qu'il aura : celle du voisin prévu, ou la sienne. */
  settle: (slot: VerseSlot, decision: Decision) => readonly Phoneme[] | undefined;
}

/**
 * Applique un filtre qui se décide strophe par strophe, dans l'ordre du texte (antirime, schémas,
 * antérime) : `plan` reçoit les mots que `pick` retient dans chaque strophe et note, par `settle`,
 * ceux qui changent. Seuls ces mots-là reçoivent une marque. Sans prononciations chargées, chaque mot
 * retenu attend.
 */
export function planByVerse(
  text: string,
  tagged: readonly TaggedWord[],
  resources: PluginResources,
  targets: ReadonlySet<Category>,
  scope: WordScope,
  pick: (place: VersePlace) => boolean,
  plan: (slots: VerseSlot[], tools: StanzaTools) => void,
): PluginResult {
  const sounds = soundsFor(resources);
  const decisions = new Map<number, Decision>();
  if (sounds) {
    const skip = new Set(scope.skip);
    const tools: StanzaTools = {
      sounds,
      settle(slot, decision) {
        decisions.set(slot.index, decision);
        const replacement = probe(slot.word, slot.category, decision, resources);
        return (replacement && sounds.of(replacement, slot.category)) || slot.sound;
      },
    };
    const stanzas = new Map<number, VerseSlot[]>();
    layoutVerse(text, tagged).forEach((place, index) => {
      if (!pick(place)) return;
      const { word, category } = tagged[index]!;
      const slot = { index, place, word, category, sound: sounds.of(word, category), open: targets.has(category) && !skip.has(index) };
      stanzas.set(place.stanza, [...(stanzas.get(place.stanza) ?? []), slot]);
    });
    for (const slots of stanzas.values()) plan(slots, tools);
  }
  return applyRhymeFilter(
    text,
    tagged,
    resources,
    targets,
    scope,
    {
      // Sans prononciations, tous les mots retenus attendent ; ensuite, seuls ceux du plan changent.
      eligible: (index, places) => pick(places[index]!) && (!sounds || decisions.has(index) || scope.skip.includes(index)),
      decide: (index) => decisions.get(index)!,
    },
    sounds,
  );
}

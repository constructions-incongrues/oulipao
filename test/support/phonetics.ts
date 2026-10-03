// Petit lexique de rimes pour les tests : noms, adjectifs, adverbes, verbes et leurs prononciations.
import { InMemoryMorphology } from '../../src/adapters/morphology/in-memory-morphology.ts';
import { InMemoryPhonetics, type PhoneticEntry } from '../../src/adapters/morphology/in-memory-phonetics.ts';
import { InMemoryVerbs } from '../../src/adapters/morphology/in-memory-verbs.ts';
import type { Category } from '../../src/domain/categories.ts';
import { parseReading } from '../../src/domain/phonetics/phoneme.ts';
import type { PluginResources } from '../../src/domain/plugin.ts';
import type { AdjectiveForm, Gender, GrammaticalNumber, NounForm } from '../../src/domain/s7/types.ts';
import type { TaggedWord } from '../../src/domain/tagged-word.ts';
import { tokenize } from '../../src/domain/tokenizer.ts';
import type { VerbForm } from '../../src/domain/verb.ts';

const n = (form: string, lemma: string, gender: Gender, number: GrammaticalNumber): NounForm => ({ form, lemma, gender, number });
const a = (form: string, paradigm: string, gender: Gender, number: GrammaticalNumber): AdjectiveForm => ({ form, paradigm, gender, number });

// Ordre du dictionnaire : braise, câble, chaise, chat, chose, fable, fraise, glaise, maison,
// pluie, raison, rose, saison, table, vair, ver, verre, vers, vert.
export const RHYME_NOUNS: NounForm[] = [
  n('braise', 'braise', 'f', 's'), n('braises', 'braise', 'f', 'p'),
  n('câble', 'câble', 'm', 's'),
  n('chaise', 'chaise', 'f', 's'), n('chaises', 'chaise', 'f', 'p'),
  n('chat', 'chat', 'm', 's'),
  n('chose', 'chose', 'f', 's'),
  n('fable', 'fable', 'f', 's'),
  n('fraise', 'fraise', 'f', 's'), n('fraises', 'fraise', 'f', 'p'),
  n('glaise', 'glaise', 'f', 's'),
  n('maison', 'maison', 'f', 's'),
  n('pluie', 'pluie', 'f', 's'),
  n('raison', 'raison', 'f', 's'),
  n('rose', 'rose', 'f', 's'),
  n('saison', 'saison', 'f', 's'),
  n('table', 'table', 'f', 's'),
  n('vair', 'vair', 'm', 's'), n('ver', 'ver', 'm', 's'), n('verre', 'verre', 'm', 's'),
  n('vers', 'vers', 'm', 'i'), n('vert', 'vert', 'm', 's'),
];

const RHYME_ADJECTIVES: AdjectiveForm[] = [
  a('noir', 'noir', 'm', 's'), a('noire', 'noir', 'f', 's'),
  a('notoire', 'notoire', 'e', 's'),
  a('vieux', 'vieux', 'm', 'i'), a('vieille', 'vieux', 'f', 's'),
];

const v = (form: string, infinitive: string, tense: VerbForm['tense'], person?: VerbForm['person']): VerbForm => ({ form, infinitive, tense, ...(person && { person }) });
const RHYME_VERBS: VerbForm[] = [
  v('dort', 'dormir', 'indicative-present', '3s'), v('dormir', 'dormir', 'infinitive'),
  v('mord', 'mordre', 'indicative-present', '3s'), v('mordre', 'mordre', 'infinitive'),
  v('sort', 'sortir', 'indicative-present', '3s'), v('sortir', 'sortir', 'infinitive'),
  v('tombe', 'tomber', 'indicative-present', '3s'), v('tomber', 'tomber', 'infinitive'),
];

const PRONUNCIATIONS: [string, Category, string][] = [
  ['braise', 'noun', 'bʁɛz'], ['braises', 'noun', 'bʁɛz'], ['câble', 'noun', 'kabl'], ['chaise', 'noun', 'ʃɛz'], ['chaises', 'noun', 'ʃɛz'],
  ['chat', 'noun', 'ʃa'], ['chose', 'noun', 'ʃoz'], ['fable', 'noun', 'fabl'], ['fraise', 'noun', 'fʁɛz'], ['fraises', 'noun', 'fʁɛz'],
  ['glaise', 'noun', 'glɛz'], ['maison', 'noun', 'mɛ.zɔ̃'], ['pluie', 'noun', 'plɥi'], ['raison', 'noun', 'ʁɛ.zɔ̃'], ['rose', 'noun', 'ʁoz'],
  ['saison', 'noun', 'sɛ.zɔ̃'], ['table', 'noun', 'tabl'], ['vair', 'noun', 'vɛʁ'], ['ver', 'noun', 'vɛʁ'], ['verre', 'noun', 'vɛʁ'],
  ['vers', 'noun', 'vɛʁ'], ['vert', 'noun', 'vɛʁ'], ['vert', 'adjective', 'vɛʁ'], ['vers', 'other', 'vɛʁ'],
  ['noir', 'adjective', 'nwaʁ'], ['noire', 'adjective', 'nwaʁ'], ['notoire', 'adjective', 'nɔ.twaʁ'], ['vieux', 'adjective', 'vjø'],
  ['dort', 'verb', 'dɔʁ'], ['mord', 'verb', 'mɔʁ'], ['sort', 'verb', 'sɔʁ'], ['tombe', 'verb', 'tɔ̃b'],
  ['couvent', 'noun', 'ku.vɑ̃'], ['couvent', 'verb', 'kuv'],
  ['bien', 'adverb', 'bjɛ̃'], ['loin', 'adverb', 'lwɛ̃'], ['vite', 'adverb', 'vit'],
  ['le', 'other', 'lə'], ['la', 'other', 'la'], ['sur', 'other', 'syʁ'], ['un', 'other', 'œ̃'], ['et', 'other', 'e'],
];

export const RHYME_ENTRIES: PhoneticEntry[] = PRONUNCIATIONS.map(([form, category, ipa]) => ({ form, category, reading: parseReading(ipa)! }));

export const rhymePhonetics = () => new InMemoryPhonetics(RHYME_ENTRIES);
export const rhymeMorphology = () => new InMemoryMorphology({ nouns: RHYME_NOUNS, adjectives: RHYME_ADJECTIVES, adverbs: ['bien', 'loin', 'vite'], noElision: [] });
export const rhymeVerbs = () => new InMemoryVerbs(RHYME_VERBS);

/** Les textbanks du lexique de rimes ; sans `phonetics: false`, les prononciations sont chargées. */
export const rhymeResources = ({ phonetics = true } = {}): PluginResources => ({
  morphology: rhymeMorphology(),
  verbs: rhymeVerbs(),
  ...(phonetics && { phonetics: rhymePhonetics() }),
});

const NOUNS = new Set(RHYME_NOUNS.map((noun) => noun.form));
const ADJECTIVES = new Set(RHYME_ADJECTIVES.map((adjective) => adjective.form));
const VERBS = new Set(RHYME_VERBS.map((verb) => verb.form));

/** Étiquette un texte d'après le lexique de rimes ; « glorbiture » est un nom que le dictionnaire ignore. */
export const tagRhymes = (text: string): TaggedWord[] =>
  tokenize(text).map(({ word }) => {
    const lower = word.toLowerCase();
    const category: Category = NOUNS.has(lower) || lower === 'glorbiture' ? 'noun' : ADJECTIVES.has(lower) ? 'adjective' : VERBS.has(lower) ? 'verb' : ['bien', 'loin', 'vite'].includes(lower) ? 'adverb' : 'other';
    return { word, category };
  });

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Category } from '../../src/domain/categories.ts';
import { plainWords } from '../../src/domain/mixing.ts';
import { modulate, type ModulationStage } from '../../src/domain/modulation/apply.ts';
import { fold, modulatedValue } from '../../src/domain/modulation/fold.ts';
import { euclidStrikes, passes } from '../../src/domain/modulation/gate.ts';
import { neighbourOf } from '../../src/domain/modulation/neighbour.ts';
import { GateSchema, ModulatorSchema, SourceSchema, type Modulator } from '../../src/domain/modulation/schema.ts';
import { lineNumbers, positionValue, wordValue } from '../../src/domain/modulation/sources.ts';
import { definePlugin, FULL_SCOPE, type ConstraintPlugin, type Parameter } from '../../src/domain/plugin.ts';
import { GATE_CLOSED, runChain, type ChainStep } from '../../src/domain/plugin-chain.ts';
import { s7Plugin } from '../../src/domain/s7/plugin.ts';
import { tokenize } from '../../src/domain/tokenizer.ts';
import { morphology, tag } from '../support/morphology.ts';
import { rhymeResources } from '../support/phonetics.ts';

const mod = (source: unknown, extra: object = {}): Modulator => ModulatorSchema.parse({ source, ...extra });

test('schéma : un modulateur se complète de sa base, de sa profondeur et du mot lu', () => {
  assert.deepEqual(mod({ kind: 'letters' }), { source: { kind: 'letters' }, read: { kind: 'self' }, base: 0, depth: 1 });
});

test('schéma : un motif vide, une lettre de deux caractères, un voisin pour le rang sont refusés', () => {
  assert.equal(SourceSchema.safeParse({ kind: 'pattern', values: [] }).success, false);
  assert.equal(SourceSchema.safeParse({ kind: 'letter', letter: 'ab' }).success, false);
  assert.equal(SourceSchema.safeParse({ kind: 'letter', letter: '1' }).success, false);
  assert.equal(ModulatorSchema.safeParse({ source: { kind: 'rank' }, read: { kind: 'neighbour', track: 'adjective', side: 'after' } }).success, false);
  assert.equal(ModulatorSchema.safeParse({ source: { kind: 'letters' }, read: { kind: 'neighbour', track: 'adjective', side: 'after' } }).success, true);
});

test('schéma : l’Euclide se pose sur le rang, avec k au plus n', () => {
  assert.equal(GateSchema.safeParse({ source: { kind: 'rank' }, test: { kind: 'euclid', k: 3, n: 8 } }).success, true);
  assert.equal(GateSchema.safeParse({ source: { kind: 'letters' }, test: { kind: 'euclid', k: 3, n: 8 } }).success, false);
  assert.equal(GateSchema.safeParse({ source: { kind: 'rank' }, test: { kind: 'euclid', k: 9, n: 8 } }).success, false);
  assert.equal(GateSchema.safeParse({ source: { kind: 'rank' }, read: { kind: 'neighbour', track: 'noun', side: 'before' }, test: { kind: 'even' } }).success, false);
});

test('repli : au-dessus du maximum, la valeur reprend à 1 ; ailleurs, elle tourne dans les bornes', () => {
  assert.equal(fold(13, 1, 9), 4);
  assert.equal(fold(25, -20, 20), 5);
  assert.equal(fold(4, -99, 99), 4);
  assert.equal(fold(0, 1, 9), 9);
  assert.equal(fold(-25, -20, 20), 16);
  assert.equal(fold(5, -9, 0), -5);
  assert.deepEqual(modulatedValue(7, -1, 4, -99, 99), { value: 3, folded: false });
  assert.deepEqual(modulatedValue(0, 1, 13, 1, 9), { value: 4, folded: true });
});

test('sources du mot : lettres, voyelles, une lettre, syllabes', () => {
  assert.equal(wordValue({ kind: 'letters' }, 'porte-clés', 'noun'), 9);
  assert.equal(wordValue({ kind: 'letters' }, 'aujourd’hui', 'adverb'), 10);
  assert.equal(wordValue({ kind: 'vowels' }, 'Élève', 'noun'), 3);
  assert.equal(wordValue({ kind: 'letter', letter: 'e' }, 'élève', 'noun'), 3);
  assert.equal(wordValue({ kind: 'letter', letter: 'É' }, 'été', 'noun'), 2);
  assert.equal(wordValue({ kind: 'syllables' }, 'cuisine', 'noun', () => 2), 2);
  assert.equal(wordValue({ kind: 'syllables' }, 'cuisine', 'noun'), undefined);
  assert.throws(() => wordValue({ kind: 'rank' }, 'chat', 'noun'), /source de mot/);
});

test('sources de position : rang, motif répété, rampe arrondie, lignes', () => {
  assert.deepEqual([0, 1, 2].map((i) => positionValue({ kind: 'rank' }, i, 3)), [1, 2, 3]);
  assert.deepEqual([0, 1, 2, 3].map((i) => positionValue({ kind: 'pattern', values: [7, 0] }, i, 4)), [7, 0, 7, 0]);
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => positionValue({ kind: 'ramp', from: 1, to: 9 }, i, 5)), [1, 3, 5, 7, 9]);
  assert.equal(positionValue({ kind: 'ramp', from: 4, to: 9 }, 0, 1), 4);
  assert.throws(() => positionValue({ kind: 'letters' }, 0, 1), /source de position/);
  assert.deepEqual(lineNumbers(['', ' ', '\n', ' ', '\n\n']), [1, 1, 2, 2, 4]);
});

/** Le texte tel qu'une instance le reçoit, étiqueté à la main. */
function stageOf(text: string, categories: Category[]): ModulationStage {
  const tokens = tokenize(text);
  assert.equal(tokens.length, categories.length);
  return { words: tokens.map((token) => token.word), categories, gaps: tokens.map((token, k) => text.slice(k ? tokens[k - 1]!.end : 0, token.start)) };
}

test('voisin : le plus proche de la piste, avant ou après, sans passer la fin de phrase', () => {
  const { categories, gaps } = stageOf('Le chat noir dort. Il pleut sur la ville grise.', ['other', 'noun', 'adjective', 'verb', 'other', 'verb', 'other', 'other', 'noun', 'adjective']);
  assert.equal(neighbourOf(1, 'adjective', 'after', categories, gaps), 2);
  assert.equal(neighbourOf(3, 'noun', 'before', categories, gaps), 1);
  assert.equal(neighbourOf(5, 'noun', 'before', categories, gaps), undefined);
  assert.equal(neighbourOf(3, 'noun', 'after', categories, gaps), undefined);
  assert.equal(neighbourOf(8, 'adjective', 'after', categories, gaps), 9);
  assert.equal(neighbourOf(9, 'verb', 'after', categories, gaps), undefined);
  assert.equal(neighbourOf(1, 'verb', 'before', categories, gaps), undefined);
});

test('porte : pair, impair, au moins, au plus, Euclide E(3,8)', () => {
  assert.equal(passes({ kind: 'even' }, 4), true);
  assert.equal(passes({ kind: 'odd' }, 4), false);
  assert.equal(passes({ kind: 'at-least', k: 5 }, 5), true);
  assert.equal(passes({ kind: 'at-most', k: 5 }, 6), false);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].filter((step) => euclidStrikes(3, 8, step)), [1, 4, 7]);
  assert.equal(passes({ kind: 'euclid', k: 3, n: 8 }, 9), true);
});

const OFFSET: Parameter[] = [{ kind: 'integer', key: 'offset', label: 'Décalage', min: 1, max: 9, lockable: true }];
const NOUNS = new Set<Category>(['noun']);

test('modulation : les lettres de chaque nom, repliées dans les bornes', () => {
  const stage = stageOf('Le chat dort sur la chaise, anticonstitutionnellement.', ['other', 'noun', 'verb', 'other', 'other', 'noun', 'noun']);
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), modulators: { offset: mod({ kind: 'letters' }) }, parameters: OFFSET });
  assert.deepEqual([...result.overrides], [[1, { offset: 4 }], [5, { offset: 6 }], [6, { offset: 7 }]]);
  assert.deepEqual([...result.folded], ['offset']);
  assert.deepEqual(result.skip, []);
});

test('modulation : un paramètre inconnu ou non verrouillable ne se module pas', () => {
  const stage = stageOf('Le chat.', ['other', 'noun']);
  const parameters: Parameter[] = [{ kind: 'integer', key: 'seed', label: 'Graine', min: 1, max: 9 }];
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), modulators: { seed: mod({ kind: 'letters' }), other: mod({ kind: 'rank' }) }, parameters });
  assert.equal(result.overrides.size, 0);
});

test('modulation : rang, motif et rampe comptent les mots traités, pas les bouchés', () => {
  const stage = stageOf('chat chaise cuisine pluie', ['noun', 'noun', 'noun', 'noun']);
  const rank = modulate(stage, { targets: NOUNS, closed: new Set([1]), modulators: { offset: mod({ kind: 'rank' }) }, parameters: OFFSET });
  assert.deepEqual([...rank.overrides], [[0, { offset: 1 }], [2, { offset: 2 }], [3, { offset: 3 }]]);
  const pattern = modulate(stage, { targets: NOUNS, closed: new Set(), modulators: { offset: mod({ kind: 'pattern', values: [7, 2] }) }, parameters: OFFSET });
  assert.deepEqual([...pattern.overrides.values()].map((values) => values.offset), [7, 2, 7, 2]);
});

test('modulation : la ligne se lit dans le texte reçu', () => {
  const stage = stageOf('chat\nchaise\n\npluie', ['noun', 'noun', 'noun']);
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), modulators: { offset: mod({ kind: 'line' }) }, parameters: OFFSET });
  assert.deepEqual([...result.overrides.values()].map((values) => values.offset), [1, 2, 4]);
});

test('modulation : sans voisin ni prononciation, le mot garde la valeur de l’instance, avec une note', () => {
  const stage = stageOf('Le chat noir dort. La pluie tombe.', ['other', 'noun', 'adjective', 'verb', 'other', 'noun', 'verb']);
  const neighbour = mod({ kind: 'letters' }, { read: { kind: 'neighbour', track: 'adjective', side: 'after' } });
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), modulators: { offset: neighbour }, parameters: OFFSET });
  assert.deepEqual([...result.overrides], [[1, { offset: 4 }]]);
  assert.equal(result.words.get(5)!.note, 'no-neighbour');
  const loading = modulate(stage, { targets: NOUNS, closed: new Set(), modulators: { offset: mod({ kind: 'syllables' }) }, parameters: OFFSET });
  assert.equal(loading.overrides.size, 0);
  assert.equal(loading.words.get(1)!.note, 'loading');
});

test('porte : seuls les noms d’un nombre pair de lettres passent ; le rang suit ceux qui passent', () => {
  const stage = stageOf('Le chat dort sur la chaise de la pluie.', ['other', 'noun', 'verb', 'other', 'other', 'noun', 'other', 'other', 'noun']);
  const gate = GateSchema.parse({ source: { kind: 'letters' }, test: { kind: 'odd' } });
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), gate, modulators: { offset: mod({ kind: 'rank' }) }, parameters: OFFSET });
  assert.deepEqual(result.skip, [1, 5]);
  assert.deepEqual([...result.overrides], [[8, { offset: 1 }]]);
  assert.equal(result.words.get(1)!.gate, 'closed');
  assert.equal(result.words.get(8)!.gate, 'open');
});

test('porte : l’Euclide sur le rang compte les mots des pistes, avant la porte', () => {
  const stage = stageOf('a b c d e f g h', Array(8).fill('noun'));
  const gate = GateSchema.parse({ source: { kind: 'rank' }, test: { kind: 'euclid', k: 3, n: 8 } });
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), gate, parameters: OFFSET });
  assert.deepEqual(result.skip, [1, 2, 4, 5, 7]);
});

test('porte : sans rien à lire, elle laisse passer et le dit', () => {
  const stage = stageOf('chat', ['noun']);
  const gate = GateSchema.parse({ source: { kind: 'syllables' }, test: { kind: 'even' } });
  const result = modulate(stage, { targets: NOUNS, closed: new Set(), gate, parameters: OFFSET });
  assert.deepEqual(result.skip, []);
  assert.equal(result.words.get(0)!.note, 'loading');
});

/** Un plugin d'essai sur les noms : écrit chaque nom suivi de son décalage (« chat4 »), qu'il en ait un propre ou non. */
const stamp: ConstraintPlugin = definePlugin({
  id: 'stamp',
  name: 'Tampon',
  tracks: ['noun'],
  defaultTargets: ['noun'],
  parameters: OFFSET,
  defaults: { offset: 9 },
  parse: (values) => ({ offset: 9, ...values }),
  acts: () => true,
  title: () => 'Tampon',
  label: () => 'tampon',
  help: () => '',
  apply(text, tagged, values, _resources, targets, scope = FULL_SCOPE) {
    const { words, tail } = plainWords(text);
    const skip = new Set(scope.skip);
    const own = new Map(scope.overrides.map(({ index, values: v }) => [index, v.offset]));
    const marks = [];
    for (const [i, word] of tagged.entries()) {
      if (!targets.has(word.category)) continue;
      if (skip.has(i)) {
        marks.push({ index: i, original: word.word, reason: 'pas bouché' });
        continue;
      }
      const output = `${word.word}${own.get(i) ?? values.offset}`;
      words[i] = { ...words[i]!, output };
      marks.push({ index: i, original: word.word, replacement: output });
    }
    return { words, tail, marks };
  },
});

const stampStep = (id: string, extra: Partial<ChainStep> = {}): ChainStep => ({ id, plugin: stamp, values: { offset: 9 }, targets: NOUNS, ...extra });
const output = (result: ReturnType<typeof runChain>) => result.words.map((word) => word.gap + word.output).join('') + result.tail;
const TEXT = 'Le chat dort sur la chaise.';
const TAGGED = [
  { word: 'Le', category: 'other' },
  { word: 'chat', category: 'noun' },
  { word: 'dort', category: 'verb' },
  { word: 'sur', category: 'other' },
  { word: 'la', category: 'other' },
  { word: 'chaise', category: 'noun' },
] as const;

test('chaîne : S+lettres, puis un second qui lit le mot reçu (rétroaction)', () => {
  const letters = { offset: mod({ kind: 'letters' }) };
  const one = runChain(TEXT, [...TAGGED], [stampStep('a', { modulators: letters })], { morphology: morphology() });
  assert.equal(output(one), 'Le chat4 dort sur la chaise6.');
  assert.deepEqual(one.modulation[0]!.words.get(1)!.values, { offset: 4 });
  const two = runChain(TEXT, [...TAGGED], [stampStep('a', { modulators: letters }), stampStep('b', { modulators: letters })], { morphology: morphology() });
  // « chat4 » a 4 lettres ; « chaise6 » en a 6.
  assert.equal(output(two), 'Le chat44 dort sur la chaise66.');
});

test('chaîne : le verrou l’emporte sur le modulateur, le pas bouché reste intact', () => {
  const result = runChain(TEXT, [...TAGGED], [stampStep('a', { modulators: { offset: mod({ kind: 'letters' }) }, locks: new Map([[5, { offset: 1 }]]), closed: new Set([1]) })], {
    morphology: morphology(),
  });
  assert.equal(output(result), 'Le chat dort sur la chaise1.');
});

test('chaîne : la porte d’une instance ne ferme rien pour la suivante, et sa raison est dite', () => {
  const gate = GateSchema.parse({ source: { kind: 'letters' }, test: { kind: 'at-least', k: 5 } });
  const result = runChain(TEXT, [...TAGGED], [stampStep('a', { gate }), stampStep('b')], { morphology: morphology() });
  assert.equal(output(result), 'Le chat9 dort sur la chaise99.');
  const alone = runChain(TEXT, [...TAGGED], [stampStep('a', { gate })], { morphology: morphology() });
  assert.equal(alone.marks.get(1)!.reason, GATE_CLOSED);
  assert.deepEqual(alone.modulation[0]!.folded, []);
});

test('chaîne : une étape sans modulateur n’a pas de modulation', () => {
  const result = runChain(TEXT, [...TAGGED], [stampStep('a')], { morphology: morphology() });
  assert.equal(result.modulation[0]!.words.size, 0);
});

test('chaîne : les syllabes se lisent dans les prononciations chargées', () => {
  const result = runChain(TEXT, [...TAGGED], [stampStep('a', { modulators: { offset: mod({ kind: 'syllables' }) } })], rhymeResources());
  assert.deepEqual(result.modulation[0]!.words.get(5)!.values, { offset: 1 });
});

test('chaîne : un vrai S+n modulé par les lettres', () => {
  const text = 'Le chat dort.';
  const fixed = runChain(text, tag(text), [{ id: 's7', plugin: s7Plugin, values: { ...s7Plugin.defaults, offset: 4 }, targets: NOUNS }], { morphology: morphology() });
  const modulated = runChain(text, tag(text), [{ id: 's7', plugin: s7Plugin, values: s7Plugin.defaults, targets: NOUNS, modulators: { offset: mod({ kind: 'letters' }) } }], {
    morphology: morphology(),
  });
  assert.equal(output(modulated), output(fixed));
});

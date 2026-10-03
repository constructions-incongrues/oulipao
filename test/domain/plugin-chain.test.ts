import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES } from '../../src/domain/categories.ts';
import { plainWords } from '../../src/domain/mixing.ts';
import { definePlugin, WordMarkSchema, type ConstraintPlugin } from '../../src/domain/plugin.ts';
import { runChain, type ChainStep } from '../../src/domain/plugin-chain.ts';
import { lipogramPlugin } from '../../src/domain/lipogram/plugin.ts';
import { s7Plugin } from '../../src/domain/s7/plugin.ts';
import { morphology, tag, verbs } from '../support/morphology.ts';

const resources = { morphology: morphology() };
/** Une instance de la chaîne, sur les pistes par défaut de son type. */
const step = (plugin: ConstraintPlugin, values: Record<string, string | number>) => ({ id: plugin.id, plugin, values, targets: new Set(plugin.defaultTargets) });
const join = (words: { gap: string; output: string }[], tail: string) => words.map((w) => w.gap + w.output).join('') + tail;

/** Un plugin d'essai sur toutes les pistes : retire les mots qui contiennent une lettre, laisse les autres. */
const without = (letter: string): ConstraintPlugin =>
  definePlugin({
    id: `sans-${letter}`,
    name: 'Sans',
    tracks: [...CATEGORIES],
    defaultTargets: [...CATEGORIES],
    parameters: [],
    defaults: {},
    parse: (values) => values,
    acts: () => true,
    title: () => 'Sans',
    label: () => `sans ${letter}`,
    help: () => '',
    apply(text, tagged) {
      const { words, tail } = plainWords(text);
      const marks = [];
      for (const [i, word] of tagged.entries()) {
        if (!word.word.includes(letter)) continue;
        words[i] = { ...words[i]!, output: '', gap: '' };
        marks.push({ index: i, original: word.word, removed: true as const });
      }
      return { words, tail, marks };
    },
  });

/** Un plugin d'essai qui remplace un mot par plusieurs, pour éprouver le retour aux mots d'origine. */
const expand: ConstraintPlugin = definePlugin({
  ...without('x'),
  id: 'deplie',
  apply(text) {
    const { words, tail } = plainWords(text);
    const index = words.findIndex((w) => w.output === 'du');
    const marks = [];
    if (index >= 0) {
      words[index] = { ...words[index]!, output: 'de la' };
      marks.push({ index, original: 'du', replacement: 'de la' });
    }
    return { words, tail, marks: [...marks, { index: words.length - 1, original: words.at(-1)!.output, reason: 'essai' }] };
  },
});

test('sans plugin : le texte tel quel, aucune marque', () => {
  const text = 'La ferme dort.';
  const result = runChain(text, tag(text), [], resources);
  assert.equal(join(result.words, result.tail), text);
  assert.equal(result.marks.size, 0);
  assert.deepEqual(result.steps, []);
});

test('un seul plugin : exactement sa sortie et ses marques', () => {
  const text = 'La vieille ferme du village dort.';
  const alone = s7Plugin.apply(text, tag(text), { offset: 1 }, resources, new Set(['noun']));
  const result = runChain(text, tag(text), [step(s7Plugin, { offset: 1 })], resources);
  assert.deepEqual(result.words, alone.words);
  assert.equal(result.tail, alone.tail);
  assert.deepEqual(result.steps, [{ id: 's7', replaced: 2, removed: 0, kept: 0 }]);
  assert.deepEqual(result.marks.get(2), { index: 2, original: 'ferme', replacement: 'fermoir' });
});

test('deux plugins : le second lit la sortie du premier, ramenée aux mots d’origine', () => {
  const text = 'La ferme du village dort.';
  const tagged = tag(text);
  // S+1 : « Le fermoir de la ville dort. » — « du » devient « de la », deux mots relus pour un mot d'origine.
  const result = runChain(text, tagged, [step(s7Plugin, { offset: 1 }), step(without('v'), {})], resources);
  assert.equal(join(result.words, result.tail), 'Le fermoir de la dort.');
  assert.equal(result.words.length, tagged.length);
  assert.equal(result.words[2]!.output, 'de la');
  // « village » remplacé par « ville », puis retiré : la marque garde le mot d'origine.
  assert.deepEqual(result.marks.get(3), { index: 3, original: 'village', removed: true });
  assert.deepEqual(result.marks.get(1), { index: 1, original: 'ferme', replacement: 'fermoir' });
  assert.deepEqual(result.steps.map((s) => s.id), ['s7', 'sans-v']);
  // chaque étape, alignée sur les mots d'origine : la contraction reste à sa place, le mot retiré est vide
  assert.deepEqual(result.stages, [
    ['Le', 'fermoir', 'de la', 'ville', 'dort'],
    ['Le', 'fermoir', 'de la', '', 'dort'],
  ]);
});

test('un mot remplacé par plusieurs, puis relu par un autre plugin', () => {
  const text = 'La ferme du village.';
  const result = runChain(text, tag(text), [step(expand, {}), step(s7Plugin, { offset: 1 })], resources);
  assert.equal(result.words[2]!.output, 'de la');
  assert.deepEqual(result.marks.get(2), { index: 2, original: 'du', replacement: 'de la' });
  // laissé tel quel par le premier plugin, remplacé par le second
  assert.deepEqual(result.marks.get(3), { index: 3, original: 'village', replacement: 'ville' });
  // un mot laissé tel quel après avoir été remplacé garde sa marque de remplacement
  const twice = runChain(text, tag(text), [step(s7Plugin, { offset: 1 }), step(expand, {})], resources);
  assert.deepEqual(twice.marks.get(3), { index: 3, original: 'village', replacement: 'ville' });
  assert.deepEqual(twice.steps.at(-1), { id: 'deplie', replaced: 0, removed: 0, kept: 1 });
});

test('une sortie qui ne suit pas les mots du texte est refusée', () => {
  const broken: ConstraintPlugin = { ...without('x'), id: 'casse', apply: () => ({ words: [], tail: '', marks: [] }) };
  assert.throws(() => runChain('La ferme.', tag('La ferme.'), [step(broken, {})], resources), /casse : la sortie ne suit pas/);
});

test('contrat : portée « toutes les pistes » et mot retiré', () => {
  assert.deepEqual(without('e').tracks, [...CATEGORIES]);
  assert.equal(WordMarkSchema.parse({ index: 0, original: 'le', removed: true }).removed, true);
  assert.throws(() => WordMarkSchema.parse({ index: 0, original: 'le', removed: false }));
});

test('portée par mot : pas bouchés et verrous traduits en positions du texte relu', () => {
  const received: unknown[] = [];
  const recorder: ConstraintPlugin = definePlugin({
    ...without('x'),
    id: 'enregistreur',
    apply(text, _tagged, _values, _resources, _targets, scope) {
      received.push(scope);
      return { ...plainWords(text), marks: [] };
    },
  });
  const text = 'La ferme du village.';
  const locks = new Map([[3, { offset: 1 }]]);
  // « du » devient « de la » au premier pas : relu en deux mots, tous deux sautés.
  runChain(text, tag(text), [step(expand, {}), { ...step(recorder, {}), closed: new Set([2]), locks }], resources);
  assert.deepEqual(received.at(-1), { skip: [2, 3], overrides: [{ index: 4, values: { offset: 1 } }] });
  // Sans pas bouché ni verrou : une portée vide.
  runChain(text, tag(text), [step(recorder, {})], resources);
  assert.deepEqual(received.at(-1), { skip: [], overrides: [] });
});

test('S+7 sur les verbes puis lipogramme en e : un verbe sans « e », au même temps', () => {
  const text = 'je dors';
  const steps: ChainStep[] = [
    { id: 'v7', plugin: s7Plugin, values: { offset: -1 }, targets: new Set(['verb'] as const) },
    { id: 'lipo', plugin: lipogramPlugin, values: { letter: 'e' }, targets: new Set(['verb'] as const) },
  ];
  // dormir −1 → chanter (« chante », avec un « e »), puis le premier verbe suivant sans « e » à la 1re personne : dormir.
  const chain = runChain(text, tag(text, { je: 'other', dors: 'verb' }), steps, { ...resources, verbs: verbs() });
  assert.deepEqual(chain.stages.map((stage) => stage[1]), ['chante', 'dors']);
});

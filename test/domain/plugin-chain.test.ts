import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES } from '../../src/domain/categories.ts';
import { plainWords } from '../../src/domain/mixing.ts';
import { definePlugin, WordMarkSchema, type ConstraintPlugin } from '../../src/domain/plugin.ts';
import { runChain, type ChainStep } from '../../src/domain/plugin-chain.ts';
import { lipogramPlugin } from '../../src/domain/lipogram/plugin.ts';
import { s7Plugin } from '../../src/domain/s7/plugin.ts';
import { trackSortPlugin } from '../../src/domain/track-sort/plugin.ts';
import { edgePlugin } from '../../src/domain/edge/plugin.ts';
import { lineationPlugin } from '../../src/domain/lineation/plugin.ts';
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
  assert.deepEqual(result.steps, [{ id: 's7', replaced: 2, removed: 0, relaid: 0, kept: 0 }]);
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
  assert.deepEqual(result.stages.map((stage) => stage.map((word) => word.output)), [
    ['Le', 'fermoir', 'de la', 'ville', 'dort'],
    ['Le', 'fermoir', 'de la', '', 'dort'],
  ]);
  assert.ok(result.stages.flat().every((word) => !word.newline));
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
  assert.deepEqual(twice.steps.at(-1), { id: 'deplie', replaced: 0, removed: 0, relaid: 0, kept: 1 });
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
  // La position d'origine de chaque mot relu suit : « de » et « la » viennent tous deux de « du » (2).
  assert.deepEqual(received.at(-1), { skip: [2, 3], overrides: [{ index: 4, values: { offset: 1 } }], origin: [0, 1, 2, 2, 3] });
  // Sans pas bouché ni verrou : une portée vide.
  runChain(text, tag(text), [step(recorder, {})], resources);
  assert.deepEqual(received.at(-1), { skip: [], overrides: [], origin: [0, 1, 2, 3] });
});

test('S+7 sur les verbes puis lipogramme en e : un verbe sans « e », au même temps', () => {
  const text = 'je dors';
  const steps: ChainStep[] = [
    { id: 'v7', plugin: s7Plugin, values: { offset: -1 }, targets: new Set(['verb'] as const) },
    { id: 'lipo', plugin: lipogramPlugin, values: { letters: 'e' }, targets: new Set(['verb'] as const) },
  ];
  // dormir −1 → chanter (« chante », avec un « e »), puis le premier verbe suivant sans « e » à la 1re personne : dormir.
  const chain = runChain(text, tag(text, { je: 'other', dors: 'verb' }), steps, { ...resources, verbs: verbs() });
  assert.deepEqual(chain.stages.map((stage) => stage[1]!.output), ['chante', 'dors']);
});

test('lipogrammes enchaînés : chacun respecte aussi les lettres bannies avant lui', () => {
  const text = 'La ferme dort.';
  const steps: ChainStep[] = ['a', 'e'].map((letter) => step(lipogramPlugin, { letters: letter }));
  // en a : « La » → « Une » ; en e, sans le cumul, « Une » redeviendrait « La » et « ferme » « maison ».
  // Ici « Une » n'a pas d'équivalent sans a ni e (retiré) et « ferme » pas de voisin (gardé).
  const chain = runChain(text, tag(text), steps, resources);
  assert.equal(join(chain.words, chain.tail), 'Ferme dort.');
  // Hors chaîne, les réglages ne bougent pas ; un lipogramme qui ouvre la chaîne n'hérite de rien.
  assert.deepEqual(lipogramPlugin.inherit!({ letters: 'e' }, [{ letters: 'a' }, { letters: 'i' }]), { letters: 'e', banned: 'ai' });
  assert.deepEqual(lipogramPlugin.inherit!({ letters: 'e' }, []), { letters: 'e', banned: '' });
  // Permises puis interdites : le second cumule les lettres que le premier bannit et la sienne.
  const inherited = lipogramPlugin.inherit!({ letters: 'u' }, [{ letters: 'lucie', mode: 'allowed' }]);
  assert.equal(inherited['banned'], 'abdfghjkmnopqrstvwxyz');
});

/** Un plugin d'essai qui met chaque mot à la ligne, sans le changer. */
const lineByLine = definePlugin({
  id: 'ligne',
  name: 'Ligne',
  targetable: false,
  tracks: [...CATEGORIES],
  defaultTargets: [...CATEGORIES],
  parameters: [],
  defaults: {},
  parse: (values) => values,
  acts: () => true,
  title: () => 'Ligne',
  label: () => 'ligne',
  help: () => '',
  apply(text) {
    const { words, tail } = plainWords(text);
    const marks = words.slice(1).map((word) => {
      word.gap = '\n';
      return { index: word.index, original: word.output, relaid: true as const };
    });
    return { words, tail, marks };
  },
});

test('remis en ligne : compté, sans effacer un remplacement ; l’étape note les sauts nouveaux', () => {
  const text = 'La ferme dort.';
  const result = runChain(text, tag(text), [step(s7Plugin, { offset: 1 }), step(lineByLine, {})], resources);
  assert.equal(join(result.words, result.tail), 'Le\nfermoir\ndort.'); // l'article suit le nouveau nom
  assert.deepEqual(result.steps.at(-1), { id: 'ligne', replaced: 0, removed: 0, relaid: 2, kept: 0 });
  assert.deepEqual(result.marks.get(1), { index: 1, original: 'ferme', replacement: 'fermoir' }); // le remplacement l'emporte
  assert.deepEqual(result.marks.get(2), { index: 2, original: 'dort', relaid: true });
  assert.deepEqual(result.stages.map((stage) => stage.map((word) => word.newline)), [[false, false, false], [false, true, true]]);
  // Remis en ligne une seconde fois : le saut n'est plus nouveau.
  const twice = runChain(text, tag(text), [step(lineByLine, {}), { ...step(lineByLine, {}), id: 'encore' }], resources);
  assert.deepEqual(twice.stages[1]!.map((word) => word.newline), [false, false, false]);
});

test('S+dé après un retrait en amont : chaque nom garde sa face de dé, l’étape amont coupée ou non', () => {
  const text = 'Ici le chat voit vite le cheval et la ferme.';
  const dice = { draw: 'dice', seed: 2461318 };
  const sort = { ...step(trackSortPlugin, { mode: 'remove' }), targets: new Set(['adverb'] as const) };
  const alone = runChain(text, tag(text), [step(s7Plugin, dice)], resources);
  const after = runChain(text, tag(text), [sort, step(s7Plugin, dice)], resources);
  const nouns = tag(text).flatMap((word, index) => (word.category === 'noun' ? [index] : []));
  assert.ok(nouns.length >= 3);
  // Les adverbes « Ici » et « vite », retirés en amont, décaleraient les positions des noms suivants.
  for (const index of nouns) assert.equal(after.words[index]!.output, alone.words[index]!.output, tag(text)[index]!.word);
});

test('volume : le coût de la chaîne croît avec le texte, pas avec son carré', () => {
  const steps = [
    { ...step(trackSortPlugin, { mode: 'remove' }), values: trackSortPlugin.parse({ mode: 'remove' }) },
    { ...step(edgePlugin, {}), values: edgePlugin.parse({}) },
    { ...step(lineationPlugin, {}), values: lineationPlugin.parse({}) },
  ];
  // 40 000 mots : en linéaire, quelques centaines de ms ; en quadratique, plusieurs secondes
  // (6,2 s mesurés avant la linéarisation, 0,2 s après). Le seuil laisse un facteur 5 de chaque côté,
  // pour une machine lente ou une suite qui tourne en parallèle.
  const text = Array.from({ length: 40000 / 5 }, () => 'Le chat dort très vite.').join(' ');
  const tagged = tag(text);
  const start = performance.now();
  runChain(text, tagged, steps, resources);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 1500, `40 000 mots en ${Math.round(elapsed)} ms`);
});

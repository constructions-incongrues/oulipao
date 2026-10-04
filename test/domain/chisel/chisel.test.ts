import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, type Category } from '../../../src/domain/categories.ts';
import { chiselPlugin, tierOf } from '../../../src/domain/chisel/plugin.ts';
import { BREATH, firstWrittenSyllable, initialOf, vowelsOf } from '../../../src/domain/chisel/tiers.ts';
import { definePlugin, visibleParameters, type WordScope } from '../../../src/domain/plugin.ts';
import { installedPlugins } from '../../../src/domain/registry.ts';
import { morphology, tag } from '../../support/morphology.ts';

const CATS: Record<string, Category> = { vieux: 'adjective', chat: 'noun', dort: 'verb', Vieux: 'adjective' };
const run = (text: string, values: Record<string, number> = {}, scope?: WordScope) => {
  const result = chiselPlugin.apply(text, tag(text, CATS), chiselPlugin.parse(values), { morphology: morphology() }, new Set(CATEGORIES), scope);
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};
const LINE = 'Le vieux chat dort';
const poem = (n: number) => Array.from({ length: n }, () => LINE).join('\n');

test('tiers : syllabe écrite, voyelles, initiale, souffle', () => {
  assert.deepEqual(['vieux', 'chat', 'dort', 'pff', 'arbre'].map(firstWrittenSyllable), ['vieu', 'cha', 'dor', 'pff', 'ar']);
  assert.deepEqual(['vieux', 'chat', 'dort', 'Oulipo', 'pff'].map(vowelsOf), ['ieu', 'a', 'o', 'Ouio', 'p']);
  assert.equal(initialOf('vieux'), 'v');
  assert.equal(initialOf(''), '');
  assert.equal(BREATH, 'pfou');
});

test('tierOf : premier vers intact, puis un palier tous les k vers, borné au palier final', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => tierOf(n, 5, 1)), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => tierOf(n, 2, 1)), [0, 1, 2, 2, 2, 2]);
  assert.deepEqual([0, 1, 2, 3, 4].map((n) => tierOf(n, 5, 2)), [0, 1, 1, 2, 2]);
});

test('Ciselure : la descente, vers par vers, jusqu’au souffle', () => {
  assert.equal(run(poem(6)).text, ['Le vieux chat dort', 'vieux chat dort', 'vieu cha dor', 'ieu a o', 'v c d', 'pfou pfou pfou'].join('\n'));
});

test('Ciselure : palier final et deux vers par palier', () => {
  assert.equal(run(poem(4), { final: 2 }).text.split('\n').at(-1), 'vieu cha dor');
  assert.deepEqual(run(poem(5), { perTier: 2 }).text.split('\n'), ['Le vieux chat dort', 'vieux chat dort', 'vieux chat dort', 'vieu cha dor', 'vieu cha dor']);
});

test('Ciselure : un pas bouché garde son mot ; les marques disent ce qui a changé', () => {
  const closed = run(poem(5), {}, { skip: [4 * 4 + 2], overrides: [] });
  assert.equal(closed.text.split('\n').at(-1), 'v chat d');
  assert.ok(closed.marks.some((mark) => mark.index === 18 && mark.reason === 'pas bouché'));
  assert.ok(closed.marks.some((mark) => mark.index === 4 && mark.removed));
  assert.ok(closed.marks.some((mark) => mark.index === 9 && mark.replacement === 'vieu'));
});

test('Ciselure : un texte d’un seul vers ne change pas, et l’aide invite à une Mise en vers', () => {
  const prose = 'Le vieux chat dort. Le vieux chat dort.';
  assert.equal(run(prose).text, prose);
  assert.match(chiselPlugin.help(chiselPlugin.defaults), /placez une Mise en vers avant la Ciselure/);
});

test('Ciselure : déclarée, inscrite, réglable, nommée', () => {
  assert.equal(definePlugin(chiselPlugin), chiselPlugin);
  assert.ok(installedPlugins.includes(chiselPlugin));
  assert.equal(chiselPlugin.targetable, false);
  assert.deepEqual(visibleParameters(chiselPlugin, chiselPlugin.defaults).map((p) => p.key), ['final', 'perTier']);
  assert.deepEqual(chiselPlugin.defaults, { final: 5, perTier: 1 });
  assert.equal(chiselPlugin.title(chiselPlugin.defaults), 'Ciselure');
  assert.equal(chiselPlugin.label({ final: 3, perTier: 2 }), 'ciselure jusqu’au palier voyelles, 2 vers par palier');
  assert.match(chiselPlugin.help({ final: 2, perTier: 2 }), /tous les 2 vers : mots pleins, puis syllabe\./);
  assert.ok(chiselPlugin.acts(chiselPlugin.defaults));
  assert.throws(() => chiselPlugin.parse({ final: 6 }));
});

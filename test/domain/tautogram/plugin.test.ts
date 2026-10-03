import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Category } from '../../../src/domain/categories.ts';
import { assignLetters } from '../../../src/domain/tautogram/cycle.ts';
import { tautogramPlugin } from '../../../src/domain/tautogram/plugin.ts';
import type { TaggedWord } from '../../../src/domain/tagged-word.ts';
import { AUXILIARY, LOADING } from '../../../src/domain/verb.ts';
import { morphology, tag, verbs } from '../../support/morphology.ts';

const m = morphology();
const v = verbs();
const ALL: Category[] = ['noun', 'adjective', 'verb', 'adverb'];
const run = (text: string, letters: string, targets: Iterable<Category> = ALL, extra = {}, withVerbs = true, skip: number[] = []) => {
  const result = tautogramPlugin.apply(text, tag(text, extra), { letters }, { morphology: m, verbs: withVerbs ? v : undefined }, new Set(targets), { skip, overrides: [] });
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};

test('déclaration : quatre pistes visées, « Lettres » à « oulipo »', () => {
  assert.deepEqual(tautogramPlugin.tracks, ALL);
  assert.deepEqual(tautogramPlugin.defaultTargets, ALL);
  assert.deepEqual(tautogramPlugin.defaults, { letters: 'oulipo' });
  assert.equal(tautogramPlugin.parameters[0]?.kind, 'text');
  assert.throws(() => tautogramPlugin.parse({ letters: 'x'.repeat(41) }));
  assert.equal(tautogramPlugin.title({}), 'Tautogramme progressif en oulipo');
  assert.equal(tautogramPlugin.label({ letters: ' Hélène-Marie ' }), 'tautogramme progressif en Hélène-Marie');
  assert.match(tautogramPlugin.help({ letters: 'Hélène-Marie' }), /h, e, l, e, n, e, m, a, r, i, e, en boucle/);
  assert.match(tautogramPlugin.help({}), /mots-outils ne comptent pas/);
  assert.equal(tautogramPlugin.acts({}), true);
});

test('aucune lettre saisie : le tautogramme n’agit pas et le dit', () => {
  assert.equal(tautogramPlugin.acts({ letters: '12 !' }), false);
  assert.equal(tautogramPlugin.title({ letters: '' }), 'Tautogramme progressif');
  assert.equal(tautogramPlugin.label({ letters: '' }), 'tautogramme progressif sans lettre');
  assert.match(tautogramPlugin.help({ letters: '' }), /Aucune lettre saisie/);
  assert.equal(run('Le chat dort.', '').text, 'Le chat dort.');
});

test('cycle : les mots visés prennent les lettres en boucle ; mots-outils, autres pistes et pas bouchés n’en prennent pas', () => {
  const words: TaggedWord[] = ['le', 'chat', 'mange', 'la', 'souris', 'près', 'du', 'chien'].map((word) => ({
    word,
    category: ['chat', 'souris', 'chien'].includes(word) ? 'noun' : word === 'mange' ? 'verb' : 'other',
  }));
  assert.deepEqual([...assignLetters(words, new Set(['noun']), new Set(), ['a', 'b'])], [[1, 'a'], [4, 'b'], [7, 'a']]);
  assert.deepEqual([...assignLetters(words, new Set(['noun', 'verb']), new Set([2]), ['a', 'b'])], [[1, 'a'], [4, 'b'], [7, 'a']]);
  assert.deepEqual([...assignLetters(words, new Set(['noun']), new Set(), [])], []);
});

test('noms : premier voisin à l’initiale, groupe réaccordé et élision', () => {
  const { text, marks } = run('Le chat dort près du village.', 'ao', ['noun']);
  assert.equal(text, "L'arbre dort près de l'oncle.");
  assert.deepEqual(marks.filter((mark) => mark.replacement).map((mark) => [mark.original, mark.replacement]), [['chat', 'arbre'], ['village', 'oncle']]);
});

test('un mot déjà à la bonne lettre reste, mais prend sa lettre', () => {
  const { text, marks } = run('Le chat et le village.', 'cv', ['noun']);
  assert.equal(text, 'Le chat et le village.');
  assert.deepEqual(marks, []);
});

test('initiale accentuée : « é » compte pour « e »', () => {
  assert.equal(run('La ferme dort.', 'e', ['noun']).text, "L'école dort.");
});

test('adjectifs et adverbes', () => {
  assert.equal(run('Le petit chat court vite.', 'gb', ['adjective', 'adverb'], { court: 'other' }).text, 'Le gris chat court bien.');
});

test('verbes : même temps, même personne ; « être » et « avoir » restent mais prennent leur lettre', () => {
  assert.equal(run('elle mangeait', 'd', ['verb'], { mangeait: 'verb' }).text, 'elle dormait');
  const { marks, text } = run('Le chat est là et mangeait.', 'xd', ['verb'], { mangeait: 'verb' });
  assert.equal(text, 'Le chat est là et dormait.');
  assert.deepEqual(marks.find((mark) => mark.original === 'est'), { index: 2, original: 'est', reason: AUXILIARY });
  assert.deepEqual(run('elle mangeait', 'd', ['verb'], { mangeait: 'verb' }, false).marks, [{ index: 1, original: 'mangeait', reason: LOADING }]);
});

test('aucun voisin : le mot reste avec sa raison, le suivant prend la lettre d’après', () => {
  const { text, marks } = run('Le chat et le village.', 'zo', ['noun']);
  assert.equal(text, "Le chat et l'oncle.");
  assert.deepEqual(marks.find((mark) => mark.original === 'chat'), { index: 1, original: 'chat', reason: "aucun voisin à l'initiale z" });
  assert.deepEqual(run('Le petit chat.', 'z', ['adjective']).marks, [{ index: 1, original: 'petit', reason: "aucun voisin à l'initiale z" }]);
});

test('pas bouché : le mot est laissé et ne prend pas de lettre', () => {
  assert.equal(run('Le chat et le village.', 'ao', ['noun'], {}, true, [1]).text, "Le chat et l'arbre.");
});

test('le voisin part du mot à l’initiale changée, pas du début de la lettre', () => {
  // « village » vers « h » part de « hillage » : « héros » le précède, « hôtel » est le premier masculin qui suit.
  assert.equal(run('Le village dort.', 'h', ['noun']).text, "L'hôtel dort.");
  // « camion » vers « h » part de « hamion » : « héros » vient d'abord.
  assert.equal(run('Le camion dort.', 'h', ['noun']).text, 'Le héros dort.');
});

test('article rétabli : « l’ » devant un adjectif ou un adverbe nouveau à initiale consonantique', () => {
  assert.equal(run("L'enceinte maison.", 'r', ['adjective']).text, 'La rapide maison.');
  assert.equal(run('Elle voit l’ici.', 'v', ['adverb']).text, 'Elle voit le vite.');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installedPlugins, recipeById, recipes, reduce, initialState } from '../../../src/ui/tracks/mixer-state.ts';
import { julianDay, RECIPES, validRecipes, type Recipe } from '../../../src/ui/tracks/recipes.ts';
import { MixerStateSchema, type MixerAction } from '../../../src/ui/tracks/types.ts';
import { seededState } from '../../support/chain.ts';

const TODAY = '2026-10-03';
const add = (recipe: string, choice?: string, state = initialState) =>
  MixerStateSchema.parse(reduce(state, { type: 'add-recipe', recipe, choice, today: TODAY } as MixerAction));
const summary = (state: ReturnType<typeof add>) => state.instances.map((i) => `${i.id} ${JSON.stringify(i.params)} ${i.targets.join(',')}`);

test('les quinze recettes tiennent toutes, par ordre alphabétique', () => {
  assert.equal(recipes.length, 15);
  assert.deepEqual(recipes, RECIPES);
  const names = recipes.map((recipe) => recipe.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'fr')));
  assert.ok(recipes.every((recipe) => recipe.url.startsWith('https://oulipo.net/contraintes/')));
});

test('une recette invalide est écartée', () => {
  const unknown: Recipe = { ...RECIPES[0]!, id: 'x', build: () => [{ type: 'inconnu', params: {}, targets: ['noun'] }] };
  const badParams: Recipe = { ...RECIPES[0]!, id: 'y', build: () => [{ type: 'lipogram', params: { letters: 'x'.repeat(41) }, targets: ['noun'] }] };
  const badTrack: Recipe = { ...RECIPES[0]!, id: 'z', choice: undefined, build: () => [{ type: 's7', params: {}, targets: ['adverb'] }] };
  const badUrl: Recipe = { ...RECIPES[0]!, id: 'u', url: 'ailleurs' };
  assert.deepEqual(validRecipes([unknown, badParams, badTrack, badUrl, recipeById('prisonnier')], installedPlugins).map((r) => r.id), ['prisonnier']);
  assert.throws(() => recipeById('inconnue'), /recette inconnue/);
});

test('Monovocalisme en a : un lipogramme sur les cinq autres voyelles, en fin de chaîne', () => {
  const state = add('monovocalisme', 'a', seededState);
  assert.deepEqual(state.instances.map((i) => i.id), ['s7-1', 'lipogram-1', 'lipogram-2']);
  assert.deepEqual(state.instances[2]!.params, { letters: 'eiouy', mode: 'forbidden' });
  assert.ok(state.instances[2]!.enabled && state.instances[2]!.targets.length === 5);
  assert.deepEqual(add('bivocalisme', 'ou').instances.map((i) => i.params), [{ letters: 'aeiy', mode: 'forbidden' }]);
});

test('Contrainte du prisonnier : une instance au lieu de douze', () => {
  assert.deepEqual(add('prisonnier').instances.map((i) => i.params), [{ letters: 'bdfghjklpqty', mode: 'forbidden' }]);
});

test('Beau présent : un lipogramme en lettres permises, sans lettre tant que le nom n’est pas tapé', () => {
  const state = add('beau-present');
  assert.deepEqual(state.instances.map((i) => i.params), [{ letters: '', mode: 'allowed' }]);
  assert.match(recipeById('beau-present').rule, /tapez ce nom/);
  const named = MixerStateSchema.parse(reduce(state, { type: 'set-param', id: state.instances[0]!.id, key: 'letters', value: 'Lucie' }));
  assert.deepEqual(named.instances[0]!.params, { letters: 'Lucie', mode: 'allowed' });
});

test('Liponymie, Inventaire, La rien que la toute la : un tri par piste', () => {
  assert.deepEqual(summary(add('liponymie', 'adjective')), ['track-sort-1 {"mode":"remove","layout":"as-is"} adjective']);
  assert.deepEqual(summary(add('inventaire', 'noun')), ['track-sort-1 {"mode":"keep","layout":"one-per-line"} noun']);
  assert.deepEqual(summary(add('la-rien-que')), ['track-sort-1 {"mode":"remove","layout":"as-is"} noun,verb,adjective']);
});

test('Bord et Mise en vers : Haï-kaïsation, Intérieur, Poème de bandit, Juliennes du jour', () => {
  assert.deepEqual(add('hai-kaisation').instances[0]!.params, { mode: 'ends', n: 1 });
  assert.deepEqual(add('interieur').instances[0]!.params, { mode: 'inside', n: 1 });
  assert.deepEqual(add('bandit').instances[0]!.params, { cut: 'every', n: 6, number: 1234567 });
  assert.equal(add('juliennes').instances[0]!.params['number'], 2461317);
  assert.equal(julianDay(new Date(2000, 0, 1)), 2451545);
});

test('choix au branchement : obligatoire et pris dans la liste', () => {
  assert.throws(() => add('liponymie'), /choix refusé/);
  assert.throws(() => add('liponymie', 'pronom'), /choix refusé/);
  assert.throws(() => add('prisonnier', 'a'), /choix refusé/);
  assert.throws(() => reduce(initialState, { type: 'add-recipe', recipe: 'prisonnier', today: '3 octobre' } as MixerAction));
});

test('Tautogramme et Abécédaire : un tautogramme progressif sur les noms, adjectifs, verbes et adverbes', () => {
  assert.deepEqual(summary(add('tautogramme', 'p')), ['tautogram-1 {"letters":"p"} noun,verb,adjective,adverb']);
  assert.deepEqual(summary(add('abecedaire')), ['tautogram-1 {"letters":"abcdefghijklmnopqrstuvwxyz"} noun,verb,adjective,adverb']);
  assert.equal(recipeById('tautogramme').choice!.options.length, 26);
  for (const id of ['tautogramme', 'abecedaire']) assert.match(recipeById(id).rule, /mots-outils ne comptent pas/);
});

test('Éclipse : un S+7 sur les noms et la forme éclipse, qui remplace la forme courante', () => {
  const rondel = MixerStateSchema.parse(reduce(initialState, { type: 'set-form', form: 'rondel' }));
  const state = add('eclipse', undefined, rondel);
  assert.deepEqual(summary(state), ['s7-1 {"offset":7,"mode":"reagree","draw":"fixed","seed":1} noun']);
  assert.equal(state.form, 'eclipse');
  assert.equal(add('monovocalisme', 'a', rondel).form, 'rondel'); // une recette sans forme laisse la forme
});

test('S+dé le 4 octobre 2026 : un S+n au dé sur les noms, de graine 2461318', () => {
  const state = MixerStateSchema.parse(reduce(initialState, { type: 'add-recipe', recipe: 's-de', today: '2026-10-04' }));
  assert.deepEqual(summary(state), ['s7-1 {"offset":7,"mode":"reagree","draw":"dice","seed":2461318} noun']);
});

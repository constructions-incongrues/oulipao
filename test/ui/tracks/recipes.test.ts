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

test('les dix recettes tiennent toutes, par ordre alphabétique', () => {
  assert.equal(recipes.length, 10);
  assert.deepEqual(recipes, RECIPES);
  const names = recipes.map((recipe) => recipe.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'fr')));
  assert.ok(recipes.every((recipe) => recipe.url.startsWith('https://oulipo.net/contraintes/')));
});

test('une recette invalide est écartée', () => {
  const unknown: Recipe = { ...RECIPES[0]!, id: 'x', build: () => [{ type: 'inconnu', params: {}, targets: ['noun'] }] };
  const badParams: Recipe = { ...RECIPES[0]!, id: 'y', build: () => [{ type: 'lipogram', params: { letter: 'é' }, targets: ['noun'] }] };
  const badTrack: Recipe = { ...RECIPES[0]!, id: 'z', choice: undefined, build: () => [{ type: 's7', params: {}, targets: ['adverb'] }] };
  const badUrl: Recipe = { ...RECIPES[0]!, id: 'u', url: 'ailleurs' };
  assert.deepEqual(validRecipes([unknown, badParams, badTrack, badUrl, RECIPES[1]!], installedPlugins).map((r) => r.id), ['prisonnier']);
  assert.throws(() => recipeById('inconnue'), /recette inconnue/);
});

test('Monovocalisme en a : cinq lipogrammes en fin de chaîne, après ce qui y est', () => {
  const state = add('monovocalisme', 'a', seededState);
  assert.deepEqual(state.instances.map((i) => i.id), ['s7-1', 'lipogram-1', 'lipogram-2', 'lipogram-3', 'lipogram-4', 'lipogram-5', 'lipogram-6']);
  assert.deepEqual(state.instances.slice(2).map((i) => i.params['letter']), ['e', 'i', 'o', 'u', 'y']);
  assert.ok(state.instances.slice(2).every((i) => i.enabled && i.targets.length === 5));
  assert.deepEqual(add('bivocalisme', 'ou').instances.map((i) => i.params['letter']), ['a', 'e', 'i', 'y']);
  assert.deepEqual(add('prisonnier').instances.map((i) => i.params['letter']).join(''), 'bdfghjklpqty');
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

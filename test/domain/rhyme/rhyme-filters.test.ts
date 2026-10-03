import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Category } from '../../../src/domain/categories.ts';
import { PHONETICS_LOADING } from '../../../src/domain/phonetics/lookup.ts';
import type { ConstraintPlugin, ParameterValues, WordScope } from '../../../src/domain/plugin.ts';
import { antirhymePlugin } from '../../../src/domain/rhyme/antirhyme.ts';
import { probe } from '../../../src/domain/rhyme/engine.ts';
import { homophonyPlugin } from '../../../src/domain/rhyme/homophony.ts';
import { monorhymePlugin } from '../../../src/domain/rhyme/monorhyme.ts';
import { rnPlugin } from '../../../src/domain/rhyme/rn.ts';
import { rhymeResources, tagRhymes } from '../../support/phonetics.ts';

const ALL: Category[] = ['noun', 'adjective', 'verb', 'adverb'];

function run(plugin: ConstraintPlugin, text: string, values: ParameterValues = {}, targets: Category[] = ['noun'], scope?: WordScope, phonetics = true) {
  const result = plugin.apply(text, tagRhymes(text), plugin.parse(values), rhymeResources({ phonetics }), new Set(targets), scope);
  return { text: result.words.map((word) => word.gap + word.output).join('') + result.tail, marks: result.marks };
}
const reasons = (marks: ReturnType<typeof run>['marks']) => marks.filter((mark) => mark.reason).map((mark) => `${mark.original} : ${mark.reason}`);

test('R+1 sur « chaise » : le premier nom qui suit et rime en /ɛz/, au féminin singulier', () => {
  const { text, marks } = run(rnPlugin, 'Le chat dort sur la chaise.', { offset: 1 });
  assert.equal(text, 'Le chat dort sur la fraise.');
  assert.deepEqual(marks.find((mark) => mark.original === 'chaise'), { index: 5, original: 'chaise', replacement: 'fraise' });
  assert.deepEqual(reasons(marks), ['chat : aucune rime suffisante']);
});

test('aucun voisin qui rime : à la richesse riche, « chaise » reste', () => {
  const { text, marks } = run(rnPlugin, 'sur la chaise', { offset: 1, richness: 'rich' });
  assert.equal(text, 'sur la chaise');
  assert.deepEqual(reasons(marks), ['chaise : aucune rime riche']);
});

test('R+0 : la contrainte n’agit pas ; R−1 revient en arrière ; le décalage fait le tour du dictionnaire', () => {
  assert.equal(rnPlugin.acts(rnPlugin.parse({ offset: 0 })), false);
  assert.equal(rnPlugin.help({ offset: 0 }), 'R+0 : aucun changement.');
  assert.equal(run(rnPlugin, 'la fraise', { offset: -1 }).text, 'la chaise');
  assert.equal(run(rnPlugin, 'la glaise', { offset: 1 }).text, 'la braise'); // après « glaise », le tour reprend à « braise »
  assert.equal(run(rnPlugin, 'la maison', { offset: 1, richness: 'rich' }).text, 'la raison');
});

test('fins de vers seulement : les autres mots ne changent pas', () => {
  const text = 'la chaise et la maison\nla raison';
  assert.equal(run(rnPlugin, text, { offset: 1, reach: 'line-ends' }).text, 'la chaise et la raison\nla saison');
  assert.equal(run(rnPlugin, text, { offset: 1 }).text, 'la fraise et la raison\nla saison');
});

test('pas bouché et verrou : le mot bouché reste, le mot verrouillé a son propre décalage', () => {
  const text = 'la chaise et la maison';
  const closed = run(rnPlugin, text, { offset: 1 }, ['noun'], { skip: [1], overrides: [] });
  assert.equal(closed.text, 'la chaise et la raison');
  assert.deepEqual(reasons(closed.marks), ['chaise : pas bouché']);
  const locked = run(rnPlugin, text, { offset: 1, richness: 'rich' }, ['noun'], { skip: [], overrides: [{ index: 4, values: { offset: 2 } }] });
  assert.equal(locked.text, 'la chaise et la saison');
  const zero = run(rnPlugin, text, { offset: 1 }, ['noun'], { skip: [], overrides: [{ index: 4, values: { offset: 0 } }] });
  assert.deepEqual(reasons(zero.marks), ['maison : R+0 sur ce mot']);
});

test('adjectifs, adverbes et verbes : accordés, au même temps et à la même personne', () => {
  assert.equal(run(rnPlugin, 'le chat noir', { offset: 1 }, ['adjective']).text, 'le chat notoire');
  assert.deepEqual(reasons(run(rnPlugin, 'le vieux chat', { offset: 1 }, ['adjective']).marks), ['vieux : aucune rime suffisante']);
  assert.equal(run(rnPlugin, 'il dort', { offset: 1 }, ['verb']).text, 'il mord');
  assert.equal(run(rnPlugin, 'il dort', { offset: 2 }, ['verb']).text, 'il sort');
  assert.equal(run(rnPlugin, 'Bien', { offset: 1, richness: 'poor' }, ['adverb']).text, 'Loin');
  assert.deepEqual(reasons(run(rnPlugin, 'vite', { offset: 1, richness: 'rich' }, ['adverb']).marks), ['vite : aucune rime riche']);
  assert.deepEqual(reasons(run(rnPlugin, 'la glorbiture', { offset: 1 }).marks), ['glorbiture : absent du dictionnaire']);
});

test('sans prononciations : chaque mot visé attend, avec la raison du chargement', () => {
  const { text, marks } = run(rnPlugin, 'la chaise et la maison', { offset: 1 }, ['noun'], { skip: [1], overrides: [] }, false);
  assert.equal(text, 'la chaise et la maison');
  assert.deepEqual(reasons(marks), ['chaise : pas bouché', `maison : ${PHONETICS_LOADING}`]);
});

test('R+n : titre, mention et aide', () => {
  assert.equal(rnPlugin.title({ offset: -3 }), 'R−3');
  assert.equal(rnPlugin.label(rnPlugin.parse({ offset: 2 })), 'R+2, rime suffisante');
  assert.equal(rnPlugin.label(rnPlugin.parse({ offset: 3, reach: 'line-ends' })), 'R+3, rime suffisante, fins de vers');
  assert.match(rnPlugin.help({ offset: 1, reach: 'line-ends' }), /^Chaque fin de vers devient le 1er mot/);
  assert.match(rnPlugin.help({ offset: -2 }), /^Chaque mot devient le 2e mot de sa catégorie qui le précède/);
  assert.ok(rnPlugin.phonetic);
});

test('monorime en /ɔ̃/ : chaque fin de vers visée finit en /ɔ̃/, celle qui y est déjà reste', () => {
  const { text, marks } = run(monorhymePlugin, 'sur la chaise\nla maison\nle chat', { rhyme: 'ɔ̃' }, ALL);
  assert.equal(text, 'sur la maison\nla maison\nle chat');
  assert.deepEqual(reasons(marks), ['maison : déjà sur la rime', 'chat : aucun mot sur cette rime']);
  assert.equal(monorhymePlugin.title({ rhyme: 'ɔ̃' }), 'Monorime en /ɔ̃/');
  assert.match(monorhymePlugin.label({ rhyme: 'ɔ̃' }), /^monorime en \/ɔ̃\/ \(.+\)$/);
  assert.match(monorhymePlugin.help({ rhyme: 'ɔ̃' }), /finit en \/ɔ̃\//);
  assert.ok(monorhymePlugin.acts({}));
});

test('antirime : dans un quatrain à rimes plates, les vers 2 et 4 changent et plus rien ne rime', () => {
  const { text, marks } = run(antirhymePlugin, 'la table\nla fable\nla rose\nla chose', {}, ALL);
  assert.equal(text, 'la table\nla fraise\nla rose\nla maison');
  assert.deepEqual(marks.filter((mark) => mark.replacement).map((mark) => mark.original), ['fable', 'chose']);
  // Chaque strophe repart de zéro.
  assert.equal(run(antirhymePlugin, 'la table\n\nla fable', {}, ALL).text, 'la table\n\nla fable');
  // Les verbes, les adjectifs et les adverbes aussi ; le pas bouché reste.
  assert.equal(run(antirhymePlugin, 'il dort\nil sort', {}, ALL).text, 'il dort\nil tombe');
  assert.equal(run(antirhymePlugin, 'noir\nnotoire', {}, ALL).text, 'noir\nvieux');
  assert.equal(run(antirhymePlugin, 'bien\nloin', { richness: 'poor' }, ALL).text, 'bien\nvite');
  assert.deepEqual(reasons(run(antirhymePlugin, 'la table\nla fable', {}, ALL, { skip: [3], overrides: [] }).marks), ['fable : pas bouché']);
  assert.deepEqual(reasons(run(antirhymePlugin, 'la table\nla fable', {}, ALL, undefined, false).marks), [`table : ${PHONETICS_LOADING}`, `fable : ${PHONETICS_LOADING}`]);
  assert.equal(antirhymePlugin.label({}), 'antirime, rime suffisante');
  assert.match(antirhymePlugin.help({ richness: 'rich' }), /rime riche/);
  assert.equal(antirhymePlugin.title({}), 'Antirime');
});

test('homophonies : « vers » devient un homophone de même catégorie ; un mot sans homophone reste', () => {
  assert.equal(run(homophonyPlugin, 'un vers').text, 'un vert');
  assert.equal(run(homophonyPlugin, 'un vers', { offset: 2 }).text, 'un vair');
  assert.equal(run(homophonyPlugin, 'un vers', {}, ['noun'], { skip: [], overrides: [{ index: 1, values: { offset: 3 } }] }).text, 'un ver');
  assert.deepEqual(reasons(run(homophonyPlugin, 'la chaise').marks), ['chaise : aucun homophone']);
  assert.deepEqual(reasons(run(homophonyPlugin, 'la glorbiture').marks), ['glorbiture : aucun homophone']);
  assert.equal(homophonyPlugin.label({ offset: 1 }), 'homophonies');
  assert.equal(homophonyPlugin.label({ offset: 2 }), 'homophonies, rang 2');
  assert.match(homophonyPlugin.help({ offset: 1 }), /le premier mot/);
  assert.match(homophonyPlugin.help({ offset: 3 }), /le 3e mot/);
  assert.equal(homophonyPlugin.title({}), 'Homophonies');
});

test('prévision d’un voisin : sans contexte de phrase, et rien pour une raison ou une piste sans dictionnaire', () => {
  const resources = rhymeResources();
  const always = { offset: 1, accept: () => true, none: '' };
  assert.equal(probe('chaise', 'noun', always, resources), 'chose'); // le premier nom féminin qui suit
  assert.equal(probe('chaise', 'noun', { reason: 'non' }, resources), undefined);
  assert.equal(probe('chaise', 'noun', { ...always, accept: () => false }, resources), undefined);
  assert.equal(probe('le', 'other', always, resources), undefined);
  assert.equal(probe('dort', 'verb', always, { morphology: resources.morphology }), undefined);
  assert.equal(probe('dort', 'verb', { ...always, accept: () => false }, resources), undefined);
});

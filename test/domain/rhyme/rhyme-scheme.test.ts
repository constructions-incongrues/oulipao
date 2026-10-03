import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Category } from '../../../src/domain/categories.ts';
import { PHONETICS_LOADING } from '../../../src/domain/phonetics/lookup.ts';
import type { ParameterValues, WordScope } from '../../../src/domain/plugin.ts';
import { rhymeSchemePlugin } from '../../../src/domain/rhyme/rhyme-scheme.ts';
import { rhymeResources, tagRhymes } from '../../support/phonetics.ts';

const ALL: Category[] = ['noun', 'adjective', 'verb', 'adverb'];

function run(text: string, values: ParameterValues, scope?: WordScope, phonetics = true) {
  const plugin = rhymeSchemePlugin;
  const result = plugin.apply(text, tagRhymes(text), plugin.parse(values), rhymeResources({ phonetics }), new Set(ALL), scope);
  return { text: result.words.map((word) => word.gap + word.output).join('') + result.tail, marks: result.marks };
}
const reasons = (marks: ReturnType<typeof run>['marks']) => marks.filter((mark) => mark.reason).map((mark) => `${mark.original} : ${mark.reason}`);

test('rimes embrassées : le vers 4 rime avec le vers 1, le vers 3 avec le vers 2', () => {
  const { text, marks } = run('la chaise\nla table\nla rose\nla chose', { scheme: 'embrassees' });
  assert.equal(text, 'la chaise\nla table\nla table\nla fraise');
  assert.deepEqual(marks.filter((mark) => mark.replacement).map((mark) => mark.original), ['rose', 'chose']);
});

test('un vers d’une autre lettre qui rime par accident perd la rime', () => {
  assert.equal(run('la chaise\nla fraise', { scheme: 'croisees' }).text, 'la chaise\nla maison'); // « glaise » rime encore
  assert.equal(run('la chaise\nla fraise', { scheme: 'plates' }).text, 'la chaise\nla fraise'); // même lettre : rien à faire
});

test('aucun voisin qui rime : le mot reste, avec sa raison', () => {
  const { text, marks } = run('la chaise\nle chat', { scheme: 'plates' });
  assert.equal(text, 'la chaise\nle chat'); // aucun nom masculin en /ɛz/
  assert.deepEqual(reasons(marks), ['chat : aucun voisin en /ɛz/ (A)']);
  assert.deepEqual(reasons(run('la chaise\nla fraise\nle chat', { scheme: 'croisees' }).marks), ['chat : aucun voisin en /ɛz/ (A)']);
});

test('pas bouché : le mot reste et fixe la rime de sa lettre', () => {
  const { text, marks } = run('la chaise\nla table', { scheme: 'plates' }, { skip: [1], overrides: [] });
  assert.equal(text, 'la chaise\nla braise');
  assert.deepEqual(reasons(marks), ['chaise : pas bouché']);
});

test('rime bisexuelle : trois vers qui riment, deux d’un genre, le troisième de l’autre', () => {
  assert.equal(run('le vert\nle chat\nle vair', { scheme: 'bisexuelle' }).text, 'le vert\nle vair\nle verre');
});

test('quatrain alterné : vers 1 et 3 masculins, vers 2 et 4 féminins', () => {
  assert.equal(run('le vert\nla chaise\nle chat\nla rose', { scheme: 'croisees', gender: 'alternate' }).text, 'le vert\nla chaise\nle vair\nla braise');
});

test('étreinte : le vers du milieu reste libre ; une strophe d’un vers ne change pas ; sans prononciations, tout attend', () => {
  assert.equal(run('la chaise\nla table\nla rose', { scheme: 'etreinte' }).text, 'la chaise\nla table\nla braise');
  assert.equal(run('la chaise et la table', { scheme: 'plates' }).text, 'la chaise et la table');
  assert.deepEqual(reasons(run('la chaise\nla table', { scheme: 'plates' }, undefined, false).marks), [`chaise : ${PHONETICS_LOADING}`, `table : ${PHONETICS_LOADING}`]);
});

test('schéma de rimes : titre, mention et aide', () => {
  const plugin = rhymeSchemePlugin;
  assert.equal(plugin.title({}), 'Rimes embrassées');
  assert.equal(plugin.title({ scheme: 'etreinte' }), 'Étreinte');
  assert.equal(plugin.label(plugin.parse({ scheme: 'croisees', gender: 'alternate' })), 'rimes croisées (ABAB), rime suffisante, rimes alternées');
  assert.equal(plugin.label(plugin.parse({ scheme: 'bisexuelle', gender: 'alternate' })), 'rime bisexuelle (AAA), rime suffisante');
  assert.match(plugin.help({ scheme: 'plates' }), /rimes plates \(AABB\)/);
  assert.ok(plugin.acts({}));
});

test('schéma rondel : dix vers sur deux rimes', () => {
  const text = 'la chaise\nle vert\nle chat\nla fraise\nla table\nle ver\nla rose\nle vair\nla chose\nla glaise';
  const { text: out, marks } = run(text, { scheme: 'rondel' });
  const ends = out.split('\n').map((line) => line.split(' ').at(-1));
  assert.deepEqual(ends, ['chaise', 'vert', 'vair', 'fraise', 'braise', 'ver', 'braise', 'vair', 'chose', 'glaise']);
  assert.deepEqual(reasons(marks), ['chose : aucun voisin en /ɛʁ/ (B)']); // aucun nom féminin en /ɛʁ/
  assert.equal(rhymeSchemePlugin.title({ scheme: 'rondel' }), 'Rondel');
});

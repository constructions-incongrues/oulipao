import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Category } from '../../../src/domain/categories.ts';
import type { ConstraintPlugin, ParameterValues, WordScope } from '../../../src/domain/plugin.ts';
import { anterhymePlugin } from '../../../src/domain/rhyme/anterhyme.ts';
import { berrychonnePlugin } from '../../../src/domain/rhyme/berrychonne.ts';
import { rhymeResources, tagRhymes } from '../../support/phonetics.ts';

const ALL: Category[] = ['noun', 'adjective', 'verb', 'adverb'];

function run(plugin: ConstraintPlugin, text: string, values: ParameterValues = {}, scope?: WordScope) {
  const result = plugin.apply(text, tagRhymes(text), plugin.parse(values), rhymeResources(), new Set(ALL), scope);
  return { text: result.words.map((word) => word.gap + word.output).join('') + result.tail, marks: result.marks };
}
const reasons = (marks: ReturnType<typeof run>['marks']) => marks.filter((mark) => mark.reason).map((mark) => `${mark.original} : ${mark.reason}`);

test('antérime : le premier mot plein du vers 2 rime avec celui du vers 1, les fins ne changent pas', () => {
  assert.equal(run(anterhymePlugin, 'la chaise dort\nla table dort').text, 'la chaise dort\nla braise dort');
  assert.equal(run(anterhymePlugin, 'la chaise dort\nla fraise dort').text, 'la chaise dort\nla fraise dort'); // rime déjà
  assert.equal(run(anterhymePlugin, 'la chaise\nla table\nla rose\nla chose').text, 'la chaise\nla braise\nla rose\nla chose'); // par paires : « chose » rime déjà avec « rose »
  assert.deepEqual(reasons(run(anterhymePlugin, 'la chaise\nle chat').marks), ['chat : aucun voisin en /ɛz/']);
  assert.deepEqual(reasons(run(anterhymePlugin, 'la chaise\nla table', {}, { skip: [3], overrides: [] }).marks), ['table : pas bouché']);
  assert.equal(anterhymePlugin.title({}), 'Antérime');
  assert.equal(anterhymePlugin.label({}), 'antérime, rime suffisante');
  assert.match(anterhymePlugin.help({ richness: 'rich' }), /rime riche/);
});

test('rime berrychonne : la troisième fin croise la voyelle de l’une et la consonne de l’autre', () => {
  // /ɛʁ/ et /abl/ donnent /ɛbl/ ou /aʁ/ : aucun nom ; /ɛz/ et /ɔ̃/ donnent /ɛ/ ou /ɔ̃z/ : aucun non plus.
  assert.deepEqual(reasons(run(berrychonnePlugin, 'le vert\nla table\nle chat').marks), ['chat : aucun voisin en /ɛbl/ ni /aʁ/']);
  // /ʁoz/ et /ɛʁ/ donnent /oʁ/ ou /ɛz/ : « chaise » qui portait /ɛz/ reste.
  assert.equal(run(berrychonnePlugin, 'la rose\nle vert\nla chaise').text, 'la rose\nle vert\nla chaise');
  // /ɛʁ/ et /ʃoz/ : « table » devient « braise », le premier nom en /ɛz/.
  assert.equal(run(berrychonnePlugin, 'le vert\nla chose\nla table').text, 'le vert\nla chose\nla braise');
  assert.equal(berrychonnePlugin.title({}), 'Rime berrychonne');
  assert.equal(berrychonnePlugin.label({}), 'rime berrychonne');
  assert.match(berrychonnePlugin.help({}), /voyelle/);
  assert.ok(berrychonnePlugin.acts({}));
});

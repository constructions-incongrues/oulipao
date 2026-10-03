import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { buildView, changedWords, ruleMention, ruleName, summarize } from '../../../src/ui/tracks/view-model.ts';
import { morphology, tag } from '../../support/morphology.ts';

const m = morphology();
const text = 'La vieille ferme du village est grise, et la Zorglub aussi.';
const session = { text, tagged: tag(text, { Zorglub: 'noun' }) };
const offsetOne = reduce(initialState, { type: 'set-offset', offset: 1 });

test('plugin actif : texte transformé, noms remplacés comptés, blocs des noms au nouveau mot', () => {
  const view = buildView(session, offsetOne, m);
  assert.equal(view.result, 'Le vieux fermoir de la ville est gris, et la Zorglub aussi.');
  assert.deepEqual(view.counts, { noun: 3, verb: 1, adjective: 2, adverb: 0, other: 5 });
  assert.equal(view.replaced, 2);
  assert.equal(view.nouns, 3);
  const nouns = view.layout.systems.flatMap((s) => s.lanes.noun.map((b) => b.label));
  assert.deepEqual(nouns, ['fermoir', 'ville', 'Zorglub']); // le nom inconnu garde son mot
  assert.equal(view.layout.systems[0]!.ruler, text); // la règle porte le texte d'origine
});

test('plugin coupé : texte d’origine, blocs au mot d’origine', () => {
  const view = buildView(session, reduce(offsetOne, { type: 'toggle-plugin' }), m);
  assert.equal(view.result, text);
  assert.equal(view.replaced, 0);
  assert.deepEqual(view.layout.systems.flatMap((s) => s.lanes.noun.map((b) => b.label)), ['ferme', 'village', 'Zorglub']);
});

test('mode et décalage changent le résultat ; mute et solo s’appliquent au texte transformé', () => {
  const same = buildView(session, reduce(offsetOne, { type: 'set-mode', mode: 'same-gender' }), m);
  assert.equal(same.result, "La vieille horloge du voisin est grise, et la Zorglub aussi.");
  const muted = buildView(session, reduce(offsetOne, { type: 'toggle-mute', category: 'adjective' }), m);
  assert.equal(muted.result, 'Le fermoir de la ville est, et la Zorglub aussi.');
  const solo = buildView(session, reduce(offsetOne, { type: 'toggle-solo', category: 'noun' }), m);
  assert.equal(solo.result, 'fermoir ville, Zorglub.');
});

test('largeur des systèmes transmise à la disposition', () => {
  assert.ok(buildView(session, offsetOne, m, 20).layout.systems.length > 1);
});

test('marques des noms : remplacé, ou laissé tel quel avec sa raison ; rien quand le plugin n’agit pas', () => {
  const view = buildView(session, offsetOne, m);
  assert.deepEqual(view.marks.get(2), { state: 'replaced', original: 'ferme' });
  assert.deepEqual(view.marks.get(9), { state: 'kept', original: 'Zorglub', reason: 'absent du dictionnaire' });
  assert.equal(view.marks.size, 3);
  assert.equal(buildView(session, reduce(offsetOne, { type: 'set-offset', offset: 0 }), m).marks.size, 0); // S+0 : rien ne change
  assert.equal(buildView(session, reduce(offsetOne, { type: 'set-offset', offset: 0 }), m).result, text);
  const feminine = { text: 'La ferme.', tagged: tag('La ferme.') };
  const missing = buildView(feminine, reduce(reduce(initialState, { type: 'set-mode', mode: 'same-gender' }), { type: 'set-offset', offset: 99 }), m);
  assert.ok([...missing.marks.values()].every((mark) => mark.state === 'replaced' || mark.reason === 'aucun nom au bon genre et au bon nombre'));
});

test('morceaux du texte résultant : les mots gardent leur position', () => {
  const view = buildView(session, offsetOne, m);
  assert.equal(view.segments.map((s) => s.text).join(''), view.result);
  assert.deepEqual(view.segments.find((s) => s.index === 2), { text: 'fermoir', index: 2 });
});

test('résumé annoncé après chaque geste', () => {
  const view = (mixer: typeof offsetOne) => summarize(mixer, buildView(session, mixer, m));
  assert.equal(view(offsetOne), 'S+1, parmi tous les noms : 2 noms remplacés sur 3.');
  assert.equal(view(reduce(offsetOne, { type: 'set-offset', offset: -1 })), 'S−1, parmi tous les noms : 2 noms remplacés sur 3.');
  assert.equal(view(reduce(offsetOne, { type: 'set-mode', mode: 'same-gender' })), 'S+1, parmi les noms du même genre : 2 noms remplacés sur 3.');
  assert.equal(view(reduce(offsetOne, { type: 'set-offset', offset: 0 })), 'S+0 : aucun changement.');
  assert.equal(view(reduce(offsetOne, { type: 'toggle-plugin' })), 'Plugin coupé : texte d’origine.');
  assert.equal(view(reduce(offsetOne, { type: 'toggle-mute', category: 'adjective' })), 'S+1, parmi tous les noms : 2 noms remplacés sur 3. Pistes coupées : adjectifs.');
  const single = { text: 'La ferme.', tagged: tag('La ferme.') };
  assert.equal(summarize(offsetOne, buildView(single, offsetOne, m)), 'S+1, parmi tous les noms : 1 nom remplacé sur 1.');
  assert.equal(ruleName(-3), 'S−3');
});

test('mention de la règle (D11) : seulement ce qui a changé le texte', () => {
  const all = new Set(['noun', 'verb', 'adjective', 'adverb', 'other'] as const);
  assert.equal(ruleMention(initialState, all), '\n\n— S+7, parmi tous les noms (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'set-offset', offset: -3 }), all), '\n\n— S−3, parmi tous les noms (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'set-mode', mode: 'same-gender' }), all), '\n\n— S+7, parmi les noms du même genre (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'toggle-plugin' }), all), ''); // plugin coupé : texte d'origine
  assert.equal(ruleMention(reduce(initialState, { type: 'set-offset', offset: 0 }), all), ''); // S+0
  assert.equal(ruleMention(initialState, new Set(['noun', 'other'])), '\n\n— S+7, parmi tous les noms · pistes coupées : verbes, adjectifs, adverbes (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'toggle-plugin' }), new Set(['verb'])), '\n\n— pistes coupées : noms, adjectifs, adverbes, autres (Potao)');
});

test('mots changés : ceux dont le texte diffère d’une vue à l’autre', () => {
  const one = buildView(session, offsetOne, m);
  const two = buildView(session, reduce(offsetOne, { type: 'set-offset', offset: 2 }), m);
  assert.deepEqual(changedWords(undefined, one), new Set());
  assert.deepEqual(changedWords(one, one), new Set());
  const changed = changedWords(one, two);
  assert.ok(changed.has(2) && !changed.has(0));
});

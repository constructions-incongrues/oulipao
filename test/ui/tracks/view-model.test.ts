import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { buildView } from '../../../src/ui/tracks/view-model.ts';
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

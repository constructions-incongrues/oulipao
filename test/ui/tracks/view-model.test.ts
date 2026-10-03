import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { buildView, changedWords, describeInstance, ruleMention, summarize } from '../../../src/ui/tracks/view-model.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { sansPlugin } from '../../support/plugins.ts';
import { s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { CATEGORIES } from '../../../src/domain/categories.ts';

const m = morphology();
const text = 'La vieille ferme du village est grise, et la Zorglub aussi.';
const session = { text, tagged: tag(text, { Zorglub: 'noun' }) };
const offsetOne = reduce(initialState, { type: 'set-param', id: 's7-1', key: 'offset', value: 1 });

test('plugin actif : texte transformé, noms remplacés comptés, blocs des noms au nouveau mot', () => {
  const view = buildView(session, offsetOne, m);
  assert.equal(view.result, 'Le vieux fermoir de la ville est gris, et la Zorglub aussi.');
  assert.deepEqual(view.counts, { noun: 3, verb: 1, adjective: 2, adverb: 0, other: 5 });
  assert.deepEqual(view.steps, [{ id: 's7-1', replaced: 2, removed: 0, kept: 1 }]);
  const nouns = view.layout.systems.flatMap((s) => s.lanes.noun.map((b) => b.label));
  assert.deepEqual(nouns, ['fermoir', 'ville', 'Zorglub']); // le nom inconnu garde son mot
  // la règle porte le texte d'origine, avec la place du remplaçant plus long (« fermoir »)
  assert.equal(view.layout.systems[0]!.ruler, 'La vieille ferme   du village est grise, et la Zorglub aussi.');
});

test('plugin coupé : texte d’origine, blocs au mot d’origine', () => {
  const view = buildView(session, reduce(offsetOne, { type: 'toggle-instance', id: 's7-1' }), m);
  assert.equal(view.result, text);
  assert.deepEqual(view.steps, []);
  assert.deepEqual(view.layout.systems.flatMap((s) => s.lanes.noun.map((b) => b.label)), ['ferme', 'village', 'Zorglub']);
});

test('mode et décalage changent le résultat ; mute et solo s’appliquent au texte transformé', () => {
  const same = buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), m);
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
  assert.equal(buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 }), m).marks.size, 0); // S+0 : rien ne change
  assert.equal(buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 }), m).result, text);
  const feminine = { text: 'La ferme.', tagged: tag('La ferme.') };
  const missing = buildView(feminine, reduce(reduce(initialState, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), { type: 'set-param', id: 's7-1', key: 'offset', value: 99 }), m);
  assert.ok([...missing.marks.values()].every((mark) => mark.state === 'replaced' || mark.reason === 'aucun nom au bon genre et au bon nombre'));
});

test('morceaux du texte résultant : les mots gardent leur position', () => {
  const view = buildView(session, offsetOne, m);
  assert.equal(view.segments.map((s) => s.text).join(''), view.result);
  assert.deepEqual(view.segments.find((s) => s.index === 2), { text: 'fermoir', index: 2 });
});

test('résumé annoncé après chaque geste', () => {
  const view = (mixer: typeof offsetOne) => summarize(mixer, buildView(session, mixer, m));
  assert.equal(view(offsetOne), 'S+1 sur les noms : 2 noms remplacés sur 3.');
  assert.equal(view(reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: -1 })), 'S−1 sur les noms : 2 noms remplacés sur 3.');
  assert.equal(view(reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' })), 'S+1, parmi les noms du même genre, sur les noms : 2 noms remplacés sur 3.');
  assert.equal(view(reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 })), 'S+0 : aucun changement.');
  assert.equal(view(reduce(offsetOne, { type: 'toggle-instance', id: 's7-1' })), 'Filtres coupés : texte d’origine.');
  assert.equal(view(reduce(offsetOne, { type: 'toggle-mute', category: 'adjective' })), 'S+1 sur les noms : 2 noms remplacés sur 3. Pistes coupées : adjectifs.');
  const single = { text: 'La ferme.', tagged: tag('La ferme.') };
  assert.equal(summarize(offsetOne, buildView(single, offsetOne, m)), 'S+1 sur les noms : 1 nom remplacé sur 1.');
});

test('mention de la règle (D11) : seulement ce qui a changé le texte', () => {
  const all = new Set(['noun', 'verb', 'adjective', 'adverb', 'other'] as const);
  assert.equal(ruleMention(initialState, all), '\n\n— S+7 sur les noms (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'set-param', id: 's7-1', key: 'offset', value: -3 }), all), '\n\n— S−3 sur les noms (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), all), '\n\n— S+7, parmi les noms du même genre, sur les noms (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'toggle-instance', id: 's7-1' }), all), ''); // plugin coupé : texte d'origine
  assert.equal(ruleMention(reduce(initialState, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 }), all), ''); // S+0
  assert.equal(ruleMention(initialState, new Set(['noun', 'other'])), '\n\n— S+7 sur les noms · pistes coupées : verbes, adjectifs, adverbes (Potao)');
  assert.equal(ruleMention(reduce(initialState, { type: 'toggle-instance', id: 's7-1' }), new Set(['verb'])), '\n\n— pistes coupées : noms, adjectifs, adverbes, autres (Potao)');
});

test('mots changés : ceux dont le texte diffère d’une vue à l’autre', () => {
  const one = buildView(session, offsetOne, m);
  const two = buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: 2 }), m);
  assert.deepEqual(changedWords(undefined, one), new Set());
  assert.deepEqual(changedWords(one, one), new Set());
  const changed = changedWords(one, two);
  assert.ok(changed.has(2) && !changed.has(0));
});

test('chaîne avec un plugin sur toutes les pistes : résumé, mention, mots retirés', () => {
  const lookup = (id: string) => (id === 'sans' ? sansPlugin : s7Plugin);
  const sans = { id: 'sans-1', type: 'sans', enabled: true, params: { lettre: 'e' }, targets: [...CATEGORIES] };
  const mixer = { ...offsetOne, instances: [offsetOne.instances[0]!, sans] };
  const short = { text: 'La vieille ferme dort.', tagged: tag('La vieille ferme dort.') };
  const view = buildView(short, mixer, m, undefined, lookup);
  // S+1 : « La vieille ferme » → « Le vieux fermoir » ; puis sans « e » : « Le », « vieux », « fermoir » retirés
  assert.equal(view.result, 'dort.');
  assert.deepEqual(view.marks.get(2), { state: 'removed', original: 'ferme' });
  assert.deepEqual(view.steps, [{ id: 's7-1', replaced: 1, removed: 0, kept: 0 }, { id: 'sans-1', replaced: 0, removed: 3, kept: 0 }]);
  assert.equal(summarize(mixer, view, lookup), 'S+1 sur les noms : 1 nom remplacé sur 1. sans e : 0 mot remplacé, 3 retirés, 0 laissé tel quel.');
  assert.equal(ruleMention(mixer, view.audible, lookup), '\n\n— S+1 sur les noms · sans e (Potao)');
  const verbs = buildView({ text: 'Le chat est vite.', tagged: tag('Le chat est vite.') }, mixer, m, undefined, lookup);
  assert.match(summarize(mixer, verbs, lookup), /3 retirés, 1 laissé tel quel\.$/); // « Le cheval » et « vite » retirés, « est » laissé
  // tous coupés
  const off = { ...mixer, instances: mixer.instances.map((instance) => ({ ...instance, enabled: false })) };
  assert.equal(summarize(off, buildView(short, off, m, undefined, lookup), lookup), 'Filtres coupés : texte d’origine.');
});

test('instances : pistes nommées sauf quand elles couvrent le type ; phrase à trois comptes sur plusieurs pistes', () => {
  const both = reduce(offsetOne, { type: 'set-targets', id: 's7-1', targets: ['noun', 'adjective'] });
  assert.equal(describeInstance(both.instances[0]!), 'S+1'); // le S+n traite noms et adjectifs : rien à préciser
  const lipo = reduce(reduce(offsetOne, { type: 'toggle-instance', id: 'lipogram-1' }), { type: 'set-targets', id: 'lipogram-1', targets: ['noun', 'verb', 'adjective'] });
  assert.equal(describeInstance(lipo.instances[1]!), 'lipogramme en e sur les noms, les verbes et les adjectifs');
  const view = buildView(session, both, m);
  assert.equal(view.result, 'Le beau fermoir de la ville est petit, et la Zorglub aussi.'); // « vieille », « grise » décalés aussi
  assert.equal(summarize(both, view), 'S+1 : 4 mots remplacés, 0 retiré, 1 laissé tel quel.');
  const none = { ...offsetOne, instances: [] };
  assert.equal(summarize(none, buildView(session, none, m)), 'Aucun filtre : texte d’origine.');
  assert.equal(ruleMention(none, new Set(CATEGORIES)), '');
});

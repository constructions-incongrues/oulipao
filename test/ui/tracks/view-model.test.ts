import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seededState } from '../../support/chain.ts';
import { reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { buildView, changedWords, describeInstance, gridSteps, inspectorLocks, inspectorWindow, pageOf, ruleMention, stepsPerPage, summarize } from '../../../src/ui/tracks/view-model.ts';
import { morphology, tag, verbs } from '../../support/morphology.ts';
import { sansPlugin } from '../../support/plugins.ts';
import { s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { CATEGORIES } from '../../../src/domain/categories.ts';

const m = morphology();
const text = 'La vieille ferme du village est grise, et la Zorglub aussi.';
const session = { text, tagged: tag(text, { Zorglub: 'noun' }) };
const offsetOne = reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: 1 });

test('plugin actif : texte transformé, noms remplacés comptés, bandes de l’inspecteur', () => {
  const view = buildView(session, offsetOne, m);
  assert.equal(view.result, 'Le vieux fermoir de la ville est gris, et la Zorglub aussi.');
  assert.deepEqual(view.counts, { noun: 3, verb: 1, adjective: 2, adverb: 0, other: 5 });
  assert.deepEqual(view.steps, [{ id: 's7-1', replaced: 2, removed: 0, kept: 1 }]);
  assert.deepEqual(view.stages.map((stage) => stage.label), ['Origine', 'S+1 sur les noms']);
  assert.deepEqual(view.stages[0]!.words.slice(0, 5), ['La', 'vieille', 'ferme', 'du', 'village']);
  assert.deepEqual(view.stages[1]!.words.slice(0, 5), ['Le', 'vieux', 'fermoir', 'de la', 'ville']); // la contraction reste à sa place
  assert.equal(view.tracks[2], 'noun');
});

test('plugin coupé : texte d’origine, la seule bande d’origine', () => {
  const view = buildView(session, reduce(offsetOne, { type: 'toggle-instance', id: 's7-1' }), m);
  assert.equal(view.result, text);
  assert.deepEqual(view.steps, []);
  assert.deepEqual(view.stages.map((stage) => stage.id), ['origin']);
});

test('mode et décalage changent le résultat ; mute et solo s’appliquent au texte transformé', () => {
  const same = buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), m);
  assert.equal(same.result, "La vieille horloge du voisin est grise, et la Zorglub aussi.");
  const muted = buildView(session, reduce(offsetOne, { type: 'toggle-mute', category: 'adjective' }), m);
  assert.equal(muted.result, 'Le fermoir de la ville est, et la Zorglub aussi.');
  const solo = buildView(session, reduce(offsetOne, { type: 'toggle-solo', category: 'noun' }), m);
  assert.equal(solo.result, 'fermoir ville, Zorglub.');
});

test('fenêtre de l’inspecteur : le mot au centre, bornée au texte, « · » pour un mot retiré', () => {
  const view = buildView(session, offsetOne, m);
  const middle = inspectorWindow(view, 5, 2);
  assert.deepEqual(middle.columns, [3, 4, 5, 6, 7].map((index) => ({ index, distance: Math.abs(index - 5) })));
  assert.deepEqual(middle.bands[0], { id: 'origin', label: 'Origine', cells: ['du', 'village', 'est', 'grise', 'et'] });
  assert.deepEqual(middle.bands[1]!.cells, ['de la', 'ville', 'est', 'gris', 'et']);
  assert.deepEqual(inspectorWindow(view, 0, 2).columns.map((c) => c.index), [0, 1, 2]); // début du texte
  assert.deepEqual(inspectorWindow(view, 10, 6).columns.at(-1), { index: 10, distance: 0 }); // fin du texte
  const removed = { ...view, stages: [...view.stages, { id: 'x', label: 'X', words: view.stages[1]!.words.map((w, k) => (k === 4 ? '' : w)) }] };
  assert.equal(inspectorWindow(removed, 4, 0).bands[2]!.cells[0], '·');
});

test('marques des noms : remplacé, ou laissé tel quel avec sa raison ; rien quand le plugin n’agit pas', () => {
  const view = buildView(session, offsetOne, m);
  assert.deepEqual(view.marks.get(2), { state: 'replaced', original: 'ferme' });
  assert.deepEqual(view.marks.get(9), { state: 'kept', original: 'Zorglub', reason: 'absent du dictionnaire' });
  assert.equal(view.marks.size, 3);
  assert.equal(buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 }), m).marks.size, 0); // S+0 : rien ne change
  assert.equal(buildView(session, reduce(offsetOne, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 }), m).result, text);
  const feminine = { text: 'La ferme.', tagged: tag('La ferme.') };
  const missing = buildView(feminine, reduce(reduce(seededState, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), { type: 'set-param', id: 's7-1', key: 'offset', value: 99 }), m);
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
  assert.equal(view(reduce(offsetOne, { type: 'toggle-instance', id: 's7-1' })), 'Contraintes coupées : texte d’origine.');
  assert.equal(view(reduce(offsetOne, { type: 'toggle-mute', category: 'adjective' })), 'S+1 sur les noms : 2 noms remplacés sur 3. Pistes coupées : adjectifs.');
  const single = { text: 'La ferme.', tagged: tag('La ferme.') };
  assert.equal(summarize(offsetOne, buildView(single, offsetOne, m)), 'S+1 sur les noms : 1 nom remplacé sur 1.');
});

test('mention de la règle (D11) : seulement ce qui a changé le texte', () => {
  const all = new Set(['noun', 'verb', 'adjective', 'adverb', 'other'] as const);
  assert.equal(ruleMention(seededState, all), '\n\n— S+7 sur les noms (Oulipao)');
  assert.equal(ruleMention(reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: -3 }), all), '\n\n— S−3 sur les noms (Oulipao)');
  assert.equal(ruleMention(reduce(seededState, { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), all), '\n\n— S+7, parmi les noms du même genre, sur les noms (Oulipao)');
  assert.equal(ruleMention(reduce(seededState, { type: 'toggle-instance', id: 's7-1' }), all), ''); // plugin coupé : texte d'origine
  assert.equal(ruleMention(reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 }), all), ''); // S+0
  assert.equal(ruleMention(seededState, new Set(['noun', 'other'])), '\n\n— S+7 sur les noms · pistes coupées : verbes, adjectifs, adverbes (Oulipao)');
  assert.equal(ruleMention(reduce(seededState, { type: 'toggle-instance', id: 's7-1' }), new Set(['verb'])), '\n\n— pistes coupées : noms, adjectifs, adverbes, autres (Oulipao)');
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
  const view = buildView(short, mixer, m, lookup);
  // S+1 : « La vieille ferme » → « Le vieux fermoir » ; puis sans « e » : « Le », « vieux », « fermoir » retirés
  assert.equal(view.result, 'dort.');
  assert.deepEqual(view.marks.get(2), { state: 'removed', original: 'ferme' });
  assert.deepEqual(view.steps, [{ id: 's7-1', replaced: 1, removed: 0, kept: 0 }, { id: 'sans-1', replaced: 0, removed: 3, kept: 0 }]);
  // trois bandes : l'origine, puis chaque contrainte active dans l'ordre de la chaîne
  assert.deepEqual(view.stages.map((stage) => [stage.label, stage.words[2]]), [['Origine', 'ferme'], ['S+1 sur les noms', 'fermoir'], ['sans e', '']]);
  assert.equal(summarize(mixer, view, lookup), 'S+1 sur les noms : 1 nom remplacé sur 1. sans e : 0 mot remplacé, 3 retirés, 0 laissé tel quel.');
  assert.equal(ruleMention(mixer, view.audible, lookup), '\n\n— S+1 sur les noms · sans e (Oulipao)');
  const verbs = buildView({ text: 'Le chat est vite.', tagged: tag('Le chat est vite.') }, mixer, m, lookup);
  assert.match(summarize(mixer, verbs, lookup), /3 retirés, 1 laissé tel quel\.$/); // « Le cheval » et « vite » retirés, « est » laissé
  // tous coupés
  const off = { ...mixer, instances: mixer.instances.map((instance) => ({ ...instance, enabled: false })) };
  assert.equal(summarize(off, buildView(short, off, m, lookup), lookup), 'Contraintes coupées : texte d’origine.');
});

test('instances : pistes nommées sauf quand elles couvrent le type ; phrase à trois comptes sur plusieurs pistes', () => {
  const both = reduce(offsetOne, { type: 'set-targets', id: 's7-1', targets: ['noun', 'adjective'] });
  assert.equal(describeInstance(both.instances[0]!), 'S+1 sur les noms et les adjectifs');
  const all = reduce(offsetOne, { type: 'set-targets', id: 's7-1', targets: ['noun', 'adjective', 'verb'] });
  assert.equal(describeInstance(all.instances[0]!), 'S+1'); // le S+n traite noms, adjectifs et verbes : rien à préciser
  const lipo = reduce(reduce(offsetOne, { type: 'toggle-instance', id: 'lipogram-1' }), { type: 'set-targets', id: 'lipogram-1', targets: ['noun', 'verb', 'adjective'] });
  assert.equal(describeInstance(lipo.instances[1]!), 'lipogramme en e sur les noms, les verbes et les adjectifs');
  const view = buildView(session, both, m);
  assert.equal(view.result, 'Le beau fermoir de la ville est petit, et la Zorglub aussi.'); // « vieille », « grise » décalés aussi
  assert.equal(summarize(both, view), 'S+1 sur les noms et les adjectifs : 4 mots remplacés, 0 retiré, 1 laissé tel quel.');
  const none = { ...offsetOne, instances: [] };
  assert.equal(summarize(none, buildView(session, none, m)), 'Aucune contrainte : texte d’origine.');
  assert.equal(ruleMention(none, new Set(CATEGORIES)), '');
});

test('pas bouché : le mot reste tel quel, les autres noms changent', () => {
  const open = buildView(session, offsetOne, m);
  const closed = buildView(session, reduce(offsetOne, { type: 'toggle-step', index: 2 }), m);
  assert.notEqual(open.stages.at(-1)!.words[2], 'ferme');
  assert.equal(closed.stages.at(-1)!.words[2], 'ferme');
  assert.equal(closed.stages.at(-1)!.words[4], open.stages.at(-1)!.words[4]);
  assert.match(closed.result, /vieille ferme/);
});

test('verrou : le mot verrouillé prend sa valeur, les autres suivent l’instance', () => {
  const s2 = buildView(session, reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: 2 }), m);
  const locked = buildView(session, reduce(offsetOne, { type: 'set-lock', id: 's7-1', index: 4, key: 'offset', value: 2 }), m);
  const open = buildView(session, offsetOne, m);
  assert.equal(locked.stages.at(-1)!.words[4], s2.stages.at(-1)!.words[4]);
  assert.equal(locked.stages.at(-1)!.words[2], open.stages.at(-1)!.words[2]);
});

test('grille : percé si une contrainte agit sur la piste, contour sinon, bouché, et verrous', () => {
  const view = buildView(session, offsetOne, m);
  const words = view.stages[0]!.words;
  const mixer = reduce(reduce(offsetOne, { type: 'toggle-step', index: 2 }), { type: 'set-lock', id: 's7-1', index: 4, key: 'offset', value: 3 });
  const steps = gridSteps(mixer, view.tracks, words);
  assert.equal(steps.length, words.length);
  assert.deepEqual(steps[2], { index: 2, word: 'ferme', track: 'noun', state: 'closed', locks: [] });
  assert.deepEqual(steps[4], { index: 4, word: 'village', track: 'noun', state: 'punched', locks: [{ id: 's7-1', key: 'offset', value: 3 }] });
  assert.equal(steps[5]!.state, 'outline'); // « est » : aucune contrainte ne vise les verbes
  // Contrainte coupée : plus rien n'est percé.
  assert.ok(gridSteps(reduce(offsetOne, { type: 'toggle-instance', id: 's7-1' }), view.tracks, words).every((step) => step.state === 'outline'));
});

test('pages de pas : 16, 8 ou 4 selon la largeur', () => {
  assert.deepEqual([1200, 1024, 1023, 640, 639, 375].map(stepsPerPage), [16, 16, 8, 8, 4, 4]);
  assert.deepEqual([0, 15, 16, 43].map((index) => pageOf(index, 16)), [0, 0, 1, 2]);
});

test('inspecteur : un champ de verrou par paramètre entier, pour les instances en marche qui visent la piste', () => {
  const locked = reduce(offsetOne, { type: 'set-lock', id: 's7-1', index: 4, key: 'offset', value: 3 });
  assert.deepEqual(inspectorLocks(locked, 4, 'noun'), [
    { id: 's7-1', fields: [{ key: 'offset', label: 'Décalage', min: -99, max: 99, value: 3 }], note: 'S+3 sur ce mot' },
  ]);
  assert.deepEqual(inspectorLocks(locked, 2, 'noun'), [{ id: 's7-1', fields: [{ key: 'offset', label: 'Décalage', min: -99, max: 99, value: undefined }] }]);
  // Le lipogramme n'a pas de paramètre entier ; un verbe n'est visé par aucune contrainte.
  const both = reduce(locked, { type: 'toggle-instance', id: 'lipogram-1' });
  assert.deepEqual(inspectorLocks(both, 4, 'noun').map((entry) => entry.id), ['s7-1']);
  assert.deepEqual(inspectorLocks(both, 5, 'verb'), []);
  // Contrainte coupée : pas de verrou à poser.
  assert.deepEqual(inspectorLocks(reduce(locked, { type: 'toggle-instance', id: 's7-1' }), 4, 'noun'), []);
});

test('S+7 sur les verbes : mention par instance, verbes servis à la chaîne, auxiliaire compté parmi les laissés', () => {
  const twice = reduce(reduce(seededState, { type: 'add-instance', plugin: 's7' }), { type: 'set-targets', id: 's7-2', targets: ['verb'] });
  assert.equal(ruleMention(twice, new Set(CATEGORIES)), '\n\n— S+7 sur les noms · S+7 sur les verbes (Oulipao)');
  const verbsOnly = { ...twice, instances: twice.instances.filter((instance) => instance.id === 's7-2') };
  const sleeping = { text: 'Le chat dort, il est là.', tagged: tag('Le chat dort, il est là.') };
  const view = buildView(sleeping, verbsOnly, m, undefined, verbs());
  assert.equal(view.result, 'Le chat chante, il est là.');
  assert.equal(summarize(verbsOnly, view), 'S+7 sur les verbes : 1 verbe remplacé sur 2.'); // « est », auxiliaire, reste
});

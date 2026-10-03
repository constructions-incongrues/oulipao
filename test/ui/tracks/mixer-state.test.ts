import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seededState } from '../../support/chain.ts';
import { initialState, installedPlugins, pluginById, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { MixerStateSchema, type MixerAction } from '../../../src/ui/tracks/types.ts';

const after = (...actions: MixerAction[]) => MixerStateSchema.parse(actions.reduce(reduce, seededState));
const instance = (state: ReturnType<typeof after>, id: string) => state.instances.find((candidate) => candidate.id === id)!;

test('état initial : toutes les pistes s’entendent, aucune contrainte ; la chaîne des tests en ajoute deux', () => {
  const state = MixerStateSchema.parse(initialState);
  assert.deepEqual(state.instances, []);
  assert.deepEqual(MixerStateSchema.parse(seededState).instances, [
    { id: 's7-1', type: 's7', enabled: true, params: { offset: 7, mode: 'reagree' }, targets: ['noun'] },
    { id: 'lipogram-1', type: 'lipogram', enabled: false, params: { letter: 'e' }, targets: ['noun', 'verb', 'adjective', 'adverb', 'other'] },
  ]);
  assert.deepEqual(Object.keys(state.tracks), ['noun', 'verb', 'adjective', 'adverb', 'other']);
  assert.ok(Object.values(state.tracks).every((t) => !t.muted && !t.solo));
  assert.deepEqual(installedPlugins.map((plugin) => plugin.id), ['s7', 'lipogram', 'track-sort', 'edge', 'lineation', 'rn', 'monorhyme', 'antirhyme', 'homophony']);
  assert.throws(() => pluginById('inconnu'), /plugin inconnu : inconnu/);
});

test('mute et solo basculent, piste par piste', () => {
  const state = after({ type: 'toggle-mute', category: 'adjective' }, { type: 'toggle-solo', category: 'verb' });
  assert.deepEqual(state.tracks.adjective, { muted: true, solo: false });
  assert.deepEqual(state.tracks.verb, { muted: false, solo: true });
  assert.deepEqual(state.tracks.noun, { muted: false, solo: false });
  assert.deepEqual(after({ type: 'toggle-mute', category: 'other' }, { type: 'toggle-mute', category: 'other' }), seededState);
  assert.deepEqual(after({ type: 'toggle-solo', category: 'noun' }, { type: 'toggle-solo', category: 'noun' }), seededState);
});

test('une instance : en marche ou coupée, réglages bornés', () => {
  assert.equal(instance(after({ type: 'toggle-instance', id: 's7-1' }), 's7-1').enabled, false);
  assert.equal(instance(after({ type: 'toggle-instance', id: 'lipogram-1' }), 'lipogram-1').enabled, true);
  assert.equal(instance(after({ type: 'set-param', id: 's7-1', key: 'offset', value: -3 }), 's7-1').params['offset'], -3);
  assert.equal(instance(after({ type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' }), 's7-1').params['mode'], 'same-gender');
  assert.equal(instance(after({ type: 'set-param', id: 'lipogram-1', key: 'letter', value: 'a' }), 'lipogram-1').params['letter'], 'a');
  assert.equal(instance(after({ type: 'set-param', id: 's7-1', key: 'offset', value: -99 }, { type: 'set-param', id: 's7-1', key: 'offset', value: 99 }), 's7-1').params['offset'], 99);
});

test('ajouter, dupliquer, retirer : chaque instance a son identifiant et ses réglages', () => {
  const added = after({ type: 'add-instance', plugin: 's7' }, { type: 'set-param', id: 's7-2', key: 'offset', value: 3 });
  assert.deepEqual(added.instances.map((i) => i.id), ['s7-1', 'lipogram-1', 's7-2']); // en fin de chaîne
  assert.equal(instance(added, 's7-1').params['offset'], 7);
  assert.equal(instance(added, 's7-2').params['offset'], 3); // réglages indépendants
  assert.deepEqual(instance(added, 's7-2').targets, ['noun']); // pistes par défaut du type
  const duplicated = after({ type: 'set-param', id: 'lipogram-1', key: 'letter', value: 'a' }, { type: 'duplicate-instance', id: 'lipogram-1' });
  assert.deepEqual(instance(duplicated, 'lipogram-2'), { ...instance(duplicated, 'lipogram-1'), id: 'lipogram-2' });
  const removed = after({ type: 'remove-instance', id: 's7-1' });
  assert.deepEqual(removed.instances.map((i) => i.id), ['lipogram-1']);
  // un identifiant libéré se réutilise
  assert.deepEqual(after({ type: 'remove-instance', id: 's7-1' }, { type: 'add-instance', plugin: 's7' }).instances.map((i) => i.id), ['lipogram-1', 's7-1']);
});

test('pistes visées : parmi celles du type, dans l’ordre de la table, au moins une', () => {
  assert.deepEqual(instance(after({ type: 'set-targets', id: 's7-1', targets: ['adjective', 'noun', 'noun'] }), 's7-1').targets, ['noun', 'adjective']);
  assert.deepEqual(instance(after({ type: 'set-targets', id: 'lipogram-1', targets: ['noun'] }), 'lipogram-1').targets, ['noun']);
  assert.throws(() => reduce(seededState, { type: 'set-targets', id: 's7-1', targets: ['adverb'] }), /S\+7 ne traite pas : adverb/);
  // une contrainte non ciblable vise les cinq pistes, sans choix
  const edge = after({ type: 'add-instance', plugin: 'edge' });
  assert.deepEqual(instance(edge, 'edge-1').targets, ['noun', 'verb', 'adjective', 'adverb', 'other']);
  assert.throws(() => reduce(edge, { type: 'set-targets', id: 'edge-1', targets: ['noun'] }), /agit sur tout le texte/);
  assert.throws(() => reduce(seededState, { type: 'set-targets', id: 's7-1', targets: [] }));
});

test('ordre de la chaîne : une instance se place à une position, bornée à la fin', () => {
  const three = after({ type: 'add-instance', plugin: 's7' });
  assert.deepEqual(reduce(three, { type: 'move-instance', id: 's7-1', position: 2 }).instances.map((i) => i.id), ['lipogram-1', 's7-2', 's7-1']);
  assert.deepEqual(reduce(three, { type: 'move-instance', id: 's7-1', position: 9 }).instances.map((i) => i.id), ['lipogram-1', 's7-2', 's7-1']);
  assert.deepEqual(reduce(three, { type: 'move-instance', id: 's7-2', position: 0 }).instances.map((i) => i.id), ['s7-2', 's7-1', 'lipogram-1']);
});

test('un geste ne modifie pas l’état précédent', () => {
  reduce(seededState, { type: 'toggle-mute', category: 'noun' });
  reduce(seededState, { type: 'toggle-instance', id: 's7-1' });
  assert.equal(seededState.tracks.noun.muted, false);
  assert.equal(seededState.instances[0]!.enabled, true);
});

test('refuse un geste non conforme', () => {
  assert.throws(() => reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: 1.5 }));
  assert.throws(() => reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: 100 })); // décalage borné à ±99
  assert.throws(() => reduce(seededState, { type: 'set-param', id: 's7-1', key: 'offset', value: -100 }));
  assert.throws(() => reduce(seededState, { type: 'set-param', id: 's7-1', key: 'mode', value: 'au hasard' }));
  assert.throws(() => reduce(seededState, { type: 'set-param', id: 's7-1', key: 'vitesse', value: 3 }), /paramètre inconnu : vitesse/);
  for (const action of [
    { type: 'toggle-instance', id: 'x' },
    { type: 'set-param', id: 'x', key: 'offset', value: 3 },
    { type: 'set-targets', id: 'x', targets: ['noun'] },
    { type: 'duplicate-instance', id: 'x' },
    { type: 'remove-instance', id: 'x' },
    { type: 'move-instance', id: 'x', position: 0 },
  ] as MixerAction[]) {
    assert.throws(() => reduce(seededState, action), /instance inconnue : x/);
  }
  assert.throws(() => reduce(seededState, { type: 'add-instance', plugin: 'inconnu' }), /plugin inconnu/);
  assert.throws(() => reduce(seededState, { type: 'toggle-mute', category: 'pronom' as never }));
  assert.throws(() => reduce(seededState, { type: 'danser' } as never));
});

test('pas bouchés : un clic bouche, un second rouvre ; valable pour toute la chaîne', () => {
  assert.deepEqual(after({ type: 'toggle-step', index: 5 }).closed, [5]);
  assert.deepEqual(after({ type: 'toggle-step', index: 5 }, { type: 'toggle-step', index: 2 }, { type: 'toggle-step', index: 5 }).closed, [2]);
  // Une contrainte ajoutée après coup trouve le pas toujours bouché : l'état n'appartient à aucune instance.
  assert.deepEqual(after({ type: 'toggle-step', index: 5 }, { type: 'add-instance', plugin: 'lipogram' }).closed, [5]);
});

test('verrous : posés par instance et par mot, validés comme un réglage, retirés quand le champ se vide', () => {
  const locked = after({ type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 3 });
  assert.deepEqual(instance(locked, 's7-1').locks, [{ index: 3, key: 'offset', value: 3 }]);
  // Un second verrou sur le même mot remplace le premier.
  const twice = after({ type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 3 }, { type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 2 });
  assert.deepEqual(instance(twice, 's7-1').locks, [{ index: 3, key: 'offset', value: 2 }]);
  // Hors bornes, ou sur un paramètre qui n'est pas entier : refusé.
  assert.throws(() => after({ type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 120 }));
  assert.throws(() => after({ type: 'set-lock', id: 's7-1', index: 3, key: 'mode', value: 1 }));
  assert.throws(() => after({ type: 'set-lock', id: 'lipogram-1', index: 3, key: 'letter', value: 1 }));
  // Bord ne lit pas les verrous : son paramètre entier n'en accepte pas.
  assert.throws(() => after({ type: 'add-instance', plugin: 'edge' }, { type: 'set-lock', id: 'edge-1', index: 3, key: 'n', value: 2 }));
  // Vider le champ retire le verrou.
  const cleared = after({ type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 3 }, { type: 'clear-lock', id: 's7-1', index: 3, key: 'offset' });
  assert.deepEqual(instance(cleared, 's7-1').locks, []);
  assert.deepEqual(instance(after({ type: 'clear-lock', id: 's7-1', index: 3, key: 'offset' }), 's7-1').locks, []);
});

test('verrous : une autre instance garde sa valeur, un double porte les verrous, un retrait les emporte', () => {
  const state = after(
    { type: 'add-instance', plugin: 's7' },
    { type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 3 },
    { type: 'duplicate-instance', id: 's7-1' },
  );
  assert.deepEqual(instance(state, 's7-2').locks, undefined);
  assert.deepEqual(instance(state, 's7-3').locks, [{ index: 3, key: 'offset', value: 3 }]);
  const removed = reduce(state, { type: 'remove-instance', id: 's7-1' });
  assert.equal(removed.instances.flatMap((candidate) => candidate.locks ?? []).length, 1);
});

test('nouveau texte : tous les pas rouverts, aucun verrou', () => {
  const state = after({ type: 'toggle-step', index: 5 }, { type: 'set-lock', id: 's7-1', index: 3, key: 'offset', value: 3 }, { type: 'reset-steps' });
  assert.deepEqual(state.closed, []);
  assert.ok(state.instances.every((candidate) => candidate.locks?.length === 0));
});

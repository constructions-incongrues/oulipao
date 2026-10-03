import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { MixerStateSchema, type MixerAction } from '../../../src/ui/tracks/types.ts';

const after = (...actions: MixerAction[]) => MixerStateSchema.parse(actions.reduce(reduce, initialState));

test('état initial : toutes les pistes s’entendent ; S+7 actif, décalage 7, réaccord', () => {
  const state = MixerStateSchema.parse(initialState);
  assert.deepEqual(state.plugins, { s7: { enabled: true, params: { offset: 7, mode: 'reagree' } }, lipogram: { enabled: false, params: { letter: 'e' } } });
  assert.deepEqual(state.order, ['s7', 'lipogram']);
  assert.deepEqual(Object.keys(state.tracks), ['noun', 'verb', 'adjective', 'adverb', 'other']);
  assert.ok(Object.values(state.tracks).every((t) => !t.muted && !t.solo));
});

test('mute et solo basculent, piste par piste', () => {
  const state = after({ type: 'toggle-mute', category: 'adjective' }, { type: 'toggle-solo', category: 'verb' });
  assert.deepEqual(state.tracks.adjective, { muted: true, solo: false });
  assert.deepEqual(state.tracks.verb, { muted: false, solo: true });
  assert.deepEqual(state.tracks.noun, { muted: false, solo: false });
  assert.deepEqual(after({ type: 'toggle-mute', category: 'other' }, { type: 'toggle-mute', category: 'other' }), initialState);
  assert.deepEqual(after({ type: 'toggle-solo', category: 'noun' }, { type: 'toggle-solo', category: 'noun' }), initialState);
});

test('plugin : actif ou coupé, décalage, mode', () => {
  assert.equal(after({ type: 'toggle-plugin', id: 's7' }).plugins['s7']!.enabled, false);
  assert.equal(after({ type: 'toggle-plugin', id: 's7' }, { type: 'toggle-plugin', id: 's7' }).plugins['s7']!.enabled, true);
  assert.equal(after({ type: 'set-param', id: 's7', key: 'offset', value: -3 }).plugins['s7']!.params['offset'], -3);
  assert.equal(after({ type: 'set-param', id: 's7', key: 'mode', value: 'same-gender' }).plugins['s7']!.params['mode'], 'same-gender');
});

test('un geste ne modifie pas l’état précédent', () => {
  reduce(initialState, { type: 'toggle-mute', category: 'noun' });
  assert.equal(initialState.tracks.noun.muted, false);
});

test('refuse un geste non conforme', () => {
  assert.throws(() => reduce(initialState, { type: 'set-param', id: 's7', key: 'offset', value: 1.5 }));
  assert.throws(() => reduce(initialState, { type: 'set-param', id: 's7', key: 'offset', value: 100 })); // décalage borné à ±99
  assert.throws(() => reduce(initialState, { type: 'set-param', id: 's7', key: 'offset', value: -100 }));
  assert.equal(after({ type: 'set-param', id: 's7', key: 'offset', value: -99 }, { type: 'set-param', id: 's7', key: 'offset', value: 99 }).plugins['s7']!.params['offset'], 99);
  assert.throws(() => reduce(initialState, { type: 'set-param', id: 's7', key: 'mode', value: 'au hasard' }));
  assert.throws(() => reduce(initialState, { type: 'set-param', id: 's7', key: 'vitesse', value: 3 }), /paramètre inconnu : vitesse/);
  assert.throws(() => reduce(initialState, { type: 'toggle-plugin', id: 'inconnu' }), /plugin inconnu : inconnu/);
  assert.throws(() => reduce(initialState, { type: 'set-param', id: 'inconnu', key: 'offset', value: 3 }), /plugin inconnu/);
  assert.throws(() => reduce(initialState, { type: 'move-plugin', id: 'inconnu', position: 0 }), /plugin inconnu/);
  assert.throws(() => reduce(initialState, { type: 'toggle-mute', category: 'pronom' as never }));
  assert.throws(() => reduce(initialState, { type: 'danser' } as never));
});

test('ordre de la chaîne : un plugin se place à une position, bornée à la fin', () => {
  const state = { ...initialState, order: ['s7', 'b', 'c'] };
  assert.deepEqual(reduce(state, { type: 'move-plugin', id: 's7', position: 2 }).order, ['b', 'c', 's7']);
  assert.deepEqual(reduce(state, { type: 'move-plugin', id: 's7', position: 9 }).order, ['b', 'c', 's7']);
  assert.deepEqual(reduce(state, { type: 'move-plugin', id: 's7', position: 0 }).order, ['s7', 'b', 'c']);
});

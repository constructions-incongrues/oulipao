import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { MixerStateSchema, type MixerAction } from '../../../src/ui/tracks/types.ts';

const after = (...actions: MixerAction[]) => MixerStateSchema.parse(actions.reduce(reduce, initialState));

test('état initial : toutes les pistes s’entendent ; S+7 actif, décalage 7, réaccord', () => {
  const state = MixerStateSchema.parse(initialState);
  assert.deepEqual(state.plugin, { enabled: true, offset: 7, mode: 'reagree' });
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
  assert.equal(after({ type: 'toggle-plugin' }).plugin.enabled, false);
  assert.equal(after({ type: 'toggle-plugin' }, { type: 'toggle-plugin' }).plugin.enabled, true);
  assert.equal(after({ type: 'set-offset', offset: -3 }).plugin.offset, -3);
  assert.equal(after({ type: 'set-mode', mode: 'same-gender' }).plugin.mode, 'same-gender');
});

test('un geste ne modifie pas l’état précédent', () => {
  reduce(initialState, { type: 'toggle-mute', category: 'noun' });
  assert.equal(initialState.tracks.noun.muted, false);
});

test('refuse un geste non conforme', () => {
  assert.throws(() => reduce(initialState, { type: 'set-offset', offset: 1.5 }));
  assert.throws(() => reduce(initialState, { type: 'set-offset', offset: 100 })); // décalage borné à ±99
  assert.throws(() => reduce(initialState, { type: 'set-offset', offset: -100 }));
  assert.equal(after({ type: 'set-offset', offset: -99 }, { type: 'set-offset', offset: 99 }).plugin.offset, 99);
  assert.throws(() => reduce(initialState, { type: 'set-mode', mode: 'au hasard' as never }));
  assert.throws(() => reduce(initialState, { type: 'toggle-mute', category: 'pronom' as never }));
  assert.throws(() => reduce(initialState, { type: 'danser' } as never));
});

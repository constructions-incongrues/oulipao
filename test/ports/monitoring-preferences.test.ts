import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_PREFERENCES, MonitoringPreferencesSchema, tempoTiming } from '../../src/ports/monitoring-preferences.ts';
import { fakeSpeech } from '../support/speech.ts';

test('MonitoringPreferencesSchema : un tempo entier de 1 à 5, une voix facultative', () => {
  assert.ok(MonitoringPreferencesSchema.safeParse(DEFAULT_PREFERENCES).success);
  assert.ok(MonitoringPreferencesSchema.safeParse({ tempo: 5, voice: 'fr-1' }).success);
  assert.ok(!MonitoringPreferencesSchema.safeParse({ tempo: 6 }).success);
  assert.ok(!MonitoringPreferencesSchema.safeParse({ tempo: 2.5 }).success);
  assert.ok(!MonitoringPreferencesSchema.safeParse({ tempo: 3, voice: '' }).success);
});

test('tempoTiming : le tempo par défaut parle à vitesse normale ; plus lent, plus long blanc', () => {
  assert.equal(tempoTiming(DEFAULT_PREFERENCES.tempo).rate, 1);
  assert.ok(tempoTiming(1).rate < tempoTiming(5).rate);
  assert.ok(tempoTiming(1).gap > tempoTiming(5).gap);
  assert.deepEqual(tempoTiming(9), tempoTiming(5));
  assert.deepEqual(tempoTiming(0), tempoTiming(1));
});

test('voix factice : les mots dans l’ordre, et couper résout la parole en vol', async () => {
  const speech = fakeSpeech();
  const spoken = speech.speak(['pomme', 'de', 'terre'], { rate: 1 });
  assert.deepEqual(speech.said[0]!.words, ['pomme', 'de', 'terre']);
  speech.cancel();
  await spoken;
  assert.equal(speech.cancels, 1);
  let changed = 0;
  speech.onVoices(() => changed++);
  speech.setVoices([]);
  assert.equal(changed, 1);
  assert.deepEqual(speech.voices(), []);
});

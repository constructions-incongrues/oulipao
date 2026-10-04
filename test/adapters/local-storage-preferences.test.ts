import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalStoragePreferences, MONITORING_KEY } from '../../src/adapters/storage/local-storage-preferences.ts';
import { DEFAULT_PREFERENCES } from '../../src/ports/monitoring-preferences.ts';

const fakeStorage = (failing = false) => {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => {
      if (failing) throw new Error('SecurityError');
      return items.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (failing) throw new Error('QuotaExceededError');
      items.set(key, value);
    },
  };
};

test('les réglages de l’écoute font l’aller-retour sous leur clé ; absents, ceux par défaut', () => {
  const storage = fakeStorage();
  const preferences = createLocalStoragePreferences(storage);
  assert.deepEqual(preferences.load(), DEFAULT_PREFERENCES);
  preferences.save({ tempo: 4, voice: 'fr-2', source: 'original' });
  assert.equal(storage.items.get(MONITORING_KEY), '{"tempo":4,"voice":"fr-2","source":"original"}');
  assert.deepEqual(preferences.load(), { tempo: 4, voice: 'fr-2', source: 'original' });
});

test('une valeur illisible ou hors bornes : les réglages par défaut', () => {
  const storage = fakeStorage();
  const preferences = createLocalStoragePreferences(storage);
  storage.items.set(MONITORING_KEY, '{pas du json');
  assert.deepEqual(preferences.load(), DEFAULT_PREFERENCES);
  storage.items.set(MONITORING_KEY, '{"tempo":12}');
  assert.deepEqual(preferences.load(), DEFAULT_PREFERENCES);
});

test('un stockage refusé : réglages par défaut, et l’enregistrement ne lève pas', () => {
  const preferences = createLocalStoragePreferences(fakeStorage(true));
  assert.deepEqual(preferences.load(), DEFAULT_PREFERENCES);
  assert.doesNotThrow(() => preferences.save({ tempo: 2, source: 'result' }));
});

test('la source de la voix : absente d’une préférence ancienne ou inconnue, c’est le résultat, sans perdre le reste', () => {
  const storage = fakeStorage();
  const preferences = createLocalStoragePreferences(storage);
  storage.items.set(MONITORING_KEY, '{"tempo":4,"voice":"fr-2"}');
  assert.deepEqual(preferences.load(), { tempo: 4, voice: 'fr-2', source: 'result' });
  storage.items.set(MONITORING_KEY, '{"tempo":4,"source":"envers"}');
  assert.deepEqual(preferences.load(), { tempo: 4, source: 'result' });
});

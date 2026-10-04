import assert from 'node:assert/strict';
import { test } from 'node:test';
import { memoryStorage, safeStorage } from '../../src/adapters/storage/safe-storage.ts';

test('un stockage accessible est rendu tel quel, persistant', () => {
  const real = memoryStorage();
  const { storage, persistent } = safeStorage(() => real);
  assert.equal(storage, real);
  assert.equal(persistent, true);
});

test('un stockage refusé à la lecture du getter : repli en mémoire, non persistant', () => {
  const { storage, persistent } = safeStorage(() => {
    throw new Error('SecurityError');
  });
  assert.equal(persistent, false);
  storage.setItem('clé', 'valeur');
  assert.equal(storage.getItem('clé'), 'valeur');
  assert.equal(storage.getItem('absente'), null);
});

test('un stockage refusé au premier accès : repli en mémoire aussi', () => {
  const { persistent } = safeStorage(() => ({
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {},
  }));
  assert.equal(persistent, false);
});

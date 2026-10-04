import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalStorageNotebook, NOTEBOOK_BACKUP_KEY, NOTEBOOK_KEY } from '../../src/adapters/storage/local-storage-notebook.ts';

const fakeStorage = (quota = Infinity) => {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (value.length > quota) throw new Error('QuotaExceededError');
      items.set(key, value);
    },
  };
};

test('le carnet se lit et s’écrit sous sa clé ; absent, il vaut null', () => {
  const storage = fakeStorage();
  const notebook = createLocalStorageNotebook(storage);
  assert.equal(notebook.read(), null);
  notebook.write('{"version":1,"entries":[]}');
  assert.equal(storage.items.get(NOTEBOOK_KEY), '{"version":1,"entries":[]}');
  assert.equal(notebook.read(), '{"version":1,"entries":[]}');
});

test('un stockage plein : l’erreur remonte telle quelle', () => {
  const notebook = createLocalStorageNotebook(fakeStorage(4));
  assert.throws(() => notebook.write('trop long'), /QuotaExceededError/);
});

test('une lecture refusée vaut un carnet absent, sans arrêter la page', () => {
  const notebook = createLocalStorageNotebook({
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {},
  });
  assert.equal(notebook.read(), null);
});

test('la copie de secours se garde sous sa clé, et n’écrase jamais la première', () => {
  const storage = fakeStorage();
  const notebook = createLocalStorageNotebook(storage);
  notebook.backup!('premier brut');
  notebook.backup!('second brut');
  assert.equal(storage.items.get(NOTEBOOK_BACKUP_KEY), 'premier brut');
});

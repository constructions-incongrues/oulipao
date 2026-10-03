import type { NotebookStorage } from '../../ports/notebook-storage.ts';

/** La clé du carnet dans le stockage du navigateur. */
export const NOTEBOOK_KEY = 'oulipao.notebook';

/** Le carnet dans un `Storage` du navigateur (`localStorage`) : rien ne quitte la machine. */
export function createLocalStorageNotebook(storage: Pick<Storage, 'getItem' | 'setItem'>): NotebookStorage {
  return {
    read: () => storage.getItem(NOTEBOOK_KEY),
    write: (data) => storage.setItem(NOTEBOOK_KEY, data),
  };
}

import type { NotebookStorage } from '../../ports/notebook-storage.ts';

/** La clé du carnet dans le stockage du navigateur. */
export const NOTEBOOK_KEY = 'oulipao.notebook';
/** La clé de la copie de secours d'un carnet illisible. */
export const NOTEBOOK_BACKUP_KEY = 'oulipao.notebook.bak';

/** Le carnet dans un `Storage` du navigateur (`localStorage`) : rien ne quitte la machine. */
export function createLocalStorageNotebook(storage: Pick<Storage, 'getItem' | 'setItem'>): NotebookStorage {
  return {
    read() {
      try {
        return storage.getItem(NOTEBOOK_KEY);
      } catch {
        // Lecture refusée : la page démarre avec un carnet vide plutôt que de s'arrêter.
        return null;
      }
    },
    write: (data) => storage.setItem(NOTEBOOK_KEY, data),
    backup(data) {
      if (storage.getItem(NOTEBOOK_BACKUP_KEY) === null) storage.setItem(NOTEBOOK_BACKUP_KEY, data);
    },
  };
}

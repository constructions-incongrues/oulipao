import type { NotebookStorage } from '../../ports/notebook-storage.ts';
import type { TracksState } from './controller.ts';
import { pluginById } from './mixer-state.ts';
import { addEntry, editEntry, entryClipboard, exportFileName, mergeEntries, parseNotebook, removeEntry, serializeNotebook, type NotebookEntry } from './notebook.ts';
import type { Session, TracksView } from './view-model.ts';

/** Ce dont le carnet a besoin de l'extérieur. */
export interface NotebookDependencies {
  storage: NotebookStorage;
  now: () => Date;
  newId: () => string;
  /** Demande une confirmation ; `true` si elle est donnée. */
  confirm: (message: string) => boolean;
  /** Propose un fichier à enregistrer, sans rien envoyer. */
  download: (name: string, text: string) => void;
}

/** Un carnet en mémoire : pour les pages et les tests qui n'en branchent pas. */
export const memoryNotebook = (): NotebookDependencies => {
  let data: string | null = null;
  return {
    storage: { read: () => data, write: (text) => void (data = text) },
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
    confirm: () => true,
    download: () => {},
  };
};

/** Ce que la page prête au carnet : son état, la séance en cours, et de quoi rouvrir un texte. */
export interface NotebookHost {
  readonly state: TracksState;
  update(patch: Partial<TracksState>): void;
  /** Le texte en pistes et son étiquetage ; aucun avant la première mise en pistes. */
  session(): Session | undefined;
  /** La mention de la chaîne jointe au texte gardé. */
  mention(view: TracksView): string;
  /** Rouvre un texte gardé dans la table, sans réétiqueter. */
  restore(entry: NotebookEntry): Promise<void>;
  /** Place un texte dans le presse-papiers. */
  copy(text: string): Promise<void>;
  /** Un texte vient d'être gardé : « Itérer » et « Figer » le reprennent comme parent. */
  onKept(id: string): void;
}

export interface NotebookController {
  /** Garde le texte résultant ; rend l'identifiant gardé, rien en cas d'échec. */
  keep(): string | undefined;
  reopen(id: string): Promise<void>;
  remove(id: string): void;
  exportNotebook(): void;
  importNotebook(text: string): void;
  copyEntry(id: string): Promise<void>;
  editEntry(id: string, text: string): void;
}

/** « 1 texte illisible laissé de côté. » ; rien quand tout se lit. */
export const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
const unreadable = (rejected: number) => (rejected ? `${count(rejected, 'texte illisible laissé', 'textes illisibles laissés')} de côté.` : '');

export const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Le carnet tel qu'il est lu au démarrage : ses entrées et ce qu'il faut en dire. */
export function initialNotebook(notebook: NotebookDependencies): Pick<TracksState, 'notebook' | 'notebookMessage'> {
  const stored = parseNotebook(notebook.storage.read());
  return { notebook: stored.entries, notebookMessage: stored.error ?? unreadable(stored.rejected) };
}

/** Les gestes du carnet : garder, rouvrir, supprimer, exporter, importer, copier, retoucher. */
export function createNotebookController(host: NotebookHost, notebook: NotebookDependencies): NotebookController {
  return {
    keep() {
      const { state } = host;
      const view = state.view;
      const session = host.session();
      if (!view || !session || state.stale || view.empty) return undefined;
      const entry: NotebookEntry = {
        id: notebook.newId(),
        keptAt: notebook.now().toISOString(),
        result: view.result,
        mention: host.mention(view),
        source: session,
        mixer: state.mixer,
        ...(state.lineage && { lineage: state.lineage }),
      };
      const entries = addEntry(state.notebook, entry);
      try {
        notebook.storage.write(serializeNotebook(entries));
        host.update({ notebook: entries, copyMessage: 'Gardé.', unsaved: false });
        host.onKept(entry.id);
        return entry.id;
      } catch (error) {
        host.update({ copyMessage: `Impossible de garder : ${messageOf(error)}` });
        return undefined;
      }
    },
    async reopen(id) {
      const entry = host.state.notebook.find((candidate) => candidate.id === id);
      if (!entry) return;
      try {
        for (const instance of entry.mixer.instances) pluginById(instance.type);
      } catch (error) {
        return host.update({ notebookMessage: `Ce texte ne peut pas être rouvert : ${messageOf(error)}.` });
      }
      if (host.state.unsaved && !notebook.confirm('Le texte en cours n’est pas gardé. Rouvrir quand même ?')) return;
      await host.restore(entry);
    },
    remove(id) {
      if (!notebook.confirm('Supprimer ce texte du carnet ?')) return;
      const entries = removeEntry(host.state.notebook, id);
      try {
        notebook.storage.write(serializeNotebook(entries));
        host.update({ notebook: entries, notebookMessage: '' });
      } catch (error) {
        host.update({ notebookMessage: `Suppression impossible : ${messageOf(error)}` });
      }
    },
    exportNotebook() {
      notebook.download(exportFileName(notebook.now()), serializeNotebook(host.state.notebook));
    },
    importNotebook(text) {
      const merged = mergeEntries(host.state.notebook, text);
      if (merged.error) return host.update({ notebookMessage: `Import refusé : ${merged.error}` });
      try {
        notebook.storage.write(serializeNotebook(merged.entries));
      } catch (error) {
        return host.update({ notebookMessage: `Import impossible : ${messageOf(error)}` });
      }
      const counts = [count(merged.added, 'texte ajouté', 'textes ajoutés'), count(merged.present, 'déjà présent', 'déjà présents')];
      if (merged.rejected) counts.push(count(merged.rejected, 'illisible', 'illisibles'));
      host.update({ notebook: merged.entries, notebookMessage: `Import : ${counts.join(', ')}.` });
    },
    async copyEntry(id) {
      const entry = host.state.notebook.find((candidate) => candidate.id === id);
      if (!entry) return;
      try {
        await host.copy(entryClipboard(entry));
        host.update({ notebookMessage: 'Copié.' });
      } catch (error) {
        host.update({ notebookMessage: `Copie impossible : ${messageOf(error)}` });
      }
    },
    editEntry(id, text) {
      const entries = editEntry(host.state.notebook, id, text);
      try {
        notebook.storage.write(serializeNotebook(entries));
        host.update({ notebook: entries, notebookMessage: '' });
      } catch (error) {
        host.update({ notebookMessage: `Retouche impossible : ${messageOf(error)}` });
      }
    },
  };
}

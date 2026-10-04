import { tokenize } from '../../domain/tokenizer.ts';
import type { NotebookStorage } from '../../ports/notebook-storage.ts';
import type { ErrorText, TracksState } from './controller.ts';
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
  /** Le stockage survit-il à la fermeture de l'onglet ? `false` : carnet de séance. Absent : oui. */
  persistent?: boolean;
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
}

export interface NotebookController {
  keep(): void;
  reopen(id: string): Promise<void>;
  remove(id: string): void;
  exportNotebook(): void;
  importNotebook(text: string): void;
  copyEntry(id: string): Promise<void>;
  editEntry(id: string, text: string): void;
  /** Relit le carnet gardé : un autre onglet vient de l'écrire. */
  syncNotebook(): void;
}

export const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** « 1 texte illisible par cette version, conservé : il reste dans l'export du carnet. » ; rien quand tout se lit. */
export const unreadableNotice = (rejected: number) =>
  rejected
    ? `${count(rejected, 'texte illisible', 'textes illisibles')} par cette version, ${rejected > 1 ? 'conservés : ils restent' : 'conservé : il reste'} dans l’export du carnet.`
    : '';

/** Ce que dit la garde dans un carnet de séance (stockage refusé). */
export const SESSION_KEPT = 'Gardé pour cette séance. Exportez le carnet pour le conserver.';

export const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Le carnet tel qu'il est lu au démarrage : ses entrées et ce qu'il faut en dire. Un carnet
 * illisible en entier est copié en secours tout de suite, avant toute écriture.
 */
export function initialNotebook(notebook: NotebookDependencies): Pick<TracksState, 'notebook' | 'notebookMessage' | 'notebookPersistent'> {
  const raw = notebook.storage.read();
  const stored = parseNotebook(raw);
  const persistent = notebook.persistent ?? true;
  if (!stored.error) return { notebook: stored.entries, notebookMessage: unreadableNotice(stored.rejected), notebookPersistent: persistent };
  let saved = false;
  try {
    if (raw !== null && notebook.storage.backup) {
      notebook.storage.backup(raw);
      saved = true;
    }
  } catch {
    // Copie refusée (stockage plein) : on le dit en ne promettant pas de copie.
  }
  return { notebook: [], notebookMessage: saved ? `${stored.error} Copie de secours gardée dans le navigateur.` : stored.error, notebookPersistent: persistent };
}

/** Ce qu'une entrée gardée doit tenir pour être rouverte ; la raison de l'échec, ou rien. */
export function reopenProblem(entry: NotebookEntry): string | undefined {
  try {
    for (const instance of entry.mixer.instances) {
      const plugin = pluginById(instance.type);
      plugin.parse(instance.params);
      for (const lock of instance.locks ?? []) {
        if (lock.index >= entry.source.tagged.length) return 'un verrou vise un mot absent du texte';
        plugin.parse({ ...instance.params, [lock.key]: lock.value });
      }
    }
  } catch (error) {
    return messageOf(error);
  }
  if (tokenize(entry.source.text).length !== entry.source.tagged.length) return 'l’étiquetage gardé ne correspond plus au texte';
  if ((entry.mixer.closed ?? []).some((index) => index >= entry.source.tagged.length)) return 'un pas bouché vise un mot absent du texte';
  return undefined;
}

/** L'erreur d'un geste du carnet : « Suppression impossible : » puis la raison. */
export const notebookFailure = (lead: string, reason: string): ErrorText => ({ lead, detail: `${reason}.` });

export const cannotReopen = (reason: string) => notebookFailure('Ce texte ne peut pas être rouvert :', reason);

/** Les gestes du carnet : garder, rouvrir, supprimer, exporter, importer, copier, retoucher. */
export function createNotebookController(host: NotebookHost, notebook: NotebookDependencies): NotebookController {
  // Les entrées que cette version ne sait pas lire : réécrites à chaque sauvegarde, et exportées.
  let unreadable = parseNotebook(notebook.storage.read()).unreadable;

  /**
   * Le carnet tel qu'il est gardé maintenant : un autre onglet a pu l'écrire. Illisible, on repart
   * de ce que montre la page (le brut a été copié en secours au démarrage).
   */
  const latest = (): NotebookEntry[] => {
    const parsed = parseNotebook(notebook.storage.read());
    if (parsed.error) return host.state.notebook;
    unreadable = parsed.unreadable;
    return parsed.entries;
  };
  const write = (entries: readonly NotebookEntry[]) => notebook.storage.write(serializeNotebook(entries, unreadable));

  return {
    keep() {
      const { state } = host;
      const view = state.view;
      const session = host.session();
      if (!view || !session || state.stale || view.empty) return;
      const entry: NotebookEntry = {
        id: notebook.newId(),
        keptAt: notebook.now().toISOString(),
        result: view.result,
        mention: host.mention(view),
        source: session,
        mixer: state.mixer,
      };
      try {
        const entries = addEntry(latest(), entry);
        write(entries);
        host.update({ notebook: entries, notebookError: undefined, copyMessage: state.notebookPersistent ? 'Gardé.' : SESSION_KEPT, unsaved: false });
      } catch (error) {
        host.update({ notebookError: notebookFailure('Impossible de garder :', messageOf(error)) });
      }
    },
    async reopen(id) {
      const entry = host.state.notebook.find((candidate) => candidate.id === id);
      if (!entry) return;
      const problem = reopenProblem(entry);
      if (problem) return host.update({ notebookMessage: '', notebookError: cannotReopen(problem) });
      if (host.state.unsaved && !notebook.confirm('Le texte en cours n’est pas gardé. Rouvrir quand même ?')) return;
      await host.restore(entry);
    },
    remove(id) {
      if (!notebook.confirm('Supprimer ce texte du carnet ?')) return;
      try {
        const entries = removeEntry(latest(), id);
        write(entries);
        host.update({ notebook: entries, notebookMessage: '', notebookError: undefined });
      } catch (error) {
        host.update({ notebookError: notebookFailure('Suppression impossible :', messageOf(error)) });
      }
    },
    exportNotebook() {
      notebook.download(exportFileName(notebook.now()), serializeNotebook(host.state.notebook, unreadable));
    },
    importNotebook(text) {
      const merged = mergeEntries(latest(), text);
      if (merged.error) return host.update({ notebookMessage: '', notebookError: notebookFailure('Import refusé :', merged.error.replace(/\.$/, '')) });
      try {
        write(merged.entries);
      } catch (error) {
        return host.update({ notebookError: notebookFailure('Import impossible :', messageOf(error)) });
      }
      const counts = [count(merged.added, 'texte ajouté', 'textes ajoutés'), count(merged.present, 'déjà présent', 'déjà présents')];
      if (merged.rejected) counts.push(count(merged.rejected, 'illisible', 'illisibles'));
      host.update({ notebook: merged.entries, notebookMessage: `Import : ${counts.join(', ')}.`, notebookError: undefined });
    },
    async copyEntry(id) {
      const entry = host.state.notebook.find((candidate) => candidate.id === id);
      if (!entry) return;
      try {
        await host.copy(entryClipboard(entry));
        host.update({ notebookMessage: 'Copié.', notebookError: undefined });
      } catch (error) {
        host.update({ notebookError: notebookFailure('Copie impossible :', messageOf(error)) });
      }
    },
    editEntry(id, text) {
      try {
        const entries = editEntry(latest(), id, text);
        write(entries);
        host.update({ notebook: entries, notebookMessage: '', notebookError: undefined });
      } catch (error) {
        host.update({ notebookError: notebookFailure('Retouche impossible :', messageOf(error)) });
      }
    },
    syncNotebook() {
      const parsed = parseNotebook(notebook.storage.read());
      if (parsed.error) return; // illisible : on garde ce que montre la page
      unreadable = parsed.unreadable;
      host.update({ notebook: parsed.entries, notebookMessage: unreadableNotice(parsed.rejected) });
    },
  };
}

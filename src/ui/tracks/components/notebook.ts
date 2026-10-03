import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { NotebookEntry } from '../notebook.ts';

export interface NotebookProps {
  /** Les textes gardés, du plus récent au plus ancien. */
  entries: readonly NotebookEntry[];
  message: string;
  onReopen: (id: string) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
  /** Le contenu du fichier choisi pour l'import. */
  onImport: (text: string) => void;
}

/** « Aucun texte gardé », « 1 texte gardé », « 3 textes gardés ». */
export const keptCount = (n: number) => (n === 0 ? 'Aucun texte gardé' : `${n} texte${n > 1 ? 's' : ''} gardé${n > 1 ? 's' : ''}`);

/** La date d'une entrée, lisible : « 4 oct. 2026, 21:00 ». */
export const keptDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/** La mention d'une entrée sans son tiret d'en-tête : « S+7 sur les noms (Oulipao) ». */
const bareMention = (mention: string) => mention.trim().replace(/^—\s*/, '');

/** Le carnet : les textes gardés, à relire, rouvrir ou supprimer, et le fichier pour les emporter. */
export function Notebook({ entries, message, onReopen, onRemove, onExport, onImport }: NotebookProps): VNode {
  const onFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    onImport(await file.text());
    input.value = ''; // le même fichier peut être choisi de nouveau
  };
  return html`
    <section class="notebook" aria-labelledby="notebook-title">
      <div class="notebook-header">
        <h2 class="silk" id="notebook-title">Carnet</h2>
        <span class="notebook-count">${keptCount(entries.length)}</span>
        <button type="button" class="key export" disabled=${entries.length === 0} onClick=${onExport}>Exporter</button>
        <label class="key import">Importer<input type="file" accept="application/json,.json" class="sr-only" onChange=${onFile} /></label>
      </div>
      <p class="section-hint">Le carnet vit dans ce navigateur : exportez-le avant d’en effacer les données.</p>
      <p class="notebook-message" role="status" aria-live="polite">${message}</p>
      ${entries.length > 0 &&
      html`<ol class="notebook-entries">
        ${entries.map(
          (entry) => html`<li class="notebook-entry" key=${entry.id}>
            <time class="kept-at" datetime=${entry.keptAt}>${keptDate(entry.keptAt)}</time>
            <p class="kept-text">${entry.result}</p>
            ${entry.mention && html`<p class="kept-mention">${bareMention(entry.mention)}</p>`}
            <div class="kept-actions">
              <button type="button" class="key reopen" aria-label=${`Rouvrir le texte du ${keptDate(entry.keptAt)}`} onClick=${() => onReopen(entry.id)}>Rouvrir</button>
              <button type="button" class="key remove" aria-label=${`Supprimer le texte du ${keptDate(entry.keptAt)}`} onClick=${() => onRemove(entry.id)}>Supprimer</button>
            </div>
          </li>`,
        )}
      </ol>`}
    </section>
  ` as VNode;
}

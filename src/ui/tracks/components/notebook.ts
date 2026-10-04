import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ErrorText } from '../controller.ts';
import { daysSince, lastKeptLabel, type NotebookEntry } from '../notebook.ts';
import { ErrorMessage } from './error-message.ts';

export interface NotebookProps {
  /** Les textes gardés, du plus récent au plus ancien. */
  entries: readonly NotebookEntry[];
  message: string;
  /** Un échec dans le carnet (rouvrir, garder, supprimer…), annoncé comme une erreur. */
  error?: ErrorText;
  /** Le carnet survit-il à la fermeture de l'onglet ? `false` : un avertissement reste en tête. Absent : oui. */
  persistent?: boolean;
  /** Le jour où l'on regarde : il donne les jours depuis la dernière garde. */
  today: Date;
  onReopen: (id: string) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
  /** Le contenu du fichier choisi pour l'import. */
  onImport: (text: string) => void;
  /** Copie une entrée d'un bloc. */
  onCopy: (id: string) => void;
  /** Enregistre la retouche d'une entrée. */
  onEdit: (id: string, text: string) => void;
}

/** L'avertissement d'un carnet de séance, quand le navigateur refuse le stockage. */
export const SESSION_ONLY = 'Ce navigateur bloque le stockage : le carnet ne sera pas conservé après la fermeture de l’onglet.';

/** « Aucun texte gardé », « 1 texte gardé », « 3 textes gardés ». */
export const keptCount = (n: number) => (n === 0 ? 'Aucun texte gardé' : `${n} texte${n > 1 ? 's' : ''} gardé${n > 1 ? 's' : ''}`);

/** La date d'une entrée, lisible : « 4 oct. 2026, 21:00 ». */
export const keptDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/** La mention d'une entrée sans son tiret d'en-tête : « S+7 sur les noms (Oulipao) ». */
const bareMention = (mention: string) => mention.trim().replace(/^—\s*/, '');

/** Ferme le `<details>` qui contient l'élément : la retouche se replie une fois enregistrée ou annulée. */
const closeDetails = (element: Element) => {
  const details = element.closest('details');
  if (details) details.open = false;
};

/** La retouche d'une entrée : un formulaire natif, sans état ; « Annuler » rend le texte d'avant. */
function Retouch({ entry, onEdit }: { entry: NotebookEntry; onEdit: NotebookProps['onEdit'] }): VNode {
  const onSubmit = (event: Event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    onEdit(entry.id, (form.elements.namedItem('text') as HTMLTextAreaElement).value);
    closeDetails(form);
  };
  return html`<details class="retouch">
    <summary class="key" aria-label=${`Retoucher le texte du ${keptDate(entry.keptAt)}`}>Retoucher</summary>
    <form onSubmit=${onSubmit} onReset=${(event: Event) => closeDetails(event.currentTarget as Element)}>
      <textarea name="text" rows="6" aria-label="Texte retouché" defaultValue=${entry.edited ?? entry.result}></textarea>
      <div class="kept-actions">
        <button type="submit" class="key save">Enregistrer</button>
        <button type="reset" class="key cancel">Annuler</button>
      </div>
    </form>
  </details>` as VNode;
}

/**
 * Le carnet : un panneau replié sous le texte résultant, dont l'en-tête donne le compte et les jours
 * depuis la dernière garde ; déplié, les textes gardés à relire, copier, retoucher, rouvrir ou
 * supprimer, et le fichier pour les emporter.
 */
export function Notebook({ entries, message, error, persistent = true, today, onReopen, onRemove, onExport, onImport, onCopy, onEdit }: NotebookProps): VNode {
  const onFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    onImport(await file.text());
    input.value = ''; // le même fichier peut être choisi de nouveau
  };
  const last = entries[0];
  return html`
    <details class="notebook">
      <summary class="notebook-summary">
        <span class="silk">Carnet</span>
        <span class="notebook-count">${keptCount(entries.length)}${last ? ` · dernier texte ${lastKeptLabel(daysSince(last.keptAt, today))}` : ''}</span>
        ${!persistent && html`<span class="notebook-warning">${SESSION_ONLY}</span>`}
      </summary>
      <div class="notebook-header">
        <p class="section-hint">Le carnet vit dans ce navigateur : exportez-le avant d’en effacer les données.</p>
        <button type="button" class="key export" disabled=${entries.length === 0} onClick=${onExport}>Exporter</button>
        <label class="key import">Importer<input type="file" accept="application/json,.json" class="sr-only" onChange=${onFile} /></label>
      </div>
      ${error && html`<${ErrorMessage} error=${error} />`}
      <p class="notebook-message" role="status" aria-live="polite">${message}</p>
      ${entries.length > 0 &&
      html`<ol class="notebook-entries">
        ${entries.map((entry) => {
          const date = keptDate(entry.keptAt);
          return html`<li class="notebook-entry" key=${entry.id}>
            <time class="kept-at" datetime=${entry.keptAt}>${date}</time>
            <p class="kept-text">${entry.edited ?? entry.result}</p>
            ${(entry.mention || entry.edited !== undefined) &&
            html`<p class="kept-mention">${[entry.mention && bareMention(entry.mention), entry.edited !== undefined && 'retouché'].filter(Boolean).join(' · ')}</p>`}
            <div class="kept-actions">
              <button type="button" class="key copy-entry" aria-label=${`Copier le texte du ${date}`} onClick=${() => onCopy(entry.id)}>Copier</button>
              <button type="button" class="key reopen" aria-label=${`Rouvrir le texte du ${date}`} onClick=${() => onReopen(entry.id)}>Rouvrir</button>
              <button type="button" class="key remove" aria-label=${`Supprimer le texte du ${date}`} onClick=${() => onRemove(entry.id)}>Supprimer</button>
            </div>
            <${Retouch} entry=${entry} onEdit=${onEdit} />
          </li>`;
        })}
      </ol>`}
    </details>
  ` as VNode;
}

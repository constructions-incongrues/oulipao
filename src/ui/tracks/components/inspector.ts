import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { GridStep, InspectorWindow, InstanceLocks, LockField } from '../view-model.ts';

export interface InspectorProps {
  window: InspectorWindow;
  /** Le mot choisi, dans le texte d'origine. */
  word: string;
  onClose: () => void;
  /** L'état du pas du mot choisi. */
  step?: GridStep['state'];
  /** Les verrous qu'on peut poser sur ce mot, par instance. */
  locks?: readonly InstanceLocks[];
  /** Pose (valeur) ou retire (`undefined`) un verrou. */
  onLock?: (id: string, key: string, value: number | undefined) => void;
  /** La prononciation du mot choisi, en clair : « /ʃɛz/ · 1 syllabe · rime /ɛz/ ». */
  pronunciation?: string;
}

const STEP_STATES: Record<GridStep['state'], string> = {
  punched: 'pas percé',
  outline: 'aucune contrainte sur sa piste',
  closed: 'pas bouché : aucune contrainte ne le touche',
};

/** Un champ de verrou : vide, le mot suit l'instance ; une valeur hors bornes est refusée sur place. */
function LockInput({ id, field, onLock }: { id: string; field: LockField; onLock: NonNullable<InspectorProps['onLock']> }): VNode {
  const onChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const raw = input.value.trim();
    if (raw === '') return onLock(id, field.key, undefined);
    const value = Number(raw);
    if (Number.isInteger(value) && value >= field.min && value <= field.max) {
      input.setCustomValidity('');
      return onLock(id, field.key, value);
    }
    // Refusé : le message s'affiche près du champ, la valeur précédente revient.
    input.setCustomValidity(`Un entier entre ${field.min} et ${field.max}.`);
    input.reportValidity();
    input.value = field.value === undefined ? '' : String(field.value);
  };
  return html`<label class="silk lock-field">${field.label}
    <input type="number" step="1" min=${field.min} max=${field.max} value=${field.value ?? ''} placeholder="—"
      aria-label=${`Verrou ${field.label} pour ce mot`} onChange=${onChange} />
  </label>` as VNode;
}

/** Au-delà de cette distance, une colonne se masque sur un écran étroit (`far`). */
const NEAR = 2;

/**
 * L'inspecteur : le mot choisi et ses voisins, une ligne par étape de la chaîne, de l'origine au
 * dernière contrainte ; chaque mot garde sa colonne d'une ligne à l'autre.
 */
export function Inspector({ window, word, onClose, step, locks = [], onLock = () => {}, pronunciation }: InspectorProps): VNode {
  return html`
    <section class="inspector" tabindex="0" aria-label="Inspecteur">
      ${pronunciation && html`<p class="pronunciation"><span class="silk">Prononciation</span> ${pronunciation}</p>`}
      <table>
        <caption>« ${word} » à chaque étape de la chaîne${step ? html` · <span class="step-state">${STEP_STATES[step]}</span>` : ''}</caption>
        <tbody>
          ${window.bands.map(
            (band) => html`<tr>
              <th scope="row">
                ${band.label}
                ${locks.filter((entry) => entry.id === band.id).map(
                  (entry) => html`${entry.fields.map((field) => html`<${LockInput} id=${entry.id} field=${field} onLock=${onLock} />`)}
                    ${entry.note && html`<span class="lock-note">${entry.note}</span>`}`,
                )}
              </th>
              ${band.cells.map((cell, k) => {
                const { distance } = window.columns[k]!;
                const classes = [distance === 0 ? 'chosen' : '', distance > NEAR ? 'far' : ''].join(' ').trim();
                return html`<td class=${classes || undefined} aria-current=${distance === 0 ? 'true' : undefined}>${cell}</td>`;
              })}
            </tr>`,
          )}
        </tbody>
      </table>
      <p class="inspector-help">
        ← → : mot précédent ou suivant · Échap : fermer
        <button type="button" class="close" onClick=${onClose}>Fermer</button>
      </p>
    </section>
  ` as VNode;
}

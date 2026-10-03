import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { InspectorWindow } from '../view-model.ts';

export interface InspectorProps {
  window: InspectorWindow;
  /** Le mot choisi, dans le texte d'origine. */
  word: string;
  /** Passe au mot précédent (−1) ou suivant (+1). */
  onStep: (delta: number) => void;
  onClose: () => void;
}

/** Au-delà de cette distance, une colonne se masque sur un écran étroit (`far`). */
const NEAR = 2;

/**
 * L'inspecteur : le mot choisi et ses voisins, une ligne par étape de la chaîne, de l'origine au
 * dernier filtre ; chaque mot garde sa colonne d'une ligne à l'autre.
 */
export function Inspector({ window, word, onStep, onClose }: InspectorProps): VNode {
  const onKeyDown = (event: KeyboardEvent) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (delta) {
      event.preventDefault();
      onStep(delta);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };
  return html`
    <section class="inspector" tabindex="0" aria-label="Inspecteur" onKeyDown=${onKeyDown}>
      <table>
        <caption>« ${word} » à chaque étape de la chaîne</caption>
        <tbody>
          ${window.bands.map(
            (band) => html`<tr>
              <th scope="row">${band.label}</th>
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

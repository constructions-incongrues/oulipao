import { html } from 'htm/preact';
import type { VNode } from 'preact';

export interface ResultProps {
  text: string;
  copied: boolean;
  onCopy: () => void;
}

/** Le texte résultant et le bouton pour le copier. */
export function Result({ text, copied, onCopy }: ResultProps): VNode {
  return html`
    <section class="result" aria-label="Texte résultant">
      <div class="result-header">
        <h2>Texte résultant</h2>
        <button type="button" class="copy" onClick=${onCopy}>Copier</button>
        <span role="status" aria-live="polite">${copied ? 'Copié.' : ''}</span>
      </div>
      <p class="result-text">${text}</p>
    </section>
  ` as VNode;
}

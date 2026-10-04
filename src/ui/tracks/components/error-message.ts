import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ErrorText } from '../controller.ts';

export interface ErrorMessageProps {
  error: ErrorText;
  /** Relance ce qui a échoué ; absent : pas de bouton. */
  onRetry?: () => void;
}

/**
 * Un message d'erreur selon DESIGN.md : filet rouge au-dessus, tête en rouge et en gras, détail à
 * l'encre, annoncé aussitôt (`role="alert"`), suivi de « Relancer » quand on peut relancer.
 */
export function ErrorMessage({ error, onRetry }: ErrorMessageProps): VNode {
  return html`<p class="error" role="alert">
    <strong>${error.lead}</strong> ${error.detail}${onRetry && html` <button type="button" class="load" onClick=${onRetry}>Relancer</button>`}
  </p>` as VNode;
}

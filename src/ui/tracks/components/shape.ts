import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { Category } from '../../../domain/categories.ts';

/**
 * Le poinçon d'une piste : rond, carré, fente, triangle ou croix (symboles de tracks.html). Plein
 * quand une contrainte agit, en contour sinon. Décoratif : le nom de la piste est toujours écrit à côté.
 */
export function Shape({ track, filled = true }: { track: Category; filled?: boolean }): VNode {
  return html`<svg class=${`shape ${track}`} aria-hidden="true" focusable="false">
    <use href=${`#shape-${track}`} fill=${filled ? 'currentColor' : 'none'} stroke="currentColor" stroke-width=${filled ? 0 : 1.3} />
  </svg>` as VNode;
}

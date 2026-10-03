import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES, type Category } from '../../../domain/categories.ts';
import type { ScoreLayout } from '../types.ts';
import { TRACK_NAMES } from './strip.ts';

export interface ScoreProps {
  layout: ScoreLayout;
  /** Pistes qu'on entend : les autres sont affichées estompées. */
  audible: ReadonlySet<Category>;
}

/**
 * La partition : pour chaque système, la règle (une ligne du texte d'origine) et les cinq
 * pistes, chaque mot en bloc à sa colonne. La piste est nommée : la catégorie d'un mot ne
 * tient pas à la couleur.
 */
export function Score({ layout, audible }: ScoreProps): VNode {
  return html`
    <div class="score" aria-label="Partition du texte">
      ${layout.systems.map(
        (system, number) => html`
          <div class="system" role="group" aria-label=${`Système ${number + 1}`}>
            <div class="lane ruler"><span class="lane-name">Texte</span><span class="cells">${system.ruler}</span></div>
            ${CATEGORIES.map(
              (category) => html`
                <div class=${`lane ${category} ${audible.has(category) ? '' : 'silent'}`.trim()}>
                  <span class="lane-name">${TRACK_NAMES[category]}</span>
                  <span class="cells">
                    ${system.lanes[category].map(
                      (block) => html`<span class="block" title=${block.label} style=${`left:${block.column}ch;width:${block.width}ch`}>${block.label}</span>`,
                    )}
                  </span>
                </div>
              `,
            )}
          </div>
        `,
      )}
    </div>
  ` as VNode;
}

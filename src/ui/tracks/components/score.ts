import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES, type Category } from '../../../domain/categories.ts';
import { TRACK_NAMES, type Block, type ScoreLayout } from '../types.ts';
import type { NounMark } from '../view-model.ts';

export interface ScoreProps {
  layout: ScoreLayout;
  /** Pistes qu'on entend : les autres sont affichées estompées. */
  audible: ReadonlySet<Category>;
  /** Ce que le plugin a fait des noms, par position. */
  marks?: ReadonlyMap<number, NounMark>;
}

/** L'infobulle d'un bloc : le mot, ou ce que le plugin en a fait. */
function blockTitle(block: Block, mark: NounMark | undefined): string {
  if (!mark) return block.label;
  if (mark.state === 'replaced') return `${mark.original} → ${block.label}`;
  return `${mark.original} : laissé tel quel, ${mark.reason}`;
}

/** Un mot de la liste lue à la place de la partition. */
function spoken(block: Block, mark: NounMark | undefined): string {
  if (!mark) return block.label;
  if (mark.state === 'replaced') return `${mark.original} devenu ${block.label}`;
  return `${mark.original} laissé tel quel (${mark.reason})`;
}

/**
 * La partition : pour chaque système, la règle (une ligne du texte d'origine) et les pistes qui
 * y ont des mots, chaque mot en bloc à sa colonne. La piste est nommée : la catégorie d'un mot ne
 * tient pas à la couleur. Les lecteurs d'écran lisent à la place une liste par piste.
 */
export function Score({ layout, audible, marks = new Map() }: ScoreProps): VNode {
  const words = (category: Category) => layout.systems.flatMap((system) => system.lanes[category]);
  return html`
    <div class="score">
      <div aria-hidden="true">
        ${layout.systems.map(
          (system) => html`
            <div class="system">
              <div class="lane ruler"><span class="lane-name">Texte</span><span class="cells">${system.ruler}</span></div>
              ${CATEGORIES.filter((category) => system.lanes[category].length).map(
                (category) => html`
                  <div class=${`lane ${category} ${audible.has(category) ? '' : 'silent'}`.trim()}>
                    <span class="lane-name">${TRACK_NAMES[category]}</span>
                    <span class="cells">
                      ${system.lanes[category].map((block) => {
                        const mark = marks.get(block.index);
                        return html`<span class=${`block ${mark?.state ?? ''}`.trim()} title=${blockTitle(block, mark)}
                          style=${`left:${block.column}ch;width:${block.width}ch`}>${block.label}</span>`;
                      })}
                    </span>
                  </div>
                `,
              )}
            </div>
          `,
        )}
      </div>
      <ul class="sr-only" aria-label="Partition, piste par piste">
        ${CATEGORIES.map((category) => {
          const blocks = words(category);
          const name = `${TRACK_NAMES[category]}${audible.has(category) ? '' : ' (coupée)'}, ${blocks.length} ${blocks.length > 1 ? 'mots' : 'mot'}`;
          return html`<li>${blocks.length ? `${name} : ${blocks.map((block) => spoken(block, marks.get(block.index))).join(', ')}.` : `${name}.`}</li>`;
        })}
      </ul>
    </div>
  ` as VNode;
}

/** Avant tout texte : les cinq pistes, vides, déjà dessinées. */
export function EmptyScore(): VNode {
  return html`
    <div class="score empty" aria-hidden="true">
      <div class="system">
        <div class="lane ruler"><span class="lane-name">Texte</span><span class="cells"></span></div>
        ${CATEGORIES.map((category) => html`<div class=${`lane ${category}`}><span class="lane-name">${TRACK_NAMES[category]}</span><span class="cells"></span></div>`)}
      </div>
    </div>
  ` as VNode;
}

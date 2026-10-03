import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { Category } from '../../../domain/categories.ts';
import type { MixedSegment } from '../../../domain/mixing.ts';
import { TRACK_NAMES } from '../types.ts';
import type { Mark } from '../view-model.ts';

export interface ResultProps {
  segments: MixedSegment[];
  /** Aucun mot ne s'entend. */
  empty: boolean;
  /** Les mots touchés par la chaîne : les remplacés sont soulignés de la couleur de leur piste. */
  marks: ReadonlyMap<number, Mark>;
  /** La piste de chaque mot d'origine. */
  tracks: readonly Category[];
  /** Le mot ouvert dans l'inspecteur. */
  selected?: number;
  /** Ouvre l'inspecteur sur un mot d'origine. */
  onSelect: (index: number) => void;
  /** Les mots qui viennent de changer, et le numéro du changement (pour rejouer l'éclat). */
  changed: ReadonlySet<number>;
  generation: number;
  /** Combien de pistes on entend, sur cinq. */
  audibleCount: number;
  /** Le texte saisi a changé depuis : le résultat est estompé et ne se copie pas. */
  stale: boolean;
  copyMessage: string;
  onCopy: () => void;
}

/** Le texte résultant, en tête de page, et sa copie. */
export function Result({ segments, empty, marks, tracks, selected, onSelect, changed, generation, audibleCount, stale, copyMessage, onCopy }: ResultProps): VNode {
  return html`
    <section class=${`result ${stale ? 'stale' : ''}`.trim()} aria-label="Texte résultant">
      <div class="result-header">
        <h2>Texte résultant</h2>
        <button type="button" class="copy" disabled=${empty || stale} onClick=${onCopy}>Copier</button>
        <span class="copy-message" role="status" aria-live="polite">${copyMessage}</span>
      </div>
      ${empty
        ? html`<p class="result-empty">Toutes les pistes sont coupées.</p>`
        : html`<p class="result-text">${segments.map((segment) => {
            const { index, text } = segment;
            if (index === undefined) return text;
            const mark = marks.get(index);
            const replaced = mark?.state === 'replaced';
            const track = tracks[index]!;
            // L'infobulle nomme la piste : la couleur ne porte jamais seule la catégorie.
            const title = replaced
              ? `${TRACK_NAMES[track]} : ${mark.original} → ${text}`
              : mark?.state === 'kept'
                ? `${TRACK_NAMES[track]} : laissé tel quel, ${mark.reason}`
                : undefined;
            const classes = ['word', replaced ? `replaced ${track}` : '', changed.has(index) ? 'changed' : '', index === selected ? 'selected' : ''].join(' ').replace(/\s+/g, ' ').trim();
            // Seuls les mots changés prennent le focus : deux cents arrêts de tabulation n'aideraient personne.
            // La clé change à chaque geste : l'éclat se rejoue sur un mot qui change encore.
            return html`<span key=${`${index}-${changed.has(index) ? generation : 0}`} class=${classes}
              tabindex=${replaced ? 0 : undefined} title=${title}
              onClick=${() => onSelect(index)}
              onKeyDown=${(event: KeyboardEvent) => event.key === 'Enter' && onSelect(index)}>${text}</span>`;
          })}</p>`}
      ${!empty && audibleCount < 5 && html`<p class="notice">Pistes coupées : le texte est rendu tel quel, sans réparer la phrase.</p>`}
    </section>
  ` as VNode;
}

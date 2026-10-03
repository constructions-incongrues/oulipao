import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { MixedSegment } from '../../../domain/mixing.ts';
import type { NounMark } from '../view-model.ts';

export interface ResultProps {
  segments: MixedSegment[];
  /** Aucun mot ne s'entend. */
  empty: boolean;
  /** Les noms touchés par le plugin : les remplacés sont soulignés. */
  marks: ReadonlyMap<number, NounMark>;
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
export function Result({ segments, empty, marks, changed, generation, audibleCount, stale, copyMessage, onCopy }: ResultProps): VNode {
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
            if (segment.index === undefined) return segment.text;
            const classes = [marks.get(segment.index)?.state === 'replaced' ? 'replaced' : '', changed.has(segment.index) ? 'changed' : ''].join(' ').trim();
            if (!classes) return segment.text;
            // La clé change à chaque geste : l'éclat se rejoue sur un mot qui change encore.
            return html`<span key=${`${segment.index}-${changed.has(segment.index) ? generation : 0}`} class=${classes}>${segment.text}</span>`;
          })}</p>`}
      ${!empty && audibleCount < 5 && html`<p class="notice">Pistes coupées : le texte est rendu tel quel, sans réparer la phrase.</p>`}
    </section>
  ` as VNode;
}

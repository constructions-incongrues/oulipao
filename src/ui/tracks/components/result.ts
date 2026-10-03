import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { Category } from '../../../domain/categories.ts';
import type { MixedSegment } from '../../../domain/mixing.ts';
import { FORM_LABELS, FormSchema, type Form } from '../../../domain/forms/form.ts';
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
  /** Collée en haut de l'écran : la bande se fait compacte. */
  pinned?: boolean;
  copyMessage: string;
  onCopy: () => void;
  /** Le nombre de syllabes de chaque ligne, affiché en bout de ligne ; absent sans filtre phonétique. */
  syllables?: readonly (number | undefined)[];
  /** La forme à refrain posée sur le texte, et son choix ; sans `onForm`, pas de choix affiché. */
  form?: Form;
  onForm?: (form: Form) => void;
}

/** Le compte de syllabes d'une ligne, en bout de ligne. */
const count = (syllables: number | undefined) =>
  syllables === undefined ? '' : html`<span class="syllables" title=${`${syllables} syllabe${syllables > 1 ? 's' : ''}`}>${syllables}</span>`;

/** Un séparateur entre deux mots, avec le compte de chaque ligne qu'il termine ; `line` avance d'autant. */
function between(text: string, syllables: readonly (number | undefined)[] | undefined, line: { at: number }) {
  if (!syllables || !text.includes('\n')) return text;
  return text.split('\n').flatMap((part, k) => (k === 0 ? [part] : [count(syllables[line.at++]), '\n', part]));
}

/** Le texte résultant, en tête de page et collé en haut de l'écran quand on descend, et sa copie. */
export function Result({ segments, empty, marks, tracks, selected, onSelect, changed, generation, audibleCount, stale, pinned = false, copyMessage, onCopy, syllables, form = 'none', onForm }: ResultProps): VNode {
  const line = { at: 0 };
  let refrain: number | undefined;
  /** L'annonce d'un refrain, pour les lecteurs d'écran, au premier morceau de chaque vers recopié. */
  const announce = (copyOf: number | undefined) => {
    const start = copyOf !== undefined && copyOf !== refrain;
    refrain = copyOf;
    return start ? html`<span class="sr-only">Refrain, copie du vers ${copyOf} : </span>` : '';
  };
  return html`
    <section class=${['result', stale ? 'stale' : '', pinned ? 'stuck' : ''].filter(Boolean).join(' ')} aria-label="Texte résultant">
      <div class="result-header">
        <h2 class="silk">Texte résultant</h2>
        <button type="button" class="key copy" disabled=${empty || stale} onClick=${onCopy}>Copier</button>
        <span class="copy-message" role="status" aria-live="polite">${copyMessage}</span>
        ${onForm &&
        html`<label class="silk form-choice">Forme<select class="form" value=${form} onChange=${(event: Event) => onForm(FormSchema.parse((event.currentTarget as HTMLSelectElement).value))}>
          ${FormSchema.options.map((value) => html`<option value=${value} selected=${value === form}>${FORM_LABELS[value]}</option>`)}
        </select></label>`}
      </div>
      ${empty
        ? html`<p class="result-empty">Toutes les pistes sont coupées.</p>`
        : html`<div class="result-scroll"><p class="result-text">${segments.map((segment) => {
            const { index, text, copyOf } = segment;
            if (index === undefined) {
              if (text.includes('\n')) refrain = undefined;
              return copyOf === undefined ? between(text, syllables, line) : html`${announce(copyOf)}<span class="copy">${text}</span>`;
            }
            const mark = marks.get(index);
            const replaced = mark?.state === 'replaced';
            const track = tracks[index]!;
            // L'infobulle nomme la piste : la couleur ne porte jamais seule la catégorie.
            const title = replaced
              ? `${TRACK_NAMES[track]} : ${mark.original} → ${text}`
              : mark?.state === 'kept'
                ? `${TRACK_NAMES[track]} : laissé tel quel, ${mark.reason}`
                : undefined;
            const classes = ['word', copyOf !== undefined ? 'copy' : '', replaced ? `replaced ${track}` : '', changed.has(index) ? 'changed' : '', index === selected ? 'selected' : ''].join(' ').replace(/\s+/g, ' ').trim();
            // Seuls les mots changés prennent le focus : deux cents arrêts de tabulation n'aideraient personne.
            // La clé change à chaque geste : l'éclat se rejoue sur un mot qui change encore.
            return html`${announce(copyOf)}<span key=${`${index}-${copyOf ?? 0}-${changed.has(index) ? generation : 0}`} class=${classes}
              tabindex=${replaced ? 0 : undefined} title=${title}
              onClick=${() => onSelect(index)}
              onKeyDown=${(event: KeyboardEvent) => event.key === 'Enter' && onSelect(index)}>${text}</span>`;
          })}${syllables && count(syllables[line.at])}</p></div>`}
      ${!empty && audibleCount < 5 && html`<p class="notice">Pistes coupées : le texte est rendu tel quel, sans réparer la phrase.</p>`}
    </section>
  ` as VNode;
}

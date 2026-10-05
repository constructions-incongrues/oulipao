import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { Category } from '../../../domain/categories.ts';
import type { MixedSegment } from '../../../domain/mixing.ts';
import { FORM_LABELS, FormSchema, type Form } from '../../../domain/forms/form.ts';
import { TRACK_NAMES } from '../types.ts';
import type { Mark } from '../view-model.ts';
import { tokenize } from '../../../domain/tokenizer.ts';

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
  /** Range le texte dans le carnet ; sans lui, pas de bouton « Garder ». */
  onKeep?: () => void;
  /** Font du texte résultant une nouvelle génération, avec la même chaîne ou sans elle ; sans eux, pas de touches. */
  onIterate?: () => void;
  onFreeze?: () => void;
  /** Une mise en pistes est en cours : on n'itère ni ne fige. */
  busy?: boolean;
  /** Le nombre de syllabes de chaque ligne, affiché en bout de ligne ; absent sans filtre phonétique. */
  syllables?: readonly (number | undefined)[];
  /** La forme à refrain posée sur le texte, et son choix ; sans `onForm`, pas de choix affiché. */
  form?: Form;
  onForm?: (form: Form) => void;
  /** Lance la boucle de tours ; sans lui, pas de touche « Boucler ». */
  onLoop?: () => void;
  /** Une boucle se calcule : « Boucler » attend. */
  looping?: boolean;
  /** Le libellé de « Garder », qui nomme le tour montré ; désactivée, la touche dit pourquoi. */
  keepLabel?: string;
  keepDisabled?: boolean;
  keepTitle?: string;
  /** Faux : les mots ne s'ouvrent pas dans l'inspecteur (un tour autre que le tour en cours). */
  interactive?: boolean;
  /** Ce que dit le papier quand il ne reste aucun mot. */
  emptyText?: string;
  /** Le mot que dit l'écoute, compté dans le texte affiché : il est marqué à l'encre. */
  spoken?: number;
  /** La rangée de la boucle, sous le texte. */
  loopRow?: VNode | false;
  /** Aucune contrainte en marche : l'invite dit que le texte est rendu tel quel, et sa touche mène au catalogue. */
  onBranch?: (from: Element) => void;
}

/** Le compte de syllabes d'une ligne, en bout de ligne. */
const count = (syllables: number | undefined) =>
  syllables === undefined ? '' : html`<span class="syllables" title=${`${syllables} syllabe${syllables > 1 ? 's' : ''}`}>${syllables}</span>`;

/**
 * Les espaces de la ponctuation française, à l'affichage seulement (la copie garde le texte) :
 * fine insécable avant ; ! ?, insécable avant : et », après «. Aucune ligne ne commence par « ; ».
 */
export const frenchSpacing = (text: string) =>
  text.replace(/ ([;!?])/g, ' $1').replace(/ ([:»])/g, ' $1').replace(/« /g, '« ');

/** Un séparateur entre deux mots, avec le compte de chaque ligne qu'il termine ; `line` avance d'autant. */
function between(raw: string, syllables: readonly (number | undefined)[] | undefined, line: { at: number }) {
  const text = frenchSpacing(raw);
  if (!syllables || !text.includes('\n')) return text;
  return text.split('\n').flatMap((part, k) => (k === 0 ? [part] : [count(syllables[line.at++]), '\n', part]));
}

/** Le texte résultant, en tête de page et collé en haut de l'écran quand on descend, et sa copie. */
export function Result({ segments, empty, marks, tracks, selected, onSelect, changed, generation, audibleCount, stale, pinned = false, copyMessage, onCopy, onKeep, onIterate, onFreeze, busy = false, syllables, form = 'none', onForm, onLoop, looping = false, keepLabel = 'Garder', keepDisabled = false, keepTitle, interactive = true, emptyText = 'Toutes les pistes sont coupées.', spoken, loopRow, onBranch }: ResultProps): VNode {
  const line = { at: 0 };
  // Le mot dit par l'écoute : le morceau qui contient le début de ce mot dans le texte affiché.
  const spokenAt = spoken === undefined ? undefined : tokenize(segments.map((segment) => segment.text).join(''))[spoken]?.start;
  let offset = 0;
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
        ${onKeep && html`<button type="button" class="key keep" disabled=${empty || stale || keepDisabled} title=${keepTitle} onClick=${onKeep}>${keepLabel}</button>`}
        ${onIterate &&
        html`<button type="button" class="key iterate" disabled=${empty || stale || busy} title="Garder ce texte, puis lui appliquer de nouveau la même chaîne" onClick=${onIterate}>Itérer</button>`}
        ${onLoop &&
        html`<button type="button" class="key loop" disabled=${empty || stale || busy || looping} title="Garder ce texte, puis rejouer la chaîne sur son résultat, tour après tour" onClick=${onLoop}>Boucler</button>`}
        ${onFreeze &&
        html`<button type="button" class="key freeze" disabled=${empty || stale || busy} title="Garder ce texte, puis en faire un texte de départ, sans chaîne" onClick=${onFreeze}>Figer</button>`}
        <span class="copy-message" role="status" aria-live="polite">${copyMessage}</span>
        ${onForm &&
        html`<label class="silk form-choice">Forme<select class="form" value=${form} onChange=${(event: Event) => onForm(FormSchema.parse((event.currentTarget as HTMLSelectElement).value))}>
          ${FormSchema.options.map((value) => html`<option value=${value} selected=${value === form}>${FORM_LABELS[value]}</option>`)}
        </select></label>`}
      </div>
      ${empty
        ? html`<p class="result-empty">${emptyText}</p>`
        : html`<div class="result-scroll"><p class="result-text">${segments.map((segment) => {
            const { index, text, copyOf } = segment;
            const start = offset;
            offset += text.length;
            if (index === undefined) {
              if (text.includes('\n')) refrain = undefined;
              return copyOf === undefined ? between(text, syllables, line) : html`${announce(copyOf)}<span class="copy">${frenchSpacing(text)}</span>`;
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
            const said = spokenAt !== undefined && spokenAt >= start && spokenAt < offset;
            const classes = ['word', copyOf !== undefined ? 'copy' : '', replaced ? `replaced ${track}` : '', changed.has(index) ? 'changed' : '', index === selected && interactive ? 'selected' : '', said ? 'spoken' : ''].join(' ').replace(/\s+/g, ' ').trim();
            // Seuls les mots changés prennent le focus : deux cents arrêts de tabulation n'aideraient personne.
            // La clé change à chaque geste : l'éclat se rejoue sur un mot qui change encore.
            return html`${announce(copyOf)}<span key=${`${index}-${copyOf ?? 0}-${changed.has(index) ? generation : 0}`} class=${classes}
              tabindex=${replaced && interactive ? 0 : undefined} title=${title}
              onClick=${interactive ? () => onSelect(index) : undefined}
              onKeyDown=${interactive ? (event: KeyboardEvent) => event.key === 'Enter' && onSelect(index) : undefined}>${text}</span>`;
          })}${syllables && count(syllables[line.at])}</p></div>`}
      ${loopRow}
      ${onBranch &&
      html`<p class="idle">Aucune contrainte en marche : le texte est rendu tel quel.
        <button type="button" class="key branch" onClick=${(event: Event) => onBranch(event.currentTarget as Element)}>Brancher une contrainte</button></p>`}
      ${!empty && audibleCount < 5 && html`<p class="notice">Pistes coupées : le texte est rendu tel quel, sans réparer la phrase.</p>`}
    </section>
  ` as VNode;
}

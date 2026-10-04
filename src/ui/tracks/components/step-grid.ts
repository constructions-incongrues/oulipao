import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES, type Category } from '../../../domain/categories.ts';
import type { Tracks } from '../../../domain/mixing.ts';
import { TRACK_NAMES } from '../types.ts';
import type { GridStep } from '../view-model.ts';
import { Shape } from './shape.ts';

export interface StepGridProps {
  /** Un pas par mot d'origine, dans l'ordre du texte. */
  steps: readonly GridStep[];
  tracks: Tracks;
  /** Les pistes qu'on entend. */
  audible: ReadonlySet<Category>;
  /** Rappel des contraintes qui visent chaque piste, dans l'ordre de la chaîne. */
  reminders: Record<Category, readonly string[]>;
  /** Les contraintes qui visent les cinq pistes, rappelées une fois en tête des tranches. */
  allTracks?: readonly string[];
  perPage: number;
  page: number;
  /** Le mot ouvert dans l'inspecteur. */
  selected?: number;
  /** Le numéro du dernier changement du texte : la tête de lecture passe à chaque nouveau. */
  generation: number;
  /** Le pas que l'écoute est en train de dire ; aucun : l'écoute est arrêtée. */
  playing?: number;
  onToggleStep: (index: number) => void;
  onInspect: (index: number) => void;
  onMute: (category: Category) => void;
  onSolo: (category: Category) => void;
  onPage: (page: number) => void;
  /** Le transport de l'écoute, entre le titre et les pages, comme sur la façade d'un séquenceur. */
  transport?: VNode | false;
}

/** Au-delà de ce nombre de pages, des flèches remplacent la liste des pages. */
const MAX_PAGE_BUTTONS = 6;

const STATE_LABELS: Record<GridStep['state'], string> = {
  punched: 'percé, la contrainte agit',
  outline: 'aucune contrainte sur cette piste',
  closed: 'bouché, laissé tel quel',
};

/** Le nom accessible d'un pas : piste, mot, état, et ses verrous. */
const OUTCOMES: Record<NonNullable<GridStep['outcome']>, string> = { changed: 'mot changé', removed: 'mot retiré', unchanged: 'mot inchangé' };

function stepLabel(step: GridStep): string {
  const locks = [...step.locks.map((lock) => `verrou ${lock.value}`), ...(step.modulated ?? []).map((value) => `modulé ${value}`)].join(', ');
  const outcome = step.outcome ? `, ${OUTCOMES[step.outcome]}` : '';
  return `${TRACK_NAMES[step.track]}, ${step.word} : ${STATE_LABELS[step.state]}${outcome}${locks ? `, ${locks}` : ''}`;
}

/** Les touches de page : une par page, ou des flèches quand il y en a trop. */
function Pages({ count, page, perPage, total, onPage }: { count: number; page: number; perPage: number; total: number; onPage: (page: number) => void }): VNode {
  const range = (k: number) => `${k * perPage + 1}–${Math.min(total, (k + 1) * perPage)}`;
  return html`
    <div class="pages" role="group" aria-label="Page de pas">
      <span class="silk" aria-hidden="true">Page</span>
      ${count > MAX_PAGE_BUTTONS
        ? html`<button type="button" class="key prev" aria-label="Page précédente" disabled=${page === 0} onClick=${() => onPage(page - 1)}>‹</button>
            <span class="pos mono" aria-live="polite">${range(page)} / ${total}</span>
            <button type="button" class="key next" aria-label="Page suivante" disabled=${page === count - 1} onClick=${() => onPage(page + 1)}>›</button>`
        : Array.from({ length: count }, (_, k) => html`<button type="button" class="key mono page" aria-pressed=${k === page} onClick=${() => onPage(k)}>${range(k)}</button>`)}
    </div>
  ` as VNode;
}

/**
 * La grille du séquenceur : une ligne par piste avec sa tranche (poinçon, nom, compte, Muet,
 * Seul), une colonne par mot. Un pas percé laisse agir les contraintes ; un clic le bouche.
 */
export function StepGrid(props: StepGridProps): VNode {
  const { steps, tracks, audible, reminders, perPage, page, selected, generation, playing } = props;
  const count = Math.max(1, Math.ceil(steps.length / perPage));
  const shown = steps.slice(page * perPage, (page + 1) * perPage);
  const columns = Array.from({ length: perPage }, (_, k) => shown[k]);
  const counts = Object.fromEntries(CATEGORIES.map((track) => [track, steps.filter((step) => step.track === track).length]));
  return html`
    <section class="rack" aria-labelledby="grid-title">
      <div class="rack-head">
        <h2 class="silk" id="grid-title">Pistes · un pas par mot</h2>
        ${props.transport}
        ${steps.length
          ? html`<${Pages} count=${count} page=${page} perPage=${perPage} total=${steps.length} onPage=${props.onPage} />`
          : html`<p class="rack-empty">Les pas apparaissent une fois le texte mis en pistes.</p>`}
      </div>
      <div class="grid" style=${`--per: ${perPage}`}>
        <div class="corner">
          <span class="silk" aria-hidden="true">Pas</span>
          ${props.allTracks?.length ? html`<p class="reminder">Toutes les pistes : ${props.allTracks.join(' · ')}</p>` : ''}
        </div>
        ${columns.map((step) =>
          step
            ? html`<button type="button" class=${`hd${step.index % 4 === 0 ? ' beat' : ''}${step.index === playing ? ' playing' : ''}`} aria-pressed=${step.index === selected}
                aria-current=${step.index === playing ? 'step' : undefined}
                aria-label=${`Inspecter « ${step.word} », pas ${step.index + 1}`} onClick=${() => props.onInspect(step.index)}>
                <span class="num mono">${step.index + 1}</span><span class="w">${step.word}</span>
              </button>`
            : html`<div class="hd" aria-hidden="true"></div>`,
        )}
        ${CATEGORIES.map((track) => {
          const name = TRACK_NAMES[track];
          const { muted, solo } = tracks[track];
          return html`
            <section class=${`ch ${track}${audible.has(track) ? '' : ' off'}`} aria-label=${`Piste ${name}`}>
              <${Shape} track=${track} />
              <h3 class="name">${name}<span class="count mono">${counts[track]}</span></h3>
              <span class="ch-keys">
                <button type="button" class="key mute" aria-pressed=${muted} aria-label=${`Muet : retirer la piste ${name} du texte`}
                  title="Retirer cette piste du texte" onClick=${() => props.onMute(track)}>Muet</button>
                <button type="button" class="key solo" aria-pressed=${solo} aria-label=${`Seul : ne garder que la piste ${name}`}
                  title="Ne garder que cette piste" onClick=${() => props.onSolo(track)}>Seul</button>
              </span>
              ${reminders[track].length > 0 && html`<p class="reminder">${reminders[track].join(' · ')}</p>`}
            </section>
            ${columns.map((step) => {
              const chosen = step?.index === selected ? ' sel' : '';
              if (!step || step.track !== track) return html`<div class=${`cell${chosen}`} aria-hidden="true"></div>`;
              const lock = step.locks[0];
              // L'issue se lit sans couleur nouvelle : un trou barré à l'encre pour un mot retiré, un trou réduit pour un mot inchangé.
              return html`<button type="button" class=${`cell step ${step.state}${step.outcome ? ` ${step.outcome}` : ''}${chosen}`} aria-pressed=${step.state !== 'closed'}
                aria-label=${stepLabel(step)} onClick=${() => props.onToggleStep(step.index)}>
                <${Shape} track=${track} filled=${step.state === 'punched'} />
                ${lock && html`<span class="lock mono" aria-hidden="true">${lock.value}</span>`}
              </button>`;
            })}
          `;
        })}
        ${generation > 0 && html`<div class="head" key=${generation} aria-hidden="true"></div>`}
      </div>
    </section>
  ` as VNode;
}

import { html } from 'htm/preact';
import type { ComponentChildren, VNode } from 'preact';
import type { Category } from '../../../domain/categories.ts';
import type { TrackState } from '../../../domain/mixing.ts';

/** Nom des pistes, tel qu'affiché. */
export const TRACK_NAMES: Record<Category, string> = {
  noun: 'Noms',
  verb: 'Verbes',
  adjective: 'Adjectifs',
  adverb: 'Adverbes',
  other: 'Autres',
};

export interface StripProps {
  category: Category;
  /** Nombre de mots de la piste. */
  count: number;
  track: TrackState;
  onMute: () => void;
  onSolo: () => void;
  /** L'emplacement de plugin. */
  children?: ComponentChildren;
}

/** La tranche d'une piste : nom, nombre de mots, mute, solo, emplacement de plugin. */
export function Strip({ category, count, track, onMute, onSolo, children }: StripProps): VNode {
  const name = TRACK_NAMES[category];
  return html`
    <section class=${`strip ${category}`} aria-label=${`Piste ${name}`}>
      <h3>${name}</h3>
      <p class="count">${count} ${count > 1 ? 'mots' : 'mot'}</p>
      <div class="buttons">
        <button type="button" class="mute" aria-pressed=${track.muted} aria-label=${`Rendre muette la piste ${name}`} onClick=${onMute}>M</button>
        <button type="button" class="solo" aria-pressed=${track.solo} aria-label=${`Mettre en solo la piste ${name}`} onClick=${onSolo}>S</button>
      </div>
      ${children}
    </section>
  ` as VNode;
}

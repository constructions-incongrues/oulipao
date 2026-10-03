import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { Category } from '../../../domain/categories.ts';
import type { TrackState } from '../../../domain/mixing.ts';
import { TRACK_NAMES } from '../types.ts';

export { TRACK_NAMES };

export interface StripProps {
  category: Category;
  /** Nombre de mots de la piste. */
  count: number;
  track: TrackState;
  onMute: () => void;
  onSolo: () => void;
  /** Rappel des filtres qui visent la piste, dans l'ordre de la chaîne ; ils se règlent dans le rack. */
  reminders?: readonly string[];
}

/** La ligne d'une piste dans la table de mixage : pastille, nom, nombre de mots, Muet, Seul. */
export function Strip({ category, count, track, onMute, onSolo, reminders = [] }: StripProps): VNode {
  const name = TRACK_NAMES[category];
  return html`
    <section class=${`strip ${category}`} aria-label=${`Piste ${name}`}>
      <div class="strip-row">
        <span class="dot" aria-hidden="true"></span>
        <h3>${name}</h3>
        <span class="count">${count} ${count > 1 ? 'mots' : 'mot'}</span>
        <button type="button" class="mute" aria-pressed=${track.muted} aria-label=${`Muet : retirer la piste ${name} du texte`}
          title="Retirer cette piste du texte" onClick=${onMute}>Muet</button>
        <button type="button" class="solo" aria-pressed=${track.solo} aria-label=${`Seul : ne garder que la piste ${name}`}
          title="Ne garder que cette piste" onClick=${onSolo}>Seul</button>
      </div>
      ${reminders.length > 0 && html`<p class="reminder">${reminders.join(' · ')}</p>`}
    </section>
  ` as VNode;
}

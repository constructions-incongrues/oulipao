import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { LoopState } from '../loop.ts';
import { ErrorMessage } from './error-message.ts';
import { Control } from './control.ts';

/** L'annonce de la boucle : avancement, arrêt, point fixe, cycle ou tour vide ; rien quand elle est allée au bout sans histoire. */
export function loopAnnouncement(loop: LoopState): string {
  if (loop.status === 'computing') return `tour ${loop.progress ?? loop.tours.length} sur ${loop.target}…`;
  if (loop.status === 'stopped') return `arrêtée au tour ${loop.tours.length - 1} sur ${loop.target}`;
  if (loop.emptyAt !== undefined) return `tout retiré au tour ${loop.emptyAt}`;
  if (loop.repeat) return loop.repeat.length === 1 ? `point fixe au tour ${loop.repeat.from}` : `cycle de ${loop.repeat.length} à partir du tour ${loop.repeat.from}`;
  return '';
}

export interface TourCursorProps {
  loop: LoopState;
  onShow: (tour: number) => void;
}

/**
 * Le curseur de tours : une rangée de trous sur un filet d'encre, un par tour, de 0 au nombre
 * demandé. Un tour calculé est percé, le tour montré est plein, un tour à venir reste vide ; les
 * tours d'un point fixe ou d'un cycle sont soulignés d'un trait. Clic, glissé, flèches, Début, Fin.
 */
export function TourCursor({ loop, onShow }: TourCursorProps): VNode {
  const last = loop.tours.length - 1;
  const inRepeat = (k: number) => loop.repeat !== undefined && k >= loop.repeat.from && k <= loop.repeat.from + loop.repeat.length;
  const announcement = loopAnnouncement(loop);
  const onKeyDown = (event: KeyboardEvent) => {
    const to = ({ ArrowLeft: loop.shown - 1, ArrowDown: loop.shown - 1, ArrowRight: loop.shown + 1, ArrowUp: loop.shown + 1, Home: 0, End: last } as Record<string, number>)[event.key];
    if (to === undefined) return;
    event.preventDefault();
    onShow(Math.min(Math.max(to, 0), last));
  };
  return html`<div class="tour-cursor" role="slider" tabindex="0" aria-label="Tour montré"
    aria-valuemin="0" aria-valuemax=${loop.target} aria-valuenow=${loop.shown}
    aria-valuetext=${`tour ${loop.shown} sur ${loop.target}${announcement ? `, ${announcement}` : ''}`}
    onKeyDown=${onKeyDown}>
    ${Array.from({ length: loop.target + 1 }, (_, k) => {
      const state = k === loop.shown ? 'shown' : k <= last ? 'computed' : 'ahead';
      const classes = ['hole', state, inRepeat(k) ? 'repeat' : '', k % 4 === 0 ? 'strong' : ''].filter(Boolean).join(' ');
      // Un tour à venir ne se choisit pas ; le glissé passe d'un trou à l'autre, bouton tenu.
      const pick = k <= last ? () => onShow(k) : undefined;
      return html`<span class=${classes} aria-hidden="true" onClick=${pick}
        onPointerEnter=${(event: PointerEvent) => event.buttons === 1 && pick?.()}><i class="num">${k}</i></span>`;
    })}
  </div>` as VNode;
}

export interface LoopRowProps {
  loop: LoopState;
  /** Collée en haut de l'écran : il ne reste que le curseur et le tour montré. */
  pinned?: boolean;
  onShow: (tour: number) => void;
  onStop: () => void;
  onTours: (tours: number) => void;
}

/** La rangée BOUCLE, sous le texte : le curseur, le tour montré, l'annonce, l'arrêt, puis le nombre de tours. */
export function LoopRow({ loop, pinned = false, onShow, onStop, onTours }: LoopRowProps): VNode {
  const announcement = loopAnnouncement(loop);
  return html`<div class=${pinned ? 'loop-row pinned' : 'loop-row'} aria-label="Boucle de tours" role="group">
    <span class="silk">Boucle</span>
    <${TourCursor} loop=${loop} onShow=${onShow} />
    <span class="pos">tour ${loop.shown} / ${loop.target}</span>
    ${!pinned &&
    html`<span class="loop-note" role="status" aria-live="polite">${announcement}</span>
      ${loop.error && html`<${ErrorMessage} error=${loop.error} />`}
      ${loop.status === 'computing' && html`<button type="button" class="key stop-loop" onClick=${onStop}>Arrêter la boucle</button>`}
      <label class="silk loop-tours">Tours <${Control} parameter=${{ kind: 'integer', key: 'tours', label: 'Tours', min: 2, max: 12 }} value=${loop.target}
        onParam=${(_: string, value: number | string) => onTours(Number(value))} /></label>`}
  </div>` as VNode;
}

import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ErrorText, ModelState } from '../controller.ts';
import type { SharedEntry } from '../share-link.ts';
import { ErrorMessage } from './error-message.ts';
import { bareMention } from './notebook.ts';

export interface ArrivalProps {
  entry: SharedEntry;
  /** Le chargement du modèle et du dictionnaire, lancé par « Rejouer » : le premier clic. */
  model: Pick<ModelState, 'status' | 'error'>;
  /** La raison pour laquelle l'entrée ne peut pas être rouverte. */
  error?: ErrorText;
  onReplay: () => void;
  onClose: () => void;
}

/**
 * La vue d'arrivée d'un lien partagé : on lit avant de jouer. D'abord le texte (la retouche, avec le
 * résultat produit à côté), puis d'où il vient (l'ancêtre, l'original), puis la chaîne ; enfin
 * « Rejouer », qui charge le modèle à ce premier clic, et « Fermer ».
 */
export function Arrival({ entry, model, error, onReplay, onClose }: ArrivalProps): VNode {
  const loading = model.status === 'loading';
  return html`<section class="arrival" aria-labelledby="arrival-title">
    <div class="result-header">
      <h2 class="silk" id="arrival-title" tabindex="-1">Texte reçu</h2>
    </div>
    <p class="result-text">${entry.edited ?? entry.result}</p>
    ${entry.edited !== undefined && html`<p class="kept-origin"><span class="silk">Produit</span> ${entry.result}</p>`}
    ${entry.lineage && html`<p class="kept-origin"><span class="silk">Ancêtre</span> ${entry.lineage.ancestor}</p>`}
    <p class="kept-origin"><span class="silk">${entry.lineage ? 'Parent' : 'Original'}</span> ${entry.source.text}</p>
    ${entry.mention && html`<p class="kept-mention">${bareMention(entry.mention)}</p>`}
    ${model.status === 'error' && model.error && html`<${ErrorMessage} error=${model.error} />`}
    ${error && html`<${ErrorMessage} error=${error} />`}
    <div class="kept-actions">
      <button type="button" class="key replay" disabled=${loading} onClick=${onReplay}>${loading ? 'Chargement…' : 'Rejouer'}</button>
      <button type="button" class="key close-arrival" onClick=${onClose}>Fermer</button>
    </div>
  </section>` as VNode;
}

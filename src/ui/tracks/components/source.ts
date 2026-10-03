import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ModelState } from '../controller.ts';

export interface SourceProps {
  input: string;
  /** Nombre de mots du texte mis en pistes. */
  words: number;
  /** Saisie dépliée, ou repliée en une ligne. */
  editing: boolean;
  /** Un texte a-t-il déjà été mis en pistes ? */
  started: boolean;
  tagging: boolean;
  message: string;
  model: ModelState;
  onInput: (text: string) => void;
  onEdit: () => void;
  onRun: () => void;
  onExample: () => void;
  onLoad: () => void;
}

const megabytes = (bytes: number) => Math.round(bytes / 1e6);

/** L'état du chargement du modèle, sous la saisie. */
function Loading({ model, onLoad }: Pick<SourceProps, 'model' | 'onLoad'>): VNode | null {
  switch (model.status) {
    case 'waiting':
      return html`<p class="loading">
        <button type="button" class="load" onClick=${onLoad}>Charger le modèle (141 Mo)</button>
        Votre navigateur demande d'économiser les données : le modèle attend votre accord.
      </p>` as VNode;
    case 'loading':
      return html`<p class="loading">
        <progress max=${model.total || undefined} value=${model.total ? model.loaded : undefined} aria-label="Chargement du modèle"></progress>
        ${`${model.total ? `Chargement du modèle : ${megabytes(model.loaded)} / ${megabytes(model.total)} Mo` : 'Chargement du modèle…'} — une seule fois, puis gardé par votre navigateur.`}
      </p>` as VNode;
    case 'error':
      return html`<p class="loading error" role="alert">${model.error} <button type="button" class="load" onClick=${onLoad}>Relancer</button></p>` as VNode;
    case 'ready':
      return null;
  }
}

/** La saisie : dépliée pour coller un texte, repliée en « Texte : N mots · Modifier » une fois mis en pistes. */
export function Source(props: SourceProps): VNode {
  const { input, words, editing, started, tagging, message, model } = props;
  if (!editing) {
    return html`
      <div class="source folded">
        <span>Texte : ${words} ${words > 1 ? 'mots' : 'mot'}</span>
        <button type="button" class="edit" onClick=${props.onEdit}>Modifier</button>
      </div>
    ` as VNode;
  }
  return html`
    <div class="source">
      <label for="input">Texte</label>
      <textarea id="input" placeholder="Collez un texte en français…" value=${input}
        onInput=${(event: Event) => props.onInput((event.currentTarget as HTMLTextAreaElement).value)}></textarea>
      <div class="controls">
        <button type="button" class="run" disabled=${model.status !== 'ready' || tagging} onClick=${props.onRun}>Mettre en pistes</button>
        ${!started && html`<button type="button" class="example" disabled=${tagging} onClick=${props.onExample}>Essayer avec un exemple</button>`}
        <span class="input-message" role="status" aria-live="polite">${tagging ? 'Étiquetage du texte…' : message}</span>
      </div>
      <${Loading} model=${model} onLoad=${props.onLoad} />
      <p class="privacy">Le texte collé reste dans ce navigateur : il n'est envoyé nulle part.</p>
    </div>
  ` as VNode;
}

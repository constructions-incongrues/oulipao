import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ModelState } from '../controller.ts';
import type { Example } from '../examples.ts';
import { ErrorMessage } from './error-message.ts';

export interface SourceProps {
  input: string;
  /** Nombre de mots du texte mis en pistes. */
  words: number;
  /** Saisie dépliée, ou repliée en une ligne. */
  editing: boolean;
  /** Libellé du bouton d'exemple ; absent, le bouton est caché (la saisie tient un texte à soi). */
  exampleLabel?: string;
  /** L'exemple que la saisie contient tel quel, à nommer. */
  example?: Example;
  tagging: boolean;
  message: string;
  model: ModelState;
  onInput: (text: string) => void;
  onEdit: () => void;
  onRun: () => void;
  onExample: () => void;
  onLoad: () => void;
}

/** « Marcel Proust, Du côté de chez Swann (1913) ». */
const credit = ({ author, title, year }: Example) => html`${author}, <cite>${title}</cite> (${year})`;

const megabytes = (bytes: number) => Math.round(bytes / 1e6);

/** L'état du chargement du modèle, sous la saisie. */
function Loading({ model, onLoad }: Pick<SourceProps, 'model' | 'onLoad'>): VNode | null {
  switch (model.status) {
    case 'waiting':
      return html`<p class="loading">
        <button type="button" class="load" onClick=${onLoad}>Charger le modèle (141 Mo)</button>
        Il se télécharge une fois depuis jsDelivr et Hugging Face, qui voient alors votre adresse.
      </p>` as VNode;
    case 'loading':
      return html`<p class="loading">
        <progress max=${model.total || undefined} value=${model.total ? model.loaded : undefined} aria-label="Chargement du modèle"></progress>
        ${`${model.total ? `Chargement du modèle : ${megabytes(model.loaded)} / ${megabytes(model.total)} Mo` : 'Chargement du modèle…'} — une seule fois, puis gardé par votre navigateur.`}
      </p>` as VNode;
    case 'error':
      return html`<${ErrorMessage} error=${model.error!} onRetry=${onLoad} />` as VNode;
    case 'ready':
      return null;
  }
}

/** La saisie : dépliée pour coller un texte, repliée en « Texte : N mots · Modifier » une fois mis en pistes. */
export function Source(props: SourceProps): VNode {
  const { input, words, editing, exampleLabel, example, tagging, message, model } = props;
  if (!editing) {
    return html`
      <div class="source folded">
        <span>Texte : ${words} ${words > 1 ? 'mots' : 'mot'}${example && html` · <span class="example-source">${credit(example)}</span>`}</span>
        <button type="button" class="edit" onClick=${props.onEdit}>Modifier</button>
      </div>
    ` as VNode;
  }
  return html`
    <div class="source">
      <label for="input" class="silk">Texte</label>
      <textarea id="input" placeholder="Collez un texte en français…" value=${input}
        onInput=${(event: Event) => props.onInput((event.currentTarget as HTMLTextAreaElement).value)}></textarea>
      <div class="controls">
        <button type="button" class="run" disabled=${model.status === 'loading' || tagging} onClick=${props.onRun}>Mettre en pistes</button>
        ${exampleLabel && html`<button type="button" class="example" disabled=${tagging} onClick=${props.onExample}>${exampleLabel}</button>`}
        <span class="input-message" role="status" aria-live="polite">${tagging ? 'Étiquetage du texte…' : message}</span>
      </div>
      ${example && html`<p class="example-source">${credit(example)}</p>`}
      <${Loading} model=${model} onLoad=${props.onLoad} />
      <p class="privacy">Le texte collé reste dans ce navigateur : il n'est envoyé nulle part.</p>
    </div>
  ` as VNode;
}

// Montage de la page des pistes sur le DOM. Exclu de la couverture de tests : tout ce qui se
// teste est dans controller.ts, view-model.ts et les composants.
import { html } from 'htm/preact';
import { render } from 'preact';
import { createMorphologyLoader, createNeuralTagging } from '../composition.ts';
import { App } from './app.ts';
import { createTracksController, type TracksState } from './controller.ts';

const root = document.getElementById('app')!;
const { tagger, preload } = createNeuralTagging();
const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
// À l'ouverture de l'inspecteur, le focus y passe, pour que les flèches et Échap répondent.
let inspecting = false;
const draw = (state: TracksState) => {
  render(html`<${App} state=${state} controller=${controller} />`, root);
  if (state.selected !== undefined && !inspecting) root.querySelector<HTMLElement>('.inspector')?.focus();
  inspecting = state.selected !== undefined;
};
const controller = createTracksController(
  {
    tagger,
    preload,
    loadMorphology: createMorphologyLoader(import.meta.url),
    copy: (text) => navigator.clipboard.writeText(text),
    saveData: connection?.saveData === true,
  },
  draw,
);
draw(controller.state);
controller.start();

// Montage de la page des pistes sur le DOM. Exclu de la couverture de tests : tout ce qui se
// teste est dans controller.ts, view-model.ts et les composants.
import { html } from 'htm/preact';
import { render } from 'preact';
import { createMorphologyLoader, createNeuralTagger } from '../composition.ts';
import { App } from './app.ts';
import { createTracksController, type TracksState } from './controller.ts';

const root = document.getElementById('app')!;
const draw = (state: TracksState) => render(html`<${App} state=${state} controller=${controller} />`, root);
const controller = createTracksController(
  {
    tagger: createNeuralTagger(),
    loadMorphology: createMorphologyLoader(import.meta.url),
    copy: (text) => navigator.clipboard.writeText(text),
  },
  draw,
);
draw(controller.state);

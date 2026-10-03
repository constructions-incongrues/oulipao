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
const draw = (state: TracksState) => render(html`<${App} state=${state} controller=${controller} />`, root);
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

// Largeur des systèmes : la place laissée à la partition, en caractères de sa police, mesurée
// à chaque redimensionnement (regroupé par image). Le témoin de mesure est retiré aussitôt :
// laissé en place, il élargirait la page sur un téléphone.
const charWidth = () => {
  const probe = document.createElement('span');
  probe.className = 'score probe';
  probe.textContent = '0'.repeat(100);
  document.body.append(probe);
  const width = probe.getBoundingClientRect().width / 100;
  probe.remove();
  return width;
};
let frame = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const stage = root.querySelector<HTMLElement>('.score-frame');
    const laneName = root.querySelector<HTMLElement>('.lane-name');
    if (!stage || !laneName) return;
    controller.setWidth((stage.clientWidth - laneName.offsetWidth) / charWidth());
  });
}).observe(root);

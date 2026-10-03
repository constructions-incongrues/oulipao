import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { App } from '../../../src/ui/tracks/app.ts';
import { createTracksController } from '../../../src/ui/tracks/controller.ts';
import type { MixerAction } from '../../../src/ui/tracks/types.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { byClass, byLabel, elements, find, inputEvent } from '../../support/vnode.ts';

const setup = () => {
  const copied: string[] = [];
  const controller = createTracksController({
    tagger: { name: 'factice', tag: (text) => tag(text) },
    loadMorphology: async () => morphology(),
    copy: async (text) => void copied.push(text),
  });
  const app = () => html`<${App} state=${controller.state} controller=${controller} />`;
  return { controller, app, copied };
};

test('avant l’étiquetage : la saisie et le bouton, pas de table ni de partition', () => {
  const { app } = setup();
  const out = renderToString(app());
  assert.match(out, /<h1>Potao — pistes<\/h1>/);
  assert.match(out, /<textarea id="input"/);
  assert.match(out, /Mettre en pistes/);
  assert.doesNotMatch(out, /Table de mixage|class="score"|Texte résultant/);
});

test('après l’étiquetage : cinq tranches, le S+7 sur les noms, la partition, le résultat', async () => {
  const { controller, app } = setup();
  (find(app(), (e) => e.type === 'textarea').props['onInput'] as (event: Event) => void)(inputEvent('La vieille ferme du village dort.'));
  assert.equal(controller.state.input, 'La vieille ferme du village dort.');
  (find(app(), byClass('run')).props['onClick'] as () => void)();
  assert.match(renderToString(app()), /<button type="button" class="run" disabled/);
  assert.match(renderToString(app()), /class="status loading"[^>]*>Chargement/);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const out = renderToString(app());
  assert.equal(elements(app()).filter(byClass('strip')).length, 5);
  assert.equal(elements(app()).filter(byClass('plugin')).length, 1);
  assert.equal(elements(app()).filter(byClass('empty')).length, 4);
  assert.match(out, /2 noms remplacés sur 2\./);
  assert.match(out, /<p class="result-text">Le vieil oncle du cheval dort\.<\/p>/);
  assert.match(out, /title="oncle"/);
});

test('chaque réglage de la page passe par le contrôleur', async () => {
  const { controller, app, copied } = setup();
  const actions: MixerAction[] = [];
  const dispatch = controller.dispatch.bind(controller);
  controller.dispatch = (action) => (actions.push(action), dispatch(action));
  controller.setInput('La vieille ferme dort.');
  await controller.run();
  const click = (predicate: Parameters<typeof find>[1]) => (find(app(), predicate).props['onClick'] as () => void)();

  click(byLabel('Rendre muette la piste Adjectifs'));
  assert.match(renderToString(app()), /<p class="result-text">Le oncle dort\.<\/p>/);
  assert.match(renderToString(app()), /<div class="lane adjective silent">/);
  click(byLabel('Mettre en solo la piste Verbes'));
  assert.match(renderToString(app()), /<p class="result-text">dort\.<\/p>/);
  click(byLabel('Plugin S+7 actif'));
  assert.match(renderToString(app()), /Plugin coupé : texte d’origine\./);
  (find(app(), (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('3'));
  (find(app(), (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('same-gender'));
  assert.deepEqual(actions, [
    { type: 'toggle-mute', category: 'adjective' },
    { type: 'toggle-solo', category: 'verb' },
    { type: 'toggle-plugin' },
    { type: 'set-offset', offset: 3 },
    { type: 'set-mode', mode: 'same-gender' },
  ]);
  click(byClass('copy'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(copied, ['dort.']);
  assert.match(renderToString(app()), /Copié\./);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { InMemoryScales } from '../../../src/adapters/morphology/in-memory-scales.ts';
import { SCALES_LOADING } from '../../../src/domain/s7/plugin.ts';
import { App } from '../../../src/ui/tracks/app.ts';
import { Inspector } from '../../../src/ui/tracks/components/inspector.ts';
import { createTracksController, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { inspectorWindow } from '../../../src/ui/tracks/view-model.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { find } from '../../support/vnode.ts';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const scales = () =>
  new InMemoryScales(
    (['ferme', 'école', 'maison'] as const).map((lemma, i) => ({ order: 'valence' as const, category: 'noun' as const, lemma, score: [10, 20, 30][i]! })),
  );
const setup = (overrides: Partial<TracksDependencies> = {}) =>
  createTracksController({
    tagger: { name: 'factice', tag: (text) => tag(text) },
    loadMorphology: async () => morphology(),
    preload: async () => {},
    copy: async () => {},
    ...overrides,
  });
/** Un S+1 sur les noms ; `valence` : rangé par valence. */
const s1 = (controller: ReturnType<typeof setup>, valence = true) => {
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 1 });
  if (valence) controller.dispatch({ type: 'set-param', id: 's7-1', key: 'order', value: 'valence' });
};

test('S+n dans l’ordre du dictionnaire : les échelles ne sont pas demandées', async () => {
  let asked = 0;
  const controller = setup({ loadScales: async () => (asked++, scales()) });
  s1(controller, false);
  controller.setInput('La ferme dort.');
  await controller.run();
  await tick();
  assert.equal(asked, 0);
  assert.equal(controller.state.scales.status, 'idle');
});

test('Premier V+n : d’abord la raison du chargement, puis le recalcul ; la bande et la note dans l’inspecteur', async () => {
  let release!: () => void;
  let asked = 0;
  const controller = setup({ loadScales: () => (asked++, new Promise((resolve) => (release = () => resolve(scales())))) });
  controller.setInput('La ferme dort.');
  await controller.run();
  s1(controller);
  assert.equal(controller.state.scales.status, 'loading');
  assert.equal(controller.state.view!.result, 'La ferme dort.');
  assert.deepEqual(controller.state.view!.marks.get(1), { state: 'kept', original: 'ferme', reason: SCALES_LOADING });
  release();
  await tick();
  assert.equal(controller.state.scales.status, 'ready');
  assert.equal(controller.state.view!.result, "L'école dort.");
  await controller.loadScales(); // déjà là : rien de plus
  assert.equal(asked, 1);
  const window = inspectorWindow(controller.state.view!, 1, 0, 2);
  const band = window.bands.find((candidate) => candidate.id === 's7-1')!;
  assert.equal(band.label, 'V+1 sur les noms');
  assert.deepEqual(band.cells[1], { text: 'école', newline: false, detail: 'valence 10 → 20' });
  assert.match(renderToString(html`<${Inspector} window=${window} word="ferme" onClose=${() => {}} />`), /école<span class="detail">valence 10 → 20<\/span>/);
});

test('Échec des échelles : l’erreur reste, le texte aussi, la relance les charge', async () => {
  let calls = 0;
  const controller = setup({ loadScales: async () => (calls++ === 0 ? Promise.reject(new Error('404')) : scales()) });
  controller.setInput('La ferme dort.');
  await controller.run();
  s1(controller);
  await tick();
  assert.deepEqual(controller.state.scales, { status: 'error', error: { lead: 'Le chargement des échelles a échoué.', detail: '404.' } });
  assert.equal(controller.state.view!.result, 'La ferme dort.');
  const out = renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.2.0" />`);
  assert.match(out, /<p class="error" role="alert">\s*<strong>Le chargement des échelles a échoué\.<\/strong> 404\. <button type="button" class="load">Relancer<\/button>/);
  const retry = find(App({ state: controller.state, controller, version: '0.2.0' }), (node) => node.props['class'] === 'load');
  (retry.props['onClick'] as () => void)();
  await tick();
  assert.equal(controller.state.scales.status, 'ready');
  assert.equal(controller.state.view!.result, "L'école dort.");
});

test('Sans chargeur d’échelles : rien n’est demandé, le V+n attend', async () => {
  const controller = setup();
  controller.setInput('La ferme dort.');
  await controller.run();
  s1(controller);
  await controller.loadScales();
  assert.equal(controller.state.scales.status, 'idle');
  assert.equal(controller.state.view!.result, 'La ferme dort.');
});

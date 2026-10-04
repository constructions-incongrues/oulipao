import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { Transport, type TransportProps } from '../../../src/ui/tracks/components/transport.ts';
import { App } from '../../../src/ui/tracks/app.ts';
import { createTracksController } from '../../../src/ui/tracks/controller.ts';
import { SAMPLE_TEXT, SEED } from '../../support/chain.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { fakeSpeech } from '../../support/speech.ts';
import { byClass, find, inputEvent } from '../../support/vnode.ts';

const props = (overrides: Partial<TransportProps> = {}) => {
  const calls: string[] = [];
  const all: TransportProps = {
    playing: false,
    tempo: 3,
    voices: [{ id: 'fr-1', name: 'Amélie' }, { id: 'fr-2', name: 'Thomas' }],
    onToggle: () => calls.push('toggle'),
    onTempo: (tempo) => calls.push(`tempo ${tempo}`),
    onVoice: (voice) => calls.push(`voice ${voice}`),
    ...overrides,
  };
  return { all, calls };
};

test('Transport : écouter, tempo, voix ; enfoncé pendant l’écoute ; les gestes remontent', () => {
  const { all, calls } = props({ voice: 'fr-2' });
  const node = html`<${Transport} ...${all} />`;
  const out = renderToString(node);
  assert.match(out, /<section class="transport" aria-label="Écoute"><span class="play-key"><button type="button" class="key play" aria-pressed="false" aria-keyshortcuts="Space">Écouter<\/button><span class="silk shortcut" aria-hidden="true">Espace<\/span><\/span>/);
  assert.doesNotMatch(out, /title=/);
  assert.match(out, /<option value="fr-2" selected>Thomas<\/option>/);
  assert.match(out, /type="number" step="1" min="1" max="5" value="3"/);
  assert.match(renderToString(html`<${Transport} ...${props({ playing: true }).all} />`), /aria-pressed="true"[^>]*>Arrêter<\/button>/);
  (find(node, byClass('play')).props['onClick'] as () => void)();
  (find(node, (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('4'));
  (find(node, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('fr-1'));
  assert.deepEqual(calls, ['toggle', 'tempo 4', 'voice fr-1']);
  // sans voix gardée : la première voix est montrée
  assert.match(renderToString(html`<${Transport} ...${props().all} />`), /<option value="fr-1" selected>Amélie<\/option>/);
});

test('Transport : sans voix française, bouton désactivé et message, ni tempo ni voix', () => {
  const out = renderToString(html`<${Transport} ...${props({ voices: [] }).all} />`);
  assert.match(out, /class="key play" aria-pressed="false" disabled/);
  assert.doesNotMatch(out, /aria-keyshortcuts|class="silk shortcut"/); // pas de raccourci sans voix
  assert.match(out, /Aucune voix française n’est installée sur ce système : l’écoute est impossible\./);
  assert.doesNotMatch(out, /<select|type="number"/);
});

test('App : le transport paraît une fois le texte en pistes, et la grille marque le pas que dit l’écoute', async () => {
  const controller = createTracksController({
    tagger: { name: 'factice', tag: (text) => tag(text) },
    loadMorphology: async () => morphology(),
    preload: async () => {},
    copy: async () => {},
    speech: fakeSpeech(),
    sleep: () => new Promise(() => {}),
  });
  for (const action of SEED) controller.dispatch(action);
  const app = () => renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.3.0" />`);
  assert.doesNotMatch(app(), /class="transport"/);
  controller.setInput(SAMPLE_TEXT);
  await controller.run();
  assert.match(app(), /class="transport"/);
  assert.doesNotMatch(app(), /aria-current/);
  controller.play();
  assert.match(app(), /class="hd beat playing" aria-pressed="false" aria-current="step" aria-label="Inspecter « Le », pas 1"/);
  controller.stop();
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { Arrival } from '../../../src/ui/tracks/components/arrival.ts';
import { App } from '../../../src/ui/tracks/app.ts';
import { createTracksController } from '../../../src/ui/tracks/controller.ts';
import { initialState } from '../../../src/ui/tracks/mixer-state.ts';
import type { SharedEntry } from '../../../src/ui/tracks/share-link.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { byClass, find } from '../../support/vnode.ts';

const entry: SharedEntry = {
  result: 'L’oncle.',
  mention: '\n\n— S+7 sur les noms (Oulipao)',
  source: { text: 'La ferme.', tagged: [] },
  mixer: initialState,
};
const handlers = (calls: string[]) => ({ onReplay: () => calls.push('rejouer'), onClose: () => calls.push('fermer') });
const ready = { status: 'waiting' as const };

test('arrivée : le texte, puis l’original, puis la chaîne ; « Rejouer » et « Fermer »', () => {
  const calls: string[] = [];
  const view = html`<${Arrival} entry=${entry} model=${ready} ...${handlers(calls)} />`;
  const out = renderToString(view);
  assert.match(out, /<h2 class="silk" id="arrival-title" tabindex="-1">Texte reçu<\/h2>/);
  assert.match(out, /<p class="result-text">L’oncle\.<\/p><p class="kept-origin"><span class="silk">Original<\/span> La ferme\.<\/p><p class="kept-mention">S\+7 sur les noms \(Oulipao\)<\/p>/);
  assert.doesNotMatch(out, /Produit|Ancêtre|role="alert"/);
  (find(view, byClass('replay')).props['onClick'] as () => void)();
  (find(view, byClass('close-arrival')).props['onClick'] as () => void)();
  assert.deepEqual(calls, ['rejouer', 'fermer']);
});

test('arrivée d’une entrée retouchée : la retouche, et le résultat produit à côté', () => {
  const out = renderToString(html`<${Arrival} entry=${{ ...entry, edited: 'L’oncle dort.' }} model=${ready} ...${handlers([])} />`);
  assert.match(out, /<p class="result-text">L’oncle dort\.<\/p><p class="kept-origin"><span class="silk">Produit<\/span> L’oncle\.<\/p>/);
});

test('arrivée d’une deuxième génération : l’ancêtre avant le parent', () => {
  const second = { ...entry, result: 'Le village.', source: { text: 'L’oncle.', tagged: [] }, lineage: { parent: 'p', ancestor: 'La ferme.', passes: ['S+7 sur les noms'] } };
  const out = renderToString(html`<${Arrival} entry=${second} model=${ready} ...${handlers([])} />`);
  assert.match(out, /Le village\.<\/p><p class="kept-origin"><span class="silk">Ancêtre<\/span> La ferme\.<\/p><p class="kept-origin"><span class="silk">Parent<\/span> L’oncle\.<\/p>/);
});

test('arrivée pendant le chargement, puis hors ligne : « Chargement… » désactivé, puis la raison et un nouvel essai', () => {
  const loading = renderToString(html`<${Arrival} entry=${entry} model=${{ status: 'loading' }} ...${handlers([])} />`);
  assert.match(loading, /class="key replay" disabled>Chargement…<\/button>/);
  const failed = renderToString(
    html`<${Arrival} entry=${entry} model=${{ status: 'error', error: { lead: 'Le chargement du modèle a échoué.', detail: 'réseau coupé.' } }} error=${{ lead: 'Ce texte ne peut pas être rouvert :', detail: 'x.' }} ...${handlers([])} />`,
  );
  assert.match(failed, /role="alert"><strong>Le chargement du modèle a échoué\.<\/strong> réseau coupé\./);
  assert.match(failed, /<strong>Ce texte ne peut pas être rouvert :<\/strong>/);
  assert.match(failed, /class="key replay">Rejouer<\/button>/);
});

test('la page : la vue d’arrivée en tête, et le message d’un lien illisible', async () => {
  const make = (arrival: Promise<SharedEntry | 'unreadable'>) =>
    createTracksController({ tagger: { name: 'factice', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {}, arrival });
  const received = make(Promise.resolve(entry));
  const broken = make(Promise.resolve('unreadable'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const page = (controller: ReturnType<typeof make>) => renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.2.0" />`);
  assert.match(page(received), /<\/header><section class="arrival" aria-labelledby="arrival-title">/);
  assert.match(page(broken), /<p class="arrival-message" role="status">Ce lien n’est pas lisible\.<\/p>/);
  assert.doesNotMatch(page(broken), /class="arrival"/);
});

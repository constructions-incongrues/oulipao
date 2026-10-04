import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import renderToString from 'preact-render-to-string';
import { StalledError } from '../../../src/ports/stalled.ts';
import { App } from '../../../src/ui/tracks/app.ts';
import { ErrorMessage } from '../../../src/ui/tracks/components/error-message.ts';
import { claimsSpace, createTracksController, loadingError, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { morphology, tag } from '../../support/morphology.ts';

const setup = (overrides: Partial<TracksDependencies> = {}) =>
  createTracksController({ tagger: { name: 'factice', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {}, ...overrides });

test('un chargement calé est dit tel quel, pour chaque ressource', () => {
  for (const resource of ['du modèle', 'du dictionnaire', 'des verbes', 'des prononciations']) {
    assert.deepEqual(loadingError(new StalledError(resource, 30), 'du modèle'), {
      lead: `Le chargement ${resource} ne progresse plus.`,
      detail: 'Rien reçu depuis 30 secondes : la connexion est peut-être coupée.',
    });
  }
  assert.deepEqual(loadingError(new Error('503'), 'des verbes'), { lead: 'Le chargement des verbes a échoué.', detail: '503.' });
});

test('un préchargement calé : message dédié, et « Relancer » recharge', async () => {
  let attempts = 0;
  const controller = setup({
    preload: async () => {
      if (attempts++ === 0) throw new StalledError('du modèle', 30);
    },
  });
  await controller.preload();
  assert.equal(controller.state.model.error?.lead, 'Le chargement du modèle ne progresse plus.');
  const out = renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.3.0" />`);
  assert.match(out, /<strong>Le chargement du modèle ne progresse plus\.<\/strong> Rien reçu depuis 30 secondes : la connexion est peut-être coupée\. <button type="button" class="load">Relancer/);
  await controller.preload();
  assert.equal(controller.state.model.status, 'ready');
});

test('le message d’erreur : filet, tête en gras, détail, relance seulement si on peut relancer', () => {
  const error = { lead: 'Suppression impossible :', detail: 'verrouillé.' };
  const plain = renderToString(html`<${ErrorMessage} error=${error} />`);
  assert.match(plain, /^<p class="error" role="alert">\s*<strong>Suppression impossible :<\/strong> verrouillé\.\s*<\/p>$/);
  assert.match(renderToString(html`<${ErrorMessage} error=${error} onRetry=${() => {}} />`), /<button type="button" class="load">Relancer<\/button>/);
});

test('les verbes et les prononciations annoncent leur chargement, puis le retirent', async () => {
  let releaseVerbs: (() => void) | undefined;
  const controller = setup({
    loadVerbs: () => new Promise((resolve) => (releaseVerbs = () => resolve(undefined as never))),
    loadPhonetics: () => new Promise(() => {}),
  });
  controller.setInput('Le chat dort.');
  await controller.run();
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.dispatch({ type: 'set-targets', id: 's7-1', targets: ['verb'] });
  controller.dispatch({ type: 'add-instance', plugin: 'homophony' });
  const render = () => renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.3.0" />`);
  assert.match(render(), /<p class="loading" role="status">Chargement des verbes…<\/p>/);
  assert.match(render(), /<p class="loading" role="status">Chargement des prononciations…<\/p>/);
  releaseVerbs!();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.doesNotMatch(render(), /Chargement des verbes…/);
});

test('mise en pistes puis réouverture, et le chargement échoue : le bouton redevient actif', async () => {
  let fail: ((error: Error) => void) | undefined;
  const controller = setup({ preload: () => new Promise<void>((_, reject) => (fail = reject)) });
  // Une entrée à rouvrir, gardée par une autre page.
  const other = setup();
  other.setInput('La ferme.');
  await other.run();
  other.dispatch({ type: 'add-instance', plugin: 's7' });
  other.keep();
  controller.importNotebook(JSON.stringify({ version: 1, entries: other.state.notebook }));
  controller.setInput('Le chat dort.');
  const running = controller.run();
  assert.equal(controller.state.tagging, true);
  const reopening = controller.reopen(other.state.notebook[0]!.id);
  fail!(new Error('hors ligne'));
  await Promise.all([running, reopening]);
  assert.equal(controller.state.tagging, false);
  assert.equal(controller.state.model.status, 'error');
  const out = renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.3.0" />`);
  assert.match(out, /<button type="button" class="run">Mettre en pistes<\/button>/);
});

test('la saisie est normalisée : un accent décomposé vaut la lettre précomposée', async () => {
  const decomposed = 'L’école dort.';
  const composed = 'L’école dort.';
  assert.notEqual(decomposed, composed);
  const results: string[] = [];
  for (const text of [decomposed, composed]) {
    const controller = setup();
    controller.dispatch({ type: 'add-instance', plugin: 's7' });
    controller.setInput(text);
    assert.equal(controller.state.input, composed);
    await controller.run();
    results.push(controller.state.view!.result);
  }
  assert.equal(results[0], results[1]);
  assert.notEqual(results[0], composed, 'le S+7 a bien remplacé « école »');
});

test('un texte gardé décomposé se rouvre normalisé', async () => {
  const other = setup();
  other.dispatch({ type: 'add-instance', plugin: 's7' });
  other.setInput('L’école dort.');
  await other.run();
  other.keep();
  const [entry] = other.state.notebook;
  const decomposed = {
    ...entry!,
    source: { text: entry!.source.text.normalize('NFD'), tagged: entry!.source.tagged.map((word) => ({ ...word, word: word.word.normalize('NFD') })) },
  };
  const controller = setup();
  controller.importNotebook(JSON.stringify({ version: 1, entries: [decomposed] }));
  await controller.reopen(entry!.id);
  assert.equal(controller.state.input, 'L’école dort.');
  assert.equal(controller.state.view!.result, entry!.result);
});

test('la barre d’espace sert à l’écoute seulement avec une voix, hors d’un champ, un texte en pistes', () => {
  const view = {} as never;
  const voices = [{ id: 'fr', name: 'Amélie' }];
  assert.equal(claimsSpace({ view, voices }, false), true); // sur une touche aussi (spec monitoring-vocal)
  assert.equal(claimsSpace({ view, voices: [] }, false), false); // sans voix : effet ordinaire
  assert.equal(claimsSpace({ view, voices }, true), false); // dans un champ
  assert.equal(claimsSpace({ view: undefined, voices }, false), false); // rien en pistes
});

test('sans voix française, le raccourci de la barre d’espace n’est pas pris', async () => {
  const controller = setup();
  controller.setInput('Le chat dort.');
  await controller.run();
  assert.equal(controller.shortcut(' ', false), false);
});

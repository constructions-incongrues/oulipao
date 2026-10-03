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
    preload: async () => {},
    copy: async (text) => void copied.push(text),
  });
  const app = () => html`<${App} state=${controller.state} controller=${controller} />`;
  return { controller, app, copied };
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const click = (node: unknown, predicate: Parameters<typeof find>[1]) => (find(node as never, predicate).props['onClick'] as () => void)();

test('avant l’étiquetage : définition, saisie, table inactive et cinq pistes vides, pas de texte résultant', () => {
  const { app } = setup();
  const out = renderToString(app());
  assert.match(out, /<h1>Potao<\/h1>/);
  assert.match(out, /Jean Lescure/);
  assert.match(out, /<textarea id="input"/);
  assert.match(out, /Essayer avec un exemple/);
  assert.equal(elements(app()).filter(byClass('strip')).length, 5);
  assert.match(out, /0 mot/);
  assert.match(out, /class="score empty"/);
  assert.doesNotMatch(out, /Texte résultant/);
});

test('mise en pistes : saisie repliée, texte résultant au-dessus de la partition, résumé annoncé', async () => {
  const { controller, app } = setup();
  controller.start();
  await tick();
  (find(app(), (e) => e.type === 'textarea').props['onInput'] as (event: Event) => void)(inputEvent('La vieille ferme du village dort.'));
  assert.equal(controller.state.input, 'La vieille ferme du village dort.');
  click(app(), byClass('run'));
  await tick();
  const out = renderToString(app());
  assert.match(out, /Texte : 6 mots/);
  assert.equal(elements(app()).filter(byClass('plugin')).length, 2); // S+7 sur les noms, lipogramme sur toutes les pistes, dans le rack
  assert.match(out, /<section class="rack" aria-label="Filtres">/);
  assert.ok(out.indexOf('Filtre 1 : S+7') < out.indexOf('Filtre 2 : Lipogramme'));
  // les tranches rappellent les filtres qui les visent, sans leurs réglages
  const strip = (name: string) => renderToString(find(app(), byLabel(`Piste ${name}`)));
  assert.match(strip('Noms'), /<p class="reminder">1\. S\+7 · 2\. .* \(coupé\)<\/p>/);
  assert.match(strip('Verbes'), /<p class="reminder">2\. [^·]* \(coupé\)<\/p>/);
  assert.doesNotMatch(strip('Noms'), /class="plugin/);
  assert.match(out, /D'autres contraintes viendront\./);
  assert.match(out, /<p class="summary" role="status" aria-live="polite">S\+7 sur les noms : 2 noms remplacés sur 2\.<\/p>/);
  assert.match(out, /<p class="result-text">Le vieil <span class="replaced">oncle<\/span> du <span class="replaced">cheval<\/span> dort\.<\/p>/);
  assert.ok(out.indexOf('Texte résultant') < out.indexOf('class="score"')); // le résultat d'abord
  assert.match(out, /title="ferme → oncle"/);
  click(app(), byClass('edit'));
  assert.match(renderToString(app()), /<textarea id="input"/);
});

test('chaque réglage de la page passe par le contrôleur', async () => {
  const { controller, app, copied } = setup();
  const actions: MixerAction[] = [];
  const dispatch = controller.dispatch.bind(controller);
  controller.dispatch = (action) => (actions.push(action), dispatch(action));
  controller.setInput('La vieille ferme dort.');
  await controller.run();

  click(app(), byLabel('Muet : retirer la piste Adjectifs du texte'));
  assert.match(renderToString(app()), /<p class="result-text">Le <span class="replaced">oncle<\/span> dort\.<\/p>/);
  assert.match(renderToString(app()), /Pistes coupées : le texte est rendu tel quel/);
  click(app(), byLabel('Seul : ne garder que la piste Verbes'));
  assert.match(renderToString(app()), /<p class="result-text">dort\.<\/p>/);
  click(app(), byLabel('Plugin S+7 actif'));
  assert.match(renderToString(app()), /Filtres coupés : texte d’origine\. Pistes coupées : noms, adjectifs, adverbes, autres\./);
  (find(app(), (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('3'));
  (find(app(), (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('same-gender'));
  assert.deepEqual(actions, [
    { type: 'toggle-mute', category: 'adjective' },
    { type: 'toggle-solo', category: 'verb' },
    { type: 'toggle-instance', id: 's7-1' },
    { type: 'set-param', id: 's7-1', key: 'offset', value: 3 },
    { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' },
  ]);
  click(app(), byClass('copy'));
  await tick();
  assert.deepEqual(copied, ['dort.\n\n— pistes coupées : noms, adjectifs, adverbes, autres (Potao)']);
  assert.match(renderToString(app()), /Copié\./);
  click(app(), byClass('score-toggle'));
  assert.match(renderToString(app()), /aria-expanded="true"[^>]*>Masquer la partition/);
  assert.match(renderToString(app()), /class="score-frame"/);
});

test('texte modifié : bandeau « remettre en pistes », partition estompée, relance', async () => {
  const { controller, app } = setup();
  controller.setInput('La ferme.');
  await controller.run();
  controller.edit();
  controller.setInput('La ferme dort.');
  const out = renderToString(app());
  assert.match(out, /<p class="stale-bar">Texte modifié — <button type="button" class="rerun">remettre en pistes<\/button>/);
  assert.match(out, /class="score-frame folded stale"/);
  click(app(), byClass('rerun'));
  await tick();
  assert.equal(controller.state.stale, false);
  assert.match(renderToString(app()), /Texte : 3 mots/);
});

test('premier contact : l’exemple et le chargement du modèle passent par le contrôleur', async () => {
  const { controller, app } = setup();
  click(app(), byClass('example'));
  await tick();
  assert.ok(controller.state.view);
  const waiting = createTracksController({
    tagger: { name: 'factice', tag: (text) => tag(text) },
    loadMorphology: async () => morphology(),
    preload: async () => {},
    copy: async () => {},
    saveData: true,
  });
  waiting.start();
  click(html`<${App} state=${waiting.state} controller=${waiting} />`, byClass('load'));
  await tick();
  assert.equal(waiting.state.model.status, 'ready');
});

test('le lipogramme se met en marche dans la page, après le S+7, puis passe devant', async () => {
  const { controller, app, copied } = setup();
  controller.setInput('La vieille ferme du village dort.');
  await controller.run();
  click(app(), byLabel('Plugin Lipogramme actif'));
  const out = renderToString(app());
  assert.match(out, /S\+7 sur les noms : 2 noms remplacés sur 2\. lipogramme en e : /);
  assert.doesNotMatch(controller.state.view!.result.replace(/\bdort\b/, ''), /e/); // plus de « e » hors verbes
  click(app(), byClass('copy'));
  await tick();
  assert.match(copied[0]!, /— S\+7 sur les noms · lipogramme en e \(Potao\)$/);
  click(app(), byLabel('Monter le filtre 2'));
  assert.ok(renderToString(app()).indexOf('Filtre 1 : Lipogramme') > 0);
  assert.deepEqual(controller.state.mixer.instances.map((i) => i.id), ['lipogram-1', 's7-1']);
  (find(app(), (e) => e.type === 'select' && String(e.props['value']) === 'e').props['onChange'] as (event: Event) => void)(inputEvent('a'));
  assert.equal(controller.state.mixer.instances[0]!.params['letter'], 'a');
});

test('rack : un second S+n sur les adjectifs, rappelé par leur tranche, puis monté en tête de chaîne', async () => {
  const { controller, app } = setup();
  controller.setInput('Le petit chat est gris.');
  await controller.run();
  click(app(), (e) => byClass('add-instance')(e) && String(e.props['children']).includes('S+7'));
  const unit = () => find(app(), byLabel('Filtre 3 : S+7'));
  (find(unit(), (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('3'));
  click(unit(), (e) => byClass('chip')(e) && byClass('adjective')(e));
  click(unit(), (e) => byClass('chip')(e) && byClass('noun')(e));
  assert.deepEqual(controller.state.mixer.instances[2], { id: 's7-2', type: 's7', enabled: true, params: { offset: 3, mode: 'reagree' }, targets: ['adjective'] });
  const out = renderToString(app());
  assert.equal(elements(app()).filter((e) => byClass('rank')(e)).length, 3);
  assert.match(renderToString(find(app(), byLabel('Piste Adjectifs'))), /<p class="reminder">2\. [^·]* \(coupé\) · 3\. S\+3<\/p>/);
  assert.match(out, /S\+7 sur les noms : .* S\+3 sur les adjectifs : /);
  assert.match(renderToString(unit()), /Chaque adjectif devient le 3e adjectif/); // l'aide suit les pistes visées
  click(app(), byLabel('Monter le filtre 3'));
  click(app(), byLabel('Monter le filtre 2'));
  assert.deepEqual(controller.state.mixer.instances.map((i) => i.id), ['s7-2', 's7-1', 'lipogram-1']);
  assert.match(renderToString(app()), /class="summary"[^>]*>S\+3 sur les adjectifs : .* S\+7 sur les noms : /);
  click(app(), byClass('duplicate'));
  click(app(), byClass('remove'));
  assert.deepEqual(controller.state.mixer.instances.map((i) => i.id), ['s7-1', 'lipogram-1', 's7-3']); // la copie va en fin de chaîne
});

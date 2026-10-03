import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SEED } from '../../support/chain.ts';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { App, SOURCE_URL } from '../../../src/ui/tracks/app.ts';
import { CHANGELOG_URL } from '../../../src/ui/version.ts';
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
  const app = () => html`<${App} state=${controller.state} controller=${controller} version="0.2.0" />`;
  for (const action of SEED) controller.dispatch(action);
  return { controller, app, copied };
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const click = (node: unknown, predicate: Parameters<typeof find>[1]) => (find(node as never, predicate).props['onClick'] as () => void)();

test('avant l’étiquetage : saisie, chaîne, cinq pistes vides, pas de texte résultant', () => {
  const { app } = setup();
  const out = renderToString(app());
  assert.match(out, /<h1>Oulipao<\/h1>/);
  assert.match(out, /<textarea id="input"/);
  assert.match(out, /Essayer avec un exemple/);
  assert.equal(elements(app()).filter(byClass('ch')).length, 5);
  assert.match(out, /<span class="count mono">0<\/span>/);
  assert.equal(elements(app()).filter(byClass('step')).length, 0);
  assert.match(out, /<button type="button" class="key theme">Clair \/ sombre<\/button>/);
  assert.match(out, new RegExp(`<a class="key version-link" href="${CHANGELOG_URL}" title="Journal des versions">v0.2.0</a><a class="key source-link" href="${SOURCE_URL}">Code source</a><button type="button" class="key theme">`));
  assert.equal(SOURCE_URL, 'https://github.com/constructions-incongrues/oulipao');
  assert.doesNotMatch(out, /class="score|Cliquez un mot/); // ni partition, ni invitation avant le texte
  assert.doesNotMatch(out, /Texte résultant/);
});

test('mise en pistes : saisie repliée, texte résultant, inspecteur fermé, résumé annoncé', async () => {
  const { controller, app } = setup();
  (find(app(), (e) => e.type === 'textarea').props['onInput'] as (event: Event) => void)(inputEvent('La vieille ferme du village dort.'));
  assert.equal(controller.state.input, 'La vieille ferme du village dort.');
  click(app(), byClass('run'));
  await tick();
  const out = renderToString(app());
  assert.match(out, /Texte : 6 mots/);
  assert.equal(elements(app()).filter(byClass('slot')).length, 2); // S+7 sur les noms, lipogramme sur toutes les pistes, dans la chaîne
  assert.match(out, /<section class="chain" aria-labelledby="chain-title">/);
  // de haut en bas : texte résultant, saisie, contraintes, pistes, inspecteur
  const order = ['aria-label="Texte résultant"', 'class="source', 'class="chain"', 'class="rack"', 'class="inspector-hint"'].map((mark) => out.indexOf(mark));
  assert.ok(order.every((at, k) => at > 0 && (k === 0 || at > order[k - 1]!)), order.join(' '));
  assert.equal(elements(app()).filter(byClass('step')).length, 6);
  assert.ok(out.indexOf('Contrainte 1 : S+7') < out.indexOf('Contrainte 2 : Lipogramme'));
  // les tranches rappellent les contraintes qui les visent, sans leurs réglages
  const strip = (name: string) => renderToString(find(app(), byLabel(`Piste ${name}`)));
  assert.match(strip('Noms'), /<p class="reminder">1\. S\+7 · 2\. .* \(coupé\)<\/p>/);
  assert.match(strip('Verbes'), /<p class="reminder">2\. [^·]* \(coupé\)<\/p>/);
  assert.doesNotMatch(strip('Noms'), /class="plugin/);
  assert.match(out, /<p class="summary" role="status" aria-live="polite">S\+7 sur les noms : 2 noms remplacés sur 2\.<\/p>/);
  assert.equal(controller.state.view!.result, 'Le vieil oncle du cheval dort.');
  assert.match(out, /<span class="word replaced noun" tabindex="0" title="Noms : ferme → oncle">oncle<\/span>/);
  assert.match(out, /title="Noms : ferme → oncle"/);
  assert.match(out, /<p class="inspector-hint">Cliquez un mot pour voir ce que chaque contrainte en a fait\.<\/p>/); // inspecteur fermé
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
  assert.equal(controller.state.view!.result, 'Le oncle dort.');
  assert.match(renderToString(app()), /Pistes coupées : le texte est rendu tel quel/);
  click(app(), byLabel('Seul : ne garder que la piste Verbes'));
  assert.equal(controller.state.view!.result, 'dort.');
  click(app(), byLabel('S+7 actif'));
  assert.match(renderToString(app()), /Contraintes coupées : texte d’origine\. Pistes coupées : noms, adjectifs, adverbes, autres\./);
  (find(app(), (e) => e.type === 'input' && e.props['type'] === 'number').props['onInput'] as (event: Event) => void)(inputEvent('3'));
  (find(app(), (e) => e.type === 'select' && e.props['class'] !== 'form').props['onChange'] as (event: Event) => void)(inputEvent('same-gender'));
  assert.deepEqual(actions, [
    { type: 'toggle-mute', category: 'adjective' },
    { type: 'toggle-solo', category: 'verb' },
    { type: 'toggle-instance', id: 's7-1' },
    { type: 'set-param', id: 's7-1', key: 'offset', value: 3 },
    { type: 'set-param', id: 's7-1', key: 'mode', value: 'same-gender' },
  ]);
  click(app(), byClass('copy'));
  await tick();
  assert.deepEqual(copied, ['dort.\n\n— pistes coupées : noms, adjectifs, adverbes, autres (Oulipao)']);
  assert.match(renderToString(app()), /Copié\./);
});

test('texte modifié : bandeau « remettre en pistes », partition estompée, relance', async () => {
  const { controller, app } = setup();
  controller.setInput('La ferme.');
  await controller.run();
  controller.edit();
  controller.setInput('La ferme dort.');
  const out = renderToString(app());
  assert.match(out, /<p class="stale-bar">Texte modifié — <button type="button" class="key rerun">remettre en pistes<\/button>/);
  assert.match(out, /class="result stale"/);
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
  });
  click(html`<${App} state=${waiting.state} controller=${waiting} version="0.2.0" />`, byClass('load'));
  await tick();
  assert.equal(waiting.state.model.status, 'ready');
});

test('le lipogramme se met en marche dans la page, après le S+7, puis passe devant', async () => {
  const { controller, app, copied } = setup();
  controller.setInput('La vieille ferme du village dort.');
  await controller.run();
  click(find(app(), byLabel('Contrainte 2 : Lipogramme')), byClass('power'));
  const out = renderToString(app());
  assert.match(out, /S\+7 sur les noms : 2 noms remplacés sur 2\. lipogramme en e : /);
  assert.doesNotMatch(controller.state.view!.result.replace(/\bdort\b/, ''), /e/); // plus de « e » hors verbes
  click(app(), byClass('copy'));
  await tick();
  assert.match(copied[0]!, /— S\+7 sur les noms · lipogramme en e \(Oulipao\)$/);
  click(app(), byLabel('Monter la contrainte 2'));
  assert.ok(renderToString(app()).indexOf('Contrainte 1 : Lipogramme') > 0);
  assert.deepEqual(controller.state.mixer.instances.map((i) => i.id), ['lipogram-1', 's7-1']);
  (find(app(), (e) => e.type === 'input' && e.props['type'] === 'text' && String(e.props['value']) === 'e').props['onInput'] as (event: Event) => void)(inputEvent('a'));
  assert.equal(controller.state.mixer.instances[0]!.params['letters'], 'a');
});

test('rack : un second S+n sur les adjectifs, rappelé par leur tranche, puis monté en tête de chaîne', async () => {
  const { controller, app } = setup();
  controller.setInput('Le petit chat est gris.');
  await controller.run();
  click(app(), (e) => byClass('add-instance')(e) && String(e.props['children']).includes('S+7'));
  const unit = () => find(app(), byLabel('Contrainte 3 : S+7'));
  (find(unit(), (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('3'));
  click(unit(), (e) => byClass('chip')(e) && byClass('adjective')(e));
  click(unit(), (e) => byClass('chip')(e) && byClass('noun')(e));
  assert.deepEqual(controller.state.mixer.instances[2], { id: 's7-2', type: 's7', enabled: true, params: { offset: 3, mode: 'reagree' }, targets: ['adjective'] });
  const out = renderToString(app());
  assert.equal(elements(app()).filter((e) => byClass('pos')(e)).length, 3);
  assert.match(renderToString(find(app(), byLabel('Piste Adjectifs'))), /<p class="reminder">2\. [^·]* \(coupé\) · 3\. S\+3<\/p>/);
  assert.match(out, /S\+7 sur les noms : .* S\+3 sur les adjectifs : /);
  assert.match(renderToString(unit()), /Chaque adjectif devient le 3e adjectif/); // l'aide suit les pistes visées
  click(app(), byLabel('Monter la contrainte 3'));
  click(app(), byLabel('Monter la contrainte 2'));
  assert.deepEqual(controller.state.mixer.instances.map((i) => i.id), ['s7-2', 's7-1', 'lipogram-1']);
  assert.match(renderToString(app()), /class="summary"[^>]*>S\+3 sur les adjectifs : .* S\+7 sur les noms : /);
  click(app(), byClass('duplicate'));
  click(app(), byClass('remove'));
  assert.deepEqual(controller.state.mixer.instances.map((i) => i.id), ['s7-1', 'lipogram-1', 's7-3']); // la copie va en fin de chaîne
});

test('inspecteur : un clic sur un mot, une bande par étape, les flèches, une contrainte déplacée, Échap', async () => {
  const { controller, app } = setup();
  controller.setInput('La vieille ferme du village dort.');
  await controller.run();
  controller.dispatch({ type: 'toggle-instance', id: 'lipogram-1' });
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.dispatch({ type: 'set-targets', id: 's7-2', targets: ['adjective'] });
  click(app(), (e) => e.props['title'] === 'Noms : ferme → voisin'); // « ferme » : oncle, puis voisin
  assert.equal(controller.state.selected, 2);
  const inspector = () => renderToString(find(app(), byClass('inspector')));
  assert.match(inspector(), /<caption>« ferme » à chaque étape de la chaîne · <span class="step-state">pas percé<\/span><\/caption>/);
  const rows = () => [...inspector().matchAll(/<th scope="row">([^<]*)</g)].map((match) => match[1]);
  assert.deepEqual(rows(), ['Origine', 'S+7 sur les noms', 'lipogramme en e', 'S+7 sur les adjectifs']);
  assert.match(inspector(), /<td class="chosen" aria-current="true">ferme<\/td>/);
  assert.doesNotMatch(renderToString(app()), /Cliquez un mot/);
  const key = (k: string) => controller.shortcut(k, false);
  key('ArrowRight');
  assert.match(inspector(), /« du »/);
  // le troisième contrainte monte en tête : même mot, bandes dans le nouvel ordre
  click(app(), byLabel('Monter la contrainte 3'));
  click(app(), byLabel('Monter la contrainte 2'));
  assert.equal(controller.state.selected, 3);
  assert.deepEqual(rows(), ['Origine', 'S+7 sur les adjectifs', 'S+7 sur les noms', 'lipogramme en e']);
  key('Escape');
  assert.equal(controller.state.selected, undefined);
  assert.match(renderToString(app()), /Cliquez un mot/);
});

test('grille : un clic bouche un pas, l’inspecteur s’ouvre depuis l’en-tête et pose un verrou, les pages défilent', async () => {
  const { controller, app } = setup();
  controller.setInput('La vieille ferme du village dort.');
  await controller.run();
  assert.equal(controller.state.view!.result, 'Le vieil oncle du cheval dort.');
  // « ferme » (pas 3) bouché : son groupe reste tel quel, « village » change toujours
  click(app(), byLabel('Noms, ferme : percé, la contrainte agit'));
  assert.equal(controller.state.view!.result, 'La vieille ferme du cheval dort.');
  assert.match(renderToString(app()), /aria-label="Noms, ferme : bouché, laissé tel quel"/);
  // l'en-tête ouvre l'inspecteur ; le verrou se pose depuis la bande du S+7
  click(app(), byLabel('Inspecter « village », pas 5'));
  assert.equal(controller.state.selected, 4);
  const field = () => find(find(app(), byClass('inspector')), (e) => e.type === 'input');
  (field().props['onChange'] as (event: Event) => void)({ currentTarget: { value: '2', setCustomValidity() {} } } as unknown as Event);
  assert.deepEqual(controller.state.mixer.instances[0]!.locks, [{ index: 4, key: 'offset', value: 2 }]);
  assert.match(renderToString(app()), /S\+2 sur ce mot/);
  assert.match(renderToString(app()), /<span class="lock mono" aria-hidden="true">2<\/span>/);
  (field().props['onChange'] as (event: Event) => void)({ currentTarget: { value: '' } } as unknown as Event);
  assert.deepEqual(controller.state.mixer.instances[0]!.locks, []);
  // pages : sur un téléphone, quatre pas par page
  controller.resize(375);
  controller.closeInspector();
  click(app(), (e) => byClass('page')(e) && e.props['aria-pressed'] === false);
  assert.equal(controller.state.page, 1);
});

test('carnet : replié sous le texte résultant ; « Garder » range le texte, « Rouvrir » le remet', async () => {
  const { controller, app } = setup();
  assert.match(renderToString(app()), /<details class="notebook">[\s\S]*Aucun texte gardé/);
  controller.setInput('La ferme.');
  await controller.run();
  const kept = controller.state.view!.result;
  click(app(), byClass('keep'));
  const out = renderToString(app());
  assert.match(out, /Gardé\./);
  assert.match(out, /1 texte gardé · dernier texte aujourd’hui[\s\S]*<p class="kept-text">/);
  const notebook = out.indexOf('class="notebook"');
  assert.ok(out.indexOf('class="result') < notebook && notebook < out.indexOf('class="source')); // entre la bande de sortie et la saisie
  controller.dispatch({ type: 'toggle-solo', category: 'adverb' });
  click(app(), byClass('reopen'));
  await tick();
  assert.equal(controller.state.view!.result, kept);
  click(app(), byClass('export'));
  click(find(app(), byClass('notebook')), byClass('remove'));
  assert.match(renderToString(app()), /Aucun texte gardé/);
  await (find(app(), (e) => e.type === 'input' && e.props['type'] === 'file').props['onChange'] as (event: Event) => Promise<void>)({
    currentTarget: { files: [{ text: async () => '{"chat":1}' }], value: '' },
  } as unknown as Event);
  assert.match(renderToString(app()), /Import refusé/);
});

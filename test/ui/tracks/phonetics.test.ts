import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { PHONETICS_LOADING } from '../../../src/domain/phonetics/lookup.ts';
import { App } from '../../../src/ui/tracks/app.ts';
import { Inspector } from '../../../src/ui/tracks/components/inspector.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { createTracksController, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import type { MixerAction } from '../../../src/ui/tracks/types.ts';
import { buildView, ruleMention, segmentSyllables } from '../../../src/ui/tracks/view-model.ts';
import { rhymeMorphology, rhymePhonetics, rhymeVerbs, tagRhymes } from '../../support/phonetics.ts';
import { find } from '../../support/vnode.ts';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const setup = (overrides: Partial<TracksDependencies> = {}) =>
  createTracksController({
    tagger: { name: 'factice', tag: (text) => tagRhymes(text) },
    loadMorphology: async () => rhymeMorphology(),
    preload: async () => {},
    copy: async () => {},
    ...overrides,
  });
const mixerOf = (...actions: MixerAction[]) => actions.reduce(reduce, initialState);

test('Page sans filtre phonétique : les prononciations ne sont pas demandées', async () => {
  let asked = 0;
  const controller = setup({ loadPhonetics: async () => (asked++, rhymePhonetics()) });
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.setInput('sur la chaise');
  await controller.run();
  await tick();
  assert.equal(asked, 0);
  assert.equal(controller.state.phonetics.status, 'idle');
  assert.equal(controller.state.view!.syllables, undefined);
  assert.deepEqual(controller.state.view!.pronunciations, []);
});

test('Premier R+n ajouté : d’abord la raison du chargement, puis le recalcul', async () => {
  let release!: () => void;
  const controller = setup({ loadPhonetics: () => new Promise((resolve) => (release = () => resolve(rhymePhonetics()))) });
  controller.setInput('sur la chaise\nla maison');
  await controller.run();
  controller.dispatch({ type: 'add-instance', plugin: 'rn' });
  controller.dispatch({ type: 'set-param', id: 'rn-1', key: 'offset', value: 1 });
  assert.equal(controller.state.phonetics.status, 'loading');
  assert.deepEqual(controller.state.view!.marks.get(2), { state: 'kept', original: 'chaise', reason: PHONETICS_LOADING });
  release();
  await tick();
  assert.equal(controller.state.phonetics.status, 'ready');
  assert.equal(controller.state.view!.result, 'sur la fraise\nla raison');
  assert.deepEqual(controller.state.view!.syllables, [3, 3]);
  assert.equal(controller.state.view!.pronunciations[2], '/ʃɛz/ · 1 syllabe · rime /ɛz/ féminine');
  await controller.loadPhonetics(); // déjà là : rien de plus
  assert.equal(controller.state.phonetics.status, 'ready');
});

test('Échec de la textbank phonétique : l’erreur reste, les autres filtres s’appliquent, la relance la charge', async () => {
  let calls = 0;
  const controller = setup({ loadPhonetics: async () => (calls++ === 0 ? Promise.reject(new Error('404')) : rhymePhonetics()) });
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 1 });
  controller.dispatch({ type: 'add-instance', plugin: 'homophony' });
  controller.setInput('un vers');
  await controller.run();
  await tick();
  assert.deepEqual(controller.state.phonetics, { status: 'error', error: { lead: 'Le chargement des prononciations a échoué.', detail: '404.' } });
  assert.equal(controller.state.view!.result, 'un vert'); // le S+1 s'est appliqué
  const out = renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.2.0" />`);
  assert.match(out, /<p class="error" role="alert">\s*<strong>Le chargement des prononciations a échoué\.<\/strong> 404\. <button type="button" class="load">Relancer<\/button>/);
  const app = App({ state: controller.state, controller, version: "0.2.0" });
  const retry = find(app, (node) => node.props['class'] === 'load');
  (retry.props['onClick'] as () => void)();
  await tick();
  assert.equal(controller.state.phonetics.status, 'ready');
  assert.equal(controller.state.view!.result, 'un vair'); // vert, puis son premier homophone
});

test('Sans chargeur de prononciations : rien n’est demandé', async () => {
  const controller = setup();
  await controller.loadPhonetics();
  assert.equal(controller.state.phonetics.status, 'idle');
});

test('S+7 puis R+2 : le R+2 lit la sortie du S+7, la mention nomme les deux réglages dans l’ordre', () => {
  const text = 'la chaise noire';
  const mixer = mixerOf(
    { type: 'add-instance', plugin: 's7' },
    { type: 'set-param', id: 's7-1', key: 'offset', value: 1 },
    { type: 'add-instance', plugin: 'rn' },
    { type: 'set-param', id: 'rn-1', key: 'offset', value: 2 },
    { type: 'set-targets', id: 'rn-1', targets: ['adjective'] },
  );
  const view = buildView({ text, tagged: tagRhymes(text) }, mixer, rhymeMorphology(), undefined, rhymeVerbs(), rhymePhonetics());
  assert.deepEqual(view.stages.map((stage) => stage.label), ['Origine', 'S+1 sur les noms', 'R+2, rime suffisante, sur les adjectifs']);
  assert.equal(view.stages[1]!.words[1]!.output, 'chat'); // S+1 strict, la phrase réaccordée
  assert.equal(ruleMention(mixer, view.audible), '\n\n— S+1 sur les noms · R+2, rime suffisante, sur les adjectifs (Oulipao)');
  assert.deepEqual(view.syllables, [3]);
});

test('Syllabes par ligne : une ligne vide n’en a pas, un morceau de plusieurs mots les compte tous', () => {
  const segments = [{ text: 'la', index: 0 }, { text: ' ' }, { text: 'chaise', index: 1 }, { text: '\n\n' }, { text: 'sur la', index: 2 }, { text: ' ' }, { text: 'maison', index: 3 }];
  assert.deepEqual(segmentSyllables(segments, ['other', 'noun', 'other', 'noun'], rhymePhonetics()), [2, undefined, 4]);
});

test('Inspector : la prononciation du mot choisi, quand elle est connue', () => {
  const window = { columns: [{ index: 0, distance: 0 }], bands: [{ id: 'origin', label: 'Origine', cells: ['chaise'] }] };
  const out = renderToString(html`<${Inspector} window=${window} word="chaise" onClose=${() => {}} pronunciation="/ʃɛz/ · 1 syllabe · rime /ɛz/" />`);
  assert.match(out, /<p class="pronunciation"><span class="silk">Prononciation<\/span> \/ʃɛz\/ · 1 syllabe · rime \/ɛz\/<\/p>/);
  assert.doesNotMatch(renderToString(html`<${Inspector} window=${window} word="chaise" onClose=${() => {}} />`), /pronunciation/);
});

test('Result : le compte de syllabes en bout de chaque ligne, rien sans filtre phonétique', () => {
  const props = {
    segments: [{ text: 'la', index: 0 }, { text: ' ' }, { text: 'chaise', index: 1 }, { text: '\n\n' }, { text: 'la', index: 2 }, { text: ' ' }, { text: 'maison', index: 3 }],
    empty: false,
    marks: new Map(),
    tracks: ['other', 'noun', 'other', 'noun'] as const,
    onSelect: () => {},
    changed: new Set<number>(),
    generation: 0,
    audibleCount: 5,
    stale: false,
    copyMessage: '',
    onCopy: () => {},
  };
  const out = renderToString(html`<${Result} ...${{ ...props, syllables: [2, undefined, 3] }} />`);
  assert.match(out, /chaise<\/span><span class="syllables" title="2 syllabes">2<\/span>\n\n<span class="word">la<\/span> <span class="word">maison<\/span><span class="syllables" title="3 syllabes">3<\/span><\/p>/);
  assert.match(renderToString(html`<${Result} ...${{ ...props, syllables: [1] }} />`), /title="1 syllabe">1</);
  assert.doesNotMatch(renderToString(html`<${Result} ...${props} />`), /syllables/);
});

test('App : l’inspecteur montre la prononciation du mot ouvert', async () => {
  const controller = setup({ loadPhonetics: async () => rhymePhonetics() });
  controller.dispatch({ type: 'add-instance', plugin: 'rn' });
  controller.setInput('sur la chaise');
  await controller.run();
  await tick();
  controller.select(2);
  assert.match(renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.2.0" />`), /<p class="pronunciation"><span class="silk">Prononciation<\/span> \/ʃɛz\/ · 1 syllabe · rime \/ɛz\/ féminine<\/p>/);
});

test('Schéma de rimes : l’inspecteur montre la lettre de la fin de vers ; un mot hors fin de vers n’en a pas', async () => {
  const controller = setup({ loadPhonetics: async () => rhymePhonetics() });
  controller.dispatch({ type: 'add-instance', plugin: 'rhyme-scheme' });
  controller.setInput('la chaise\nla table\nla rose\nla chose');
  await controller.run();
  await tick();
  const view = controller.state.view!;
  assert.equal(view.result, 'la chaise\nla table\nla table\nla fraise');
  assert.equal(view.pronunciations[7], '/ʃoz/ · 1 syllabe · rime /oz/ féminine · lettre A');
  assert.equal(view.pronunciations[5], '/ʁoz/ · 1 syllabe · rime /oz/ féminine · lettre B');
  assert.equal(view.pronunciations[0], '/la/ · 1 syllabe · rime /a/ masculine');
  controller.select(7);
  assert.match(renderToString(html`<${App} state=${controller.state} controller=${controller} version="0.2.0" />`), /rime \/oz\/ féminine · lettre A<\/p>/);
});

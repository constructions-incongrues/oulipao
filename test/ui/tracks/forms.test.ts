import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTracksController, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { initialState, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { ruleMention, summarize } from '../../../src/ui/tracks/view-model.ts';
import { rhymeMorphology, rhymePhonetics, tagRhymes } from '../../support/phonetics.ts';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const setup = (overrides: Partial<TracksDependencies> = {}) =>
  createTracksController({
    tagger: { name: 'factice', tag: (text) => tagRhymes(text) },
    loadMorphology: async () => rhymeMorphology(),
    loadPhonetics: async () => rhymePhonetics(),
    preload: async () => {},
    copy: async () => {},
    ...overrides,
  });

const TEN = 'la chaise\nle vert\nle chat\nla fraise\nla table\nle ver\nla rose\nle vair\nla chose\nla glaise';

test('schéma puis rondel : le schéma lettre les dix vers de l’auteur, la forme recopie leur sortie, la chaîne reste alignée', async () => {
  const controller = setup();
  controller.setInput(TEN);
  await controller.run();
  controller.dispatch({ type: 'add-instance', plugin: 'rhyme-scheme' });
  controller.dispatch({ type: 'set-param', id: 'rhyme-scheme-1', key: 'scheme', value: 'rondel' });
  controller.dispatch({ type: 'set-form', form: 'rondel' });
  await tick();
  const view = controller.state.view!;
  assert.equal(
    view.result,
    'la chaise\nle vert\nle vair\nla fraise\n\nla braise\nle ver\nla chaise\nle vert\n\nla braise\nle vair\nla chose\nla glaise\nla chaise',
  );
  // Les étapes de l'inspecteur gardent un mot par mot d'origine.
  assert.ok(view.stages.every((stage) => stage.words.length === 20));
  // Chaque vers, refrains compris, a son compte de syllabes : la forme n'impose aucun mètre.
  assert.equal(view.syllables!.filter((count) => count !== undefined).length, 13);
  assert.equal(view.missing, 0);
  assert.match(summarize(controller.state.mixer, view), / Forme : rondel\.$/);
  assert.match(ruleMention(controller.state.mixer, view.audible), / · rondel \(Oulipao\)$/);
});

test('six vers en rondel : la page dit combien il en manque ; « aucune » rend le texte tel quel', async () => {
  const controller = setup();
  controller.setInput('la chaise\nle vert\nle chat\nla fraise\nla table\nle ver');
  await controller.run();
  controller.dispatch({ type: 'set-form', form: 'rondel' });
  assert.equal(controller.state.view!.missing, 4);
  assert.match(summarize(controller.state.mixer, controller.state.view!), /Forme : rondel, il manque 4 vers\.$/);
  controller.dispatch({ type: 'set-form', form: 'none' });
  assert.equal(controller.state.view!.result, 'la chaise\nle vert\nle chat\nla fraise\nla table\nle ver');
  assert.equal(controller.state.view!.missing, undefined);
  assert.equal(ruleMention(reduce(initialState, { type: 'set-form', form: 'none' }), new Set(['noun', 'verb', 'adjective', 'adverb', 'other'])), '');
});

test('page : le choix de forme déclenche « set-form » ; les refrains sont marqués et annoncés ; un clic ouvre le mot d’origine', async () => {
  const { html } = await import('htm/preact');
  const { renderToString } = await import('preact-render-to-string');
  const { App } = await import('../../../src/ui/tracks/app.ts');
  const { Result } = await import('../../../src/ui/tracks/components/result.ts');
  const { byClass, find, inputEvent } = await import('../../support/vnode.ts');
  const controller = setup();
  controller.setInput(TEN);
  await controller.run();
  // Le choix de forme, près du texte résultant.
  const app = html`<${App} state=${controller.state} controller=${controller} />`;
  assert.match(renderToString(app), /<label class="silk form-choice">Forme<select class="form">/);
  const select = find(App({ state: controller.state, controller }), (node) => node.props['class'] === 'form');
  (select.props['onChange'] as (event: Event) => void)(inputEvent('rondel'));
  assert.equal(controller.state.mixer.form, 'rondel');
  assert.equal(controller.state.view!.result.split('\n').filter(Boolean).length, 13);
  // Les vers 7, 8 et 13 sont des copies, en italique, annoncées aux lecteurs d'écran.
  const out = renderToString(html`<${App} state=${controller.state} controller=${controller} />`);
  assert.equal(out.match(/<span class="sr-only">Refrain, copie du vers (\d+) : <\/span>/g)!.length, 3);
  assert.match(out, /Refrain, copie du vers 1 : <\/span><span class="word copy"[^>]*>la<\/span>/);
  // Un clic sur un mot du vers 7 ouvre l'inspecteur sur ce mot dans le vers 1.
  let selected: number | undefined;
  const props = { segments: controller.state.view!.segments, empty: false, marks: new Map(), tracks: controller.state.view!.tracks, onSelect: (index: number) => (selected = index), changed: new Set<number>(), generation: 0, audibleCount: 5, stale: false, copyMessage: '', onCopy: () => {} };
  const copy = find(Result(props), (node) => byClass('copy')(node) && node.props['children'] === 'chaise');
  (copy.props['onClick'] as () => void)();
  assert.equal(selected, 1);
  assert.doesNotMatch(renderToString(html`<${Result} ...${props} />`), /form-choice/); // sans `onForm`, pas de choix
});

test('copie d’un rondel : treize vers en trois strophes, sans marque de copie', async () => {
  let copied = '';
  const controller = setup({ copy: async (text) => void (copied = text) });
  controller.setInput(TEN);
  await controller.run();
  controller.dispatch({ type: 'set-form', form: 'rondel' });
  await controller.copy();
  const [poem] = copied.split('\n\n— ');
  assert.equal(poem!.split('\n\n').map((stanza) => stanza.split('\n').length).join('/'), '4/4/5');
  assert.doesNotMatch(copied, /Refrain|copie du vers/);
  assert.match(copied, /— rondel \(Oulipao\)$/);
});

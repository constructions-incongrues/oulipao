import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTracksController, type TracksDependencies, type TracksState } from '../../../src/ui/tracks/controller.ts';
import type { Tagger } from '../../../src/ports/tagger.ts';
import { morphology, tag } from '../../support/morphology.ts';

const tagger = (calls: string[] = []): Tagger => ({ name: 'factice', tag: (text) => (calls.push(text), tag(text)) });
const setup = (overrides: Partial<TracksDependencies> = {}, calls: string[] = []) => {
  const states: TracksState[] = [];
  const copied: string[] = [];
  const controller = createTracksController(
    { tagger: tagger(calls), loadMorphology: async () => morphology(), copy: async (text) => void copied.push(text), ...overrides },
    (state) => states.push(state),
  );
  return { controller, states, copied };
};

test('état de départ : rien d’étiqueté', () => {
  const { controller } = setup();
  assert.equal(controller.state.status, 'idle');
  assert.equal(controller.state.view, undefined);
  assert.equal(createTracksController({ tagger: tagger(), loadMorphology: async () => morphology(), copy: async () => {} }).state.input, '');
});

test('mettre en pistes : attente, puis partition et texte résultant', async () => {
  const { controller, states } = setup();
  controller.setInput('La ferme du village.');
  const running = controller.run();
  assert.equal(controller.state.status, 'loading');
  assert.match(controller.state.message, /Chargement/);
  await running;
  assert.equal(controller.state.status, 'ready');
  assert.equal(controller.state.message, '');
  assert.equal(controller.state.view!.result, "L'oncle du cheval."); // décalage 7 par défaut
  assert.deepEqual(states.map((s) => s.status), ['idle', 'loading', 'ready']);
});

test('chaque geste met la vue à jour sans réétiqueter', async () => {
  const calls: string[] = [];
  const { controller } = setup({}, calls);
  controller.setInput('La vieille ferme.');
  await controller.run();
  const results = [controller.state.view!.result];
  for (const offset of [1, 2, 3, -1]) {
    controller.dispatch({ type: 'set-offset', offset });
    results.push(controller.state.view!.result);
  }
  assert.equal(new Set(results).size, 5);
  controller.dispatch({ type: 'toggle-plugin' });
  assert.equal(controller.state.view!.result, 'La vieille ferme.');
  controller.dispatch({ type: 'toggle-plugin' });
  assert.equal(controller.state.view!.result, results.at(-1));
  controller.dispatch({ type: 'toggle-mute', category: 'adjective' });
  assert.equal(controller.state.view!.result, 'La école.'); // la règle s'applique telle quelle, sans réparer l'élision
  assert.equal(controller.state.mixer.tracks.adjective.muted, true);
  assert.deepEqual(calls, ['La vieille ferme.']); // un seul étiquetage
});

test('un geste avant tout étiquetage change l’état de la table, sans vue', () => {
  const { controller } = setup();
  controller.dispatch({ type: 'toggle-solo', category: 'verb' });
  assert.equal(controller.state.mixer.tracks.verb.solo, true);
  assert.equal(controller.state.view, undefined);
});

test('texte vide : message, rien n’est étiqueté', async () => {
  const calls: string[] = [];
  const { controller } = setup({}, calls);
  controller.setInput('   ');
  await controller.run();
  assert.equal(controller.state.status, 'error');
  assert.match(controller.state.message, /Collez/);
  assert.deepEqual(calls, []);
});

test('échec du chargement : la page le dit et reste utilisable', async () => {
  let attempts = 0;
  const { controller } = setup({
    loadMorphology: async () => {
      if (attempts++ === 0) throw new Error('dictionnaire injoignable');
      return morphology();
    },
  });
  controller.setInput('La ferme.');
  await controller.run();
  assert.equal(controller.state.status, 'error');
  assert.match(controller.state.message, /Échec : dictionnaire injoignable\. Vous pouvez relancer\./);
  await controller.run();
  assert.equal(controller.state.status, 'ready');
  // une erreur qui n'est pas un objet Error
  const odd = setup({ tagger: { name: 'x', tag: () => Promise.reject('panne') } });
  odd.controller.setInput('La ferme.');
  await odd.controller.run();
  assert.match(odd.controller.state.message, /Échec : panne/);
});

test('deux lancements : seul le plus récent compte', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let first = true;
  const slow: Tagger = { name: 'lent', tag: async (text) => (first ? ((first = false), await gate, tag(text)) : tag(text)) };
  const { controller } = setup({ tagger: slow });
  controller.setInput('La ferme.');
  const one = controller.run();
  controller.setInput('Le village.');
  await controller.run();
  release();
  await one;
  assert.equal(controller.state.view!.result, 'Le cheval.');
  // le premier lancement, en échec tardif, ne remplace pas le résultat non plus
  let fail!: (error: Error) => void;
  const failing = new Promise<never>((_, reject) => (fail = reject));
  let again = true;
  const flaky: Tagger = { name: 'fragile', tag: async (text) => (again ? ((again = false), failing) : tag(text)) };
  const other = setup({ tagger: flaky });
  other.controller.setInput('La ferme.');
  const late = other.controller.run();
  await other.controller.run();
  fail(new Error('trop tard'));
  await late;
  assert.equal(other.controller.state.status, 'ready');
});

test('copier : le texte résultant part dans le presse-papiers', async () => {
  const { controller, copied } = setup();
  await controller.copy();
  assert.deepEqual(copied, []); // rien à copier avant l'étiquetage
  controller.setInput('La ferme.');
  await controller.run();
  await controller.copy();
  assert.deepEqual(copied, [controller.state.view!.result]);
  assert.equal(controller.state.copied, true);
  controller.dispatch({ type: 'set-offset', offset: 2 });
  assert.equal(controller.state.copied, false); // le texte a changé depuis la copie
  const denied = setup({ copy: async () => { throw new Error('refusé'); } });
  denied.controller.setInput('La ferme.');
  await denied.controller.run();
  await denied.controller.copy();
  assert.match(denied.controller.state.message, /Copie impossible : refusé/);
});

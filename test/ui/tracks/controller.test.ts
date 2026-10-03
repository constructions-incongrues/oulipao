import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTracksController, EXAMPLE_TEXT, type TracksDependencies, type TracksState } from '../../../src/ui/tracks/controller.ts';
import type { Tagger } from '../../../src/ports/tagger.ts';
import { morphology, tag } from '../../support/morphology.ts';

const tagger = (calls: string[] = []): Tagger => ({ name: 'factice', tag: (text) => (calls.push(text), tag(text)) });
const setup = (overrides: Partial<TracksDependencies> = {}, calls: string[] = []) => {
  const states: TracksState[] = [];
  const copied: string[] = [];
  const controller = createTracksController(
    {
      tagger: tagger(calls),
      loadMorphology: async () => morphology(),
      preload: async (onProgress) => onProgress(50, 100),
      copy: async (text) => void copied.push(text),
      ...overrides,
    },
    (state) => states.push(state),
  );
  return { controller, states, copied };
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('état de départ : rien d’étiqueté, saisie dépliée, modèle pas encore demandé', () => {
  const { controller } = setup();
  assert.equal(controller.state.view, undefined);
  assert.equal(controller.state.editing, true);
  assert.equal(controller.state.model.status, 'waiting');
  assert.equal(createTracksController({ tagger: tagger(), loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {} }).state.input, '');
});

test('ouverture : le modèle se précharge, avec son avancement en octets', async () => {
  const { controller, states } = setup();
  controller.start();
  assert.equal(controller.state.model.status, 'loading');
  await tick();
  assert.equal(controller.state.model.status, 'ready');
  assert.ok(states.some((s) => s.model.status === 'loading' && s.model.loaded === 50 && s.model.total === 100));
  await controller.preload(); // déjà prêt : rien à refaire
  assert.equal(controller.state.model.status, 'ready');
});

test('économie de données (D10) : rien ne part avant le clic', async () => {
  let preloads = 0;
  const { controller } = setup({ saveData: true, preload: async () => void preloads++ });
  controller.start();
  assert.equal(controller.state.model.status, 'waiting');
  assert.equal(preloads, 0);
  await controller.preload();
  assert.equal(preloads, 1);
  assert.equal(controller.state.model.status, 'ready');
});

test('échec du chargement (D12) : la page le dit, et relancer recharge vraiment', async () => {
  let attempts = 0;
  const { controller } = setup({
    preload: async () => {
      if (attempts++ === 0) throw new Error('réseau coupé');
    },
  });
  await controller.preload();
  assert.equal(controller.state.model.status, 'error');
  assert.match(controller.state.model.error, /Échec : réseau coupé\. Vous pouvez relancer\./);
  await controller.preload();
  assert.equal(controller.state.model.status, 'ready');
  assert.equal(attempts, 2);
  // un dictionnaire injoignable fait échouer le chargement de la même façon
  const odd = setup({ loadMorphology: () => Promise.reject('panne') });
  await odd.controller.preload();
  assert.match(odd.controller.state.model.error, /Échec : panne/);
});

test('mettre en pistes : attente, puis partition, texte résultant et saisie repliée', async () => {
  const { controller, states } = setup();
  controller.setInput('La ferme du village.');
  const running = controller.run();
  assert.equal(controller.state.tagging, true);
  await running;
  assert.equal(controller.state.tagging, false);
  assert.equal(controller.state.editing, false);
  assert.equal(controller.state.view!.result, "L'oncle du cheval."); // décalage 7 par défaut
  assert.ok(states.some((s) => s.model.status === 'loading')); // le modèle se charge s'il ne l'était pas
  controller.edit();
  assert.equal(controller.state.editing, true);
});

test('l’exemple : placé dans la saisie et mis en pistes', async () => {
  const { controller, copied } = setup();
  await controller.example();
  assert.equal(controller.state.input, EXAMPLE_TEXT);
  assert.ok(controller.state.view);
  await controller.copy();
  assert.match(copied[0]!, /— S\+7 sur les noms \(Potao\)$/);
});

test('chaque geste met la vue à jour sans réétiqueter ; les mots changés s’éclairent', async () => {
  const calls: string[] = [];
  const { controller } = setup({}, calls);
  controller.setInput('La vieille ferme.');
  await controller.run();
  assert.deepEqual(controller.state.changed, new Set());
  const results = [controller.state.view!.result];
  const generation = controller.state.generation;
  for (const offset of [1, 2, 3, -1]) {
    controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: offset });
    results.push(controller.state.view!.result);
  }
  assert.equal(new Set(results).size, 5);
  assert.ok(controller.state.changed.has(2)); // « ferme » a encore changé de remplaçant
  assert.equal(controller.state.generation, generation + 4);
  controller.dispatch({ type: 'toggle-instance', id: 's7-1' });
  assert.equal(controller.state.view!.result, 'La vieille ferme.');
  controller.dispatch({ type: 'toggle-mute', category: 'adjective' });
  assert.equal(controller.state.view!.result, 'La ferme.');
  assert.deepEqual(calls, ['La vieille ferme.']); // un seul étiquetage
});

test('un geste avant tout étiquetage change l’état de la table, sans vue', () => {
  const { controller } = setup();
  controller.dispatch({ type: 'toggle-solo', category: 'verb' });
  assert.equal(controller.state.mixer.tracks.verb.solo, true);
  assert.equal(controller.state.view, undefined);
});

test('texte vide : message près de la saisie, rien n’est étiqueté', async () => {
  const calls: string[] = [];
  const { controller } = setup({}, calls);
  controller.setInput('   ');
  await controller.run();
  assert.equal(controller.state.inputMessage, 'Collez d’abord un texte.');
  assert.deepEqual(calls, []);
});

test('échec de l’étiquetage : message près de la saisie ; modèle en échec : on n’étiquette pas', async () => {
  const odd = setup({ tagger: { name: 'x', tag: () => Promise.reject(new Error('panne')) } });
  odd.controller.setInput('La ferme.');
  await odd.controller.run();
  assert.match(odd.controller.state.inputMessage, /Échec de l’étiquetage : panne\. Vous pouvez relancer\./);
  assert.equal(odd.controller.state.tagging, false);
  const calls: string[] = [];
  const down = setup({ preload: () => Promise.reject(new Error('hors ligne')) }, calls);
  down.controller.setInput('La ferme.');
  await down.controller.run();
  assert.equal(down.controller.state.model.status, 'error');
  assert.equal(down.controller.state.tagging, false);
  assert.deepEqual(calls, []);
});

test('deux lancements : seul le plus récent compte', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let first = true;
  const slow: Tagger = { name: 'lent', tag: async (text) => (first ? ((first = false), await gate, tag(text)) : tag(text)) };
  const { controller } = setup({ tagger: slow });
  controller.setInput('La ferme.');
  const one = controller.run();
  await tick();
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
  await tick();
  await other.controller.run();
  fail(new Error('trop tard'));
  await late;
  assert.equal(other.controller.state.inputMessage, '');
  // un lancement doublé pendant le chargement du modèle s'efface aussi
  const third = setup();
  third.controller.setInput('La ferme.');
  const early = third.controller.run();
  await third.controller.run();
  await early;
  assert.ok(third.controller.state.view);
});

test('texte modifié après la mise en pistes : vue périmée, copie refusée, jusqu’à la relance', async () => {
  const { controller, copied } = setup();
  controller.setInput('La ferme.');
  await controller.run();
  controller.setInput('La ferme dort.');
  assert.equal(controller.state.stale, true);
  await controller.copy();
  assert.deepEqual(copied, []);
  controller.setInput('La ferme.');
  assert.equal(controller.state.stale, false); // revenu au texte mis en pistes
  controller.setInput('La ferme dort.');
  await controller.run();
  assert.equal(controller.state.stale, false);
});

test('largeur des systèmes : bornée, et la vue suit', async () => {
  const { controller } = setup();
  controller.setWidth(20);
  assert.equal(controller.state.width, 48);
  controller.setInput('La vieille ferme du village est grise, et la ferme aussi, et le village aussi, et encore la ferme.');
  await controller.run();
  const systems = controller.state.view!.layout.systems.length;
  controller.setWidth(200);
  assert.equal(controller.state.width, 72);
  assert.ok(controller.state.view!.layout.systems.length < systems);
  const before = controller.state;
  controller.setWidth(300); // même largeur bornée : rien ne change
  assert.equal(controller.state, before);
});

test('partition repliée sur petit écran : on la déplie et on la replie', () => {
  const { controller } = setup();
  controller.toggleScore();
  assert.equal(controller.state.scoreOpen, true);
  controller.toggleScore();
  assert.equal(controller.state.scoreOpen, false);
});

test('copier : le texte résultant et sa mention (D11) ; message à côté du bouton', async () => {
  const { controller, copied } = setup();
  await controller.copy();
  assert.deepEqual(copied, []); // rien à copier avant l'étiquetage
  controller.setInput('La ferme.');
  await controller.run();
  await controller.copy();
  assert.deepEqual(copied, ["L'oncle.\n\n— S+7 sur les noms (Potao)"]);
  assert.equal(controller.state.copyMessage, 'Copié.');
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 2 });
  assert.equal(controller.state.copyMessage, ''); // le texte a changé depuis la copie
  controller.dispatch({ type: 'toggle-instance', id: 's7-1' });
  await controller.copy();
  assert.equal(copied.at(-1), 'La ferme.'); // texte d'origine : pas de mention
  controller.dispatch({ type: 'toggle-solo', category: 'adverb' });
  await controller.copy();
  assert.equal(copied.length, 2); // toutes les pistes coupées : rien à copier
  const denied = setup({ copy: async () => { throw new Error('refusé'); } });
  denied.controller.setInput('La ferme.');
  await denied.controller.run();
  await denied.controller.copy();
  assert.equal(denied.controller.state.copyMessage, 'Copie impossible : refusé');
  assert.equal(denied.controller.state.inputMessage, ''); // la page n'est pas en erreur
});

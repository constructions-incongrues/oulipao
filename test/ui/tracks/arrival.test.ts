import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seededState, SEED } from '../../support/chain.ts';
import { createTracksController, UNREADABLE_LINK, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { memoryNotebook } from '../../../src/ui/tracks/notebook-controller.ts';
import type { SharedEntry } from '../../../src/ui/tracks/share-link.ts';
import { morphology, tag } from '../../support/morphology.ts';

/** L'entrée reçue : « La ferme. » passée au S+7 sur les noms, telle que l'auteur l'a gardée. */
const received: SharedEntry = {
  result: 'L’oncle.',
  mention: '\n\n— S+7 sur les noms (Oulipao)',
  source: { text: 'La ferme.', tagged: tag('La ferme.') },
  mixer: seededState,
};

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const setup = (arrival: TracksDependencies['arrival'], overrides: Partial<TracksDependencies> = {}) => {
  const calls = { preload: 0, tagged: 0, confirmations: [] as string[] };
  let answer = true;
  const notebook = { ...memoryNotebook(), confirm: (message: string) => (calls.confirmations.push(message), answer) };
  const controller = createTracksController({
    tagger: { name: 'factice', tag: (text) => (calls.tagged++, tag(text)) },
    loadMorphology: async () => morphology(),
    preload: async () => void calls.preload++,
    copy: async () => {},
    notebook,
    arrival,
    ...overrides,
  });
  return { controller, calls, refuse: () => (answer = false) };
};

test('ouvrir un lien reçu : la vue d’arrivée, sans toucher au carnet ni rien charger', async () => {
  const { controller, calls } = setup(Promise.resolve(received));
  await flush();
  assert.deepEqual(controller.state.arrival, received);
  assert.equal(controller.state.arrivalMessage, '');
  assert.deepEqual(controller.state.notebook, []);
  assert.equal(controller.state.view, undefined);
  assert.equal(calls.preload, 0); // aucun tiers avant le premier clic
  assert.equal(controller.state.model.status, 'waiting');
});

test('rejouer : la table de l’auteur, sans réétiqueter, et le même texte', async () => {
  const { controller, calls } = setup(Promise.resolve(received));
  await flush();
  await controller.replayArrival();
  assert.equal(calls.preload, 1);
  assert.equal(calls.tagged, 0);
  assert.equal(controller.state.arrival, undefined);
  assert.equal(controller.state.input, 'La ferme.');
  assert.deepEqual(controller.state.mixer, seededState);
  assert.equal(controller.state.view?.result, "L'oncle.");
  assert.deepEqual(controller.state.notebook, []);
  // Le texte rejoué n'est dans aucun carnet : le garder crée une entrée.
  assert.ok(controller.keep());
  assert.equal(controller.state.notebook.length, 1);
});

test('rejouer par-dessus un texte non gardé : confirmation, et un refus ne change rien', async () => {
  const { controller, calls, refuse } = setup(new Promise((resolve) => setTimeout(() => resolve(received), 5)));
  for (const action of SEED) controller.dispatch(action);
  controller.setInput('Le chat.');
  await controller.run();
  controller.dispatch({ type: 'toggle-instance', id: 's7-1' });
  await new Promise((resolve) => setTimeout(resolve, 10));
  refuse();
  await controller.replayArrival();
  assert.match(calls.confirmations[0]!, /Rejouer quand même/);
  assert.equal(controller.state.input, 'Le chat.');
  assert.deepEqual(controller.state.arrival, received);
});

test('hors ligne : la vue reste ouverte avec la raison, et un nouveau clic réessaie', async () => {
  let fail = true;
  const { controller } = setup(Promise.resolve(received), {
    loadMorphology: async () => {
      if (fail) throw new Error('réseau coupé');
      return morphology();
    },
  });
  await flush();
  await controller.replayArrival();
  assert.deepEqual(controller.state.arrival, received);
  assert.equal(controller.state.model.status, 'error');
  assert.match(controller.state.model.error!.detail, /réseau coupé/);
  fail = false;
  await controller.replayArrival();
  assert.equal(controller.state.arrival, undefined);
  assert.equal(controller.state.input, 'La ferme.');
});

test('une entrée qui ne peut pas être rouverte : la raison dans la vue, la table inchangée', async () => {
  const unknown: SharedEntry = { ...received, mixer: { ...seededState, instances: [{ ...seededState.instances[0]!, type: 'inconnue' }] } };
  const { controller } = setup(Promise.resolve(unknown));
  await flush();
  await controller.replayArrival();
  assert.equal(controller.state.arrivalError?.lead, 'Ce texte ne peut pas être rouvert :');
  assert.deepEqual(controller.state.arrival, unknown);
  assert.equal(controller.state.view, undefined);
});

test('quitter la vue d’arrivée : l’outil tel qu’il aurait été sans le lien', async () => {
  const { controller } = setup(Promise.resolve(received));
  await flush();
  controller.closeArrival();
  assert.equal(controller.state.arrival, undefined);
  assert.equal(controller.state.view, undefined);
  await controller.replayArrival(); // plus rien à rejouer
  assert.equal(controller.state.view, undefined);
});

test('un lien tronqué : « Ce lien n’est pas lisible », puis l’outil normal ; un fragment étranger : rien', async () => {
  const broken = setup(Promise.resolve('unreadable'));
  await flush();
  assert.equal(broken.controller.state.arrivalMessage, UNREADABLE_LINK);
  assert.equal(broken.controller.state.arrival, undefined);
  const foreign = setup(Promise.resolve(undefined));
  await flush();
  assert.equal(foreign.controller.state.arrivalMessage, '');
  assert.equal(foreign.controller.state.arrival, undefined);
});

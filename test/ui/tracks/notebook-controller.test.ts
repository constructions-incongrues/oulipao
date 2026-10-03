import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SEED } from '../../support/chain.ts';
import { createTracksController, type NotebookDependencies, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { serializeNotebook } from '../../../src/ui/tracks/notebook.ts';
import { morphology, tag } from '../../support/morphology.ts';

/** Un carnet factice : un stockage en mémoire, une horloge et des identifiants prévisibles. */
const fakeNotebook = (initial: string | null = null, overrides: Partial<NotebookDependencies> = {}) => {
  const written: string[] = [];
  const downloads: [string, string][] = [];
  const confirmations: string[] = [];
  let ids = 0;
  let day = 4;
  const notebook: NotebookDependencies = {
    storage: { read: () => written.at(-1) ?? initial, write: (data) => void written.push(data) },
    now: () => new Date(2026, 9, day++, 21),
    newId: () => `t${++ids}`,
    confirm: (message) => (confirmations.push(message), true),
    download: (name, text) => void downloads.push([name, text]),
    ...overrides,
  };
  return { notebook, written, downloads, confirmations };
};

const setup = (notebook: NotebookDependencies, overrides: Partial<TracksDependencies> = {}) => {
  const tagged: string[] = [];
  const controller = createTracksController({
    tagger: { name: 'factice', tag: (text) => (tagged.push(text), tag(text)) },
    loadMorphology: async () => morphology(),
    loadVerbs: async () => {
      throw new Error('pas de verbes ici');
    },
    preload: async () => {},
    copy: async () => {},
    notebook,
    ...overrides,
  });
  for (const action of SEED) controller.dispatch(action);
  return { controller, tagged };
};

test('garder après un S+7 : une entrée datée, avec sa mention, écrite dans le stockage', async () => {
  const fake = fakeNotebook();
  const { controller } = setup(fake.notebook);
  controller.keep(); // rien de mis en pistes : rien à garder
  assert.equal(controller.state.notebook.length, 0);
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  const [entry] = controller.state.notebook;
  assert.equal(entry!.id, 't1');
  assert.equal(entry!.keptAt, new Date(2026, 9, 4, 21).toISOString());
  assert.equal(entry!.result, "L'oncle.");
  assert.equal(entry!.mention, '\n\n— S+7 sur les noms (Oulipao)');
  assert.equal(entry!.source.text, 'La ferme.');
  assert.equal(controller.state.copyMessage, 'Gardé.');
  assert.equal(JSON.parse(fake.written.at(-1)!).entries.length, 1);
});

test('rien à garder quand la vue est périmée ou vide ; copier ne garde rien', async () => {
  const { controller } = setup(fakeNotebook().notebook);
  controller.setInput('La ferme.');
  await controller.run();
  await controller.copy();
  assert.deepEqual(controller.state.notebook, []);
  controller.setInput('La ferme dort.');
  controller.keep();
  assert.deepEqual(controller.state.notebook, []);
  controller.setInput('La ferme.');
  controller.dispatch({ type: 'toggle-solo', category: 'adverb' });
  controller.keep();
  assert.deepEqual(controller.state.notebook, []);
});

test('stockage plein : la garde échoue avec un message, le texte reste affiché', async () => {
  const fake = fakeNotebook(null, {
    storage: {
      read: () => null,
      write: () => {
        throw new Error('quota dépassé');
      },
    },
  });
  const { controller } = setup(fake.notebook);
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  assert.equal(controller.state.copyMessage, 'Impossible de garder : quota dépassé');
  assert.deepEqual(controller.state.notebook, []);
  assert.equal(controller.state.view!.result, "L'oncle.");
});

test('à l’ouverture : le carnet stocké se relit, une entrée abîmée est signalée', async () => {
  const fake = fakeNotebook();
  const first = setup(fake.notebook).controller;
  first.setInput('La ferme.');
  await first.run();
  first.keep();
  first.keep();
  const stored = JSON.parse(fake.written.at(-1)!);
  stored.entries.push({ id: 'cassée' });
  const reread = setup(fakeNotebook(JSON.stringify(stored)).notebook).controller;
  assert.deepEqual(reread.state.notebook.map((entry) => entry.id), ['t2', 't1']);
  assert.equal(reread.state.notebookMessage, '1 texte illisible laissé de côté.');
  stored.entries.push({ id: 'cassée aussi' });
  assert.equal(setup(fakeNotebook(JSON.stringify(stored)).notebook).controller.state.notebookMessage, '2 textes illisibles laissés de côté.');
  assert.equal(setup(fakeNotebook('{abîmé').notebook).controller.state.notebookMessage, 'Le carnet est illisible.');
  assert.equal(setup(fakeNotebook().notebook).controller.state.notebookMessage, '');
});

test('rouvrir : la saisie, la chaîne, le verrou et le pas bouché reviennent, sans réétiqueter, et le texte est identique', async () => {
  const fake = fakeNotebook();
  const { controller } = setup(fake.notebook);
  controller.setInput('La ferme dort au village.');
  await controller.run();
  controller.dispatch({ type: 'set-lock', id: 's7-1', index: 1, key: 'offset', value: 3 });
  controller.dispatch({ type: 'toggle-step', index: 4 });
  controller.keep();
  const kept = controller.state.notebook[0]!;
  const later = setup(fakeNotebook(fake.written.at(-1)!).notebook);
  await later.controller.reopen('inconnu'); // aucune entrée : rien ne bouge
  assert.equal(later.controller.state.view, undefined);
  await later.controller.reopen(kept.id);
  const { state } = later.controller;
  assert.deepEqual(later.tagged, []);
  assert.equal(state.input, 'La ferme dort au village.');
  assert.equal(state.editing, false);
  assert.equal(state.stale, false);
  assert.deepEqual(state.mixer, kept.mixer);
  assert.deepEqual(state.mixer.closed, [4]);
  assert.equal(state.view!.result, kept.result);
});

test('rouvrir une entrée dont une contrainte n’existe plus : un message, l’entrée reste lisible', async () => {
  const fake = fakeNotebook();
  const { controller } = setup(fake.notebook);
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  const stored = JSON.parse(fake.written.at(-1)!);
  stored.entries[0].mixer.instances[0].type = 'disparu';
  const later = setup(fakeNotebook(JSON.stringify(stored)).notebook).controller;
  await later.reopen('t1');
  assert.match(later.state.notebookMessage, /ne peut pas être rouvert : plugin inconnu : disparu/);
  assert.equal(later.state.view, undefined);
  assert.equal(later.state.notebook.length, 1);
});

test('rouvrir puis relancer aussitôt : la mise en pistes la plus récente l’emporte', async () => {
  const fake = fakeNotebook();
  const { controller } = setup(fake.notebook);
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  controller.setInput('La ville.');
  const reopening = controller.reopen('t1');
  await controller.run();
  await reopening;
  assert.equal(controller.state.input, 'La ville.');
});

test('supprimer : après confirmation seulement', async () => {
  const fake = fakeNotebook();
  const { controller } = setup(fake.notebook);
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  controller.keep();
  controller.keep();
  controller.remove('t2');
  assert.deepEqual(controller.state.notebook.map((entry) => entry.id), ['t3', 't1']);
  assert.deepEqual(fake.confirmations, ['Supprimer ce texte du carnet ?']);
  assert.equal(JSON.parse(fake.written.at(-1)!).entries.length, 2);
  const declined = fakeNotebook(fake.written.at(-1)!, { confirm: () => false });
  const kept = setup(declined.notebook).controller;
  kept.remove('t3');
  assert.equal(kept.state.notebook.length, 2);
  assert.deepEqual(declined.written, []);
  const broken = setup(fakeNotebook(fake.written.at(-1)!, { storage: { read: () => fake.written.at(-1)!, write: () => { throw new Error('verrouillé'); } } }).notebook).controller;
  broken.remove('t3');
  assert.equal(broken.state.notebookMessage, 'Suppression impossible : verrouillé');
  assert.equal(broken.state.notebook.length, 2);
});

test('exporter puis importer : aller-retour, doublons comptés, mauvais fichier refusé', async () => {
  const fake = fakeNotebook();
  const { controller } = setup(fake.notebook);
  controller.setInput('La ferme.');
  await controller.run();
  for (let k = 0; k < 4; k++) controller.keep();
  controller.exportNotebook();
  const [[name, text]] = fake.downloads as [[string, string]];
  assert.equal(name, 'oulipao-carnet-2026-10-08.json');
  const empty = setup(fakeNotebook().notebook).controller;
  empty.importNotebook(text);
  assert.equal(empty.state.notebook.length, 4);
  assert.equal(empty.state.notebookMessage, 'Import : 4 textes ajoutés, 0 déjà présent.');
  const extra = JSON.parse(text);
  extra.entries.push({ ...extra.entries[0], id: 'neuf' }, { id: 'cassée' });
  empty.importNotebook(JSON.stringify(extra));
  assert.equal(empty.state.notebook.length, 5);
  assert.equal(empty.state.notebookMessage, 'Import : 1 texte ajouté, 4 déjà présents, 1 illisible.');
  empty.importNotebook('{"chat":1}');
  assert.equal(empty.state.notebook.length, 5);
  assert.equal(empty.state.notebookMessage, 'Import refusé : Ce n’est pas un carnet d’Oulipao.');
  const full = setup(fakeNotebook(null, { storage: { read: () => null, write: () => { throw new Error('plein'); } } }).notebook).controller;
  full.importNotebook(serializeNotebook([]));
  assert.equal(full.state.notebookMessage, 'Import impossible : plein');
});

test('sans carnet branché : un carnet en mémoire', async () => {
  const controller = createTracksController({ tagger: { name: 'factice', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {} });
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  assert.equal(controller.state.notebook.length, 1);
  controller.remove(controller.state.notebook[0]!.id);
  controller.exportNotebook();
  assert.deepEqual(controller.state.notebook, []);
});

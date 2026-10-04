import assert from 'node:assert/strict';
import { test } from 'node:test';
import renderToString from 'preact-render-to-string';
import { html } from 'htm/preact';
import { SEED } from '../../support/chain.ts';
import { createTracksController, type NotebookDependencies, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { Notebook, SESSION_ONLY } from '../../../src/ui/tracks/components/notebook.ts';
import { reopenProblem, SESSION_KEPT } from '../../../src/ui/tracks/notebook-controller.ts';
import { parseNotebook, type NotebookEntry } from '../../../src/ui/tracks/notebook.ts';
import { morphology, tag } from '../../support/morphology.ts';

// Ce que la revue du 2026-10-04 a demandé au carnet : ne jamais perdre un texte gardé.

/** Un stockage partagé, comme le localStorage de deux onglets ; `backups` garde les copies de secours. */
const sharedStorage = (initial: string | null = null) => {
  let data = initial;
  const backups: string[] = [];
  return {
    get data() {
      return data;
    },
    backups,
    storage: {
      read: () => data,
      write: (text: string) => void (data = text),
      backup: (text: string) => void backups.push(text),
    },
  };
};

const notebookOn = (storage: NotebookDependencies['storage'], overrides: Partial<NotebookDependencies> = {}): NotebookDependencies => {
  let ids = 0;
  const prefix = Math.random().toString(36).slice(2, 6);
  return {
    storage,
    now: () => new Date(2026, 9, 4, 21, ids),
    newId: () => `${prefix}-${++ids}`,
    confirm: () => true,
    download: () => {},
    ...overrides,
  };
};

const setup = (notebook: NotebookDependencies, overrides: Partial<TracksDependencies> = {}) => {
  const controller = createTracksController({
    tagger: { name: 'factice', tag },
    loadMorphology: async () => morphology(),
    preload: async () => {},
    copy: async () => {},
    notebook,
    ...overrides,
  });
  for (const action of SEED) controller.dispatch(action);
  return controller;
};

/** Un contrôleur qui a mis un texte en pistes, prêt à garder. */
const ready = async (notebook: NotebookDependencies) => {
  const controller = setup(notebook);
  controller.setInput('La ferme.');
  await controller.run();
  return controller;
};

const BROKEN = { id: 'cassée', venue: 'd’une version future' };
const storedWith = (...entries: unknown[]) => JSON.stringify({ version: 1, entries });

test('une entrée illisible survit à une garde, une retouche et une suppression', async () => {
  const shared = sharedStorage(storedWith(BROKEN));
  const controller = await ready(notebookOn(shared.storage));
  controller.keep();
  controller.keep();
  const [first, second] = controller.state.notebook;
  controller.editEntry(first!.id, 'Retouché.');
  controller.remove(second!.id);
  const stored = JSON.parse(shared.data!);
  assert.deepEqual(stored.entries.at(-1), BROKEN);
  assert.equal(parseNotebook(shared.data).entries.length, 1);
});

test('l’export contient aussi les entrées illisibles, telles qu’elles étaient', async () => {
  const downloads: string[] = [];
  const shared = sharedStorage(storedWith(BROKEN));
  const controller = await ready(notebookOn(shared.storage, { download: (_, text) => void downloads.push(text) }));
  controller.keep();
  controller.exportNotebook();
  const exported = JSON.parse(downloads[0]!);
  assert.equal(exported.entries.length, 2);
  assert.deepEqual(exported.entries.at(-1), BROKEN);
});

test('un carnet illisible en entier est copié en secours dès l’ouverture, et la page le dit', async () => {
  for (const raw of ['{abîmé', '{"chat":1}']) {
    const shared = sharedStorage(raw);
    const controller = await ready(notebookOn(shared.storage));
    assert.deepEqual(shared.backups, [raw]);
    assert.match(controller.state.notebookMessage, /Copie de secours gardée dans le navigateur\.$/);
    controller.keep();
    assert.deepEqual(shared.backups, [raw], 'la copie n’est faite qu’une fois');
    assert.equal(parseNotebook(shared.data).entries.length, 1);
  }
  const shared = sharedStorage('{abîmé');
  assert.equal(setup(notebookOn(shared.storage)).state.notebookMessage, 'Le carnet est illisible. Copie de secours gardée dans le navigateur.');
});

test('sans copie de secours possible, la page ne la promet pas', () => {
  const plain = { read: () => '{abîmé', write: () => {} };
  assert.equal(setup(notebookOn(plain)).state.notebookMessage, 'Le carnet est illisible.');
  const full = {
    ...plain,
    backup: () => {
      throw new Error('plein');
    },
  };
  assert.equal(setup(notebookOn(full)).state.notebookMessage, 'Le carnet est illisible.');
});

test('deux onglets : ce que l’un garde, l’autre ne l’efface pas', async () => {
  const shared = sharedStorage();
  const a = await ready(notebookOn(shared.storage));
  const b = await ready(notebookOn(shared.storage));
  a.keep();
  b.keep();
  assert.equal(parseNotebook(shared.data).entries.length, 2);
  // B a vu l'entrée de A en écrivant ; A la voit en relisant le carnet.
  assert.equal(b.state.notebook.length, 2);
  assert.equal(a.state.notebook.length, 1);
  a.syncNotebook();
  assert.equal(a.state.notebook.length, 2);
});

test('relire le carnet met l’avis à jour', async () => {
  const shared = sharedStorage('{abîmé');
  const controller = await ready(notebookOn(shared.storage));
  assert.match(controller.state.notebookMessage, /illisible/);
  shared.storage.write(storedWith(BROKEN));
  controller.syncNotebook();
  assert.equal(controller.state.notebookMessage, '1 texte illisible par cette version, conservé : il reste dans l’export du carnet.');
});

test('relire un carnet devenu illisible ne vide pas la liste', async () => {
  const shared = sharedStorage();
  const controller = await ready(notebookOn(shared.storage));
  controller.keep();
  shared.storage.write('{abîmé');
  controller.syncNotebook();
  assert.equal(controller.state.notebook.length, 1);
});

test('un carnet de séance : « Garder » le dit, et invite à exporter', async () => {
  const controller = await ready(notebookOn(sharedStorage().storage, { persistent: false }));
  assert.equal(controller.state.notebookPersistent, false);
  controller.keep();
  assert.equal(controller.state.copyMessage, SESSION_KEPT);
  assert.equal(controller.state.notebook.length, 1);
  assert.equal((await ready(notebookOn(sharedStorage().storage))).state.notebookPersistent, true);
});

test('un carnet de séance affiche son avertissement en tête', () => {
  const props = { entries: [], message: '', today: new Date(), onReopen() {}, onRemove() {}, onExport() {}, onImport() {}, onCopy() {}, onEdit() {} };
  assert.match(renderToString(html`<${Notebook} ...${props} persistent=${false} />`), new RegExp(SESSION_ONLY));
  assert.doesNotMatch(renderToString(html`<${Notebook} ...${props} />`), /bloque le stockage/);
});

/** Une entrée gardée par un contrôleur, à abîmer ensuite. */
const keptEntry = async (): Promise<NotebookEntry> => {
  const controller = await ready(notebookOn(sharedStorage().storage));
  controller.keep();
  return controller.state.notebook[0]!;
};

test('une entrée saine se rouvre', async () => {
  assert.equal(reopenProblem(await keptEntry()), undefined);
});

test('une entrée aux réglages hors bornes, désalignée ou aux verrous perdus ne se rouvre pas', async () => {
  const entry = await keptEntry();
  const [s7, ...rest] = entry.mixer.instances;
  const withS7 = (patch: object): NotebookEntry => ({ ...entry, mixer: { ...entry.mixer, instances: [{ ...s7!, ...patch }, ...rest] } });
  assert.match(reopenProblem(withS7({ params: { ...s7!.params, offset: 500 } }))!, /./);
  assert.match(reopenProblem(withS7({ type: 'disparu' }))!, /plugin inconnu/);
  assert.equal(reopenProblem(withS7({ locks: [{ index: 99, key: 'offset', value: 3 }] })), 'un verrou vise un mot absent du texte');
  assert.match(reopenProblem(withS7({ locks: [{ index: 0, key: 'offset', value: 500 }] }))!, /./);
  assert.equal(reopenProblem({ ...entry, source: { ...entry.source, tagged: entry.source.tagged.slice(1) } }), 'l’étiquetage gardé ne correspond plus au découpage des mots ; copiez le texte et remettez-le en pistes');
  assert.equal(reopenProblem({ ...entry, mixer: { ...entry.mixer, closed: [99] } }), 'un pas bouché vise un mot absent du texte');
});

test('rouvrir une entrée hors bornes : un message, et la table, la saisie et le résultat restent', async () => {
  const shared = sharedStorage();
  const controller = await ready(notebookOn(shared.storage));
  controller.keep();
  const kept = controller.state.notebook[0]!;
  const [s7, ...rest] = kept.mixer.instances;
  const broken = { ...kept, id: 'hors-bornes', mixer: { ...kept.mixer, instances: [{ ...s7!, params: { ...s7!.params, offset: 500 } }, ...rest] } };
  shared.storage.write(storedWith(broken));
  controller.syncNotebook();
  controller.setInput('Le texte en cours.');
  const before = { mixer: controller.state.mixer, view: controller.state.view, input: controller.state.input };
  await controller.reopen('hors-bornes');
  assert.equal(controller.state.notebookError?.lead, 'Ce texte ne peut pas être rouvert :');
  assert.deepEqual({ mixer: controller.state.mixer, view: controller.state.view, input: controller.state.input }, before);
});

test('une reconstruction qui échoue à la réouverture laisse la table telle quelle', async () => {
  const shared = sharedStorage();
  let failing = false;
  const controller = setup(notebookOn(shared.storage), {
    loadMorphology: async () => {
      const real = morphology();
      return new Proxy(real, {
        get(target, key, receiver) {
          const value = Reflect.get(target, key, receiver);
          if (failing && typeof value === 'function') return () => { throw new Error('dictionnaire abîmé'); };
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    },
  });
  controller.setInput('La ferme.');
  await controller.run();
  controller.keep();
  const before = controller.state.view;
  failing = true;
  await controller.reopen(controller.state.notebook[0]!.id);
  assert.deepEqual(controller.state.notebookError, { lead: 'Ce texte ne peut pas être rouvert :', detail: 'dictionnaire abîmé.' });
  assert.equal(controller.state.view, before);
});

test('un texte gardé avant le découpage de « rendez-vous » se refuse en disant comment le récupérer', async () => {
  const entry = await keptEntry();
  // Gardé quand « rendez-vous » faisait deux mots : son étiquetage en compte un de trop.
  const old: NotebookEntry = {
    ...entry,
    source: { text: 'Le rendez-vous.', tagged: [{ word: 'Le', category: 'other' }, { word: 'rendez', category: 'verb' }, { word: 'vous', category: 'other' }] },
    mixer: { ...entry.mixer, instances: entry.mixer.instances.map((instance) => ({ ...instance, locks: [] })), closed: [] },
  };
  assert.match(reopenProblem(old)!, /copiez le texte et remettez-le en pistes/);
});

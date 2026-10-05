import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SAMPLE_TEXT, SEED } from '../../support/chain.ts';
import { EXAMPLES } from '../../../src/ui/tracks/examples.ts';
import { createTracksController, type TracksDependencies, type TracksState } from '../../../src/ui/tracks/controller.ts';
import type { Tagger } from '../../../src/ports/tagger.ts';
import { LOADING } from '../../../src/domain/verb.ts';
import { morphology, tag, verbs } from '../../support/morphology.ts';

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
  for (const action of SEED) controller.dispatch(action);
  states.length = 0;
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

test('ouverture : rien ne part vers les tiers avant le premier clic', () => {
  let preloads = 0;
  const { controller } = setup({ preload: async () => void preloads++ });
  assert.equal(controller.state.model.status, 'waiting');
  assert.equal(preloads, 0);
});

test('premier clic sur « Charger le modèle » : téléchargement avec son avancement en octets', async () => {
  const { controller, states } = setup();
  const loading = controller.preload();
  assert.equal(controller.state.model.status, 'loading');
  await loading;
  assert.equal(controller.state.model.status, 'ready');
  assert.ok(states.some((s) => s.model.status === 'loading' && s.model.loaded === 50 && s.model.total === 100));
  await controller.preload(); // déjà prêt : rien à refaire
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
  assert.deepEqual(controller.state.model.error, { lead: 'Le chargement du modèle a échoué.', detail: 'réseau coupé.' });
  await controller.preload();
  assert.equal(controller.state.model.status, 'ready');
  assert.equal(attempts, 2);
  // un dictionnaire injoignable fait échouer le chargement de la même façon
  const odd = setup({ loadMorphology: () => Promise.reject('panne') });
  await odd.controller.preload();
  assert.equal(odd.controller.state.model.error?.detail, 'panne.');
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
  assert.equal(controller.state.input, EXAMPLES[0]!.text);
  assert.ok(controller.state.view);
  await controller.copy();
  assert.match(copied[0]!, /— S\+7 sur les noms \(Oulipao\)$/);
});

test('les exemples tournent : un par clic, dans l’ordre, puis de nouveau le premier ; la table reste', async () => {
  const { controller } = setup();
  controller.dispatch({ type: 'toggle-mute', category: 'noun' }); // une table qui n'est plus celle de départ
  const authors: string[] = [];
  for (let click = 0; click < 6; click++) {
    await controller.example();
    authors.push(EXAMPLES.find((example) => example.text === controller.state.input)!.author);
  }
  assert.deepEqual(authors, ['Marcel Proust', 'Jean de La Fontaine', 'Arthur Rimbaud', 'Paul Verlaine', 'Victor Hugo', 'Marcel Proust']);
  assert.equal(controller.state.examplesShown, 6);
  assert.equal(controller.state.mixer.tracks.noun.muted, true);
});

/** Une page sans chaîne : la table de départ, sans le S+7 des autres tests. */
const bare = () => createTracksController({ tagger: tagger([]), loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {} });
const enabled = (controller: ReturnType<typeof bare>) => controller.state.mixer.instances.filter((instance) => instance.enabled).map((instance) => instance.type);

test('l’exemple joue : sans contrainte en marche, il branche un S+7 sur les noms', async () => {
  const controller = bare();
  await controller.example();
  assert.deepEqual(enabled(controller), ['s7']);
  assert.deepEqual(controller.state.mixer.instances[0]!.targets, ['noun']); // les noms de Proust ne sont pas dans le lexique des tests : le remplacement se vérifie en prévisualisation
  assert.ok(controller.state.view);
  await controller.example(); // un S+7 est en marche : rien de plus
  assert.equal(controller.state.mixer.instances.length, 1);
});

test('l’exemple garde une chaîne en marche ; des contraintes toutes coupées n’en sont pas une', async () => {
  const lipogram = bare();
  lipogram.dispatch({ type: 'add-instance', plugin: 'lipogram' });
  await lipogram.example();
  assert.deepEqual(lipogram.state.mixer.instances.map((instance) => instance.type), ['lipogram']);
  const cut = bare();
  cut.dispatch({ type: 'add-instance', plugin: 's7' });
  cut.dispatch({ type: 'toggle-instance', id: 's7-1' });
  await cut.example();
  assert.deepEqual(cut.state.mixer.instances.map((instance) => [instance.type, instance.enabled]), [['s7', false], ['s7', true]]);
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

test('inspecteur : choisir un mot, passer au voisin sans sortir du texte, fermer ; le choix suit les gestes, pas un nouvel étiquetage', async () => {
  const { controller } = setup();
  controller.step(1); // rien de choisi : rien ne bouge
  assert.equal(controller.state.selected, undefined);
  controller.setInput('La ferme dort.');
  await controller.run();
  controller.step(1);
  assert.equal(controller.state.selected, undefined);
  controller.select(1);
  controller.step(-1);
  controller.step(-1);
  assert.equal(controller.state.selected, 0);
  controller.step(5);
  assert.equal(controller.state.selected, 2); // trois mots : le dernier
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 2 });
  assert.equal(controller.state.selected, 2);
  controller.closeInspector();
  assert.equal(controller.state.selected, undefined);
  controller.select(1);
  await controller.run();
  assert.equal(controller.state.selected, undefined);
});

test('copier : le texte résultant et sa mention (D11) ; message à côté du bouton', async () => {
  const { controller, copied } = setup();
  await controller.copy();
  assert.deepEqual(copied, []); // rien à copier avant l'étiquetage
  controller.setInput('La ferme.');
  await controller.run();
  await controller.copy();
  assert.deepEqual(copied, ["La ferme.\n\nL'oncle.\n\n— S+7 sur les noms (Oulipao)"]); // l'original voyage avec le résultat
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

test('nouveau texte : les pas bouchés se rouvrent et les verrous tombent', async () => {
  const { controller } = setup();
  controller.setInput('La ferme dort.');
  await controller.run();
  controller.dispatch({ type: 'toggle-step', index: 1 });
  controller.dispatch({ type: 'set-lock', id: 's7-1', index: 1, key: 'offset', value: 2 });
  assert.deepEqual(controller.state.mixer.closed, [1]);
  controller.setInput('La ville dort.');
  await controller.run();
  assert.deepEqual(controller.state.mixer.closed, []);
  assert.deepEqual(controller.state.mixer.instances.flatMap((instance) => instance.locks ?? []), []);
});

test('grille : pas par page selon la largeur, la page du pas en tête reste ; pages bornées ; le mot choisi amène sa page', async () => {
  const { controller } = setup();
  controller.setInput(SAMPLE_TEXT);
  await controller.run();
  assert.equal(controller.state.perPage, 16);
  controller.showPage(2);
  assert.equal(controller.state.page, 2); // pas 33 à 44
  controller.showPage(9);
  assert.equal(controller.state.page, 2);
  controller.showPage(-1);
  assert.equal(controller.state.page, 0);
  controller.showPage(1); // pas 17 à 32
  controller.resize(375);
  assert.deepEqual([controller.state.perPage, controller.state.page], [4, 4]); // le pas 17 reste en tête
  const before = controller.state;
  controller.resize(380);
  assert.equal(controller.state, before); // même nombre de pas : rien ne change
  controller.select(30);
  assert.equal(controller.state.page, 7);
  await controller.run();
  assert.equal(controller.state.page, 0);
});

test('bande collée : l’état ne change qu’au franchissement', () => {
  const { controller, states } = setup();
  controller.pin(true);
  controller.pin(true);
  assert.equal(controller.state.pinned, true);
  assert.equal(states.length, 1);
  controller.pin(false);
  assert.equal(controller.state.pinned, false);
});

test('raccourcis avant la mise en pistes : rien', () => {
  const { controller } = setup();
  assert.equal(controller.shortcut('ArrowRight', false), false);
});

test('raccourcis de l’inspecteur : où que soit le focus, pas dans un champ ; une flèche l’ouvre ; la grille suit la page', async () => {
  const { controller } = setup();
  controller.setInput(SAMPLE_TEXT);
  await controller.run();
  controller.resize(375); // quatre pas par page
  controller.showPage(2);
  assert.equal(controller.shortcut('Escape', false), false); // rien à fermer
  assert.equal(controller.shortcut('ArrowRight', false), true); // fermé : ouvert sur le premier mot de la page
  assert.deepEqual([controller.state.selected, controller.state.page], [8, 2]);
  controller.select(3);
  assert.equal(controller.state.page, 0);
  assert.equal(controller.shortcut('ArrowRight', false), true);
  assert.deepEqual([controller.state.selected, controller.state.page], [4, 1]); // la grille passe à la page du pas 5
  assert.equal(controller.shortcut('ArrowLeft', false), true);
  assert.deepEqual([controller.state.selected, controller.state.page], [3, 0]);
  assert.equal(controller.shortcut('ArrowLeft', true), false); // dans un champ : la flèche est au champ
  assert.equal(controller.state.selected, 3);
  assert.equal(controller.shortcut('a', false), false);
  assert.equal(controller.shortcut('Escape', false), true);
  assert.equal(controller.state.selected, undefined);
});

test('Page ouverte sans verbes visés : les verbes ne sont pas demandés', async () => {
  let asked = 0;
  const { controller } = setup({ loadVerbs: async () => (asked++, verbs()) });
  controller.setInput('Le chat dort.');
  await controller.run();
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 3 });
  await tick();
  assert.equal(asked, 0);
  assert.equal(controller.state.verbs.status, 'idle');
});

test('Verbes visés : d’abord la raison du chargement, puis le recalcul sans nouvel étiquetage', async () => {
  const calls: string[] = [];
  let release!: () => void;
  const { controller } = setup({ loadVerbs: () => new Promise((resolve) => (release = () => resolve(verbs()))) }, calls);
  controller.setInput('Le chat dort.');
  await controller.run();
  controller.dispatch({ type: 'set-targets', id: 's7-1', targets: ['noun', 'verb'] });
  assert.equal(controller.state.verbs.status, 'loading');
  assert.equal(controller.state.view!.stages.at(-1)!.words[2]!.output, 'dort');
  assert.deepEqual(controller.state.view!.marks.get(2), { state: 'kept', original: 'dort', reason: LOADING });
  release();
  await tick();
  assert.equal(controller.state.verbs.status, 'ready');
  // dormir + 7, en faisant le tour des huit verbes du dictionnaire de test : chanter.
  assert.equal(controller.state.view!.stages.at(-1)!.words[2]!.output, 'chante');
  assert.deepEqual(calls, ['Le chat dort.']);
  // Déjà là : un nouveau geste ne les redemande pas.
  await controller.loadVerbs();
  assert.equal(controller.state.verbs.status, 'ready');
});

test('Verbes injoignables : l’erreur reste affichée, la relance les charge', async () => {
  let calls = 0;
  const { controller } = setup({ loadVerbs: async () => (calls++ === 0 ? Promise.reject(new Error('503')) : verbs()) });
  controller.setInput('Le chat dort.');
  await controller.run();
  controller.dispatch({ type: 'set-targets', id: 's7-1', targets: ['verb'] });
  await tick();
  assert.deepEqual(controller.state.verbs, { status: 'error', error: { lead: 'Le chargement des verbes a échoué.', detail: '503.' } });
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 7 });
  await tick();
  assert.equal(calls, 1); // un geste ne relance pas : le bouton le fait
  await controller.loadVerbs();
  assert.equal(controller.state.verbs.status, 'ready');
  assert.equal(controller.state.view!.stages.at(-1)!.words[2]!.output, 'chante');
});

test('Un lipogramme mis en marche dès l’étiquetage vise les verbes : ils sont demandés', async () => {
  let asked = 0;
  const { controller } = setup({ loadVerbs: async () => (asked++, verbs()) });
  controller.dispatch({ type: 'toggle-instance', id: 'lipogram-1' });
  controller.setInput('Le chat dort.');
  await controller.run();
  await tick();
  assert.equal(asked, 1);
});

test('Sans chargeur de verbes : rien n’est demandé', async () => {
  const { controller } = setup();
  await controller.loadVerbs();
  assert.equal(controller.state.verbs.status, 'idle');
});

test('copier après itération : l’ancêtre, l’original de la passe, le résultat et la mention, comme depuis le carnet', async () => {
  const { controller, copied } = setup();
  controller.setInput('La ferme.');
  await controller.run();
  await controller.iterate();
  await controller.copy();
  const kept = controller.state.view!;
  assert.match(copied[0]!, /^La ferme\.\n\nL'oncle\.\n\n/); // l'ancêtre, puis la source de la passe
  assert.ok(copied[0]!.includes(`\n\n${kept.result}\n\n— `));
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seededState } from '../../support/chain.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { computeTour } from '../../../src/ui/tracks/loop.ts';
import { reduce } from '../../../src/ui/tracks/mixer-state.ts';

test('computeTour : étiquette, rouvre les pas, applique la table, sans rien écrire ailleurs', async () => {
  const mixer = reduce(seededState, { type: 'toggle-step', index: 1 });
  const before = JSON.stringify(mixer);
  const tagged: string[] = [];
  const tour = await computeTour('La ferme dort.', mixer, { tagger: { name: 'factice', tag: (text) => (tagged.push(text), tag(text)) }, morphology: morphology() });
  assert.deepEqual(tagged, ['La ferme dort.']);
  assert.equal(tour.session.text, 'La ferme dort.');
  assert.deepEqual(tour.mixer.closed ?? [], []);
  assert.equal(JSON.stringify(mixer), before);
  assert.notEqual(tour.view.result, 'La ferme dort.'); // le S+7 a agi
});

test('computeTour : une erreur d’étiquetage remonte', async () => {
  await assert.rejects(computeTour('x', seededState, { tagger: { name: 'cassé', tag: async () => { throw new Error('panne'); } }, morphology: morphology() }), /panne/);
});

// La boucle dans le contrôleur

import { SEED } from '../../support/chain.ts';
import { fakeSpeech } from '../../support/speech.ts';
import { lineageOf } from '../../../src/ui/tracks/loop.ts';
import { createTracksController, type NotebookDependencies, type TracksController, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import type { TaggedWord } from '../../../src/domain/tagged-word.ts';
import { tokenize } from '../../../src/domain/tokenizer.ts';
import type { MixerAction } from '../../../src/ui/tracks/types.ts';

/** Un carnet factice en mémoire, aux identifiants prévisibles ; `full` fait échouer l'écriture. */
function fakeNotebook() {
  let data: string | null = null;
  let ids = 0;
  const box = { full: false };
  const notebook: NotebookDependencies = {
    storage: {
      read: () => data,
      write: (text) => {
        if (box.full) throw new Error('stockage plein');
        data = text;
      },
    },
    now: () => new Date(2026, 9, 4, 21),
    newId: () => `t${++ids}`,
    confirm: () => true,
    download: () => {},
  };
  return { notebook, box, read: () => data };
}

type Tag = (text: string, call: number) => TaggedWord[] | Promise<TaggedWord[]>;

/** Une page en pistes sur `text` avec la chaîne des tests (S+7 sur les noms) ; `onFrame` voit chaque tour avant son calcul. */
async function setup(options: { text?: string; tag?: Tag; actions?: MixerAction[]; onFrame?: (controller: TracksController) => void; overrides?: Partial<TracksDependencies> } = {}) {
  const fake = fakeNotebook();
  const tagged: string[] = [];
  const copied: string[] = [];
  const controller: TracksController = createTracksController({
    tagger: { name: 'factice', tag: (text) => (tagged.push(text), (options.tag ?? ((t) => tag(t)))(text, tagged.length)) },
    loadMorphology: async () => morphology(),
    preload: async () => {},
    copy: async (text) => void copied.push(text),
    notebook: fake.notebook,
    nextFrame: async () => options.onFrame?.(controller),
    ...options.overrides,
  });
  for (const action of options.actions ?? SEED) controller.dispatch(action);
  controller.setInput(options.text ?? 'La ferme.');
  await controller.run();
  return { controller, tagged, copied, ...fake };
}

const texts = (controller: TracksController) => controller.state.loop!.tours.map((tour) => tour.text);

test('boucle : quatre tours de S+7, le tour 1 gardé, rien d’autre au carnet', async () => {
  const { controller, tagged } = await setup();
  assert.equal(controller.state.loopTours, 4);
  await controller.loop();
  const loop = controller.state.loop!;
  assert.deepEqual(texts(controller), ['La ferme.', 'L’oncle.'.replace('’', "'"), 'Le chat.', "L'hôtel.", "L'aire."]);
  assert.equal(loop.status, 'done');
  assert.equal(loop.shown, 4); // le curseur a suivi le calcul
  assert.equal(controller.state.notebook.length, 1);
  assert.equal(controller.state.notebook[0]!.result, "L'oncle.");
  assert.deepEqual(tagged, ['La ferme.', "L'oncle.", 'Le chat.', "L'hôtel."]);
  await controller.loop(); // déjà au bout : rien à faire
  assert.equal(tagged.length, 4);
});

test('boucle : deux boucles identiques donnent les mêmes tours', async () => {
  const a = await setup({ text: 'Le chat du notaire dort sur le mur.' });
  const b = await setup({ text: 'Le chat du notaire dort sur le mur.' });
  await a.controller.loop();
  await b.controller.loop();
  assert.deepEqual(texts(a.controller), texts(b.controller));
});

test('boucle : rien à boucler sans vue, avec un texte saisi qui ne correspond plus, ni pendant un calcul', async () => {
  const fake = fakeNotebook();
  const empty = createTracksController({ tagger: { name: 'factice', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {}, notebook: fake.notebook });
  await empty.loop();
  assert.equal(empty.state.loop, undefined);
  const { controller } = await setup();
  controller.setInput('Un autre texte.');
  await controller.loop();
  assert.equal(controller.state.loop, undefined);
  assert.equal(controller.state.notebook.length, 0);
});

test('boucle : stockage plein, le geste s’arrête et rien ne bouge', async () => {
  const { controller, box, tagged } = await setup();
  box.full = true;
  await controller.loop();
  assert.equal(controller.state.loop, undefined);
  assert.equal(controller.state.notebookError?.lead, 'Impossible de garder :');
  assert.equal(tagged.length, 1);
});

test('boucle : un lipogramme bouclé s’arrête sur un point fixe', async () => {
  const { controller } = await setup({ text: 'Le chat de la ferme dort.', actions: [{ type: 'add-instance', plugin: 'lipogram' }, { type: 'set-param', id: 'lipogram-1', key: 'letters', value: 'e' }] });
  controller.setLoopTours(8);
  await controller.loop();
  const loop = controller.state.loop!;
  assert.deepEqual(loop.repeat, { from: 1, length: 1 });
  assert.equal(loop.tours.length, 3);
  assert.equal(loop.status, 'done');
});

test('boucle : un tour sans aucun mot arrête le calcul et ne se garde pas', async () => {
  // Au deuxième étiquetage, tous les mots passent en adverbes, piste coupée : le tour 2 est vide.
  const { controller } = await setup({ tag: (text, call) => (call >= 2 ? tag(text).map((word) => ({ ...word, category: 'adverb' as const })) : tag(text)), actions: [...SEED, { type: 'toggle-mute', category: 'adverb' }] });
  controller.setLoopTours(6);
  await controller.loop();
  const loop = controller.state.loop!;
  assert.equal(loop.emptyAt, 2);
  assert.equal(loop.tours.length, 3);
  assert.equal(controller.keep(), undefined);
});

test('boucle : « Arrêter la boucle » au troisième tour, puis « Boucler » reprend au quatrième', async () => {
  let stopAt = 4;
  const { controller, tagged } = await setup({ onFrame: (c) => c.state.loop?.progress === stopAt && c.stopLoop() });
  controller.setLoopTours(8);
  await controller.loop();
  assert.equal(controller.state.loop!.status, 'stopped');
  assert.equal(controller.state.loop!.tours.length, 4); // tours 0 à 3
  stopAt = -1;
  const before = tagged.length;
  await controller.loop();
  assert.equal(controller.state.loop!.status, 'done');
  assert.equal(controller.state.loop!.tours.length, 9);
  assert.equal(tagged.length, before + 5); // les tours 4 à 8 seulement
});

test('boucle : un échec au cinquième tour garde les tours faits et dit pourquoi', async () => {
  const { controller } = await setup({ tag: (text, call) => (call === 5 ? Promise.reject(new Error('modèle absent')) : tag(text)) });
  controller.setLoopTours(8);
  await controller.loop();
  const loop = controller.state.loop!;
  assert.equal(loop.status, 'failed');
  assert.equal(loop.tours.length, 5); // tours 0 à 4
  assert.deepEqual(loop.error, { lead: 'Tour 5 impossible :', detail: 'modèle absent. Boucler relance.' });
  await controller.loop();
  assert.equal(controller.state.loop!.status, 'done');
  assert.equal(controller.state.loop!.error, undefined);
});

test('boucle : le curseur suit le calcul jusqu’à ce qu’on le touche', async () => {
  const { controller } = await setup({ onFrame: (c) => c.state.loop?.progress === 5 && c.showTour(2) });
  controller.setLoopTours(6);
  await controller.loop();
  assert.equal(controller.state.loop!.shown, 2);
  assert.equal(controller.state.loop!.follow, false);
  controller.showTour(9); // pas encore calculé : rien
  controller.showTour(0);
  assert.equal(controller.state.loop!.shown, 0);
});

test('boucle : toucher la table l’abandonne et le dit', async () => {
  const { controller } = await setup();
  await controller.loop();
  controller.showTour(3);
  controller.dispatch({ type: 'toggle-mute', category: 'adjective' });
  assert.equal(controller.state.loop, undefined);
  assert.equal(controller.state.copyMessage, 'Boucle abandonnée : la table a changé. Le tour 1 est au carnet.');
});

test('boucle : abandonnée pendant un étiquetage, le tour en cours n’est pas publié', async () => {
  let controllerRef: TracksController | undefined;
  const { controller } = await setup({
    tag: (text, call) => {
      if (call === 3) controllerRef!.setInput('Autre chose.');
      return tag(text);
    },
  });
  controllerRef = controller;
  await controller.loop();
  assert.equal(controller.state.loop, undefined);
  assert.equal(controller.state.copyMessage, 'Boucle abandonnée : le texte a changé. Le tour 1 est au carnet.');
});

test('boucle : « Garder » au tour 5 ajoute une seule entrée, marquée, de filiation ×5', async () => {
  const { controller, read } = await setup();
  controller.setLoopTours(8);
  await controller.loop();
  controller.showTour(5);
  const tours = texts(controller);
  const id = controller.keep();
  assert.equal(controller.state.notebook.length, 2);
  const kept = controller.state.notebook[0]!;
  assert.equal(kept.id, id);
  assert.equal(kept.source.text, tours[4]);
  assert.equal(kept.result, tours[5]);
  assert.deepEqual(kept.lineage, { parent: 't1', ancestor: 'La ferme.', passes: Array(4).fill('S+7 sur les noms') });
  assert.equal(kept.mention, '\n\n— S+7 sur les noms ×5 (Oulipao)');
  assert.deepEqual(kept.loop, { tours: 8, shown: 5 });
  assert.match(read()!, /"loop":\{"tours":8,"shown":5\}/);
  assert.equal(controller.state.unsaved, false);
  // Rouvert puis itéré : la filiation continue depuis le tour 5.
  await controller.reopen(id!);
  assert.equal(controller.state.loop, undefined);
  assert.equal(controller.state.view!.result, tours[5]);
  await controller.iterate();
  assert.deepEqual(controller.state.lineage, { parent: id, ancestor: 'La ferme.', passes: Array(5).fill('S+7 sur les noms') });
});

test('boucle : au tour 0, « Garder » ne fait rien et « Copier » copie l’original ; au tour 3, comme l’entrée qu’il deviendrait', async () => {
  const { controller, copied } = await setup();
  await controller.loop();
  controller.showTour(0);
  assert.equal(controller.keep(), undefined);
  await controller.copy();
  controller.showTour(3);
  await controller.copy();
  controller.showTour(1);
  assert.equal(controller.keep(), 't2');
  // Comme l'entrée qu'il deviendrait : l'ancêtre, le tour d'avant, puis le tour et sa mention.
  assert.deepEqual(copied, ['La ferme.', "La ferme.\n\nLe chat.\n\nL'hôtel.\n\n— S+7 sur les noms ×3 (Oulipao)"]);
});

test('boucle : le nombre de tours raccourcit sans recalcul, et s’allonge en reprenant', async () => {
  const { controller, tagged } = await setup();
  await controller.loop();
  controller.setLoopTours(2);
  assert.equal(controller.state.loop!.tours.length, 3);
  assert.equal(controller.state.loop!.shown, 2);
  controller.setLoopTours(13); // hors bornes : rien
  controller.setLoopTours(5);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controller.state.loopTours, 5);
  assert.equal(controller.state.loop!.tours.length, 6);
  assert.equal(tagged.length, 1 + 3 + 3); // mise en pistes, tours 2-4, puis tours 3-5 après le raccourci
});

test('boucle : la lignée d’un mot, et « — » pour un mot retiré', async () => {
  const { controller } = await setup();
  await controller.loop();
  assert.deepEqual(lineageOf(controller.state.loop!.tours, 1), ['ferme', 'oncle', 'chat', 'hôtel', 'aire']);
  const segments = controller.state.loop!.tours;
  const removed = [segments[0]!, { ...segments[1]!, view: { ...segments[1]!.view!, segments: [{ text: 'La ' }] } }];
  assert.deepEqual(lineageOf(removed, 1), ['ferme', '—']);
});

test('boucle : l’écoute lit le tour montré, à la même place, et compte pour « réglé en écoutant »', async () => {
  const speech = fakeSpeech();
  const blanks: (() => void)[] = [];
  const { controller } = await setup({ text: 'Le chat du notaire dort sur le mur.', overrides: { speech, sleep: () => new Promise<void>((resolve) => void blanks.push(resolve)) } });
  await controller.loop();
  controller.showTour(2);
  controller.play();
  assert.equal(controller.state.spoken, 0);
  const wordOf = (tour: number, at: number) => tokenize(controller.state.loop!.tours[tour]!.text)[at]!.word;
  assert.deepEqual(speech.said.at(-1)!.words, [wordOf(2, 0)]);
  speech.finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
  controller.showTour(4);
  blanks.shift()!();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controller.state.spoken, 1);
  assert.deepEqual(speech.said.at(-1)!.words, [wordOf(4, 1)]);
  controller.stop();
  assert.equal(controller.state.spoken, undefined);
  controller.keep();
  assert.match(controller.state.notebook[0]!.mention, /réglé en écoutant/);
});

// L'interface

import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { elements } from '../../support/vnode.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { Inspector } from '../../../src/ui/tracks/components/inspector.ts';
import { LoopRow, TourCursor, loopAnnouncement } from '../../../src/ui/tracks/components/tour-cursor.ts';
import { originSegments, type LoopState } from '../../../src/ui/tracks/loop.ts';

const loopOf = (extra: Partial<LoopState> = {}): LoopState => {
  const tour = (text: string) => ({ text, session: { text, tagged: tag(text) } });
  return { tours: [tour('La ferme.'), tour("L'oncle."), tour('Le chat.'), tour("L'hôtel.")], target: 6, shown: 2, follow: false, status: 'done', firstKept: 't1', ...extra };
};

test('Result : « Boucler » après « Itérer », désactivé comme elle et pendant une boucle ; « Garder » nomme le tour', () => {
  const calls: string[] = [];
  const base = { segments: [{ text: 'Le chat.', index: 0 }], marks: new Map(), tracks: ['noun'], onSelect: () => calls.push('select'), changed: new Set(), generation: 0, audibleCount: 5, copyMessage: '', onCopy: () => {}, onKeep: () => {}, onIterate: () => {}, onLoop: () => calls.push('loop') };
  const keys = (props: object) => elements(html`<${Result} ...${base} ...${props} />`).filter((element) => element.type === 'button');
  const labels = keys({ empty: false, stale: false }).map((key) => key.props['children']);
  assert.deepEqual(labels.slice(0, 4), ['Copier', 'Garder', 'Itérer', 'Boucler']);
  const loop = keys({ empty: false, stale: false }).find((key) => key.props['children'] === 'Boucler')!;
  assert.equal(loop.props['disabled'], false);
  (loop.props['onClick'] as () => void)();
  assert.deepEqual(calls, ['loop']);
  for (const props of [{ empty: true, stale: false }, { empty: false, stale: true }, { empty: false, stale: false, busy: true }, { empty: false, stale: false, looping: true }]) {
    assert.equal(keys(props).find((key) => key.props['children'] === 'Boucler')!.props['disabled'], true);
  }
  const keep = keys({ empty: false, stale: false, keepLabel: 'Garder le tour 5' }).find((key) => /keep/.test(String(key.props['class'])))!;
  assert.equal(keep.props['children'], 'Garder le tour 5');
  const origin = keys({ empty: false, stale: false, keepDisabled: true, keepTitle: 'Le texte d’origine est déjà à la saisie' }).find((key) => /keep/.test(String(key.props['class'])))!;
  assert.equal(origin.props['disabled'], true);
  assert.equal(origin.props['title'], 'Le texte d’origine est déjà à la saisie');
});

test('Result : un tour autre que le tour en cours ne s’ouvre pas dans l’inspecteur ; le mot dit est marqué ; un tour vide le dit', () => {
  const base = { marks: new Map([[0, { state: 'replaced' as const, original: 'ferme' }]]), tracks: ['noun'], onSelect: () => {}, changed: new Set(), generation: 0, audibleCount: 5, copyMessage: '', onCopy: () => {}, stale: false };
  const words = elements(html`<${Result} ...${base} segments=${[{ text: 'oncle', index: 0 }, { text: ' dort.' }]} empty=${false} interactive=${false} spoken=${1} />`).filter((element) => /\bword\b/.test(String(element.props['class'])));
  assert.equal(words[0]!.props['tabindex'], undefined);
  assert.equal(words[0]!.props['onClick'], undefined);
  const said = renderToString(html`<${Result} ...${base} segments=${[{ text: 'Le', index: 0 }, { text: ' ' }, { text: 'chat', index: 1 }]} empty=${false} spoken=${1} />`);
  assert.match(said, /class="word spoken"[^>]*>chat</);
  assert.match(renderToString(html`<${Result} ...${base} segments=${[]} empty=${true} emptyText="Plus aucun mot au tour 4." />`), /Plus aucun mot au tour 4\./);
});

test('originSegments : le texte d’origine en mots numérotés et en séparateurs', () => {
  assert.deepEqual(originSegments('La ferme dort.'), [{ text: 'La', index: 0 }, { text: ' ' }, { text: 'ferme', index: 1 }, { text: ' ' }, { text: 'dort', index: 2 }, { text: '.' }]);
});

test('TourCursor : un trou par tour, calculé, montré ou à venir ; le cycle souligné ; clavier et clic', () => {
  const shown: number[] = [];
  const cursor = elements(html`<${TourCursor} loop=${loopOf({ repeat: { from: 1, length: 2 } })} onShow=${(k: number) => shown.push(k)} />`);
  const slider = cursor.find((element) => element.props['role'] === 'slider')!;
  assert.equal(slider.props['aria-valuetext'], 'tour 2 sur 6, cycle de 2 à partir du tour 1');
  const holes = cursor.filter((element) => /\bhole\b/.test(String(element.props['class'])));
  assert.deepEqual(holes.map((hole) => String(hole.props['class'])), ['hole computed strong', 'hole computed repeat', 'hole shown repeat', 'hole computed repeat', 'hole ahead strong', 'hole ahead', 'hole ahead']);
  (holes[3]!.props['onClick'] as () => void)();
  assert.equal(holes[5]!.props['onClick'], undefined); // à venir : ne se choisit pas
  (holes[1]!.props['onPointerEnter'] as (event: object) => void)({ buttons: 1 });
  (holes[0]!.props['onPointerEnter'] as (event: object) => void)({ buttons: 0 });
  const key = (name: string) => (slider.props['onKeyDown'] as (event: object) => void)({ key: name, preventDefault: () => {} });
  key('ArrowRight');
  key('ArrowLeft');
  key('Home');
  key('End');
  key('a');
  assert.deepEqual(shown, [3, 1, 3, 1, 0, 3]);
});

test('LoopRow : curseur, tour montré, annonce, arrêt pendant le calcul, nombre de tours ; collée, le curseur seul', () => {
  const props = { onShow: () => {}, onStop: () => {}, onTours: () => {} };
  const computing = renderToString(html`<${LoopRow} loop=${loopOf({ status: 'computing', progress: 4 })} ...${props} />`);
  assert.match(computing, /Boucle<\/span>.*class="tour-cursor".*tour 2 \/ 6.*tour 4 sur 6….*Arrêter la boucle.*Tours/s);
  const done = renderToString(html`<${LoopRow} loop=${loopOf()} ...${props} />`);
  assert.doesNotMatch(done, /Arrêter la boucle/);
  const pinned = renderToString(html`<${LoopRow} loop=${loopOf({ status: 'computing', progress: 4 })} pinned=${true} ...${props} />`);
  assert.match(pinned, /tour-cursor/);
  assert.doesNotMatch(pinned, /Arrêter la boucle|Tours|role="status"/);
  const failed = renderToString(html`<${LoopRow} loop=${loopOf({ status: 'failed', error: { lead: 'Tour 4 impossible :', detail: 'panne. Boucler relance.' } })} ...${props} />`);
  assert.match(failed, /role="alert"><strong>Tour 4 impossible :<\/strong> panne\. Boucler relance\./);
});

test('loopAnnouncement : calcul, arrêt, point fixe, cycle, tour vide, rien au bout du compte', () => {
  assert.equal(loopAnnouncement(loopOf({ status: 'computing', progress: 3 })), 'tour 3 sur 6…');
  assert.equal(loopAnnouncement(loopOf({ status: 'computing', progress: undefined })), 'tour 4 sur 6…');
  assert.equal(loopAnnouncement(loopOf({ status: 'stopped' })), 'arrêtée au tour 3 sur 6');
  assert.equal(loopAnnouncement(loopOf({ repeat: { from: 1, length: 1 } })), 'point fixe au tour 1');
  assert.equal(loopAnnouncement(loopOf({ repeat: { from: 3, length: 2 } })), 'cycle de 2 à partir du tour 3');
  assert.equal(loopAnnouncement(loopOf({ emptyAt: 3 })), 'tout retiré au tour 3');
  assert.equal(loopAnnouncement(loopOf()), '');
});

test('Inspector : la lignée du mot, tour par tour, annoncée', () => {
  const window = { columns: [{ index: 0, distance: 0 }], bands: [] };
  const out = renderToString(html`<${Inspector} window=${window} word="ferme" onClose=${() => {}} lineage=${['ferme', 'oncle', 'chat']} />`);
  assert.match(out, /class="lineage" aria-live="polite"><span class="silk">Lignée<\/span> <span class="lineage-step">ferme<sub class="num">0<\/sub><\/span> → <span class="lineage-step">oncle<sub class="num">1<\/sub><\/span> → /);
  assert.doesNotMatch(renderToString(html`<${Inspector} window=${window} word="ferme" onClose=${() => {}} />`), /Lignée/);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SAMPLE_TEXT, SEED } from '../../support/chain.ts';
import { fakeSpeech, type FakeSpeech } from '../../support/speech.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { createTracksController, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import type { MonitoringPreferences } from '../../../src/ports/monitoring-preferences.ts';

/** Un blanc que le test laisse passer quand il veut. */
const gaps = () => {
  const waiting: { ms: number; resolve: () => void }[] = [];
  return {
    waiting,
    sleep: (ms: number) => new Promise<void>((resolve) => void waiting.push({ ms, resolve })),
    pass: () => waiting.shift()?.resolve(),
  };
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const setup = async (overrides: Partial<TracksDependencies> = {}, speech: FakeSpeech = fakeSpeech()) => {
  const blanks = gaps();
  const saved: MonitoringPreferences[] = [];
  const copied: string[] = [];
  const controller = createTracksController({
    tagger: { name: 'factice', tag: (text) => tag(text) },
    loadMorphology: async () => morphology(),
    preload: async () => {},
    copy: async (text) => void copied.push(text),
    speech,
    sleep: blanks.sleep,
    preferences: { load: () => ({ tempo: 3, source: 'result' as const }), save: (p) => void saved.push(p) },
    ...overrides,
  });
  for (const action of SEED) controller.dispatch(action);
  controller.resize(700); // huit pas par page
  controller.setInput(SAMPLE_TEXT);
  await controller.run();
  return { controller, speech, blanks, saved, copied };
};
/** Laisse dire le pas en cours, puis passer son blanc. */
const next = async (speech: FakeSpeech, blanks: ReturnType<typeof gaps>) => {
  speech.finish();
  await tick();
  blanks.pass();
  await tick();
};

test('écoute : arrêtée au départ ; lancée, elle dit le premier pas de la page ; arrêtée, elle se tait', async () => {
  const { controller, speech } = await setup();
  assert.equal(controller.state.playing, false);
  assert.equal(controller.state.playhead, undefined);
  controller.toggle();
  assert.equal(controller.state.playing, true);
  assert.equal(controller.state.playhead, 0);
  assert.deepEqual(speech.said[0]!.words, ['Le']);
  assert.deepEqual(speech.said[0]!.options, { rate: 1, voice: undefined });
  controller.play(); // déjà en marche : rien de plus
  assert.equal(speech.said.length, 1);
  controller.toggle();
  assert.equal(controller.state.playing, false);
  assert.equal(controller.state.playhead, undefined);
  assert.equal(speech.cancels, 1);
  await tick();
  assert.equal(speech.said.length, 1); // aucune parole après l'arrêt
  controller.stop(); // déjà arrêtée : rien
  assert.equal(speech.cancels, 1);
});

test('écoute : la tête lit tout le texte, la grille suit sa page, puis elle reprend au début', async () => {
  const { controller, speech, blanks } = await setup();
  const total = controller.state.view!.tracks.length;
  controller.play();
  const heads = [controller.state.playhead];
  const pages = [controller.state.page];
  for (let k = 0; k < total; k++) {
    await next(speech, blanks);
    heads.push(controller.state.playhead);
    pages.push(controller.state.page);
  }
  assert.deepEqual(heads, [...Array.from({ length: total }, (_, k) => k), 0]);
  assert.equal(pages[8], 1); // le pas 9 : la grille passe à la page suivante
  assert.equal(pages.at(-2), Math.floor((total - 1) / 8));
  assert.equal(pages.at(-1), 0); // après le dernier mot, le début et sa page
});

test('écoute : une page choisie à la main fait repartir la tête de son premier pas', async () => {
  const { controller, speech, blanks } = await setup();
  controller.play();
  for (let k = 0; k < 4; k++) await next(speech, blanks);
  assert.equal(controller.state.playhead, 4);
  controller.showPage(2);
  await next(speech, blanks);
  assert.equal(controller.state.playhead, 16);
  await next(speech, blanks);
  assert.equal(controller.state.playhead, 17);
});

test('écoute : un réglage changé s’entend au pas suivant, sans revenir au début ; le tempo aussi', async () => {
  const { controller, speech, blanks } = await setup();
  controller.play();
  for (let k = 0; k < 5; k++) await next(speech, blanks);
  assert.equal(controller.state.playhead, 5); // un nom remplacé par le S+7
  const before = speech.said.at(-1)!.words;
  controller.dispatch({ type: 'set-param', id: 's7-1', key: 'offset', value: 8 });
  controller.setTempo(1);
  speech.finish();
  await tick();
  assert.equal(blanks.waiting[0]!.ms, 220); // le blanc du pas en cours garde l'ancien tempo
  blanks.pass();
  await tick();
  assert.equal(controller.state.playhead, 6); // pas de retour au début
  const total = controller.state.view!.tracks.length;
  for (let k = 6; k < total + 5; k++) await next(speech, blanks); // un tour du texte : le pas 5 revient
  assert.equal(controller.state.playhead, 5);
  assert.notDeepEqual(speech.said.at(-1)!.words, before);
  assert.equal(speech.said.at(-1)!.options.rate, 0.7);
});

test('écoute : un pas qui ne s’entend pas se tait le temps d’un blanc', async () => {
  const { controller, speech, blanks } = await setup();
  controller.dispatch({ type: 'toggle-solo', category: 'noun' });
  controller.play();
  // pas 0 à 4 : aucun nom ; rien n'est dit, un blanc passe à chaque pas
  for (let k = 0; k < 5; k++) {
    assert.equal(speech.said.length, 0);
    assert.equal(blanks.waiting.length, 1);
    blanks.pass();
    await tick();
  }
  assert.equal(controller.state.playhead, 5);
  assert.equal(speech.said.length, 1);
});

test('écoute : rien sans voix française ; la liste des voix arrivée en retard la rend possible', async () => {
  const speech = fakeSpeech([]);
  const { controller } = await setup({}, speech);
  controller.play();
  assert.equal(controller.state.playing, false);
  speech.setVoices([{ id: 'fr-1', name: 'Amélie' }]);
  assert.deepEqual(controller.state.voices, [{ id: 'fr-1', name: 'Amélie' }]);
  controller.play();
  assert.equal(controller.state.playing, true);
});

test('écoute : sans voix branchée ni texte en pistes, rien ne se lance', () => {
  const bare = createTracksController({ tagger: { name: 'f', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {} });
  assert.deepEqual(bare.state.voices, []);
  bare.play();
  bare.stop();
  assert.equal(bare.state.playing, false);
  const waiting = createTracksController({ tagger: { name: 'f', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {}, speech: fakeSpeech() });
  waiting.play();
  assert.equal(waiting.state.playing, false);
  assert.equal(waiting.shortcut(' ', false), false);
});

test('tempo et voix : bornés, gardés ; une voix inconnue est refusée', async () => {
  const { controller, saved } = await setup();
  controller.setTempo(9);
  controller.setVoice('inconnue');
  assert.equal(controller.state.tempo, 3);
  assert.equal(saved.length, 0);
  controller.setTempo(5);
  controller.setVoice('fr-1');
  assert.deepEqual(saved.at(-1), { tempo: 5, voice: 'fr-1', source: 'result' });
  assert.equal(controller.state.voice, 'fr-1');
});

test('barre d’espace : lance et arrête hors des champs ; rien dans un champ', async () => {
  const { controller } = await setup();
  assert.equal(controller.shortcut(' ', true), false);
  assert.equal(controller.state.playing, false);
  assert.equal(controller.shortcut(' ', false), true);
  assert.equal(controller.state.playing, true);
  assert.equal(controller.shortcut(' ', false), true);
  assert.equal(controller.state.playing, false);
});

test('remettre en pistes ou rouvrir une entrée arrête l’écoute', async () => {
  const { controller, speech } = await setup();
  controller.play();
  await controller.run();
  assert.equal(controller.state.playing, false);
  controller.keep();
  controller.play();
  await controller.reopen(controller.state.notebook[0]!.id);
  assert.equal(controller.state.playing, false);
  assert.equal(speech.cancels, 2);
});

test('mention : « réglé en écoutant » après une écoute, à la copie comme au carnet ; remise à zéro par une nouvelle mise en pistes', async () => {
  const { controller, copied } = await setup();
  await controller.copy();
  assert.doesNotMatch(copied[0]!, /réglé en écoutant/);
  controller.play();
  controller.stop();
  await controller.copy();
  assert.match(copied[1]!, /\n\n— S\+7 sur les noms · réglé en écoutant \(Oulipao\)$/);
  controller.keep();
  assert.equal(controller.state.notebook[0]!.mention, copied[1]!.slice(copied[1]!.indexOf('\n\n—')));
  controller.setInput(SAMPLE_TEXT);
  await controller.run();
  await controller.copy();
  assert.doesNotMatch(copied[2]!, /réglé en écoutant/);
});

test('withListening : en dernière partie, seule sans règle, rien sans écoute', async () => {
  const { withListening } = await import('../../../src/ui/tracks/view-model.ts');
  assert.equal(withListening('\n\n— S+7 sur les noms (Oulipao)', true), '\n\n— S+7 sur les noms · réglé en écoutant (Oulipao)');
  assert.equal(withListening('', true), '\n\n— réglé en écoutant (Oulipao)');
  assert.equal(withListening('\n\n— S+7 sur les noms (Oulipao)', false), '\n\n— S+7 sur les noms (Oulipao)');
  assert.equal(withListening('', true, true), '\n\n— réglé en écoutant · écouté en discrépance (Oulipao)');
  assert.equal(withListening('', false, true), '\n\n— écouté en discrépance (Oulipao)');
});

test('discrépance : en « original », le pas dit le mot d’origine pendant que la page montre le remplaçant ; une piste muette se tait', async () => {
  const { controller, speech, blanks } = await setup();
  controller.setSource('original');
  controller.play();
  for (let k = 0; k < 5; k++) await next(speech, blanks);
  const view = controller.state.view!;
  const original = view.stages[0]!.words[5]!.output;
  assert.notEqual(view.segments.find((segment) => segment.index === 5)!.text, original); // la page montre le nom remplacé
  assert.deepEqual(speech.said.at(-1)!.words, [original]);
  const muted = view.tracks[5]!;
  controller.dispatch({ type: 'toggle-mute', category: muted });
  const said = speech.said.length;
  const total = view.tracks.length;
  for (let k = 5; k < total + 5; k++) await next(speech, blanks); // un tour du texte : le pas 5 revient, muet
  assert.equal(controller.state.playhead, 5);
  assert.equal(speech.said.length, said + total - view.tracks.filter((track) => track === muted).length); // les pas de la piste muette se taisent
});

test('discrépance : un changement de source s’entend au pas suivant ; la source est gardée ; une source inconnue est refusée', async () => {
  const { controller, speech, blanks, saved } = await setup();
  controller.play();
  for (let k = 0; k < 4; k++) await next(speech, blanks);
  controller.setSource('original');
  await next(speech, blanks);
  assert.deepEqual(speech.said.at(-1)!.words, [controller.state.view!.stages[0]!.words[5]!.output]);
  assert.deepEqual(saved.at(-1), { tempo: 3, voice: undefined, source: 'original' });
  controller.setSource('envers' as never);
  assert.equal(controller.state.source, 'original');
});

test('mention : « écouté en discrépance » après une écoute sur l’original, après « réglé en écoutant » ; remise à zéro par une nouvelle mise en pistes', async () => {
  const { controller, copied } = await setup();
  controller.setSource('original');
  controller.play();
  controller.stop();
  await controller.copy();
  assert.match(copied[0]!, / · réglé en écoutant · écouté en discrépance \(Oulipao\)$/);
  controller.keep();
  assert.match(controller.state.notebook[0]!.mention, / · réglé en écoutant · écouté en discrépance \(Oulipao\)$/);
  await controller.run();
  await controller.copy();
  assert.doesNotMatch(copied.at(-1)!, /réglé en écoutant|écouté en discrépance/);
});

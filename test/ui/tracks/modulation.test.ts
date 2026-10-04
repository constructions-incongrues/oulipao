import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { GateSchema, ModulatorSchema, type Gate, type Modulator } from '../../../src/domain/modulation/schema.ts';
import { PHONETICS_LOADING } from '../../../src/domain/phonetics/lookup.ts';
import { lineationPlugin } from '../../../src/domain/lineation/plugin.ts';
import { homophonyPlugin } from '../../../src/domain/rhyme/homophony.ts';
import { rnPlugin } from '../../../src/domain/rhyme/rn.ts';
import { s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { lipogramPlugin } from '../../../src/domain/lipogram/plugin.ts';
import { App } from '../../../src/ui/tracks/app.ts';
import { Chain } from '../../../src/ui/tracks/components/chain.ts';
import { GateField } from '../../../src/ui/tracks/components/gate-field.ts';
import { Inspector } from '../../../src/ui/tracks/components/inspector.ts';
import { ModulatorField, parsePattern } from '../../../src/ui/tracks/components/modulator-field.ts';
import { createTracksController, type TracksDependencies } from '../../../src/ui/tracks/controller.ts';
import { initialState, pluginById, reduce } from '../../../src/ui/tracks/mixer-state.ts';
import { gateStatement, modulatedLabel, modulatorStatement, sourceName } from '../../../src/ui/tracks/modulation-statement.ts';
import { parseNotebook, serializeNotebook, type NotebookEntry } from '../../../src/ui/tracks/notebook.ts';
import { MixerStateSchema, type MixerAction, type MixerState } from '../../../src/ui/tracks/types.ts';
import { buildView, describeInstance, gridSteps, inspectorWindow, modulationText, readsSyllables, ruleMention, summarize } from '../../../src/ui/tracks/view-model.ts';
import { seededState } from '../../support/chain.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { rhymeMorphology, rhymePhonetics, tagRhymes } from '../../support/phonetics.ts';
import { elements, find } from '../../support/vnode.ts';

const mod = (source: unknown, extra: object = {}): Modulator => ModulatorSchema.parse({ source, ...extra });
const gate = (source: unknown, test: unknown, extra: object = {}): Gate => GateSchema.parse({ source, test, ...extra });
const letters = mod({ kind: 'letters' });
const after = (state: MixerState, ...actions: MixerAction[]) => MixerStateSchema.parse(actions.reduce(reduce, state));
const s7 = (state: MixerState) => state.instances.find((instance) => instance.id === 's7-1')!;

// L'état de la table

test('table : moduler un paramètre verrouillable, puis lui rendre sa valeur fixe', () => {
  const on = after(seededState, { type: 'set-modulator', id: 's7-1', key: 'offset', modulator: letters });
  assert.deepEqual(s7(on).modulators, { offset: letters });
  assert.deepEqual(s7(after(on, { type: 'clear-modulator', id: 's7-1', key: 'offset' })).modulators, {});
  assert.throws(() => after(seededState, { type: 'set-modulator', id: 's7-1', key: 'seed', modulator: letters }), /non modulable : seed/);
  assert.throws(() => after(seededState, { type: 'set-modulator', id: 'lipogram-1', key: 'letters', modulator: letters }), /non modulable/);
});

test('table : poser et ôter une porte ; une mise en page n’en a pas', () => {
  const even = gate({ kind: 'letters' }, { kind: 'even' });
  const on = after(seededState, { type: 'set-gate', id: 's7-1', gate: even });
  assert.deepEqual(s7(on).gate, even);
  assert.equal(s7(after(on, { type: 'clear-gate', id: 's7-1' })).gate, undefined);
  const lined = after(initialState, { type: 'add-instance', plugin: 'lineation' });
  assert.throws(() => after(lined, { type: 'set-gate', id: 'lineation-1', gate: even }), /pas de porte/);
});

test('table : un nouvel étiquetage garde les modulateurs et ôte les verrous ; le double les copie', () => {
  const state = after(
    seededState,
    { type: 'set-modulator', id: 's7-1', key: 'offset', modulator: letters },
    { type: 'set-gate', id: 's7-1', gate: gate({ kind: 'rank' }, { kind: 'odd' }) },
    { type: 'set-lock', id: 's7-1', index: 2, key: 'offset', value: 3 },
  );
  const reset = after(state, { type: 'reset-steps' });
  assert.deepEqual(s7(reset).locks, []);
  assert.deepEqual(s7(reset).modulators, { offset: letters });
  assert.ok(s7(reset).gate);
  const copy = after(state, { type: 'duplicate-instance', id: 's7-1' }).instances.at(-1)!;
  assert.deepEqual(copy.modulators, { offset: letters });
});

test('table : un modulateur illisible est oublié, l’instance reste avec sa valeur fixe', () => {
  const raw = structuredClone(seededState) as unknown as { instances: Record<string, unknown>[] };
  raw.instances[0]!['modulators'] = { offset: { source: { kind: 'lfo' } } };
  raw.instances[0]!['gate'] = { source: { kind: 'letters' }, test: { kind: 'euclid', k: 3, n: 8 } };
  const state = MixerStateSchema.parse(raw);
  assert.equal(state.instances.length, 2);
  assert.equal(state.instances[0]!.modulators, undefined);
  assert.equal(state.instances[0]!.gate, undefined);
  assert.equal(state.instances[0]!.params['offset'], 7);
});

test('carnet : une entrée avec un modulateur abîmé est lue ; un ancien carnet aussi', () => {
  const entry = (mixer: unknown): NotebookEntry =>
    ({ id: 'a', keptAt: '2026-10-04T20:00:00.000Z', result: 'r', mention: '', source: { text: 'La ferme.', tagged: tag('La ferme.') }, mixer }) as NotebookEntry;
  const damaged = structuredClone(seededState) as unknown as { instances: Record<string, unknown>[] };
  damaged.instances[0]!['modulators'] = { offset: { source: { kind: 'inconnue' } } };
  const read = parseNotebook(serializeNotebook([entry(damaged)]));
  assert.equal(read.rejected, 0);
  assert.equal(read.entries[0]!.mixer.instances[0]!.modulators, undefined);
  const kept = after(seededState, { type: 'set-modulator', id: 's7-1', key: 'offset', modulator: letters });
  assert.deepEqual(parseNotebook(serializeNotebook([entry(kept)])).entries[0]!.mixer, kept);
  assert.deepEqual(parseNotebook(serializeNotebook([entry(seededState)])).entries[0]!.mixer, seededState);
});

// La phrase

const ONE_PASS = { earlier: false, folded: false };

test('phrase : S+lettres, sur le mot ou sur son voisin, en arrivant ici, modulo', () => {
  assert.equal(modulatorStatement(s7Plugin, 'offset', letters, ['noun'], ONE_PASS), 'chaque nom avance d’autant de noms qu’il a de lettres');
  const neighbour = mod({ kind: 'letters' }, { read: { kind: 'neighbour', track: 'adjective', side: 'after' } });
  assert.equal(modulatorStatement(s7Plugin, 'offset', neighbour, ['noun'], ONE_PASS), 'chaque nom avance d’autant de noms que l’adjectif suivant a de lettres');
  const before = mod({ kind: 'syllables' }, { read: { kind: 'neighbour', track: 'noun', side: 'before' } });
  assert.equal(modulatorStatement(s7Plugin, 'offset', before, ['noun', 'adjective'], { earlier: true, folded: true }),
    'chaque mot avance d’autant de mots que le nom précédent a de syllabes en arrivant ici (modulo 99)');
});

test('phrase : base et profondeur, sources de position, autres paramètres', () => {
  assert.equal(modulatorStatement(s7Plugin, 'offset', mod({ kind: 'letters' }, { base: 7, depth: -1 }), ['noun'], ONE_PASS), 'décalage de chaque nom : 7 − son nombre de lettres');
  assert.equal(modulatorStatement(s7Plugin, 'offset', mod({ kind: 'vowels' }, { depth: 2 }), ['noun'], ONE_PASS), 'décalage de chaque nom : 0 + 2 × son nombre de voyelles');
  assert.equal(modulatorStatement(s7Plugin, 'offset', mod({ kind: 'rank' }), ['noun'], { earlier: true, folded: false }), 'décalage de chaque nom : son rang');
  assert.equal(modulatorStatement(s7Plugin, 'offset', mod({ kind: 'line' }), ['verb'], ONE_PASS), 'décalage de chaque verbe : le numéro de sa ligne');
  assert.equal(modulatorStatement(s7Plugin, 'offset', mod({ kind: 'pattern', values: [7, 0, 2] }), ['noun'], ONE_PASS), 'décalage de chaque nom : tour à tour 7, 0, 2');
  assert.equal(modulatorStatement(s7Plugin, 'offset', mod({ kind: 'ramp', from: 1, to: 9 }), ['noun'], ONE_PASS), 'décalage de chaque nom : de 1 au premier à 9 au dernier');
  assert.equal(modulatorStatement(homophonyPlugin, 'offset', mod({ kind: 'letter', letter: 'e' }, { read: { kind: 'neighbour', track: 'adverb', side: 'after' } }), ['noun'], { earlier: false, folded: true }),
    'rang de chaque nom : le nombre de « e » de l’adverbe suivant (modulo 9)');
  assert.equal(modulatorStatement(s7Plugin, 'inconnu', letters, ['noun'], ONE_PASS), 'inconnu de chaque nom : son nombre de lettres');
});

test('phrase : les portes', () => {
  assert.equal(gateStatement(gate({ kind: 'letters' }, { kind: 'even' }), ['noun'], ONE_PASS), 'seuls les noms d’un nombre pair de lettres sont traités');
  assert.equal(gateStatement(gate({ kind: 'syllables' }, { kind: 'odd' }), ['noun'], { earlier: true, folded: false }), 'seuls les noms d’un nombre impair de syllabes sont traités en arrivant ici');
  assert.equal(gateStatement(gate({ kind: 'letters' }, { kind: 'at-least', k: 5 }, { read: { kind: 'neighbour', track: 'adjective', side: 'after' } }), ['noun'], ONE_PASS),
    'seuls les noms dont l’adjectif suivant a au moins 5 lettres sont traités');
  assert.equal(gateStatement(gate({ kind: 'vowels' }, { kind: 'at-most', k: 2 }), ['noun', 'verb'], ONE_PASS), 'seuls les mots d’au plus 2 voyelles sont traités');
  assert.equal(gateStatement(gate({ kind: 'rank' }, { kind: 'euclid', k: 3, n: 8 }), ['noun'], ONE_PASS), 'seuls les noms aux frappes d’Euclide 3 sur 8 sont traités');
  assert.equal(gateStatement(gate({ kind: 'rank' }, { kind: 'even' }), ['noun'], ONE_PASS), 'seuls les noms dont le rang est pair sont traités');
  assert.equal(gateStatement(gate({ kind: 'line' }, { kind: 'odd' }), ['noun'], ONE_PASS), 'seuls les noms dont la ligne est impaire sont traités');
  assert.equal(gateStatement(gate({ kind: 'pattern', values: [1, 0] }, { kind: 'at-least', k: 1 }), ['noun'], ONE_PASS), 'seuls les noms dont la valeur (tour à tour 1, 0) vaut au moins 1 sont traités');
  assert.equal(gateStatement(gate({ kind: 'ramp', from: 0, to: 4 }, { kind: 'at-most', k: 2 }), ['noun'], ONE_PASS), 'seuls les noms dont la valeur (de 0 au premier à 4 au dernier) vaut au plus 2 sont traités');
});

test('libellé : S+lettres, R+rang avec sa rime, homophonies au rang modulé ; sans modulateur, celui du type', () => {
  assert.equal(modulatedLabel(s7Plugin, s7Plugin.defaults, { offset: letters }), 'S+lettres');
  assert.equal(modulatedLabel(s7Plugin, { ...s7Plugin.defaults, mode: 'same-gender' }, { offset: letters }), 'S+lettres, parmi les noms du même genre');
  assert.equal(modulatedLabel(rnPlugin, rnPlugin.defaults, { offset: mod({ kind: 'rank' }) }), 'R+rang, rime suffisante');
  assert.equal(modulatedLabel(homophonyPlugin, { offset: 3 }, { offset: mod({ kind: 'letter', letter: 'a' }) }), 'homophonies, rang : « a »');
  // La Mise en vers modulée ne garde pas la mesure fixe dans son libellé.
  assert.equal(modulatedLabel(lineationPlugin, { cut: 'syllables', syllables: 8 }, { syllables: mod({ kind: 'rank' }) }), 'mise en vers en syllabes : rang');
  assert.equal(modulatedLabel(s7Plugin, s7Plugin.defaults), 'S+7');
  assert.equal(modulatedLabel(lipogramPlugin, lipogramPlugin.defaults, { offset: letters }), lipogramPlugin.label(lipogramPlugin.defaults));
  assert.deepEqual(['letters', 'syllables', 'vowels', 'rank', 'line', 'pattern', 'ramp'].map((kind) => sourceName(mod(kind === 'pattern' ? { kind, values: [1] } : kind === 'ramp' ? { kind, from: 1, to: 2 } : { kind }).source)),
    ['lettres', 'syllabes', 'voyelles', 'rang', 'ligne', 'motif', 'rampe']);
});

// La vue

const text = 'La vieille ferme du village est grise.';
const session = { text, tagged: tag(text) };
const modulated = after(seededState, { type: 'set-modulator', id: 's7-1', key: 'offset', modulator: letters });

test('vue : la bande d’un S+lettres, ses valeurs sous les mots, la mention', () => {
  const view = buildView(session, modulated, morphology());
  assert.equal(view.stages[1]!.label, 'S+lettres sur les noms (chaque nom avance d’autant de noms qu’il a de lettres)');
  assert.deepEqual(view.stages[1]!.modulation!.get(2), { values: { offset: 5 } });
  const window = inspectorWindow(view, 2, 0, 4, (id) => (id === 's7-1' ? s7Plugin : undefined));
  assert.deepEqual(window.bands[1]!.cells.map((cell) => cell.modulation), [undefined, undefined, '+5', undefined, '+7']);
  assert.deepEqual(inspectorWindow(view, 2, 2, 2).bands[1]!.cells[0]!.modulation, '5');
  assert.equal(ruleMention(modulated, view.audible, undefined, view.folded), '\n\n— S+lettres sur les noms (chaque nom avance d’autant de noms qu’il a de lettres) (Oulipao)');
  const steps = gridSteps(modulated, view.tracks, session.tagged.map((word) => word.word), undefined, view.stages);
  assert.deepEqual(steps[2]!.modulated, ['+5']);
  assert.equal(steps[0]!.modulated, undefined);
  assert.deepEqual(view.folded, {});
});

test('vue : un S+0 modulé agit ; deux instances disent « en arrivant ici » ; le repli est mentionné', () => {
  const zero = after(modulated, { type: 'set-param', id: 's7-1', key: 'offset', value: 0 });
  assert.notEqual(buildView(session, zero, morphology()).result, text);
  const two = after(modulated, { type: 'duplicate-instance', id: 's7-1' });
  const view = buildView(session, two, morphology());
  assert.match(view.stages[2]!.label, /qu’il a de lettres en arrivant ici\)$/);
  assert.match(summarize(two, view), /lettres\) : .* lettres en arrivant ici\) : /);
  assert.match(summarize(zero, buildView(session, zero, morphology())), /^S\+lettres sur les noms \(chaque nom/);
  assert.match(ruleMention(two, view.audible, undefined, { 's7-2': ['offset'] }), /en arrivant ici \(modulo 99\)\) \(Oulipao\)$/);
  assert.equal(describeInstance(s7(modulated)), 'S+lettres sur les noms (chaque nom avance d’autant de noms qu’il a de lettres)');
});

test('vue : la porte, ce qui manque, les syllabes', () => {
  assert.equal(modulationText({ values: {}, gate: 'closed' }, s7Plugin), 'porte fermée');
  assert.equal(modulationText({ values: { offset: -2 }, note: 'no-neighbour' }, s7Plugin), '−2 · pas de voisin');
  assert.equal(modulationText({ values: {}, note: 'loading' }, undefined), PHONETICS_LOADING);
  assert.equal(modulationText({ values: {} }, s7Plugin), undefined);
  assert.equal(modulationText(undefined, s7Plugin), undefined);
  const gated = after(seededState, { type: 'set-gate', id: 's7-1', gate: gate({ kind: 'letters' }, { kind: 'even' }) });
  const view = buildView(session, gated, morphology());
  assert.equal(view.stages[1]!.modulation!.get(2)!.gate, 'closed');
  assert.match(view.stages[1]!.label, /\(seuls les noms d’un nombre pair de lettres sont traités\)$/);
  assert.equal(readsSyllables(s7(gated)), false);
  assert.equal(readsSyllables(s7(after(seededState, { type: 'set-modulator', id: 's7-1', key: 'offset', modulator: mod({ kind: 'syllables' }) }))), true);
  assert.equal(readsSyllables(s7(after(seededState, { type: 'set-gate', id: 's7-1', gate: gate({ kind: 'syllables' }, { kind: 'odd' }) }))), true);
});

test('contrôleur : une source qui lit les syllabes fait charger les prononciations', async () => {
  let asked = 0;
  const dependencies: TracksDependencies = {
    tagger: { name: 'factice', tag: (input) => tagRhymes(input) },
    loadMorphology: async () => rhymeMorphology(),
    loadPhonetics: async () => (asked++, rhymePhonetics()),
    preload: async () => {},
    copy: async () => {},
  };
  const controller = createTracksController(dependencies);
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.setInput('sur la chaise');
  await controller.run();
  assert.equal(asked, 0);
  controller.dispatch({ type: 'set-modulator', id: 's7-1', key: 'offset', modulator: mod({ kind: 'syllables' }) });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(asked, 1);
  assert.deepEqual(controller.state.view!.stages[1]!.modulation!.get(2), { values: { offset: 1 } });
});

// Les composants

/** Un faux champ : sa valeur, et le message de refus qu'on lui donne. */
function field(value: string) {
  const target = { value, message: '', setCustomValidity: (message: string) => (target.message = message), reportValidity: () => true };
  return { event: { currentTarget: target } as unknown as Event, target };
}
const fire = (node: unknown, predicate: Parameters<typeof find>[1], handler: string, value: string) => {
  const { event, target } = field(value);
  (find(node as never, predicate).props[handler] as (event: Event) => void)(event);
  return target;
};
const label = (text: string) => (element: { props: Record<string, unknown> }) => element.props['aria-label'] === text;

test('ModulatorField : fixe par défaut ; choisir une source la branche avec ses réglages repliés', () => {
  const got: unknown[] = [];
  const fixed = html`<${ModulatorField} label="Décalage" onModulator=${(value: unknown) => got.push(value)} />`;
  assert.doesNotMatch(renderToString(fixed), /Réglages/);
  fire(fixed, label('Source : Décalage'), 'onChange', 'letters');
  fire(fixed, label('Source : Décalage'), 'onChange', 'fixed');
  assert.deepEqual([...got], [{ read: { kind: 'self' }, base: 0, depth: 1, source: { kind: 'letters' } }, undefined]);
  const on = html`<${ModulatorField} label="Décalage" modulator=${mod({ kind: 'letters' }, { read: { kind: 'neighbour', track: 'adjective', side: 'after' } })} onModulator=${(value: unknown) => got.push(value)} />`;
  const out = renderToString(on);
  assert.match(out, /<details class="mod-settings"><summary class="silk">Réglages<\/summary>/);
  fire(on, label('Source : Décalage'), 'onChange', 'rank');
  assert.deepEqual((got.at(-1) as Modulator).read, { kind: 'self' });
});

test('ModulatorField : base, profondeur, voisin, et une saisie refusée près du champ', () => {
  const got: Modulator[] = [];
  const on = html`<${ModulatorField} label="Décalage" modulator=${letters} onModulator=${(value: Modulator) => got.push(value)} />`;
  fire(on, label('Base : Décalage'), 'onChange', '7');
  fire(on, label('Profondeur : Décalage'), 'onChange', '-1');
  const refused = fire(on, label('Base : Décalage'), 'onChange', '1.5');
  assert.equal(refused.message, 'Un entier entre −999 et 999.');
  assert.equal(refused.value, '0');
  fire(on, label('Mot lu'), 'onChange', 'after');
  assert.deepEqual(got.map((value) => [value.base, value.depth, value.read.kind]), [[7, 1, 'self'], [0, -1, 'self'], [0, 1, 'neighbour']]);
  const neighbour = mod({ kind: 'letters' }, { read: { kind: 'neighbour', track: 'adjective', side: 'after' } });
  const next = html`<${ModulatorField} label="Décalage" modulator=${neighbour} onModulator=${(value: Modulator) => got.push(value)} />`;
  fire(next, label('Piste du voisin'), 'onChange', 'verb');
  fire(next, label('Mot lu'), 'onChange', 'self');
  assert.deepEqual(got.slice(-2).map((value) => value.read), [{ kind: 'neighbour', track: 'verb', side: 'after' }, { kind: 'self' }]);
});

test('ModulatorField : la lettre, le motif et la rampe se règlent ; « 7, x » est refusé', () => {
  const got: Modulator[] = [];
  const onModulator = (value: Modulator) => got.push(value);
  const letter = html`<${ModulatorField} label="Décalage" modulator=${mod({ kind: 'letter', letter: 'e' })} onModulator=${onModulator} />`;
  fire(letter, label('Lettre comptée'), 'onChange', 'a');
  assert.equal(fire(letter, label('Lettre comptée'), 'onChange', '1').message, 'Une seule lettre.');
  const pattern = html`<${ModulatorField} label="Décalage" modulator=${mod({ kind: 'pattern', values: [7, 0] })} onModulator=${onModulator} />`;
  fire(pattern, label('Motif'), 'onChange', '1; 2 3');
  const refused = fire(pattern, label('Motif'), 'onChange', '7, x');
  assert.match(refused.message, /Des entiers/);
  assert.equal(refused.value, '7, 0');
  const ramp = html`<${ModulatorField} label="Décalage" modulator=${mod({ kind: 'ramp', from: 1, to: 9 })} onModulator=${onModulator} />`;
  fire(ramp, label('Début de la rampe'), 'onChange', '2');
  fire(ramp, label('Fin de la rampe'), 'onChange', '5');
  assert.deepEqual(got.map((value) => value.source), [
    { kind: 'letter', letter: 'a' },
    { kind: 'pattern', values: [1, 2, 3] },
    { kind: 'ramp', from: 2, to: 9 },
    { kind: 'ramp', from: 1, to: 5 },
  ]);
  assert.equal(parsePattern(''), undefined);
  assert.equal(parsePattern('1, 2000'), undefined);
});

test('GateField : repliée sans porte ; une source la pose ; le test, k et l’Euclide se règlent', () => {
  const got: unknown[] = [];
  const none = html`<${GateField} onGate=${(value: unknown) => got.push(value)} />`;
  assert.match(renderToString(none), /<summary class="silk">Porte : tous les mots<\/summary>/);
  fire(none, label('Source : porte'), 'onChange', 'letters');
  assert.deepEqual(got.pop(), { read: { kind: 'self' }, test: { kind: 'even' }, source: { kind: 'letters' } });
  const atLeast = gate({ kind: 'letters' }, { kind: 'at-least', k: 5 }, { read: { kind: 'neighbour', track: 'adjective', side: 'after' } });
  const on = html`<${GateField} gate=${atLeast} onGate=${(value: unknown) => got.push(value)} />`;
  assert.match(renderToString(on), /<details open class="gate">|<details class="gate" open/);
  assert.equal(elements(on).filter((element) => element.type === 'option' && element.props['value'] === 4).length, 0); // pas d'Euclide hors du rang
  fire(on, label('k'), 'onChange', '3');
  assert.equal(fire(on, label('k'), 'onChange', '99').message, 'Un entier entre 0 et 64.');
  fire(on, label('Test de la porte'), 'onChange', '1');
  fire(on, label('Source : porte'), 'onChange', 'rank');
  fire(on, label('Mot lu'), 'onChange', 'self');
  fire(on, label('Source : porte'), 'onChange', 'fixed');
  assert.deepEqual([...got], [
    { ...atLeast, test: { kind: 'at-least', k: 3 } },
    { ...atLeast, test: { kind: 'odd' } },
    { ...atLeast, source: { kind: 'rank' }, read: { kind: 'self' } },
    { ...atLeast, read: { kind: 'self' } },
    undefined,
  ]);
  const euclid = gate({ kind: 'rank' }, { kind: 'euclid', k: 3, n: 8 });
  const rhythm = html`<${GateField} gate=${euclid} onGate=${(value: unknown) => got.push(value)} />`;
  fire(rhythm, label('Frappes k'), 'onChange', '5');
  fire(rhythm, label('Pas n'), 'onChange', '16');
  fire(rhythm, label('Source : porte'), 'onChange', 'letters');
  assert.deepEqual(got.slice(-3), [
    { ...euclid, test: { kind: 'euclid', k: 5, n: 8 } },
    { ...euclid, test: { kind: 'euclid', k: 3, n: 16 } },
    { ...euclid, source: { kind: 'letters' }, test: { kind: 'even' } },
  ]);
});

test('Chain : la ligne d’un S+lettres porte son nom ; brancher, défaire, poser et ôter une porte passent par la table', () => {
  const actions: MixerAction[] = [];
  const state = after(modulated, { type: 'set-gate', id: 's7-1', gate: gate({ kind: 'letters' }, { kind: 'even' }) });
  const chain = html`<${Chain} instances=${state.instances} plugins=${[]} lookup=${pluginById} dispatch=${(action: MixerAction) => actions.push(action)} />`;
  const out = renderToString(chain);
  assert.match(out, /<span class="name">S\+lettres<\/span>/);
  assert.match(out, /<label class="silk fixed-modulated" title="Modulé : cette valeur ne sert qu’aux mots sans valeur modulée">Décalage<input/);
  assert.match(out, /<label class="silk">Parmi<select/);
  assert.match(out, /<p class="help">Chaque nom avance d’autant de noms qu’il a de lettres ; seuls les noms d’un nombre pair de lettres sont traités\.<\/p>/);
  fire(chain, label('Source : Décalage'), 'onChange', 'rank');
  fire(chain, label('Source : Décalage'), 'onChange', 'fixed');
  fire(chain, label('Source : porte'), 'onChange', 'rank');
  fire(chain, label('Source : porte'), 'onChange', 'fixed');
  assert.throws(() => fire(chain, label('Frappes k'), 'onChange', '1'), /introuvable/); // la porte est sur les lettres : pas d'Euclide
  assert.deepEqual(actions.map((action) => action.type), ['set-modulator', 'clear-modulator', 'set-gate', 'clear-gate']);
});

test('Inspector : la valeur modulée sous le mot', () => {
  const window = { columns: [{ index: 0, distance: 0 }], bands: [{ id: 's7-1', label: 'S+lettres', cells: [{ text: 'chat', newline: false, modulation: '+4' }] }] };
  assert.match(renderToString(html`<${Inspector} window=${window} word="chat" onClose=${() => {}} />`), /chat<span class="mod" title="Valeur donnée par le modulateur">\+4<\/span>/);
});

test('App : sous les pistes, le rappel nomme l’instance modulée « S+lettres »', async () => {
  const controller = createTracksController({ tagger: { name: 'factice', tag: (input) => tagRhymes(input) }, loadMorphology: async () => rhymeMorphology(), preload: async () => {}, copy: async () => {} });
  controller.dispatch({ type: 'add-instance', plugin: 's7' });
  controller.dispatch({ type: 'set-modulator', id: 's7-1', key: 'offset', modulator: letters });
  controller.setInput('sur la chaise');
  await controller.run();
  assert.match(renderToString(html`<${App} state=${controller.state} controller=${controller} version="0" />`), /<p class="reminder">1\. S\+lettres<\/p>/);
});

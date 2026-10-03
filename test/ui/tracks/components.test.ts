import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { CATEGORIES } from '../../../src/domain/categories.ts';
import type { ModelState } from '../../../src/ui/tracks/controller.ts';
import { Control } from '../../../src/ui/tracks/components/control.ts';
import { lipogramPlugin } from '../../../src/domain/lipogram/plugin.ts';
import { StepGrid, type StepGridProps } from '../../../src/ui/tracks/components/step-grid.ts';
import { Chain, dropPosition } from '../../../src/ui/tracks/components/chain.ts';
import type { MixerAction } from '../../../src/ui/tracks/types.ts';
import { sansPlugin } from '../../support/plugins.ts';
import { definePlugin } from '../../../src/domain/plugin.ts';
import { s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { edgePlugin } from '../../../src/domain/edge/plugin.ts';
import { Browser } from '../../../src/ui/tracks/components/browser.ts';
import { recipes } from '../../../src/ui/tracks/mixer-state.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { Inspector } from '../../../src/ui/tracks/components/inspector.ts';
import { Source, type SourceProps } from '../../../src/ui/tracks/components/source.ts';
import type { Parameter } from '../../../src/domain/plugin.ts';
import type { GridStep, Mark } from '../../../src/ui/tracks/view-model.ts';
import { tag } from '../../support/morphology.ts';
import { byClass, byLabel, elements, find, inputEvent } from '../../support/vnode.ts';

/** Des cases d'inspecteur sans saut de ligne. */
const cells = (...texts: string[]) => texts.map((text) => ({ text, newline: false }));

const click = (node: unknown, predicate: Parameters<typeof find>[1]) => (find(node as never, predicate).props['onClick'] as () => void)();

test('Control : un champ entier borné ou une liste, d’après la déclaration du plugin', () => {
  const calls: unknown[] = [];
  const onParam = (key: string, value: unknown) => calls.push(`${key}=${value}`);
  const [offset, mode] = s7Plugin.parameters as [Parameter, Parameter];
  const integer = html`<${Control} parameter=${offset} value=${7} onParam=${onParam} />`;
  assert.match(renderToString(integer), /<input type="number" step="1" min="-99" max="99" value="7"/);
  const input = find(integer, (e) => e.type === 'input').props['onInput'] as (event: Event) => void;
  for (const value of ['3', '2.5', '', '100', '-100', '-99']) input(inputEvent(value)); // hors bornes, vide ou à virgule : ignoré
  const choice = html`<${Control} parameter=${mode} value="reagree" onParam=${onParam} />`;
  assert.match(renderToString(choice), /<select><option value="reagree" selected>tous les noms<\/option><option value="same-gender">les noms du même genre<\/option>/);
  (find(choice, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('same-gender'));
  assert.deepEqual(calls, ['offset=3', 'offset=-99', 'mode=same-gender']);
  // sans gestionnaire : les gestes sont sans effet, sans erreur
  (find(html`<${Control} parameter=${offset} value=${7} />`, (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('4'));
  (find(html`<${Control} parameter=${mode} value="reagree" />`, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('reagree'));
});

test('Control : un paramètre texte devient un champ de saisie, réglé à chaque frappe', () => {
  const calls: unknown[] = [];
  const [letters] = lipogramPlugin.parameters as [Parameter];
  const field = html`<${Control} parameter=${letters} value="e" onParam=${(key: string, value: unknown) => calls.push(`${key}=${value}`)} />`;
  assert.match(renderToString(field), /<input type="text" class="param-text" maxlength="40" placeholder="e" spellcheck="false" value="e"/);
  const input = find(field, (e) => e.type === 'input').props['onInput'] as (event: Event) => void;
  for (const value of ['Lu', 'Lucie', '']) input(inputEvent(value));
  assert.deepEqual(calls, ['letters=Lu', 'letters=Lucie', 'letters=']);
  (find(html`<${Control} parameter=${letters} value="e" />`, (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('a'));
  // dans sa tranche, le champ porte le libellé du paramètre
  assert.match(renderToString(html`<label class="silk">${letters.label}<${Control} parameter=${letters} value="e" /></label>`), /<label class="silk">Lettres<input type="text"/);
});

const gridProps = (overrides: Partial<StepGridProps> = {}) => {
  const calls: string[] = [];
  const steps: GridStep[] = [
    { index: 0, word: 'Le', track: 'other', state: 'outline', locks: [] },
    { index: 1, word: 'matin', track: 'noun', state: 'punched', locks: [{ id: 's7-1', key: 'offset', value: 3 }] },
    { index: 2, word: 'horloge', track: 'noun', state: 'closed', locks: [] },
    { index: 3, word: 'sonne', track: 'verb', state: 'outline', locks: [] },
    { index: 4, word: 'vite', track: 'adverb', state: 'outline', locks: [] },
  ];
  const props: StepGridProps = {
    steps,
    tracks: Object.fromEntries(CATEGORIES.map((c) => [c, { muted: c === 'verb', solo: false }])) as StepGridProps['tracks'],
    audible: new Set(CATEGORIES.filter((c) => c !== 'verb')),
    reminders: { noun: ['1. S+7'], verb: [], adjective: [], adverb: [], other: [] },
    perPage: 4,
    page: 0,
    selected: 1,
    generation: 2,
    onToggleStep: (index) => calls.push(`step ${index}`),
    onInspect: (index) => calls.push(`inspect ${index}`),
    onMute: (category) => calls.push(`mute ${category}`),
    onSolo: (category) => calls.push(`solo ${category}`),
    onPage: (page) => calls.push(`page ${page}`),
    ...overrides,
  };
  return { props, calls };
};

test('StepGrid : une colonne par mot, temps forts, un pas par mot sur la ligne de sa piste, poinçons et verrous', () => {
  const { props, calls } = gridProps();
  const grid = html`<${StepGrid} ...${props} />`;
  const out = renderToString(grid);
  // en-tête : numéros, temps fort au pas 1, mot choisi enfoncé
  assert.match(out, /class="hd beat" aria-pressed="false" aria-label="Inspecter « Le », pas 1"/);
  assert.match(out, /class="hd" aria-pressed="true" aria-label="Inspecter « matin », pas 2"><span class="num mono">2<\/span><span class="w">matin<\/span>/);
  // tranches : poinçon, nom, compte, Muet, Seul, rappel ; piste muette éteinte
  assert.match(out, /<section class="ch noun" aria-label="Piste Noms"><svg class="shape noun"/);
  assert.match(out, /<h3 class="name">Noms<span class="count mono">2<\/span><\/h3>/);
  assert.match(out, /<p class="reminder">1\. S\+7<\/p>/);
  assert.match(out, /class="ch verb off"/);
  assert.match(out, /aria-pressed="true" aria-label="Muet : retirer la piste Verbes du texte"/);
  // pas : percé, bouché, contour ; nom accessible avec l'état et le verrou
  assert.match(out, /class="cell step punched sel" aria-pressed="true" aria-label="Noms, matin : percé, la contrainte agit, verrou 3"><svg[^>]*><use href="#shape-noun" fill="currentColor"/);
  assert.match(out, /<span class="lock mono" aria-hidden="true">3<\/span>/);
  assert.match(out, /class="cell step closed" aria-pressed="false" aria-label="Noms, horloge : bouché, laissé tel quel"><svg[^>]*><use href="#shape-noun" fill="none"/);
  assert.match(out, /aria-label="Verbes, sonne : aucune contrainte sur cette piste"/);
  // quatre pas par page : « vite » (pas 5) n'est pas sur la première
  assert.doesNotMatch(out, /vite/);
  assert.equal(elements(grid).filter(byClass('step')).length, 4);
  // tête de lecture à chaque changement
  assert.match(out, /<div class="head" aria-hidden="true"><\/div>/);
  // pages : une touche par page
  assert.match(out, /<button type="button" class="key mono page" aria-pressed="true">1–4<\/button><button type="button" class="key mono page" aria-pressed="false">5–5<\/button>/);
  click(grid, byLabel('Noms, horloge : bouché, laissé tel quel'));
  click(grid, byLabel('Inspecter « Le », pas 1'));
  click(grid, byLabel('Muet : retirer la piste Noms du texte'));
  click(grid, byLabel('Seul : ne garder que la piste Adverbes'));
  click(grid, (e) => byClass('page')(e) && e.props['aria-pressed'] === false);
  assert.deepEqual(calls, ['step 2', 'inspect 0', 'mute noun', 'solo adverb', 'page 1']);
});

test('StepGrid : au-delà de six pages, des flèches ; dernière page incomplète ; pas de tête de lecture avant le premier changement', () => {
  const many = Array.from({ length: 30 }, (_, index) => ({ index, word: `m${index}`, track: 'noun' as const, state: 'punched' as const, locks: [] }));
  const { props, calls } = gridProps({ steps: many, page: 7, selected: undefined, generation: 0 });
  const grid = html`<${StepGrid} ...${props} />`;
  const out = renderToString(grid);
  assert.match(out, /aria-label="Page précédente">‹<\/button><span class="pos mono" aria-live="polite">29–30 \/ 30<\/span><button type="button" class="key next" aria-label="Page suivante" disabled>/);
  assert.equal(elements(grid).filter(byClass('step')).length, 2);
  assert.doesNotMatch(out, /class="head"/);
  click(grid, byLabel('Page précédente'));
  const first = gridProps({ steps: many, page: 0 });
  click(html`<${StepGrid} ...${first.props} />`, byLabel('Page suivante'));
  assert.deepEqual([...calls, ...first.calls], ['page 6', 'page 1']);
  assert.match(renderToString(html`<${StepGrid} ...${first.props} />`), /aria-label="Page précédente" disabled/);
});

test('Inspector : une ligne par étape, la colonne choisie, les colonnes lointaines ; Fermer', () => {
  const calls: string[] = [];
  const window = {
    columns: [0, 1, 2, 3, 4].map((index) => ({ index, distance: Math.abs(index - 3) })),
    bands: [
      { id: 'origin', label: 'Origine', cells: cells('dans', 'la', 'cuisine', 'étroite', 'comme') },
      { id: 's7-1', label: 'S+7 sur les noms', cells: cells('dans', 'la', 'cuistrerie', 'étroite', '·') },
      { id: 'lineation-1', label: 'Mise en vers', cells: [...cells('dans', 'la', 'cuistrerie'), { text: 'étroite', newline: true }, ...cells('·')] },
    ],
  };
  const inspector = html`<${Inspector} window=${window} word="étroite" onStep=${(d: number) => calls.push(`step ${d}`)} onClose=${() => calls.push('close')} />`;
  const out = renderToString(inspector);
  assert.match(out, /<section class="inspector" tabindex="0" aria-label="Inspecteur">/);
  assert.match(out, /<caption>« étroite » à chaque étape de la chaîne<\/caption>/);
  assert.match(out, /<tr><th scope="row">Origine<\/th><td class="far">dans<\/td><td>la<\/td><td>cuisine<\/td><td class="chosen" aria-current="true">étroite<\/td><td>comme<\/td><\/tr>/);
  assert.match(out, /<th scope="row">S\+7 sur les noms<\/th>.*<td>cuistrerie<\/td>.*<td>·<\/td><\/tr>/s);
  // Un mot mis à la ligne par l'étape : « ↵ » devant lui, dit « à la ligne » au lecteur d'écran.
  assert.match(out, /<th scope="row">Mise en vers<\/th>.*<td class="chosen" aria-current="true"><span class="newline" aria-hidden="true">↵ <\/span><span class="sr-only">à la ligne, <\/span>étroite<\/td>/s);
  // Les flèches et Échap passent par le contrôleur, où que soit le focus ; ici, la touche Fermer.
  click(inspector, byClass('close'));
  assert.deepEqual(calls, ['close']);
});

test('Inspector : état du pas, champ de verrou dans la bande de l’instance, verrou refusé hors bornes', () => {
  const locks: unknown[] = [];
  const window = {
    columns: [{ index: 0, distance: 0 }],
    bands: [
      { id: 'origin', label: 'Origine', cells: cells('chat') },
      { id: 's7-1', label: 'S+7 sur les noms', cells: cells('chaton') },
    ],
  };
  const entries = [{ id: 's7-1', fields: [{ key: 'offset', label: 'Décalage', min: -99, max: 99, value: 3 }], note: 'S+3 sur ce mot' }];
  const inspector = html`<${Inspector} window=${window} word="chat" step="punched" locks=${entries}
    onLock=${(id: string, key: string, value: unknown) => locks.push([id, key, value])} onStep=${() => {}} onClose=${() => {}} />`;
  const out = renderToString(inspector);
  assert.match(out, /<caption>« chat » à chaque étape de la chaîne · <span class="step-state">pas percé<\/span><\/caption>/);
  assert.match(out, /<th scope="row">S\+7 sur les noms<label class="silk lock-field">Décalage<input type="number" step="1" min="-99" max="99" value="3" placeholder="—" aria-label="Verrou Décalage pour ce mot"\/><\/label><span class="lock-note">S\+3 sur ce mot<\/span><\/th>/);
  assert.doesNotMatch(out.slice(0, out.indexOf('S+7 sur les noms')), /lock-field/); // pas de champ sur la bande d'origine
  const change = find(inspector, (e) => e.type === 'input').props['onChange'] as (event: Event) => void;
  const field = (value: string) => {
    const input = { value, validity: '', reported: false, setCustomValidity(message: string) { this.validity = message; }, reportValidity() { this.reported = true; } };
    change({ currentTarget: input } as unknown as Event);
    return input;
  };
  assert.equal(field('2').validity, '');
  field(' ');
  const refused = field('120');
  assert.deepEqual([refused.validity, refused.reported, refused.value], ['Un entier entre -99 et 99.', true, '3']);
  assert.deepEqual(locks, [['s7-1', 'offset', 2], ['s7-1', 'offset', undefined]]);
  // Champ vide sans verrou ; le refus remet le champ à vide ; sans gestionnaire, rien ne casse.
  const empty = html`<${Inspector} window=${window} word="chat" step="closed" locks=${[{ id: 's7-1', fields: [{ key: 'offset', label: 'Décalage', min: -99, max: 99 }] }]} onStep=${() => {}} onClose=${() => {}} />`;
  assert.match(renderToString(empty), /pas bouché : aucune contrainte ne le touche.*value placeholder="—"/s);
  const bare = { value: '500', setCustomValidity() {}, reportValidity() {} };
  (find(empty, (e) => e.type === 'input').props['onChange'] as (event: Event) => void)({ currentTarget: bare } as unknown as Event);
  assert.equal(bare.value, '');
  (find(empty, (e) => e.type === 'input').props['onChange'] as (event: Event) => void)({ currentTarget: { value: '4', setCustomValidity() {} } } as unknown as Event);
});

test('Result : mots remplacés soulignés à la couleur de leur piste, mots cliquables, éclat, pistes coupées, copie', () => {
  let copies = 0;
  const selected: number[] = [];
  const props = {
    segments: [{ text: 'Le', index: 0 }, { text: ' ' }, { text: 'fermoir', index: 1 }, { text: ',\nvieux.' }],
    empty: false,
    marks: new Map<number, Mark>([[1, { state: 'replaced', original: 'ferme' }]]),
    tracks: ['other', 'noun'] as const,
    selected: 0,
    onSelect: (index: number) => void selected.push(index),
    changed: new Set([0, 1]),
    generation: 3,
    audibleCount: 5,
    stale: false,
    copyMessage: '',
    onCopy: () => copies++,
  };
  const result = html`<${Result} ...${props} />`;
  const out = renderToString(result);
  assert.match(out, /<p class="result-text"><span class="word changed selected">Le<\/span> <span class="word replaced noun changed" tabindex="0" title="Noms : ferme → fermoir">fermoir<\/span>,\nvieux\.<\/p>/);
  // un clic sur n'importe quel mot, ou Entrée sur un mot changé, ouvre l'inspecteur
  click(result, (e) => e.props['class'] === 'word changed selected');
  const fermoir = find(result, byClass('replaced'));
  (fermoir.props['onKeyDown'] as (event: KeyboardEvent) => void)({ key: 'Enter' } as KeyboardEvent);
  (fermoir.props['onKeyDown'] as (event: KeyboardEvent) => void)({ key: 'a' } as KeyboardEvent);
  assert.deepEqual(selected, [0, 1]);
  const kept = renderToString(html`<${Result} ...${{ ...props, marks: new Map<number, Mark>([[1, { state: 'kept', original: 'fermoir', reason: 'absent du dictionnaire' }]]) }} />`);
  assert.match(kept, /<span class="word changed" title="Noms : laissé tel quel, absent du dictionnaire">fermoir</);
  assert.doesNotMatch(out, /class="notice"/);
  click(result, byClass('copy'));
  assert.equal(copies, 1);
  assert.equal(find(result, byLabel('Texte résultant')).type, 'section');

  const calm = renderToString(html`<${Result} ...${{ ...props, changed: new Set(), marks: new Map(), audibleCount: 4, copyMessage: 'Copié.' }} />`);
  assert.match(calm, /<p class="result-text"><span class="word selected">Le<\/span> <span class="word">fermoir<\/span>,\nvieux\.<\/p>/);
  assert.match(calm, /Pistes coupées : le texte est rendu tel quel, sans réparer la phrase\./);
  assert.match(calm, /<span class="copy-message" role="status" aria-live="polite">Copié\.<\/span>/);
  const empty = renderToString(html`<${Result} ...${{ ...props, segments: [{ text: '.' }], empty: true, audibleCount: 1 }} />`);
  assert.match(empty, /<button type="button" class="key copy" disabled>Copier<\/button>/);
  assert.match(empty, /Toutes les pistes sont coupées\./);
  assert.match(renderToString(html`<${Result} ...${{ ...props, stale: true }} />`), /class="result stale".*class="key copy" disabled/s);
  // collée en haut de l'écran : compacte
  assert.match(renderToString(html`<${Result} ...${{ ...props, pinned: true }} />`), /<section class="result stuck" aria-label="Texte résultant">.*<div class="result-scroll"><p class="result-text">/s);
  assert.throws(() => find(result, byClass('absent')), /introuvable/);
});

test('Source : définition et exemple au premier contact, avancement du modèle, saisie repliée', () => {
  const calls: string[] = [];
  const model = (patch: Partial<ModelState>): ModelState => ({ status: 'ready', loaded: 0, total: 0, error: '', ...patch });
  const props: SourceProps = {
    input: '', words: 0, editing: true, started: false, tagging: false, message: '', model: model({ status: 'loading', loaded: 42e6, total: 111e6 }),
    onInput: (text) => calls.push(`input:${text}`), onEdit: () => calls.push('edit'), onRun: () => calls.push('run'),
    onExample: () => calls.push('example'), onLoad: () => calls.push('load'),
  };
  const render = (patch: Partial<SourceProps>) => renderToString(html`<${Source} ...${{ ...props, ...patch }} />`);
  const first = html`<${Source} ...${props} />`;
  const out = renderToString(first);
  assert.match(out, /<button type="button" class="run" disabled>Mettre en pistes<\/button>/); // le modèle se charge
  assert.match(out, /<progress max="111000000" value="42000000" aria-label="Chargement du modèle"><\/progress>/);
  assert.match(out, /Chargement du modèle : 42 \/ 111 Mo — une seule fois, puis gardé par votre navigateur\./);
  (find(first, (e) => e.type === 'textarea').props['onInput'] as (event: Event) => void)(inputEvent('Un texte'));
  click(first, byClass('run'));
  click(first, byClass('example'));
  assert.match(render({ model: model({ status: 'loading' }) }), /<progress aria-label="Chargement du modèle"><\/progress>\s*Chargement du modèle… — une seule fois/);
  const waiting = html`<${Source} ...${{ ...props, model: model({ status: 'waiting' }) }} />`;
  const before = renderToString(waiting);
  assert.match(before, /Charger le modèle \(141 Mo\)/);
  assert.match(before, /depuis jsDelivr et Hugging Face, qui voient alors votre adresse\. Votre texte, lui, reste dans ce navigateur\./);
  assert.match(before, /<button type="button" class="run">Mettre en pistes<\/button>/); // le premier clic vaut accord
  click(waiting, byClass('load'));
  const failed = html`<${Source} ...${{ ...props, model: model({ status: 'error', error: 'Échec : hors ligne. Vous pouvez relancer.' }) }} />`;
  assert.match(renderToString(failed), /<button type="button" class="run">Mettre en pistes/); // relancer en mettant en pistes
  assert.match(renderToString(failed), /role="alert">Échec : hors ligne\. Vous pouvez relancer\. <button type="button" class="load">Relancer/);
  click(failed, byClass('load'));
  const ready = render({ model: model({}), started: true, message: 'Collez d’abord un texte.' });
  assert.doesNotMatch(ready, /class="example"|progress/);
  assert.match(ready, /<button type="button" class="run">Mettre en pistes<\/button>/);
  assert.match(ready, /class="input-message" role="status" aria-live="polite">Collez d’abord un texte\./);
  assert.match(render({ model: model({}), tagging: true }), /Étiquetage du texte…/);
  const folded = html`<${Source} ...${{ ...props, editing: false, started: true, words: 44 }} />`;
  assert.match(renderToString(folded), /<div class="source folded"><span>Texte : 44 mots<\/span><button type="button" class="edit">Modifier<\/button>/);
  click(folded, byClass('edit'));
  assert.match(render({ editing: false, words: 1 }), /Texte : 1 mot</);
  assert.deepEqual(calls, ['input:Un texte', 'run', 'example', 'load', 'load', 'edit']);
});

test('Chain : les contraintes numérotées dans l’ordre de la chaîne, leurs pistes, leurs gestes ; un bouton d’ajout par type', () => {
  const actions: MixerAction[] = [];
  const lookup = (type: string) => (type === 'sans' ? sansPlugin : s7Plugin);
  const s7 = { id: 's7-1', type: 's7', enabled: true, params: { offset: 7, mode: 'reagree' }, targets: ['noun' as const] };
  const sans = { id: 'sans-1', type: 'sans', enabled: false, params: { lettre: 'e' }, targets: [...CATEGORIES] };
  const props = { instances: [s7, sans], plugins: [s7Plugin, sansPlugin], lookup, dispatch: (action: MixerAction) => void actions.push(action) };
  const chain = html`<${Chain} ...${props} />`;
  const out = renderToString(chain);
  assert.match(out, /<section class="chain" aria-labelledby="chain-title"><h2 class="silk" id="chain-title">Contraintes<\/h2><ol class="slots">/);
  assert.ok(out.indexOf('Contrainte 1 : S+7') < out.indexOf('Contrainte 2 : Sans'));
  assert.match(out, /<span class="pos mono" aria-hidden="true">1<\/span><span class="name">S\+7<\/span>/);
  assert.match(out, /class="slot off" aria-label="Contrainte 2 : Sans"/);
  // pastilles : les pistes que le type traite, avec leur poinçon, enfoncées si visées ; la dernière ne s'éteint pas
  assert.match(out, /class="chip noun" aria-pressed="true" disabled><svg class="shape noun"[^]*?Noms</);
  assert.match(out, /class="chip adjective" aria-pressed="false"><svg/);
  assert.match(out.slice(0, out.indexOf('Contrainte 2')), /class="chip verb" aria-pressed="false"/); // le V+n
  assert.doesNotMatch(out.slice(0, out.indexOf('Contrainte 2')), /chip adverb/); // le S+n ne traite pas les adverbes
  assert.equal(elements(chain).filter(byClass('chip')).length, 3 + 5);
  assert.match(out, /aria-label="S\+7 actif">Actif</);
  assert.match(out, /Chaque nom devient le 7e nom/);
  assert.match(out, /Contrainte coupée : le texte passe tel quel\./);
  // monter le premier, descendre le dernier : impossible
  assert.match(out, /aria-label="Monter la contrainte 1" disabled/);
  assert.match(out, /aria-label="Descendre la contrainte 2" disabled/);
  click(chain, byClass('power'));
  (find(chain, (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('3'));
  (find(chain, (e) => e.type === 'select' && String(e.props['value']) === 'e').props['onChange'] as (event: Event) => void)(inputEvent('a'));
  click(chain, (e) => byClass('chip')(e) && byClass('adjective')(e));
  click(chain, (e) => byClass('chip')(e) && byClass('verb')(e) && e.props['aria-pressed'] === true);
  click(chain, byLabel('Descendre la contrainte 1'));
  click(chain, byLabel('Monter la contrainte 2'));
  click(chain, byClass('duplicate'));
  click(chain, byClass('remove'));
  for (const button of elements(chain).filter(byClass('add-instance'))) (button.props['onClick'] as () => void)();
  assert.deepEqual(actions, [
    { type: 'toggle-instance', id: 's7-1' },
    { type: 'set-param', id: 's7-1', key: 'offset', value: 3 },
    { type: 'set-param', id: 'sans-1', key: 'lettre', value: 'a' },
    { type: 'set-targets', id: 's7-1', targets: ['noun', 'adjective'] },
    { type: 'set-targets', id: 'sans-1', targets: ['noun', 'adjective', 'adverb', 'other'] },
    { type: 'move-instance', id: 's7-1', position: 1 },
    { type: 'move-instance', id: 'sans-1', position: 0 },
    { type: 'duplicate-instance', id: 's7-1' },
    { type: 'remove-instance', id: 's7-1' },
    { type: 'add-instance', plugin: 's7' },
    { type: 'add-instance', plugin: 'sans' },
  ]);
  assert.match(renderToString(chain), />\+ S\+7<.*>\+ Sans</s);
  const empty = renderToString(html`<${Chain} ...${{ ...props, instances: [] }} />`);
  assert.match(empty, /Aucune contrainte : le texte passe tel quel\./);
  assert.doesNotMatch(empty, /<ol/);
});

test('dropPosition : la place dans la chaîne privée de l’instance déplacée', () => {
  const ids = ['a', 'b', 'c'];
  assert.equal(dropPosition(ids, 'c', 'a', true), 0); // le troisième au-dessus du premier
  assert.equal(dropPosition(ids, 'a', 'c', false), 2); // le premier sous le dernier
  assert.equal(dropPosition(ids, 'a', 'c', true), 1);
  assert.equal(dropPosition(ids, 'b', 'a', false), 1);
});

/** Une ligne de la chaîne vue par les gestionnaires de glisser-déposer : ses classes et sa boîte. */
function fakeRow(top: number, rows: { classList: Set<string> }[] = []) {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  const row = {
    classList: {
      add: (...names: string[]) => names.forEach((n) => classes.add(n)),
      remove: (...names: string[]) => names.forEach((n) => classes.delete(n)),
      toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
      contains: (name: string) => classes.has(name),
    },
    classes,
    attributes,
    getBoundingClientRect: () => ({ top, height: 40 }),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    removeAttribute: (name: string) => attributes.delete(name),
    closest: (selector: string) => (selector === '.slots' ? { querySelectorAll: () => rows } : row),
  };
  rows.push(row as never);
  return row;
}

test('Chain : une contrainte non ciblable n’a pas de puces de pistes', () => {
  const edge = { id: 'edge-1', type: 'edge', enabled: true, params: edgePlugin.defaults, targets: [...CATEGORIES] };
  const chain = html`<${Chain} instances=${[edge]} plugins=${[edgePlugin]} lookup=${() => edgePlugin} dispatch=${() => {}} />`;
  assert.equal(elements(chain).filter(byClass('chip')).length, 0);
  assert.match(renderToString(chain), /<span class="targets"><span class="silk">Tout le texte<\/span><\/span>/);
});

test('Chain : glisser une ligne par sa poignée, un trait marque la place, lâcher la déplace', () => {
  const actions: MixerAction[] = [];
  const make = (id: string) => ({ id, type: 's7', enabled: true, params: { offset: 7, mode: 'reagree' }, targets: ['noun' as const] });
  const chain = html`<${Chain} instances=${[make('a'), make('b'), make('c')]} plugins=${[s7Plugin]} lookup=${() => s7Plugin}
    dispatch=${(action: MixerAction) => void actions.push(action)} />`;
  const rowsOf = elements(chain).filter(byClass('slot'));
  const grips = elements(chain).filter(byClass('grip'));
  const all: { classList: Set<string> }[] = [];
  const first = fakeRow(0, all);
  const third = fakeRow(80, all);
  const data = new Map<string, string>();
  const transfer = { setData: (k: string, v: string) => data.set(k, v), getData: (k: string) => data.get(k) ?? '', effectAllowed: '', dropEffect: '' };
  const on = (vnode: (typeof rowsOf)[number], name: string, event: object) => (vnode.props[name] as (e: unknown) => void)(event);
  // La poignée rend la ligne déplaçable.
  on(grips[2]!, 'onPointerDown', { currentTarget: { closest: () => third } });
  assert.equal(third.attributes.get('draggable'), 'true');
  on(rowsOf[2]!, 'onDragStart', { currentTarget: third, dataTransfer: transfer });
  assert.ok(third.classes.has('dragging'));
  // Au-dessus de la moitié de la première ligne : le trait se pose avant elle.
  let prevented = 0;
  on(rowsOf[0]!, 'onDragOver', { currentTarget: first, clientY: 10, preventDefault: () => prevented++ });
  assert.ok(first.classes.has('drop-before') && !first.classes.has('drop-after'));
  on(rowsOf[0]!, 'onDragLeave', { currentTarget: first });
  assert.ok(!first.classes.has('drop-before'));
  on(rowsOf[0]!, 'onDragOver', { currentTarget: first, clientY: 10, preventDefault: () => prevented++ });
  on(rowsOf[0]!, 'onDrop', { currentTarget: first, dataTransfer: transfer, preventDefault: () => prevented++ });
  assert.deepEqual(actions, [{ type: 'move-instance', id: 'c', position: 0 }]);
  assert.equal(prevented, 3);
  assert.ok(!first.classes.has('drop-before') && !third.classes.has('dragging'));
  // Fin du geste : la ligne n'est plus déplaçable ; lâcher une ligne sur elle-même ne fait rien.
  on(rowsOf[2]!, 'onDragEnd', { currentTarget: third });
  assert.equal(third.attributes.has('draggable'), false);
  on(rowsOf[2]!, 'onDragOver', { currentTarget: third, clientY: 120, preventDefault: () => {} });
  on(rowsOf[2]!, 'onDrop', { currentTarget: third, dataTransfer: transfer, preventDefault: () => {} });
  on(rowsOf[2]!, 'onPointerUp', { currentTarget: third });
  assert.equal(actions.length, 1);
});

test('Browser : replié par défaut, recettes puis moteurs ; une recette sans choix se branche d’un clic', () => {
  const actions: MixerAction[] = [];
  const props = { recipes, plugins: [s7Plugin, edgePlugin], dispatch: (action: MixerAction) => void actions.push(action), now: () => new Date(2026, 9, 3) };
  const browser = html`<${Browser} ...${props} />`;
  const out = renderToString(browser);
  assert.match(out, /^<details class="browser"><summary>Ajouter une contrainte<\/summary>/);
  assert.ok(out.indexOf('Recettes') < out.indexOf('Moteurs'));
  assert.match(out, /<button type="button" class="add-recipe">\+ Haï-kaïsation<\/button><span class="rule">Réduire un poème à ses fins de vers\.<\/span>/);
  // la fiche s'ouvre dans un nouvel onglet, et le dit
  assert.match(out, /<a class="sheet" href="https:\/\/oulipo\.net\/contraintes\/hai-kaisation" target="_blank" rel="noopener">fiche<span aria-hidden="true"> ↗<\/span><span class="sr-only"> Haï-kaïsation sur oulipo\.net, nouvel onglet<\/span><\/a>/);
  // une recette à choix : sa touche dit ce qu'elle déplie, le choix est caché
  assert.match(out, /class="add-recipe" aria-expanded="false" aria-controls="recipe-liponymie">\+ Liponymie</);
  assert.match(out, /<form class="choice" id="recipe-liponymie" hidden>/);
  click(browser, (e) => byClass('add-recipe')(e) && String(e.props['children']).includes('Juliennes'));
  click(browser, (e) => byClass('add-instance')(e) && String(e.props['children']).includes('Bord'));
  assert.deepEqual(actions, [
    { type: 'add-recipe', recipe: 'juliennes', choice: undefined, today: '2026-10-03' },
    { type: 'add-instance', plugin: 'edge' },
  ]);
});

test('Browser : le choix se déplie, Brancher ajoute la recette réglée, Annuler et Échap replient sans rien ajouter', () => {
  const actions: MixerAction[] = [];
  const browser = html`<${Browser} recipes=${recipes} plugins=${[]} dispatch=${(action: MixerAction) => void actions.push(action)} now=${() => new Date(2026, 9, 3)} />`;
  // Une ligne de recette factice, assez pour les gestes : la touche, le formulaire et son choix.
  const select = { value: 'adjective', focus: () => calls.push('focus select') };
  const key = { setAttribute: (name: string, value: string) => calls.push(`${name}=${value}`), focus: () => calls.push('focus key') };
  const form = { hidden: true, querySelector: () => select, elements: { namedItem: () => select } };
  const row = { querySelector: (selector: string) => (selector === 'form' ? form : key) };
  const inRow = { closest: () => row };
  const calls: string[] = [];
  const liponymie = find(browser, (e) => e.props['class'] === 'recipe' && renderToString(e as never).includes('Liponymie'));
  (find(liponymie, byClass('add-recipe')).props['onClick'] as (event: unknown) => void)({ currentTarget: inRow });
  assert.equal(form.hidden, false);
  assert.deepEqual(calls, ['aria-expanded=true', 'focus select']);
  const choice = find(liponymie, (e) => e.type === 'form');
  let prevented = false;
  (choice.props['onSubmit'] as (event: unknown) => void)({ preventDefault: () => (prevented = true), currentTarget: { ...form, closest: () => row } });
  assert.ok(prevented);
  assert.deepEqual(actions, [{ type: 'add-recipe', recipe: 'liponymie', choice: 'adjective', today: '2026-10-03' }]);
  assert.equal(form.hidden, true);
  (find(liponymie, byClass('cancel')).props['onClick'] as (event: unknown) => void)({ currentTarget: inRow });
  (choice.props['onKeyDown'] as (event: unknown) => void)({ key: 'Escape', currentTarget: inRow });
  (choice.props['onKeyDown'] as (event: unknown) => void)({ key: 'a', currentTarget: inRow });
  assert.equal(actions.length, 1);
  assert.deepEqual(calls.slice(-2), ['aria-expanded=false', 'focus key']);
});

test('StepGrid : le pas que dit l’écoute porte la marque et est annoncé comme pas courant ; aucun sans écoute', () => {
  const playing = renderToString(html`<${StepGrid} ...${gridProps({ playing: 3 }).props} />`);
  assert.match(playing, /class="hd playing" aria-pressed="false" aria-current="step" aria-label="Inspecter « sonne », pas 4"/);
  assert.equal(playing.match(/aria-current/g)?.length, 1);
  assert.equal(renderToString(html`<${StepGrid} ...${gridProps().props} />`).match(/aria-current|playing/g), null);
});

test('Chain : un S+n au dé s’appelle « S+dé », un S+n fixe « S+7 »', () => {
  const s7 = (id: string, draw: string) => ({ id, type: 's7', enabled: true, params: { ...s7Plugin.defaults, draw, seed: 2461318 }, targets: ['noun'] });
  const out = renderToString(html`<${Chain} instances=${[s7('s7-1', 'dice'), s7('s7-2', 'fixed')]} plugins=${[s7Plugin]} lookup=${() => s7Plugin} dispatch=${() => {}} />`);
  assert.match(out, /aria-label="Contrainte 1 : S\+dé".*<span class="name">S\+dé<\/span>/s);
  assert.match(out, /aria-label="Contrainte 2 : S\+7".*<span class="name">S\+7<\/span>/s);
});

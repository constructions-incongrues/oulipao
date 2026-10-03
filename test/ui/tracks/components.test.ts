import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { CATEGORIES } from '../../../src/domain/categories.ts';
import type { ModelState } from '../../../src/ui/tracks/controller.ts';
import { PluginSlot } from '../../../src/ui/tracks/components/plugin-slot.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { EmptyScore, Score } from '../../../src/ui/tracks/components/score.ts';
import { Source, type SourceProps } from '../../../src/ui/tracks/components/source.ts';
import { Strip, TRACK_NAMES } from '../../../src/ui/tracks/components/strip.ts';
import { layoutScore } from '../../../src/ui/tracks/score-layout.ts';
import type { NounMark } from '../../../src/ui/tracks/view-model.ts';
import { tag } from '../../support/morphology.ts';
import { byClass, byLabel, elements, find, inputEvent } from '../../support/vnode.ts';

const click = (node: unknown, predicate: Parameters<typeof find>[1]) => (find(node as never, predicate).props['onClick'] as () => void)();

test('Strip : pastille, nom, nombre de mots, Muet et Seul en toutes lettres, avec infobulles', () => {
  const calls: string[] = [];
  const strip = html`<${Strip} category="verb" count=${39} track=${{ muted: true, solo: false }}
    onMute=${() => calls.push('mute')} onSolo=${() => calls.push('solo')}><p>plugin</p><//>`;
  const out = renderToString(strip);
  assert.match(out, /<section class="strip verb" aria-label="Piste Verbes">/);
  assert.match(out, /<span class="dot" aria-hidden="true"><\/span><h3>Verbes<\/h3><span class="count">39 mots<\/span>/);
  assert.match(out, /aria-pressed="true" aria-label="Muet : retirer la piste Verbes du texte" title="Retirer cette piste du texte">Muet</);
  assert.match(out, /aria-pressed="false" aria-label="Seul : ne garder que la piste Verbes" title="Ne garder que cette piste">Seul</);
  assert.match(out, /<p>plugin<\/p>/);
  click(strip, byClass('mute'));
  click(strip, byClass('solo'));
  assert.deepEqual(calls, ['mute', 'solo']);
  assert.match(renderToString(html`<${Strip} category="adverb" count=${1} track=${{ muted: false, solo: true }} onMute=${() => {}} onSolo=${() => {}} />`), /1 mot</);
  assert.deepEqual(Object.keys(TRACK_NAMES), [...CATEGORIES]);
});

test('PluginSlot : marche, Décalage borné, Parmi, et l’effet en clair', () => {
  const calls: unknown[] = [];
  const slot = html`<${PluginSlot} plugin=${{ enabled: true, offset: 7, mode: 'reagree' }}
    onToggle=${() => calls.push('toggle')} onOffset=${(n: number) => calls.push(n)} onMode=${(m: string) => calls.push(m)} />`;
  const out = renderToString(slot);
  assert.match(out, /class="plugin on"/);
  assert.match(out, /aria-pressed="true" aria-label="Plugin S\+7 actif"/);
  assert.match(out, /S\+7 actif/);
  assert.match(out, /<input type="number" step="1" min="-99" max="99" value="7"/);
  assert.match(out, /Parmi<select><option value="reagree" selected>tous les noms<\/option><option value="same-gender">les noms du même genre<\/option>/);
  assert.match(out, /Chaque nom devient le 7e nom qui le suit dans le dictionnaire ; la phrase est réaccordée\./);
  click(slot, byClass('power'));
  const input = find(slot, (e) => e.type === 'input').props['onInput'] as (event: Event) => void;
  for (const value of ['3', '2.5', '', '100', '-100', '-99']) input(inputEvent(value)); // hors bornes, vide ou à virgule : ignoré
  (find(slot, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('same-gender'));
  assert.deepEqual(calls, ['toggle', 3, -99, 'same-gender']);

  const help = (plugin: object) => renderToString(html`<${PluginSlot} plugin=${plugin} />`);
  assert.match(help({ enabled: false, offset: -3, mode: 'same-gender' }), /class="plugin off".*S−3 coupé.*Plugin coupé : les noms restent ceux du texte\./s);
  assert.match(help({ enabled: true, offset: 0, mode: 'reagree' }), /S\+0 : aucun changement\./);
  assert.match(help({ enabled: true, offset: -1, mode: 'same-gender' }), /le 1er nom de même genre qui le précède/);
  // sans gestionnaires : les gestes sont sans effet, sans erreur
  const bare = html`<${PluginSlot} plugin=${{ enabled: true, offset: 7, mode: 'reagree' }} />`;
  (find(bare, (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('4'));
  (find(bare, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('reagree'));
});

test('Score : la règle, les seules pistes non vides, trois aspects de bloc, une liste pour les lecteurs d’écran', () => {
  const text = 'La vieille ferme dort.';
  const layout = layoutScore(text, tag(text), new Map([[2, 'fermoir']]));
  const marks = new Map<number, NounMark>([[2, { state: 'replaced', original: 'ferme' }]]);
  const score = html`<${Score} layout=${layout} audible=${new Set(['noun', 'verb', 'adverb', 'other'])} marks=${marks} />`;
  const out = renderToString(score);
  assert.match(out, /<div aria-hidden="true"><div class="system">/);
  assert.match(out, /<span class="lane-name">Texte<\/span><span class="cells">La vieille ferme dort\.<\/span>/);
  assert.doesNotMatch(out, /lane adverb/); // aucun adverbe : la piste est masquée
  assert.match(out, /<div class="lane adjective silent">/);
  assert.match(out, /<span class="block replaced" title="ferme → fermoir" style="left:11ch;width:7ch">fermoir<\/span>/);
  assert.match(out, /<span class="block" title="dort"/);
  assert.equal(elements(score).filter(byClass('lane')).length, 5); // la règle et quatre pistes
  assert.match(out, /<li>Noms, 1 mot : ferme devenu fermoir\.<\/li>/);
  assert.match(out, /<li>Adjectifs \(coupée\), 1 mot : vieille\.<\/li>/);
  assert.match(out, /<li>Adverbes, 0 mot\.<\/li>/);
  assert.match(out, /<li>Autres, 1 mot : La\.<\/li>/);

  const kept = renderToString(html`<${Score} layout=${layoutScore('Le zorg', tag('Le zorg', { zorg: 'noun' }))} audible=${new Set(CATEGORIES)}
    marks=${new Map([[1, { state: 'kept', original: 'zorg', reason: 'absent du dictionnaire' }]])} />`);
  assert.match(kept, /<span class="block kept" title="zorg : laissé tel quel, absent du dictionnaire"/);
  assert.match(kept, /zorg laissé tel quel \(absent du dictionnaire\)/);
  assert.match(renderToString(html`<${Score} layout=${{ systems: [] }} audible=${new Set()} />`), /class="score"/);
});

test('EmptyScore : avant tout texte, les cinq pistes vides, déjà nommées', () => {
  const out = renderToString(html`<${EmptyScore} />`);
  for (const name of Object.values(TRACK_NAMES)) assert.match(out, new RegExp(`<span class="lane-name">${name}</span>`));
});

test('Result : noms remplacés soulignés, mots changés éclairés, pistes coupées, copie', () => {
  let copies = 0;
  const props = {
    segments: [{ text: 'Le', index: 0 }, { text: ' ' }, { text: 'fermoir', index: 1 }, { text: ',\nvieux.' }],
    empty: false,
    marks: new Map<number, NounMark>([[1, { state: 'replaced', original: 'ferme' }]]),
    changed: new Set([0, 1]),
    generation: 3,
    audibleCount: 5,
    stale: false,
    copyMessage: '',
    onCopy: () => copies++,
  };
  const result = html`<${Result} ...${props} />`;
  const out = renderToString(result);
  assert.match(out, /<p class="result-text"><span class="changed">Le<\/span> <span class="replaced changed">fermoir<\/span>,\nvieux\.<\/p>/);
  assert.doesNotMatch(out, /class="notice"/);
  click(result, byClass('copy'));
  assert.equal(copies, 1);
  assert.equal(find(result, byLabel('Texte résultant')).type, 'section');

  const calm = renderToString(html`<${Result} ...${{ ...props, changed: new Set(), marks: new Map(), audibleCount: 4, copyMessage: 'Copié.' }} />`);
  assert.match(calm, /<p class="result-text">Le fermoir,\nvieux\.<\/p>/);
  assert.match(calm, /Pistes coupées : le texte est rendu tel quel, sans réparer la phrase\./);
  assert.match(calm, /<span class="copy-message" role="status" aria-live="polite">Copié\.<\/span>/);
  const empty = renderToString(html`<${Result} ...${{ ...props, segments: [{ text: '.' }], empty: true, audibleCount: 1 }} />`);
  assert.match(empty, /<button type="button" class="copy" disabled>Copier<\/button>/);
  assert.match(empty, /Toutes les pistes sont coupées\./);
  assert.match(renderToString(html`<${Result} ...${{ ...props, stale: true }} />`), /class="result stale".*class="copy" disabled/s);
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
  assert.match(out, /Le S\+7, inventé par Jean Lescure à l'Oulipo/);
  assert.match(out, /<button type="button" class="run" disabled>Mettre en pistes<\/button>/); // le modèle n'est pas prêt
  assert.match(out, /<progress max="111000000" value="42000000" aria-label="Chargement du modèle"><\/progress>/);
  assert.match(out, /Chargement du modèle : 42 \/ 111 Mo — une seule fois, puis gardé par votre navigateur\./);
  (find(first, (e) => e.type === 'textarea').props['onInput'] as (event: Event) => void)(inputEvent('Un texte'));
  click(first, byClass('run'));
  click(first, byClass('example'));
  assert.match(render({ model: model({ status: 'loading' }) }), /<progress aria-label="Chargement du modèle"><\/progress>\s*Chargement du modèle… — une seule fois/);
  const waiting = html`<${Source} ...${{ ...props, model: model({ status: 'waiting' }) }} />`;
  assert.match(renderToString(waiting), /Charger le modèle \(141 Mo\)/);
  click(waiting, byClass('load'));
  const failed = html`<${Source} ...${{ ...props, model: model({ status: 'error', error: 'Échec : hors ligne. Vous pouvez relancer.' }) }} />`;
  assert.match(renderToString(failed), /role="alert">Échec : hors ligne\. Vous pouvez relancer\. <button type="button" class="load">Relancer/);
  click(failed, byClass('load'));
  const ready = render({ model: model({}), started: true, message: 'Collez d’abord un texte.' });
  assert.doesNotMatch(ready, /Jean Lescure|class="example"|progress/);
  assert.match(ready, /<button type="button" class="run">Mettre en pistes<\/button>/);
  assert.match(ready, /class="input-message" role="status" aria-live="polite">Collez d’abord un texte\./);
  assert.match(render({ model: model({}), tagging: true }), /Étiquetage du texte…/);
  const folded = html`<${Source} ...${{ ...props, editing: false, started: true, words: 44 }} />`;
  assert.match(renderToString(folded), /<div class="source folded"><span>Texte : 44 mots<\/span><button type="button" class="edit">Modifier<\/button>/);
  click(folded, byClass('edit'));
  assert.match(render({ editing: false, words: 1 }), /Texte : 1 mot</);
  assert.deepEqual(calls, ['input:Un texte', 'run', 'example', 'load', 'load', 'edit']);
});

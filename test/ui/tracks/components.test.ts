import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { CATEGORIES } from '../../../src/domain/categories.ts';
import { PluginSlot } from '../../../src/ui/tracks/components/plugin-slot.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { Score } from '../../../src/ui/tracks/components/score.ts';
import { Strip, TRACK_NAMES } from '../../../src/ui/tracks/components/strip.ts';
import { layoutScore } from '../../../src/ui/tracks/score-layout.ts';
import { tag } from '../../support/morphology.ts';
import { byClass, byLabel, elements, find, inputEvent } from '../../support/vnode.ts';

test('Strip : nom, nombre de mots, état des boutons, emplacement', () => {
  const calls: string[] = [];
  const strip = html`<${Strip} category="verb" count=${39} track=${{ muted: true, solo: false }}
    onMute=${() => calls.push('mute')} onSolo=${() => calls.push('solo')}><${PluginSlot} /><//>`;
  const out = renderToString(strip);
  assert.match(out, /<section class="strip verb" aria-label="Piste Verbes">/);
  assert.match(out, /<h3>Verbes<\/h3>/);
  assert.match(out, /39 mots/);
  assert.match(out, /aria-pressed="true" aria-label="Rendre muette la piste Verbes"/);
  assert.match(out, /aria-pressed="false" aria-label="Mettre en solo la piste Verbes"/);
  assert.match(out, /emplacement vide/);
  (find(strip, byClass('mute')).props['onClick'] as () => void)();
  (find(strip, byClass('solo')).props['onClick'] as () => void)();
  assert.deepEqual(calls, ['mute', 'solo']);
  assert.match(renderToString(html`<${Strip} category="adverb" count=${1} track=${{ muted: false, solo: true }} onMute=${() => {}} onSolo=${() => {}} />`), /1 mot</);
  assert.deepEqual(Object.keys(TRACK_NAMES), [...CATEGORIES]);
});

test('PluginSlot : S+7 actif ou coupé, décalage, mode ; gestes transmis', () => {
  const calls: unknown[] = [];
  const slot = html`<${PluginSlot} plugin=${{ enabled: true, offset: 7, mode: 'reagree' }}
    onToggle=${() => calls.push('toggle')} onOffset=${(n: number) => calls.push(n)} onMode=${(m: string) => calls.push(m)} />`;
  const out = renderToString(slot);
  assert.match(out, /class="slot plugin on"/);
  assert.match(out, /aria-pressed="true" aria-label="Plugin S\+7 actif"/);
  assert.match(out, /S\+7 actif/);
  assert.match(out, /<input type="number" step="1" value="7"/);
  assert.match(out, /<option value="reagree" selected>réaccord \(S\+7 strict\)<\/option>/);
  (find(slot, byClass('power')).props['onClick'] as () => void)();
  const input = find(slot, (e) => e.type === 'input').props['onInput'] as (event: Event) => void;
  input(inputEvent('3'));
  input(inputEvent('2.5')); // pas un entier : ignoré
  input(inputEvent('')); // champ vide : ignoré
  (find(slot, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('same-gender'));
  assert.deepEqual(calls, ['toggle', 3, 'same-gender']);

  const off = renderToString(html`<${PluginSlot} plugin=${{ enabled: false, offset: -3, mode: 'same-gender' }} />`);
  assert.match(off, /class="slot plugin off"/);
  assert.match(off, /S−3 coupé/);
  assert.match(off, /<option value="same-gender" selected>/);
  // sans gestionnaires : les gestes sont sans effet, sans erreur
  const bare = html`<${PluginSlot} plugin=${{ enabled: true, offset: 7, mode: 'reagree' }} />`;
  (find(bare, (e) => e.type === 'input').props['onInput'] as (event: Event) => void)(inputEvent('4'));
  (find(bare, (e) => e.type === 'select').props['onChange'] as (event: Event) => void)(inputEvent('reagree'));
});

test('Score : la règle, les cinq pistes nommées, un bloc par mot à sa colonne', () => {
  const text = 'La vieille ferme dort.';
  const layout = layoutScore(text, tag(text), new Map([[2, 'fermoir']]));
  const score = html`<${Score} layout=${layout} audible=${new Set(['noun', 'verb', 'adverb', 'other'])} />`;
  const out = renderToString(score);
  assert.match(out, /aria-label="Système 1"/);
  assert.match(out, /<span class="lane-name">Texte<\/span><span class="cells">La vieille ferme dort\.<\/span>/);
  for (const name of Object.values(TRACK_NAMES)) assert.match(out, new RegExp(`<span class="lane-name">${name}</span>`));
  assert.match(out, /<div class="lane adjective silent">/);
  assert.match(out, /<div class="lane noun">/);
  assert.match(out, /<span class="block" title="fermoir" style="left:11ch;width:7ch">fermoir<\/span>/);
  assert.equal(elements(score).filter(byClass('block')).length, 4);
  assert.equal(elements(score).filter(byClass('lane')).length, 6);
  assert.match(renderToString(html`<${Score} layout=${{ systems: [] }} audible=${new Set()} />`), /class="score"/);
});

test('Result : le texte tel quel, la copie et son accusé', () => {
  let copies = 0;
  const result = html`<${Result} text=${'Le fermoir,\nvieux.'} copied=${false} onCopy=${() => copies++} />`;
  const out = renderToString(result);
  assert.match(out, /<p class="result-text">Le fermoir,\nvieux\.<\/p>/);
  assert.match(out, /<span role="status" aria-live="polite"><\/span>/);
  (find(result, byClass('copy')).props['onClick'] as () => void)();
  assert.equal(copies, 1);
  assert.match(renderToString(html`<${Result} text="x" copied=${true} onCopy=${() => {}} />`), /Copié\./);
  assert.equal(find(result, byLabel('Texte résultant')).type, 'section');
  assert.throws(() => find(result, byClass('absent')), /introuvable/);
});

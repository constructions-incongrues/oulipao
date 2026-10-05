import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { elements } from '../../support/vnode.ts';
import { openBrowser } from '../../../src/ui/tracks/components/browser.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';

/** Un faux document : un navigateur replié, sa première touche, et la préférence d'animation. */
function fakePage(reduced: boolean, withBrowser = true) {
  const calls: string[] = [];
  const first = {
    scrollIntoView: (options: object) => calls.push(`scroll ${JSON.stringify(options)}`),
    focus: (options: object) => calls.push(`focus ${JSON.stringify(options)}`),
  };
  const browser = { open: false, querySelector: () => first };
  const doc = {
    querySelector: (selector: string) => (withBrowser && selector === '.chain details.browser' ? browser : null),
    defaultView: { matchMedia: (query: string) => ({ matches: reduced && query === '(prefers-reduced-motion: reduce)' }) },
  };
  return { from: { ownerDocument: doc } as unknown as Element, browser, calls };
}

test('openBrowser : ouvre le catalogue, l’amène au milieu de l’écran et met le focus sur sa première touche', () => {
  const { from, browser, calls } = fakePage(false);
  openBrowser(from);
  assert.equal(browser.open, true);
  assert.deepEqual(calls, ['scroll {"block":"center","behavior":"smooth"}', 'focus {"preventScroll":true}']);
});

test('openBrowser : d’un coup quand on a demandé moins d’animations ; rien sans catalogue', () => {
  const reduced = fakePage(true);
  openBrowser(reduced.from);
  assert.equal(reduced.calls[0], 'scroll {"block":"center","behavior":"auto"}');
  const none = fakePage(false, false);
  openBrowser(none.from);
  assert.deepEqual(none.calls, []);
});

test('Result : l’invite « Brancher une contrainte » sous le texte quand aucune contrainte n’est en marche', () => {
  const base = { segments: [{ text: 'Le chat.', index: 0 }], marks: new Map(), tracks: ['noun'], onSelect: () => {}, changed: new Set(), generation: 0, audibleCount: 5, copyMessage: '', onCopy: () => {}, empty: false, stale: false };
  const branched: unknown[] = [];
  const idle = elements(html`<${Result} ...${base} onBranch=${(from: Element) => branched.push(from)} />`);
  const line = idle.find((element) => element.props['class'] === 'idle')!;
  assert.match(String((line.props['children'] as unknown[])[0]), /Aucune contrainte en marche : le texte est rendu tel quel\./);
  const key = idle.find((element) => element.type === 'button' && /branch/.test(String(element.props['class'])))!;
  assert.equal(key.props['children'], 'Brancher une contrainte');
  (key.props['onClick'] as (event: object) => void)({ currentTarget: 'touche' });
  assert.deepEqual(branched, ['touche']);
  const playing = elements(html`<${Result} ...${base} onBranch=${false} />`);
  assert.equal(playing.some((element) => element.props['class'] === 'idle'), false);
});

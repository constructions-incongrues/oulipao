import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { nextTheme, ThemeToggle } from '../../../src/ui/tracks/components/theme-toggle.ts';
import { byClass, find } from '../../support/vnode.ts';

test('nextTheme : inverse le thème qu’on voit, celui du système à défaut de choix', () => {
  assert.equal(nextTheme(undefined, false), 'dark');
  assert.equal(nextTheme(undefined, true), 'light');
  assert.equal(nextTheme('dark', false), 'light');
  assert.equal(nextTheme('light', true), 'dark');
});

test('ThemeToggle : une touche « Clair / sombre » qui appelle onToggle', () => {
  let calls = 0;
  const toggle = html`<${ThemeToggle} onToggle=${() => calls++} />`;
  assert.match(renderToString(toggle), /<button type="button" class="key theme">Clair \/ sombre<\/button>/);
  (find(toggle, byClass('theme')).props['onClick'] as () => void)();
  assert.equal(calls, 1);
});

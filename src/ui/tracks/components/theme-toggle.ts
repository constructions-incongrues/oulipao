import { html } from 'htm/preact';
import type { VNode } from 'preact';

export type Theme = 'light' | 'dark';

/**
 * Le thème après un clic : l'inverse de celui qu'on voit. Sans choix posé sur la page, on voit
 * celui du système.
 */
export function nextTheme(forced: Theme | undefined, systemPrefersDark: boolean): Theme {
  const shown: Theme = forced ?? (systemPrefersDark ? 'dark' : 'light');
  return shown === 'dark' ? 'light' : 'dark';
}

/** La touche qui force le thème clair ou sombre ; le choix n'est pas gardé d'une visite à l'autre. */
export function ThemeToggle({ onToggle }: { onToggle: () => void }): VNode {
  return html`<button type="button" class="key theme" onClick=${onToggle}>Clair / sombre</button>` as VNode;
}

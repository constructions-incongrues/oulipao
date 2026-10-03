import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ConstraintPlugin } from '../../../domain/plugin.ts';
import type { PluginState } from '../types.ts';
import { PluginSlot } from './plugin-slot.ts';

export interface MasterProps {
  /** Tous les plugins installés : la chaîne les nomme, l'emplacement montre ceux de portée « toutes les pistes ». */
  plugins: readonly ConstraintPlugin[];
  states: Readonly<Record<string, PluginState>>;
  /** L'ordre de la chaîne, par identifiant. */
  order: readonly string[];
  onToggle: (id: string) => void;
  onParam: (id: string, key: string, value: number | string) => void;
  /** Inverse l'ordre de la chaîne. */
  onReverse: () => void;
}

/**
 * L'emplacement « Toutes les pistes », sous la table de mixage, comme un effet sur le bus master ;
 * et, dès que deux plugins sont installés, l'ordre de leur chaîne.
 */
export function Master({ plugins, states, order, onToggle, onParam, onReverse }: MasterProps): VNode {
  const name = (id: string) => plugins.find((plugin) => plugin.id === id)?.name ?? id;
  return html`
    <section class="master" aria-label="Toutes les pistes">
      <h3>Toutes les pistes</h3>
      ${!plugins.some((plugin) => plugin.track === 'all') && html`<p class="more">Emplacement vide.</p>`}
      ${plugins
        .filter((plugin) => plugin.track === 'all')
        .map(
          (plugin) => html`<${PluginSlot}
            plugin=${plugin}
            state=${states[plugin.id]}
            onToggle=${() => onToggle(plugin.id)}
            onParam=${(key: string, value: number | string) => onParam(plugin.id, key, value)}
          />`,
        )}
      ${order.length > 1 &&
      html`<p class="chain">
        Ordre : ${order.map(name).join(' → ')}
        <button type="button" class="reverse" onClick=${onReverse}>Inverser l'ordre</button>
      </p>`}
    </section>
  ` as VNode;
}

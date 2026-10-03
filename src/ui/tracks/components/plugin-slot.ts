import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ConstraintPlugin, Parameter } from '../../../domain/plugin.ts';
import { TRACK_UNITS, type PluginState } from '../types.ts';

export interface PluginSlotProps {
  plugin: ConstraintPlugin;
  state: PluginState;
  onToggle?: () => void;
  onParam?: (key: string, value: number | string) => void;
}

/** Un paramètre, tel que le plugin le déclare : un champ numérique borné, ou une liste. */
function Control({ parameter, value, onParam }: { parameter: Parameter; value: number | string | undefined; onParam?: PluginSlotProps['onParam'] }): VNode {
  if (parameter.kind === 'integer') {
    const { key, min, max } = parameter;
    return html`<input
      type="number"
      step="1"
      min=${min}
      max=${max}
      value=${value}
      onInput=${(event: Event) => {
        const raw = (event.currentTarget as HTMLInputElement).value;
        const number = Number(raw);
        // Champ vide, nombre à virgule ou hors bornes : on attend une saisie valable.
        if (raw.trim() !== '' && Number.isInteger(number) && number >= min && number <= max) onParam?.(key, number);
      }}
    />` as VNode;
  }
  return html`<select value=${value} onChange=${(event: Event) => onParam?.(parameter.key, (event.currentTarget as HTMLSelectElement).value)}>
    ${parameter.options.map((option) => html`<option value=${option.value} selected=${option.value === value}>${option.label}</option>`)}
  </select>` as VNode;
}

/**
 * Le plugin, ouvert sous la ligne de sa piste : marche, un réglage par paramètre déclaré, et
 * l'effet en clair. La page ne connaît aucun plugin en particulier.
 */
export function PluginSlot({ plugin, state, onToggle, onParam }: PluginSlotProps): VNode {
  const { enabled, params } = state;
  return html`
    <div class=${`plugin ${enabled ? 'on' : 'off'}`}>
      <button type="button" class="power" aria-pressed=${enabled} aria-label=${`Plugin ${plugin.name} actif`} onClick=${onToggle}>
        ${plugin.title(params)} ${enabled ? 'actif' : 'coupé'}
      </button>
      ${plugin.parameters.map(
        (parameter) => html`<label>${parameter.label}<${Control} parameter=${parameter} value=${params[parameter.key]} onParam=${onParam} /></label>`,
      )}
      <p class="help">${enabled ? plugin.help(params) : `Plugin coupé : les ${plugin.track === 'all' ? 'mots' : TRACK_UNITS[plugin.track][1]} restent ceux du texte.`}</p>
    </div>
  ` as VNode;
}

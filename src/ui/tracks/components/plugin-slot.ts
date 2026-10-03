import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { S7Mode } from '../../../domain/s7/types.ts';
import type { PluginState } from '../types.ts';

export interface PluginSlotProps {
  /** Absent : emplacement vide. */
  plugin?: PluginState;
  onToggle?: () => void;
  onOffset?: (offset: number) => void;
  onMode?: (mode: S7Mode) => void;
}

const MODES: [S7Mode, string][] = [['reagree', 'réaccord (S+7 strict)'], ['same-gender', 'même genre']];

/** L'emplacement de plugin d'une tranche : vide, ou portant le S+7 et ses réglages. */
export function PluginSlot({ plugin, onToggle, onOffset, onMode }: PluginSlotProps): VNode {
  if (!plugin) return html`<div class="slot empty">emplacement vide</div>` as VNode;
  const sign = plugin.offset < 0 ? '−' : '+';
  return html`
    <div class=${`slot plugin ${plugin.enabled ? 'on' : 'off'}`}>
      <button type="button" class="power" aria-pressed=${plugin.enabled} aria-label="Plugin S+7 actif" onClick=${onToggle}>
        S${sign}${Math.abs(plugin.offset)} ${plugin.enabled ? 'actif' : 'coupé'}
      </button>
      <label>
        Décalage
        <input
          type="number"
          step="1"
          value=${plugin.offset}
          onInput=${(event: Event) => {
            const raw = (event.currentTarget as HTMLInputElement).value;
            // Champ vide ou nombre à virgule : on attend que la saisie soit un entier.
            if (raw.trim() !== '' && Number.isInteger(Number(raw))) onOffset?.(Number(raw));
          }}
        />
      </label>
      <label>
        Mode
        <select value=${plugin.mode} onChange=${(event: Event) => onMode?.((event.currentTarget as HTMLSelectElement).value as S7Mode)}>
          ${MODES.map(([mode, label]) => html`<option value=${mode} selected=${mode === plugin.mode}>${label}</option>`)}
        </select>
      </label>
    </div>
  ` as VNode;
}

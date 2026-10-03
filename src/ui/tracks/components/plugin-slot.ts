import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { S7Mode } from '../../../domain/s7/types.ts';
import { MAX_OFFSET, MIN_OFFSET, type PluginState } from '../types.ts';
import { ruleName } from '../view-model.ts';

export interface PluginSlotProps {
  plugin: PluginState;
  onToggle?: () => void;
  onOffset?: (offset: number) => void;
  onMode?: (mode: S7Mode) => void;
}

/** Les deux valeurs du paramètre « Parmi ». */
const AMONG: [S7Mode, string][] = [['reagree', 'tous les noms'], ['same-gender', 'les noms du même genre']];

/** Ce que fait le réglage en cours, en une phrase. */
function help({ enabled, offset, mode }: PluginState): string {
  if (!enabled) return 'Plugin coupé : les noms restent ceux du texte.';
  if (offset === 0) return 'S+0 : aucun changement.';
  const rank = `${Math.abs(offset)}${Math.abs(offset) === 1 ? 'er' : 'e'}`;
  const direction = offset > 0 ? 'suit' : 'précède';
  return mode === 'reagree'
    ? `Chaque nom devient le ${rank} nom qui le ${direction} dans le dictionnaire ; la phrase est réaccordée.`
    : `Chaque nom devient le ${rank} nom de même genre qui le ${direction} dans le dictionnaire.`;
}

/** Le plugin S+7, ouvert sous la ligne des noms : marche, Décalage, Parmi, et l'effet en clair. */
export function PluginSlot({ plugin, onToggle, onOffset, onMode }: PluginSlotProps): VNode {
  return html`
    <div class=${`plugin ${plugin.enabled ? 'on' : 'off'}`}>
      <button type="button" class="power" aria-pressed=${plugin.enabled} aria-label="Plugin S+7 actif" onClick=${onToggle}>
        ${ruleName(plugin.offset)} ${plugin.enabled ? 'actif' : 'coupé'}
      </button>
      <label>
        Décalage
        <input
          type="number"
          step="1"
          min=${MIN_OFFSET}
          max=${MAX_OFFSET}
          value=${plugin.offset}
          onInput=${(event: Event) => {
            const raw = (event.currentTarget as HTMLInputElement).value;
            const offset = Number(raw);
            // Champ vide, nombre à virgule ou hors bornes : on attend une saisie valable.
            if (raw.trim() !== '' && Number.isInteger(offset) && offset >= MIN_OFFSET && offset <= MAX_OFFSET) onOffset?.(offset);
          }}
        />
      </label>
      <label>
        Parmi
        <select value=${plugin.mode} onChange=${(event: Event) => onMode?.((event.currentTarget as HTMLSelectElement).value as S7Mode)}>
          ${AMONG.map(([mode, label]) => html`<option value=${mode} selected=${mode === plugin.mode}>${label}</option>`)}
        </select>
      </label>
      <p class="help">${help(plugin)}</p>
    </div>
  ` as VNode;
}

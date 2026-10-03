import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { Parameter } from '../../../domain/plugin.ts';

/** Reçoit la valeur d'un paramètre, une fois saisie valable. */
export type ParamHandler = (key: string, value: number | string) => void;

/** Un paramètre, tel que le plugin le déclare : un champ numérique borné, un champ texte, ou une liste. */
export function Control({ parameter, value, onParam }: { parameter: Parameter; value: number | string | undefined; onParam?: ParamHandler }): VNode {
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
  if (parameter.kind === 'text') {
    // Chaque frappe règle la contrainte : une saisie vide est valable, le plugin dit alors qu'il n'agit pas.
    return html`<input
      type="text"
      class="param-text"
      maxlength=${parameter.maxLength}
      placeholder=${parameter.placeholder}
      spellcheck="false"
      value=${value}
      onInput=${(event: Event) => onParam?.(parameter.key, (event.currentTarget as HTMLInputElement).value)}
    />` as VNode;
  }
  return html`<select value=${value} onChange=${(event: Event) => onParam?.(parameter.key, (event.currentTarget as HTMLSelectElement).value)}>
    ${parameter.options.map((option) => html`<option value=${option.value} selected=${option.value === value}>${option.label}</option>`)}
  </select>` as VNode;
}

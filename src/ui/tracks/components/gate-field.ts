import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { isWordSource, type Gate, type GateTest, type Read, type Source } from '../../../domain/modulation/schema.ts';
import { ReadFields, SourceFields } from './modulator-field.ts';

/** Les tests proposés, avec leur réglage d'ouverture. */
const TESTS: readonly { test: GateTest; label: string }[] = [
  { test: { kind: 'even' }, label: 'pair' },
  { test: { kind: 'odd' }, label: 'impair' },
  { test: { kind: 'at-least', k: 5 }, label: 'au moins' },
  { test: { kind: 'at-most', k: 5 }, label: 'au plus' },
  { test: { kind: 'euclid', k: 3, n: 8 }, label: 'Euclide' },
];

/** Un entier de 0 à 64 saisi dans la porte : accepté, ou refusé près du champ. */
function onCount(previous: number, min: number, apply: (value: number) => void) {
  return (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < min || value > 64 || input.value.trim() === '') {
      input.setCustomValidity(`Un entier entre ${min} et 64.`);
      input.reportValidity();
      input.value = String(previous);
      return;
    }
    input.setCustomValidity('');
    apply(value);
  };
}

type Draft = { source: Source; read: Read; test: GateTest };

/** Le test d'une porte posée, et ses nombres (k, n). */
function TestFields({ gate, onGate }: { gate: Gate; onGate: (gate: Draft) => void }): VNode {
  const { test } = gate;
  const withTest = (next: GateTest) => onGate({ ...gate, test: next });
  return html`<select aria-label="Test de la porte" onChange=${(event: Event) => withTest(TESTS[Number((event.currentTarget as HTMLSelectElement).value)]!.test)}>
      ${TESTS.filter((choice) => choice.test.kind !== 'euclid' || gate.source.kind === 'rank').map(
        (choice) => html`<option value=${TESTS.indexOf(choice)} selected=${choice.test.kind === test.kind}>${choice.label}</option>`,
      )}
    </select>
    ${(test.kind === 'at-least' || test.kind === 'at-most') &&
    html`<input type="number" step="1" min="0" max="64" aria-label="k" value=${test.k} onChange=${onCount(test.k, 0, (k) => withTest({ ...test, k }))} />`}
    ${test.kind === 'euclid' &&
    html`<input type="number" step="1" min="0" max="64" aria-label="Frappes k" value=${test.k} onChange=${onCount(test.k, 0, (k) => withTest({ ...test, k }))} />
      <span class="silk">sur</span>
      <input type="number" step="1" min="1" max="64" aria-label="Pas n" value=${test.n} onChange=${onCount(test.n, 1, (n) => withTest({ ...test, n }))} />`}` as VNode;
}

/**
 * La porte d'une instance, repliée tant qu'elle n'est pas posée : une source, le mot lu, un test.
 * `onGate` reçoit une porte à valider (le schéma refuse l'Euclide hors du rang), ou rien pour l'ôter.
 */
export function GateField({ gate, onGate }: { gate: Gate | undefined; onGate: (gate: Draft | undefined) => void }): VNode {
  return html`<details class="gate" open=${gate !== undefined}>
    <summary class="silk">Porte${gate ? '' : ' : tous les mots'}</summary>
    <${SourceFields} source=${gate?.source} label="porte"
      onSource=${(source: Source | undefined) =>
        onGate(source && { read: { kind: 'self' }, test: { kind: 'even' }, ...gate, source,
          ...(!isWordSource(source) && { read: { kind: 'self' } }), ...(source.kind !== 'rank' && gate?.test.kind === 'euclid' && { test: { kind: 'even' } }) })} />
    ${gate &&
    html`<${ReadFields} source=${gate.source} read=${gate.read} onRead=${(read: Read) => onGate({ ...gate, read })} />
      <${TestFields} gate=${gate} onGate=${onGate} />`}
  </details>` as VNode;
}

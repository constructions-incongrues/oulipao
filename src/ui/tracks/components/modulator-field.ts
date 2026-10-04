import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES } from '../../../domain/categories.ts';
import { isWordSource, SourceSchema, type Read, type Source } from '../../../domain/modulation/schema.ts';
import { sourceName } from '../modulation-statement.ts';
import { TRACK_NAMES } from '../types.ts';

/** Les sources proposées, dans l'ordre du menu, avec leur réglage d'ouverture. */
export const SOURCE_CHOICES: readonly Source[] = [
  { kind: 'letters' },
  { kind: 'syllables' },
  { kind: 'vowels' },
  { kind: 'letter', letter: 'e' },
  { kind: 'rank' },
  { kind: 'line' },
  { kind: 'pattern', values: [7, 0] },
  { kind: 'ramp', from: 1, to: 9 },
];

/** Lit un motif saisi (« 7, 0, 2 ») ; absent s'il n'est pas fait d'entiers. */
export function parsePattern(raw: string): number[] | undefined {
  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  const values = parts.map(Number);
  const parsed = SourceSchema.safeParse({ kind: 'pattern', values });
  return parts.length && values.every(Number.isInteger) && parsed.success ? values : undefined;
}

/** Refuse une saisie près du champ et remet la valeur précédente. */
function refuse(input: HTMLInputElement, message: string, previous: string) {
  input.setCustomValidity(message);
  input.reportValidity();
  input.value = previous;
}

/** Un entier saisi : accepté, ou refusé près du champ. */
function onInteger(previous: number, apply: (value: number) => void) {
  return (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (input.value.trim() === '' || !Number.isInteger(value) || Math.abs(value) > 999) return refuse(input, 'Un entier entre −999 et 999.', String(previous));
    input.setCustomValidity('');
    apply(value);
  };
}

/** Le choix d'une source : sa liste, puis les réglages propres à la source (lettre, motif, rampe). */
export function SourceFields({ source, label, onSource }: { source: Source | undefined; label: string; onSource: (source: Source | undefined) => void }): VNode {
  return html`<select aria-label=${`Source : ${label}`} onChange=${(event: Event) => {
      const kind = (event.currentTarget as HTMLSelectElement).value;
      onSource(SOURCE_CHOICES.find((choice) => choice.kind === kind));
    }}>
      <option value="fixed" selected=${!source}>fixe</option>
      ${SOURCE_CHOICES.map((choice) => html`<option value=${choice.kind} selected=${source?.kind === choice.kind}>${sourceName(choice).replace(/« .* »/, 'une lettre')}</option>`)}
    </select>
    ${source?.kind === 'letter' &&
    html`<input type="text" class="param-text mod-letter" maxlength="1" aria-label="Lettre comptée" value=${source.letter} onChange=${(event: Event) => {
      const input = event.currentTarget as HTMLInputElement;
      const parsed = SourceSchema.safeParse({ kind: 'letter', letter: input.value });
      if (!parsed.success) return refuse(input, 'Une seule lettre.', source.letter);
      input.setCustomValidity('');
      onSource(parsed.data);
    }} />`}
    ${source?.kind === 'pattern' &&
    html`<input type="text" class="param-text" aria-label="Motif" value=${source.values.join(', ')} onChange=${(event: Event) => {
      const input = event.currentTarget as HTMLInputElement;
      const values = parsePattern(input.value);
      if (!values) return refuse(input, 'Des entiers séparés par des virgules : « 7, 0, 2 ».', source.values.join(', '));
      input.setCustomValidity('');
      onSource({ kind: 'pattern', values });
    }} />`}
    ${source?.kind === 'ramp' &&
    html`<label class="silk">de<input type="number" step="1" aria-label="Début de la rampe" value=${source.from} onChange=${onInteger(source.from, (from) => onSource({ ...source, from }))} /></label>
      <label class="silk">à<input type="number" step="1" aria-label="Fin de la rampe" value=${source.to} onChange=${onInteger(source.to, (to) => onSource({ ...source, to }))} /></label>`}` as VNode;
}

/** Le mot lu : le mot lui-même, ou le plus proche d'une piste avant ou après lui. Seulement pour une source de mot. */
export function ReadFields({ source, read, onRead }: { source: Source; read: Read; onRead: (read: Read) => void }): VNode | null {
  if (!isWordSource(source)) return null;
  const neighbour = read.kind === 'neighbour' ? read : undefined;
  return html`<label class="silk">lu sur
      <select aria-label="Mot lu" onChange=${(event: Event) => {
        const value = (event.currentTarget as HTMLSelectElement).value;
        onRead(value === 'self' ? { kind: 'self' } : { kind: 'neighbour', track: neighbour?.track ?? 'adjective', side: value as 'before' | 'after' });
      }}>
        <option value="self" selected=${!neighbour}>le mot</option>
        <option value="after" selected=${neighbour?.side === 'after'}>le suivant</option>
        <option value="before" selected=${neighbour?.side === 'before'}>le précédent</option>
      </select>
    </label>
    ${neighbour &&
    html`<select aria-label="Piste du voisin" onChange=${(event: Event) => onRead({ ...neighbour, track: (event.currentTarget as HTMLSelectElement).value as typeof neighbour.track })}>
      ${CATEGORIES.map((track) => html`<option value=${track} selected=${track === neighbour.track}>${TRACK_NAMES[track].toLowerCase()}</option>`)}
    </select>`}` as VNode;
}

/** Un paramètre verrouillable : fixe, ou modulé par une source ; ses réglages se replient. */
export function ModulatorField({
  label,
  modulator,
  onModulator,
}: {
  label: string;
  modulator: { source: Source; read: Read; base: number; depth: number } | undefined;
  onModulator: (modulator: { source: Source; read: Read; base: number; depth: number } | undefined) => void;
}): VNode {
  const current = modulator;
  return html`<span class="modulator">
    <${SourceFields} source=${current?.source} label=${label}
      onSource=${(source: Source | undefined) => onModulator(source && { read: { kind: 'self' }, base: 0, depth: 1, ...current, source, ...(!isWordSource(source) && { read: { kind: 'self' } }) })} />
    ${current &&
    html`<details class="mod-settings">
      <summary class="silk">Réglages</summary>
      <${ReadFields} source=${current.source} read=${current.read} onRead=${(read: Read) => onModulator({ ...current, read })} />
      <label class="silk">base<input type="number" step="1" aria-label=${`Base : ${label}`} value=${current.base} onChange=${onInteger(current.base, (base) => onModulator({ ...current, base }))} /></label>
      <label class="silk">profondeur<input type="number" step="1" aria-label=${`Profondeur : ${label}`} value=${current.depth} onChange=${onInteger(current.depth, (depth) => onModulator({ ...current, depth }))} /></label>
    </details>`}
  </span>` as VNode;
}

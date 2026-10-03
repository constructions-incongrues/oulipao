import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { Notebook, keptCount, keptDate } from '../../../src/ui/tracks/components/notebook.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { initialState } from '../../../src/ui/tracks/mixer-state.ts';
import type { NotebookEntry } from '../../../src/ui/tracks/notebook.ts';
import { byClass, elements, find } from '../../support/vnode.ts';

const entry = (id: string, keptAt: string, mention = '\n\n— S+7 sur les noms (Oulipao)'): NotebookEntry => ({
  id,
  keptAt,
  result: `Texte ${id}.`,
  mention,
  source: { text: 'La ferme.', tagged: [] },
  mixer: initialState,
});

test('le compte des textes gardés, au singulier et au pluriel', () => {
  assert.deepEqual([0, 1, 3].map(keptCount), ['Aucun texte gardé', '1 texte gardé', '3 textes gardés']);
  assert.match(keptDate('2026-10-04T19:00:00.000Z'), /2026/);
});

test('Carnet : le compte, les entrées dans l’ordre reçu, leur date, texte et mention ; les gestes', async () => {
  const calls: string[] = [];
  const props = {
    entries: [entry('c', '2026-10-09T20:00:00.000Z'), entry('a', '2026-10-04T20:00:00.000Z', '')],
    message: 'Import : 1 texte ajouté, 0 déjà présent.',
    onReopen: (id: string) => calls.push(`rouvrir ${id}`),
    onRemove: (id: string) => calls.push(`supprimer ${id}`),
    onExport: () => calls.push('exporter'),
    onImport: (text: string) => calls.push(`importer ${text}`),
  };
  const notebook = html`<${Notebook} ...${props} />`;
  const out = renderToString(notebook);
  assert.match(out, /<h2 class="silk" id="notebook-title">Carnet<\/h2><span class="notebook-count">2 textes gardés<\/span>/);
  assert.match(out, /<time class="kept-at" datetime="2026-10-09T20:00:00.000Z">.*<p class="kept-text">Texte c\.<\/p><p class="kept-mention">S\+7 sur les noms \(Oulipao\)<\/p>.*Texte a\./s);
  assert.equal(out.match(/kept-mention/g)!.length, 1); // le texte d'origine n'a pas de mention
  assert.match(out, /role="status" aria-live="polite">Import : 1 texte ajouté/);
  assert.match(out, /Le carnet vit dans ce navigateur/);
  const buttons = elements(notebook).filter((e) => e.type === 'button');
  for (const button of buttons) (button.props['onClick'] as () => void)();
  assert.deepEqual(calls, ['exporter', 'rouvrir c', 'supprimer c', 'rouvrir a', 'supprimer a']);
  assert.match(String(buttons[1]!.props['aria-label']), /^Rouvrir le texte du .*2026/);

  const input = find(notebook, (e) => e.type === 'input');
  assert.equal(input.props['accept'], 'application/json,.json');
  const onChange = input.props['onChange'] as (event: Event) => Promise<void>;
  const target = { files: [{ text: async () => '{"version":1}' }], value: 'carnet.json' };
  await onChange({ currentTarget: target } as unknown as Event);
  assert.equal(calls.at(-1), 'importer {"version":1}');
  assert.equal(target.value, '');
  await onChange({ currentTarget: { files: [] } } as unknown as Event); // aucun fichier choisi
  assert.equal(calls.length, 6);
});

test('Carnet vide : aucun texte, pas de liste, export désactivé', () => {
  const out = renderToString(html`<${Notebook} entries=${[]} message="" onReopen=${() => {}} onRemove=${() => {}} onExport=${() => {}} onImport=${() => {}} />`);
  assert.match(out, /Aucun texte gardé/);
  assert.doesNotMatch(out, /notebook-entries/);
  assert.match(out, /class="key export" disabled/);
});

test('Texte résultant : « Garder » suit « Copier », désactivé comme lui', () => {
  let keeps = 0;
  const props = {
    segments: [{ text: 'Le', index: 0 }],
    empty: false,
    marks: new Map(),
    tracks: ['other'] as const,
    onSelect: () => {},
    changed: new Set<number>(),
    generation: 0,
    audibleCount: 5,
    stale: false,
    copyMessage: '',
    onCopy: () => {},
    onKeep: () => keeps++,
  };
  const result = html`<${Result} ...${props} />`;
  assert.match(renderToString(result), /class="key copy">Copier<\/button><button type="button" class="key keep">Garder<\/button>/);
  (find(result, byClass('keep')).props['onClick'] as () => void)();
  assert.equal(keeps, 1);
  assert.match(renderToString(html`<${Result} ...${{ ...props, stale: true }} />`), /class="key keep" disabled/);
  assert.match(renderToString(html`<${Result} ...${{ ...props, empty: true }} />`), /class="key keep" disabled/);
  assert.doesNotMatch(renderToString(html`<${Result} ...${{ ...props, onKeep: undefined }} />`), /Garder/);
});

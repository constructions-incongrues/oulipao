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

const TODAY = new Date(2026, 9, 12, 9);
const handlers = (calls: string[]) => ({
  onReopen: (id: string) => calls.push(`rouvrir ${id}`),
  onRemove: (id: string) => calls.push(`supprimer ${id}`),
  onExport: () => calls.push('exporter'),
  onImport: (text: string) => calls.push(`importer ${text}`),
  onCopy: (id: string) => calls.push(`copier ${id}`),
  onEdit: (id: string, text: string) => calls.push(`retoucher ${id} : ${text}`),
});

test('Carnet : un panneau replié dont l’en-tête donne le compte et les jours ; les entrées et leurs gestes', async () => {
  const calls: string[] = [];
  const props = {
    entries: [{ ...entry('c', new Date(2026, 9, 9, 22).toISOString()), edited: 'Texte c retouché.' }, entry('a', '2026-10-04T20:00:00.000Z', '')],
    message: 'Import : 1 texte ajouté, 0 déjà présent.',
    today: TODAY,
    ...handlers(calls),
  };
  const notebook = html`<${Notebook} ...${props} />`;
  const out = renderToString(notebook);
  assert.match(out, /^<details class="notebook"><summary class="notebook-summary"><span class="silk">Carnet<\/span><span class="notebook-count">2 textes gardés · dernier texte il y a 3 jours<\/span><\/summary>/);
  assert.match(out, /<p class="kept-text">Texte c retouché\.<\/p><p class="kept-mention">S\+7 sur les noms \(Oulipao\) · retouché<\/p>.*<p class="kept-text">Texte a\.<\/p><div class="kept-actions">/s);
  assert.match(out, /<textarea name="text" rows="6" aria-label="Texte retouché">Texte c retouché\.<\/textarea>/);
  // Chaque entrée est repliée sur une ligne : sa date et ses premiers mots.
  assert.match(out, /<li class="notebook-entry"><details class="kept"><summary class="kept-summary"><time class="kept-at" datetime="[^"]+">[^<]+<\/time><span class="kept-preview">Texte c retouché\.<\/span><span class="kept-rule">S\+7 sur les noms<\/span><\/summary>/);
  // La mention commence par une majuscule, comme une phrase.
  const lower = renderToString(html`<${Notebook} ...${{ ...props, entries: [{ ...entry('b', '2026-10-04T20:00:00.000Z'), mention: '\n\n— lipogramme en e (Oulipao)' }] }} />`);
  assert.match(lower, /<p class="kept-mention">Lipogramme en e \(Oulipao\)<\/p>/);
  // Repliée, l'entrée dit aussi ce qui a fait le texte : deux entrées d'un même poème se distinguent.
  assert.match(lower, /<span class="kept-preview">Texte b\.<\/span><span class="kept-rule">Lipogramme en e<\/span><\/summary>/);
  assert.match(out, /role="status" aria-live="polite">Import : 1 texte ajouté/);
  assert.match(out, /Le carnet vit dans ce navigateur/);
  const buttons = elements(notebook).filter((e) => e.type === 'button' && e.props['type'] === 'button');
  for (const button of buttons) (button.props['onClick'] as () => void)();
  assert.deepEqual(calls, ['exporter', 'copier c', 'rouvrir c', 'supprimer c', 'copier a', 'rouvrir a', 'supprimer a']);
  assert.match(String(buttons[1]!.props['aria-label']), /^Copier le texte du .*2026/);

  const input = find(notebook, (e) => e.type === 'input');
  assert.equal(input.props['accept'], 'application/json,.json');
  const onChange = input.props['onChange'] as (event: Event) => Promise<void>;
  const target = { files: [{ text: async () => '{"version":1}' }], value: 'carnet.json' };
  await onChange({ currentTarget: target } as unknown as Event);
  assert.equal(calls.at(-1), 'importer {"version":1}');
  assert.equal(target.value, '');
  await onChange({ currentTarget: { files: [] } } as unknown as Event); // aucun fichier choisi
  assert.equal(calls.length, 8);
});

test('Retoucher : enregistrer envoie le brouillon et replie ; annuler replie sans rien envoyer', () => {
  const calls: string[] = [];
  const notebook = html`<${Notebook} entries=${[entry('a', '2026-10-04T20:00:00.000Z')]} message="" today=${TODAY} ...${handlers(calls)} />`;
  const form = find(notebook, (e) => e.type === 'form');
  const details = { open: true };
  const formElement = { elements: { namedItem: () => ({ value: "L'oncle dort." }) }, closest: () => details };
  let prevented = false;
  (form.props['onSubmit'] as (event: Event) => void)({ preventDefault: () => (prevented = true), currentTarget: formElement } as unknown as Event);
  assert.deepEqual(calls, ["retoucher a : L'oncle dort."]);
  assert.equal(prevented, true);
  assert.equal(details.open, false);
  details.open = true;
  (form.props['onReset'] as (event: Event) => void)({ currentTarget: { closest: () => details } } as unknown as Event);
  assert.equal(details.open, false);
  (form.props['onReset'] as (event: Event) => void)({ currentTarget: { closest: () => null } } as unknown as Event); // hors d'un panneau : rien à replier
  assert.equal(calls.length, 1);
});

test('Carnet vide : aucun texte, pas de jours, pas de liste, export désactivé', () => {
  const out = renderToString(html`<${Notebook} entries=${[]} message="" today=${TODAY} ...${handlers([])} />`);
  assert.match(out, /<span class="notebook-count">Aucun texte gardé<\/span>/);
  assert.doesNotMatch(out, /notebook-entries|dernier texte/);
  assert.match(out, /class="key export" disabled/);
  assert.doesNotMatch(out, /<details class="notebook" open/);
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

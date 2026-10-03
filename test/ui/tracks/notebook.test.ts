import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState } from '../../../src/ui/tracks/mixer-state.ts';
import { addEntry, daysSince, editEntry, entryClipboard, exportFileName, lastKeptLabel, mergeEntries, parseNotebook, removeEntry, serializeNotebook, type NotebookEntry } from '../../../src/ui/tracks/notebook.ts';

const entry = (id: string, keptAt: string): NotebookEntry => ({
  id,
  keptAt,
  result: `texte ${id}`,
  mention: '\n\n— S+7 sur les noms (Oulipao)',
  source: { text: 'La ferme.', tagged: [{ word: 'La', category: 'other' }, { word: 'ferme', category: 'noun' }] },
  mixer: initialState,
});
const a = entry('a', '2026-10-04T20:00:00.000Z');
const b = entry('b', '2026-10-06T21:00:00.000Z');
const c = entry('c', '2026-10-09T22:00:00.000Z');

test('aller-retour : un carnet sérialisé se relit à l’identique, du plus récent au plus ancien', () => {
  const read = parseNotebook(serializeNotebook([a, c, b]));
  assert.deepEqual(read, { entries: [c, b, a], rejected: 0 });
});

test('pas encore de carnet : vide, sans erreur', () => {
  assert.deepEqual(parseNotebook(null), { entries: [], rejected: 0 });
});

test('une entrée abîmée est comptée et laissée de côté, les autres restent', () => {
  const { keptAt: _, ...undated } = b;
  const read = parseNotebook(JSON.stringify({ version: 1, entries: [a, undated, c] }));
  assert.deepEqual(read.entries, [c, a]);
  assert.equal(read.rejected, 1);
  assert.equal(read.error, undefined);
});

test('un texte qui n’est pas un carnet : vide, avec une erreur', () => {
  assert.deepEqual(parseNotebook('{pas du json'), { entries: [], rejected: 0, error: 'Le carnet est illisible.' });
  assert.match(parseNotebook('{"chat":1}').error!, /pas un carnet/);
  assert.match(parseNotebook('{"version":2,"entries":[]}').error!, /pas un carnet/);
});

test('ajouter et supprimer', () => {
  assert.deepEqual(addEntry([a, b], c), [c, b, a]);
  assert.deepEqual(removeEntry([c, b, a], 'b'), [c, a]);
  assert.deepEqual(removeEntry([c, a], 'z'), [c, a]);
});

test('fusion : seules les entrées nouvelles s’ajoutent, les doublons sont comptés', () => {
  const d = entry('d', '2026-10-10T08:00:00.000Z');
  const merged = mergeEntries([a, b, c], JSON.stringify({ version: 1, entries: [a, b, c, d, { id: 'cassée' }] }));
  assert.deepEqual(merged.entries, [d, c, b, a]);
  assert.equal(merged.added, 1);
  assert.equal(merged.present, 3);
  assert.equal(merged.rejected, 1);
  const refused = mergeEntries([a], '[]');
  assert.deepEqual(refused.entries, [a]);
  assert.match(refused.error!, /pas un carnet/);
  assert.equal(refused.added, 0);
});

test('le nom du fichier exporté porte la date du jour', () => {
  assert.equal(exportFileName(new Date(2026, 9, 3, 23, 30)), 'oulipao-carnet-2026-10-03.json');
});

test('retouche : posée, gardée à la sérialisation, retirée si vide ou égale au résultat', () => {
  const edited = editEntry([a, b], 'a', "L'oncle dort.");
  assert.equal(edited[0]!.edited, "L'oncle dort.");
  assert.equal(edited[1], b);
  assert.deepEqual(parseNotebook(serializeNotebook(edited)).entries.find((e) => e.id === 'a')!.edited, "L'oncle dort.");
  assert.equal('edited' in editEntry(edited, 'a', '  ')[0]!, false);
  assert.equal('edited' in editEntry(edited, 'a', a.result)[0]!, false);
  assert.deepEqual(editEntry([a], 'z', 'x'), [a]);
  assert.equal(parseNotebook(serializeNotebook([a])).entries[0]!.edited, undefined); // une entrée sans retouche reste valide
});

test('copie d’une entrée : l’original, une ligne vide, le résultat (retouché), la chaîne', () => {
  const entry = { ...a, source: { ...a.source, text: 'La ferme.' }, result: "L'oncle." };
  assert.equal(entryClipboard(entry), "La ferme.\n\nL'oncle.\n\n— S+7 sur les noms (Oulipao)");
  assert.equal(entryClipboard({ ...entry, edited: "L'oncle dort." }), "La ferme.\n\nL'oncle dort.\n\n— S+7 sur les noms (Oulipao)");
  assert.equal(entryClipboard({ ...entry, mention: '' }), "La ferme.\n\nL'oncle.");
});

test('jours depuis la dernière garde, en jours de calendrier', () => {
  const late = new Date(2026, 9, 12, 23, 50).toISOString();
  assert.equal(daysSince(late, new Date(2026, 9, 12, 23, 59)), 0);
  assert.equal(daysSince(late, new Date(2026, 9, 13, 0, 10)), 1);
  assert.equal(daysSince(new Date(2026, 9, 9, 12).toISOString(), new Date(2026, 9, 12, 8)), 3);
  assert.deepEqual([0, 1, 3].map(lastKeptLabel), ['aujourd’hui', 'hier', 'il y a 3 jours']);
});

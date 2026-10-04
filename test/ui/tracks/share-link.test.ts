import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState } from '../../../src/ui/tracks/mixer-state.ts';
import type { NotebookEntry } from '../../../src/ui/tracks/notebook.ts';
import { decodeFragment, encodeEntry, isShareFragment, LONG_LINK, type SharedEntry } from '../../../src/ui/tracks/share-link.ts';

const kept: NotebookEntry = {
  id: 'a',
  keptAt: '2026-10-04T20:00:00.000Z',
  result: 'L’oncle.',
  mention: '\n\n— S+7 sur les noms (Oulipao)',
  source: { text: 'La ferme.', tagged: [{ word: 'La', category: 'other' }, { word: 'ferme', category: 'noun' }] },
  mixer: initialState,
};
const { id: _, keptAt: __, ...shared } = kept;

const deflate = async (text: string) => {
  const bytes = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

test('aller-retour : une entrée partagée se relit sans son identifiant ni sa date de garde', async () => {
  const fragment = await encodeEntry(kept);
  assert.match(fragment, /^v1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(await decodeFragment(`#${fragment}`), shared);
});

test('aller-retour : la retouche et la filiation voyagent avec l’entrée', async () => {
  const entry: SharedEntry = { ...shared, edited: 'L’oncle dort.', lineage: { parent: 'p', ancestor: 'La ferme.', passes: ['S+7 sur les noms'] } };
  assert.deepEqual(await decodeFragment(await encodeEntry(entry)), entry);
});

test('un fragment étranger n’est pas un lien d’Oulipao', async () => {
  assert.equal(await decodeFragment('#haut'), undefined);
  assert.equal(await decodeFragment(''), undefined);
  assert.equal(isShareFragment('#haut'), false);
  assert.equal(isShareFragment('#v1.abc'), true);
  assert.equal(isShareFragment('v9.abc'), true);
});

test('une version inconnue est illisible', async () => {
  assert.equal(await decodeFragment('#v9.abc'), 'unreadable');
});

test('un lien tronqué par une messagerie est illisible', async () => {
  const fragment = await encodeEntry(kept);
  assert.equal(await decodeFragment(fragment.slice(0, -8)), 'unreadable');
});

test('des caractères hors base64url sont illisibles', async () => {
  assert.equal(await decodeFragment('v1.a+b/c'), 'unreadable');
});

test('un JSON lisible mais hors du schéma est illisible', async () => {
  assert.equal(await decodeFragment(`v1.${await deflate(JSON.stringify({ result: 'x' }))}`), 'unreadable');
  assert.equal(await decodeFragment(`v1.${await deflate('pas du json')}`), 'unreadable');
});

test('une entrée qui se décompresse au-delà d’un million d’octets est refusée', async () => {
  assert.equal(await decodeFragment(`v1.${await deflate(' '.repeat(1_100_000))}`), 'unreadable');
});

test('un poème de 30 vers, étiqueté, tient sous la limite d’un lien long', async () => {
  const words = 'Les sanglots longs des violons de l’automne blessent mon cœur d’une langueur monotone tout suffocant et blême quand sonne l’heure je me souviens des jours anciens et je pleure'.split(' ');
  const lines = Array.from({ length: 30 }, (_, line) => Array.from({ length: 10 }, (_, index) => words[(line * 7 + index * 3) % words.length]).join(' '));
  const text = lines.join('\n');
  const tagged = text.split(/\s+/).map((word, index) => ({ word, category: index % 3 ? ('other' as const) : ('noun' as const) }));
  const entry: SharedEntry = { ...shared, source: { text, tagged }, result: text.replaceAll('cœur', 'cuistot'), edited: text };
  assert.ok((await encodeEntry(entry)).length < LONG_LINK);
});

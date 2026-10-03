import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FORM_STANZAS, layoutForm, type Form } from '../../../src/domain/forms/form.ts';
import type { MixedSegment } from '../../../src/domain/mixing.ts';

/** Des vers v1, v2… : chaque vers est un mot (index k) suivi d'un point. */
const verses = (count: number, stanzaAfter?: number): MixedSegment[] =>
  Array.from({ length: count }, (_, k) => [
    ...(k ? [{ text: k === stanzaAfter ? '\n\n' : '\n' }] : []),
    { text: `v${k + 1}`, index: k },
    { text: '.' },
  ]).flat();

const text = (segments: readonly MixedSegment[]) => segments.map((segment) => segment.text).join('');
const shape = (segments: readonly MixedSegment[]) => text(segments).replaceAll('.', '').split('\n\n').map((stanza) => stanza.split('\n').join(' ')).join(' / ');
const form = (count: number, name: Form, stanzaAfter?: number) => layoutForm(verses(count, stanzaAfter), name);

test('aucune forme : le texte reste tel quel', () => {
  const segments = verses(3);
  assert.deepEqual(layoutForm(segments, 'none'), { segments, missing: 0 });
});

test('rondel, dix vers : trois strophes, refrains aux vers 7, 8 et 13 ; les sauts de strophe de l’auteur tombent', () => {
  const { segments, missing } = form(10, 'rondel', 5);
  assert.equal(shape(segments), 'v1 v2 v3 v4 / v5 v6 v1 v2 / v7 v8 v9 v10 v1');
  assert.equal(missing, 0);
  const copies = segments.filter((segment) => segment.copyOf);
  assert.deepEqual(copies.filter((segment) => segment.index !== undefined).map(({ index, copyOf }) => [index, copyOf]), [[0, 1], [1, 2], [0, 1]]);
});

test('villanelle, treize vers : cinq tercets et un quatrain', () => {
  const { segments, missing } = form(13, 'villanelle');
  assert.equal(shape(segments), 'v1 v2 v3 / v4 v5 v1 / v6 v7 v3 / v8 v9 v1 / v10 v11 v3 / v12 v13 v1 v3');
  assert.equal(missing, 0);
  assert.equal(FORM_STANZAS.villanelle.flat().length, 19);
});

test('six vers en rondel : la forme s’arrête après les refrains de la deuxième strophe, il manque quatre vers', () => {
  const { segments, missing } = form(6, 'rondel');
  assert.equal(shape(segments), 'v1 v2 v3 v4 / v5 v6 v1 v2');
  assert.equal(missing, 4);
});

test('douze vers en rondel : les vers 11 et 12 suivent dans une strophe à part', () => {
  assert.equal(shape(form(12, 'rondel').segments), 'v1 v2 v3 v4 / v5 v6 v1 v2 / v7 v8 v9 v10 v1 / v11 v12');
});

test('texte vide : rien à poser, tous les vers manquent', () => {
  assert.deepEqual(layoutForm([{ text: '\n\n' }], 'rondel'), { segments: [], missing: 10 });
});

test('éclipse : le texte d’origine, une ligne vide, puis le texte résultant ; rien ne manque', () => {
  const segments = verses(2);
  const { segments: out, missing } = layoutForm(segments, 'eclipse', 'u1.\nu2.');
  assert.equal(text(out), 'u1.\nu2.\n\nv1.\nv2.');
  assert.equal(missing, 0);
  assert.equal(out[0]!.index, undefined); // le texte d'origine ne s'inspecte pas
  assert.deepEqual(out.slice(2), segments);
  assert.equal(text(layoutForm(segments, 'eclipse').segments), '\n\nv1.\nv2.');
});

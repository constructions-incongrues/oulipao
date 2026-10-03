import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CATEGORIES } from '../../../src/domain/categories.ts';
import { ReferenceTextSchema } from '../../../src/domain/reference-text.ts';
import { DEFAULT_WIDTH, layoutScore } from '../../../src/ui/tracks/score-layout.ts';
import { ScoreLayoutSchema } from '../../../src/ui/tracks/types.ts';
import { tag } from '../../support/morphology.ts';

test('un système : la règle et un bloc par mot, sur sa piste, à sa colonne', () => {
  const text = 'La vieille ferme dort.';
  const { systems } = layoutScore(text, tag(text));
  assert.equal(systems.length, 1);
  assert.equal(systems[0]!.ruler, text);
  assert.deepEqual(systems[0]!.lanes, {
    noun: [{ index: 2, label: 'ferme', column: 11, width: 5 }],
    verb: [{ index: 3, label: 'dort', column: 17, width: 4 }],
    adjective: [{ index: 1, label: 'vieille', column: 3, width: 7 }],
    adverb: [],
    other: [{ index: 0, label: 'La', column: 0, width: 2 }],
  });
});

test('retour à la ligne : entre deux mots, à la largeur donnée et à chaque saut de ligne', () => {
  const text = "La vieille ferme du village dort.\nL'horloge aussi ; elle dort ?\n\nFin";
  const { systems } = layoutScore(text, tag(text), new Map(), 16);
  assert.deepEqual(systems.map((s) => s.ruler), ['La vieille ferme', 'du village dort.', "L'horloge aussi", '; elle dort ?', 'Fin']);
  assert.ok(systems.every((s) => s.ruler.length <= 16));
  // colonnes comptées depuis le début de chaque système
  assert.deepEqual(systems[1]!.lanes.noun, [{ index: 4, label: 'village', column: 3, width: 7 }]);
  assert.deepEqual(systems[2]!.lanes.other[0], { index: 6, label: "L'", column: 0, width: 2 });
});

test('un mot plus long que la largeur n’est pas coupé', () => {
  const text = 'Un anticonstitutionnellement long';
  const { systems } = layoutScore(text, tag(text), new Map(), 10);
  assert.deepEqual(systems.map((s) => s.ruler), ['Un', 'anticonstitutionnellement', 'long']);
  assert.equal(systems[1]!.lanes.other[0]!.width, 25);
});

test('libellés : le mot remplacé, élargi sans déborder sur le bloc suivant ni sur la fin du système', () => {
  const text = 'le chat et le chat';
  const labels = new Map([[1, 'hippopotame'], [4, 'hippopotame']]);
  const { systems } = layoutScore(text, tag(text), labels, 20);
  assert.deepEqual(systems[0]!.lanes.noun, [
    { index: 1, label: 'hippopotame', column: 3, width: 10 }, // jusqu'au bloc suivant de la piste, moins un
    { index: 4, label: 'hippopotame', column: 14, width: 6 }, // jusqu'à la fin du système
  ]);
  const short = layoutScore('le chat', tag('le chat'), new Map([[1, 'if']])).systems[0]!.lanes.noun[0]!;
  assert.deepEqual(short, { index: 1, label: 'if', column: 3, width: 4 }); // jamais plus étroit que le mot d'origine
});

test('texte de 200 mots : systèmes à la largeur demandée, cinq pistes, un bloc par mot', () => {
  const reference = ReferenceTextSchema.parse(JSON.parse(readFileSync(new URL('../../../reference/texte-1.json', import.meta.url), 'utf8')));
  const layout = ScoreLayoutSchema.parse(layoutScore(reference.text, reference.words));
  assert.ok(layout.systems.length > 10);
  assert.ok(layout.systems.every((s) => s.ruler.length <= DEFAULT_WIDTH && Object.keys(s.lanes).length === 5));
  const blocks = layout.systems.flatMap((s) => CATEGORIES.flatMap((c) => s.lanes[c].map((b) => ({ ...b, ruler: s.ruler, category: c }))));
  assert.deepEqual(blocks.map((b) => b.index).sort((a, b) => a - b), reference.words.map((_, i) => i));
  for (const block of blocks) {
    assert.equal(block.ruler.slice(block.column, block.column + block.label.length), reference.words[block.index]!.word);
    assert.equal(block.category, reference.words[block.index]!.category);
  }
});

test('texte vide, et mots étiquetés qui ne suivent pas le découpage', () => {
  assert.deepEqual(layoutScore('', []), { systems: [] });
  assert.deepEqual(layoutScore(' \n… ', []), { systems: [{ ruler: '…', lanes: { noun: [], verb: [], adjective: [], adverb: [], other: [] } }] });
  assert.throws(() => layoutScore('Le chat', tag('Le')), /ne correspondent pas/);
});

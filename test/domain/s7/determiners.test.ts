import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DeterminerSchema, identifyDeterminer } from '../../../src/domain/s7/determiners.ts';
import { elides, realizeDeterminer } from '../../../src/domain/s7/elision.ts';
import { morphology } from '../../support/morphology.ts';

const kindOf = (...words: string[]) => identifyDeterminer(words)?.determiner.kind;

test('la table couvre chaque déterminant, au singulier, au pluriel et élidé', () => {
  const listed = ['le', 'la', "l'", 'les', 'un', 'une', 'des', 'du', 'au', 'aux', 'ce', 'cet', 'cette', 'ces',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'de', "d'"];
  for (const word of listed) {
    const identified = identifyDeterminer([word]);
    assert.ok(identified, word);
    assert.equal(identified.consumed, 1);
    DeterminerSchema.parse(identified.determiner);
  }
  assert.equal(identifyDeterminer(['Les'])?.determiner.number, 'p');
  assert.equal(identifyDeterminer(['L’'])?.determiner.kind, 'definite');
});

test('articles contractés écrits en deux mots', () => {
  assert.deepEqual(identifyDeterminer(['de', 'la']), { determiner: { kind: 'de-definite', number: 's', gender: 'f' }, consumed: 2 });
  assert.deepEqual(identifyDeterminer(['de', "l'"]), { determiner: { kind: 'de-definite', number: 's' }, consumed: 2 });
  assert.equal(kindOf('à', 'la'), 'a-definite');
  assert.equal(kindOf('À', 'l’'), 'a-definite');
  assert.deepEqual(identifyDeterminer(['vers', 'la']), { determiner: { kind: 'definite', number: 's', gender: 'f' }, consumed: 1 });
  assert.equal(identifyDeterminer(['de', 'le'])?.consumed, 1); // « de le » n'est pas un article contracté
  assert.equal(identifyDeterminer(['de', 'les'])?.consumed, 1);
});

test('ce qui n’est pas un déterminant connu', () => {
  assert.equal(identifyDeterminer([]), undefined);
  assert.equal(identifyDeterminer(['quelques']), undefined);
  assert.equal(identifyDeterminer(['la', 'vers']), undefined);
});

test('elides : voyelle ou h muet, sauf interdiction du lexique', () => {
  const m = morphology();
  assert.equal(elides('arbre', m), true);
  assert.equal(elides('École', m), true);
  assert.equal(elides('horloge', m), true);
  assert.equal(elides('héros', m), false);
  assert.equal(elides('Héros', m), false);
  assert.equal(elides('chat', m), false);
});

const realize = (words: string[], gender: 'm' | 'f', nextElides: boolean, number: 's' | 'p' = 's', apostrophe?: string) =>
  realizeDeterminer(identifyDeterminer(words)!.determiner, { gender, number, nextElides, apostrophe }).join(' ');

test('realizeDeterminer : genre, élision, contraction', () => {
  assert.equal(realize(['le'], 'f', false), 'la');
  assert.equal(realize(['la'], 'm', false), 'le');
  assert.equal(realize(['le'], 'f', true), "l'");
  assert.equal(realize(["l'"], 'm', false), 'le');
  assert.equal(realize(['les'], 'f', true), 'les');
  assert.equal(realize(['un'], 'f', true), 'une');
  assert.equal(realize(['une'], 'm', false), 'un');
  assert.equal(realize(['des'], 'm', false), 'des');
  assert.equal(realize(['du'], 'f', false), 'de la');
  assert.equal(realize(['du'], 'm', true), "de l'");
  assert.equal(realize(['de', 'la'], 'm', false), 'du');
  assert.equal(realize(['de', "l'"], 'f', false), 'de la');
  assert.equal(realize(['au'], 'f', false), 'à la');
  assert.equal(realize(['au'], 'm', true), "à l'");
  assert.equal(realize(['à', 'la'], 'm', false), 'au');
  assert.equal(realize(['aux'], 'f', false), 'aux');
  assert.equal(realize(['ce'], 'm', true), 'cet');
  assert.equal(realize(['cet'], 'm', false), 'ce');
  assert.equal(realize(['ce'], 'f', true), 'cette');
  assert.equal(realize(['ces'], 'f', false), 'ces');
  assert.equal(realize(['ma'], 'f', true), 'mon');
  assert.equal(realize(['mon'], 'f', false), 'ma');
  assert.equal(realize(['ta'], 'm', false), 'ton');
  assert.equal(realize(['ses'], 'f', false), 'ses');
  assert.equal(realize(['de'], 'm', true), "d'");
  assert.equal(realize(["d'"], 'f', false), 'de');
  assert.equal(realize(['de'], 'f', false, 'p'), 'de');
});

test('realizeDeterminer : apostrophe du texte d’origine', () => {
  assert.equal(realize(['le'], 'm', true, 's', '’'), 'l’');
  assert.equal(realize(['du'], 'm', true, 's', '’'), 'de l’');
  assert.equal(realize(['de'], 'm', true, 's', '’'), 'd’');
});

test('realizeDeterminer : possessif sans possesseur déclaré', () => {
  assert.deepEqual(realizeDeterminer({ kind: 'possessive' }, { gender: 'm', number: 's', nextElides: false }), ['son']);
  assert.deepEqual(realizeDeterminer({ kind: 'possessive' }, { gender: 'f', number: 'p', nextElides: false }), ['ses']);
});

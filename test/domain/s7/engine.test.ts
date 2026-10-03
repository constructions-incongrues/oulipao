import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyS7 } from '../../../src/domain/s7/engine.ts';
import { S7ResultSchema, type S7OptionsInput } from '../../../src/domain/s7/types.ts';
import { morphology, tag } from '../../support/morphology.ts';

const m = morphology();
const s7 = (text: string, options: S7OptionsInput) => applyS7(text, tag(text), options, m).text;
const strict = (text: string, offset: number) => s7(text, { offset, mode: 'reagree' });
const same = (text: string, offset: number) => s7(text, { offset, mode: 'same-gender' });

test('réaccord : le déterminant prend le genre du nouveau nom', () => {
  assert.equal(strict('La ferme de mon oncle.', 1), 'Le fermoir de mon village.');
  assert.equal(strict('une ferme, un village', 1), 'un fermoir, une ville');
  assert.equal(strict('cette ferme et ce village', 1), 'ce fermoir et cette ville');
  assert.equal(strict('sa ferme, son village, ses chevaux', 1), 'son fermoir, sa ville, ses écoles');
});

test('élision et contraction suivent le nouveau nom', () => {
  assert.equal(strict("l'horloge du village", 1), "l'hôtel de la ville");
  assert.equal(strict('au camion', 1), 'au chat');
  assert.equal(strict('au camion', -1), "à l'arbre");
  assert.equal(strict("à l'arbre", 1), 'au camion');
  assert.equal(strict('à la ferme', 1), 'au fermoir');
  assert.equal(strict("de l'école", 1), 'de la ferme');
  assert.equal(strict('de la ferme', -1), "de l'école");
  assert.equal(strict('de la ferme', 1), 'du fermoir');
  assert.equal(strict('le héros', 1), "l'horloge");
  assert.equal(strict("l'horloge", -1), 'le héros'); // h aspiré : pas d'élision
  assert.equal(strict('ce fermoir', 3), 'cet hôtel');
  assert.equal(strict('ma ferme', -1), 'mon école');
  assert.equal(strict('beaucoup de chats', 2), "beaucoup d'écoles");
  assert.equal(strict("pas d'arbres", 1), 'pas de camions');
  assert.equal(strict('aux fermes, les fermes, des fermes', 1), 'aux fermoirs, les fermoirs, des fermoirs');
});

test('apostrophe typographique du texte d’origine conservée', () => {
  assert.equal(strict('l’arbre et le héros', 1), 'le camion et l’horloge');
});

test('réaccord : les adjectifs contigus suivent, avant et après le nom', () => {
  assert.equal(strict('la vieille ferme', 1), 'le vieux fermoir');
  assert.equal(strict('le vieux fermoir', -2), 'la vieille école');
  assert.equal(strict('un vieux chat', -2), 'un vieil arbre');
  assert.equal(strict('un petit chat gris', 2), 'une petite école grise');
  assert.equal(strict('les petites fermes grises', 1), 'les petits fermoirs gris');
  assert.equal(strict('une très vieille ferme', 1), 'un très vieux fermoir');
  assert.equal(strict('un chat très gris', 2), 'une école très grise');
  assert.equal(strict('Vieille ferme !', 1), 'Vieux fermoir !');
});

test('ce qui n’est pas contigu n’est pas réaccordé', () => {
  assert.equal(strict('la ferme, vieille et grise', 1), 'le fermoir, vieille et grise');
  assert.equal(strict('la ferme est grise', 1), 'le fermoir est grise');
  assert.equal(strict('quelques fermes', 1), 'quelques fermoirs'); // déterminant hors table : laissé
  assert.equal(strict('il ne dort pas, chat', 1), 'il ne dort pas, cheval');
});

test('même genre : seul le nom change, avec élision et forme devant voyelle', () => {
  assert.equal(same('la ferme', 1), "l'horloge");
  assert.equal(same("l'horloge", -1), 'la ferme');
  assert.equal(same('ma ferme', 1), 'mon horloge');
  assert.equal(same('mon horloge', -1), 'ma ferme');
  assert.equal(same('la vieille ferme du village', 1), "la vieille horloge du voisin");
  assert.equal(same('un beau chat', -2), 'un bel arbre');
  assert.equal(same('un bel arbre', 2), 'un beau chat');
  assert.equal(same('le livre et la livre', 1), "l'oncle et la maison"); // épicène : genre du déterminant
});

test('+n puis −n redonne le texte d’origine, en mode même genre', () => {
  const text = "La vieille ferme de mon oncle, l'horloge du village et les chevaux gris.";
  const there = applyS7(text, tag(text), { offset: 3, mode: 'same-gender' }, m);
  assert.notEqual(there.text, text);
  assert.equal(same(there.text, -3), text);
});

test('nom inconnu ou forme manquante : laissé, signalé, groupe intact', () => {
  const text = 'La Zorglub et les arbres';
  const result = applyS7(text, tag(text, { Zorglub: 'noun' }), { offset: -1, mode: 'reagree' }, m);
  assert.equal(result.text, text);
  assert.deepEqual(result.substitutions, [
    { index: 1, original: 'Zorglub', replacement: 'Zorglub', status: 'unknown-noun', before: 'La Zorglub', after: 'La Zorglub' },
    { index: 4, original: 'arbres', replacement: 'arbres', status: 'missing-form', before: 'les arbres', after: 'les arbres' },
  ]);
});

test('liste des substitutions : position, mots, groupe avant et après', () => {
  const text = "Il voit la vieille ferme de l'oncle.";
  const result = S7ResultSchema.parse(applyS7(text, tag(text), { offset: 1, mode: 'reagree' }, m));
  assert.equal(result.text, 'Il voit le vieux fermoir du village.');
  assert.deepEqual(result.substitutions, [
    { index: 4, original: 'ferme', replacement: 'fermoir', status: 'replaced', before: 'la vieille ferme', after: 'le vieux fermoir' },
    { index: 7, original: 'oncle', replacement: 'village', status: 'replaced', before: "de l'oncle", after: 'du village' },
  ]);
});

test('casse, ponctuation et espaces conservés ; déterministe', () => {
  const text = '  « Ferme » ?\nLes CHATS — et l’École…  ';
  const once = strict(text, 1);
  assert.equal(once, '  « Fermoir » ?\nLes Chevaux — et la Ferme…  ');
  assert.equal(strict(text, 1), once);
  assert.equal(strict('', 7), '');
  assert.equal(strict('… 42 !', 7), '… 42 !');
});

test('options : valeurs par défaut et validation par le schéma', () => {
  assert.equal(s7('ferme', {}), same('ferme', 7));
  assert.throws(() => s7('ferme', { offset: 1.5 }));
  assert.throws(() => s7('ferme', { mode: 'au hasard' as never }));
  assert.throws(() => s7('ferme', { category: 'verb' as never }));
});

test('refuse des mots étiquetés qui ne suivent pas le découpage', () => {
  assert.throws(() => applyS7('La ferme', tag('La'), {}, m), /ne correspondent pas au découpage/);
  assert.throws(() => applyS7('La ferme', tag('Le fermoir'), {}, m), /ne correspondent pas au découpage/);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Category } from '../../../src/domain/categories.ts';
import { applyS7 } from '../../../src/domain/s7/engine.ts';
import { S7ResultSchema, type S7OptionsInput } from '../../../src/domain/s7/types.ts';
import { morphology, tag } from '../../support/morphology.ts';

const m = morphology();
const s7 = (text: string, options: S7OptionsInput) => applyS7(text, tag(text), options, m).text;
const strict = (text: string, offset: number, extra: Record<string, Category> = {}) =>
  applyS7(text, tag(text, extra), { offset, mode: 'reagree' }, m).text;
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

test('adjectifs apposés ou coordonnés après le nom', () => {
  assert.equal(strict('la ferme, vieille et grise', 1), 'le fermoir, vieux et gris');
  assert.equal(strict('une ferme grise, petite ou très vieille, fermée', 1), 'un fermoir gris, petit ou très vieux, fermé');
  assert.equal(strict('la ferme grise et les petits chats', 1), 'le fermoir gris et les petits chevaux'); // « petits » va avec « chats »
  assert.equal(strict('la ferme, petite maison', 1), 'le fermoir, petit oncle'); // idem après une virgule
  assert.equal(strict('la ferme ; grise', 1), 'le fermoir ; grise'); // autre ponctuation : coupé
  assert.equal(strict('la ferme et vite', 1), 'le fermoir et vite');
});

test('déterminants variables et invariables', () => {
  assert.equal(strict('Certaines fermes', 1), 'Certains fermoirs');
  assert.equal(strict('quelle ferme, aucun village, nulle ferme', 1), 'quel fermoir, aucune ville, nul fermoir');
  assert.equal(strict('toute ferme, tous les villages, toute la ferme', 1), 'tout fermoir, toutes les villes, tout le fermoir');
  assert.equal(strict('Toute sa ferme', 1), 'Tout son fermoir');
  assert.equal(strict('quelques fermes, notre ferme, chaque ferme', 1), 'quelques fermoirs, notre fermoir, chaque fermoir');
  assert.equal(strict('plusieurs héros, leur héros', -1), 'plusieurs fermoirs, leur fermoir'); // invariable : nombre du déterminant
  assert.equal(strict('diverses fermes', 1), 'divers fermoirs');
});

test('attribut du sujet et participe après « être »', () => {
  assert.equal(strict('la ferme est grise', 1), 'le fermoir est gris');
  assert.equal(strict('La maison paraissait plus vieille et très grise.', -2), "L'hôtel paraissait plus vieux et très gris.");
  assert.equal(strict('la ferme est fermée', 1), 'le fermoir est fermé');
  assert.equal(strict('la ferme a été fermée', 1), 'le fermoir a été fermé');
  assert.equal(strict('les fermes ne sont pas grises', 1), 'les fermoirs ne sont pas gris');
  assert.equal(strict('la ferme reste petite, la ville devient grise', 1), 'le fermoir reste petit, le voisin devient gris');
  // l'attribut suit la tête du groupe, pas son complément
  assert.equal(strict('la ferme du village est grise', 1), 'le fermoir de la ville est gris');
  assert.equal(strict('le chat sur la ferme est gris', 2), "l'école sur l'héros est grise".replace("l'héros", 'le héros'));
  assert.equal(strict('le village de la ferme de mon oncle est petit', 1), 'la ville du fermoir de mon village est petite');
});

test('ce qui n’est pas un attribut reste tel quel', () => {
  assert.equal(strict('la ferme voit grise', 1), 'le fermoir voit grise'); // pas un verbe d'état
  assert.equal(strict('la ferme, elle, est grise', 1), 'le fermoir, il, est grise'); // verbe séparé de son sujet par une virgule
  assert.equal(strict('la ferme est la grise maison', 1), 'le fermoir est le gris oncle');
  assert.equal(strict('la ferme a fermé', 1), 'le fermoir a fermé'); // participe après « avoir »
  assert.equal(strict('la ferme restaure', 1, { restaure: 'verb' }), 'le fermoir restaure');
  assert.equal(strict('il ne dort pas, chat', 1), 'il ne dort pas, cheval');
});

test('pronom sujet de reprise : seulement sans ambiguïté', () => {
  assert.equal(strict('Ma ferme est petite, elle a été grise ici.', 1), 'Mon fermoir est petit, il a été gris ici.');
  assert.equal(strict('Les fermes ferment quand elles sont vieilles.', 1, { ferment: 'verb' }), 'Les fermoirs ferment quand ils sont vieux.');
  assert.equal(strict('La ferme, dit-elle.', 1, { dit: 'verb' }), 'Le fermoir, dit-il.');
  // même genre avant et après : rien ne change
  assert.equal(strict('Mon oncle dort, il est petit.', 1), 'Mon village dort, il est petit.');
});

test('pronom sujet de reprise : laissé quand l’antécédent n’est pas sûr', () => {
  assert.equal(strict('Marthe a une ferme. Elle est grise.', 1), 'Marthe a un fermoir. Elle est grise.'); // autre phrase
  assert.equal(strict('Marthe voit la ferme quand elle dort.', 1), 'Marthe voit le fermoir quand elle dort.'); // nom propre
  assert.equal(strict('Elle voit la ferme quand elle dort.', 1), 'Elle voit le fermoir quand elle dort.'); // autre pronom sujet
  assert.equal(strict('la ferme et la maison, elle dort', 1), 'le fermoir et l’oncle, elle dort'.replace('’', "'")); // deux antécédents
  assert.equal(strict('les fermes, elle dort', 1), 'les fermoirs, elle dort'); // nombre différent
  assert.equal(strict('la Zorglub et la ferme, elle dort', 1, { Zorglub: 'noun' }), 'la Zorglub et le fermoir, elle dort'); // nom inconnu
  assert.equal(strict('elle voit la ferme', 1), 'elle voit le fermoir'); // pronom avant le nom
  // « il » impersonnel
  assert.equal(strict('le village dort, il faut une ferme', 1), 'la ville dort, il faut un fermoir');
  assert.equal(strict("le village dort, il n'y a pas de ferme", 1), "la ville dort, il n'y a pas de fermoir");
  assert.equal(strict('le village dort, il', 1), 'la ville dort, elle');
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

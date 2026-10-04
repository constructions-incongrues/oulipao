import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, type Category } from '../../src/domain/categories.ts';
import { edgePlugin } from '../../src/domain/edge/plugin.ts';
import { lineationPlugin } from '../../src/domain/lineation/plugin.ts';
import { linesOf } from '../../src/domain/lines.ts';
import { plainWords } from '../../src/domain/mixing.ts';
import type { ConstraintPlugin, WordScope } from '../../src/domain/plugin.ts';
import { trackSortPlugin } from '../../src/domain/track-sort/plugin.ts';
import { morphology, tag } from '../support/morphology.ts';

const resources = { morphology: morphology() };
const CATS: Record<string, Category> = {
  chat: 'noun', mur: 'noun', matin: 'noun', noir: 'adjective', tranquille: 'adjective',
  dort: 'verb', dormait: 'verb', hier: 'adverb', Hier: 'adverb',
};
const run = (plugin: ConstraintPlugin, text: string, values: Record<string, string | number>, targets: Iterable<Category> = CATEGORIES, scope?: WordScope) => {
  const result = plugin.apply(text, tag(text, CATS), plugin.parse(values), resources, new Set(targets), scope);
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};
/** Un poème : `lines` vers de `length` mots, « a1 a2 … » puis « b1 b2 … ». */
const poem = (lines: number, length: number) =>
  Array.from({ length: lines }, (_, l) => Array.from({ length }, (_, k) => `${'abcdefgh'[l]}${'xyzuvwst'[k]}`).join(' ')).join('\n');

test('linesOf : les mots visibles de chaque ligne', () => {
  const { words } = plainWords('Un deux\ntrois\n\nquatre');
  assert.deepEqual(linesOf(words), [[0, 1], [2], [3]]);
  words[2]!.output = '';
  assert.deepEqual(linesOf(words), [[0, 1], [3]]);
});

test('Tri par piste : retirer, ne garder que, un mot par ligne', () => {
  assert.equal(run(trackSortPlugin, 'Le chat noir dort.', {}, ['noun', 'adjective', 'verb']).text, 'Le.');
  assert.equal(run(trackSortPlugin, 'Le chat dort, tranquille.', {}, ['adjective']).text, 'Le chat dort.');
  assert.equal(run(trackSortPlugin, 'Hier, le chat dormait.', {}, ['adverb']).text, 'Le chat dormait.');
  const inventory = run(trackSortPlugin, 'Le chat noir dort sur le mur.', { mode: 'keep', layout: 'one-per-line' }, ['noun']);
  assert.equal(inventory.text, 'Chat\nmur'); // « Le » retiré lègue sa majuscule
  assert.deepEqual(inventory.marks.filter((mark) => mark.relaid).map((mark) => mark.original), ['mur']);
  assert.equal(run(trackSortPlugin, 'Le chat dort.', { layout: 'one-per-line' }, ['verb']).text, 'Le\nchat');
  // un pas bouché garde son mot
  const closed = run(trackSortPlugin, 'Le chat noir dort.', {}, ['adjective'], { skip: [2], overrides: [] });
  assert.equal(closed.text, 'Le chat noir dort.');
  assert.deepEqual(closed.marks, [{ index: 2, original: 'noir', reason: 'pas bouché' }]);
});

test('Tri par piste : déclaration, titre, aide', () => {
  assert.deepEqual(trackSortPlugin.defaults, { mode: 'remove', layout: 'as-is' });
  assert.equal(trackSortPlugin.targetable, undefined);
  assert.equal(trackSortPlugin.title({ mode: 'keep' }), 'Inventaire');
  assert.equal(trackSortPlugin.label({ layout: 'one-per-line' }), 'retrait, un mot par ligne');
  assert.equal(trackSortPlugin.help({}), 'Retire les noms.');
  assert.equal(trackSortPlugin.help({ mode: 'keep', layout: 'one-per-line' }, new Set(['noun', 'verb', 'other'])), 'Ne garde que les noms, les verbes et les autres mots. Un mot par ligne, sans ponctuation.');
  assert.throws(() => trackSortPlugin.parse({ mode: 'trier' }));
});

test('Bord : fins de vers, tête-à-queue, intérieur', () => {
  assert.equal(run(edgePlugin, poem(3, 4), { mode: 'ends', n: 1 }).text, 'au\nbu\ncu');
  assert.equal(run(edgePlugin, poem(2, 5), { mode: 'head-tail', n: 1 }).text, 'ax av\nbx bv');
  assert.equal(run(edgePlugin, poem(4, 5), { mode: 'inside', n: 1 }).text, 'by bz bu\ncy cz cu');
  // un poème d'une ligne : l'intérieur est vide
  assert.equal(run(edgePlugin, 'Un seul vers.', { mode: 'inside' }).text, '');
  // un pas bouché garde son mot, avec la fin de son vers
  const closed = run(edgePlugin, poem(2, 3), { mode: 'ends', n: 1 }, CATEGORIES, { skip: [3], overrides: [] });
  assert.equal(closed.text, 'az\nbx bz');
  assert.deepEqual(closed.marks.find((mark) => mark.index === 3), { index: 3, original: 'bx', reason: 'pas bouché' });
});

test('Bord : déclaration non ciblable, titre, aide', () => {
  assert.equal(edgePlugin.targetable, false);
  assert.deepEqual(edgePlugin.defaults, { mode: 'ends', n: 1 });
  assert.equal(edgePlugin.label({ mode: 'inside', n: 2 }), 'bord : intérieur, 2 mots');
  assert.equal(edgePlugin.help({}), 'Ne garde que les 1 mot de la fin de chaque vers.');
  assert.match(edgePlugin.help({ mode: 'head-tail', n: 2 }), /2 mots du début et de la fin/);
  assert.match(edgePlugin.help({ mode: 'inside' }), /premier et le dernier vers/);
  assert.throws(() => edgePlugin.parse({ n: 10 }));
});

test('Mise en vers : tous les n mots, remis en ligne comptés', () => {
  const bandit = run(lineationPlugin, 'Un deux trois quatre cinq six sept.', { cut: 'every', n: 3 });
  assert.equal(bandit.text, 'Un deux trois\nquatre cinq six\nsept.');
  assert.deepEqual(bandit.marks, [{ index: 3, original: 'quatre', relaid: true }, { index: 6, original: 'sept', relaid: true }]);
  // les sauts de ligne d'avant sont remplacés ; la ponctuation reste en fin de ligne
  assert.equal(run(lineationPlugin, 'Un\ndeux, trois quatre', { cut: 'every', n: 2 }).text, 'Un deux,\ntrois quatre');
});

test('Mise en vers : aux ponctuations, guillemets et mots collés', () => {
  assert.equal(run(lineationPlugin, 'Il dort ; le chat, lui, rêve.', { cut: 'punctuation' }).text, 'Il dort ;\nle chat,\nlui,\nrêve.');
  assert.equal(run(lineationPlugin, 'Il dit, « bonjour ».', { cut: 'punctuation' }).text, 'Il dit,\n« bonjour ».');
  // « l’horloge » compte pour un mot et ne se coupe pas
  assert.equal(run(lineationPlugin, 'Un deux l’horloge trois', { cut: 'every', n: 2 }).text, 'Un deux\nl’horloge trois');
});

test('Mise en vers : selon un nombre, en boucle, zéros sautés', () => {
  const text = Array.from({ length: 30 }, (_, k) => `m${k}`).join(' ');
  const lines = run(lineationPlugin, text, { cut: 'number', number: 2461317 }).text.split('\n');
  assert.deepEqual(lines.map((line) => line.split(' ').length), [2, 4, 6, 1, 3, 1, 7, 2, 4]);
  const zeros = run(lineationPlugin, 'a b c d e', { cut: 'number', number: 102 }).text;
  assert.equal(zeros, 'a\nb c\nd\ne');
});

test('Mise en vers : déclaration, titre, aide', () => {
  assert.equal(lineationPlugin.targetable, false);
  assert.deepEqual(lineationPlugin.defaults, { cut: 'every', n: 6, number: 1234567 });
  assert.equal(lineationPlugin.label({ n: 3 }), 'mise en vers tous les 3 mots');
  assert.equal(lineationPlugin.label({ cut: 'punctuation' }), 'mise en vers aux ponctuations');
  assert.equal(lineationPlugin.label({ cut: 'number', number: 2461317 }), 'mise en vers selon 2461317');
  assert.match(lineationPlugin.help({}), /tous les 6 mots/);
  assert.match(lineationPlugin.help({ cut: 'punctuation' }), /chaque ponctuation/);
  assert.match(lineationPlugin.help({ cut: 'number', number: 12 }), /chiffres de 12/);
  assert.throws(() => lineationPlugin.parse({ number: 10_000_000 }));
});

test('espaces insécables : un retrait ou une mise en vers garde l’espace choisie devant « ! » et « : »', () => {
  const fine = ' ';
  const normal = ' ';
  // retrait de l'adjectif devant « ! » : l'espace fine reste
  assert.equal(run(trackSortPlugin, `Quel chat noir${fine}!`, { mode: 'remove' }, ['adjective']).text, `Quel chat${fine}!`);
  // sans insécable, l'espace ordinaire de toujours
  assert.equal(run(trackSortPlugin, 'Quel chat noir !', { mode: 'remove' }, ['adjective']).text, 'Quel chat !');
  // mise en vers à chaque ponctuation : « : » garde son espace insécable en fin de vers
  const lines = run(lineationPlugin, `Le chat dort${normal}: le matin est noir.`, { cut: 'punctuation' }).text;
  assert.ok(lines.startsWith(`Le chat dort${normal}:\n`), JSON.stringify(lines));
});

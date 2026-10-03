import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, type Category } from '../../../src/domain/categories.ts';
import { lipogramPlugin } from '../../../src/domain/lipogram/plugin.ts';
import { containsLetter } from '../../../src/domain/lipogram/neighbour.ts';
import { applyS7 } from '../../../src/domain/s7/engine.ts';
import { morphology, tag } from '../../support/morphology.ts';

const m = morphology();
const run = (text: string, letter = 'e', extra = {}, targets: Iterable<Category> = CATEGORIES) => {
  const result = lipogramPlugin.apply(text, tag(text, extra), { letter }, { morphology: m }, new Set(targets));
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};

test('déclaration : sur toutes les pistes, un paramètre « Lettre », « e » par défaut', () => {
  assert.deepEqual(lipogramPlugin.tracks, [...CATEGORIES]);
  assert.deepEqual(lipogramPlugin.defaultTargets, [...CATEGORIES]);
  assert.deepEqual(lipogramPlugin.defaults, { letter: 'e' });
  const [parameter] = lipogramPlugin.parameters;
  assert.equal(parameter?.kind === 'choice' && parameter.options.length, 26);
  assert.throws(() => lipogramPlugin.parse({ letter: 'é' }));
  assert.equal(lipogramPlugin.title({ letter: 'a' }), 'Lipogramme en a');
  assert.equal(lipogramPlugin.label({}), 'lipogramme en e');
  assert.match(lipogramPlugin.help({}), /contient « e »/);
  assert.equal(lipogramPlugin.acts({}), true);
});

test('noms remplacés par leur voisin, avec leur groupe ; adverbes et mots-outils aussi', () => {
  const { text, marks } = run('Le chat est très vite et la vieille horloge dort.');
  assert.equal(text, 'Un chat est très ainsi ou la vieille maison dort.');
  assert.deepEqual(marks, [
    { index: 0, original: 'Le', replacement: 'Un' },
    { index: 2, original: 'est', reason: 'verbe, laissé en v1' },
    { index: 4, original: 'vite', replacement: 'ainsi' },
    { index: 5, original: 'et', replacement: 'ou' },
    { index: 7, original: 'vieille', reason: 'aucun voisin sans la lettre' },
    { index: 8, original: 'horloge', replacement: 'maison' },
  ]);
});

test('la lettre a disparu, hors verbes et mots sans voisin', () => {
  const { words, marks } = run('La ferme du village est grise. Une école, des héros.');
  const kept = new Set(marks.filter((mark) => mark.reason).map((mark) => mark.index));
  words.forEach((word) => assert.ok(kept.has(word.index) || !containsLetter(word.output, 'e'), word.output));
});

test('mot-outil sans équivalent retiré, sa majuscule léguée ; article élidé devant une voyelle', () => {
  const removed = run('Je vois une école.');
  assert.equal(removed.text, ' Vois la maison.');
  assert.deepEqual(removed.marks[0], { index: 0, original: 'Je', removed: true });
  // « une » → « la » devant une voyelle : « l’ », collé ; l'apostrophe suit le texte
  assert.equal(run('Une abri, et une école.', 'e', { abri: 'other' }).text, "L'abri, ou la maison.");
  assert.match(run('C’est une abri.', 'e', { abri: 'other' }).text, /l’abri/);
  // devant un mot retiré, pas d'élision sur le mot d'après
  assert.equal(run('Une aire, et une école.', 'e', { aire: 'other' }).text, 'La, ou la maison.');
  // une sortie de deux mots-outils (« de la ») se traite mot par mot
  // (« porte », étiqueté mot-outil sans équivalent, est retiré)
  assert.equal(run('La porte de la ville.', 'e', { porte: 'other' }).text, 'La à la maison.');
});

test('une autre lettre ; un texte sans la lettre reste tel quel', () => {
  assert.equal(run('Le chat dort.', 'a').text, 'Le fermoir dort.'); // « chat » contient « a »
  assert.deepEqual(run('Un chat dort.').marks, []);
  assert.equal(run('Un chat dort.').text, 'Un chat dort.');
});

test('les noms passent par la même réécriture que le S+7', () => {
  // un nom sans voisin garde son groupe ; un nom inconnu aussi
  const unknown = run('La zorglubette dort.', 'e', { zorglubette: 'noun' });
  assert.deepEqual(unknown.marks.find((mark) => mark.index === 1), { index: 1, original: 'zorglubette', reason: 'aucun voisin sans la lettre' });
  // le S+7 n'a pas changé de comportement
  const text = 'La vieille ferme du village dort.';
  assert.equal(applyS7(text, tag(text), { offset: 1 }, m).text, 'Le vieux fermoir de la ville dort.');
});

test('pistes visées : seuls leurs mots perdent la lettre', () => {
  const text = 'Le chat est très vite et la vieille horloge dort.';
  // sur les seuls noms : « horloge » change, mais pas « Le », « vite », « et »
  const nouns = run(text, 'e', {}, ['noun']);
  assert.equal(nouns.text, 'Le chat est très vite et la vieille maison dort.');
  assert.deepEqual(nouns.marks.map((mark) => mark.index), [8]);
  // sans les noms : les mots-outils et l'adverbe changent, « horloge » reste
  const others = run(text, 'e', {}, ['adverb', 'other']);
  assert.equal(others.text, 'Un chat est très ainsi ou la vieille horloge dort.');
  assert.ok(!others.marks.some((mark) => mark.index === 8));
});

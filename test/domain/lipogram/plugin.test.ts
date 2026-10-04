import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, type Category } from '../../../src/domain/categories.ts';
import { bannedLetters, lipogramPlugin } from '../../../src/domain/lipogram/plugin.ts';
import { containsLetter } from '../../../src/domain/lipogram/neighbour.ts';
import type { ParameterValues } from '../../../src/domain/plugin.ts';
import { applyS7 } from '../../../src/domain/s7/engine.ts';
import { AUXILIARY, LOADING } from '../../../src/domain/verb.ts';
import { morphology, tag, verbs } from '../../support/morphology.ts';

const m = morphology();
const v = verbs();
const run = (text: string, letter = 'e', extra = {}, targets: Iterable<Category> = CATEGORIES, withVerbs = true) => {
  const result = lipogramPlugin.apply(text, tag(text, extra), { letters: letter }, { morphology: m, verbs: withVerbs ? v : undefined }, new Set(targets));
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};

test('déclaration : sur toutes les pistes, « Lettres » (« e ») et « Mode » (interdites)', () => {
  assert.deepEqual(lipogramPlugin.tracks, [...CATEGORIES]);
  assert.deepEqual(lipogramPlugin.defaultTargets, [...CATEGORIES]);
  assert.deepEqual(lipogramPlugin.defaults, { letters: 'e', mode: 'forbidden' });
  assert.deepEqual(lipogramPlugin.parameters.map((p) => p.kind), ['text', 'choice']);
  assert.throws(() => lipogramPlugin.parse({ letters: 'a'.repeat(41) }));
  assert.throws(() => lipogramPlugin.parse({ mode: 'toutes' }));
  assert.equal(lipogramPlugin.title({ letters: 'a' }), 'Lipogramme en a');
  assert.equal(lipogramPlugin.label({}), 'lipogramme en e');
  assert.match(lipogramPlugin.help({}), /contient « e » devient .* sans cette lettre/);
  assert.equal(lipogramPlugin.acts({}), true);
});

test('lettres saisies : nues, sans doublon, dans l’ordre ; mention et aide', () => {
  assert.equal(lipogramPlugin.label({ letters: 'a, e, a' }), 'lipogramme en a, e');
  assert.equal(lipogramPlugin.label({ letters: 'Lucie', mode: 'allowed' }), 'lipogramme seulement en l, u, c, i, e');
  assert.equal(lipogramPlugin.title({ letters: 'Lucie', mode: 'allowed' }), 'Lipogramme seulement en l, u, c, i, e');
  assert.match(lipogramPlugin.help({ letters: 'ae' }), /« a », « e » devient .* sans ces lettres/);
  assert.match(lipogramPlugin.help({ letters: 'lucie', mode: 'allowed' }), /autre lettre que « l », « u », « c », « i », « e »/);
});

test('aucune lettre saisie : le lipogramme n’agit pas et le dit', () => {
  for (const values of [{ letters: '' }, { letters: ' 12 !', mode: 'allowed' }] as ParameterValues[]) {
    assert.equal(lipogramPlugin.acts(values), false);
    assert.equal(lipogramPlugin.title(values), 'Lipogramme');
    assert.equal(lipogramPlugin.label(values), 'lipogramme sans lettre');
    assert.match(lipogramPlugin.help(values), /Aucune lettre saisie/);
  }
});

test('bannedLetters : les lettres tapées, ou toutes les autres', () => {
  assert.equal(bannedLetters('a, é', 'forbidden'), 'ae');
  assert.equal(bannedLetters('Lucie', 'allowed'), 'abdfghjkmnopqrstvwxyz');
  assert.equal(bannedLetters('', 'allowed'), '');
});

test('plusieurs lettres interdites : le voisin n’a aucune des deux', () => {
  const two = run('Le chat dort.', 'a, e');
  const one = run('Le chat dort.', 'a');
  for (const mark of two.marks) if (mark.replacement) assert.ok(!containsLetter(mark.replacement, 'ae'), mark.replacement);
  assert.notEqual(two.text, 'Le chat dort.');
  assert.ok(one.marks.length > 0);
});

test('lettres permises : seul ce qui s’écrit avec les lettres du nom passe, « é » compris', () => {
  const result = lipogramPlugin.apply('Le chat dort.', tag('Le chat dort.'), { letters: 'Lucie', mode: 'allowed' }, { morphology: m, verbs: v }, new Set(CATEGORIES));
  for (const mark of result.marks) if (mark.replacement) assert.ok(!containsLetter(mark.replacement, bannedLetters('lucie', 'allowed')), mark.replacement);
  assert.ok(!containsLetter('élu', bannedLetters('Lucie', 'allowed')));
});

test('une seule lettre interdite : même texte qu’avec l’ancien paramètre « Lettre »', () => {
  assert.equal(run('Le chat est trop vite et la vieille horloge dort.').text, 'Un chat est trop ainsi ou la vieille maison dort.');
});

test('noms remplacés par leur voisin, avec leur groupe ; adverbes et mots-outils aussi', () => {
  const { text, marks } = run('Le chat est trop vite et la vieille horloge dort.');
  assert.equal(text, 'Un chat est trop ainsi ou la vieille maison dort.');
  assert.deepEqual(marks, [
    { index: 0, original: 'Le', replacement: 'Un' },
    { index: 2, original: 'est', reason: AUXILIARY },
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

test('mot-outil retiré en tête de vers : le vers reste sur sa ligne', () => {
  assert.equal(run('Un mur\nje vois').text, 'Un mur\nvois');
});

test('mot-outil sans équivalent retiré, sa majuscule léguée ; article élidé devant une voyelle', () => {
  const removed = run('Je vois une école.');
  assert.equal(removed.text, 'Vois la maison.');
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
  // un nom sans voisin garde son groupe ; un nom inconnu aussi, et la raison dit qu'il est inconnu
  const unknown = run('La zorglubette dort.', 'e', { zorglubette: 'noun' });
  assert.deepEqual(unknown.marks.find((mark) => mark.index === 1), { index: 1, original: 'zorglubette', reason: 'absent du dictionnaire' });
  // le S+7 n'a pas changé de comportement
  const text = 'La vieille ferme du village dort.';
  assert.equal(applyS7(text, tag(text), { offset: 1 }, m).text, 'Le vieux fermoir de la ville dort.');
});

test('pistes visées : seuls leurs mots perdent la lettre', () => {
  const text = 'Le chat est trop vite et la vieille horloge dort.';
  // sur les seuls noms : « horloge » change, mais pas « Le », « vite », « et »
  const nouns = run(text, 'e', {}, ['noun']);
  assert.equal(nouns.text, 'Le chat est trop vite et la vieille maison dort.');
  assert.deepEqual(nouns.marks.map((mark) => mark.index), [8]);
  // sans les noms : les mots-outils et l'adverbe changent, « horloge » reste
  const others = run(text, 'e', {}, ['adverb', 'other']);
  assert.equal(others.text, 'Un chat est trop ainsi ou la vieille horloge dort.');
  assert.ok(!others.marks.some((mark) => mark.index === 8));
});

test('portée par mot : un pas bouché garde son mot et son groupe', () => {
  const text = 'Le chat est trop vite et la vieille horloge dort.';
  const apply = (skip: number[]) => {
    const result = lipogramPlugin.apply(text, tag(text), { letters: 'e' }, { morphology: m }, new Set(CATEGORIES), { skip, overrides: [] });
    return result.words.map((w) => w.gap + w.output).join('') + result.tail;
  };
  // « horloge » (8) et son groupe bouchés, « vite » (4) aussi : le reste suit le lipogramme.
  assert.equal(apply([4, 6, 7, 8]), 'Un chat est trop vite ou la vieille horloge dort.');
  assert.equal(apply([]), 'Un chat est trop ainsi ou la vieille maison dort.');
});

test('Verbe fautif : le premier verbe suivant sans la lettre, au même temps et à la même personne', () => {
  const { text, marks } = run('elle mangeait', 'e', { elle: 'other', mangeait: 'verb' }, ['verb']);
  assert.equal(text, 'elle adorait');
  assert.deepEqual(marks, [{ index: 1, original: 'mangeait', replacement: 'adorait' }]);
  // Le pronom suit le verbe nouveau : « j'aime » sans « a » devient « je dors ».
  assert.equal(run("j'aime", 'a', { "j'": 'other', aime: 'verb' }, ['verb']).text, 'je dors');
});

test('Verbes : sans voisin, auxiliaire, pas bouché, piste non visée, verbes pas encore chargés', () => {
  assert.deepEqual(run('nous mangeons', 'o', { nous: 'other', mangeons: 'verb' }, ['verb']).marks, [{ index: 1, original: 'mangeons', reason: 'aucun voisin sans la lettre' }]);
  assert.deepEqual(run('il est', 'e', { il: 'other', est: 'verb' }, ['verb']).marks, [{ index: 1, original: 'est', reason: AUXILIARY }]);
  assert.deepEqual(run('elle mangeait', 'e', { elle: 'other', mangeait: 'verb' }, ['noun']).marks, []);
  assert.deepEqual(run('elle mangeait', 'e', { elle: 'other', mangeait: 'verb' }, ['verb'], false).marks, [{ index: 1, original: 'mangeait', reason: LOADING }]);
  const closed = lipogramPlugin.apply('elle mangeait', tag('elle mangeait', { mangeait: 'verb' }), { letters: 'e' }, { morphology: m, verbs: v }, new Set(['verb']), { skip: [1], overrides: [] });
  assert.equal(closed.words[1]!.output, 'mangeait');
  // Un verbe sans la lettre n'est pas touché.
  assert.deepEqual(run('il dort', 'e', { il: 'other', dort: 'verb' }, ['verb']).marks, []);
});

test('article rétabli : « l’ » devant un mot nouveau à initiale consonantique', () => {
  const { text, marks } = run("L'enceinte maison.", 'n');
  assert.equal(text, 'La fermée ville.');
  assert.deepEqual(marks.find((mark) => mark.original === 'enceinte'), { index: 1, original: 'enceinte', replacement: 'fermée' });
});

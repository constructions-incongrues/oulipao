import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATEGORIES, type Category } from '../../src/domain/categories.ts';
import { audibleCategories, mixSegments, mixText, plainWords, TracksSchema, type Tracks } from '../../src/domain/mixing.ts';
import { applyS7 } from '../../src/domain/s7/engine.ts';
import { morphology, tag } from '../support/morphology.ts';

const tracks = (changes: Partial<Record<Category, { muted?: boolean; solo?: boolean }>> = {}): Tracks =>
  TracksSchema.parse(Object.fromEntries(CATEGORIES.map((c) => [c, { muted: false, solo: false, ...changes[c] }])));

const mix = (text: string, changes: Parameters<typeof tracks>[0], extra: Record<string, Category> = {}) => {
  const { words, tail } = plainWords(text);
  return mixText(words, tag(text, extra), audibleCategories(tracks(changes)), tail);
};
const VERBS = { arrêta: 'verb', remarqua: 'verb' } as const;

test('audibleCategories : sans solo, les pistes non muettes ; avec solo, les seules pistes en solo', () => {
  assert.deepEqual([...audibleCategories(tracks())], [...CATEGORIES]);
  assert.deepEqual([...audibleCategories(tracks({ adjective: { muted: true } }))], ['noun', 'verb', 'adverb', 'other']);
  assert.deepEqual([...audibleCategories(tracks({ verb: { solo: true }, noun: { muted: true } }))], ['verb']);
  assert.deepEqual([...audibleCategories(tracks({ verb: { solo: true, muted: true }, other: { solo: true } }))], ['verb', 'other']);
});

test('plainWords : le texte tel quel, mot par mot', () => {
  const text = " L'horloge s'arrêta… ";
  const { words, tail } = plainWords(text);
  assert.deepEqual(words.map((w) => w.gap + w.output), [" L'", 'horloge', " s'", 'arrêta']);
  assert.equal(tail, '… ');
  assert.equal(words.map((w) => w.gap + w.output).join('') + tail, text);
  assert.deepEqual(plainWords('… !'), { words: [], tail: '… !' });
});

test('toutes pistes audibles : exactement le texte, espaces compris', () => {
  const text = 'La  vieille horloge ,  dit-il .';
  assert.equal(mix(text, {}), text);
});

test('piste muette : ses mots disparaissent, le texte se resserre, la ponctuation reste', () => {
  assert.equal(mix("la vieille horloge s'arrêta", { adjective: { muted: true } }, VERBS), "la horloge s'arrêta");
  assert.equal(mix('Un petit chat gris, très vieux, dort.', { adjective: { muted: true } }), 'Un chat, très, dort.');
  assert.equal(mix('La ferme est grise ; le chat dort !', { noun: { muted: true } }), 'La est grise ; le dort !');
  assert.equal(mix('Le chat.\nLa ferme.', { other: { muted: true } }), 'chat.\nferme.');
});

test('piste en solo : seuls ses mots restent, avec la ponctuation', () => {
  assert.equal(mix("la vieille horloge s'arrêta", { verb: { solo: true } }, VERBS), 'arrêta');
  assert.equal(mix("Le matin où l'horloge s'arrêta, personne ne le remarqua vraiment.", { verb: { solo: true } }, VERBS), 'arrêta, remarqua.');
  assert.equal(mix('Le chat, la ferme, le village : petits ?', { adjective: { solo: true } }), ': petits ?');
  assert.equal(mix('La ferme et le chat', { noun: { solo: true }, other: { solo: true } }), 'La ferme et le chat');
  assert.equal(mix('Il dort. Dehors, la ferme dort.', { verb: { solo: true } }), 'dort. dort.'); // pas de virgule orpheline après un point
});

test('le mixage s’applique à la sortie du moteur, mot par mot', () => {
  const text = 'la vieille ferme du village est grise';
  const tagged = tag(text);
  const s7 = applyS7(text, tagged, { offset: 1, mode: 'reagree' }, morphology());
  assert.equal(s7.text, 'le vieux fermoir de la ville est gris');
  assert.equal(mixText(s7.words, tagged, audibleCategories(tracks()), s7.tail), s7.text);
  assert.equal(mixText(s7.words, tagged, audibleCategories(tracks({ adjective: { muted: true } })), s7.tail), 'le fermoir de la ville est');
  assert.equal(mixText(s7.words, tagged, audibleCategories(tracks({ noun: { solo: true } })), s7.tail), 'fermoir ville');
});

test('refuse des mots qui ne correspondent pas aux mots étiquetés', () => {
  assert.throws(() => mixText(plainWords('Le chat').words, tag('Le'), new Set(CATEGORIES), ''), /ne correspondent pas/);
});

test('mixSegments : chaque mot entendu garde sa position, même après le resserrement', () => {
  const text = 'La vieille ferme, grise.';
  const { words, tail } = plainWords(text);
  const all = mixSegments(words, tag(text), audibleCategories(tracks()), tail);
  assert.deepEqual(all, [
    { text: 'La', index: 0 }, { text: ' ' }, { text: 'vieille', index: 1 }, { text: ' ' },
    { text: 'ferme', index: 2 }, { text: ', ' }, { text: 'grise', index: 3 }, { text: '.' },
  ]);
  const muted = mixSegments(words, tag(text), audibleCategories(tracks({ adjective: { muted: true } })), tail);
  assert.deepEqual(muted, [{ text: 'La', index: 0 }, { text: ' ' }, { text: 'ferme', index: 2 }, { text: '.' }]);
  assert.deepEqual(mixSegments([], [], new Set(), ''), []);
  // des mots retirés par un plugin : le texte se resserre aussi
  const removed = words.map((w, i) => (i < 2 ? { ...w, output: '', gap: '' } : w));
  assert.equal(mixSegments(removed, tag(text), audibleCategories(tracks()), tail, true).map((s) => s.text).join(''), 'ferme, grise.');
});

test('une piste coupée ne change pas l’espace insécable devant « : »', () => {
  const text = 'Il dort : le chat reste.';
  const muted = mix(text, { verb: { muted: true } }, { dort: 'verb', reste: 'verb' });
  assert.ok(muted.includes(' :'), JSON.stringify(muted));
  assert.ok(!muted.includes(' :'));
});

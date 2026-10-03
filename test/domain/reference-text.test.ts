import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseAnnotatedText, ReferenceTextSchema } from '../../src/domain/reference-text.ts';

const HEADER = '# titre: Essai\n# source: test\n';

test('parseAnnotatedText : lit en-têtes, texte et annotations', () => {
  const ref = parseAnnotatedText(`${HEADER}# annotateur: moi\nL'{o}été{n} est{v} très{r} chaud{a}, dit{v}-il{o}.`);
  assert.equal(ref.title, 'Essai');
  assert.equal(ref.annotator, 'moi');
  assert.equal(ref.text, "L'été est très chaud, dit-il.");
  assert.deepEqual(ref.words.map((w) => w.category), ['other', 'noun', 'verb', 'adverb', 'adjective', 'verb', 'other']);
});

test("parseAnnotatedText : annotateur par défaut s'il n'est pas donné", () => {
  assert.match(parseAnnotatedText(`${HEADER}Oui{o}`).annotator, /assistant IA/);
});

test('parseAnnotatedText : refuse les annotations fautives', () => {
  assert.throws(() => parseAnnotatedText(`${HEADER}Le{o} chat dort{v}`), /3 mots mais 2 annotations/);
  assert.throws(() => parseAnnotatedText(`${HEADER}Le{x} chat{n}`), /accolade ou code inconnu/);
  assert.throws(() => parseAnnotatedText(`${HEADER}Le {o}chat{n}`), /pas collée à son mot/);
  assert.throws(() => parseAnnotatedText('# titre sans deux-points\nLe{o}'), /en-tête illisible/);
  assert.throws(() => parseAnnotatedText('Le{o}'), /invalid|expected|Invalid/i); // titre et source manquants
});

test('ReferenceTextSchema : refuse des mots qui ne suivent pas le découpage', () => {
  const base = { title: 't', source: 's', annotator: 'a', text: 'Le chat' };
  assert.equal(ReferenceTextSchema.safeParse({ ...base, words: [{ word: 'Le', category: 'other' }] }).success, false);
  const swapped = [{ word: 'chat', category: 'noun' }, { word: 'Le', category: 'other' }];
  assert.equal(ReferenceTextSchema.safeParse({ ...base, words: swapped }).success, false);
});

const directory = new URL('../../reference/', import.meta.url);
for (const file of readdirSync(directory).filter((f) => f.endsWith('.json'))) {
  test(`${file} est conforme au schéma et dérivé de son fichier annoté`, () => {
    const json = JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
    const reference = ReferenceTextSchema.parse(json);
    assert.equal(reference.words.length, 200);
    const annotated = readFileSync(new URL(file.replace('.json', '.annote.txt'), directory), 'utf8');
    assert.deepEqual(parseAnnotatedText(annotated), reference);
  });
}

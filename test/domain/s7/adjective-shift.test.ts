import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InMemoryMorphology } from '../../../src/adapters/morphology/in-memory-morphology.ts';
import { plainWords } from '../../../src/domain/mixing.ts';
import { shiftAdjective, shiftAdjectives } from '../../../src/domain/s7/adjective-shift.ts';
import { s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { morphology, tag } from '../../support/morphology.ts';

// Ordre des adjectifs du petit dictionnaire : beau, enceinte, fermé, fermer, gris, petit, rapide, vieux.
const m = morphology();
const run = (text: string, offset: number, targets: string[], extra = {}) => {
  const result = s7Plugin.apply(text, tag(text, extra), { offset }, { morphology: m }, new Set(targets as never));
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};

test('shiftAdjective : le n-ième adjectif suivant, au genre et au nombre du mot', () => {
  assert.deepEqual(shiftAdjective('petit', 1, undefined, m), { form: 'rapide' });
  assert.deepEqual(shiftAdjective('petites', -1, undefined, m), { form: 'grises' });
  assert.deepEqual(shiftAdjective('vieux', 1, false, m), { form: 'beau' }); // on fait le tour
  assert.deepEqual(shiftAdjective('beau', -1, true, m), { form: 'vieil' }); // devant une voyelle : la forme euphonique
  assert.deepEqual(shiftAdjective('beau', -1, false, m), { form: 'vieux' });
  assert.deepEqual(shiftAdjective('inconnu', 1, undefined, m), { reason: 'absent du dictionnaire' });
  assert.deepEqual(shiftAdjective('gris', -3, undefined, m), { reason: 'pas de forme au bon genre et au bon nombre' }); // « enceinte » n'a pas de masculin
});

test('S+n sur les seuls adjectifs : les noms ne bougent pas', () => {
  const { text, marks } = run('Le petit chat est gris.', 1, ['adjective']);
  assert.equal(text, 'Le rapide chat est petit.');
  assert.deepEqual(marks, [
    { index: 1, original: 'petit', replacement: 'rapide' },
    { index: 4, original: 'gris', replacement: 'petit' },
  ]);
  assert.equal(run('La petite école.', 1, ['adjective']).text, 'La rapide école.'); // genre gardé
});

test('S+n sur les noms et les adjectifs : les noms d’abord, puis les adjectifs réaccordés', () => {
  assert.equal(run('La vieille ferme du village dort.', 1, ['noun', 'adjective']).text, 'Le beau fermoir de la ville dort.');
  assert.equal(run('La vieille ferme du village dort.', 1, ['noun']).text, 'Le vieux fermoir de la ville dort.'); // comme avant
});

test('élision : l’article suit l’initiale de l’adjectif nouveau', () => {
  // « le » devant un adjectif à voyelle devient « l’ », collé
  const elided = new InMemoryMorphology({
    nouns: [{ form: 'chat', lemma: 'chat', gender: 'm', number: 's' }],
    adjectives: [{ form: 'petit', paradigm: 'petit', gender: 'm', number: 's' }, { form: 'ultime', paradigm: 'ultime', gender: 'e', number: 's' }],
    noElision: [],
  });
  const text = 'Le petit chat.';
  const words = plainWords(text).words;
  shiftAdjectives(words, tag(text, { petit: 'adjective' }), () => 1, "'", elided);
  assert.equal(words.map((w) => w.gap + w.output).join(''), "L'ultime chat");
  // et « l’ » redevient « la » devant une consonne
  const back = 'L’ultime école.';
  const backWords = plainWords(back).words;
  shiftAdjectives(backWords, tag(back, { ultime: 'adjective', école: 'noun' }), () => 1, '’', elided);
  assert.equal(backWords.map((w) => w.gap + w.output).join(''), 'Le petit école'); // genre retenu : masculin, l'adjectif l'est
  // un adjectif inconnu reste, avec sa raison
  const unknown = 'Un chat zorg.';
  const unknownWords = plainWords(unknown).words;
  assert.deepEqual(shiftAdjectives(unknownWords, tag(unknown, { zorg: 'adjective' }), () => 1, "'", m), [{ index: 2, original: 'zorg', reason: 'absent du dictionnaire' }]);
});

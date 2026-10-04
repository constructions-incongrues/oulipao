import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loadPhonetics } from '../../src/adapters/morphology/in-memory-phonetics.ts';
import { ipaOf, parseReading, phonemesOf } from '../../src/domain/phonetics/phoneme.ts';
import { rhymeOf } from '../../src/domain/phonetics/rhyme.ts';
import type { Category } from '../../src/domain/categories.ts';

// Le fichier publié des prononciations : il se charge en entier, sous un budget de mémoire, et rend
// les mêmes réponses qu'avant la représentation compacte (échantillon relevé le 2026-10-04).
const sample = JSON.parse(readFileSync(new URL('../support/phonetics-sample.json', import.meta.url), 'utf8')) as {
  sample: { form: string; category: Category; readings: { ipa: string; guessed: boolean }[]; inCategory: string[]; homophones: string[]; rhyming: number; rhymingHead: string[]; ending: number }[];
};
const gc = (globalThis as { gc?: () => void }).gc;

test('la textbank publiée tient en moins de 250 Mo et rend les mêmes réponses', { skip: gc ? false : 'lancer node avec --expose-gc' }, async () => {
  const tsv = readFileSync(new URL('../../data/phonetique-oulipao.tsv', import.meta.url), 'utf8');
  gc!();
  const before = process.memoryUsage().heapUsed;
  const phonetics = await loadPhonetics(async () => tsv);
  gc!();
  const grown = (process.memoryUsage().heapUsed - before) / 1e6;
  assert.ok(grown < 250, `la textbank occupe ${Math.round(grown)} Mo`);
  for (const expected of sample.sample) {
    assert.deepEqual(phonetics.readings(expected.form).map((reading) => ({ ipa: ipaOf(reading), guessed: reading.guessed })), expected.readings, expected.form);
    assert.deepEqual(phonetics.readings(expected.form, expected.category).map(ipaOf), expected.inCategory, expected.form);
    const phonemes = phonemesOf(parseReading(expected.inCategory[0]!)!);
    assert.deepEqual(phonetics.homophones(phonemes.join(''), expected.category).slice(0, 20), expected.homophones, expected.form);
    const rhyming = phonetics.rhyming(rhymeOf(phonemes), expected.category);
    assert.equal(rhyming.length, expected.rhyming, expected.form);
    assert.deepEqual(rhyming.slice(0, 10), expected.rhymingHead, expected.form);
    assert.equal(phonetics.ending(phonemes.slice(-2).join(''), expected.category).length, expected.ending, expected.form);
  }
});

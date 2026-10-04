// Relève un échantillon fixe de réponses de la textbank phonétique, pour vérifier qu'un changement
// de représentation ne change aucune réponse. Usage : node scripts/phonetics-sample.ts > test/support/phonetics-sample.json
import { readFileSync } from 'node:fs';
import { CATEGORIES } from '../src/domain/categories.ts';
import { ipaOf, phonemesOf } from '../src/domain/phonetics/phoneme.ts';
import { rhymeOf } from '../src/domain/phonetics/rhyme.ts';
import { InMemoryPhonetics, parsePhonetics } from '../src/adapters/morphology/in-memory-phonetics.ts';

const tsv = readFileSync(new URL('../data/phonetique-oulipao.tsv', import.meta.url), 'utf8');
const entries = parsePhonetics(tsv);
const repo = new InMemoryPhonetics(entries);
// Une forme toutes les 2 641 lignes : environ 200 formes, réparties sur tout le fichier et toutes les catégories.
const picked = entries.filter((_, k) => k % 2641 === 0);
const sample = picked.map((entry) => {
  const phonemes = phonemesOf(entry.reading);
  const rhyme = rhymeOf(phonemes);
  return {
    form: entry.form,
    category: entry.category,
    readings: repo.readings(entry.form).map((reading) => ({ ipa: ipaOf(reading), guessed: reading.guessed })),
    inCategory: repo.readings(entry.form, entry.category).map(ipaOf),
    homophones: repo.homophones(phonemes.join(''), entry.category).slice(0, 20),
    rhyming: repo.rhyming(rhyme, entry.category).length,
    rhymingHead: repo.rhyming(rhyme, entry.category).slice(0, 10),
    ending: repo.ending(phonemes.slice(-2).join(''), entry.category).length,
  };
});
process.stdout.write(`${JSON.stringify({ categories: CATEGORIES, entries: entries.length, sample }, null, 1)}\n`);

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryOfGrace, DERIVED_PHONETICS_HEADER, derivePhonetics, frequentRhymes, glaffFrequency, phoneticRowOf } from '../../src/adapters/lexicon/glaff-phonetics.ts';
import { loadPhonetics, parsePhonetics } from '../../src/adapters/morphology/in-memory-phonetics.ts';
import { ipaOf } from '../../src/domain/phonetics/phoneme.ts';

// Lignes réelles de GLÀFF 1.2.2 (forme | étiquette | lemme | API | SAMPA | fréquences).
const GLAFF = [
  'chaise|Ncfs|chaise|ʃɛz|SEz|0|0|0|0|0|0|0|0|120|0.5|130|0.6',
  'couvent|Ncms|couvent|ku.vɑ̃|ku.vA~|0|0|0|0|0|0|0|0|10|0.1|12|0.1',
  'couvent|Vmip3p-|couver|kuv|kuv|0|0|0|0|0|0|0|0|1|0|1|0',
  'vers|Ncmp|ver|vɛʁ|vER|0|0|0|0|0|0|0|0|5|0|5|0',
  'vers|Ncms|vers|vɛʁ|vER|0|0|0|0|0|0|0|0|5|0|5|0',
  'vers|Sp|vers|vɛʁ|vER|0|0|0|0|0|0|0|0|90|0|90|0',
  'aînée|Ncfs|aînée|e.ne;e.ne|e.ne;e.ne|0|0|0|0|0|0|0|0|1|0|1|0',
  'überconsommateur|Ncms|überconsommateur|||0|0|0|0|0|0|0|0|0|0|0|0',
  'bach|Ncms|bach|baχ|bax|0|0|0|0|0|0|0|0|0|0|0|0',
  'paris|Np-s|Paris|pa.ʁi|pa.Ri|0|0|0|0|0|0|0|0|0|0|0|0',
  'maison|Ncfs|maison|mɛ.zɔ̃|mE.zO~|0|0|0|0|0|0|0|0|300|1|300|1',
  'raison|Ncfs|raison|ʁɛ.zɔ̃|RE.zO~|0|0|0|0|0|0|0|0|200|1|200|1',
  'baie|Ncfs|baie|bɛ|bE|0|0|0|0|0|0|0|0|1|0|1|0',
  'vite|Rgp|vite|vit|vit|0|0|0|0|0|0|0|0|1|0|1|0',
  'noir|Afpms|noir|nwaʁː|nwaR|0|0|0|0|0|0|0|0|1|0|1|0',
];
const known = (form: string) => form !== 'baie';

test('catégories GRACE : noms communs, adjectifs, verbes, adverbes ; le reste, noms propres compris', () => {
  assert.deepEqual(['Ncfs', 'Afpms', 'Vmip3p-', 'Rgp', 'Np-s', 'Sp'].map(categoryOfGrace), ['N', 'A', 'V', 'R', 'O', 'O']);
});

test('dérivation : forme, catégorie, prononciation en syllabes et rime ; ce qui ne sert pas est écarté', () => {
  assert.equal(phoneticRowOf(GLAFF[0]!, known), 'chaise\tN\tʃɛz\tɛz');
  assert.equal(phoneticRowOf(GLAFF[7]!, known), undefined); // pas de prononciation
  assert.equal(phoneticRowOf(GLAFF[8]!, known), undefined); // « χ » hors de l'inventaire
  assert.equal(phoneticRowOf(GLAFF[12]!, known), undefined); // inconnue de Grammalecte
  assert.equal(phoneticRowOf('', known), undefined);
  assert.equal(phoneticRowOf(GLAFF[14]!, known), 'noir\tA\tnwaʁ\taʁ'); // allongement retiré
  const rows = derivePhonetics(GLAFF, known);
  assert.ok(rows.includes('couvent\tN\tku.vɑ̃\tɑ̃'));
  assert.ok(rows.includes('couvent\tV\tkuv\tuv'));
  assert.equal(rows.filter((row) => row.startsWith('vers\tN')).length, 1); // une ligne par forme et par catégorie
  assert.ok(rows.includes('aînée\tN\te.ne\te')); // la première prononciation seulement
});

test('rimes fréquentes : les plus nombreuses parmi les noms, avec leur nom le plus fréquent', () => {
  const rows = derivePhonetics(GLAFF, () => true);
  const frequencies = new Map(GLAFF.map((line) => [line.split('|')[0]!, glaffFrequency(line)]));
  const rhymes = frequentRhymes(rows, 2, (form) => frequencies.get(form) ?? 0);
  assert.deepEqual(rhymes[0], { rhyme: 'ɔ̃', example: 'maison' });
  assert.equal(rhymes.length, 2);
  assert.equal(glaffFrequency('a|b|c|d|e|1|2.5|x'), 3.5);
});

test('en-tête : la source, ses auteurs et la licence CC BY-SA 3.0', () => {
  const header = DERIVED_PHONETICS_HEADER.join('\n');
  assert.match(header, /GLÀFF/);
  assert.match(header, /Sajous/);
  assert.match(header, /CC BY-SA 3\.0/);
});

test('prononciation de « chaise » ; « couvent » nom et verbe ; homophones de « verre »', async () => {
  const tsv = ['# en-tête', 'chaise\tN\tʃɛz\tɛz', 'couvent\tN\tku.vɑ̃\tɑ̃', 'couvent\tV\tkuv\tuv', 'verre\tN\tvɛʁ\tɛʁ', 'vers\tN\tvɛʁ\tɛʁ', 'vert\tN\tvɛʁ\tɛʁ', 'vert\tA\tvɛʁ\tɛʁ', 'vair\tN\tvɛʁ\tɛʁ', 'ver\tN\tvɛʁ\tɛʁ', ''].join('\n');
  const phonetics = await loadPhonetics(async () => tsv);
  const [chaise] = phonetics.readings('chaise', 'noun');
  assert.equal(ipaOf(chaise!), 'ʃɛz');
  assert.equal(chaise!.syllables.length, 1);
  assert.equal(ipaOf(phonetics.readings('couvent', 'noun')[0]!), 'ku.vɑ̃');
  assert.equal(ipaOf(phonetics.readings('couvent', 'verb')[0]!), 'kuv');
  assert.equal(phonetics.readings('couvent').length, 2);
  assert.deepEqual(phonetics.readings('inconnu'), []);
  assert.deepEqual(phonetics.homophones('vɛʁ', 'noun'), ['vair', 'ver', 'verre', 'vers', 'vert']);
  assert.deepEqual(phonetics.homophones('vɛʁ', 'adjective'), ['vert']);
  assert.deepEqual(phonetics.homophones('zzz', 'noun'), []);
});

test('ligne non conforme : phonème inconnu, catégorie inconnue ou rime fausse, citée dans le message', () => {
  assert.throws(() => parsePhonetics('chaise\tN\tʃɛθ\tɛθ'), /ligne non conforme « chaise\tN\tʃɛθ\tɛθ »/);
  assert.throws(() => parsePhonetics('chaise\tX\tʃɛz\tɛz'), /ligne non conforme/);
  assert.throws(() => parsePhonetics('chaise\tN\tʃɛz\tɛ'), /ligne non conforme/);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { OutputWord } from '../../src/domain/s7/types.ts';
import { AUXILIARY, fixPronounElision, neighbourVerb, NO_FORM, pickVerbReading, shiftVerb, TENSES, UNKNOWN, VerbFormSchema } from '../../src/domain/verb.ts';
import { verbs } from '../support/morphology.ts';

const V = verbs();

test('VerbFormSchema : une forme valide par temps, un temps inconnu refusé', () => {
  for (const tense of TENSES) assert.ok(VerbFormSchema.safeParse({ form: 'x', infinitive: 'x', tense }).success);
  assert.equal(VerbFormSchema.safeParse({ form: 'x', infinitive: 'x', tense: 'present' }).success, false);
  assert.equal(VerbFormSchema.safeParse({ form: 'x', infinitive: 'x', tense: 'future', person: '4s' }).success, false);
});

test('« mange » après « tu » : la personne du pronom', () => {
  // « mange » n'a pas de 2s : le pronom ne trouve rien, on garde l'indicatif à la 3e personne.
  assert.deepEqual(pickVerbReading('mange', ['je'], V), { form: 'mange', infinitive: 'manger', tense: 'indicative-present', person: '1s' });
  assert.equal(pickVerbReading('manges', ['tu'], V)?.person, '2s');
  assert.equal(pickVerbReading('dors', ['tu'], V)?.person, '2s');
  assert.equal(pickVerbReading('dors', ["j'"], V)?.person, '1s');
});

test('Sujet nominal : indicatif, troisième personne', () => {
  assert.deepEqual(pickVerbReading('mange', ['le', 'chat'], V), { form: 'mange', infinitive: 'manger', tense: 'indicative-present', person: '3s' });
  assert.equal(pickVerbReading('Mange', [], V)?.tense, 'indicative-present');
});

test('Un pronom intercalé : « je me », « il ne »', () => {
  assert.equal(pickVerbReading('mange', ['je', 'me'], V)?.person, '1s');
  assert.equal(pickVerbReading('mangent', ['ils', 'ne'], V)?.person, '3p');
  // Deux pronoms intercalés : on ne remonte pas plus loin.
  assert.equal(pickVerbReading('mange', ['je', 'ne', 'le'], V)?.person, '3s');
});

test('Lecture unique, forme inconnue', () => {
  assert.equal(pickVerbReading('mangeait', [], V)?.tense, 'indicative-imperfect');
  assert.equal(pickVerbReading('mangé', [], V)?.tense, 'past-participle');
  assert.equal(pickVerbReading('manger', [], V)?.tense, 'infinitive');
  assert.equal(pickVerbReading('zzz', [], V), undefined);
});

test('shiftVerb : V+n au même temps et à la même personne', () => {
  // adorer, aimer, chanter, dormir, falloir, finir, haïr, manger
  assert.deepEqual(shiftVerb('aimions', ['nous'], 1, V), { form: 'chantions' });
  assert.deepEqual(shiftVerb('chante', ['je'], -1, V), { form: 'aime' });
  assert.deepEqual(shiftVerb('Mangeait', [], 1, V), { form: 'Adorait' }); // tour du dictionnaire, majuscule gardée
  assert.deepEqual(shiftVerb('manger', [], 7, V), { form: 'haïr' });
  assert.deepEqual(shiftVerb('mangée', [], 2, V), { form: 'aimée' });
});

test('shiftVerb : participe invariable, verbe défectif, auxiliaire, inconnu', () => {
  assert.deepEqual(shiftVerb('dormi', [], 1, V), { form: 'fallu' });
  assert.deepEqual(shiftVerb('dormions', ['nous'], 1, V), { reason: NO_FORM });
  assert.deepEqual(shiftVerb('est', ['il'], 7, V), { reason: AUXILIARY });
  assert.deepEqual(shiftVerb('a', ['il'], 7, V), { reason: AUXILIARY });
  assert.deepEqual(shiftVerb('zzz', [], 7, V), { reason: UNKNOWN });
});

test('neighbourVerb : le premier verbe suivant sans la lettre, aux mêmes traits', () => {
  // Après « manger », on repart du début : « adorait » n'a pas de « e ».
  assert.deepEqual(neighbourVerb('mangeait', ['elle'], 'e', V), { form: 'adorait' });
  assert.deepEqual(neighbourVerb('aime', ['je'], 'a', V), { form: 'dors' });
  assert.deepEqual(neighbourVerb('est', ['il'], 'e', V), { reason: AUXILIARY });
  assert.deepEqual(neighbourVerb('mangeons', ['nous'], 'o', V), { reason: 'aucun voisin sans la lettre' });
});

const out = (...words: string[]): OutputWord[] => words.map((output, index) => ({ index, output, gap: index ? ' ' : '' }));
const noH = (word: string) => /^[aeiouhéè]/i.test(word) && !V.blocksElision(word);

test('Élision gagnée, élision perdue', () => {
  const gained = out('je', 'adore');
  fixPronounElision(gained, 1, '’', noH);
  assert.deepEqual(gained.map((w) => w.gap + w.output).join(''), 'j’adore');
  const lost = out('J’', 'chante');
  lost[1]!.gap = '';
  fixPronounElision(lost, 1, '’', noH);
  assert.equal(lost.map((w) => w.gap + w.output).join(''), 'Je chante');
  const object = out("l'", 'mange');
  object[1]!.gap = '';
  fixPronounElision(object, 1, "'", noH);
  assert.equal(object.map((w) => w.gap + w.output).join(''), 'le mange');
});

test('Élision : h aspiré, rien avant, mot retiré', () => {
  const aspirated = out('je', 'hais');
  fixPronounElision(aspirated, 1, "'", noH);
  assert.equal(aspirated.map((w) => w.gap + w.output).join(''), 'je hais');
  const alone = out('adore');
  fixPronounElision(alone, 0, "'", noH);
  assert.equal(alone[0]!.output, 'adore');
  const removed = out('je', '');
  fixPronounElision(removed, 1, "'", noH);
  assert.equal(removed[0]!.output, 'je');
});

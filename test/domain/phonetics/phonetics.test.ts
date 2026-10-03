import assert from 'node:assert/strict';
import { test } from 'node:test';
import { guessReading } from '../../../src/domain/phonetics/fallback.ts';
import { describeReading, lineSyllables, pronounce } from '../../../src/domain/phonetics/lookup.ts';
import { ipaOf, parseReading, phonemesOf, splitPhonemes } from '../../../src/domain/phonetics/phoneme.ts';
import { hasGender, rhymeGender, rhymeOf, rhymes, splitRhyme } from '../../../src/domain/phonetics/rhyme.ts';
import { InMemoryPhonetics } from '../../../src/adapters/morphology/in-memory-phonetics.ts';
import { rhymePhonetics } from '../../support/phonetics.ts';

const sound = (ipa: string) => phonemesOf(parseReading(ipa)!);

test('phonèmes : voyelles nasales et syllabes ; un symbole hors du français est refusé', () => {
  assert.deepEqual(splitPhonemes('ʃɛz'), ['ʃ', 'ɛ', 'z']);
  assert.deepEqual(parseReading('ku.vɑ̃')!.syllables, [['k', 'u'], ['v', 'ɑ̃']]);
  assert.equal(ipaOf(parseReading('ku.vɑ̃')!), 'ku.vɑ̃');
  assert.equal(splitPhonemes('θɪŋ'), undefined);
  assert.equal(parseReading('ku..vɑ̃'), undefined);
});

test('rime suffisante : « chaise » et « fraise » riment', () => {
  assert.equal(rhymeOf(sound('ʃɛz')), 'ɛz');
  assert.ok(rhymes(sound('ʃɛz'), sound('fʁɛz'), 'sufficient'));
  assert.ok(rhymes(sound('ʃɛz'), sound('fʁɛz'), 'poor'));
});

test('rime riche refusée : « chaise » et « braise » n’ont que deux phonèmes communs', () => {
  assert.ok(!rhymes(sound('ʃɛz'), sound('bʁɛz'), 'rich'));
  assert.ok(rhymes(sound('mɛ.zɔ̃'), sound('ʁɛ.zɔ̃'), 'rich'));
  assert.ok(!rhymes(sound('ʃa'), sound('mɛ.zɔ̃'), 'poor'));
  assert.ok(!rhymes(sound('a.mi'), sound('ʒɔ.li'), 'sufficient')); // rime pauvre seulement
});

test('e muet final : « table » et « fable » riment en /abl/', () => {
  assert.equal(rhymeOf(sound('tabl')), 'abl');
  assert.equal(rhymeOf(sound('fabl')), 'abl');
  assert.equal(rhymeOf(sound('pst')), 'pst'); // sans voyelle, tout le mot
});

test('mot inventé : « glorbiture » se devine, rime en /yʁ/', () => {
  const reading = guessReading('glorbiture')!;
  assert.ok(reading.guessed);
  assert.equal(rhymeOf(phonemesOf(reading)), 'yʁ');
  assert.equal(reading.syllables.length, 3);
});

test('règles de repli : eau, ain, ch, e final muet, nasales, consonnes doubles', () => {
  const ipa = (word: string) => phonemesOf(guessReading(word)!).join('');
  assert.equal(ipa('bateau'), 'bato');
  assert.equal(ipa('pain'), 'pɛ̃');
  assert.equal(ipa('chose'), 'ʃɔz');
  assert.equal(ipa('lampe'), 'lɑ̃p');
  assert.equal(ipa('bonbon'), 'bɔ̃bɔ̃');
  assert.equal(ipa('ville'), 'vil');
  assert.equal(ipa('gens'), 'ʒɑ̃');
  assert.equal(ipa('quoi'), 'kwa');
  assert.equal(ipa('chien'), 'ʃjɛ̃');
  assert.equal(ipa('œil-de-chat'), 'œjdəʃa'); // partie par partie ; « de » garde son e
  assert.equal(ipa('soleil'), 'sɔlɛj');
  assert.equal(ipa('travail'), 'tʁavaj');
  assert.equal(ipa('fauteuil'), 'fotœj');
  assert.equal(ipa('grenouille'), 'gʁənuj');
  assert.equal(guessReading('h'), undefined);
  assert.equal(phonemesOf(guessReading('zß')!).join(''), 'z'); // une lettre étrangère ne se prononce pas
});

test('prononciation : la catégorie choisit la lecture, puis une autre catégorie, puis les règles', () => {
  const phonetics = rhymePhonetics();
  assert.equal(ipaOf(pronounce('couvent', 'noun', phonetics)!), 'ku.vɑ̃');
  assert.equal(ipaOf(pronounce('couvent', 'verb', phonetics)!), 'kuv');
  assert.equal(ipaOf(pronounce('Vers', 'adverb', phonetics)!), 'vɛʁ'); // une autre catégorie
  assert.ok(pronounce('glorbiture', 'noun', phonetics)!.guessed);
  assert.equal(describeReading(pronounce('chaise', 'noun', phonetics)!), '/ʃɛz/ · 1 syllabe · rime /ɛz/');
  assert.equal(describeReading(pronounce('maison', 'noun', phonetics)!), '/mɛzɔ̃/ · 2 syllabes · rime /ɔ̃/');
  assert.match(describeReading(pronounce('glorbiture', 'noun', phonetics)!), / · devinée$/);
});

test('syllabes d’un vers : e muet devant consonne, élidé devant voyelle, muet en fin de vers', () => {
  const phonetics = new InMemoryPhonetics(
    [
      ['je', 'ʒə'], ['fais', 'fɛ'], ['souvent', 'su.vɑ̃'], ['ce', 'sə'], ['rêve', 'ʁɛv'], ['étrange', 'e.tʁɑ̃ʒ'], ['et', 'e'], ['pénétrant', 'pe.ne.tʁɑ̃'],
      ['dort', 'dɔʁ'],
    ].map(([form, ipa]) => ({ form: form!, category: 'other' as const, reading: parseReading(ipa!)! })),
  );
  const line = (text: string) => lineSyllables(text.split(' ').map((word) => ({ word })), phonetics);
  assert.equal(line('Je fais souvent ce rêve étrange et pénétrant'), 12);
  assert.equal(line('rêve dort'), 3);
  assert.equal(line('dort rêve'), 2);
  assert.equal(line("l' rêve"), 1); // « l' » n'a pas de voyelle
  assert.equal(lineSyllables([], phonetics), undefined);
});

test('genre de la rime : rose, roses et chantent sont féminins ; vert, souvent et été sont masculins', () => {
  assert.equal(rhymeGender('rose', sound('ʁoz')), 'feminine');
  assert.equal(rhymeGender('roses', sound('ʁoz')), 'feminine');
  assert.equal(rhymeGender('chantent', sound('ʃɑ̃t')), 'feminine');
  assert.equal(rhymeGender('vert', sound('vɛʁ')), 'masculine');
  assert.equal(rhymeGender('souvent', sound('su.vɑ̃')), 'masculine');
  assert.equal(rhymeGender('été', sound('e.te')), 'masculine');
  assert.equal(rhymeGender('e', []), 'masculine'); // rien à lire
  assert.ok(hasGender('rose', sound('ʁoz'), 'any') && hasGender('rose', sound('ʁoz'), 'alternate'));
  assert.ok(hasGender('rose', sound('ʁoz'), 'feminine') && !hasGender('vert', sound('vɛʁ'), 'feminine'));
});

test('découpe de la rime : la voyelle et ce qui la suit', () => {
  assert.deepEqual(splitRhyme(sound('vɛʁ')), { vowel: 'ɛ', coda: 'ʁ' });
  assert.deepEqual(splitRhyme(sound('mɛ.zɔ̃')), { vowel: 'ɔ̃', coda: '' });
  assert.deepEqual(splitRhyme(sound('ʁoz')), { vowel: 'o', coda: 'z' });
  assert.deepEqual(splitRhyme([]), { vowel: '', coda: '' });
});

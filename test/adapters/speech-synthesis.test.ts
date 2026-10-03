import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSpeechSynthesis, type SynthesisLike } from '../../src/adapters/speech/speech-synthesis.ts';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readonly text: string;
  constructor(text: string) {
    this.text = text;
  }
}

const voice = (voiceURI: string, lang: string) => ({ voiceURI, name: voiceURI, lang }) as SpeechSynthesisVoice;

const fakeSynthesis = (voices: SpeechSynthesisVoice[]) => {
  const queue: FakeUtterance[] = [];
  let listener = () => {};
  const synthesis: SynthesisLike & { queue: FakeUtterance[]; cancels: number; setVoices(next: SpeechSynthesisVoice[]): void } = {
    queue,
    cancels: 0,
    getVoices: () => voices,
    speak: (utterance) => void queue.push(utterance as unknown as FakeUtterance),
    cancel: () => void synthesis.cancels++,
    addEventListener: (_type, next) => void (listener = next),
    setVoices(next) {
      voices = next;
      listener();
    },
  };
  return synthesis;
};
const create = (synthesis: ReturnType<typeof fakeSynthesis>) => createSpeechSynthesis(synthesis, FakeUtterance as unknown as new (text: string) => SpeechSynthesisUtterance);

test('seules les voix françaises sont proposées, et la liste se recharge quand le navigateur la remplit', () => {
  const synthesis = fakeSynthesis([]);
  const speech = create(synthesis);
  assert.deepEqual(speech.voices(), []);
  let changes = 0;
  speech.onVoices(() => changes++);
  synthesis.setVoices([voice('en-1', 'en-US'), voice('fr-1', 'fr-FR'), voice('ca-1', 'FR-ca')]);
  assert.equal(changes, 1);
  assert.deepEqual(speech.voices(), [{ id: 'fr-1', name: 'fr-1' }, { id: 'ca-1', name: 'ca-1' }]);
});

test('un énoncé par mot, dans l’ordre, avec la vitesse et la voix choisies ; résolu à la fin du dernier', async () => {
  const synthesis = fakeSynthesis([voice('fr-1', 'fr-FR'), voice('fr-2', 'fr-CA')]);
  const speech = create(synthesis);
  let done = false;
  const spoken = speech.speak(['pomme', 'de', 'terre'], { rate: 1.2, voice: 'fr-2' }).then(() => void (done = true));
  assert.deepEqual(synthesis.queue.map((u) => u.text), ['pomme', 'de', 'terre']);
  assert.ok(synthesis.queue.every((u) => u.rate === 1.2 && u.lang === 'fr-CA'));
  synthesis.queue[0]!.onend?.();
  await Promise.resolve();
  assert.equal(done, false);
  synthesis.queue[2]!.onend?.();
  await spoken;
  assert.equal(done, true);
});

test('une voix disparue : la première voix française ; sans voix, la langue française seule ; rien à dire : résolu tout de suite', async () => {
  const synthesis = fakeSynthesis([voice('fr-1', 'fr-FR')]);
  void create(synthesis).speak(['chat'], { rate: 1, voice: 'partie' });
  assert.equal((synthesis.queue[0]!.voice as SpeechSynthesisVoice).voiceURI, 'fr-1');
  const silent = fakeSynthesis([]);
  void create(silent).speak(['chat'], { rate: 1 });
  assert.equal(silent.queue[0]!.lang, 'fr-FR');
  assert.equal(silent.queue[0]!.voice, null);
  await create(silent).speak([], { rate: 1 });
  assert.equal(silent.queue.length, 1);
});

test('couper : le navigateur se tait et la parole en vol rend la main, même sans « end »', async () => {
  const synthesis = fakeSynthesis([voice('fr-1', 'fr-FR')]);
  const speech = create(synthesis);
  const spoken = speech.speak(['chat', 'dort'], { rate: 1 });
  speech.cancel();
  await spoken;
  assert.equal(synthesis.cancels, 1);
  // une erreur sur le dernier mot rend aussi la main
  const failed = speech.speak(['chat'], { rate: 1 });
  synthesis.queue.at(-1)!.onerror?.();
  await failed;
});

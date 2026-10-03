import type { Speech, SpeakOptions, Voice } from '../../src/ports/speech.ts';

/** Une voix factice : elle note ce qu'on lui fait dire, et ne finit de parler que quand on le lui dit. */
export interface FakeSpeech extends Speech {
  /** Les énoncés, dans l'ordre : les mots et leurs réglages. */
  said: { words: string[]; options: SpeakOptions }[];
  /** Finit l'énoncé en cours. */
  finish(): void;
  /** Change la liste des voix et prévient. */
  setVoices(voices: Voice[]): void;
  cancels: number;
}

export function fakeSpeech(voices: Voice[] = [{ id: 'fr-1', name: 'Amélie' }]): FakeSpeech {
  let listener = () => {};
  let pending: (() => void) | undefined;
  const speech: FakeSpeech = {
    said: [],
    cancels: 0,
    voices: () => voices,
    onVoices: (next) => void (listener = next),
    speak(words, options) {
      speech.said.push({ words: [...words], options });
      return new Promise((resolve) => void (pending = resolve));
    },
    cancel() {
      speech.cancels++;
      speech.finish();
    },
    finish() {
      const resolve = pending;
      pending = undefined;
      resolve?.();
    },
    setVoices(next) {
      voices = next;
      listener();
    },
  };
  return speech;
}

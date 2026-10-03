import type { Speech } from '../../ports/speech.ts';

/** Ce que l'adaptateur demande à `speechSynthesis` : de quoi le remplacer dans les tests. */
export type SynthesisLike = Pick<SpeechSynthesis, 'getVoices' | 'speak' | 'cancel'> & {
  addEventListener(type: 'voiceschanged', listener: () => void): void;
};

const isFrench = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().startsWith('fr');

/**
 * La voix du système, par la synthèse vocale du navigateur : rien ne quitte la machine. Chaque
 * mot est un énoncé à part, mis en file d'un coup ; la parole se coupe entre deux mots.
 */
export function createSpeechSynthesis(synthesis: SynthesisLike, Utterance: new (text: string) => SpeechSynthesisUtterance): Speech {
  const french = () => synthesis.getVoices().filter(isFrench);
  // Ce qui reste à résoudre : couper la parole doit rendre la main même si le navigateur n'émet pas `end`.
  const pending = new Set<() => void>();
  return {
    voices: () => french().map((voice) => ({ id: voice.voiceURI, name: voice.name })),
    onVoices: (listener) => synthesis.addEventListener('voiceschanged', listener),
    speak(words, { rate, voice }) {
      if (!words.length) return Promise.resolve();
      const voices = french();
      const chosen = voices.find((candidate) => candidate.voiceURI === voice) ?? voices[0];
      return new Promise((resolve) => {
        const done = () => {
          pending.delete(done);
          resolve();
        };
        pending.add(done);
        words.forEach((word, k) => {
          const utterance = new Utterance(word);
          utterance.lang = chosen?.lang ?? 'fr-FR';
          utterance.rate = rate;
          if (chosen) utterance.voice = chosen;
          if (k === words.length - 1) utterance.onend = utterance.onerror = done;
          synthesis.speak(utterance);
        });
      });
    },
    cancel() {
      synthesis.cancel();
      for (const done of [...pending]) done();
    },
  };
}

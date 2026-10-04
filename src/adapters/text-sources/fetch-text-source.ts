import type { TextSource } from '../../ports/text-source.ts';
import { inactivityTimer, type InactivityOptions } from '../loading/inactivity.ts';

/**
 * Lit un fichier statique par `fetch` (navigateur), morceau par morceau : si rien n'arrive pendant
 * le délai d'inactivité (30 s par défaut), la lecture est annulée et rejette avec une `StalledError`.
 */
export function fetchTextSource(url: string | URL, options: InactivityOptions = { resource: 'du fichier' }): TextSource {
  return async () => {
    const abort = new AbortController();
    let stalled: Error | undefined;
    const timer = inactivityTimer((error) => {
      stalled = error;
      abort.abort(error);
    }, options);
    timer.touch();
    try {
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error(`${url} : ${response.status}`);
      if (!response.body) return await response.text();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        timer.touch();
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      return text + decoder.decode();
    } catch (error) {
      throw stalled ?? error;
    } finally {
      timer.stop();
    }
  };
}

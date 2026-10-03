import type { TextSource } from '../../ports/text-source.ts';

/** Lit un fichier statique par `fetch` (navigateur). */
export function fetchTextSource(url: string | URL): TextSource {
  return async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} : ${response.status}`);
    return response.text();
  };
}

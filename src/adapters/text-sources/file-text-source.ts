import { readFile } from 'node:fs/promises';
import type { TextSource } from '../../ports/text-source.ts';

/** Lit un fichier local (Node : scripts et tests). */
export function fileTextSource(path: string | URL): TextSource {
  return () => readFile(path, 'utf8');
}

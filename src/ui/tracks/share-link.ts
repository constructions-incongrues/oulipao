import { z } from 'zod';
import { NotebookEntrySchema } from './notebook.ts';

/**
 * Une entrée du carnet telle qu'elle voyage dans un lien : tout ce qu'il faut pour la lire et la
 * rejouer, sans l'identifiant ni la date de garde, qui n'appartiennent qu'au carnet de l'auteur.
 */
export const SharedEntrySchema = NotebookEntrySchema.omit({ id: true, keptAt: true });
export type SharedEntry = z.infer<typeof SharedEntrySchema>;

/** Le fragment d'un lien d'Oulipao, sans le `#` : la version, un point, puis l'entrée. */
const PREFIX = 'v1.';
const KNOWN = /^#?v\d+\./;

/** Le fragment est-il un lien d'Oulipao, quelle qu'en soit la version ? Une ancre étrangère ne l'est pas. */
export const isShareFragment = (fragment: string) => KNOWN.test(fragment);
/** Au-delà, un lien décompressé est refusé : rien de ce que garde le carnet n'en approche. */
const MAX_BYTES = 1_000_000;
/** Au-delà, certaines messageries coupent le lien : on prévient en le partageant. */
export const LONG_LINK = 8_000;

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit = Infinity): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error('lien trop grand');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

const toBase64Url = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('caractère inattendu');
  return Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
}

/** Le fragment qui porte une entrée du carnet : compressé, et sûr dans une adresse. */
export async function encodeEntry(entry: SharedEntry): Promise<string> {
  const { id: _, keptAt: __, ...shared } = entry as SharedEntry & { id?: string; keptAt?: string };
  const json = new TextEncoder().encode(JSON.stringify(shared));
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

/**
 * Lit le fragment d'une adresse, `#` compris ou non. Rien : ce n'est pas un lien d'Oulipao.
 * `'unreadable'` : c'en est un, mais tronqué, abîmé, ou d'une version que celle-ci ne lit pas.
 */
export async function decodeFragment(fragment: string): Promise<SharedEntry | 'unreadable' | undefined> {
  const body = fragment.replace(/^#/, '');
  if (!KNOWN.test(body)) return undefined;
  if (!body.startsWith(PREFIX)) return 'unreadable';
  try {
    const bytes = await pipe(fromBase64Url(body.slice(PREFIX.length)), new DecompressionStream('deflate-raw'), MAX_BYTES);
    const parsed = SharedEntrySchema.safeParse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
    return parsed.success ? parsed.data : 'unreadable';
  } catch {
    return 'unreadable';
  }
}

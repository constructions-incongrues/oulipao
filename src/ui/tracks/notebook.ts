import { z } from 'zod';
import { TaggedWordSchema } from '../../domain/tagged-word.ts';
import { MixerStateSchema } from './types.ts';

/**
 * Un texte gardé : le texte résultant tel qu'il a été gardé, la mention de sa chaîne, et de quoi
 * le rouvrir à l'identique — le texte d'origine avec son étiquetage (les verrous et les pas bouchés
 * désignent les mots par leur position) et l'état de la table.
 */
export const NotebookEntrySchema = z.object({
  id: z.string().min(1),
  keptAt: z.iso.datetime(),
  result: z.string(),
  mention: z.string(),
  source: z.object({ text: z.string().min(1), tagged: z.array(TaggedWordSchema) }),
  mixer: MixerStateSchema,
});
export type NotebookEntry = z.infer<typeof NotebookEntrySchema>;

/** Le carnet tel qu'il est stocké et exporté ; les entrées se valident une à une. */
export const NotebookFileSchema = z.object({ version: z.literal(1), entries: z.array(z.unknown()) });

export interface ParsedNotebook {
  entries: NotebookEntry[];
  /** Les entrées illisibles, laissées de côté. */
  rejected: number;
  /** Le texte n'est pas un carnet : aucune entrée n'a pu être lue. */
  error?: string;
}

const newestFirst = (entries: readonly NotebookEntry[]) => [...entries].sort((a, b) => b.keptAt.localeCompare(a.keptAt));

/** Lit un carnet : une entrée abîmée est comptée et laissée de côté, sans cacher les autres. */
export function parseNotebook(raw: string | null): ParsedNotebook {
  if (raw === null) return { entries: [], rejected: 0 };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { entries: [], rejected: 0, error: 'Le carnet est illisible.' };
  }
  const file = NotebookFileSchema.safeParse(json);
  if (!file.success) return { entries: [], rejected: 0, error: 'Ce n’est pas un carnet d’Oulipao.' };
  const parsed = file.data.entries.map((entry) => NotebookEntrySchema.safeParse(entry));
  const entries = parsed.flatMap((result) => (result.success ? [result.data] : []));
  return { entries: newestFirst(entries), rejected: parsed.length - entries.length };
}

export const serializeNotebook = (entries: readonly NotebookEntry[]) => JSON.stringify({ version: 1, entries });

export const addEntry = (entries: readonly NotebookEntry[], entry: NotebookEntry) => newestFirst([entry, ...entries]);

export const removeEntry = (entries: readonly NotebookEntry[], id: string) => entries.filter((entry) => entry.id !== id);

export interface MergedNotebook extends ParsedNotebook {
  added: number;
  /** Les entrées du fichier déjà dans le carnet, par identifiant. */
  present: number;
}

/** Fusionne un carnet importé : seules les entrées dont l'identifiant est nouveau s'ajoutent. */
export function mergeEntries(current: readonly NotebookEntry[], raw: string): MergedNotebook {
  const incoming = parseNotebook(raw);
  if (incoming.error) return { ...incoming, entries: [...current], added: 0, present: 0 };
  const known = new Set(current.map((entry) => entry.id));
  const fresh = incoming.entries.filter((entry) => !known.has(entry.id));
  return { entries: newestFirst([...current, ...fresh]), rejected: incoming.rejected, added: fresh.length, present: incoming.entries.length - fresh.length };
}

/** Le nom du fichier exporté, à la date du jour : `oulipao-carnet-2026-10-03.json`. */
export function exportFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `oulipao-carnet-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

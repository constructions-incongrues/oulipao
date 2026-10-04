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
  /** La retouche du fondateur, gardée à côté du résultat produit ; absente : aucune. */
  edited: z.string().optional(),
});
export type NotebookEntry = z.infer<typeof NotebookEntrySchema>;

/** Le carnet tel qu'il est stocké et exporté ; les entrées se valident une à une. */
export const NotebookFileSchema = z.object({ version: z.literal(1), entries: z.array(z.unknown()) });

export interface ParsedNotebook {
  entries: NotebookEntry[];
  /** Les entrées illisibles par cette version : comptées, et gardées telles quelles. */
  rejected: number;
  /** Ces entrées, brutes : réécrites à chaque sauvegarde et exportées, pour qu'aucune ne se perde. */
  unreadable: unknown[];
  /** Le texte n'est pas un carnet : aucune entrée n'a pu être lue. */
  error?: string;
}

const newestFirst = (entries: readonly NotebookEntry[]) => [...entries].sort((a, b) => b.keptAt.localeCompare(a.keptAt));

/** Lit un carnet : une entrée abîmée est comptée et gardée à part, sans cacher les autres. */
export function parseNotebook(raw: string | null): ParsedNotebook {
  if (raw === null) return { entries: [], rejected: 0, unreadable: [] };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { entries: [], rejected: 0, unreadable: [], error: 'Le carnet est illisible.' };
  }
  const file = NotebookFileSchema.safeParse(json);
  if (!file.success) return { entries: [], rejected: 0, unreadable: [], error: 'Ce n’est pas un carnet d’Oulipao.' };
  const entries: NotebookEntry[] = [];
  const unreadable: unknown[] = [];
  for (const entry of file.data.entries) {
    const result = NotebookEntrySchema.safeParse(entry);
    if (result.success) entries.push(result.data);
    else unreadable.push(entry);
  }
  return { entries: newestFirst(entries), rejected: unreadable.length, unreadable };
}

/** Le carnet à garder ou à exporter : les entrées lisibles, puis les illisibles telles qu'elles étaient. */
export const serializeNotebook = (entries: readonly NotebookEntry[], unreadable: readonly unknown[] = []) => JSON.stringify({ version: 1, entries: [...entries, ...unreadable] });

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
  return { entries: newestFirst([...current, ...fresh]), rejected: incoming.rejected, unreadable: incoming.unreadable, added: fresh.length, present: incoming.entries.length - fresh.length };
}

/** Le nom du fichier exporté, à la date du jour : `oulipao-carnet-2026-10-03.json`. */
export function exportFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `oulipao-carnet-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

/** Retouche le résultat d'une entrée ; un texte vide, ou égal au résultat produit, retire la retouche. */
export function editEntry(entries: readonly NotebookEntry[], id: string, text: string): NotebookEntry[] {
  return entries.map((entry) => {
    if (entry.id !== id) return entry;
    const { edited: _, ...rest } = entry;
    return !text.trim() || text === entry.result ? rest : { ...rest, edited: text };
  });
}

/** Une entrée copiée d'un bloc, comme dans un mail : l'original, le résultat (retouché), la chaîne. */
export const entryClipboard = (entry: NotebookEntry) => `${entry.source.text}\n\n${entry.edited ?? entry.result}${entry.mention}`;

/** Les jours de calendrier, en heure locale, entre une garde et aujourd'hui : 23 h 50 la veille compte 1. */
export function daysSince(iso: string, today: Date): number {
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((day(today) - day(new Date(iso))) / 86_400_000);
}

/** « aujourd'hui », « hier », « il y a 3 jours ». */
export const lastKeptLabel = (days: number) => (days <= 0 ? 'aujourd’hui' : days === 1 ? 'hier' : `il y a ${days} jours`);

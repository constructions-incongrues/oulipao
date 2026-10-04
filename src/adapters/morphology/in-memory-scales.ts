import { z } from 'zod';
import { S7OrderSchema, type ScaleCategory, type ScaleOrder } from '../../domain/s7/types.ts';
import type { ScaleRepository } from '../../ports/scales.ts';
import type { TextSource } from '../../ports/text-source.ts';

/** Une note du fichier dérivé : un lemme sur une échelle. */
export const ScaleEntrySchema = z.object({
  order: S7OrderSchema.exclude(['alphabetical']),
  category: z.enum(['noun', 'adjective']),
  lemma: z.string().min(1),
  score: z.number().int().min(0).max(100),
});
export type ScaleEntry = z.infer<typeof ScaleEntrySchema>;

const NONE: readonly never[] = [];
const collator = new Intl.Collator('fr');

/** Échelles tenues en mémoire : sert aux tests comme au fichier dérivé. */
export class InMemoryScales implements ScaleRepository {
  readonly #lists = new Map<string, string[]>();
  readonly #scores = new Map<string, number>();

  constructor(entries: readonly ScaleEntry[]) {
    const byScale = new Map<string, ScaleEntry[]>();
    for (const entry of entries) {
      const key = `${entry.order}\t${entry.category}`;
      byScale.set(key, [...(byScale.get(key) ?? []), entry]);
      this.#scores.set(`${key}\t${entry.lemma}`, entry.score);
    }
    // De la note la plus basse à la plus haute ; à note égale, l'ordre du dictionnaire, pour un résultat stable.
    for (const [key, list] of byScale)
      this.#lists.set(key, list.sort((a, b) => a.score - b.score || collator.compare(a.lemma, b.lemma)).map(({ lemma }) => lemma));
  }

  scale(order: ScaleOrder, category: ScaleCategory): readonly string[] {
    return this.#lists.get(`${order}\t${category}`) ?? NONE;
  }
  score(order: ScaleOrder, category: ScaleCategory, lemma: string): number | undefined {
    return this.#scores.get(`${order}\t${category}\t${lemma}`);
  }
}

/** Lit le fichier dérivé ; lève si une ligne n'est pas conforme. */
export function parseScales(tsv: string): ScaleEntry[] {
  const entries: ScaleEntry[] = [];
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [order, category, lemma, score] = line.split('\t');
    const entry = ScaleEntrySchema.safeParse({ order, category, lemma, score: score === undefined || score === '' ? undefined : Number(score) });
    if (!entry.success) throw new Error(`échelles : ligne non conforme « ${line} »`);
    entries.push(entry.data);
  }
  return entries;
}

export async function loadScales(source: TextSource): Promise<ScaleRepository> {
  return new InMemoryScales(parseScales(await source()));
}

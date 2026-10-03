import { z } from 'zod';
import type { Category } from '../../domain/categories.ts';
import { parseReading, phonemesOf, type PhoneticReading } from '../../domain/phonetics/phoneme.ts';
import { rhymeOf } from '../../domain/phonetics/rhyme.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { TextSource } from '../../ports/text-source.ts';

/** Une prononciation du lexique, rattachée à une forme et à une catégorie. */
export interface PhoneticEntry {
  form: string;
  category: Category;
  reading: PhoneticReading;
}

const NONE: readonly never[] = [];
const collator = new Intl.Collator('fr');
const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** Prononciations tenues en mémoire : sert aux tests (petites données) comme au fichier dérivé. */
export class InMemoryPhonetics implements PhoneticsRepository {
  readonly #byForm = new Map<string, PhoneticEntry[]>();
  readonly #bySound = new Map<string, string[]>();

  constructor(entries: readonly PhoneticEntry[]) {
    for (const entry of entries) {
      push(this.#byForm, entry.form, entry);
      push(this.#bySound, `${entry.category}\t${phonemesOf(entry.reading).join('')}`, entry.form);
    }
    for (const forms of this.#bySound.values()) forms.sort(collator.compare);
  }

  readings(form: string, category?: Category): readonly PhoneticReading[] {
    const entries = this.#byForm.get(form) ?? NONE;
    return entries.filter((entry) => !category || entry.category === category).map((entry) => entry.reading);
  }
  homophones(phonemes: string, category: Category): readonly string[] {
    return this.#bySound.get(`${category}\t${phonemes}`) ?? NONE;
  }
}

const CATEGORIES: Record<string, Category> = { N: 'noun', A: 'adjective', V: 'verb', R: 'adverb', O: 'other' };
const RowSchema = z.tuple([z.string().min(1), z.enum(['N', 'A', 'V', 'R', 'O']), z.string().min(1), z.string().min(1)]);

/** Lit le fichier dérivé ; lève si une ligne n'est pas conforme (phonème inconnu, rime fausse). */
export function parsePhonetics(tsv: string): PhoneticEntry[] {
  const entries: PhoneticEntry[] = [];
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const row = RowSchema.safeParse(line.split('\t'));
    const reading = row.success ? parseReading(row.data[2]) : undefined;
    if (!row.success || !reading || rhymeOf(phonemesOf(reading)) !== row.data[3]) throw new Error(`phonétique : ligne non conforme « ${line} »`);
    entries.push({ form: row.data[0], category: CATEGORIES[row.data[1]]!, reading });
  }
  return entries;
}

export async function loadPhonetics(source: TextSource): Promise<PhoneticsRepository> {
  return new InMemoryPhonetics(parsePhonetics(await source()));
}

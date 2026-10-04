import { z } from 'zod';
import type { Category } from '../../domain/categories.ts';
import { ipaOf, parseReading, phonemesOf, splitPhonemes, type Phoneme, type PhoneticReading } from '../../domain/phonetics/phoneme.ts';
import { rhymeOf } from '../../domain/phonetics/rhyme.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { TextSource } from '../../ports/text-source.ts';

/** Une prononciation du lexique, rattachée à une forme et à une catégorie. */
export interface PhoneticEntry {
  form: string;
  category: Category;
  reading: PhoneticReading;
  /** GLÀFF dans la catégorie (`G`, par défaut), GLÀFF dans une autre catégorie (`A`), ou les règles (`R`). */
  source?: 'G' | 'A' | 'R';
}

const NONE: readonly never[] = [];
const collator = new Intl.Collator('fr');
const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** Une prononciation telle qu'elle est gardée : l'API en chaîne, analysée seulement à la demande. */
interface Stored {
  category: Category;
  ipa: string;
  guessed: boolean;
  source: 'G' | 'A' | 'R';
}

/** Une ligne du fichier dérivé, validée mais pas analysée en syllabes : la forme compacte du chargement. */
export interface PhoneticRow {
  form: string;
  category: Category;
  ipa: string;
  source: 'G' | 'A' | 'R';
}

/**
 * Prononciations tenues en mémoire : sert aux tests (petites données) comme au fichier dérivé.
 * Chaque prononciation est gardée en chaîne API ; ses syllabes ne sont analysées qu'à la première
 * lecture de sa forme. Le fichier réel (528 000 lignes) tenait 611 Mo en objets analysés.
 */
export class InMemoryPhonetics implements PhoneticsRepository {
  readonly #byForm = new Map<string, Stored[]>();
  readonly #bySound = new Map<string, string[]>();
  readonly #byRhyme = new Map<string, string[]>();
  readonly #byEnding = new Map<string, string[]>();
  readonly #parsed = new WeakMap<Stored, PhoneticReading>();

  constructor(entries: readonly PhoneticEntry[] = []) {
    for (const entry of entries) this.#add(entry.form, { category: entry.category, ipa: ipaOf(entry.reading), guessed: entry.reading.guessed, source: entry.source ?? 'G' }, phonemesOf(entry.reading));
    this.#sort();
  }

  /** Les lignes du fichier dérivé, sans analyse en syllabes : la voie du chargement réel. */
  static fromRows(rows: Iterable<PhoneticRow>): InMemoryPhonetics {
    const phonetics = new InMemoryPhonetics();
    for (const row of rows) phonetics.#add(row.form, { category: row.category, ipa: row.ipa, guessed: row.source === 'R', source: row.source }, splitPhonemes(row.ipa.replaceAll('.', ''))!);
    phonetics.#sort();
    return phonetics;
  }

  #add(form: string, stored: Stored, phonemes: readonly Phoneme[]) {
    push(this.#byForm, form, stored);
    // Les homophones restent ceux du lexique : une prononciation empruntée ou devinée n'en fait pas.
    if (stored.source === 'G') push(this.#bySound, `${stored.category}\t${phonemes.join('')}`, form);
    push(this.#byRhyme, `${stored.category}\t${rhymeOf(phonemes)}`, form);
    // Les finales d'un à trois phonèmes : la rime riche en exige au plus trois.
    for (let length = 1; length <= Math.min(3, phonemes.length); length++)
      push(this.#byEnding, `${stored.category}\t${phonemes.slice(-length).join('')}`, form);
  }

  #sort() {
    for (const forms of this.#bySound.values()) forms.sort(collator.compare);
  }

  #reading(stored: Stored): PhoneticReading {
    let reading = this.#parsed.get(stored);
    if (!reading) {
      reading = parseReading(stored.ipa, stored.guessed)!;
      this.#parsed.set(stored, reading);
    }
    return reading;
  }

  readings(form: string, category?: Category): readonly PhoneticReading[] {
    const entries = this.#byForm.get(form) ?? NONE;
    return entries.filter((entry) => !category || entry.category === category).map((entry) => this.#reading(entry));
  }
  homophones(phonemes: string, category: Category): readonly string[] {
    return this.#bySound.get(`${category}\t${phonemes}`) ?? NONE;
  }
  rhyming(rhyme: string, category: Category): readonly string[] {
    return this.#byRhyme.get(`${category}\t${rhyme}`) ?? NONE;
  }
  ending(phonemes: string, category: Category): readonly string[] {
    return this.#byEnding.get(`${category}\t${phonemes}`) ?? NONE;
  }
}

const CATEGORIES: Record<string, Category> = { N: 'noun', A: 'adjective', V: 'verb', R: 'adverb', O: 'other' };
const RowSchema = z.tuple([z.string().min(1), z.enum(['N', 'A', 'V', 'R', 'O']), z.string().min(1), z.string().min(1), z.enum(['G', 'A', 'R'])]);

/** Vérifie une ligne du fichier dérivé ; rend la ligne compacte, ou rien si elle n'est pas conforme (phonème inconnu, rime fausse, source inconnue). */
function checkRow(line: string): PhoneticRow | undefined {
  const row = RowSchema.safeParse(line.split('\t'));
  if (!row.success) return undefined;
  const [form, category, ipa, rhyme, source] = row.data;
  const syllables = ipa.split('.').map(splitPhonemes);
  if (syllables.some((syllable) => !syllable?.length)) return undefined;
  if (rhymeOf(syllables.flat() as Phoneme[]) !== rhyme) return undefined;
  return { form, category: CATEGORIES[category]!, ipa, source };
}

/** Lit le fichier dérivé en lignes compactes ; lève si une ligne n'est pas conforme. */
export function* parsePhoneticRows(tsv: string): Generator<PhoneticRow> {
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const row = checkRow(line);
    if (!row) throw new Error(`phonétique : ligne non conforme « ${line} »`);
    yield row;
  }
}

/** Lit le fichier dérivé en prononciations analysées (petits fichiers, tests) ; lève si une ligne n'est pas conforme. */
export function parsePhonetics(tsv: string): PhoneticEntry[] {
  return [...parsePhoneticRows(tsv)].map(({ form, category, ipa, source }) => ({ form, category, reading: parseReading(ipa, source === 'R')!, source }));
}

export async function loadPhonetics(source: TextSource): Promise<PhoneticsRepository> {
  return InMemoryPhonetics.fromRows(parsePhoneticRows(await source()));
}

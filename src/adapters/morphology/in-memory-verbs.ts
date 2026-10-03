import { z } from 'zod';
import { AUXILIARIES, PersonSchema, VerbFormSchema, type VerbForm } from '../../domain/verb.ts';
import type { TextSource } from '../../ports/text-source.ts';
import type { VerbRepository } from '../../ports/verbs.ts';

const NO_FORMS: readonly never[] = [];
const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** Verbes tenus en mémoire : sert aux tests (petites données) comme au fichier dérivé. */
export class InMemoryVerbs implements VerbRepository {
  readonly #byForm = new Map<string, VerbForm[]>();
  readonly #byInfinitive = new Map<string, VerbForm[]>();
  readonly #infinitives: string[];
  readonly #noElision: Set<string>;

  constructor(forms: readonly VerbForm[], noElision: readonly string[] = []) {
    for (const form of forms) {
      push(this.#byForm, form.form, form);
      push(this.#byInfinitive, form.infinitive, form);
    }
    // Ordre du dictionnaire français : accents ignorés au premier niveau ; ni « être » ni « avoir ».
    this.#infinitives = [...this.#byInfinitive.keys()].filter((infinitive) => !AUXILIARIES.has(infinitive)).sort(new Intl.Collator('fr').compare);
    this.#noElision = new Set(noElision);
  }

  infinitives(): readonly string[] {
    return this.#infinitives;
  }
  readings(form: string): readonly VerbForm[] {
    return this.#byForm.get(form) ?? NO_FORMS;
  }
  forms(infinitive: string): readonly VerbForm[] {
    return this.#byInfinitive.get(infinitive) ?? NO_FORMS;
  }
  blocksElision(form: string): boolean {
    return this.#noElision.has(form);
  }
}

// Fichier dérivé data/verbes-oulipao.tsv : « V <TAB> forme <TAB> infinitif <TAB> temps <TAB> personne | genre+nombre | - <TAB> 0|1 ».
const RowSchema = z.tuple([z.literal('V'), z.string(), z.string(), z.string(), z.string(), z.enum(['0', '1'])]);
const DetailSchema = z.union([z.literal('-'), PersonSchema, z.string().regex(/^[mfe][spi]$/)]);

/** Lit le fichier dérivé ; lève si une ligne n'est pas conforme. */
export function parseVerbs(tsv: string): { forms: VerbForm[]; noElision: string[] } {
  const forms: VerbForm[] = [];
  const noElision: string[] = [];
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const row = RowSchema.safeParse(line.split('\t'));
    const detail = row.success ? DetailSchema.safeParse(row.data[4]) : undefined;
    if (!row.success || !detail?.success) throw new Error(`verbes : ligne non conforme « ${line} »`);
    const [, form, infinitive, tense, , blocks] = row.data;
    const features =
      detail.data === '-' ? {} : PersonSchema.safeParse(detail.data).success ? { person: detail.data } : { gender: detail.data[0], number: detail.data[1] };
    const entry = VerbFormSchema.safeParse({ form, infinitive, tense, ...features });
    if (!entry.success) throw new Error(`verbes : ligne non conforme « ${line} »`);
    forms.push(entry.data);
    if (blocks === '1') noElision.push(form);
  }
  return { forms, noElision };
}

export async function loadVerbs(source: TextSource): Promise<VerbRepository> {
  const { forms, noElision } = parseVerbs(await source());
  return new InMemoryVerbs(forms, noElision);
}

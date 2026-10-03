import { z } from 'zod';
import { AdjectiveFormSchema, NounFormSchema, type AdjectiveForm, type NounForm } from '../../domain/s7/types.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { TextSource } from '../../ports/text-source.ts';

export interface MorphologyData {
  nouns: NounForm[];
  adjectives: AdjectiveForm[];
  /** Adverbes, invariables. */
  adverbs?: string[];
  /** Formes qui interdisent l'élision. */
  noElision: string[];
}

const NO_FORMS: readonly never[] = [];
const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** Morphologie tenue en mémoire : sert aux tests (petites données) comme au fichier dérivé. */
export class InMemoryMorphology implements MorphologyRepository {
  readonly #lemmas: string[];
  readonly #nounsByForm = new Map<string, NounForm[]>();
  readonly #nounsByLemma = new Map<string, NounForm[]>();
  readonly #adjectivesByForm = new Map<string, AdjectiveForm[]>();
  readonly #adjectivesByParadigm = new Map<string, AdjectiveForm[]>();
  readonly #noElision: Set<string>;
  readonly #paradigms: string[];
  readonly #adverbs: string[];

  constructor(data: MorphologyData) {
    for (const noun of data.nouns) {
      push(this.#nounsByForm, noun.form, noun);
      push(this.#nounsByLemma, noun.lemma, noun);
    }
    for (const adjective of data.adjectives) {
      push(this.#adjectivesByForm, adjective.form, adjective);
      push(this.#adjectivesByParadigm, adjective.paradigm, adjective);
    }
    // Ordre du dictionnaire français : accents ignorés au premier niveau.
    const order = new Intl.Collator('fr').compare;
    this.#lemmas = [...this.#nounsByLemma.keys()].sort(order);
    this.#paradigms = [...this.#adjectivesByParadigm.keys()].sort(order);
    this.#adverbs = [...new Set(data.adverbs ?? [])].sort(order);
    this.#noElision = new Set(data.noElision);
  }

  nounLemmas(): readonly string[] {
    return this.#lemmas;
  }
  nounReadings(form: string): readonly NounForm[] {
    return this.#nounsByForm.get(form) ?? NO_FORMS;
  }
  nounForms(lemma: string): readonly NounForm[] {
    return this.#nounsByLemma.get(lemma) ?? NO_FORMS;
  }
  adjectiveReadings(form: string): readonly AdjectiveForm[] {
    return this.#adjectivesByForm.get(form) ?? NO_FORMS;
  }
  adjectiveForms(paradigm: string): readonly AdjectiveForm[] {
    return this.#adjectivesByParadigm.get(paradigm) ?? NO_FORMS;
  }
  adjectiveParadigms(): readonly string[] {
    return this.#paradigms;
  }
  adverbs(): readonly string[] {
    return this.#adverbs;
  }
  blocksElision(form: string): boolean {
    return this.#noElision.has(form);
  }
}

// Fichier dérivé data/morpho-oulipao.tsv : « N|A|R <TAB> forme <TAB> lemme <TAB> genre <TAB> nombre <TAB> 0|1 »
// (1 = pas d'élision ; R = adverbe, invariable).
const RowSchema = z.tuple([z.enum(['N', 'A', 'R']), z.string(), z.string(), z.string(), z.string(), z.enum(['0', '1'])]);

/** Lit le fichier dérivé ; lève si une ligne n'est pas conforme. */
export function parseMorphology(tsv: string): MorphologyData {
  const data: MorphologyData = { nouns: [], adjectives: [], adverbs: [], noElision: [] };
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const row = RowSchema.safeParse(line.split('\t'));
    if (!row.success) throw new Error(`morphologie : ligne non conforme « ${line} »`);
    const [kind, form, lemma, gender, number, noElision] = row.data;
    if (kind === 'R') {
      data.adverbs!.push(form);
      continue;
    }
    const entry =
      kind === 'N'
        ? NounFormSchema.safeParse({ form, lemma, gender, number })
        : AdjectiveFormSchema.safeParse({ form, paradigm: lemma, gender, number });
    if (!entry.success) throw new Error(`morphologie : ligne non conforme « ${line} »`);
    if (kind === 'N') data.nouns.push(entry.data as NounForm);
    else data.adjectives.push(entry.data as AdjectiveForm);
    if (noElision === '1') data.noElision.push(form);
  }
  return data;
}

export async function loadMorphology(source: TextSource): Promise<MorphologyRepository> {
  return new InMemoryMorphology(parseMorphology(await source()));
}

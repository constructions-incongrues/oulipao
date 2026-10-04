import { z } from 'zod';

// Dérivation du lexique Grammalecte v7.7 (MPL 2.0) vers data/lexique-oulipao.tsv.
// Une ligne « forme<TAB>codes », codes ∈ n v a r o, sans doublon, dans l'ordre de préférence
// fixé AVANT toute mesure :
//   mot grammatical > auxiliaire être/avoir > adverbe > nom > verbe > adjectif > autre.
// Le lexique ne donne pas de fréquence par lecture (seulement par forme) : cet ordre est un
// choix a priori, pas un réglage sur les textes de référence.

/** Ligne utile du lexique brut : 20 colonnes au moins, dont forme, lemme et étiquettes. */
const GrammalecteRowSchema = z
  .array(z.string())
  .min(20)
  .transform((columns) => ({ form: columns[2]!, lemma: columns[3]!, tags: columns[4]!, notes: columns[7]!, domains: columns[8]! }))
  .pipe(z.object({ form: z.string().min(1), lemma: z.string().min(1), tags: z.string().min(1), notes: z.string(), domains: z.string() }));

/**
 * Formule chimique étiquetée nom (« AgBF₄ », « CO₂ », « NaCl ») : à écarter, aucun texte
 * n'en attend une en remplaçant. Tout chiffre en indice suffit (toutes les formes du lexique
 * qui en ont sont du domaine « chim ») ; sans indice, il faut le domaine « chim » ET une suite
 * de symboles d'éléments avec au moins une minuscule, pour garder les sigles (RMN, CPG) et
 * les unités (GHz, MeV) qui ont la même forme. Une « CO2 » en chiffres ordinaires sortirait
 * aussi : c'est une formule, pas un nom qu'on écrit.
 */
/** Symbole d'unité noté « symb » (« km », « dB », « ET » pour exatesla) : pas un nom qu'on écrit. */
export const isUnitSymbol = (notes: string) => /(^| )symb( |$)/.test(notes);

export function isChemicalFormula(form: string, domains: string): boolean {
  if (/[₀-₉]/.test(form)) return true;
  return /(^| )chim( |$)/.test(domains) && /^([A-Z][a-z]?\d*){2,}$/.test(form) && /[a-z\d]/.test(form);
}

export const LexiconCodeSchema = z.enum(['n', 'v', 'a', 'r', 'o']);
export type LexiconCode = z.infer<typeof LexiconCodeSchema>;

/** Lectures d'une ligne : couples [rang de préférence, code]. */
export function readingsOf(tags: string): [number, LexiconCode][] {
  const set = new Set(tags.split(' '));
  const readings: [number, LexiconCode][] = [];
  const adverb = set.has('adv') || set.has('negadv') || set.has('loc.adv');
  if (adverb) readings.push([2, 'r']);
  if (set.has('mg') && !adverb) readings.push([0, 'o']);
  if (set.has('nom')) readings.push([3, 'n']);
  if (set.has('adj')) readings.push([5, 'a']);
  const verb = [...set].find((tag) => /^v[0-3]/.test(tag));
  if (verb) readings.push([verb.startsWith('v0') ? 1 : 4, 'v']);
  if (!readings.length) readings.push([6, 'o']); // noms propres, interjections, nombres, etc.
  return readings;
}

export interface DerivedLexicon {
  /** Lignes « forme<TAB>codes », triées par forme. */
  entries: string[];
  stats: { forms: number; ambiguous: number; nounRowsWithGender: number; nounLemmasWithGender: number };
}

/** Dérive le lexique réduit à partir des lignes du fichier brut (en-têtes ignorés). */
export function deriveLexicon(lines: Iterable<string>): DerivedLexicon {
  const forms = new Map<string, Map<LexiconCode, number>>();
  const nounLemmas = new Set<string>();
  let nounRowsWithGender = 0;
  for (const line of lines) {
    const row = GrammalecteRowSchema.safeParse(line.split('\t'));
    if (!row.success || row.data.form === 'Flexion') continue; // commentaires, corpus, en-tête
    const { form, lemma, tags, notes, domains } = row.data;
    if (isChemicalFormula(form, domains) || isUnitSymbol(notes)) continue;
    if (/(^| )nom( |$)/.test(tags) && /(^| )(mas|fem|epi)( |$)/.test(tags)) {
      nounRowsWithGender++;
      nounLemmas.add(lemma);
    }
    let ranks = forms.get(form);
    if (!ranks) forms.set(form, (ranks = new Map()));
    for (const [rank, code] of readingsOf(tags)) {
      const known = ranks.get(code);
      if (known === undefined || known > rank) ranks.set(code, rank);
    }
  }
  const entries = [...forms]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([form, ranks]) => `${form}\t${[...ranks].sort((x, y) => x[1] - y[1]).map(([code]) => code).join('')}`);
  return {
    entries,
    stats: {
      forms: forms.size,
      ambiguous: [...forms.values()].filter((ranks) => ranks.size > 1).length,
      nounRowsWithGender,
      nounLemmasWithGender: nounLemmas.size,
    },
  };
}

export const DERIVED_LEXICON_HEADER = [
  '# This Source Code Form is subject to the terms of the Mozilla Public',
  '# License, v. 2.0. If a copy of the MPL was not distributed with this',
  '# file, You can obtain one at http://mozilla.org/MPL/2.0/.',
  '#',
  '# Dérivé du « Lexique des formes fléchies du français », Grammalecte v7.7 (Olivier R.,',
  '# https://grammalecte.net/). Modifié le 2026-10-03 pour Oulipao : réduit à forme + catégories.',
];

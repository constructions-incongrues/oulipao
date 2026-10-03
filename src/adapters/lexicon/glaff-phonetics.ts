// Dérivation de data/phonetique-oulipao.tsv à partir de GLÀFF 1.2.2 (CC BY-SA 3.0) : chaque forme
// avec sa catégorie, sa prononciation en API découpée en syllabes, et sa rime. GLÀFF est un fichier
// à champs séparés par « | » : forme, étiquette GRACE, lemme, prononciations API, prononciations
// SAMPA, puis des fréquences. Les prononciations d'un champ sont séparées par « ; », les syllabes
// par « . ». On ne garde que la première prononciation, celle que le Wiktionnaire donne d'abord.
import { guessReading } from '../../domain/phonetics/fallback.ts';
import { ipaOf, parseReading, phonemesOf, type PhoneticReading } from '../../domain/phonetics/phoneme.ts';
import { rhymeOf } from '../../domain/phonetics/rhyme.ts';

/** La catégorie d'Oulipao d'après l'étiquette GRACE : N nom, A adjectif, V verbe, R adverbe, O le reste. */
export function categoryOfGrace(tag: string): 'N' | 'A' | 'V' | 'R' | 'O' {
  if (tag.startsWith('Nc')) return 'N'; // les noms propres (Np) vont avec le reste, comme dans l'étiqueteur
  const head = tag[0];
  return head === 'A' || head === 'V' || head === 'R' ? head : 'O';
}

/**
 * D'où vient une prononciation : GLÀFF pour cette forme et cette catégorie (`G`), empruntée à une
 * autre ligne de GLÀFF, autre catégorie ou autre casse (`A`), ou devinée par les règles (`R`).
 */
export type PhoneticSource = 'G' | 'A' | 'R';

const rowOf = (form: string, category: string, reading: PhoneticReading, source: PhoneticSource) =>
  [form, category, ipaOf(reading), rhymeOf(phonemesOf(reading)), source].join('\t');

/** Retire ce que le Wiktionnaire ajoute parfois sans valeur de phonème : allongement, liaison, espaces. */
const clean = (ipa: string) => ipa.replace(/[ː'‿​ ]/g, '');

/**
 * La ligne dérivée d'une ligne de GLÀFF, ou rien : pas de prononciation, symbole hors de
 * l'inventaire, ou forme absente du lexique de Grammalecte (`known`), qu'Oulipao ne rencontrera pas.
 */
export function phoneticRowOf(line: string, known: (form: string) => boolean): string | undefined {
  const [form, tag, , ipa] = line.split('|');
  if (!form || !tag || !ipa || !known(form)) return undefined;
  const first = clean(ipa.split(';')[0]!);
  const reading = parseReading(first);
  if (!reading) return undefined;
  return rowOf(form, categoryOfGrace(tag), reading, 'G');
}

/** Le fichier dérivé : une ligne par forme et par catégorie, la première rencontrée. */
export function derivePhonetics(lines: Iterable<string>, known: (form: string) => boolean): string[] {
  const rows = new Map<string, string>();
  for (const line of lines) {
    const row = phoneticRowOf(line, known);
    if (!row) continue;
    const key = row.split('\t', 2).join('\t');
    if (!rows.has(key)) rows.set(key, row);
  }
  return [...rows.values()];
}

/**
 * Les lignes à ajouter pour qu'un filtre trouve toutes ses candidates dans l'index des rimes. Pour
 * chaque forme candidate (`universe`, forme et catégorie), le domaine prononce la forme en
 * minuscules : celle de GLÀFF dans la catégorie, sinon la première de GLÀFF pour la forme, sinon
 * celle des règles (`pronounce`). On écrit cette prononciation pour la forme en minuscules si elle
 * manque, et pour la forme dans sa casse d'origine, dont l'index a besoin pour retrouver le lemme
 * (« Kasaï-Occidental »). Ces lignes viennent après celles de GLÀFF, pour qu'une forme cherchée
 * sans catégorie rende toujours la même prononciation.
 */
export function completePhonetics(rows: readonly string[], universe: Iterable<readonly [form: string, category: 'N' | 'A' | 'V' | 'R']>): string[] {
  const own = new Map<string, string>();
  const first = new Map<string, string>();
  for (const row of rows) {
    const [form, category, ipa] = row.split('\t') as [string, string, string];
    if (!own.has(`${form}\t${category}`)) own.set(`${form}\t${category}`, ipa);
    if (!first.has(form)) first.set(form, ipa);
  }
  const present = new Set(own.keys());
  const extra: string[] = [];
  for (const [form, category] of universe) {
    const lower = form.toLowerCase();
    const same = own.get(`${lower}\t${category}`);
    const borrowed = same ?? first.get(lower);
    const reading = borrowed !== undefined ? parseReading(borrowed) : guessReading(lower);
    if (!reading) continue;
    // Une copie, même d'une prononciation de GLÀFF dans la catégorie, est empruntée : elle n'entre
    // pas dans l'index des homophones, qui reste celui de GLÀFF.
    const source: PhoneticSource = borrowed !== undefined ? 'A' : 'R';
    for (const key of new Set([lower, form])) {
      if (present.has(`${key}\t${category}`)) continue;
      present.add(`${key}\t${category}`);
      extra.push(rowOf(key, category, reading, source));
    }
  }
  return extra;
}

/** La fréquence d'une ligne de GLÀFF : la somme de ses colonnes de fréquences (corpus divers). */
export const glaffFrequency = (line: string) => line.split('|').slice(5).reduce((sum, field) => sum + (Number(field) || 0), 0);

/**
 * Les rimes les plus nombreuses parmi les noms, chacune avec son nom le plus fréquent comme
 * exemple (« maison » plutôt que « aération ») ; `frequency` donne la fréquence d'une forme.
 */
export function frequentRhymes(rows: readonly string[], limit: number, frequency: (form: string) => number): { rhyme: string; example: string }[] {
  const counts = new Map<string, { count: number; example: string }>();
  for (const row of rows) {
    const [form, category, , rhyme] = row.split('\t') as [string, string, string, string];
    if (category !== 'N') continue;
    const entry = counts.get(rhyme);
    if (!entry) counts.set(rhyme, { count: 1, example: form });
    else {
      entry.count++;
      if (frequency(form) > frequency(entry.example)) entry.example = form;
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([rhyme, { example }]) => ({ rhyme, example }));
}

export const DERIVED_PHONETICS_HEADER = [
  '# Dérivé de GLÀFF 1.2.2, lexique de Franck Sajous, Nabil Hathout et Basilio Calderone',
  '# (CLLE-ERSS, http://redac.univ-tlse2.fr/lexiques/glaff.html), construit à partir du',
  '# Wiktionnaire. Distribué sous licence Creative Commons BY-SA 3.0 :',
  '# https://creativecommons.org/licenses/by-sa/3.0/deed.fr',
  '# Modifié le 2026-10-03 pour Oulipao : première prononciation seulement, formes connues de',
  "# Grammalecte seulement, rime ajoutée. Ce fichier reste sous CC BY-SA 3.0, séparé du code (MIT).",
  '# Ajouté pour Oulipao : les formes candidates que GLÀFF ne donne pas dans leur catégorie ou dans leur',
  "# casse, avec la prononciation empruntée à une autre ligne (source A) ou devinée par des règles (source R).",
  '# Colonnes : forme, catégorie (N A V R O), prononciation API (syllabes séparées par « . »), rime,',
  '# source (G : GLÀFF ; A : empruntée à une autre ligne de GLÀFF ; R : règles).',
];

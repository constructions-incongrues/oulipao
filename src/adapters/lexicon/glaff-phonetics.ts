// Dérivation de data/phonetique-oulipao.tsv à partir de GLÀFF 1.2.2 (CC BY-SA 3.0) : chaque forme
// avec sa catégorie, sa prononciation en API découpée en syllabes, et sa rime. GLÀFF est un fichier
// à champs séparés par « | » : forme, étiquette GRACE, lemme, prononciations API, prononciations
// SAMPA, puis des fréquences. Les prononciations d'un champ sont séparées par « ; », les syllabes
// par « . ». On ne garde que la première prononciation, celle que le Wiktionnaire donne d'abord.
import { parseReading, phonemesOf } from '../../domain/phonetics/phoneme.ts';
import { rhymeOf } from '../../domain/phonetics/rhyme.ts';

/** La catégorie d'Oulipao d'après l'étiquette GRACE : N nom, A adjectif, V verbe, R adverbe, O le reste. */
export function categoryOfGrace(tag: string): 'N' | 'A' | 'V' | 'R' | 'O' {
  if (tag.startsWith('Nc')) return 'N'; // les noms propres (Np) vont avec le reste, comme dans l'étiqueteur
  const head = tag[0];
  return head === 'A' || head === 'V' || head === 'R' ? head : 'O';
}

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
  return [form, categoryOfGrace(tag), first, rhymeOf(phonemesOf(reading))].join('\t');
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
  '# Colonnes : forme, catégorie (N A V R O), prononciation API (syllabes séparées par « . »), rime.',
];

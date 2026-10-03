// Dérivation de data/verbes-oulipao.tsv à partir du lexique Grammalecte v7.7 (MPL 2.0) : chaque
// forme conjuguée avec son infinitif, son temps, sa personne (ou, pour le participe passé, son
// genre et son nombre) et l'interdiction d'élision (note « pel »). Une ligne du lexique qui cumule
// plusieurs temps ou personnes (« mange » : ipre spre 1sg 3sg) donne une ligne par lecture.

const TENSES: Record<string, string> = {
  infi: 'infinitive', ipre: 'indicative-present', iimp: 'indicative-imperfect', ipsi: 'simple-past',
  ifut: 'future', cond: 'conditional', spre: 'subjunctive-present', simp: 'subjunctive-imperfect',
  impe: 'imperative', ppre: 'present-participle', ppas: 'past-participle',
};
// Les formes d'inversion (« puissé-je » : 1isg, 1jsg) ne sont pas gardées.
const PERSONS: Record<string, string> = { '1sg': '1s', '2sg': '2s', '3sg': '3s', '1pl': '1p', '2pl': '2p', '3pl': '3p' };
const GENDERS: Record<string, string> = { mas: 'm', fem: 'f', epi: 'e' };
const NUMBERS: Record<string, string> = { sg: 's', pl: 'p', inv: 'i' };

/** Lignes dérivées d'une ligne du lexique brut (aucune si ce n'est pas un verbe). */
export function verbRowsOf(line: string): string[] {
  const columns = line.split('\t');
  if (columns.length < 20 || !/^v[0-3]/.test(columns[4]!)) return [];
  const [form, infinitive] = [columns[2]!, columns[3]!];
  const tags = columns[4]!.split(' ').map((tag) => tag.replace(/!$/, ''));
  const noElision = /(^| )pel( |$)/.test(columns[7]!) ? '1' : '0';
  const rows: string[] = [];
  for (const tense of tags.flatMap((tag) => TENSES[tag] ?? [])) {
    let details: string[];
    if (tense === 'past-participle') {
      const gender = tags.map((tag) => GENDERS[tag]).find(Boolean) ?? 'e';
      details = [gender + (tags.map((tag) => NUMBERS[tag]).find(Boolean) ?? 'i')];
    } else if (tense === 'infinitive' || tense === 'present-participle') {
      details = ['-'];
    } else {
      details = tags.flatMap((tag) => PERSONS[tag] ?? []);
    }
    for (const detail of details) rows.push(['V', form, infinitive, tense, detail, noElision].join('\t'));
  }
  return rows;
}

/** Fichier dérivé complet : lignes sans doublon, dans l'ordre du lexique. */
export function deriveVerbs(lines: Iterable<string>): string[] {
  const rows = new Set<string>();
  for (const line of lines) for (const row of verbRowsOf(line)) rows.add(row);
  return [...rows];
}

export const DERIVED_VERBS_HEADER = [
  '# This Source Code Form is subject to the terms of the Mozilla Public',
  '# License, v. 2.0. If a copy of the MPL was not distributed with this',
  '# file, You can obtain one at http://mozilla.org/MPL/2.0/.',
  '#',
  '# Dérivé du « Lexique des formes fléchies du français », Grammalecte v7.7 (Olivier R.,',
  '# https://grammalecte.net/). Modifié le 2026-10-03 pour Oulipao : verbes seulement, une ligne',
  '# par lecture ; colonnes : V, forme, infinitif, temps, personne (1s … 3p) ou genre et nombre',
  "# du participe passé (ms, fp, ei…) ou « - », pas d'élision (0 1).",
];

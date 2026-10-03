// Dérivation de data/morpho-potao.tsv à partir du lexique Grammalecte v7.7 (MPL 2.0) :
// les noms communs et les adjectifs (participes adjectivés compris) avec forme, lemme, genre,
// nombre, et l'interdiction d'élision (note « pel » du lexique : h aspiré, « onze », « yaourt »).

const GENDERS: Record<string, string> = { mas: 'm', fem: 'f', epi: 'e' };
const NUMBERS: Record<string, string> = { sg: 's', pl: 'p', inv: 'i' };

/** Lignes dérivées d'une ligne du lexique brut (aucune si elle n'est ni nom ni adjectif). */
export function morphologyRowsOf(line: string): string[] {
  const columns = line.split('\t');
  if (columns.length < 20 || columns[2] === 'Flexion') return [];
  const form = columns[2]!;
  const lemma = columns[3]!;
  const tags = columns[4]!.split(' ');
  const gender = tags.map((tag) => GENDERS[tag]).find(Boolean);
  if (!gender) return [];
  const number = tags.map((tag) => NUMBERS[tag]).find(Boolean) ?? 'i';
  const noElision = /(^| )pel( |$)/.test(columns[7]!) ? '1' : '0';
  const rows: string[] = [];
  if (tags.includes('nom')) rows.push(['N', form, lemma, gender, number, noElision].join('\t'));
  if (tags.includes('adj')) rows.push(['A', form, lemma, gender, number, noElision].join('\t'));
  return rows;
}

/** Fichier dérivé complet : lignes sans doublon, dans l'ordre du lexique. */
export function deriveMorphology(lines: Iterable<string>): string[] {
  const rows = new Set<string>();
  for (const line of lines) for (const row of morphologyRowsOf(line)) rows.add(row);
  return [...rows];
}

export const DERIVED_MORPHOLOGY_HEADER = [
  '# This Source Code Form is subject to the terms of the Mozilla Public',
  '# License, v. 2.0. If a copy of the MPL was not distributed with this',
  '# file, You can obtain one at http://mozilla.org/MPL/2.0/.',
  '#',
  '# Dérivé du « Lexique des formes fléchies du français », Grammalecte v7.7 (Olivier R.,',
  '# https://grammalecte.net/). Modifié le 2026-10-03 pour Potao : noms et adjectifs seulement,',
  '# colonnes : N|A, forme, lemme, genre (m f e), nombre (s p i), pas d\'élision (0 1).',
];

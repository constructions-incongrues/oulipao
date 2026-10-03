import type { S7Result } from '../../domain/s7/types.ts';

const STATUS_LABELS = { replaced: 'remplacé', 'unknown-noun': 'nom inconnu', 'missing-form': 'forme manquante' } as const;

/** Décompte des substitutions par statut. */
export function countByStatus(result: S7Result): { replaced: number; unknown: number; missing: number } {
  const count = (status: keyof typeof STATUS_LABELS) => result.substitutions.filter((s) => s.status === status).length;
  return { replaced: count('replaced'), unknown: count('unknown-noun'), missing: count('missing-form') };
}

/**
 * Grille de relecture en Markdown : le texte transformé, puis une ligne par substitution avec
 * le groupe nominal avant et après, et une colonne « Correct ? » à remplir à la lecture.
 */
export function renderReviewGrid(title: string, result: S7Result): string {
  const cell = (text: string) => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
  const rows = result.substitutions.map(
    (s, i) => `| ${i + 1} | ${cell(s.before)} | ${cell(s.after)} | ${STATUS_LABELS[s.status]} |  |`,
  );
  const { replaced, unknown, missing } = countByStatus(result);
  return [
    `## ${title}`,
    '',
    result.text.trim().split('\n').map((line) => `> ${line}`).join('\n'),
    '',
    `${result.substitutions.length} noms : ${replaced} remplacés, ${unknown} inconnus du dictionnaire, ${missing} sans forme au nombre voulu.`,
    '',
    '| # | Avant | Après | Statut | Correct ? |',
    '|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');
}

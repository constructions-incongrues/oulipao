// Dérivation de data/echelles-oulipao.tsv à partir de quatre normes affectives du français
// distribuées par openlexicon (CC BY-SA 4.0). Chaque base note des mots sur sa propre échelle
// (de −3 à +3, de 1 à 5, de 1 à 7…) : on ramène chaque note à son rang dans sa base, de 0 à 1, puis
// on fait la moyenne des rangs d'un même lemme d'une base à l'autre. Seul l'ordre compte pour le
// décalage ; la note de 0 à 100 ne sert qu'à l'affichage.
import type { ScaleCategory, ScaleOrder } from '../../domain/s7/types.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';

/** Une base source : son fichier, la colonne du mot, ses colonnes de note, et la catégorie de ses mots. */
export interface ScaleSource {
  name: string;
  file: string;
  word: string;
  scores: Partial<Record<ScaleOrder, string>>;
  /** La catégorie de tous les mots, ou la colonne qui la donne pour chaque mot (« nom », « adj./nom »…). */
  category: ScaleCategory | { column: string };
}

export const SCALE_SOURCES: readonly ScaleSource[] = [
  { name: 'Gobin et al. 2017', file: 'ValEmo_Arous_1286.tsv', word: 'Word', scores: { valence: 'Valence', arousal: 'Arousal' }, category: { column: 'C.gram' } },
  {
    name: 'Bonin et al. 2018',
    file: 'Concr_ContextAv_ValEmo_Arous_1659.tsv',
    word: 'Word',
    scores: { valence: 'Valence.Mean', arousal: 'Arousal.Mean', concreteness: 'Concreteness.Mean' },
    category: 'noun',
  },
  { name: 'Bonin et al. 2003', file: 'Concr_Imag_FreqSub_Valemo_866.tsv', word: 'Word', scores: { valence: 'ValEmo.Moy', concreteness: 'Concr.M' }, category: 'noun' },
  { name: 'Gilet et al. 2012', file: 'ValEmo_Arous_Imag_835.tsv', word: 'word', scores: { valence: 'val_g', arousal: 'aro_g' }, category: 'adjective' },
];

export const DERIVED_SCALES_HEADER = [
  '# Échelles affectives des noms et des adjectifs : ordre, catégorie, lemme, note de 0 à 100 (rang moyen).',
  '# Dérivé des normes distribuées par openlexicon (https://github.com/chrplr/openlexicon), sous licence',
  '# Creative Commons BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/deed.fr) ; ce fichier reste sous cette licence.',
  '# Gobin, P., Camblats, A.-M., Faurous, W., & Mathey, S. (2017). Une base de l’émotionalité (valence, arousal, catégories) de 1286 mots français selon l’âge (EMA). Revue européenne de psychologie appliquée, 67(1), 25-42.',
  '# Bonin, P., Méot, A., & Bugaiska, A. (2018). Concreteness norms for 1,659 French words. Behavior Research Methods, 50(6), 2366-2387.',
  '# Bonin, P., Méot, A., Aubert, L., Malardier, N., Niedenthal, P., & Capelle-Toczek, M.-C. (2003). Normes de concrétude, de valeur d’imagerie, de fréquence subjective et de valence émotionnelle pour 866 mots. L’Année psychologique, 103(4), 655-694.',
  '# Gilet, A.-L., Grühn, D., Studer, J., & Labouvie-Vief, G. (2012). Valence, arousal, and imagery ratings for 835 French attributes (FEEL). Revue européenne de psychologie appliquée, 62(3), 173-181.',
  '# Script de dérivation : scripts/build-scales.ts',
];

/** Les lignes d'un TSV, chaque cellule rangée sous le nom de sa colonne. */
export function parseTable(tsv: string): Record<string, string>[] {
  const [header, ...lines] = tsv.split(/\r?\n/).filter((line) => line.trim());
  const columns = header?.split('\t') ?? [];
  return lines.map((line) => {
    const cells = line.split('\t');
    return Object.fromEntries(columns.map((column, i) => [column, cells[i]?.trim() ?? '']));
  });
}

/** Les catégories que la colonne de Gobin donne à un mot (« adj./nom/verbe » : nom et adjectif). */
export function categoriesOf(label: string): ScaleCategory[] {
  const parts = label.split('/').map((part) => part.replace(/\.$/, ''));
  return [...(parts.includes('nom') ? ['noun' as const] : []), ...(parts.includes('adj') ? ['adjective' as const] : [])];
}

/** Le lemme d'un mot dans une catégorie, d'après la morphologie : l'entrée qui lui est égale d'abord. */
export function lemmaOf(word: string, category: ScaleCategory, morphology: MorphologyRepository): string | undefined {
  const form = word.toLowerCase();
  const lemmas = category === 'noun' ? morphology.nounReadings(form).map((r) => r.lemma) : morphology.adjectiveReadings(form).map((r) => r.paradigm);
  return lemmas.includes(form) ? form : lemmas[0];
}

/** Le rang de chaque note dans sa liste, de 0 (la plus basse) à 1 ; les ex aequo partagent leur rang moyen. */
// ponytail: recherche linéaire par note, quadratique ; les bases ont moins de 2 000 mots.
export function percentileRanks(values: readonly number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const last = Math.max(1, values.length - 1);
  return values.map((value) => {
    const below = sorted.findIndex((v) => v === value);
    const equal = sorted.lastIndexOf(value) - below;
    return (below + equal / 2) / last;
  });
}

export interface ScaleStats {
  /** Lemmes gardés, par « ordre catégorie ». */
  kept: Record<string, number>;
  /** Mots écartés (sans lemme connu dans leur catégorie), par base. */
  discarded: Record<string, number>;
}

const collator = new Intl.Collator('fr');

/**
 * Les lignes du fichier dérivé (ordre, catégorie, lemme, note), triées pour un fichier stable, et les
 * comptes de ce qui est gardé et écarté. `tables` donne le contenu de chaque fichier source.
 */
export function deriveScales(tables: Readonly<Record<string, string>>, morphology: MorphologyRepository, sources: readonly ScaleSource[] = SCALE_SOURCES) {
  const ranks = new Map<string, number[]>();
  const stats: ScaleStats = { kept: {}, discarded: {} };
  for (const source of sources) {
    const rows = parseTable(tables[source.file] ?? '');
    // La catégorie et le lemme de chaque mot, une fois pour toutes ses colonnes.
    const lemmas = rows.map((row) => {
      const categories = typeof source.category === 'string' ? [source.category] : categoriesOf(row[source.category.column] ?? '');
      return categories.flatMap((category) => {
        const lemma = lemmaOf(row[source.word] ?? '', category, morphology);
        return lemma ? [{ category, lemma }] : [];
      });
    });
    stats.discarded[source.name] = lemmas.filter((found) => !found.length).length;
    for (const [order, column] of Object.entries(source.scores) as [ScaleOrder, string][]) {
      // Le rang se calcule sur toute la base : c'est sa distribution qui donne le sens d'une note.
      const scored = rows.flatMap((row, i) => (isScore(row[column]) ? [{ value: Number(row[column]), lemmas: lemmas[i]! }] : []));
      const percentiles = percentileRanks(scored.map(({ value }) => value));
      scored.forEach(({ lemmas: found }, i) => {
        for (const { category, lemma } of found) {
          const key = `${order}\t${category}\t${lemma}`;
          ranks.set(key, [...(ranks.get(key) ?? []), percentiles[i]!]);
        }
      });
    }
  }
  const lines = [...ranks]
    .map(([key, values]) => ({ key, score: Math.round((100 * values.reduce((a, b) => a + b, 0)) / values.length) }))
    .sort((a, b) => collator.compare(a.key, b.key));
  for (const { key } of lines) {
    const group = key.split('\t').slice(0, 2).join(' ');
    stats.kept[group] = (stats.kept[group] ?? 0) + 1;
  }
  return { lines: lines.map(({ key, score }) => `${key}\t${score}`), stats };
}

/** Une note utilisable : une cellule ni vide ni « NA », qui se lit comme un nombre. */
const isScore = (cell: string | undefined) => !!cell && Number.isFinite(Number(cell));

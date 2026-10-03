import { z } from 'zod';
import { CATEGORIES, CategorySchema, type Category } from '../../domain/categories.ts';
import { ParameterValuesSchema, type ConstraintPlugin } from '../../domain/plugin.ts';
import { TRACK_NAMES } from './types.ts';

/**
 * Une recette : une contrainte de l'Oulipo par son nom, qui se réduit à une ou plusieurs instances
 * des contraintes installées. Elle peut demander un seul réglage, à choix, quand on la branche.
 */
export const RecipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** La règle en une phrase. */
  rule: z.string().min(1),
  /** La fiche de la contrainte sur oulipo.net. */
  url: z.string().url(),
  choice: z
    .object({
      label: z.string().min(1),
      options: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(2),
    })
    .optional(),
});

/** Une instance qu'une recette branche : son type, ses réglages, ses pistes. */
export const RecipeStepSchema = z.object({ type: z.string().min(1), params: ParameterValuesSchema, targets: z.array(CategorySchema).min(1) });
export type RecipeStep = z.infer<typeof RecipeStepSchema>;

export type Recipe = z.infer<typeof RecipeSchema> & {
  /** Les instances à brancher, pour le choix fait (s'il y en a un) et le jour du branchement. */
  build(choice: string | undefined, today: Date): RecipeStep[];
};

const VOWELS = [...'aeiouy'];
const lipograms = (letters: readonly string[]): RecipeStep[] => letters.map((letter) => ({ type: 'lipogram', params: { letter }, targets: [...CATEGORIES] }));
const trackOptions = CATEGORIES.map((track) => ({ value: track, label: TRACK_NAMES[track] }));
const ACCENTS = 'Les voyelles accentuées passent, comme dans le lipogramme.';

/** La date julienne d'un jour, à midi : le 3 octobre 2026 donne 2461317. */
export const julianDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000 + 2_440_588;

const PAIRS = VOWELS.flatMap((a, i) => VOWELS.slice(i + 1).map((b) => `${a}${b}`));

/** Les recettes fournies, par ordre alphabétique. */
export const RECIPES: Recipe[] = [
  {
    id: 'bivocalisme',
    name: 'Bivocalisme',
    rule: `N'employer que deux voyelles. ${ACCENTS}`,
    url: 'https://oulipo.net/contraintes/bivocalisme',
    choice: { label: 'Voyelles gardées', options: PAIRS.map((pair) => ({ value: pair, label: `${pair[0]} et ${pair[1]}` })) },
    build: (pair) => lipograms(VOWELS.filter((vowel) => !pair!.includes(vowel))),
  },
  {
    id: 'prisonnier',
    name: 'Contrainte du prisonnier',
    rule: `N'écrire qu'avec les lettres sans hampe ni jambage. ${ACCENTS}`,
    url: 'https://oulipo.net/contraintes/contrainte-du-prisonnier',
    build: () => lipograms([...'bdfghjklpqty']),
  },
  {
    id: 'hai-kaisation',
    name: 'Haï-kaïsation',
    rule: 'Réduire un poème à ses fins de vers.',
    url: 'https://oulipo.net/contraintes/hai-kaisation',
    build: () => [{ type: 'edge', params: { mode: 'ends', n: 1 }, targets: [...CATEGORIES] }],
  },
  {
    id: 'interieur',
    name: 'Intérieur de poème',
    rule: 'Ôter le bord du poème : premier et dernier vers, premier et dernier mot des autres.',
    url: 'https://oulipo.net/contraintes/interieur-de-poeme',
    build: () => [{ type: 'edge', params: { mode: 'inside', n: 1 }, targets: [...CATEGORIES] }],
  },
  {
    id: 'inventaire',
    name: 'Inventaire',
    rule: "Relever les mots d'une catégorie, un par ligne.",
    url: 'https://oulipo.net/contraintes/inventaire',
    choice: { label: 'Piste relevée', options: trackOptions },
    build: (track) => [{ type: 'track-sort', params: { mode: 'keep', layout: 'one-per-line' }, targets: [track as Category] }],
  },
  {
    id: 'juliennes',
    name: 'Juliennes',
    rule: 'Les chiffres de la date julienne du jour donnent le nombre de mots de chaque vers.',
    url: 'https://oulipo.net/contraintes/juliennes',
    build: (_choice, today) => [{ type: 'lineation', params: { cut: 'number', number: julianDay(today) }, targets: [...CATEGORIES] }],
  },
  {
    id: 'la-rien-que',
    name: 'La rien que la toute la',
    rule: 'Un texte sans nom, sans adjectif ni verbe.',
    url: 'https://oulipo.net/contraintes/la-rien-que-la-toute-la',
    build: () => [{ type: 'track-sort', params: { mode: 'remove' }, targets: ['noun', 'verb', 'adjective'] }],
  },
  {
    id: 'liponymie',
    name: 'Liponymie',
    rule: "S'interdire une catégorie de mots.",
    url: 'https://oulipo.net/contraintes/liponymie',
    choice: { label: 'Piste interdite', options: trackOptions },
    build: (track) => [{ type: 'track-sort', params: { mode: 'remove' }, targets: [track as Category] }],
  },
  {
    id: 'monovocalisme',
    name: 'Monovocalisme',
    rule: `N'employer qu'une voyelle. ${ACCENTS}`,
    url: 'https://oulipo.net/contraintes/monovocalisme',
    choice: { label: 'Voyelle gardée', options: VOWELS.map((vowel) => ({ value: vowel, label: vowel })) },
    build: (vowel) => lipograms(VOWELS.filter((other) => other !== vowel)),
  },
  {
    id: 'bandit',
    name: 'Poème de bandit',
    rule: 'Voler un poème à une prose : seule la disposition change.',
    url: 'https://oulipo.net/contraintes/poeme-de-bandit',
    build: () => [{ type: 'lineation', params: { cut: 'every', n: 6 }, targets: [...CATEGORIES] }],
  },
];

/** Une recette tient-elle ? Ses instances, pour chaque choix, doivent viser des types installés, avec des réglages et des pistes valides. */
function holds(recipe: Recipe, plugins: readonly ConstraintPlugin[]): boolean {
  try {
    RecipeSchema.parse(recipe);
    const choices = recipe.choice?.options.map((option) => option.value) ?? [undefined];
    return choices.every((choice) =>
      recipe.build(choice, new Date()).every((step) => {
        const { type, params, targets } = RecipeStepSchema.parse(step);
        const plugin = plugins.find((candidate) => candidate.id === type);
        if (!plugin) return false;
        plugin.parse(params);
        return targets.every((track) => plugin.tracks.includes(track));
      }),
    );
  } catch {
    return false;
  }
}

/** Les recettes proposées : celles qui tiennent avec les types installés ; les autres sont écartées. */
export const validRecipes = (recipes: readonly Recipe[], plugins: readonly ConstraintPlugin[]): Recipe[] => recipes.filter((recipe) => holds(recipe, plugins));

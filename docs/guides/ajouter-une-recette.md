# Comment ajouter une recette

Proposer une contrainte de l'Oulipo par son nom dans le navigateur de contraintes. Une recette
ne contient pas de moteur : elle branche une ou plusieurs instances des types installés, avec
leurs réglages et leurs pistes.

## Prérequis

- Les types dont la recette a besoin sont installés (voir le tableau « Les types installés » de
  [`docs/plugins.md`](../plugins.md)). Sinon, commencez par
  [écrire la contrainte](ecrire-une-contrainte.md).
- La fiche de la contrainte existe sur `https://oulipo.net/contraintes/`.

## Étapes

1. **Ouvrez `src/ui/tracks/recipes.ts`** et trouvez `RECIPES`. Les recettes y sont **par ordre
   alphabétique du nom** (ordre français : « Haï-kaïsation » avant « Intérieur de poème ») ;
   insérez la vôtre à sa place.

2. **Écrivez la recette.** Sans réglage demandé :

   ```ts
   {
     id: 'hai-kaisation',
     name: 'Haï-kaïsation',
     rule: 'Réduire un poème à ses fins de vers.',
     url: 'https://oulipo.net/contraintes/hai-kaisation',
     build: () => [{ type: 'edge', params: { mode: 'ends', n: 1 }, targets: [...CATEGORIES] }],
   },
   ```

   Avec un réglage demandé au branchement (au moins deux options) : `build` reçoit la valeur
   choisie.

   ```ts
   {
     id: 'liponymie',
     name: 'Liponymie',
     rule: "S'interdire une catégorie de mots.",
     url: 'https://oulipo.net/contraintes/liponymie',
     choice: { label: 'Piste interdite', options: trackOptions },
     build: (track) => [{ type: 'track-sort', params: { mode: 'remove' }, targets: [track as Category] }],
   },
   ```

   `build` reçoit aussi le jour du branchement, en second argument : Juliennes s'en sert
   (`julianDay(today)`).

3. **Choisissez les pistes de chaque étape parmi les `tracks` du type.** Une mise en page non
   ciblable prend `[...CATEGORIES]`.

4. **Mettez à jour `test/ui/tracks/recipes.test.ts`** : le premier test compte les recettes
   (`assert.equal(recipes.length, 10)`). Ajoutez un test qui branche la recette et vérifie les
   instances obtenues, sur le modèle de « Liponymie, Inventaire, La rien que la toute la : un tri
   par piste ».

## Vérification

```bash
npm test
```

Le test « les dix recettes tiennent toutes, par ordre alphabétique » (renommé selon votre
compte) passe : il vérifie que **toutes** les recettes écrites sont proposées. Puis
`npm run build`, rechargez `tracks.html`, « Ajouter une contrainte » : la recette est dans la
liste, avec sa règle et le lien « fiche ».

## Dépannage

Une recette invalide **n'est pas proposée, sans message** : `validRecipes` l'écarte au
chargement. Seul le test du compte le signale. Elle est écartée si :

| Cause | Exemple |
|---|---|
| un champ ne suit pas `RecipeSchema` | `url` qui n'est pas une URL, `choice` avec une seule option |
| une étape nomme un type non installé | `type: 'inconnu'` |
| les `params` d'une étape ne passent pas `parse` du type, **pour l'une des options** | `{ letter: 'é' }` pour le lipogramme |
| une étape vise une piste hors des `tracks` du type | `targets: ['adverb']` pour le S+7 |

Pour trouver laquelle, appelez `validRecipes([votreRecette], installedPlugins)` dans un test :
il rend une liste vide si elle ne tient pas.

## Voir aussi

- [L'interface à pistes](../tracks.md), section « Navigateur de contraintes »
- [Le contrat des plugins](../plugins.md), section « Côté page »

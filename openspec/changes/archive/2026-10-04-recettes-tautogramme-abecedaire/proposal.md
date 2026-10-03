# Recettes Tautogramme et Abécédaire

## Why

Le moteur Tautogramme progressif produit déjà le Tautogramme (une seule lettre) et l'Abécédaire (les lettres de a à z, en boucle). Il manque seulement les recettes qui les nomment et les branchent d'un geste. Le catalogue (`catalogue-contraintes.md`) les range parmi les contraintes « presque gérées ». Avec ces deux recettes, la couverture passe de 28 à 30 fiches sur 153.

## What Changes

- **Tautogramme :** un tautogramme progressif dont la liste ne contient que la lettre choisie au branchement (de a à z).
- **Abécédaire :** un tautogramme progressif sur les lettres de a à z ; les initiales des mots successifs suivent l'alphabet, en boucle.
- La règle de chaque recette le dit : les mots-outils ne comptent pas, et « être » et « avoir » restent. Le rendement est partiel, comme celui du moteur.
- Le tableau de couverture du catalogue passe ces deux contraintes en « gérées ».

## Capabilities

### New Capabilities

### Modified Capabilities
- `recettes-de-contraintes` : la liste des recettes fournies gagne Tautogramme et Abécédaire.

## Impact

`src/ui/tracks/recipes.ts`, `test/ui/tracks/recipes.test.ts`, `.nanopm/wiki/docs/catalogue-contraintes.md`.

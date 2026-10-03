# Design

## Context

Les formes à refrain (`src/domain/forms/form.ts`) se posent sur les segments mixés, après la chaîne, dans `buildView`. Le S+n lit le décalage de chaque mot par `offsetAt(index)` : un verrou, sinon le réglage de l'instance. Une recette (`recipes.ts`) ne produit aujourd'hui que des instances (`RecipeStep[]`), que le réducteur ajoute en fin de chaîne.

## Decisions

### 1. Éclipse est une forme, qui reçoit le texte d'origine

`FormSchema` gagne `eclipse`, et `layoutForm(segments, form, source)` prend en plus le texte d'origine. Pour `eclipse`, il renvoie `[{ text: source }, { text: '\n\n' }, ...segments]`. Le texte d'origine est un segment sans `index` : il ne s'éclaire pas, il ne s'inspecte pas, et la grille reste alignée sur le texte d'origine. `missing` vaut 0. Le résumé et la mention de la copie disent « éclipse », comme pour les autres formes.

*Alternative écartée :* un mode témoin général (l'avant et l'après de chaque étape), plus large et prévu en NEXT. La forme suffit à l'Éclipse et réutilise le chemin des formes.

### 2. Le dé est un tirage pur, déduit de la graine et de la position

`dieRoll(seed, index)` renvoie un entier de 1 à 6 par un hachage entier (multiplication et décalages de Murmur3, sur 32 bits). Il est stable d'une session à l'autre, sans état et sans `Math.random`. Le S+n gagne :
- `draw` : `fixed` ou `dice`, « fixe » par défaut ;
- `seed` : un entier de 1 à 9 999 999.

`offsetAt(index)` devient : le verrou, sinon `dieRoll(seed, index)` au dé, sinon `offset`. Au dé, l'instance agit toujours (`acts`), le titre est « S+dé », et l'aide l'explique.

*Alternative écartée :* le vrai hasard à chaque rendu. Le texte changerait à chaque geste, et une entrée du carnet ne se rouvrirait plus à l'identique.

### 3. Une recette peut poser une forme

`Recipe` gagne un champ facultatif `form?: Form`. Au branchement (`add-recipe`), le réducteur pose cette forme sur la table, en remplaçant la forme courante. `validRecipes` n'a rien de plus à vérifier, puisque `FormSchema` valide la forme.

### 4. La graine de S+dé est la date julienne du jour

Comme Juliennes, la recette S+dé prend `julianDay(today)` comme graine : le dé change d'un jour à l'autre, et on règle la graine pour relancer.

## Risks / Trade-offs

- [Le décompte de syllabes par vers compte aussi les lignes du texte d'origine sous Éclipse] → Ces lignes n'ont pas de mot indexé : leur compte reste vide. C'est accepté.
- [Le paramètre « Graine » reste affiché quand le tirage est fixe] → C'est accepté : les autres moteurs affichent aussi tous leurs réglages.

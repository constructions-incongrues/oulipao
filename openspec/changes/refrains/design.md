# Conception : les formes à refrain

## Context

`runChain` (`src/domain/plugin-chain.ts`) relit la sortie de chaque étape comme un texte neuf. Il exige `result.words.length === origin.length`, puis ramène chaque mot relu à son mot d'origine (`fold`). Trois choses reposent sur cet alignement :

- l'inspecteur ;
- la grille de pas ;
- les verrous.

Il existe déjà une échappée : un mot de sortie peut contenir plusieurs mots, puisque `fold` concatène, et c'est ainsi que « du » devient « de la ».

## Goals / Non-Goals

**Goals :** recopier des vers de refrain sans casser l'alignement mot à mot de la chaîne.

**Non-Goals :**

- composer un rondel à partir de rien ;
- imposer un mètre ;
- laisser un filtre agir **après** les refrains.

## Decisions

### 1. Une étape de forme hors de la chaîne, et non un filtre

Retenu : la forme s'applique au résultat final de `runChain`, comme une mise en page. **Domain** : `src/domain/forms/` est pur, sans port. Il prend `ChainResult` et `layoutVerse`, et rend des vers, chacun marqué « original » ou « copie de tel vers ».

Alternatives écartées :

- **Un filtre qui colle le refrain à la sortie du dernier mot d'un vers**, en passant par la concaténation de `fold`. Il tient dans le contrat actuel, mais les mots recopiés prendraient la catégorie du mot qui les porte. Un S+7 placé après réécrirait tout le refrain comme des noms, et l'inspecteur attribuerait un vers entier à un seul mot. C'est faux et opaque.
- **Changer `runChain` pour accepter des mots en plus.** C'est la seule voie qui laisserait des filtres agir après les refrains. Mais elle touche l'inspecteur, la grille, les verrous et `fold` : le coût est disproportionné pour une forme. → À rouvrir si un texte gardé demande un filtre après le refrain.

### 2. Les places des refrains

- **Rondel**, sur 13 vers en trois strophes (4, 4, 5). Les vers 1 et 2 reviennent en 7 et 8, et le vers 1 revient en 13. Le texte de l'auteur fournit les 10 vers non recopiés.
- **Villanelle**, sur 19 vers : cinq tercets et un quatrain. Le vers 1 revient en 6, 12 et 18 ; le vers 3 revient en 9, 15 et 19. Le texte fournit les 13 vers non recopiés.

S'il manque des vers, la forme s'arrête au dernier vers fourni et le dit. S'il y en a trop, les vers en trop suivent, sans forme.

### 3. Les rimes ne sont pas l'affaire de la forme

Les deux formes tiennent sur deux rimes. Pour cela, on place un **schéma de rimes** avant l'étape de forme. Un schéma « rondel » (ABBA ABAB ABBAA) et un schéma « villanelle » (ABA… ABAA) s'ajouteraient à la liste fermée de `scheme.ts`. La forme elle-même ne fait que recopier.

## Risks / Trade-offs

- **[Compromis] Aucun filtre après la forme.** C'est assumé : on transforme le texte, puis on le met en forme.
- **[Risque] Des marques de copie illisibles.** → Le rendu suit `DESIGN.md`. À valider par une recette d'interface.

## Open Questions

- Faut-il ajouter les schémas « rondel » et « villanelle » à `scheme.ts` dans ce changement, ou dans `schemas-de-rimes` ? Ce changement les suppose. La réponse ne change pas la conception.

**Réponse à la question du PRD** (« comment une contrainte qui ajoute des mots entre-t-elle dans `runChain` ? ») : elle n'y entre pas. C'est une étape de forme après la chaîne. La tranche ne tombe donc pas.

# Recettes Éclipse et S+dé

## Why

Le catalogue range Éclipse et S+dé parmi les contraintes « presque gérées » : le S+n existe, mais rien ne juxtapose un texte et son S+7, et rien ne tire le décalage au dé. Le fondateur a choisi (2026-10-04) une forme « Éclipse » pour la juxtaposition et une graine réglable pour le dé.

## What Changes

- **Forme « Éclipse »**, à côté de rondel et villanelle : le texte résultant devient le texte d'origine, une ligne vide, puis la sortie de la chaîne. Elle se pose après la chaîne, comme les formes à refrain. La copie et le carnet reprennent donc l'éclipse entière.
- **S+n au dé :** un réglage « Tirage » (fixe ou au dé) et un entier « Graine ». Au dé, chaque mot visé prend un décalage de 1 à 6, déduit de la graine et de sa position. Le tirage est reproductible, et une entrée du carnet se rouvre à l'identique. Un verrou garde la priorité sur le tirage. Le titre devient « S+dé ».
- **Recette Éclipse :** un S+7 sur les noms et la forme Éclipse.
- **Recette S+dé :** un S+n au dé sur les noms, avec la date julienne du jour comme graine ; on change la graine pour relancer le dé.
- Le catalogue fait passer Éclipse et S+dé dans les contraintes gérées.

## Capabilities

### New Capabilities

### Modified Capabilities
- `formes-a-refrain` : le choix de forme gagne « éclipse ».
- `moteur-s7-accorde-sur-les-noms` : le décalage peut être tiré au dé à partir d'une graine.
- `recettes-de-contraintes` : la liste gagne Éclipse et S+dé ; une recette peut aussi poser une forme.

## Impact

- `src/domain/forms/form.ts` (forme éclipse) et `src/ui/tracks/view-model.ts` (le texte d'origine passé à la forme).
- `src/domain/s7/plugin.ts` (tirage au dé) et une fonction pure de tirage.
- `src/ui/tracks/recipes.ts` et `mixer-state.ts` (une recette peut poser une forme).
- Tests, `docs/tracks.md` et `catalogue-contraintes.md`.

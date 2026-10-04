# Proposal

## Why

La critique de design du 2026-10-04 (`/design:design-critique` sur `tracks.html`) a relevé trois écarts prioritaires :

- ajouter une contrainte laisse le catalogue ouvert (environ 600 px) : la ligne ajoutée reste hors de l'écran, au-dessus, et la grille passe sous le pli ;
- l'inspecteur centre six voisins autour du mot choisi, si bien que ses colonnes ne tombent pas sur celles de la grille, alors que `DESIGN.md` (Layout) demande « Un pas égale un mot » aligné colonne par colonne ;
- la bande de sortie coupe la ligne avant « ; » : une ligne peut commencer par « ; », ce qu'aucun livre français ne fait.

## What Changes

- Après un ajout (recette ou moteur), le navigateur de contraintes se replie ; la première contrainte ajoutée vient au milieu de l'écran, le focus sur son premier réglage.
- L'inspecteur montre la page de pas du mot choisi, sur les colonnes de la grille : tranche de même largeur (236 px, 116 px au téléphone), une colonne égale par pas, page courte complétée de cases vides.
- À l'affichage de la bande, une espace insécable colle la ponctuation française à son mot (fine avant ; ! ?, insécable avant : et », après «). La copie garde le texte tel quel.

## Impact

- `src/ui/tracks/components/browser.ts`, `inspector.ts`, `result.ts`, `src/ui/tracks/view-model.ts` (`inspectorWindow` prend un début et une fin), `src/ui/tracks/app.ts`, `tracks.html` (CSS de l'inspecteur).
- `docs/tracks.md`.

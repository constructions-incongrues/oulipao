# Carnet : écarts avec le PRD

## Why

Le carnet livré dans la PR #48 permet de garder, lire, rouvrir, supprimer, exporter et importer. Le PRD de référence (`.nanopm/wiki/docs/prds/carnet-de-textes-gardes.md`, fusionné par #47) demande cinq choses de plus. Le fondateur garde tout le périmètre du PRD pour la v1 : ces cinq points sont donc dus avant le test du 18 octobre.

Le principal est la copie d'une entrée d'un bloc. C'est le seul signal reçu à ce jour : Proche A a recollé l'original sous le texte transformé, parce que le comique tient à l'écart entre les deux (`feedback.md`).

## What Changes

- **Copier une entrée d'un bloc.** Chaque entrée a un bouton « Copier ». Il met dans le presse-papiers l'original, une ligne vide, le résultat (retouché s'il l'a été), une ligne vide, puis la chaîne en clair, c'est-à-dire la même mention que la copie du texte résultant.
- **Confirmation avant de rouvrir.** Si la table porte un travail non gardé (un texte mis en pistes, modifié depuis la dernière garde ou la dernière réouverture), rouvrir une entrée demande d'abord confirmation. Un refus ne change rien.
- **Retoucher le résultat.** Chaque entrée a un bouton « Retoucher ». Le résultat devient un champ éditable, avec « Enregistrer » et « Annuler ». La retouche est gardée à côté du résultat produit, sans le remplacer. Le carnet l'affiche, avec la mention « retouché ». La réouverture remet la chaîne : elle redonne le résultat produit, et la retouche reste dans le carnet.
- **Jours depuis la dernière entrée.** L'en-tête du carnet dit « dernier texte aujourd'hui », « hier » ou « il y a N jours », pour que la garde « parts égales » se lise d'un coup d'œil.
- **Panneau repliable sous le résultat.** Le carnet quitte le bas de la page. Il devient un panneau replié par défaut, placé juste sous la bande du texte résultant. Son en-tête donne le compte et les jours, et le panneau n'est pas collé en haut de l'écran.

## What's not changing

- Pas de saisie des textes d'autrui, pas de partage en un clic, pas de synchronisation.
- Le format du carnet reste en version 1. La retouche est un champ facultatif, donc les carnets déjà gardés et les fichiers déjà exportés restent lisibles.

## Capabilities

### New Capabilities

### Modified Capabilities
- `carnet-de-textes-gardes` : la lecture du carnet devient un panneau repliable avec les jours depuis la dernière entrée ; la réouverture demande confirmation en cas de travail non gardé ; ajout de la copie d'une entrée et de la retouche.
- `interface-a-pistes-reglage-en-direct` : l'ordre de la page place le carnet juste sous le texte résultant.

## Impact

- `src/ui/tracks/notebook.ts` : champ facultatif `edited`, fonctions `editEntry`, `entryClipboard` et `daysSince`.
- `src/ui/tracks/controller.ts` : `copyEntry`, `editEntry`, état `unsaved` et confirmation dans `reopen`.
- `src/ui/tracks/components/notebook.ts` : `<details>` repliable, copie, retouche et jours.
- `src/ui/tracks/app.ts` : le carnet passe sous le résultat.
- `tracks.html` : styles. `docs/tracks.md`.

## Ties to

- PRD : exigences 4, 5 et 7, la retouche et la décision d'interface (option A).
- Objectif : O2 et la garde « parts égales ».

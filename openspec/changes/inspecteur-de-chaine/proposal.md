# Proposal

## Why

La partition montre le texte d'origine découpé par catégorie. Le fondateur ne la regarde pas quand il écrit, elle prend la moitié de la page, et depuis qu'on enchaîne plusieurs filtres elle ne dit plus ce qui est arrivé à un mot ni par quel filtre. Pour le savoir, il coupe les filtres un par un. On la remplace par un inspecteur qui suit un mot à travers la chaîne, à la demande. Source : `.nanopm/wiki/docs/prds/inspecteur-de-chaine.md`, jam du 2026-10-03.

## What Changes

- **BREAKING (page)** : la partition disparaît (systèmes, règle, blocs, bouton « Voir la partition », listes par piste pour les lecteurs d'écran). Le texte résultant prend la colonne de droite ; la table de mixage et le rack restent à gauche.
- La chaîne de filtres rend la sortie de chaque étape, ramenée aux mots du texte d'origine.
- Un clic sur un mot du texte résultant (ou Entrée sur un mot ayant le focus) ouvre, sous le texte, un inspecteur : une bande « Origine », puis une bande par filtre actif dans l'ordre de la chaîne. Chaque bande montre le mot choisi au centre et ses voisins, chacun dans la même colonne d'une bande à l'autre. Fermé tant qu'aucun mot n'est choisi.
- Flèches gauche et droite : mot précédent ou suivant ; Échap : fermer. Le choix survit aux gestes de réglage.
- Dans le texte résultant, chaque mot changé est souligné de la couleur de sa piste, et son infobulle nomme la piste.

## Capabilities

### New Capabilities
- `inspecteur-de-chaine` : choisir un mot du texte résultant et voir, étape par étape, ce que la chaîne de filtres en a fait.

### Modified Capabilities
- `interface-a-pistes-reglage-en-direct` : retrait des exigences « Partition en systèmes » et « Blocs des noms remplacés » ; la page ne montre plus de partition.

## Impact

- Domaine : `src/domain/plugin-chain.ts` (sorties par étape).
- Interface : suppression de `src/ui/tracks/score-layout.ts`, `components/score.ts`, du réglage de largeur (`setWidth`, `systemWidth`, l'observateur de redimensionnement de `main.ts`) et de `toggleScore` ; nouveau `components/inspector.ts` ; `view-model.ts`, `controller.ts`, `app.ts`, `components/result.ts`, `tracks.html` modifiés.
- Tests : ceux de la partition et de la disposition sont retirés ; nouveaux tests du domaine, de l'inspecteur et de la page.
- Documentation : `docs/tracks.md` (vocabulaire sans partition, système ni bloc).

# Design

## Context

La chaîne (`runChain`, `src/domain/plugin-chain.ts`) relit la sortie de chaque filtre comme un texte neuf, puis la replie sur les positions du texte d'origine (`fold`) : après chaque étape, on dispose déjà d'un mot par position d'origine, vide si le mot a été retiré. Seul le dernier repli est rendu aujourd'hui. Côté page, la partition tient trois modules (`score-layout.ts`, `components/score.ts`, le calcul de largeur de `main.ts` et `controller.setWidth`) et deux états du contrôleur (`width`, `scoreOpen`). Motivation : voir `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Exposer les étapes de la chaîne sans changer le contrat des plugins.
- Supprimer tout le code qui ne sert qu'à la partition.
- Un inspecteur sans mesure de la page : pas de calcul de largeur en JavaScript.

**Non-Goals:**
- Inspecter plusieurs mots à la fois, ou comparer deux chaînes.
- Changer le résumé, la mention copiée, la table de mixage ou le rack.

## Decisions

1. **Étapes rendues par la chaîne** (couche domain, aucun port). `ChainResult` gagne `stages: OutputWord[][]`, un tableau par étape, chacun aligné sur les mots d'origine : c'est le repli que `runChain` calcule déjà à chaque passage, conservé au lieu d'être écrasé. Alternative écartée : rejouer la chaîne préfixe par préfixe dans la vue, n fois plus coûteux pour le même résultat.

2. **Vue sans disposition** (couche ui). `buildView` ne calcule plus `layout` ; il rend `stages: { id, label, words: string[] }[]` (le libellé par `describeInstance`, la bande « Origine » en tête). Une fonction pure `inspectorWindow(view, index, radius)` donne les colonnes (position d'origine, mot de chaque bande, distance au mot choisi). `score-layout.ts`, `components/score.ts`, `systemWidth`, `DEFAULT_WIDTH`, `setWidth`, `toggleScore` et l'observateur de redimensionnement de `main.ts` sont supprimés, avec leurs tests.

3. **Fenêtre réglée par CSS.** La fenêtre rend toujours six voisins de chaque côté ; les colonnes à distance 3 à 6 portent la classe `far`, masquée sous 768 px par une requête média. Alternative écartée : mesurer l'écran dans `main.ts` et passer un rayon au contrôleur, ce qui recrée la plomberie de largeur qu'on supprime.

4. **Choix dans le contrôleur.** `TracksState` gagne `selected?: number` (position d'origine) ; le contrôleur gagne `select(index)`, `step(delta)` (borné au texte) et `closeInspector()`. `run()` remet `selected` à vide (nouvel étiquetage, nouvelles positions) ; `dispatch` le garde. Les positions d'origine sont stables d'un geste à l'autre, d'où « le choix suit les gestes » sans code de plus.

5. **Mots cliquables, focus limité aux mots changés.** Chaque mot du texte résultant ouvre l'inspecteur au clic ; seuls les mots changés reçoivent le focus clavier (`tabindex="0"`) et s'ouvrent par Entrée. Rendre les 200 mots focusables ferait 200 arrêts de tabulation. Une fois ouvert, l'inspecteur prend le focus ; les flèches parcourent tous les mots d'origine, y compris ceux absents du résultat (piste muette, mot retiré).

6. **Inspecteur en tableau** (`components/inspector.ts`). Un `<table>` : une ligne par étape, `<th scope="row">` pour le nom de l'étape, une cellule par colonne, `aria-current` sur la colonne choisie ; une légende annonce le mot choisi. Un mot vide s'affiche « · ».

7. **Soulignement par piste.** Dans `components/result.ts`, un mot changé porte la classe de sa catégorie (la couleur vient de `--track`, comme dans les tranches) et un `title` « Noms : cuisine → cuistrerie » (`TRACK_NAMES`). La couleur n'est jamais seule à porter la catégorie.

## Risks / Trade-offs

- [Contraction ou mot absorbé : « du » relu « de la », le repli concatène dans la position d'origine] → la cellule montre « de la » ; la colonne s'élargit, sans casser l'alignement des colonnes puisque c'est un tableau.
- [Mot long dans une bande étroite] → les cellules passent à la ligne à l'intérieur de leur colonne ; la page ne défile pas.
- [Le choix pointe un mot que plus aucun filtre ne touche] → l'inspecteur montre le même mot sur toutes les bandes ; c'est une information, pas une erreur.
- [Perte des listes par piste pour les lecteurs d'écran] → l'inspecteur en tableau les remplace, et les tranches donnent toujours le nombre de mots par piste.

## Migration Plan

Changement d'interface sans données persistées : rien à migrer. Retour arrière par un `git revert` du commit.

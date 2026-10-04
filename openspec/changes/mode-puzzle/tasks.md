# Tasks

## 1. Domaine du puzzle (fondation)

- [ ] 1.1 (domain) Créer `src/domain/puzzle/schema.ts` avec trois schémas zod et leurs types déduits (design, décision 1) :
  - `PuzzleStepSchema` (`type`, `params`, `targets` : au moins une catégorie) ;
  - `PuzzleSeedSchema` (titre, auteur facultatif, texte, `tagged`, étapes, niveau `facile | moyen`) ;
  - `PuzzleSchema`.

  Faire réutiliser `PuzzleStepSchema` par `RecipeStepSchema` (`src/ui/tracks/recipes.ts`). Vérifier par `npm run typecheck` et par `test/domain/puzzle/schema.test.ts` : une graine sans étape ou dont `tagged` ne suit pas le découpage du texte est rejetée.
- [ ] 1.2 (domain) Écrire `rawScore` et `gauge` dans `src/domain/puzzle/score.ts`, avec un commentaire `ponytail:` sur le plafond O(n·m). Vérifier par `test/domain/puzzle/score.test.ts` :
  - texte identique : 1 ;
  - puzzle brut : jauge à 0 ;
  - « à la » au lieu de « au » : seuls les mots non communs comptent ;
  - la casse est ignorée ;
  - la jauge est bornée à [0, 1].
- [ ] 1.3 (domain) Écrire `buildPuzzle(seed, resources)` dans `src/domain/puzzle/build.ts`. Il applique `runChain` avec les plugins du registre, puis dérive les étiquettes livrées par les intervalles de caractères ; un mot d'origine rendu en plusieurs mots donne `other`. Vérifier par `test/domain/puzzle/build.test.ts`, avec la morphologie factice de `test/support/morphology.ts` :
  - les étiquettes livrées suivent le découpage du texte transformé ;
  - un nom remplacé garde `noun` ;
  - une contraction défaite donne `other`.
- [ ] 1.4 (domain) Écrire `inverseSteps` et `selfCheck` dans `src/domain/puzzle/inverse.ts` (spec, exigence « Auto-vérification »). Les étapes sont prises à rebours. Le décalage d'un S+n ou d'un R+n est inversé, sauf pour un S+n tiré au dé, qui est omis comme les autres contraintes. Le seuil vaut `min(0,95, atteignable − 0,02)`, et l'avertissement est levé sous 0,80. `buildPuzzle` appelle `selfCheck`. Vérifier par `test/domain/puzzle/inverse.test.ts` :
  - S+3 puis lipogramme donne S−3 seul ;
  - S+3 puis V+2 donne V−2 puis S−3 ;
  - un S+dé est omis ;
  - un aller-retour S+n sur la morphologie factice atteint 1 ;
  - les seuils et l'avertissement sont calculés comme dans la spec.

## 2. Tirage, lien, historique et corpus (en parallèle après 1)

- [ ] 2.1 (domain) Écrire `drawPuzzle(corpus, random, resources, level)` dans `src/domain/puzzle/draw.ts` (spec, exigence « Tirage au sort »). Il tire une ou deux étapes S+n, d'ordre alphabétique (noms) ou valence (noms et adjectifs), avec un décalage de 1 à 9, en mode même genre. Il refait au plus 20 essais tant que le score atteignable reste sous 0,95, puis renvoie une erreur typée. Vérifier par `test/domain/puzzle/draw.test.ts`, avec un `random` à suite fixe : le tirage est déterministe, un tirage refusé est retiré, et 20 refus donnent l'erreur.
- [ ] 2.2 (adapters) Écrire `encodeSeed` et `decodeSeed` dans `src/adapters/puzzle/link-codec.ts` : JSON, `CompressionStream('deflate-raw')`, base64url. Le décodage valide par `PuzzleSeedSchema` et renvoie une erreur « Ce puzzle est illisible. » pour une entrée corrompue. Vérifier par `test/adapters/puzzle-link-codec.test.ts` :
  - l'aller-retour donne une graine identique ;
  - une chaîne tronquée ou du JSON invalide est refusé proprement ;
  - pour chaque texte du corpus avec deux étapes, l'adresse fait moins de 8 ko (consigner la taille maximale dans la PR).
- [ ] 2.3 (ports, adapters) Créer le port `PuzzleHistory` (`list`, `add`) dans `src/ports/puzzle-history.ts`, et son adaptateur `src/adapters/storage/local-storage-puzzle-history.ts` : clé `oulipao.puzzles`, `safeStorage`, validation zod en lecture, liste vide si la donnée est illisible. Vérifier par `test/adapters/local-storage-puzzle-history.test.ts` : ajout et relecture, donnée corrompue lue comme une liste vide, stockage bloqué sans exception.
- [ ] 2.4 (scripts, adapters, data) Écrire `scripts/build-puzzle-corpus.ts` et la commande `npm run build:puzzle-corpus`. Le script étiquette par CamemBERT les textes de `EXAMPLES` et six fables de La Fontaine (Wikisource, éd. 1874 : *La Cigale et la Fourmi*, *Le Corbeau et le Renard*, *La Grenouille…*, *Le Loup et l'Agneau*, *Le Chêne et le Roseau*, *Le Lièvre et la Tortue*), puis écrit `data/corpus-puzzles.json`. Écrire son chargeur validé par zod dans `src/adapters/puzzle/corpus.ts`. Vérifier deux choses :
  - relancer le script donne un fichier identique (`git diff --exit-code data/corpus-puzzles.json`) ;
  - `test/adapters/puzzle-corpus.test.ts` montre que chaque texte a des étiquettes alignées sur son découpage et qu'un fichier invalide est rejeté.

## 3. Contrôleur (après 2)

- [ ] 3.1 (ui) Dans `src/ui/tracks/controller.ts`, ajouter :
  - `loadForPuzzle()`, qui charge la morphologie et les échelles sans le modèle ;
  - l'état `puzzle` ;
  - les actions `drawPuzzle(level)`, `openPuzzle(seed)`, `makePuzzle()` et `quitPuzzle()` ;
  - le recalcul du score après chaque reconstruction ;
  - la victoire, enregistrée une seule fois dans `PuzzleHistory`.

  Brancher le corpus, l'historique, le codec et `random` comme dépendances. Vérifier par `test/ui/tracks/puzzle-controller.test.ts`, avec un étiqueteur factice qui échoue s'il est appelé :
  - `openPuzzle` affiche le texte transformé sans étiqueter ;
  - brancher le S+n inverse fait monter la jauge jusqu'à la victoire ;
  - la victoire est enregistrée une seule fois ;
  - `quitPuzzle` revient au mode normal ;
  - `makePuzzle` est refusé avec une chaîne vide.
- [ ] 3.2 (ui) Dans `src/ui/tracks/main.ts`, lire `#puzzle=` au chargement et sur `hashchange`, effacer le fragment en quittant (`history.replaceState`), et brancher `Math.random`, `localStorage` et le chargeur du corpus. Vérifier dans le navigateur : ouvrir une adresse avec un lien de puzzle affiche le puzzle, et aucune requête vers le modèle CamemBERT n'apparaît dans l'onglet réseau.

## 4. Interface (après 3, suivre `DESIGN.md`)

- [ ] 4.1 (ui) Ajouter la bande du puzzle au-dessus du rack : titre, indice du niveau facile (« S+? puis V+? »), jauge `role="meter"` en pourcentage et « Quitter le puzzle ». En mode puzzle, passer l'entrée en lecture seule et masquer le carnet et l'export. Vérifier par un test de rendu (`renderToString` ou `test/support/vnode.ts`) : indice présent au niveau facile et absent au niveau moyen, jauge à 0 % sur le puzzle brut, carnet absent en mode puzzle.
  GUI test : 1. Ouvrir la page avec un lien de puzzle de niveau facile. 2. Vérifier que le titre, l'indice et la jauge à 0 % sont visibles. 3. Brancher un S+n à −n sur les noms. 4. Vérifier que la jauge augmente.
- [ ] 4.2 (ui) Ajouter le panneau de victoire (original et texte transformé côte à côte, chaîne révélée), le compteur de puzzles résolus, et les boutons « Puzzle au hasard » (avec le choix du niveau) et « En faire un puzzle » (désactivé si la chaîne est vide, confirmation après copie) dans le mode normal. Vérifier par un test de rendu : panneau présent seulement après la victoire, bouton désactivé avec une chaîne vide.
  GUI test : 1. Ouvrir la page. 2. Cliquer « Puzzle au hasard ». 3. Vérifier qu'un texte du corpus s'affiche avec son titre et une jauge à 0 %. 4. Défaire la chaîne révélée par un puzzle de test. 5. Vérifier que le panneau de victoire montre l'original et la chaîne.

## 5. Intégration et documentation

- [ ] 5.1 (domain, tests) Ajouter un test d'intégration `test/domain/puzzle/fables.test.ts` sur le corpus réel et la morphologie réelle, comme `test/support/chain-golden.ts`. Pour chaque texte du corpus, une chaîne S+7 puis V+7 en mode même genre se défait au-dessus de 0,95 avec les étiquettes livrées. Vérifier par `npm test`, avec une couverture supérieure à 90 %.
- [ ] 5.2 (docs) Lever le refus « partage en un clic (lien) » pour les seuls puzzles dans `.nanopm/wiki/docs/roadmap.md`, et y ajouter le mode puzzle. Documenter le mode puzzle dans le `README.md`, à l'endroit où les autres fonctions sont indexées. Vérifier en relisant les deux fichiers.

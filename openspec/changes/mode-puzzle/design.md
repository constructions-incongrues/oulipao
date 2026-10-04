# Design

## Context

Voir `proposal.md` pour le pourquoi. Ce que le code fournit déjà :

- **`runChain(text, tagged, steps, resources)`** (`src/domain/plugin-chain.ts`) relit chaque étape avec les étiquettes d'origine qu'on lui donne. C'est exactement l'hypothèse « étiquettes livrées » des mesures.
- **Le S+n** accepte des décalages de −99 à 99. Le R+n accepte de −20 à 20. L'ordre `valence` existe, avec des échelles chargées à la demande.
- **Le contrôleur** (`src/ui/tracks/controller.ts`) garde le texte étiqueté dans une variable `session`. Pour rouvrir une entrée du carnet, `restoreAs` reconstruit cette `session` à partir d'étiquettes déjà connues, sans étiqueteur. Mais il appelle `preload()`, qui télécharge le modèle CamemBERT **et** charge la morphologie.
- **Rien n'existe** pour le fragment d'URL ni pour la compression.
- **Le registre** des contraintes est côté domaine (`src/domain/registry.ts`). Le format compact d'une étape (`RecipeStepSchema` : `type`, `params`, `targets`) est côté interface (`src/ui/tracks/recipes.ts`).
- **Les mesures de référence** : six fables, étiquettes CamemBERT, mode même genre. Défaire une chaîne d'une ou deux étapes S+n/V+n retrouve 97,5 à 98,6 % des mots.

## Goals / Non-Goals

**Goals :**
- Un domaine du puzzle pur, testé avec des ports factices, qui ne connaît ni l'URL, ni le stockage, ni le hasard du navigateur.
- Ouvrir un puzzle (lien ou tirage) sans télécharger le modèle d'étiquetage.
- Réutiliser le rack tel quel : aucune exigence des plugins ni de la chaîne ne change.

**Non-Goals :**
- Empêcher la triche. Le lien contient l'original, et c'est accepté pour un outil personnel ouvert en passant.
- Garantir qu'un lien reste identique quand les données changent (morphologie, échelles). Un lien ouvert après une mise à jour du lexique peut donner un autre puzzle, toujours vérifié avant d'être proposé.

## Decisions

### 1. Le module `src/domain/puzzle/` (couche domain)

Il dépend de `PluginResources` (ports `MorphologyRepository` et `ScaleRepository`, déjà existants), du registre et de `runChain`.

- **`schema.ts`** :
  - `PuzzleStepSchema` (`type`, `params`, `targets`), copie domaine du `RecipeStepSchema`, que `recipes.ts` réutilisera ;
  - `PuzzleSeedSchema`, ce que transporte un lien : titre, auteur, texte, `tagged`, étapes, niveau ;
  - `PuzzleSchema` : la graine plus ce qui s'en déduit, c'est-à-dire le texte transformé, les étiquettes livrées, le score brut du puzzle, le score atteignable et le seuil.
- **`score.ts`** :
  - `rawScore(candidate, original)`, plus longue sous-suite commune sur `tokenize`, insensible à la casse. Calcul O(n·m) : au plus 300 mots par texte, donc moins de 10⁵ opérations par réglage. `ponytail:` passer à Hunt–Szymanski si des textes de plus de 2 000 mots entrent au corpus ;
  - `gauge(raw, rawPuzzle)`.
- **`inverse.ts`** :
  - `inverseSteps(steps)` : on prend les étapes à rebours, on garde S+n et R+n à décalage fixe avec ce décalage négatif, et on omet les autres ;
  - `selfCheck(puzzle, resources)` calcule le score atteignable et le seuil `min(0,95, atteignable − 0,02)`.
- **`build.ts`** : `buildPuzzle(seed, resources)` applique `runChain`, puis dérive les étiquettes livrées. Chaque mot rendu (`gap + output`) occupe un intervalle de caractères dans le texte transformé. Chaque mot du découpage de ce texte reçoit la catégorie du mot d'origine dont l'intervalle le contient. Si un mot d'origine se rend en plusieurs mots (« au » devenu « à la »), ces mots reçoivent `other`. C'est l'algorithme validé par les mesures.
- **`draw.ts`** : `drawPuzzle(corpus, random, resources, level)`. Le hasard est injecté (`random: () => number`) pour que les tests soient déterministes. On fait jusqu'à 20 essais. On a écarté l'alternative du dé à graine déjà utilisé par le S+dé : l'interface n'a pas besoin de rejouer un tirage, puisque c'est le lien qui transporte le puzzle.

### 2. Le lien transporte la graine, pas le puzzle complet (couche adapters)

On encode `PuzzleSeedSchema` en JSON, on le compresse avec `CompressionStream('deflate-raw')`, natif dans les navigateurs et dans Node 22, puis on l'écrit en base64url dans `#puzzle=`. À l'ouverture, on décode, on valide avec zod, puis on reconstruit par `buildPuzzle`.

L'alternative était d'encoder le puzzle complet. On l'a écartée pour deux raisons. Le lien serait environ deux fois plus long, puisque le texte transformé et ses étiquettes y figureraient en plus. Et un puzzle trafiqué (un texte transformé incohérent avec la chaîne) ne pourrait pas être revérifié.

Le fragment n'est jamais envoyé au serveur, ce qui respecte « aucun texte stocké sur le serveur ». Module : `src/adapters/puzzle/link-codec.ts`.

### 3. L'historique derrière un port (ports et adapters)

`src/ports/puzzle-history.ts` définit `PuzzleHistory`, avec `list()` et `add(entry)`. L'adaptateur `src/adapters/storage/local-storage-puzzle-history.ts` stocke sous la clé `oulipao.puzzles`, passe par `safeStorage`, et valide en lecture avec zod en revenant à une liste vide en cas d'échec. Le motif est celui de `local-storage-preferences.ts`. Le domaine ne voit que le port.

### 4. Un corpus figé à la construction (adapters, scripts, data)

`scripts/build-puzzle-corpus.ts`, lancé par `npm run build:puzzle-corpus`, étiquette par CamemBERT dans Node les textes de `EXAMPLES` et six fables de Wikisource (éd. 1874). Le motif est celui de `scripts/transform-references.ts`. Le résultat est écrit dans `data/corpus-puzzles.json` (`version`, `texts[]` : titre, auteur, année, source, texte, `tagged`).

Le chargeur `src/adapters/puzzle/corpus.ts` lit ce fichier via `fetchTextSource` et le valide. Il est chargé à la demande, au premier « Puzzle au hasard ». Si on étiquetait plutôt dans le navigateur au moment du tirage, il faudrait le modèle, et le tirage lui-même ne serait plus reproductible.

### 5. Le contrôleur en mode puzzle (couche ui)

- **Le chargement est séparé.** `preload()` reste tel quel, et une nouvelle méthode `loadForPuzzle()` ne charge que la morphologie, puis les échelles si la chaîne contient un ordre autre qu'alphabétique. `restoreAs` sert de modèle : `session = { text: puzzle.transformed, tagged: puzzle.delivered }`, chaîne vide, `buildView`.
- **L'état.** `TracksState` gagne `puzzle?: { puzzle, raw, gauge, solved, warning? }`. Après chaque `rebuild`, on recalcule `rawScore` sur le texte de sortie de la vue. Le passage du seuil marque `solved` et ajoute l'entrée à l'historique, une seule fois par puzzle.
- **Les actions.** `drawPuzzle(level)`, `makePuzzle()` (copie le lien avec l'action de copie existante), `openPuzzle(seed)` et `quitPuzzle()` (efface le fragment avec `history.replaceState`).
- **Le câblage** se fait dans `main.ts`, exclu de la couverture. Il lit `location.hash` au chargement et sur `hashchange`, et passe `Math.random` au tirage.

### 6. L'affichage (couche ui, suivre `DESIGN.md`)

Une bande au-dessus du rack montre :
- le titre du texte ;
- l'indice du niveau facile (« S+? puis V+? ») ;
- la jauge en pourcentage, lisible au clavier et par lecteur d'écran (`role="meter"` avec ses valeurs) ;
- les boutons « Quitter le puzzle ».

En mode puzzle, le champ d'entrée est en lecture seule, et le carnet et l'export sont masqués. La victoire affiche un panneau : original et texte transformé côte à côte, puis la chaîne révélée sous forme de titres (« S+5 puis V+3 »). « Puzzle au hasard » et « En faire un puzzle » rejoignent les commandes du mode normal. Le second est désactivé tant que la chaîne est vide.

## Risks / Trade-offs

- **[Étiquettes d'un texte libre]** Un puzzle fabriqué sur un texte mal étiqueté peut être peu soluble. → L'auto-vérification l'annonce par l'avertissement sous 80 %, et le seuil se cale sur ce qui est atteignable.
- **[Longueur du lien]** La graine d'une fable de 260 mots fait environ 6 ko de JSON, soit environ 2 à 3 ko une fois compressée et encodée. Certaines messageries tronquent les longues adresses. → On mesure la taille sur le corpus dans les tests. Si un lien dépasse 8 ko, on montre un avertissement à la fabrication.
- **[Lexique bruité]** Les formules chimiques prises pour des noms (`BeSO₃`) font échouer des allers-retours. → Une tâche séparée les retire. D'ici là, l'auto-vérification refuse les tirages touchés.
- **[Aiguille trompeuse]** Le score brut part de 73 à 78 % parce que les mots-outils ne bougent jamais. → La jauge affiche le score normalisé, et la victoire se juge sur le score brut.
- **[Données qui changent]** Après une mise à jour du lexique, un ancien lien donne un autre puzzle. → C'est accepté (voir les Non-Goals). Il reste vérifié avant d'être proposé.

## Migration Plan

Rien à migrer. Le mode normal ne change pas, et l'historique est une nouvelle clé de stockage. Pour revenir en arrière, il suffit de retirer les boutons et la lecture du fragment.

## Open Questions

- La plage de décalage du tirage (1 à 9) et le choix des ordres pourront être affinés après les premières parties, sans toucher au reste.
- Des textes pourront s'ajouter au corpus (Hugo, Baudelaire) en relançant `npm run build:puzzle-corpus`.

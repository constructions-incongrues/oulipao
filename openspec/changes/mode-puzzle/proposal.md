# Proposal

## Why

Oulipao va toujours dans un sens : un texte entre, un résultat sort. Or le plaisir oulipien tient souvent au sens inverse : sous *La cimaise et la fraction*, on reconnaît *La Cigale et la Fourmi*. Le seul retour extérieur va dans ce sens : il était accompagné de l'original, entre parenthèses. Le fondateur, lui, ne peut pas jouer avec ses propres chaînes, puisqu'il connaît toujours le texte de départ.

Des mesures faites le 2026-10-04 sur six fables de La Fontaine montrent que le sens inverse est jouable :
- un S+7 se défait par un S−7 : 98,6 % des mots reviennent ;
- une chaîne S+n puis V+n se défait à 97,5–98,5 % dans le bon ordre ;
- le score monte par paliers : environ 80 % avec une seule étape défaite, environ 86 % avec le mauvais ordre, environ 98 % avec la bonne chaîne.

PRD : `.nanopm/wiki/docs/prds/mode-puzzle.md`.

## What Changes

- **Un objet puzzle.** Il réunit le texte d'origine et ses étiquettes, la chaîne cachée, le niveau, et le texte transformé avec les étiquettes livrées au joueur. Il est défini par un schéma zod.
- **Un accordeur.** Il compte, dans l'ordre, les mots de la sortie du joueur qui coïncident avec l'original. Ce score est ramené à 0 % sur le puzzle brut et à 100 % sur le texte connu. Un seuil de victoire déclare le puzzle résolu.
- **L'auto-vérification.** Aucun puzzle n'est proposé sans que sa chaîne inverse exacte ait été appliquée et mesurée. Le seuil de victoire se cale sur ce score. Un puzzle est donc toujours soluble, y compris quand un filtre perd de l'information.
- **Le tirage au sort.** Un texte du domaine public est pris dans un corpus aux étiquettes calculées à l'avance. Une chaîne d'une ou deux étapes S+n (ordre alphabétique ou valence) est tirée, en mode même genre.
- **La fabrication.** La chaîne et le texte en cours deviennent un puzzle.
- **Le lien.** Le puzzle est encodé dans le fragment de l'URL (`#puzzle=…`), donc jamais envoyé au serveur. À l'ouverture, il est validé par son schéma.
- **Le jeu dans le rack existant.** Le texte transformé devient l'entrée, et le joueur y branche sa chaîne inverse. La jauge s'affiche, et le carnet ainsi que l'export sont masqués. À la victoire, l'original, le résultat et la chaîne révélée s'affichent côte à côte.
- **Deux niveaux.** En « facile », on montre les filtres de la chaîne sans leurs réglages. En « moyen », on ne montre rien de la chaîne. Le titre du texte est toujours affiché.
- **Un historique local** des puzzles résolus.
- **Pas de changement cassant.** Le mode normal ne change pas.

## Capabilities

### New Capabilities
- `mode-puzzle` : l'objet puzzle, l'accordeur, l'auto-vérification, le tirage, la fabrication, le lien, les niveaux, la victoire et l'historique.

### Modified Capabilities

Aucune. Le rack, la chaîne et les plugins sont réutilisés tels quels. Le mode puzzle les pilote sans changer leurs exigences.

## Impact

- **Domaine** (`src/domain/puzzle/`, nouveau) : le schéma du puzzle, le score de l'accordeur, la chaîne inverse et l'auto-vérification, ainsi que le tirage, qui reçoit une source de hasard injectée. Il s'appuie sur `runChain`, sur les décalages négatifs du S+n (de −99 à 99) et sur l'ordre `valence`, qui existent déjà.
- **Adaptateurs** :
  - l'encodage et le décodage du lien (`CompressionStream('deflate-raw')` natif, puis base64url) ;
  - l'historique en `localStorage`, sous la clé `oulipao.puzzles`, via `safeStorage` ;
  - le chargeur du corpus, validé par zod.
- **Données et scripts** :
  - `data/corpus-puzzles.json`, qui contient les textes du domaine public (les exemples et six fables) avec leurs étiquettes CamemBERT figées ;
  - `scripts/build-puzzle-corpus.ts`, avec la commande `npm run build:puzzle-corpus`.
- **Interface** (`src/ui/tracks/`) :
  - les boutons « Puzzle au hasard » et « En faire un puzzle » ;
  - la lecture du fragment de l'URL au chargement ;
  - le mode puzzle dans le contrôleur, qui charge la morphologie et les échelles sans télécharger CamemBERT ;
  - la jauge, la victoire et l'indice du niveau facile.
- **Roadmap** : le refus « partage en un clic (lien) » est levé pour les seuls puzzles. Il faut mettre à jour `roadmap.md`.
- **Aucune nouvelle dépendance npm.**

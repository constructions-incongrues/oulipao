# Retrait, mise en lignes et recettes

## Why

Le catalogue des contraintes (`.nanopm/wiki/docs/catalogue-contraintes.md`) classe 25 contraintes de l'Oulipo comme faisables avec le contrat actuel, mais Oulipao n'en propose que deux, le S+7 et le lipogramme. Le fondateur veut couvrir le catalogue famille par famille. La famille « retrait et mise en lignes » vient en premier parce qu'elle n'a besoin d'aucun lexique : trois contraintes paramétrées couvrent sept noms du catalogue. Avec les recettes, quatre autres noms deviennent accessibles sans nouveau moteur.

## What Changes

- Trois nouvelles contraintes :
  - **Tri par piste** : retirer les mots des pistes visées, ou ne garder qu'eux, en gardant la disposition ou à raison d'un mot par ligne.
  - **Bord** : ne garder que les fins de vers, les débuts et fins de vers (tête-à-queue), ou l'intérieur du poème.
  - **Mise en vers** : couper les lignes tous les n mots, aux ponctuations, ou selon les chiffres d'un nombre (Juliennes).
- Un mot retiré par une contrainte garde les sauts de ligne et la ponctuation qui le précédaient. Ce blanc se fond dans celui du mot suivant : une suite de ponctuation se réduit à son signe le plus fort, et les espaces suivent l'usage français. Le lipogramme suit aussi cette règle.
- Un mot dont la contrainte change le blanc reçoit une nouvelle marque, « remis en ligne ». L'inspecteur et le résumé la montrent.
- Une contrainte peut se déclarer **non ciblable** : elle agit sur tout le texte, et l'interface n'affiche pas ses puces de pistes. C'est le cas de Bord et de Mise en vers.
- **Recettes** : un nom de l'Oulipo, sa règle en une ligne, le lien vers sa fiche oulipo.net, et la liste des instances qu'il branche. Une recette peut demander un seul réglage à choix au moment où on la branche. La brancher ajoute ses instances en fin de chaîne. Dix recettes au départ : Monovocalisme, Bivocalisme, Contrainte du prisonnier, La rien que la toute la, Liponymie, Inventaire, Haï-kaïsation, Intérieur de poème, Poème de bandit, Juliennes.
- **Navigateur de contraintes** : un panneau qui se déplie sous la chaîne. Il range les recettes par nom de l'Oulipo et ajoute une section « Moteurs » pour les types nus. Il remplace la rangée de boutons « + ».
- Hors du périmètre : voisin à initiale imposée, variantes du S+n, index des anagrammes, recettes enregistrées par l'utilisateur, Éclipse. L'Éclipse sera documentée, sans recette.

## Capabilities

### New Capabilities
- `retrait-et-mise-en-lignes` : les contraintes Tri par piste, Bord et Mise en vers, la règle du blanc d'un mot retiré, et la marque « remis en ligne ».
- `recettes-de-contraintes` : les recettes, leur réglage demandé au branchement, et le navigateur de contraintes.

### Modified Capabilities
- `filtres-instanciables` : il faut accueillir les types non ciblables, remplacer l'ajout par le navigateur, et autoriser une exception à la portée (Tri en mode « ne garder que » retire des mots hors de ses pistes).
- `lipogramme` : un mot-outil retiré garde sa ponctuation et ses sauts de ligne.
- `inspecteur-de-chaine` : afficher un mot remis en ligne.

## Impact

- **Domain** : contrat `ConstraintPlugin` (drapeau non ciblable, marque `relaid`), `plugin-chain.ts` (compte des mots remis en ligne), nouvelle règle partagée de retrait, trois nouveaux modules de contrainte, lipogramme.
- **UI** : `mixer-state.ts` (types installés, geste « brancher une recette »), recettes, composant `chain.ts` (navigateur à la place de la rangée « + », puces masquées), inspecteur, résumé.
- **Docs** : `docs/tracks.md`, `docs/plugins.md`, le catalogue du wiki (couverture, Éclipse).
- Le composant navigateur demande la validation du fondateur, à cause de DESIGN.md.

# Proposition : un index des rimes pour le R+n et les homophonies

## Why

RISK-11 est confirmé, et bien au-delà de ce que laissaient voir les quatre vers de `RESULTATS.md`. Mesuré le 2026-10-03 sous Node, sur les trois textes de référence de 200 mots, chaque filtre seul et visant toutes ses pistes :

| Filtre | Texte 1 | Texte 2 | Texte 3 |
|---|---|---|---|
| R+n | 2 028 ms | 1 682 ms | 2 439 ms |
| Homophonies | 3 527 ms | 3 642 ms | 3 112 ms |
| Monorime, antirime | ≤ 6 ms | ≤ 6 ms | ≤ 6 ms |

Le réglage en direct (objectif 3 : moins de 100 ms) est dépassé d'un facteur 20 à 35. Le profil montre un coût diffus : environ un quart du temps passe à écarter les candidats un par un, un autre quart à les prononcer. La cause est le parcours lui-même. Pour trouver le n-ième voisin qui rime, le moteur essaie les lemmes dans l'ordre du dictionnaire, jusqu'à 54 000 noms par mot. Le design de la textbank (D6) prévoyait ce cas : un index précalculé `rime → formes`.

## What Changes

- **Dérivation :** `build:phonetics` écrit aussi une prononciation pour chaque forme candidate (formes des fichiers de morphologie et de verbes) que GLÀFF ne donne pas pour sa catégorie : la prononciation d'une autre catégorie de GLÀFF si elle existe, sinon une prononciation devinée par les règles. Chaque ligne dit sa source. C'est exactement la prononciation que les filtres calculent aujourd'hui au vol.
- **Port `PhoneticsRepository` :** une méthode `rhyming(rhyme, category)` rend les formes d'une catégorie qui ont cette rime. Les homophones restent calculés sur les seules prononciations de GLÀFF dans la catégorie, comme aujourd'hui.
- **Recherche du n-ième voisin :** elle peut se restreindre à un ensemble de formes candidates. Elle ne parcourt plus alors que leurs lemmes, dans l'ordre du dictionnaire et à partir du même point. Le R+n s'y restreint aux formes de même rime ; les homophonies, aux homophones.
- **Aucun résultat ne change :** chaque forme qu'un filtre retenait est dans l'ensemble des candidates. Vérifié mot à mot sur les textes de référence, avant et après.
- Monorime et antirime ne changent pas : ils sont déjà rapides.

## Capabilities

### New Capabilities
<!-- Aucune. -->

### Modified Capabilities
- `textbank-phonetique` : le fichier dérivé couvre toutes les formes candidates, chaque prononciation porte sa source, et la textbank rend les formes d'une rime.
- `filtres-de-rime` : un budget de temps pour le R+n et les homophonies.

## Impact

- **adapters :** `lexicon/glaff-phonetics.ts` (dérivation), `morphology/in-memory-phonetics.ts` (colonne source, index des rimes).
- **ports :** `phonetics.ts` (méthode `rhyming`).
- **domain :** `neighbours.ts` et `verb.ts` (`nthVerb`), restriction aux candidates ; `rhyme/engine.ts`, `rn.ts` et `homophony.ts`, ensemble des candidates.
- **ui :** `PHONETICS_VERSION` dans `composition.ts`.
- **Données :** `data/phonetique-oulipao.tsv` régénéré (une colonne et environ 20 % de lignes de plus).
- **Documentation :** arc42, sections 5, 8.3, 10 (QS-06, 10.3) et 11 (RISK-11).

# Design

## Context

Voir `proposal.md` pour le profil. Depuis l'index des rimes, un filtre de rime fournit `among`, l'ensemble des formes candidates, et la recherche du voisin ne visite que leurs lemmes (`src/domain/neighbours.ts`, `nthVerb`). Le R+n, l'antérime et le schéma de rimes donnent les formes **de même rime**, puis leur critère `accept` teste `rhymes(a, b, richness)` (`src/domain/phonetics/rhyme.ts`) : même rime, et au moins `SHARED[richness]` phonèmes communs depuis la fin (1, 2 ou 3). Quand peu de formes passent ce second test, le parcours prononce toutes les formes de la rime.

## Goals / Non-Goals

**Goals :**
- Qu'un mot sans rime possible ne coûte rien, et que le R+7 par défaut tienne 100 ms en vers.
- Exactement les mêmes mots en sortie.

**Non-Goals :**
- L'antirime et le cas « ne rime plus » du schéma de rimes, dont le critère est une absence de rime.
- Le coût du premier passage d'une session.

## Decisions

### 1. La finale exigée (domain)

`requiredEnding(phonemes, richness)` dans `phonetics/rhyme.ts`, couche **domain**, pur. Il rend les L derniers phonèmes du mot, avec L = max(longueur de la rime, `SHARED[richness]`), ou rien si le mot a moins de L phonèmes.

*Pourquoi l'ensemble est sûr :* si `rhymes(a, b, richness)`, alors a et b ont la même rime (donc les mêmes |rime| derniers phonèmes) et au moins `SHARED[richness]` phonèmes communs depuis la fin ; ils partagent donc les L derniers. Un mot de moins de L phonèmes ne peut en partager L avec personne : aucune forme ne rime avec lui à cette richesse. Et toute forme qui finit par ces L phonèmes a la rime du mot, puisque L ≥ |rime| : l'ensemble est inclus dans celui de la rime, jamais plus grand.

### 2. Le port et l'adaptateur (ports, adapters)

`PhoneticsRepository.ending(phonemes, category)`, où `phonemes` est la suite des derniers phonèmes, jointe. `InMemoryPhonetics` bâtit à la construction un index `catégorie + k derniers phonèmes → formes`, pour k de 1 à 3 (le plus grand `SHARED`), sur toutes les lignes, comme l'index des rimes. Quand L dépasse 3 (une rime longue, comme /ɑ̃bʁ/), le domaine garde l'index des rimes, qui vaut alors l'ensemble exact.

*Alternative écartée : filtrer l'ensemble de la rime dans le domaine, une fois par finale.* Pas de changement de port, mais il faut prononcer chaque forme de la rime au premier passage (jusqu'à 92 000 verbes en /e/), ce qui alourdit le premier geste, déjà le point faible.

### 3. `Sounds.ending` et les trois filtres (domain)

`Sounds` gagne `ending(phonemes, category)`, qui rend le même ensemble d'un passage à l'autre (comme `rhyming`). Une aide du moteur, `candidatesFor(sounds, reference, richness, category)`, rend :
- l'ensemble vide si `requiredEnding` ne rend rien ;
- `sounds.ending(...)` si L ≤ 3 ;
- `sounds.rhyming(rhymeOf(reference), ...)` sinon.

Le R+n, l'antérime et le schéma de rimes (lettre déjà posée) passent ce résultat en `among`. Avec un ensemble vide, la recherche du voisin ne visite rien et rend « aucune rime ».

### Couches et ports

- **ports :** `phonetics.ts` ;
- **adapters :** `morphology/in-memory-phonetics.ts` ;
- **domain :** `phonetics/rhyme.ts`, `rhyme/engine.ts`, `rhyme/rn.ts`, `rhyme/anterhyme.ts`, `rhyme/rhyme-scheme.ts`.

## Risks / Trade-offs

- **[La mémoire de la textbank grossit]** → Trois entrées d'index de plus par ligne (environ 525 000 lignes). C'est mesuré au chargement (tâche 3.2) et noté dans `RESULTATS.md`.
- **[Une forme acceptée manque à l'ensemble]** → Le raisonnement de la décision 1 l'exclut ; le test d'équivalence mot à mot (tâche 3.1) le vérifie, en prose et en vers.

## Migration Plan

Aucune donnée ne change. Retour arrière : un revert.

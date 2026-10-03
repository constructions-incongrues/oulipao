# Design

## Context

Voir `proposal.md` pour les mesures. Les quatre filtres passent par `planByVerse` (`src/domain/rhyme/engine.ts`) : pour chaque vers visé, ils appellent `settle(slot, decision)`, qui prévoit le remplaçant avec `probe` puis garde la décision pour `applyRhymeFilter`. Depuis l'index des rimes, `probe` et `applyRhymeFilter` transmettent déjà `decision.among` à la recherche du voisin (`nthNoun`, `nthAdjective`, `nthAdverb`, `nthVerb`). Il manque seulement que les filtres le fournissent.

L'invariant de l'index tient toujours : `accept(forme)` ne doit retenir aucune forme hors de `among`. La prononciation d'une forme candidate, au vol (`sounds.of`), est celle du fichier dérivé, qui couvre toutes les formes candidates : sa rime est celle de l'index.

## Goals / Non-Goals

**Goals :**
- Moins de 100 ms pour chacun des quatre filtres, sur un texte de 200 mots en vers.
- Exactement les mêmes mots en sortie.

**Non-Goals :**
- Le cas « ne rime plus » du schéma de rimes, qui reste un parcours complet.
- Les données, le port et l'adaptateur, inchangés.

## Decisions

### 1. Les candidates de chaque filtre (domain)

| Filtre | Critère (`accept`) | `among` | Pourquoi l'invariant tient |
|---|---|---|---|
| Monorime | rime == rime choisie, et genre voulu | formes de la rime choisie | le genre ne fait que restreindre |
| Schéma de rimes, lettre déjà posée | rime avec la référence de la lettre (`rhymes`), et genre voulu | formes de la rime de la référence | deux mots ne riment que s'ils ont la même rime |
| Schéma de rimes, première occurrence d'une lettre | ne rime avec aucune autre lettre | aucun (parcours complet) | critère par absence |
| Antérime | rime avec le premier mot du vers précédent | formes de sa rime | comme ci-dessus |
| Rime berrychonne | rime parmi les deux rimes croisées | réunion des formes des deux rimes | la rime est l'une des deux |

### 2. `Sounds.rhyming` sur plusieurs rimes (domain)

`rhyming(rhyme | readonly string[], category)`. Pour une rime seule, rien ne change (un ensemble tiré du tableau de l'index, gardé d'un passage à l'autre). Pour plusieurs, la réunion est gardée dans une table par textbank, sous la clé `catégorie + rimes triées`, pour que les positions de ses lemmes ne se calculent qu'une fois (`candidatePositions`, qui les range par identité d'ensemble).

- *Alternative écartée : passer plusieurs ensembles à la recherche du voisin.* Cela change quatre signatures du domaine pour un seul filtre.

### Couches et ports

Couche **domain** seulement : `rhyme/engine.ts`, `rhyme/monorhyme.ts`, `rhyme/rhyme-scheme.ts`, `rhyme/anterhyme.ts`, `rhyme/berrychonne.ts`. Aucun port ni adaptateur.

## Risks / Trade-offs

- **[Le cas « ne rime plus » du schéma de rimes reste lent]** → Il ne touche que la première occurrence d'une lettre qui rime par accident avec une autre, ce qui est rare. S'il fait dépasser la cible, la mesure le dira et le cas sera noté dans RISK-11.
- **[Une rime fréquente (/e/, /ɔ̃/) donne un grand ensemble]** → Ses positions se calculent une fois, puis le parcours ne visite que ses lemmes.

## Migration Plan

Aucune donnée ne change. Retour arrière : un revert.

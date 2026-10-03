# Proposition : l'index des rimes pour les filtres de vers

## Why

L'index des rimes (changement `index-des-rimes`, PR #37) a fait passer le R+n et les homophonies sous 100 ms. Les filtres de vers arrivés ensuite avec #33 (schéma de rimes, antérime, rime berrychonne, monorime à genre) parcourent encore tout le dictionnaire. Mesuré le 2026-10-03 sous Node, sur les trois textes de référence de 200 mots réécrits en vers (8 mots par vers, strophes de 4 vers), chaque filtre seul, réglages par défaut, pire de 10 passages :

| Filtre | Texte 1 | Texte 2 | Texte 3 |
|---|---|---|---|
| Monorime | 1 081 ms | 561 ms | 243 ms |
| Antérime | 166 ms | 40 ms | 660 ms |
| Schéma de rimes | 597 ms | 178 ms | 149 ms |
| Rime berrychonne | 97 ms | 16 ms | 1 ms |

L'objectif 3 (moins de 100 ms) est dépassé jusqu'à dix fois. Le critère de ces filtres est presque toujours « la rime vaut X », ce que l'index sert déjà.

## What Changes

- Le monorime, le schéma de rimes, l'antérime et la rime berrychonne fournissent leurs candidates à la recherche du voisin (`Decision.among`), comme le R+n.
- `Sounds.rhyming` accepte plusieurs rimes à la fois (la rime berrychonne en croise deux), et garde leur réunion d'un passage à l'autre.
- Le cas du schéma de rimes où un vers doit cesser de rimer (« le premier voisin qui ne rime plus ») reste un parcours complet : son critère est une absence de rime, que l'index ne sert pas.
- Aucun mot ne change : vérifié mot à mot sur les textes de référence en vers, avant et après.

## Capabilities

### New Capabilities
<!-- Aucune. -->

### Modified Capabilities
- `filtres-de-rime` : un budget de temps pour les filtres de vers.

## Impact

- **domain :** `rhyme/engine.ts` (`Sounds.rhyming` sur plusieurs rimes), `rhyme/monorhyme.ts`, `rhyme/rhyme-scheme.ts`, `rhyme/anterhyme.ts`, `rhyme/berrychonne.ts`.
- **Rien d'autre :** ni port, ni adaptateur, ni données ; l'index existe déjà.
- **Documentation :** `RESULTATS.md` ; arc42, sections 10 (QS-06) et 11 (RISK-11).

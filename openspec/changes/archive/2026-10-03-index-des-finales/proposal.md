# Proposition : un index des finales pour les rimes exigeantes

## Why

Le R+7 par défaut, sur les textes de référence en vers, reste irrégulier : 33 à 79 ms en médiane, 56 à 237 ms au 95e percentile (RISK-11). Profilé le 2026-10-03, mot par mot : le coût se concentre sur les mots **qui ne trouvent pas de rime**. Sur le texte 1, trois échecs coûtent 47 des 97 ms d'un passage :

| Mot | Rime | Candidates | Temps | Résultat |
|---|---|---|---|---|
| pluie (×2) | /i/ | 9 912 | 22,6 et 13,3 ms | aucune rime suffisante |
| ans | /ɑ̃/ | 5 034 | 11,2 ms | aucune rime suffisante |

La rime « suffisante », réglage par défaut, exige deux phonèmes communs depuis la fin. L'index des rimes ne trie que par rime (dernière voyelle et ce qui suit). Pour « ans » (un seul phonème), aucune forme ne peut rimer suffisamment, mais le filtre prononce et teste les 5 034 formes en /ɑ̃/ avant de le conclure.

## What Changes

- La textbank rend aussi les formes d'une catégorie qui finissent par une suite donnée d'un à trois phonèmes (`ending`).
- Le R+n, l'antérime et le schéma de rimes (lettre déjà posée) restreignent leurs candidates aux formes qui partagent avec le mot de référence ses L derniers phonèmes, L étant le plus grand de la longueur de la rime et du nombre de phonèmes communs qu'exige la richesse. Un mot trop court pour cela n'a aucune candidate : l'échec est immédiat.
- Aucun mot ne change : toute forme qui rime à cette richesse partage ces L phonèmes. Vérifié mot à mot sur les textes de référence en prose et en vers.
- Le monorime et la rime berrychonne, qui ne demandent qu'une rime égale, et l'antirime, qui demande une absence de rime, ne changent pas.

## Capabilities

### New Capabilities
<!-- Aucune. -->

### Modified Capabilities
- `textbank-phonetique` : la textbank rend les formes d'une finale.
- `filtres-de-rime` : le R+n par défaut tient le budget en vers, et un échec ne parcourt rien.

## Impact

- **ports :** `phonetics.ts` (méthode `ending`).
- **adapters :** `morphology/in-memory-phonetics.ts` (index des finales, d'un à trois phonèmes).
- **domain :** `phonetics/rhyme.ts` (la finale exigée), `rhyme/engine.ts` (`Sounds.ending`), `rhyme/rn.ts`, `rhyme/anterhyme.ts`, `rhyme/rhyme-scheme.ts`.
- **Rien d'autre :** les données ne changent pas.
- **Documentation :** `RESULTATS.md` ; arc42, sections 5 (I-06), 10 (QS-06) et 11 (RISK-11).

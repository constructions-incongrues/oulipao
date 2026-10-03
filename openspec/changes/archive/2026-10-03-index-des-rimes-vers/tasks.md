# Tasks

## 1. Référence

- [x] 1.1 Écrire `scripts/_reference-vers.ts`, un script temporaire qui réécrit les trois textes de référence en vers (8 mots par vers, strophes de 4 vers, en ne coupant que sur un blanc qui contient une espace) et enregistre dans `resultats/vers-avant.json` les sorties (mots et raisons) du monorime, du schéma de rimes, de l'antérime et de la rime berrychonne, toutes pistes et réglages par défaut, avec leurs temps. Le lancer sur le code actuel ; vérifier que le fichier existe.

## 2. Domaine

- [x] 2.1 `Sounds.rhyming` accepte une rime ou plusieurs (`rhyme/engine.ts`) et garde la réunion par textbank. Vérifier par un test du domaine : mêmes formes que la réunion des appels séparés, et le même ensemble rendu deux fois.
- [x] 2.2 Le monorime, le schéma de rimes (lettre déjà posée), l'antérime et la rime berrychonne fournissent `among`. Vérifier par les tests existants des filtres, inchangés.

## 3. Vérification

- [x] 3.1 Relancer le script : sorties identiques à `vers-avant.json` mot à mot, et chaque passage sous 100 ms au 95e percentile. Noter les temps dans `RESULTATS.md`, puis supprimer le script et le fichier de référence.
- [x] 3.2 `npm test` (couverture d'au moins 90 %) et `npm run typecheck` passent.

## 4. Documentation

- [x] 4.1 Mettre à jour arc42 : 10 (QS-06) et 11 (RISK-11, avec les mesures des filtres de vers). Vérifier par `grep` que les chiffres de `RESULTATS.md` et d'arc42 concordent.

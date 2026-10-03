# Tasks

## 1. Référence

- [x] 1.1 Écrire `scripts/_reference-finales.ts`, un script temporaire qui enregistre dans `resultats/finales-avant.json` les sorties (mots et raisons) du R+1, du R+7, de l'antérime et du schéma de rimes, réglages par défaut sauf le décalage, toutes pistes, sur les trois textes de référence en prose et en vers (8 mots par vers, strophes de 4 vers), avec leurs temps. Le lancer sur le code actuel ; vérifier que le fichier existe.

## 2. Index et filtres

- [x] 2.1 `requiredEnding(phonemes, richness)` dans `domain/phonetics/rhyme.ts`. Vérifier par un test : « ʃɛz » en suffisante rend « ɛz » ; « plɥi » rend « ɥi » ; « ɑ̃ » rend rien ; une rime de quatre phonèmes rend ses quatre phonèmes.
- [x] 2.2 `PhoneticsRepository.ending` (ports) et l'index des finales, d'un à trois phonèmes, dans `adapters/morphology/in-memory-phonetics.ts`. Vérifier par `test/adapters/phonetics.test.ts` : les noms en /ɥi/ comprennent « pluie », pas « ami ».
- [x] 2.3 `Sounds.ending` et `candidatesFor` dans `domain/rhyme/engine.ts` ; le R+n, l'antérime et le schéma de rimes (lettre déjà posée) s'en servent. Vérifier par les tests existants des filtres, inchangés, et par un test : « ans » en R+7 suffisante est laissé sans qu'aucune forme ne soit essayée.

## 3. Vérification

- [x] 3.1 Relancer le script : sorties identiques à `finales-avant.json` mot à mot, et le R+7 en vers sous 100 ms au 95e percentile. Noter les temps dans `RESULTATS.md`, puis supprimer le script et le fichier de référence.
- [x] 3.2 Mesurer le temps de chargement de la textbank avant et après (sous Node), et le noter dans `RESULTATS.md`.
- [x] 3.3 `npm test` (couverture d'au moins 90 %) et `npm run typecheck` passent.

## 4. Documentation

- [x] 4.1 Mettre à jour arc42 : 5 (I-06), 10 (QS-06), 11 (RISK-11). Vérifier par `grep` que les chiffres concordent avec `RESULTATS.md`.

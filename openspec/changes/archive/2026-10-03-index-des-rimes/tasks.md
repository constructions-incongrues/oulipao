# Tasks

## 1. Avant tout : la référence

- [x] 1.1 Écrire `scripts/_reference-rimes.ts`, un script temporaire qui enregistre dans `resultats/rimes-avant.json` les sorties (mots et raisons) du R+1, du R+3 et des homophonies, toutes pistes, sur les trois textes de référence, et le temps de chaque passage. Le lancer sur le code actuel. Vérifier que le fichier existe.

## 2. Dérivation (adapters, scripts)

- [x] 2.1 Dans `adapters/lexicon/glaff-phonetics.ts`, ajouter la colonne source (`G`, `A`, `R`) et les lignes de repli pour les formes candidates que GLÀFF ne couvre pas dans leur catégorie, après les lignes de GLÀFF. Vérifier par `test/adapters/` (petit GLÀFF et petit univers factices).
- [x] 2.2 `scripts/build-phonetics.ts` passe l'univers des formes candidates (morphologie, verbes, lexique). Régénérer `data/phonetique-oulipao.tsv` et noter lignes, poids brut et compressé dans `RESULTATS.md`.

## 3. Textbank et recherche (adapters, ports, domain)

- [x] 3.1 `PhoneticsRepository.rhyming(rhyme, category)` ; `InMemoryPhonetics` lit la colonne source (schéma zod), bâtit l'index des rimes sur toutes les lignes, celui des homophones sur les lignes `G` seulement. Vérifier par `test/adapters/phonetics.test.ts`.
- [x] 3.2 `among?` dans `nthNoun`, `nthAdjective`, `nthAdverb` (`neighbours.ts`) et `nthVerb` (`verb.ts`) : parcours restreint aux lemmes des candidates, dans l'ordre du tour. Vérifier par des tests avec un dictionnaire factice : mêmes résultats avec et sans `among`, dans les deux sens et en faisant le tour.
- [x] 3.3 `Decision.among` et `Sounds.rhyming` dans `rhyme/engine.ts` ; le R+n fournit les formes de même rime, les homophonies leurs homophones. Vérifier par les tests existants des filtres, inchangés.
- [x] 3.4 Changer `PHONETICS_VERSION` dans `ui/composition.ts`. Vérifier par `npm run typecheck`.

## 4. Vérification

- [x] 4.1 Relancer le script de référence sur le nouveau code : sorties identiques à `rimes-avant.json` mot à mot, et chaque passage sous 100 ms au 95e percentile. Noter les temps dans `RESULTATS.md`, puis supprimer le script et le fichier de référence.
- [x] 4.2 `npm test` (couverture d'au moins 90 %) et `npm run typecheck` passent.
- [x] 4.3 Dans le navigateur, site assemblé : un R+1 sur toutes les pistes d'un texte de 200 mots se met à jour sans attente perceptible, et l'inspecteur montre « prononciation devinée » pour un nom composé.

## 5. Documentation

- [x] 5.1 Mettre à jour arc42 : 5 (port I-06), 8.3, 10 (QS-06 et 10.3), 11 (RISK-11, avec les mesures avant et après). Vérifier par `grep` que RISK-11 ne se dit plus ouvert si la cible est tenue.

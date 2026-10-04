# Proposal

## Why

La revue d'ingénierie du 2026-10-04 a mesuré qu'à l'ajout du premier filtre de rime, l'index phonétique fige la page 3,2 s et occupe 611 Mo de mémoire (sous Node, sur un poste rapide). C'est assez pour qu'un téléphone tue l'onglet. Deux fichiers publiés, les verbes (18 Mo) et les prononciations (17 Mo), ne sont jamais chargés par un test : une régénération cassée passerait la CI et serait mise en ligne automatiquement. Les poids du modèle suivent la branche `main` d'un dépôt tiers. Un poème long sans ponctuation, cas ordinaire à l'Oulipo, risque de dépasser la fenêtre du modèle. C'est la voie C du plan de correction : adaptateurs, données et étiqueteur.

## What Changes

- L'index phonétique garde chaque prononciation sous forme de chaîne et ne l'analyse qu'à la demande. Les symboles sont validés par table, avec le même rejet des lignes fausses. Un test borne la mémoire à 250 Mo après ramasse-miettes, sur le fichier réel.
- Les fichiers publiés des verbes et des prononciations sont chargés en entier par un test, comme la morphologie et le lexique.
- Les poids du modèle d'étiquetage sont figés sur la révision `39f044ac95da4c5fd3832cbc5658c027fc027127` (dernière modification le 2024-10-08).
- Un texte long sans ponctuation forte est d'abord sondé dans le navigateur. Si la sonde échoue, il est découpé aux retours à la ligne puis par fenêtres d'environ 400 sous-mots avant l'étiquetage. Si elle passe, le découpage ne change pas.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `textbank-phonetique` : empreinte mémoire bornée de la textbank chargée.
- `interface-a-pistes-reglage-en-direct` : étiquetage d'un texte long sans ponctuation.
- `mise-en-ligne` : révision figée des poids du modèle ; données publiées vérifiées avant publication.

## Impact

- Adaptateurs :
  - `src/adapters/morphology/in-memory-phonetics.ts` ;
  - `src/adapters/taggers/camembert-model.ts` et `camembert-tagger.ts`.
- Domaine : `src/domain/phonetics/phoneme.ts` (analyse et validation des symboles).
- Tests : `test/adapters/*` gagne des tests sur `data/verbes-oulipao.tsv` et `data/phonetique-oulipao.tsv` réels. `npm test` prend quelques secondes de plus.
- Aucune dépendance nouvelle. Les hôtes et la politique de sécurité du contenu ne changent pas. Le TODO d'hébergement du modèle reste ouvert.

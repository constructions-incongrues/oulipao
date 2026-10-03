## ADDED Requirements

### Requirement: Une rime impossible est constatée sans parcours
A filter that requires a rhyme of a given richness (R+n, anterhyme, rhyme scheme) SHALL only try the forms that share with the reference word as many final phonemes as the longer of its rhyme and the richness requires; a reference word with fewer phonemes than that SHALL be left at once with its usual reason. With its default settings, the R+n SHALL rewrite each of the three 200-word reference texts laid out in verse in less than 100 ms at the 95th percentile, and SHALL give exactly the same words as before.

#### Scenario: « ans » en rime suffisante
- **GIVEN** le nom « ans » (/ɑ̃/, un seul phonème) visé par un R+7 en rime suffisante
- **WHEN** le filtre s'applique
- **THEN** le mot est laissé avec la raison « aucune rime suffisante », sans qu'aucune forme ne soit essayée

#### Scenario: R+7 en vers
- **GIVEN** chacun des trois textes de référence réécrit en vers (8 mots par vers, strophes de 4 vers), les fichiers dérivés chargés
- **WHEN** un R+7 par défaut vise toutes ses pistes
- **THEN** chaque passage prend moins de 100 ms au 95e percentile, sous Node, et chaque mot de sortie et chaque raison sont ceux d'avant le changement

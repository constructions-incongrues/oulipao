## ADDED Requirements

### Requirement: Les filtres de vers au rythme du réglage en direct
The monorhyme, rhyme scheme, anterhyme and berrychonne filters SHALL rewrite a 200-word text laid out in verse, targeting all their tracks with their default settings, in less than 100 ms at the 95th percentile with the derived files loaded, and SHALL give exactly the same words as a scan of the whole dictionary.

#### Scenario: Textes de référence en vers
- **GIVEN** chacun des trois textes de référence de 200 mots, réécrit à raison de 8 mots par vers et de strophes de 4 vers, les fichiers dérivés chargés
- **WHEN** le monorime, le schéma de rimes, l'antérime puis la rime berrychonne visent toutes leurs pistes
- **THEN** chaque passage prend moins de 100 ms au 95e percentile, sous Node

#### Scenario: Mêmes mots qu'avant
- **GIVEN** les mêmes textes en vers, et les sorties de ces quatre filtres obtenues avant le changement
- **WHEN** on les recalcule
- **THEN** chaque mot de sortie et chaque raison sont identiques

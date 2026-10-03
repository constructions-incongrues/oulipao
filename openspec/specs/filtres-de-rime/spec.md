# filtres-de-rime Specification

## Purpose
Ouvrir la famille oulipienne des rimes et des homophonies : quatre contraintes qui remplacent un mot par un mot qui sonne autrement ou pareil, avec une règle énoncée et accordée comme au S+n. Elles s'enchaînent avec les filtres existants.

## Requirements

### Requirement: R+n
The system SHALL offer an R+n constraint on the noun, adjective, verb and adverb tracks that replaces each targeted word by the n-th word following it in French dictionary order, within its category, among the words whose form with the same features rhymes with it at the chosen richness; the replacement SHALL agree in gender and number (and in tense and person for verbs) as with S+n, and elision SHALL be recomputed.

#### Scenario: R+1 sur « chaise »
- **GIVEN** « sur la chaise » et un R+1 à la richesse suffisante sur les noms
- **WHEN** le texte est traité
- **THEN** « chaise » devient le premier nom après « chaise » dans le dictionnaire qui rime en /ɛz/, accordé au féminin singulier

#### Scenario: Aucun voisin qui rime
- **GIVEN** un nom dont aucun autre nom de sa catégorie ne rime avec lui à la richesse riche
- **WHEN** le R+n le traite
- **THEN** il reste tel quel, avec la raison « aucune rime riche »

#### Scenario: R+0
- **GIVEN** un R+0
- **WHEN** on regarde son effet
- **THEN** il ne change pas le texte

### Requirement: Portée aux fins de vers
The system SHALL let R+n target either every word of its tracks or only the ends of lines, the default being every word.

#### Scenario: Fins de vers seulement
- **GIVEN** un poème de quatre vers et un R+3 réglé sur « fins de vers »
- **WHEN** le texte est traité
- **THEN** seuls les quatre mots de fin de vers changent

### Requirement: Monorime
The system SHALL offer a monorhyme constraint that replaces each targeted line end by the first word following it in dictionary order, within its category and with the same features, whose rhyme is the chosen one; the rhyme SHALL be chosen from a closed list of the most frequent rhymes of the lexicon, each shown in phonetic form with an example word. A gender setting (any, masculine, feminine, alternate) SHALL further restrict the accepted words; in alternate mode, the gender SHALL alternate line by line within a stanza, starting from the gender of the first line.

#### Scenario: Monorime en /ɔ̃/
- **GIVEN** un poème et un monorime réglé sur /ɔ̃/ (« maison »)
- **WHEN** le texte est traité
- **THEN** chaque fin de vers visée finit en /ɔ̃/, et une fin de vers qui rimait déjà en /ɔ̃/ ne change pas

#### Scenario: Sonnet monorime alterné
- **GIVEN** un quatrain et un monorime réglé sur /ɔ̃/, genre alterné
- **WHEN** le texte est traité
- **THEN** toutes les fins finissent en /ɔ̃/, et leur genre alterne de vers en vers, ou la fin qui n'a pas de candidat porte sa raison

### Requirement: Antirime
The system SHALL offer an antirhyme constraint that, within each stanza, replaces a line end rhyming at the chosen richness with an earlier line end of the same stanza by the first word following it in dictionary order, within its category and with the same features, that rhymes with none of them.

#### Scenario: Quatrain à rimes plates
- **GIVEN** un quatrain AABB et un antirime
- **WHEN** le texte est traité
- **THEN** les fins des vers 2 et 4 sont remplacées, et aucune fin de vers du quatrain ne rime plus avec une autre

### Requirement: Homophonies
The system SHALL offer a homophony constraint that replaces each targeted word by a homophone of the same category with the same features, the n-th in dictionary order cycling through the homophones, and SHALL leave a word without a homophone unchanged with the reason « aucun homophone ».

#### Scenario: « vers » nom
- **GIVEN** « un vers » et une homophonie sur les noms
- **WHEN** le texte est traité
- **THEN** « vers » devient « ver », « verre » ou « vair », au masculin singulier

### Requirement: Filtres de rime dans la chaîne
The system SHALL let every rhyme constraint be added several times, target its tracks, take its place in the ordered chain, respect muted steps and per-word locks, and appear in the summary and in the copied mention with its settings in plain words (« R+3, rime suffisante, fins de vers »).

#### Scenario: S+7 puis R+2
- **GIVEN** une chaîne S+7 sur les noms puis R+2 sur les adjectifs
- **WHEN** le texte est traité
- **THEN** le R+2 reçoit la sortie du S+7, et la mention copiée nomme les deux réglages dans l'ordre

#### Scenario: Pas bouché
- **GIVEN** un R+n et un pas bouché sur un nom
- **WHEN** le texte est traité
- **THEN** ce nom ne change pas

### Requirement: Le R+n et les homophonies au rythme du réglage en direct
The R+n and homophony filters SHALL rewrite a 200-word text, targeting all their tracks, in less than 100 ms at the 95th percentile with the derived files loaded, and SHALL give exactly the same words as a scan of the whole dictionary.

#### Scenario: Texte de référence
- **GIVEN** chacun des trois textes de référence de 200 mots, les fichiers dérivés chargés
- **WHEN** un R+1, puis une homophonie, visent toutes leurs pistes
- **THEN** chaque passage prend moins de 100 ms au 95e percentile, sous Node

#### Scenario: Mêmes mots qu'avant
- **GIVEN** les trois textes de référence, et les sorties du R+1, du R+3 et des homophonies obtenues avant l'index
- **WHEN** on les recalcule avec l'index
- **THEN** chaque mot de sortie et chaque raison sont identiques

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

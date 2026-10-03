# Spec Delta

## Purpose

Ouvrir la famille oulipienne des rimes et des homophonies : quatre contraintes qui remplacent un mot par un mot qui sonne autrement ou pareil, avec une règle énoncée et accordée comme au S+n. Elles s'enchaînent avec les filtres existants.

## ADDED Requirements

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
The system SHALL offer a monorhyme constraint that replaces each targeted line end by the first word following it in dictionary order, within its category and with the same features, whose rhyme is the chosen one; the rhyme SHALL be chosen from a closed list of the most frequent rhymes of the lexicon, each shown in phonetic form with an example word.

#### Scenario: Monorime en /ɔ̃/
- **GIVEN** un poème et un monorime réglé sur /ɔ̃/ (« maison »)
- **WHEN** le texte est traité
- **THEN** chaque fin de vers visée finit en /ɔ̃/, et une fin de vers qui rimait déjà en /ɔ̃/ ne change pas

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

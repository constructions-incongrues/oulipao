# Spec Delta

## Purpose

Défaire un texte vers par vers, à la manière du ciselage d'Isou, par paliers nommés et rejouables : des mots pleins jusqu'à la lettre et au souffle, le premier vers restant intact pour que l'original affleure.

## ADDED Requirements

### Requirement: Ciselure dans la chaîne
The system SHALL offer a « Ciselure » engine that is added to the chain like the others, acts on the whole text (no targeted tracks), and has two integer parameters: the final tier, from 1 to 5 (default 5), and the number of lines per tier, from 1 to 9 (default 1). It SHALL be deterministic, and SHALL provide a title, a label for the summary and the mention, and a help text.

#### Scenario: Ajout
- **GIVEN** une chaîne vide
- **WHEN** l'utilisateur ajoute une Ciselure
- **THEN** la chaîne montre « Ciselure » avec « Tout le texte », un palier final à 5 et 1 vers par palier

#### Scenario: Rejouée
- **GIVEN** une prise gardée avec une Ciselure
- **WHEN** l'utilisateur la rouvre
- **THEN** le texte résultant est identique à celui qui a été gardé

### Requirement: Paliers par vers
The system SHALL leave the first line unchanged and SHALL put line n (counted from 0, as lines reach the engine) at tier min(final, ceil(n / perTier)). Each tier SHALL transform every word of the line as follows: tier 1 removes the words of the « autres » track; tier 2 keeps the first written syllable of each remaining word; tier 3 keeps its vowels; tier 4 keeps its initial; tier 5 replaces it with a breath, « pfou » (an onomatopoeia the French voice says as a word). A closed step SHALL keep its word.

#### Scenario: Descente
- **GIVEN** quatre vers « Le vieux chat dort », palier final 5, 1 vers par palier
- **WHEN** la Ciselure agit
- **THEN** le vers 1 reste « Le vieux chat dort », le vers 2 devient « vieux chat dort », le vers 3 « vieu cha dor », le vers 4 « ieu a o »

#### Scenario: Palier final
- **GIVEN** six vers, palier final 2
- **WHEN** la Ciselure agit
- **THEN** les vers 3 à 6 restent au palier 2

#### Scenario: Deux vers par palier
- **GIVEN** cinq vers, 2 vers par palier
- **WHEN** la Ciselure agit
- **THEN** les vers 2 et 3 sont au palier 1, les vers 4 et 5 au palier 2

#### Scenario: Pas bouché
- **GIVEN** le mot « chat » bouché, sur un vers au palier 4
- **WHEN** la Ciselure agit
- **THEN** « chat » reste écrit en entier

### Requirement: Texte d'un seul vers
The system SHALL leave a one-line text unchanged and SHALL say in the engine's help that a « Mise en vers » placed before the Ciselure cuts the text into lines.

#### Scenario: Prose
- **GIVEN** un texte en prose sans saut de ligne
- **WHEN** la Ciselure agit seule
- **THEN** le texte ne change pas et l'aide invite à placer une Mise en vers avant la Ciselure

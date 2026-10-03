# Spec Delta

## Purpose

Donner au texte une structure de poème sans rien déplacer : chaque mot sait dans quel vers et quelle strophe il se trouve, et s'il termine son vers. Les filtres de rime s'en servent pour viser les fins de vers.

## ADDED Requirements

### Requirement: Vers et strophes tirés des blancs
The system SHALL number the lines (a line ends at a line break) and the stanzas (a stanza ends at one or more empty lines) of the processed text, and SHALL give each word its line and its stanza, without changing the words, their order or the blanks between them.

#### Scenario: Deux strophes
- **GIVEN** un texte de trois lignes, puis une ligne vide, puis deux lignes
- **WHEN** il est découpé
- **THEN** il compte cinq vers et deux strophes, et le premier mot de la quatrième ligne est dans le vers 4 et la strophe 2

#### Scenario: Prose
- **GIVEN** un texte sans retour à la ligne
- **WHEN** il est découpé
- **THEN** il forme un seul vers et une seule strophe

### Requirement: Fin de vers
The system SHALL mark as the end of its line the last word of each line that belongs to a noun, adjective, verb or adverb track, skipping function words and punctuation after it.

#### Scenario: Ponctuation finale
- **GIVEN** le vers « Le vieux chat dort sur la chaise. »
- **WHEN** sa fin est repérée
- **THEN** « chaise » est la fin de vers

#### Scenario: Mot-outil final
- **GIVEN** le vers « Il pense à elle »
- **WHEN** sa fin est repérée
- **THEN** « pense » est la fin de vers, « à » et « elle » étant des mots-outils

### Requirement: Découpe stable dans la chaîne
The system SHALL keep each word's line and stanza through the chain, since filters replace or remove words but never move them or add line breaks.

#### Scenario: Après un S+7
- **GIVEN** un texte en vers passé au S+7
- **WHEN** le R+n qui suit reçoit le texte
- **THEN** chaque mot a le même vers et la même strophe que dans le texte d'origine

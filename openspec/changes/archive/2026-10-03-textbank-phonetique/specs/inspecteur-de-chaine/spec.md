# Spec Delta

## ADDED Requirements

### Requirement: Prononciation dans l'inspecteur
The system SHALL show, for the word opened in the inspector, its pronunciation in IPA, its syllable count and its rhyme, once the phonetic textbank is loaded, and SHALL say when the pronunciation was guessed by rules.

#### Scenario: Mot connu
- **GIVEN** une chaîne avec un R+n et la textbank chargée
- **WHEN** on ouvre « chaise » dans l'inspecteur
- **THEN** l'inspecteur montre /ʃɛz/, 1 syllabe et la rime /ɛz/

#### Scenario: Mot deviné
- **GIVEN** un mot absent du lexique
- **WHEN** on l'ouvre dans l'inspecteur
- **THEN** sa prononciation porte la mention « devinée »

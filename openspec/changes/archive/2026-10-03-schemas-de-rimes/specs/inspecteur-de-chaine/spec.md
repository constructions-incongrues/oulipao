# Spec Delta

## MODIFIED Requirements

### Requirement: Prononciation dans l'inspecteur
The system SHALL show, for the word opened in the inspector, its pronunciation in IPA, its syllable count, its rhyme and the gender of that rhyme, once the phonetic textbank is loaded, and SHALL say when the pronunciation was guessed by rules. When the opened word ends a line under a rhyme-scheme constraint, the inspector SHALL also show the letter of its line in the scheme.

#### Scenario: Mot connu
- **GIVEN** une chaîne avec un R+n et la textbank chargée
- **WHEN** on ouvre « chaise » dans l'inspecteur
- **THEN** l'inspecteur montre /ʃɛz/, 1 syllabe, la rime /ɛz/ et le genre « féminine »

#### Scenario: Mot deviné
- **GIVEN** un mot absent du lexique
- **WHEN** on l'ouvre dans l'inspecteur
- **THEN** sa prononciation porte la mention « devinée »

#### Scenario: Lettre du schéma
- **GIVEN** un quatrain sous un schéma « embrassées »
- **WHEN** on ouvre la fin du vers 4 dans l'inspecteur
- **THEN** l'inspecteur montre la lettre « A »

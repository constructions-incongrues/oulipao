# Spec Delta

## ADDED Requirements

### Requirement: Mot inconnu signalé
The system SHALL leave a word containing the forbidden letter that is absent from the dictionary unchanged with the reason « absent du dictionnaire », distinct from the reason given when the dictionary has no neighbour without the letter.

#### Scenario: Mot absent du dictionnaire
- **GIVEN** la lettre « e » interdite et le nom « zerbinette », absent du dictionnaire
- **WHEN** le lipogramme s'applique
- **THEN** le mot reste tel quel avec la raison « absent du dictionnaire »

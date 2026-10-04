# Spec Delta

## ADDED Requirements

### Requirement: Mot inconnu signalé
The system SHALL leave a word absent from the dictionary unchanged with the reason « absent du dictionnaire », distinct from « aucun voisin à l'initiale x », and the next word SHALL take the next letter as for any word left unchanged.

#### Scenario: Mot absent du dictionnaire
- **GIVEN** le nom « zerbinette », absent du dictionnaire, qui prend la lettre « p »
- **WHEN** le filtre s'applique
- **THEN** le mot reste tel quel avec la raison « absent du dictionnaire »

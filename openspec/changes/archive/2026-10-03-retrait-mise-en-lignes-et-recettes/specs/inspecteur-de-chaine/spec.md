# Spec Delta

## ADDED Requirements

### Requirement: Mot remis en ligne
The system SHALL show, in the band of a step that put a word on a new line, a « ↵ » mark before that word, and SHALL announce it to screen readers as « à la ligne ».

#### Scenario: Mise en vers
- **GIVEN** une Mise en vers « tous les n mots », n = 3
- **WHEN** l'inspecteur est ouvert sur le quatrième mot
- **THEN** la bande de la Mise en vers montre « ↵ » devant ce mot, et la bande « Origine » ne le montre pas

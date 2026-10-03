# Spec Delta

## ADDED Requirements

### Requirement: Vers recopiés dans le texte résultant
The system SHALL mark each refrain line of the resulting text as a copy of the line it repeats, visibly and for screen readers; selecting a word of a copy SHALL open in the inspector the original word it repeats; the copy button SHALL copy the resulting text with its refrains and without the marks.

#### Scenario: Clic sur un refrain
- **GIVEN** un rondel affiché
- **WHEN** on clique un mot du vers 7
- **THEN** l'inspecteur s'ouvre sur ce mot dans le vers 1, et le vers 7 se signale comme la copie du vers 1

#### Scenario: Copie d'un rondel
- **GIVEN** un rondel affiché
- **WHEN** le bouton de copie est actionné
- **THEN** le presse-papiers contient les treize vers en trois strophes, sans marque de copie

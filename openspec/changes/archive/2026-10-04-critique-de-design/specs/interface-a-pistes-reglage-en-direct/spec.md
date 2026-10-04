# Spec Delta

## ADDED Requirements

### Requirement: Ponctuation française insécable
The system SHALL display the result text with a narrow no-break space before « ; », « ! » and « ? », and a no-break space before « : » and « » » and after « « », so that no line starts with these marks; the copied text SHALL stay unchanged.

#### Scenario: Point-virgule en fin de ligne
- **GIVEN** un texte résultant « … m'éveillait ; je voulais … » qui se coupe à cet endroit
- **WHEN** la bande l'affiche
- **THEN** « ; » reste en fin de ligne avec « m'éveillait », et la ligne suivante commence par « je »

#### Scenario: Copie
- **WHEN** l'utilisateur copie le texte résultant
- **THEN** le presse-papiers reçoit les espaces ordinaires du texte

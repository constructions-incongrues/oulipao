# Spec Delta

## ADDED Requirements

### Requirement: Inspecteur aligné sur la grille
The system SHALL show in the inspector the words of the step page of the chosen word, each in the column it has in the grid, with a stage column as wide as the track strip; a short page SHALL be completed with empty cells.

#### Scenario: Même colonne
- **GIVEN** une grille de 16 pas par page et « heure » au 8e pas
- **WHEN** l'utilisateur ouvre « heure » dans l'inspecteur
- **THEN** les colonnes de l'inspecteur commencent et finissent aux mêmes abscisses que celles de la grille, et « heure » est dans la 8e

#### Scenario: Dernière page courte
- **GIVEN** un texte de 118 mots et 16 pas par page
- **WHEN** l'utilisateur ouvre un mot de la dernière page (pas 113 à 118)
- **THEN** l'inspecteur montre ces six mots suivis de dix cases vides

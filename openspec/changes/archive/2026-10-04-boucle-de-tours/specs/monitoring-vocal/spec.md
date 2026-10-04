# Spec Delta

## MODIFIED Requirements

### Requirement: Boucle sur la page visible
The system SHALL move the playhead through every step of the text in order, one step at a time, and SHALL show the grid page that holds the step being played. After the last step of the text, it SHALL loop back to the first step and its page. When the user picks another grid page during playback, the playhead SHALL resume at the first step of that page.

#### Scenario: Page suivante
- **GIVEN** une page qui montre les pas 1 à 8, lecture en cours
- **WHEN** la tête a dit le pas 8
- **THEN** elle dit le pas 9, et la grille montre la page 9 à 16

#### Scenario: Retour au premier pas
- **GIVEN** un texte de 40 mots, lecture en cours
- **WHEN** la tête a dit le pas 40
- **THEN** elle passe au pas 1, et la grille montre sa page

#### Scenario: Changement de page
- **GIVEN** la tête sur le pas 5 de la page 1 à 8
- **WHEN** l'utilisateur passe à la page 17 à 24
- **THEN** la tête dit ensuite le pas 17

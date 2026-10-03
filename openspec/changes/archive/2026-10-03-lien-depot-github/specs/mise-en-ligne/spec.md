# Spec Delta

## ADDED Requirements

### Requirement: Lien vers le code
The system SHALL show on the tracks page and on the test page a link labelled « Code source » to `https://github.com/constructions-incongrues/oulipao`, reachable by keyboard and visible at every screen width.

#### Scenario: Page à pistes
- **GIVEN** la page à pistes ouverte
- **WHEN** l'utilisateur active « Code source » dans la barre de marque
- **THEN** le navigateur ouvre `https://github.com/constructions-incongrues/oulipao`

#### Scenario: Page d'essai
- **GIVEN** la page d'essai ouverte
- **WHEN** l'utilisateur lit son introduction
- **THEN** un lien « Code source » mène à `https://github.com/constructions-incongrues/oulipao`

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page à pistes s'affiche
- **THEN** le lien « Code source » est visible dans la barre de marque et la page ne défile pas à l'horizontale

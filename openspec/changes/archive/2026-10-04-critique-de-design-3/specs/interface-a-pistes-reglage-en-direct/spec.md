# Spec Delta

## MODIFIED Requirements

### Requirement: Tranche de réglage par piste
The system SHALL give each track a channel strip, at the head of its row in the step grid, showing the track's shape, its name, its word count, a mute button, a solo button and a reminder of the instances that target it; an instance that targets all five tracks SHALL be recalled once, at the head of the strips, instead of in each strip. Filters are set in the chain, not on the strip.

#### Scenario: Piste sans plugin
- **GIVEN** la piste des verbes et aucun filtre qui la vise
- **WHEN** sa tranche s'affiche
- **THEN** elle montre le carré des verbes, leur nom, leur nombre de mots, Muet et Seul, et aucun rappel de filtre

#### Scenario: Filtre sur les cinq pistes
- **GIVEN** un S+7 sur les noms puis un lipogramme sur les cinq pistes
- **WHEN** les tranches s'affichent
- **THEN** la tranche des noms rappelle « 1. S+7 », aucune tranche ne rappelle le lipogramme, et la tête des tranches dit « Toutes les pistes : 2. Lipogramme en e »

## ADDED Requirements

### Requirement: Phrases qui commencent par une majuscule
The system SHALL start each sentence of the status line and each inspector band label with a capital letter; the mention appended to a copy SHALL keep its own case.

#### Scenario: Lipogramme
- **GIVEN** un lipogramme en e dans la chaîne
- **WHEN** la phrase d'état s'affiche
- **THEN** elle dit « Lipogramme en e : … »

### Requirement: Geste principal de la saisie
The system SHALL mark « Mettre en pistes » as the main key of the source panel with a 2 px ink outline, at the same size as the other keys and without an accent colour.

#### Scenario: Saisie dépliée
- **GIVEN** la saisie dépliée
- **WHEN** l'utilisateur la regarde
- **THEN** « Mettre en pistes » a un contour de 2 px et « Essayer avec un exemple » un contour de 1 px

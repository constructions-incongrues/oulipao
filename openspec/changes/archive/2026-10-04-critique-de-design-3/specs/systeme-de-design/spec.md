# Spec Delta

## MODIFIED Requirements

### Requirement: Cibles tactiles sur petit écran
The system SHALL give every key, list, number or text field, disclosure (gate, notebook) and step at least 44 px of height on screens narrower than 768 px, and steps at least 44 px of width, without horizontal scrolling of the page at 375 px.

#### Scenario: Téléphone
- **GIVEN** la page des pistes à 375 px de large avec un texte en pistes et un lipogramme dans la chaîne
- **WHEN** on mesure les touches, les listes, les champs, les dépliants et les pas
- **THEN** chacun fait au moins 44 px de haut, chaque pas au moins 44 px de large, et la page ne défile pas horizontalement

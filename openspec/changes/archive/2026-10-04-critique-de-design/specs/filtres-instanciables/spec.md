# Spec Delta

## ADDED Requirements

### Requirement: Retour à la chaîne après un ajout
The system SHALL collapse the constraint browser after a recipe or an engine is added, SHALL bring the first added constraint into view, and SHALL move the focus to its first setting.

#### Scenario: Moteur ajouté depuis le catalogue ouvert
- **GIVEN** le navigateur de contraintes déplié et une chaîne vide
- **WHEN** l'utilisateur clique « + S+7 »
- **THEN** le navigateur se replie, la ligne du S+7 est visible et le focus est sur son réglage « Décalage »

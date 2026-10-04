# Spec Delta

## ADDED Requirements

### Requirement: Texte long sans ponctuation
The system SHALL put on tracks a text of up to 600 words that contains no sentence-ending punctuation, such as a poem without full stops, giving every word one of the five categories, instead of failing the whole tagging.

#### Scenario: Poème sans point
- **GIVEN** un poème de 600 mots, en vers, sans aucun point, point d'exclamation, point d'interrogation ni points de suspension
- **WHEN** l'utilisateur le met en pistes
- **THEN** chaque mot reçoit une des cinq catégories et la grille s'affiche

# Spec Delta

## ADDED Requirements

### Requirement: Issue d'un pas percé
The system SHALL show on each punched step what the chain did to its word, without a new colour: a full shape when the word changed (replaced or re-laid), a half-size shape when it is unchanged (nothing to change, or kept for want of a replacement), and the shape crossed by an ink stroke when it is removed; the step's accessible name SHALL add « mot changé », « mot inchangé » or « mot retiré ».

#### Scenario: Lipogramme
- **GIVEN** un lipogramme qui remplace « heure », laisse « suis » et retire « je »
- **WHEN** la grille s'affiche
- **THEN** le pas de « heure » a un poinçon plein, celui de « suis » un poinçon réduit, celui de « je » un poinçon barré

### Requirement: Grille avant la mise en pistes
The system SHALL replace the page keys with the sentence « Les pas apparaissent une fois le texte mis en pistes. » while no text is in tracks.

#### Scenario: Page ouverte
- **GIVEN** la page qui vient de s'ouvrir, sans texte
- **WHEN** la grille s'affiche
- **THEN** son en-tête montre la phrase et aucune touche de page

# Spec Delta

## MODIFIED Requirements

### Requirement: Substitution des noms par décalage
The system SHALL, given a text, its tagged words, an offset n, a mode and an order, return the transformed text and the list of substitutions (original word, new word, position), replacing each common noun by the n-th following lemma in the noun list sorted by the chosen order. The order SHALL default to alphabetical (French dictionary order); the other orders are defined by the `ordres-du-s7` capability.

#### Scenario: Décalage de 7
- **GIVEN** un texte dont les mots sont étiquetés et un dictionnaire de noms
- **WHEN** le moteur est appelé avec n = 7 et l'ordre alphabétique
- **THEN** chaque nom est remplacé par le septième lemme suivant dans l'ordre du dictionnaire et la liste des substitutions est rendue

#### Scenario: Ordre par défaut
- **GIVEN** un appel au moteur sans ordre
- **WHEN** le texte est transformé
- **THEN** le résultat est identique à celui de l'ordre alphabétique

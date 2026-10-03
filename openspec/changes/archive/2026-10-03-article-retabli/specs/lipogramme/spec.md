# Spec Delta

## ADDED Requirements

### Requirement: Élision de l'article
The system SHALL elide « le » or « la » into « l’ » before a new word that begins with a vowel or a mute h, and SHALL restore « l’ » into « le » or « la » before a new word that begins with a consonant, with the gender of the new word, else of the replaced word, else the masculine.

#### Scenario: Adjectif nouveau à initiale consonantique
- **GIVEN** le texte « L'enceinte maison. » et la lettre interdite « n »
- **WHEN** le lipogramme s'applique
- **THEN** le résultat est « La fermée ville. », et non « L'fermée ville. »

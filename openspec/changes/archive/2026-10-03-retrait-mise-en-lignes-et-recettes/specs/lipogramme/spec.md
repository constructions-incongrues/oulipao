# Spec Delta

## MODIFIED Requirements

### Requirement: Mots-outils
The system SHALL replace a function word containing the forbidden letter with an equivalent of the same function from a table, and SHALL remove and count it when no equivalent exists; a removed word SHALL keep the line breaks and punctuation of the spacing before it, following the shared rule for removed words.

#### Scenario: Pas d'équivalent
- **GIVEN** un mot-outil fautif sans équivalent dans la table
- **WHEN** le lipogramme s'applique
- **THEN** le mot disparaît du texte résultant et le résumé le compte

#### Scenario: Mot-outil en tête de vers
- **GIVEN** un poème dont un vers commence par un mot-outil fautif sans équivalent
- **WHEN** le lipogramme s'applique
- **THEN** le mot disparaît et le vers reste sur sa propre ligne

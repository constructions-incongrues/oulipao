# Spec Delta

## ADDED Requirements

### Requirement: Relance après un échec du lexique
The system SHALL not keep a failed load of the lexicon used by the lexicon-lookup tagger: after a failure, the next tagging SHALL try to load the lexicon again.

#### Scenario: Réseau revenu
- **GIVEN** la page d'essai dont le premier chargement du lexique a échoué faute de réseau
- **WHEN** le réseau revient et l'utilisateur relance l'étiquetage
- **THEN** le lexique est de nouveau demandé et le texte est étiqueté

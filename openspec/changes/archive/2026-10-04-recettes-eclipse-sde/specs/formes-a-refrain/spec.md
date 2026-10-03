# Spec Delta

## MODIFIED Requirements

### Requirement: Choix de la forme
The system SHALL offer a form choice among none, rondel, villanelle and éclipse, defaulting to none; with none, the resulting text SHALL be exactly the output of the chain. With éclipse, the resulting text SHALL be the source text, a blank line, then the output of the chain; the source part SHALL not be inspectable and the grid SHALL stay aligned on the source text.

#### Scenario: Aucune forme
- **GIVEN** une chaîne quelconque et la forme « aucune »
- **WHEN** le texte est traité
- **THEN** le texte résultant est la sortie de la chaîne, sans vers ajouté

#### Scenario: Éclipse
- **GIVEN** le texte « La ferme dort. », un S+7 sur les noms et la forme « éclipse »
- **WHEN** le texte est traité
- **THEN** le texte résultant est « La ferme dort. », une ligne vide, puis « L'oncle dort. »
- **AND** la copie du texte résultant contient les deux parties

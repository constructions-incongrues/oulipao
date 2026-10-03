# Spec Delta

## MODIFIED Requirements

### Requirement: Traitement dans le navigateur
The system SHALL process the text entirely in the browser, with no network request containing the text, including texts kept in the notebook.

#### Scenario: Session observée dans l'onglet réseau
- **GIVEN** la page des pistes ouverte avec l'onglet réseau
- **WHEN** un texte est collé, étiqueté, transformé puis gardé
- **THEN** aucune requête ne contient le texte

### Requirement: Ordre de la page
The system SHALL present, from top to bottom: the resulting text, the source text, the filter chain, the step grid with its track strips, the inspector, then the notebook.

#### Scenario: Lecture au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur la parcourt avec la touche Tab
- **THEN** il atteint la copie du texte et le bouton « Garder », puis la saisie, puis les filtres, puis les pistes et leurs pas, puis l'inspecteur, puis le carnet

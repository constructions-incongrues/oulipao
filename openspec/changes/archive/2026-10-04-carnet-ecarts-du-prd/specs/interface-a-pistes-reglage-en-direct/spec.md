# Spec Delta

## MODIFIED Requirements

### Requirement: Ordre de la page
The system SHALL present, from top to bottom: the resulting text, the notebook panel, the source text, the filter chain, the step grid with its track strips, then the inspector. The notebook panel SHALL NOT be pinned with the resulting text.

#### Scenario: Lecture au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur la parcourt avec la touche Tab
- **THEN** il atteint la copie du texte et le bouton « Garder », puis l'en-tête du carnet, puis la saisie, puis les filtres, puis les pistes et leurs pas, puis l'inspecteur

#### Scenario: Carnet replié en haut de page
- **GIVEN** un texte mis en pistes et un carnet de 3 entrées, replié
- **WHEN** l'utilisateur fait défiler la page jusqu'à la grille
- **THEN** seule la bande du texte résultant reste collée en haut de l'écran ; le carnet replié n'occupe qu'une ligne sous elle

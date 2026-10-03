# Spec Delta

## MODIFIED Requirements

### Requirement: Tranche de réglage par piste
The system SHALL give each track a channel strip, at the head of its row in the step grid, showing the track's shape, its name, its word count, a mute button, a solo button and a reminder of the instances that target it; filters are set in the chain, not on the strip.

#### Scenario: Piste sans plugin
- **GIVEN** la piste des verbes et aucun filtre qui la vise
- **WHEN** sa tranche s'affiche
- **THEN** elle montre le carré des verbes, leur nom, leur nombre de mots, Muet et Seul, et aucun rappel de filtre

### Requirement: Plugin S+7 sur la piste des noms
The system SHALL open the page with an S+7 instance first in the chain, enabled, with offset 7 and re-agreement mode, targeting the nouns track.

#### Scenario: Ouverture
- **GIVEN** un texte étiqueté
- **WHEN** la page affiche la chaîne
- **THEN** le filtre 1 est un S+7 actif, décalage 7, mode « réaccord », sur les noms

## ADDED Requirements

### Requirement: Texte résultant toujours visible
The system SHALL keep the resulting text on screen while the page scrolls: once its band would leave the top of the screen, it SHALL stay pinned at the top in a compact form showing at most four lines (three below 768 px), the rest scrolling inside the band, with the copy button still reachable.

#### Scenario: Régler la grille
- **GIVEN** un texte de 44 mots mis en pistes sur un écran de 1280 × 900
- **WHEN** l'utilisateur fait défiler la page jusqu'à la grille
- **THEN** la bande du texte résultant reste en haut de l'écran, montre quatre lignes au plus et se met à jour quand un pas est bouché

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page défile
- **THEN** la bande collée montre trois lignes au plus et la page ne défile pas à l'horizontale

### Requirement: Ordre de la page
The system SHALL present, from top to bottom: the resulting text, the source text, the filter chain, the step grid with its track strips, then the inspector.

#### Scenario: Lecture au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur la parcourt avec la touche Tab
- **THEN** il atteint la copie du texte, puis la saisie, puis les filtres, puis les pistes et leurs pas, puis l'inspecteur

# Spec Delta

## MODIFIED Requirements

### Requirement: Texte résultant toujours visible
The system SHALL keep the resulting text on screen while the page scrolls: once its band would leave the top of the screen, it SHALL stay pinned at the top in a compact form showing at most four lines (three below 768 px), the rest scrolling inside the band, with the copy button still reachable on screens 768 px wide or more. While not pinned, the band SHALL take the height of its text and SHALL NOT scroll on its own.

#### Scenario: Régler la grille
- **GIVEN** un texte de 44 mots mis en pistes sur un écran de 1280 × 900
- **WHEN** l'utilisateur fait défiler la page jusqu'à la grille
- **THEN** la bande du texte résultant reste en haut de l'écran, montre quatre lignes au plus et se met à jour quand un pas est bouché

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page défile
- **THEN** la bande collée montre trois lignes au plus et la page ne défile pas à l'horizontale

#### Scenario: Poème long en haut de page
- **GIVEN** un poème de 30 vers mis en pistes, la page en haut
- **WHEN** l'utilisateur fait tourner la molette au-dessus de la bande
- **THEN** c'est la page qui défile, pas la bande

## ADDED Requirements

### Requirement: Texte d'un seul vers sous une mise en page par vers
The system SHALL add to the status sentence « Le texte n'a qu'un vers : collez un poème, ou mettez-le d'abord en vers. » when a Bord instance acts on a text of a single line and no step before it has put the text into lines.

#### Scenario: Haï-kaïsation sur de la prose
- **GIVEN** l'extrait de Proust, d'un seul paragraphe
- **WHEN** on branche Haï-kaïsation
- **THEN** la phrase d'état dit « Haï-kaïsation : 117 mots retirés. Le texte n'a qu'un vers : collez un poème, ou mettez-le d'abord en vers. »

#### Scenario: Après une mise en vers
- **GIVEN** le même extrait, une mise en vers tous les 8 mots puis un Bord
- **WHEN** la phrase d'état s'affiche
- **THEN** elle ne parle pas d'un seul vers

# Spec Delta

## ADDED Requirements

### Requirement: Message d'erreur conforme
The system SHALL render every error message with a 1 px rule in the error colour above it, a short lead in the error colour and in bold, then the detail in ink, followed by its retry control when one applies, inside the area the error concerns. This applies to the model, the dictionary, the verbs, the phonetic textbank and the notebook.

#### Scenario: Échec du modèle
- **GIVEN** un chargement du modèle qui échoue
- **WHEN** l'erreur s'affiche
- **THEN** un filet rouge la précède, sa tête est en rouge et en gras, son détail est à l'encre, et le bouton « Relancer » suit

#### Scenario: Thème sombre
- **GIVEN** le thème sombre
- **WHEN** une erreur s'affiche
- **THEN** le filet et la tête prennent la couleur d'erreur du thème sombre, et le détail l'encre du thème sombre

### Requirement: Tailles en jetons
The system SHALL take every font size and spacing of the tracks page from the design tokens, with no size written directly, and SHALL keep every spacing a multiple of 4 px. The token scale SHALL include a value size of 11 px, a grid-word size of 14 px, and the narrow-screen sizes used below 768 px: 19 px for reading and 34 px for the brand mark; DESIGN.md SHALL state the same scale and threshold.

#### Scenario: Aucune taille en dur
- **GIVEN** la feuille de style de la page des pistes
- **WHEN** on y cherche une taille de police écrite en pixels hors des jetons
- **THEN** on n'en trouve aucune

#### Scenario: Aspect de la grille inchangé
- **GIVEN** la grille de pas à 1440 px avant et après le passage aux jetons
- **WHEN** on compare les numéros de pas et les mots de la grille
- **THEN** ils ont la même taille ; seul le verrou passe de 9 à 11 px

#### Scenario: Touches sur la grille de 4 px
- **GIVEN** une touche de la façade
- **WHEN** on mesure son rembourrage
- **THEN** il vaut 4 px en hauteur et 8 px en largeur

### Requirement: Cibles tactiles sur petit écran
The system SHALL give every key and every step at least 44 px of height on screens narrower than 768 px, and steps at least 44 px of width, without horizontal scrolling of the page at 375 px.

#### Scenario: Téléphone
- **GIVEN** la page des pistes à 375 px de large avec un texte en pistes
- **WHEN** on mesure les touches et les pas
- **THEN** chacun fait au moins 44 px de haut, chaque pas au moins 44 px de large, et la page ne défile pas horizontalement

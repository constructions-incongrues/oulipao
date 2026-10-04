# systeme-de-design Specification

## Purpose
Rendre observable le système de design « l'instrument perforé » : des polices servies par le projet, des couleurs de pistes lisibles et distinguables, et un seul mouvement signé qui s'efface quand on demande moins d'animations.

## Requirements

### Requirement: Polices servies par le projet
The system SHALL load every font from the project's own files, with their licences beside them, and SHALL send no request to a font server.

#### Scenario: Onglet réseau
- **GIVEN** la page des pistes ouverte avec l'onglet réseau
- **WHEN** elle a fini de charger
- **THEN** toutes les polices viennent du site d'Oulipao et aucune requête ne part vers un serveur de polices

### Requirement: Contrastes vérifiés
The system SHALL keep a contrast of at least 4.5:1 (WCAG 2.2) between the ink, the secondary ink, each track colour and the error colour on one side, and both the panel and the paper backgrounds on the other, in the light and the dark theme; a project command SHALL check it and fail otherwise.

#### Scenario: Palette changée
- **GIVEN** une couleur de piste dont le contraste sur la façade tombe sous 4,5:1
- **WHEN** la vérification de la palette est lancée
- **THEN** elle échoue en nommant la couleur, le fond et le contraste mesuré

### Requirement: Pistes distinguables en daltonisme
The system SHALL keep the five track colours apart under simulated deuteranopia, protanopia and tritanopia (Machado 2009 matrices), with a CIELAB ΔE of at least 20 between the two closest tracks in each theme; the same project command SHALL check it.

#### Scenario: Deux pistes trop proches
- **GIVEN** deux couleurs de piste dont l'écart simulé en deutéranopie tombe à 12
- **WHEN** la vérification de la palette est lancée
- **THEN** elle échoue en nommant les deux pistes, la simulation et l'écart

### Requirement: La couleur jamais seule
The system SHALL convey a track by its shape and its name wherever it conveys it by colour.

#### Scenario: Impression en noir et blanc
- **GIVEN** la page imprimée en niveaux de gris
- **WHEN** on lit la grille
- **THEN** chaque piste se reconnaît à la forme de ses pas et à son nom

### Requirement: Thème clair et sombre
The system SHALL follow the system's light or dark preference and SHALL let the user force either theme from the page.

#### Scenario: Forcer le sombre
- **GIVEN** un système réglé en clair
- **WHEN** l'utilisateur choisit le thème sombre
- **THEN** la page passe en sombre sans recharger

### Requirement: Le moment signé
The system SHALL, when the resulting text changes, sweep a read head across the grid and briefly highlight the replaced words, for no more than 300 ms, and SHALL show no motion at all when the system asks for reduced motion.

#### Scenario: Réduction des animations
- **GIVEN** un système qui demande de réduire les animations
- **WHEN** le décalage change
- **THEN** le texte et la grille se mettent à jour sans tête de lecture ni éclat

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
The system SHALL take every font size of the tracks page from the design tokens, with no font size written directly, and SHALL take the padding of every key from the spacing tokens, a multiple of 4 px. The token scale SHALL include a value size of 11 px, a grid-word size of 14 px, and the narrow-screen sizes used below 768 px: 19 px for reading and 34 px for the brand mark; DESIGN.md SHALL state the same scale and threshold.

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

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

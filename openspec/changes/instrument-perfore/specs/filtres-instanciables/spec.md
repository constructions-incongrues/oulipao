# Spec Delta

## MODIFIED Requirements

### Requirement: Chaîne réordonnable
The system SHALL apply the instances in series in the displayed order, number them from 1 in that order, and let the user move an instance either by dragging its grip onto another position, a mark showing where it will land, or with move-up and move-down buttons usable by keyboard and touch; the result SHALL update without re-tagging.

#### Scenario: Monter une instance
- **GIVEN** un S+7 puis un lipogramme
- **WHEN** on monte le lipogramme avec son bouton ↑
- **THEN** le lipogramme porte le numéro 1 et le texte résultant suit le nouvel ordre

#### Scenario: Glisser une instance
- **GIVEN** trois filtres
- **WHEN** l'utilisateur glisse la poignée du troisième au-dessus du premier
- **THEN** un trait marque la place pendant le geste, puis le troisième devient le premier

#### Scenario: Bords de la chaîne
- **GIVEN** une chaîne de deux filtres
- **WHEN** elle s'affiche
- **THEN** le bouton ↑ du premier et le bouton ↓ du second sont désactivés

### Requirement: Portée d'un filtre
The system SHALL let a filter touch only the words of its target tracks whose steps are open, except for the re-agreement caused by a replaced noun, and SHALL use for a word the value locked for that instance and that word when there is one.

#### Scenario: S+n sur les noms seuls
- **GIVEN** un S+n visant les seuls noms
- **WHEN** il s'applique
- **THEN** les adjectifs ne changent que pour s'accorder au nouveau nom

#### Scenario: Pas bouché
- **GIVEN** un S+7 sur les noms et le pas de « horloge » bouché
- **WHEN** il s'applique
- **THEN** « horloge » et son groupe nominal restent tels quels

## ADDED Requirements

### Requirement: Lignes de la chaîne
The system SHALL show the chain above the step grid, one line per instance, all lines of the same width with the grip, number, name, settings, target tracks, on/off button and move, duplicate and remove buttons in aligned columns, followed by a line to add an instance of an installed type.

#### Scenario: Deux filtres
- **GIVEN** un S+7 et un lipogramme
- **WHEN** la chaîne s'affiche sur un écran de 1280 px
- **THEN** les deux lignes ont la même largeur et leurs pistes visées commencent à la même abscisse

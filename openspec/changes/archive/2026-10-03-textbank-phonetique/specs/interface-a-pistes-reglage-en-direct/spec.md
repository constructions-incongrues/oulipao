# Spec Delta

## ADDED Requirements

### Requirement: Syllabes par vers
The system SHALL show, next to each line of the result text, its syllable count, counted from the pronunciations of the textbank and including a final mute e before a consonant inside the line, once the textbank is loaded; the count SHALL be hidden when the chain has no phonetic filter.

#### Scenario: Alexandrin
- **GIVEN** une chaîne avec un filtre phonétique et le vers « Je fais souvent ce rêve étrange et pénétrant »
- **WHEN** le texte résultant s'affiche
- **THEN** ce vers porte le compte 12

#### Scenario: Sans filtre phonétique
- **GIVEN** une chaîne sans filtre phonétique
- **WHEN** le texte résultant s'affiche
- **THEN** aucun compte de syllabes n'apparaît

## MODIFIED Requirements

### Requirement: États d'attente et d'échec
The system SHALL say so while the tagging model, the dictionary or the phonetic textbank are loading, SHALL say so when loading fails, and SHALL remain usable for a new attempt.

#### Scenario: Chargement en cours
- **GIVEN** un premier étiquetage
- **WHEN** le modèle se charge
- **THEN** la page indique l'attente

#### Scenario: Échec du chargement
- **GIVEN** un chargement qui échoue
- **WHEN** l'erreur survient
- **THEN** la page l'indique et permet de relancer

#### Scenario: Échec de la textbank phonétique
- **GIVEN** une chaîne avec un R+n dont la textbank ne se charge pas
- **WHEN** l'erreur survient
- **THEN** la page l'indique, les autres filtres continuent de s'appliquer, et un bouton permet de relancer

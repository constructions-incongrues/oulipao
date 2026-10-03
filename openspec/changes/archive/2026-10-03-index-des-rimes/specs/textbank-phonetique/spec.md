## ADDED Requirements

### Requirement: Une prononciation pour chaque forme candidate
The derived phonetics file SHALL hold, for every form that a rhyme filter may pick in a category (the forms of the morphology and verb files), the pronunciation that the filters use for it: GLÀFF's for that category, else GLÀFF's for another category, else one guessed by rules. Each row SHALL state which of these three sources it comes from, and a guessed pronunciation SHALL keep the reason « prononciation devinée ».

#### Scenario: Forme absente de GLÀFF
- **GIVEN** une forme de nom connue de Grammalecte et absente de GLÀFF
- **WHEN** on dérive le fichier des prononciations
- **THEN** le fichier porte pour elle une prononciation devinée, marquée comme telle, et l'inspecteur dit « prononciation devinée »

#### Scenario: Prononciation empruntée à une autre catégorie
- **GIVEN** une forme dont GLÀFF ne donne la prononciation que comme verbe
- **WHEN** on dérive le fichier pour ses lectures de nom
- **THEN** le fichier porte pour le nom la prononciation du verbe, marquée comme empruntée

### Requirement: Les formes d'une rime
The phonetics textbank SHALL give, for a rhyme and a category, every candidate form of that category whose pronunciation has that rhyme, without scanning the dictionary. Homophones SHALL keep being found only among GLÀFF pronunciations of the category.

#### Scenario: Formes en /ɛz/
- **GIVEN** la textbank chargée
- **WHEN** on demande les noms dont la rime est /ɛz/
- **THEN** on obtient notamment « chaise », sans parcourir la liste des noms

#### Scenario: Homophones inchangés
- **GIVEN** une forme dont la prononciation est devinée
- **WHEN** on cherche les homophones d'un nom qui se prononce comme elle
- **THEN** elle n'en fait pas partie, comme avant l'index

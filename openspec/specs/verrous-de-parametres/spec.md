# verrous-de-parametres Specification

## Purpose
Donner à un mot sa propre valeur d'un paramètre entier d'un filtre, comme un verrou de paramètre sur un pas de séquenceur : un S+3 sur ce seul mot au milieu d'un S+7.

## Requirements

### Requirement: Poser un verrou
The system SHALL let the user, from the inspector open on a word, set for each enabled instance that targets the word's track a value of its own for each lockable integer parameter of that instance, within the parameter's bounds; the instance SHALL then use that value for that word only, and the result SHALL update without tagging the text again. A parameter SHALL be lockable only when its constraint reads per-word values; the system SHALL offer no lock field for any other parameter and SHALL refuse a lock on it.

#### Scenario: S+3 sur un mot
- **GIVEN** un S+7 sur les noms et l'inspecteur ouvert sur « chat »
- **WHEN** l'utilisateur verrouille le décalage de ce S+7 à 3 pour « chat »
- **THEN** « chat » est remplacé par le troisième nom qui le suit et les autres noms restent en S+7

#### Scenario: Hors bornes
- **GIVEN** un paramètre borné de 0 à 99
- **WHEN** l'utilisateur saisit 120 comme verrou
- **THEN** le verrou est refusé, un message le dit près du champ et la valeur précédente reste

#### Scenario: Paramètre non verrouillable
- **GIVEN** un Bord et une Mise en vers en marche, et l'inspecteur ouvert sur « chat »
- **WHEN** l'inspecteur s'affiche
- **THEN** il ne propose aucun champ de verrou pour Bord ni pour Mise en vers

### Requirement: Verrou par instance
The system SHALL keep a lock attached to one instance and one original word: another instance of the same type SHALL keep its own value for that word, a duplicated instance SHALL carry the locks of its original, and a removed instance SHALL take its locks with it.

#### Scenario: Deux S+n
- **GIVEN** deux S+7 sur les noms et un verrou à 3 sur le premier pour « chat »
- **WHEN** le texte résultant s'affiche
- **THEN** le premier S+n traite « chat » en S+3 et le second en S+7

### Requirement: Retirer un verrou
The system SHALL remove a lock when its field is emptied, the word then following the instance's value again.

#### Scenario: Champ vidé
- **GIVEN** un verrou à 3 sur « chat »
- **WHEN** l'utilisateur vide le champ du verrou
- **THEN** « chat » suit de nouveau le décalage de l'instance

### Requirement: Verrou visible
The system SHALL mark a locked step in the grid with its locked value and SHALL name the lock in the inspector band of its instance and in the step's accessible name.

#### Scenario: Pas verrouillé
- **GIVEN** un verrou à 3 sur « chat »
- **WHEN** la grille s'affiche
- **THEN** le pas de « chat » porte « 3 » et son nom accessible mentionne le verrou

### Requirement: Durée d'un verrou
The system SHALL keep locks while settings change, filters move or tracks are muted, and SHALL drop them all when the text is tagged again.

#### Scenario: Nouveau texte
- **GIVEN** des verrous posés
- **WHEN** un autre texte est mis en pistes
- **THEN** aucun verrou ne subsiste

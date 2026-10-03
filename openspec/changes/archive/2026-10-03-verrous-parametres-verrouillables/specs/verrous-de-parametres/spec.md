## MODIFIED Requirements

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

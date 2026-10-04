# Spec Delta

## MODIFIED Requirements

### Requirement: Fenêtre autour du mot
The system SHALL show in each band the words of the step page of the chosen word, each original word in the column it has in the step grid, from one band to the next; the chosen word's column SHALL be highlighted, and a word removed by a filter SHALL show as « · ». The page SHALL not scroll horizontally.

#### Scenario: Mot retiré
- **GIVEN** un lipogramme en e qui retire « je »
- **WHEN** un mot de la même page de pas que « je » est choisi
- **THEN** la bande du lipogramme montre « · » dans la colonne de « je »

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large, donc quatre pas par page
- **WHEN** l'inspecteur est ouvert
- **THEN** chaque bande montre les quatre mots de la page, sous les colonnes de la grille, et la page ne défile pas à l'horizontale

### Requirement: Verrous dans l'inspecteur
The system SHALL show, in the band of each enabled instance that targets the chosen word's track, a field per integer parameter holding the value locked for that word; when none is locked, the empty field SHALL show the instance's value in secondary ink, or « — » when that parameter is modulated. The system SHALL show the step's state (open or closed).

#### Scenario: Mot verrouillé
- **GIVEN** un verrou à 3 sur « chat » pour le premier S+7
- **WHEN** l'inspecteur s'ouvre sur « chat »
- **THEN** la bande de ce S+7 montre un champ Décalage qui vaut 3 et sa légende dit « S+3 sur ce mot »

#### Scenario: Mot sans verrou
- **GIVEN** un S+7 réglé à 7, sans verrou sur « heure »
- **WHEN** l'inspecteur s'ouvre sur « heure »
- **THEN** le champ Décalage est vide et montre « 7 » en encre secondaire

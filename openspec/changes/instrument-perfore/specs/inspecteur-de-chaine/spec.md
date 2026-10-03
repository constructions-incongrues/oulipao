# Spec Delta

## MODIFIED Requirements

### Requirement: Ouverture à la demande
The system SHALL keep the inspector closed until a word is chosen, show in its place a hint inviting to click a word, and open the inspector below the step grid when a word of the resulting text is clicked, when a word of the grid header is chosen, or when Enter is pressed on a focused word.

#### Scenario: Aucun mot choisi
- **GIVEN** un texte mis en pistes
- **WHEN** la page s'affiche
- **THEN** l'inspecteur est fermé et la phrase « Cliquez un mot pour voir ce que chaque filtre en a fait. » est visible

#### Scenario: Clic sur un mot
- **GIVEN** le texte résultant affiché
- **WHEN** l'utilisateur clique le mot « cuistrerie »
- **THEN** l'inspecteur s'ouvre sous la grille, centré sur ce mot

#### Scenario: Depuis la grille
- **GIVEN** la grille affichée
- **WHEN** l'utilisateur choisit « cuisine » dans son en-tête
- **THEN** l'inspecteur s'ouvre sous la grille, centré sur ce mot

### Requirement: Navigation au clavier
The system SHALL handle the inspector's keys wherever the focus is, except while typing in a text or number field: the left and right arrow keys SHALL open the inspector on the first word of the displayed grid page when it is closed, and SHALL otherwise move the choice to the previous or next original word, including words absent from the resulting text; Escape SHALL close the inspector.

#### Scenario: Mot suivant
- **GIVEN** l'inspecteur ouvert sur « cuisine »
- **WHEN** l'utilisateur appuie sur flèche droite
- **THEN** l'inspecteur se centre sur le mot d'origine suivant, « étroite »

#### Scenario: Fermeture
- **GIVEN** l'inspecteur ouvert
- **WHEN** l'utilisateur appuie sur Échap
- **THEN** l'inspecteur se ferme et la phrase d'invitation revient

#### Scenario: Focus ailleurs
- **GIVEN** l'inspecteur ouvert et le focus sur une touche de la chaîne
- **WHEN** l'utilisateur appuie sur flèche droite
- **THEN** l'inspecteur passe au mot suivant

#### Scenario: Inspecteur fermé
- **GIVEN** la grille sur sa page 3 et l'inspecteur fermé
- **WHEN** l'utilisateur appuie sur flèche droite
- **THEN** l'inspecteur s'ouvre sur le premier mot de la page 3

#### Scenario: Dans un champ
- **GIVEN** le focus dans le champ de décalage
- **WHEN** l'utilisateur appuie sur flèche gauche
- **THEN** la flèche agit dans le champ et l'inspecteur ne bouge pas

## ADDED Requirements

### Requirement: Verrous dans l'inspecteur
The system SHALL show, in the band of each enabled instance that targets the chosen word's track, a field per integer parameter holding the value locked for that word, empty when none, and SHALL show the step's state (open or closed).

#### Scenario: Mot verrouillé
- **GIVEN** un verrou à 3 sur « chat » pour le premier S+7
- **WHEN** l'inspecteur s'ouvre sur « chat »
- **THEN** la bande de ce S+7 montre un champ Décalage qui vaut 3 et sa légende dit « S+3 sur ce mot »

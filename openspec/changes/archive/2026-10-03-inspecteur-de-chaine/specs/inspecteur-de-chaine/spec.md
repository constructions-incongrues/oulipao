# Spec Delta

## Purpose

Choisir un mot du texte résultant et voir, étape par étape, ce que la chaîne de filtres en a fait, pour savoir quel filtre régler.

## ADDED Requirements

### Requirement: Ouverture à la demande
The system SHALL keep the inspector closed until a word is chosen, show under the resulting text a hint inviting to click a word, and open the inspector under the resulting text when a word of the resulting text is clicked or when Enter is pressed on a focused word.

#### Scenario: Aucun mot choisi
- **GIVEN** un texte mis en pistes
- **WHEN** la page s'affiche
- **THEN** l'inspecteur est fermé et la phrase « Cliquez un mot pour voir ce que chaque filtre en a fait. » est visible

#### Scenario: Clic sur un mot
- **GIVEN** le texte résultant affiché
- **WHEN** l'utilisateur clique le mot « cuistrerie »
- **THEN** l'inspecteur s'ouvre sous le texte résultant, centré sur ce mot

### Requirement: Une bande par étape
The system SHALL show in the inspector one band labelled « Origine » carrying the original text, then one band per active filter in chain order, labelled like the summary (for example « S+7 sur les noms »), each carrying the text as that filter left it.

#### Scenario: Trois filtres
- **GIVEN** la chaîne S+2 sur les adjectifs, S+7 sur les noms, lipogramme en e sur les noms, tous actifs
- **WHEN** le mot d'origine « cuisine » est choisi
- **THEN** l'inspecteur montre quatre bandes, « Origine », « S+2 sur les adjectifs », « S+7 sur les noms », « lipogramme en e sur les noms », et le mot y vaut successivement « cuisine », « cuisine », « cuistrerie », puis ce qu'en a fait le lipogramme

#### Scenario: Filtre coupé
- **GIVEN** une chaîne de deux filtres dont le second est coupé
- **WHEN** un mot est choisi
- **THEN** l'inspecteur montre deux bandes, « Origine » et le premier filtre

### Requirement: Fenêtre autour du mot
The system SHALL show in each band the chosen word and its neighbours, six on each side on a wide screen and two on each side below 768 px, each original word staying in the same column from one band to the next; the chosen word's column SHALL be highlighted, and a word removed by a filter SHALL show as « · ». The page SHALL not scroll horizontally.

#### Scenario: Mot retiré
- **GIVEN** un lipogramme en e qui retire « je »
- **WHEN** un mot voisin de « je » est choisi
- **THEN** la bande du lipogramme montre « · » dans la colonne de « je »

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** l'inspecteur est ouvert
- **THEN** chaque bande montre cinq mots et la page ne défile pas à l'horizontale

### Requirement: Navigation au clavier
The system SHALL move the choice to the previous or next original word with the left and right arrow keys while the inspector has focus, including words absent from the resulting text, and SHALL close the inspector with Escape.

#### Scenario: Mot suivant
- **GIVEN** l'inspecteur ouvert sur « cuisine »
- **WHEN** l'utilisateur appuie sur flèche droite
- **THEN** l'inspecteur se centre sur le mot d'origine suivant, « étroite »

#### Scenario: Fermeture
- **GIVEN** l'inspecteur ouvert
- **WHEN** l'utilisateur appuie sur Échap
- **THEN** l'inspecteur se ferme et la phrase d'invitation revient

### Requirement: Le choix suit les gestes
The system SHALL keep the inspector on the same original word and update its bands when a setting changes, a filter is added, removed, moved, enabled or disabled, or a track is muted or soloed, without tagging the text again; the inspector SHALL close when the text is tagged again.

#### Scenario: Déplacer un filtre
- **GIVEN** l'inspecteur ouvert sur un mot et trois filtres
- **WHEN** le troisième filtre monte en tête
- **THEN** l'inspecteur reste sur le même mot et ses bandes suivent le nouvel ordre

### Requirement: Mots changés dans le texte résultant
The system SHALL underline each changed word of the resulting text in the colour of its track and SHALL name the track and the original word in its tooltip, so that the category is never conveyed by colour alone.

#### Scenario: Nom remplacé
- **GIVEN** « cuisine » remplacé par « cuistrerie »
- **WHEN** le texte résultant s'affiche
- **THEN** « cuistrerie » est souligné de la couleur des noms et son infobulle dit « Noms : cuisine → cuistrerie »

### Requirement: Inspecteur lisible par un lecteur d'écran
The system SHALL present the inspector as a table with one row per step whose row header names the step, and SHALL announce the chosen word.

#### Scenario: Lecteur d'écran
- **GIVEN** l'inspecteur ouvert sur « cuisine »
- **WHEN** un lecteur d'écran le parcourt
- **THEN** il lit, ligne par ligne, le nom de l'étape puis les mots de la fenêtre

### Requirement: Mise à jour rapide
The system SHALL update the resulting text and the open inspector in less than half a second for a 200-word text and five filters.

#### Scenario: Cinq filtres
- **GIVEN** le texte 1 de référence, cinq filtres et l'inspecteur ouvert
- **WHEN** un décalage change
- **THEN** le texte et l'inspecteur sont à jour en moins d'une demi-seconde

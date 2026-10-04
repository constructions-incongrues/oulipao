# inspecteur-de-chaine Specification

## Purpose
Choisir un mot du texte résultant et voir, étape par étape, ce que la chaîne de filtres en a fait, pour savoir quel filtre régler.

## Requirements

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
The system SHALL show in each band the words of the step page of the chosen word, each original word in the column it has in the step grid, from one band to the next; the chosen word's column SHALL be highlighted, and a word removed by a filter SHALL show as « · ». The page SHALL not scroll horizontally.

#### Scenario: Mot retiré
- **GIVEN** un lipogramme en e qui retire « je »
- **WHEN** un mot de la même page de pas que « je » est choisi
- **THEN** la bande du lipogramme montre « · » dans la colonne de « je »

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large, donc quatre pas par page
- **WHEN** l'inspecteur est ouvert
- **THEN** chaque bande montre les quatre mots de la page, sous les colonnes de la grille, et la page ne défile pas à l'horizontale

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

### Requirement: Mot remis en ligne
The system SHALL show, in the band of a step that put a word on a new line, a « ↵ » mark before that word, and SHALL announce it to screen readers as « à la ligne ».

#### Scenario: Mise en vers
- **GIVEN** une Mise en vers « tous les n mots », n = 3
- **WHEN** l'inspecteur est ouvert sur le quatrième mot
- **THEN** la bande de la Mise en vers montre « ↵ » devant ce mot, et la bande « Origine » ne le montre pas

### Requirement: Prononciation dans l'inspecteur
The system SHALL show, for the word opened in the inspector, its pronunciation in IPA, its syllable count, its rhyme and the gender of that rhyme, once the phonetic textbank is loaded, and SHALL say when the pronunciation was guessed by rules. When the opened word ends a line under a rhyme-scheme constraint, the inspector SHALL also show the letter of its line in the scheme.

#### Scenario: Mot connu
- **GIVEN** une chaîne avec un R+n et la textbank chargée
- **WHEN** on ouvre « chaise » dans l'inspecteur
- **THEN** l'inspecteur montre /ʃɛz/, 1 syllabe, la rime /ɛz/ et le genre « féminine »

#### Scenario: Mot deviné
- **GIVEN** un mot absent du lexique
- **WHEN** on l'ouvre dans l'inspecteur
- **THEN** sa prononciation porte la mention « devinée »

#### Scenario: Lettre du schéma
- **GIVEN** un quatrain sous un schéma « embrassées »
- **WHEN** on ouvre la fin du vers 4 dans l'inspecteur
- **THEN** l'inspecteur montre la lettre « A »

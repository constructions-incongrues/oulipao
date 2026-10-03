# Spec Delta

## Purpose

Montrer le texte comme la grille d'un séquenceur : un pas par mot, une ligne par piste, et décider mot par mot si les filtres agissent, en perçant ou en bouchant le pas.

## ADDED Requirements

### Requirement: Un pas par mot
The system SHALL show, for a tagged text, a grid with one column per original word, in text order, and one row per track; each column SHALL carry its step number and the original word, and the cell of the word's own track SHALL hold its step, the other cells of the column staying empty.

#### Scenario: Colonne d'un nom
- **GIVEN** le texte « Le matin où la vieille horloge » mis en pistes
- **WHEN** la grille s'affiche
- **THEN** la colonne 2 porte « 2 » et « matin », et seul son pas sur la ligne des noms est présent

#### Scenario: Ponctuation
- **GIVEN** un texte qui contient une virgule
- **WHEN** la grille s'affiche
- **THEN** la virgule n'a pas de colonne

### Requirement: Temps forts
The system SHALL emphasise the step number of every fourth step, starting with step 1.

#### Scenario: Pas 5
- **GIVEN** une grille de seize pas
- **WHEN** elle s'affiche
- **THEN** les numéros 1, 5, 9 et 13 sont plus marqués que les autres

### Requirement: Pages de pas
The system SHALL show sixteen steps per page when the grid is at least 1024 px wide, eight from 640 px, and four below, SHALL let the user move from page to page, SHALL keep in view the step that was first on screen when the width changes, and SHALL show the page of the word chosen in the inspector, including when the choice moves with the arrow keys.

#### Scenario: Écran large
- **GIVEN** un texte de 44 mots et une grille de 1200 px
- **WHEN** la grille s'affiche
- **THEN** elle montre les pas 1 à 16 et propose les pages 17–32 et 33–44

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px
- **WHEN** la grille s'affiche
- **THEN** elle montre quatre pas, offre une page précédente et une page suivante, et la page ne défile pas à l'horizontale

#### Scenario: La page suit le mot choisi
- **GIVEN** quatre pas par page et l'inspecteur ouvert sur le pas 4
- **WHEN** l'utilisateur passe au mot suivant avec la flèche droite
- **THEN** la grille montre la page des pas 5 à 8

### Requirement: Pas percé ou bouché
The system SHALL show a step as punched (filled shape of its track) when at least one enabled filter that acts targets its track and the step is not closed, and as an outline otherwise; clicking a step or pressing Enter or Space on it SHALL close it, so that no filter changes that word, and doing it again SHALL open it; the result SHALL update without tagging the text again.

#### Scenario: Boucher un nom
- **GIVEN** un S+7 sur les noms qui remplace « horloge »
- **WHEN** l'utilisateur clique le pas de « horloge »
- **THEN** le pas montre un contour, « horloge » reste tel quel dans le texte résultant et les autres noms restent remplacés

#### Scenario: Le rouvrir
- **GIVEN** le pas de « horloge » bouché
- **WHEN** l'utilisateur le clique de nouveau
- **THEN** le pas est percé et « horloge » est de nouveau remplacé

#### Scenario: Aucun filtre sur la piste
- **GIVEN** aucun filtre actif ne vise les verbes
- **WHEN** la grille s'affiche
- **THEN** les pas des verbes montrent un contour

### Requirement: Un pas bouché vaut pour toute la chaîne
The system SHALL keep a closed step closed for every filter of the chain, including filters added later, until the user opens it or the text is tagged again.

#### Scenario: Filtre ajouté
- **GIVEN** le pas de « horloge » bouché
- **WHEN** l'utilisateur ajoute un lipogramme en e sur les noms
- **THEN** « horloge » reste tel quel

#### Scenario: Nouveau texte
- **GIVEN** des pas bouchés
- **WHEN** un autre texte est mis en pistes
- **THEN** tous les pas sont ouverts

### Requirement: Un poinçon par piste
The system SHALL give each track a shape of its own (round for nouns, square for verbs, horizontal slot for adjectives, triangle for adverbs, cross for others), SHALL use it for the steps and on the track strip, and SHALL name the track, the word and the step state in the accessible name of each step.

#### Scenario: Lecteur d'écran
- **GIVEN** le pas percé de « matin »
- **WHEN** un lecteur d'écran l'atteint
- **THEN** il lit « Noms, matin : percé, le filtre agit »

### Requirement: De la grille à l'inspecteur
The system SHALL open the inspector on a word when the word is chosen in the grid header, and SHALL highlight that column while the inspector is open on it.

#### Scenario: Mot de l'en-tête
- **GIVEN** la grille affichée
- **WHEN** l'utilisateur clique « horloge » dans l'en-tête
- **THEN** l'inspecteur s'ouvre sur « horloge » et la colonne de « horloge » est mise en évidence

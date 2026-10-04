# Spec Delta

## MODIFIED Requirements

### Requirement: Raccourci de l'écoute signalé
The system SHALL declare the space-bar shortcut of the play control to assistive technology and SHALL print « Espace » as a keyboard key beside that control on screens 768 px wide or more. When no French voice is available, the space bar SHALL keep its ordinary effect, including activating the focused button.

#### Scenario: Raccourci déclaré
- **GIVEN** un texte mis en pistes
- **WHEN** un lecteur d'écran atteint la touche d'écoute
- **THEN** il annonce le raccourci de la barre d'espace

#### Scenario: Étiquette sur petit écran
- **GIVEN** la page à 375 px de large
- **WHEN** la console d'écoute s'affiche
- **THEN** la touche « Espace » n'apparaît pas

#### Scenario: Sans voix française
- **GIVEN** aucune voix française installée et le focus sur la touche « Muet » de la piste des noms
- **WHEN** l'utilisateur appuie sur la barre d'espace
- **THEN** la piste des noms devient muette

## ADDED Requirements

### Requirement: Écoute dans l'en-tête de la grille
The system SHALL place the listening controls (play, tempo, voice) in the header of the step grid, between its title and its page keys.

#### Scenario: Texte mis en pistes
- **GIVEN** un texte mis en pistes
- **WHEN** la grille s'affiche
- **THEN** son en-tête montre, dans l'ordre, son titre, « Écouter », le tempo, la voix, puis les pages

### Requirement: Phrase d'état dans la chaîne
The system SHALL announce what the chain did to the text in a status sentence placed under the chain's title, and SHALL NOT show the chain's own empty message when that sentence already says there is no constraint.

#### Scenario: Une contrainte
- **GIVEN** un S+7 qui remplace 19 noms sur 20
- **WHEN** la chaîne s'affiche
- **THEN** sous « Contraintes », la phrase « S+7 sur les noms : 19 noms remplacés sur 20. » est lue par les lecteurs d'écran

#### Scenario: Aucune contrainte
- **GIVEN** un texte mis en pistes et une chaîne vide
- **WHEN** la chaîne s'affiche
- **THEN** elle dit « Aucune contrainte : texte d'origine. » une seule fois

### Requirement: Bande collée réduite au texte au téléphone
Below 768 px, the system SHALL hide the header of the pinned result strip (its title, keys and form choice) and SHALL keep only its text; the header SHALL come back when the strip is no longer pinned.

#### Scenario: On descend
- **GIVEN** la page à 375 px de large et un texte mis en pistes
- **WHEN** l'utilisateur descend jusqu'à la grille
- **THEN** la bande collée ne montre que trois lignes de texte, sans touches

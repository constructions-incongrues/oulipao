# Spec Delta

## MODIFIED Requirements

### Requirement: États d'attente et d'échec
The system SHALL say so while the tagging model, the dictionary, the verbs or the phonetic textbank are loading, SHALL say so when loading fails, and SHALL remain usable for a new attempt. A load that receives no data for 30 seconds SHALL stop and SHALL be reported as stalled, naming what was loading, with a control to retry. Whatever the outcome of the latest attempt to put a text on tracks or to reopen a kept text, the « Mettre en pistes » control SHALL become available again once that attempt ends.

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

#### Scenario: Verbes ou prononciations en cours de chargement
- **GIVEN** une chaîne à laquelle on ajoute un R+n, ou une contrainte qui vise les verbes
- **WHEN** le fichier correspondant se charge
- **THEN** la page affiche « Chargement des prononciations… » ou « Chargement des verbes… » à l'endroit où s'afficherait son erreur, et retire ce message à l'arrivée du fichier

#### Scenario: Chargement calé
- **GIVEN** le chargement du modèle en cours
- **WHEN** aucune donnée n'arrive pendant 30 secondes
- **THEN** le chargement s'arrête, la page affiche « Le chargement du modèle ne progresse plus. » suivi de « Rien reçu depuis 30 secondes : la connexion est peut-être coupée. » et d'un bouton « Relancer »

#### Scenario: Réseau lent mais vivant
- **GIVEN** le chargement du modèle sur une connexion lente qui reçoit des données au moins toutes les 30 secondes
- **WHEN** le chargement dure plusieurs minutes
- **THEN** il n'est pas interrompu

#### Scenario: Réouverture pendant un chargement qui échoue
- **GIVEN** une mise en pistes lancée pendant le chargement du modèle, puis la réouverture d'un texte du carnet
- **WHEN** le chargement échoue
- **THEN** l'échec s'affiche avec « Relancer », et le bouton « Mettre en pistes » est de nouveau actif

## ADDED Requirements

### Requirement: Texte normalisé à l'entrée
The system SHALL normalise every source text to Unicode composed form (NFC) as soon as it enters — typed, pasted, or restored from the notebook — before tagging, so that a decomposed accent (a letter followed by a combining mark) is treated exactly like the precomposed letter.

#### Scenario: Accents décomposés
- **GIVEN** le texte « été » écrit avec un « e » suivi d'un accent aigu combinant, et le même texte écrit en caractères précomposés
- **WHEN** chacun est mis en pistes avec un S+7
- **THEN** les deux textes résultants sont identiques

### Requirement: Raccourci de l'écoute signalé
The system SHALL declare the space-bar shortcut of the play control to assistive technology and SHALL print « ESPACE » as a silk-screen label under that control on screens 768 px wide or more. When no French voice is available, the space bar SHALL keep its ordinary effect, including activating the focused button.

#### Scenario: Raccourci déclaré
- **GIVEN** un texte mis en pistes
- **WHEN** un lecteur d'écran atteint la touche d'écoute
- **THEN** il annonce le raccourci de la barre d'espace

#### Scenario: Étiquette sur petit écran
- **GIVEN** la page à 375 px de large
- **WHEN** la console d'écoute s'affiche
- **THEN** l'étiquette « ESPACE » n'apparaît pas

#### Scenario: Sans voix française
- **GIVEN** aucune voix française installée et le focus sur la touche « Muet » de la piste des noms
- **WHEN** l'utilisateur appuie sur la barre d'espace
- **THEN** la piste des noms devient muette

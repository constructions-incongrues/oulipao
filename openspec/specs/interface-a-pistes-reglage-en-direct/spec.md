# interface-a-pistes-reglage-en-direct Specification

## Purpose
Montrer un texte français comme une partition de pistes linguistiques sur laquelle on branche et on règle le S+7, le résultat se mettant à jour à chaque geste.

## Requirements

### Requirement: Tranche de réglage par piste
The system SHALL give each track a channel strip, at the head of its row in the step grid, showing the track's shape, its name, its word count, a mute button, a solo button and a reminder of the instances that target it; filters are set in the chain, not on the strip.

#### Scenario: Piste sans plugin
- **GIVEN** la piste des verbes et aucun filtre qui la vise
- **WHEN** sa tranche s'affiche
- **THEN** elle montre le carré des verbes, leur nom, leur nombre de mots, Muet et Seul, et aucun rappel de filtre

### Requirement: Plugin S+7 sur la piste des noms
The system SHALL open with an empty chain; a S+7 added to the chain targets the nouns track, enabled, with offset 7 and re-agreement mode.

#### Scenario: Ouverture
- **GIVEN** la page à pistes qui vient de s'ouvrir
- **WHEN** la chaîne s'affiche
- **THEN** elle ne porte aucune contrainte et le texte passe tel quel

#### Scenario: Ajout d'un S+7
- **GIVEN** la chaîne vide
- **WHEN** on ajoute un S+7
- **THEN** il vise les noms, actif, décalage 7, mode « réaccord »

### Requirement: Réglage en direct
The system SHALL update the resulting text when the offset changes, when the plugin is disabled or re-enabled, or when the mode changes, without tagging the text again.

#### Scenario: Changement de décalage
- **GIVEN** un texte étiqueté et le plugin actif
- **WHEN** le décalage passe de 7 à 3
- **THEN** le texte résultant change sans nouvel étiquetage

#### Scenario: Plugin coupé
- **GIVEN** un texte transformé
- **WHEN** le plugin est coupé
- **THEN** le texte résultant est le texte d'origine

### Requirement: Mute et solo
The system SHALL remove from the resulting text the words of a muted track, tightening the spacing and keeping punctuation, and SHALL keep only the words of soloed tracks when at least one track is soloed; the others track follows the same rule.

#### Scenario: Piste muette
- **GIVEN** le texte « la vieille horloge s'arrêta »
- **WHEN** la piste des adjectifs est rendue muette
- **THEN** le texte résultant est « la horloge s'arrêta »

#### Scenario: Piste en solo
- **GIVEN** un texte étiqueté
- **WHEN** la piste des verbes est mise en solo
- **THEN** le texte résultant ne contient que les verbes et la ponctuation

### Requirement: Copie du résultat
The system SHALL place the resulting text in the clipboard when the copy button is used.

#### Scenario: Copie
- **GIVEN** un texte résultant affiché
- **WHEN** le bouton de copie est actionné
- **THEN** le presse-papiers contient exactement ce texte

### Requirement: États d'attente et d'échec
The system SHALL say so while the tagging model and the dictionary are loading, SHALL say so when loading fails, and SHALL remain usable for a new attempt.

#### Scenario: Chargement en cours
- **GIVEN** un premier étiquetage
- **WHEN** le modèle se charge
- **THEN** la page indique l'attente

#### Scenario: Échec du chargement
- **GIVEN** un chargement qui échoue
- **WHEN** l'erreur survient
- **THEN** la page l'indique et permet de relancer

### Requirement: Accessibilité des réglages
The system SHALL make every control reachable by keyboard and SHALL never convey the category of a word by colour alone.

#### Scenario: Navigation au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur parcourt la page au clavier
- **THEN** chaque bouton, champ et sélecteur reçoit le focus et porte un libellé

### Requirement: Traitement dans le navigateur
The system SHALL process the text entirely in the browser, with no network request containing the text.

#### Scenario: Session observée dans l'onglet réseau
- **GIVEN** la page des pistes ouverte avec l'onglet réseau
- **WHEN** un texte est collé, étiqueté et transformé
- **THEN** aucune requête ne contient le texte

### Requirement: Texte résultant toujours visible
The system SHALL keep the resulting text on screen while the page scrolls: once its band would leave the top of the screen, it SHALL stay pinned at the top in a compact form showing at most four lines (three below 768 px), the rest scrolling inside the band, with the copy button still reachable.

#### Scenario: Régler la grille
- **GIVEN** un texte de 44 mots mis en pistes sur un écran de 1280 × 900
- **WHEN** l'utilisateur fait défiler la page jusqu'à la grille
- **THEN** la bande du texte résultant reste en haut de l'écran, montre quatre lignes au plus et se met à jour quand un pas est bouché

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page défile
- **THEN** la bande collée montre trois lignes au plus et la page ne défile pas à l'horizontale

### Requirement: Ordre de la page
The system SHALL present, from top to bottom: the resulting text, the source text, the filter chain, the step grid with its track strips, then the inspector.

#### Scenario: Lecture au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur la parcourt avec la touche Tab
- **THEN** il atteint la copie du texte, puis la saisie, puis les filtres, puis les pistes et leurs pas, puis l'inspecteur

# Interface à pistes avec réglage en direct

## Purpose
Montrer un texte français comme une partition de pistes linguistiques sur laquelle on branche et on règle le S+7, le résultat se mettant à jour à chaque geste.

## ADDED Requirements

### Requirement: Partition en systèmes
The system SHALL, once a pasted text is tagged, display a score that wraps with the text into systems, each system showing a ruler carrying one line of the original text and five tracks (nouns, verbs, adjectives, adverbs, others) where every word is a block aligned on its position in the ruler.

#### Scenario: Texte de 200 mots
- **GIVEN** un texte de 200 mots collé et étiqueté
- **WHEN** la partition s'affiche
- **THEN** chaque système montre cinq pistes et chaque mot a un bloc sur la piste de sa catégorie

### Requirement: Tranche de réglage par piste
The system SHALL give each track a channel strip showing the track name, its word count, a mute button, a solo button and a plugin slot.

#### Scenario: Piste sans plugin
- **GIVEN** la piste des verbes
- **WHEN** sa tranche s'affiche
- **THEN** elle montre son nom, son nombre de mots, mute, solo et un emplacement de plugin vide

### Requirement: Plugin S+7 sur la piste des noms
The system SHALL load the S+7 plugin in the plugin slot of the nouns track, enabled by default with offset 7 and re-agreement mode.

#### Scenario: Ouverture
- **GIVEN** un texte étiqueté
- **WHEN** la page affiche les tranches
- **THEN** la tranche des noms porte le S+7, actif, décalage 7, mode « réaccord »

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

### Requirement: Blocs des noms remplacés
The system SHALL show, on the blocks of the nouns track, the replacement word when the plugin is enabled.

#### Scenario: Plugin actif
- **GIVEN** le plugin actif
- **WHEN** la partition s'affiche
- **THEN** le bloc d'un nom remplacé porte le nouveau mot

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

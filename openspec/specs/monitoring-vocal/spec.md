# monitoring-vocal Specification

## Purpose
Entendre le texte résultant mot à mot, avec la voix française du système, pendant qu'on règle les pistes. Une tête de lecture parcourt la page visible de la grille et dit, à chaque pas, ce que la chaîne a mis à la place du mot.

## Requirements

### Requirement: Lancer et arrêter la lecture
The system SHALL offer a play/stop control in the console once a text has been put on tracks, stopped by default. The space bar SHALL toggle playback anywhere on the page except in a text field, select or editable area; when a button has the focus, the space bar SHALL toggle playback without activating that button. Playback SHALL never start without a user gesture.

#### Scenario: Lancer au bouton
- **GIVEN** un texte mis en pistes, lecture arrêtée
- **WHEN** l'utilisateur active le bouton de lecture
- **THEN** la tête part du premier pas de la page visible et la voix dit son mot

#### Scenario: Barre d'espace sur un bouton
- **GIVEN** le focus sur la touche « Muet » de la piste des noms, lecture arrêtée
- **WHEN** l'utilisateur appuie sur la barre d'espace
- **THEN** la lecture démarre et la piste des noms n'est pas rendue muette

#### Scenario: Barre d'espace dans un champ
- **GIVEN** le curseur dans le champ du texte source
- **WHEN** l'utilisateur appuie sur la barre d'espace
- **THEN** une espace est saisie et la lecture ne change pas d'état

### Requirement: Boucle sur la page visible
The system SHALL move the playhead through the steps of the visible grid page in order, one step at a time, and SHALL loop back to the first step of that page after the last one. When the visible page changes during playback, the playhead SHALL resume at the first step of the new page.

#### Scenario: Retour au premier pas
- **GIVEN** une page qui montre les pas 1 à 8, lecture en cours
- **WHEN** la tête a dit le pas 8
- **THEN** elle passe au pas 1

#### Scenario: Changement de page
- **GIVEN** la tête sur le pas 5 de la page 1 à 8
- **WHEN** l'utilisateur passe à la page 9 à 16
- **THEN** la tête dit ensuite le pas 9

### Requirement: Ce que dit un pas
The system SHALL compute what a step says when the playhead reaches it, from the current state: all the words the resulting text puts in place of the step's original word, in order. A closed step SHALL say its word as the resulting text shows it (no filter touches it). A step SHALL say nothing when its track is not audible (muted, or another track is solo) or when its word is removed from the resulting text. Words that a refrain copies elsewhere SHALL be said only at their original step. A silent step SHALL last as long as the gap between two steps. A change of setting during playback SHALL be heard from the next step on, without restarting the loop.

#### Scenario: Remplacement en plusieurs mots
- **GIVEN** un pas dont le mot est remplacé par « pomme de terre »
- **WHEN** la tête l'atteint
- **THEN** la voix dit « pomme », « de », « terre », puis la tête passe au pas suivant

#### Scenario: Piste en solo
- **GIVEN** la piste des adjectifs en solo, lecture en cours
- **WHEN** la tête atteint un pas de la piste des noms
- **THEN** la voix se tait le temps d'un blanc

#### Scenario: Pas bouché
- **GIVEN** le pas 2 « matin » bouché, un S+7 sur les noms
- **WHEN** la tête l'atteint
- **THEN** la voix dit « matin »

#### Scenario: Réglage pendant la lecture
- **GIVEN** une lecture en cours, la tête sur le pas 3, un S+7 sur les noms
- **WHEN** l'utilisateur passe le décalage à 8
- **THEN** le prochain pas de nom atteint dit le mot du S+8, et la tête ne revient pas au premier pas

### Requirement: Pas joué
The system SHALL mark the step being played in the grid, in ink and with a non-colour cue, and SHALL expose it to assistive technologies as the current step. The mark SHALL NOT light the step (no glow), and SHALL move step by step without animation.

#### Scenario: Marque du pas joué
- **GIVEN** une lecture en cours
- **WHEN** la tête atteint le pas 4
- **THEN** la colonne 4 porte la marque d'encre et est annoncée comme pas courant, et aucune autre colonne ne la porte

#### Scenario: Arrêt
- **GIVEN** une lecture en cours
- **WHEN** l'utilisateur l'arrête
- **THEN** aucune colonne ne porte la marque

### Requirement: Tempo
The system SHALL offer a tempo setting that controls the voice rate and the gap between two steps. A change SHALL apply from the next step on. The setting SHALL be kept in the browser across visits, validated when read back, and reset to its default when the stored value is invalid.

#### Scenario: Plus lent
- **GIVEN** une lecture en cours
- **WHEN** l'utilisateur ralentit le tempo
- **THEN** le pas suivant est dit plus lentement et suivi d'un blanc plus long

#### Scenario: Valeur gardée invalide
- **GIVEN** une valeur de tempo illisible dans le stockage du navigateur
- **WHEN** la console s'ouvre
- **THEN** le tempo par défaut s'applique et aucune erreur n'interrompt la page

### Requirement: Voix française
The system SHALL offer only the system voices whose language is French, SHALL keep the chosen voice in the browser across visits, and SHALL fall back to the first French voice when the kept one is no longer available. When no French voice is available, the play control SHALL be disabled and a message SHALL say that no French voice was found. No request SHALL carry the text.

#### Scenario: Aucune voix française
- **GIVEN** un navigateur sans voix dont la langue commence par « fr »
- **WHEN** la console s'affiche
- **THEN** le bouton de lecture est désactivé, un message dit qu'aucune voix française n'est disponible, et le reste de la console fonctionne

#### Scenario: Voix gardée disparue
- **GIVEN** une voix gardée qui n'est plus installée
- **WHEN** la lecture démarre
- **THEN** la première voix française disponible est utilisée

### Requirement: Arrêts
The system SHALL stop playback, silencing the voice before the next step, when the tab is hidden, when the page is left, when the text is put on tracks again, and when a notebook entry is reopened. It SHALL NOT resume by itself afterwards.

#### Scenario: Onglet masqué
- **GIVEN** une lecture en cours
- **WHEN** l'utilisateur passe à un autre onglet puis revient
- **THEN** la voix s'est tue et la lecture est arrêtée

#### Scenario: Rouvrir une entrée
- **GIVEN** une lecture en cours
- **WHEN** l'utilisateur rouvre une entrée du carnet
- **THEN** la lecture est arrêtée

### Requirement: Mention « réglé en écoutant »
The system SHALL end the chain mention with « réglé en écoutant » when playback has run at least once since the text was last put on tracks or reopened from the notebook, and with « écouté en discrépance » when playback has run at least once with the voice set to « l'original » in that time; when both apply, « réglé en écoutant » SHALL come first. The mention SHALL then read « — {parts} · réglé en écoutant (Oulipao) », « — {parts} · réglé en écoutant · écouté en discrépance (Oulipao) », or the same without « {parts} · » when no rule is active. The same mention SHALL be appended by the copy control and stored in the notebook. Putting the text on tracks again or reopening an entry SHALL reset this state.

#### Scenario: Texte gardé après écoute
- **GIVEN** un S+7 sur les noms, et une lecture lancée puis arrêtée depuis la mise en pistes
- **WHEN** l'utilisateur garde le texte
- **THEN** l'entrée du carnet porte la mention « — S+7 … · réglé en écoutant (Oulipao) », « réglé en écoutant » en dernière partie

#### Scenario: Texte gardé après une écoute discrépante
- **GIVEN** un S+7 sur les noms, et une lecture lancée sur « l'original » depuis la mise en pistes
- **WHEN** l'utilisateur garde le texte
- **THEN** la mention se termine par « · réglé en écoutant · écouté en discrépance (Oulipao) »

#### Scenario: Sans écoute
- **GIVEN** un texte mis en pistes et aucune lecture lancée depuis
- **WHEN** l'utilisateur copie le texte résultant
- **THEN** la mention ne contient ni « réglé en écoutant » ni « écouté en discrépance »

#### Scenario: Remise en pistes
- **GIVEN** une lecture lancée, puis le texte remis en pistes
- **WHEN** l'utilisateur garde le texte sans relancer la lecture
- **THEN** la mention ne contient ni « réglé en écoutant » ni « écouté en discrépance »

### Requirement: Source de la voix
The system SHALL offer in the listening transport a choice « La voix dit : le résultat / l'original », « le résultat » by default, kept in the browser with the tempo and the voice, validated when read back and reset to its default when invalid. With « l'original », each step SHALL say its original word, without punctuation, when its track is audible, and SHALL otherwise stay silent for a gap; the page SHALL keep showing the resulting text and the played step. A change of source SHALL apply from the next step on.

#### Scenario: Discrépance
- **GIVEN** un S+7 sur les noms qui remplace « chat », la voix réglée sur « l'original »
- **WHEN** la tête atteint le pas de « chat »
- **THEN** la voix dit « chat » et la page montre le nom remplacé

#### Scenario: Piste muette
- **GIVEN** la piste des noms muette, la voix réglée sur « l'original »
- **WHEN** la tête atteint le pas de « chat »
- **THEN** la voix se tait le temps d'un blanc

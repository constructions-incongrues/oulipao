# Spec Delta

## Purpose

Proposer un texte transformé par une chaîne cachée et faire retrouver le texte connu en déréglant le rack, avec un accordeur qui dit à quel point on s'en approche ; les puzzles se tirent au sort ou se fabriquent, et se transmettent par lien.

## ADDED Requirements

### Requirement: Puzzle
The system SHALL define a puzzle as: the original text and its tagged words, the hidden chain (ordered steps, each with a constraint type, its parameters and its targeted tracks), the level (« facile » or « moyen »), the title and author of the text when known, the transformed text with the tagged words delivered to the player (each output word inheriting the category of the original word it comes from), the reachable score and the win threshold. Every puzzle entering the application (link, corpus) SHALL be validated against this definition; an invalid puzzle SHALL be rejected with a message and SHALL NOT stop the page.

#### Scenario: Étiquettes livrées
- **WHEN** un puzzle est construit à partir d'un texte étiqueté et d'une chaîne
- **THEN** chaque mot du texte transformé porte la catégorie du mot d'origine dont il provient, sans nouvel étiquetage

#### Scenario: Puzzle invalide
- **WHEN** un puzzle reçu ne respecte pas sa définition
- **THEN** il est refusé avec le message « Ce puzzle est illisible. » et la page reste utilisable

### Requirement: Accordeur
The system SHALL score a candidate text against the original as the length of the longest common subsequence of their words (case-insensitive, words as cut by the shared tokenizer) divided by the original word count (raw score). The gauge SHALL display the normalized score `(raw − raw_puzzle) / (1 − raw_puzzle)`, clamped to 0–100 %, where `raw_puzzle` is the raw score of the untouched transformed text. The gauge SHALL update on every change of the player's chain.

#### Scenario: Puzzle brut
- **WHEN** le joueur n'a branché aucun filtre
- **THEN** la jauge affiche 0 %

#### Scenario: Texte retrouvé
- **WHEN** la sortie du joueur est identique au texte d'origine
- **THEN** la jauge affiche 100 %

#### Scenario: Contraction tolérée
- **WHEN** la sortie diffère de l'original seulement par « à la » au lieu de « au »
- **THEN** le score brut ne perd que les mots non communs, sans décalage du reste

### Requirement: Auto-vérification
The system SHALL, before offering any puzzle, apply its exact inverse chain to the transformed text with the delivered tags, and record the raw score reached as the reachable score. The exact inverse chain SHALL take the steps in reverse order, negate the fixed offset of each S+n and R+n step and keep its other parameters and targets, and omit every other step (a step that loses information, or an S+n drawn by die, has no inverse). The win threshold SHALL be `min(95 %, reachable − 2 points)` in raw score. A drawn puzzle SHALL be offered only if its reachable score is at least 95 %. A fabricated puzzle whose reachable score is below 80 % SHALL be offered with the warning « Ce puzzle perd beaucoup : seul X % du texte peut revenir. ».

#### Scenario: Puzzle tiré soluble
- **WHEN** le tirage produit une chaîne dont l'inverse exacte retrouve 97 % des mots
- **THEN** le puzzle est proposé avec un seuil de victoire de 95 %

#### Scenario: Puzzle tiré refusé
- **WHEN** l'inverse exacte d'une chaîne tirée ne retrouve que 90 % des mots
- **THEN** ce puzzle n'est pas proposé et un autre est tiré

#### Scenario: Filtre qui perd
- **WHEN** le fondateur fabrique un puzzle dont la chaîne contient un lipogramme et dont l'inverse exacte retrouve 85 % des mots
- **THEN** le puzzle est proposé avec un seuil de victoire de 83 %

### Requirement: Tirage au sort
The system SHALL draw a puzzle by choosing a text from the public-domain corpus and a chain of one or two S+n steps, each with an order among alphabetical and valence, an offset between 1 and 9, the « même genre » mode, and targets nouns (alphabetical) or nouns and adjectives (valence). It SHALL redraw while the self-check refuses the puzzle, up to 20 attempts, then report « Pas de puzzle trouvé, réessayez. ». The draw SHALL use the « moyen » level unless the player chose « facile ».

#### Scenario: Puzzle au hasard
- **WHEN** le joueur appuie sur « Puzzle au hasard »
- **THEN** un texte du corpus passé par une chaîne cachée d'une ou deux étapes s'affiche en entrée, avec son titre, et la jauge à 0 %

### Requirement: Fabrication
The system SHALL turn the current input text, its tags and the current enabled chain into a puzzle from the « En faire un puzzle » action, and SHALL produce its link. The action SHALL be unavailable while the chain is empty.

#### Scenario: En faire un puzzle
- **WHEN** le fondateur a un texte étiqueté et une chaîne non vide, et choisit « En faire un puzzle »
- **THEN** un lien vers ce puzzle est copié et l'interface le confirme

### Requirement: Lien de puzzle
The system SHALL encode a puzzle into the URL fragment `#puzzle=` as compressed, URL-safe text, so that it is never sent to the server, and SHALL open the puzzle when the page loads with such a fragment. Opening a puzzle SHALL NOT require downloading the tagging model.

#### Scenario: Ouvrir un lien
- **WHEN** une personne ouvre une adresse qui contient `#puzzle=…` valide
- **THEN** le puzzle s'affiche en mode puzzle, sans téléchargement du modèle d'étiquetage

#### Scenario: Aller-retour du lien
- **WHEN** un puzzle est encodé en lien puis décodé avec les mêmes données lexicales
- **THEN** le puzzle reconstruit est identique à l'original

### Requirement: Jeu dans le rack
The system SHALL play a puzzle in the existing rack: the transformed text is the input, with the delivered tags, the chain starts empty, every constraint and negative offset is available, and the gauge is shown. In puzzle mode the input SHALL NOT be editable, and the notebook and the export SHALL be hidden. « Quitter le puzzle » SHALL return to the normal mode.

#### Scenario: Défaire un S+7
- **WHEN** le puzzle cache un S+7 et le joueur branche un S+n réglé à −7 sur les noms
- **THEN** la jauge monte et atteint le seuil si la chaîne cachée n'avait que cette étape

#### Scenario: Quitter
- **WHEN** le joueur choisit « Quitter le puzzle »
- **THEN** l'interface revient au mode normal, avec le carnet et l'export

### Requirement: Niveaux
The system SHALL, at level « facile », show the titles of the hidden chain's steps in application order without their settings (for example « S+? puis V+? »), and at level « moyen », show nothing of the chain. Both levels SHALL show the title of the text.

#### Scenario: Indice facile
- **WHEN** un puzzle de niveau facile cache un S+5 puis un V+3
- **THEN** l'indice affiche « S+? puis V+? »

#### Scenario: Niveau moyen
- **WHEN** un puzzle de niveau moyen est ouvert
- **THEN** aucun indice sur la chaîne n'est affiché

### Requirement: Victoire
The system SHALL declare the puzzle solved when the raw score reaches the win threshold, and SHALL then show the original text and the transformed text side by side with the hidden chain revealed.

#### Scenario: Puzzle résolu
- **WHEN** le score brut du joueur atteint le seuil
- **THEN** l'original, le texte transformé et la chaîne cachée s'affichent côte à côte

### Requirement: Historique des puzzles résolus
The system SHALL record each solved puzzle in browser storage (title, level, origin « tirage » or « lien », date) and SHALL show the count of solved puzzles. Storage failures SHALL NOT prevent playing.

#### Scenario: Stockage indisponible
- **WHEN** le stockage du navigateur est bloqué
- **THEN** le puzzle se joue et se résout normalement, sans historique

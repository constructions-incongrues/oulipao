# retrait-et-mise-en-lignes Specification

## Purpose
Retirer des mots d'un texte et en refaire les lignes sans lexique, pour couvrir les contraintes de l'Oulipo qui ne font que garder, ôter ou disposer les mots : Liponymie, Inventaire, Haï-kaïsation, Intérieur de poème, Poème de bandit, Juliennes.

## Requirements

### Requirement: Tri par piste
The system SHALL provide a « Tri par piste » constraint, targetable on all five tracks, with a « Mode » choice (« retirer » removes the words of the target tracks, « ne garder que » removes every other word) and a « Disposition » choice (« telle quelle » keeps the remaining words' spacing, « un mot par ligne » puts each remaining word on its own line, without punctuation).

#### Scenario: Retirer noms, adjectifs et verbes
- **GIVEN** un Tri par piste en mode « retirer » visant les noms, les adjectifs et les verbes
- **WHEN** il s'applique au texte « Le chat noir dort. »
- **THEN** le texte résultant est « Le. »

#### Scenario: Inventaire des noms
- **GIVEN** un Tri par piste en mode « ne garder que », disposition « un mot par ligne », visant les noms
- **WHEN** il s'applique au texte « Le chat noir dort sur le mur. »
- **THEN** le texte résultant est « Chat », puis « mur » sur la ligne suivante (« Le », retiré en tête de phrase, lègue sa majuscule)

### Requirement: Bord
The system SHALL provide a « Bord » constraint with a « Mode » choice and an integer « Mots » setting n from 1 to 9: « fins de vers » keeps the last n words of each line; « tête-à-queue » keeps the first n and the last n words of each line; « intérieur » removes the first and the last line and the first n and the last n words of every other line. A line is a run of words between two line breaks of the text the constraint receives.

#### Scenario: Haï-kaïsation
- **GIVEN** un Bord en mode « fins de vers », n = 1, et un poème de trois vers
- **WHEN** il s'applique
- **THEN** il reste trois lignes, chacune réduite au dernier mot de son vers

#### Scenario: Intérieur de poème
- **GIVEN** un Bord en mode « intérieur », n = 1, et un poème de quatre vers de cinq mots
- **WHEN** il s'applique
- **THEN** il reste deux lignes de trois mots, celles des deuxième et troisième vers

### Requirement: Mise en vers
The system SHALL provide a « Mise en vers » constraint that changes only the spacing between words, never the words, with a « Coupe » choice: « tous les n mots » breaks the line after every n words (integer n from 1 to 99); « aux ponctuations » breaks the line after each punctuation mark; « selon un nombre » reads the digits of an integer from 1 to 9 999 999 as the word count of each successive line, cycling through them and skipping zeros. Existing line breaks SHALL be replaced.

#### Scenario: Poème de bandit
- **GIVEN** une Mise en vers « tous les n mots », n = 3
- **WHEN** elle s'applique à une phrase de sept mots
- **THEN** le texte résultant a trois lignes de trois, trois et un mots

#### Scenario: Juliennes
- **GIVEN** une Mise en vers « selon un nombre » réglée sur 2461317
- **WHEN** elle s'applique à un texte de trente mots
- **THEN** les lignes comptent 2, 4, 6, 1, 3, 1, 7, puis 2 et 4 mots

### Requirement: Contraintes non ciblables
The system SHALL let a constraint type declare itself non-targetable: its instances act on every track, show no track chips, and count every word, including words whose step is closed; a closed word SHALL never be removed or replaced, but the spacing before it MAY change. Bord and Mise en vers are non-targetable.

#### Scenario: Pas de puces
- **GIVEN** une Mise en vers dans la chaîne
- **WHEN** la chaîne s'affiche
- **THEN** sa ligne ne montre aucune puce de piste

#### Scenario: Pas bouché sous un Bord
- **GIVEN** un Bord en mode « fins de vers », n = 1, et le premier mot d'un vers bouché
- **WHEN** il s'applique
- **THEN** ce mot reste dans le texte résultant avec le dernier mot de son vers

### Requirement: Blanc d'un mot retiré
The system SHALL, whenever a constraint removes a word, keep the line breaks and punctuation of the spacing before it and merge them into the spacing before the next remaining word: line breaks are kept; a run of punctuation is reduced to its strongest mark (sentence end over semicolon or colon over comma); spaces follow French typography (no space before a comma or a full stop, one space before « ; : ! ? »); punctuation left at the start of the text or of a line is dropped. A word removed in sentence-initial position SHALL pass its capital letter to the next remaining word.

#### Scenario: Ponctuation gardée
- **GIVEN** le texte « Le chat dort, tranquille. » et un Tri par piste qui retire les adjectifs
- **WHEN** il s'applique
- **THEN** le texte résultant est « Le chat dort. »

#### Scenario: Majuscule léguée
- **GIVEN** le texte « Hier, le chat dormait. » et un Tri par piste qui retire les adverbes
- **WHEN** il s'applique
- **THEN** le texte résultant est « Le chat dormait. »

#### Scenario: Vers gardés
- **GIVEN** un poème de deux vers dont le premier mot du second vers est retiré
- **WHEN** la contrainte s'applique
- **THEN** le texte résultant a toujours deux lignes

### Requirement: Mots remis en ligne
The system SHALL mark as « remis en ligne » each word whose preceding spacing a constraint changes without replacing or removing the word, SHALL count these words per instance, and SHALL name them in the summary (for example « Mise en vers : 12 mots remis en ligne »).

#### Scenario: Compte
- **GIVEN** une Mise en vers « tous les n mots », n = 3, sur une phrase de sept mots
- **WHEN** le résumé s'affiche
- **THEN** il compte deux mots remis en ligne

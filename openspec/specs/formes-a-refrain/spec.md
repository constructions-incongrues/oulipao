# formes-a-refrain Specification

## Purpose
Mettre les vers d'un texte transformé dans une forme fixe à refrain (rondel, villanelle) : la forme recopie les vers de refrain à leurs places et dispose les strophes, après la chaîne de filtres, sans rien composer à la place de l'auteur.

## Requirements

### Requirement: Choix de la forme
The system SHALL offer a form choice among none, rondel and villanelle, defaulting to none; with none, the resulting text SHALL be exactly the output of the chain.

#### Scenario: Aucune forme
- **GIVEN** une chaîne quelconque et la forme « aucune »
- **WHEN** le texte est traité
- **THEN** le texte résultant est la sortie de la chaîne, sans vers ajouté

### Requirement: Forme après la chaîne
The system SHALL apply the form to the output of the last step of the chain, never inside it: every filter SHALL read only the author's lines, and the chain, the inspector stages, the step grid and the locks SHALL stay aligned word for word on the original text.

#### Scenario: Schéma puis rondel
- **GIVEN** dix vers, un schéma de rimes « rondel » dans la chaîne et la forme « rondel »
- **WHEN** le texte est traité
- **THEN** le schéma s'applique aux dix vers de l'auteur, et les refrains recopient les vers tels qu'ils sortent de la chaîne

### Requirement: Rondel
The system SHALL lay out a rondel as thirteen lines in three stanzas of four, four and five lines, taking the author's lines in order and ignoring the author's stanza breaks: lines 7 and 8 SHALL be copies of lines 1 and 2, and line 13 a copy of line 1.

#### Scenario: Dix vers
- **GIVEN** dix vers numérotés v1 à v10 et la forme « rondel »
- **WHEN** le texte est traité
- **THEN** le texte résultant est v1 v2 v3 v4 / v5 v6 v1 v2 / v7 v8 v9 v10 v1, où « / » sépare les strophes

### Requirement: Villanelle
The system SHALL lay out a villanelle as nineteen lines in five tercets and a final quatrain, taking the author's lines in order and ignoring the author's stanza breaks: lines 6, 12 and 18 SHALL be copies of line 1, and lines 9, 15 and 19 copies of line 3.

#### Scenario: Treize vers
- **GIVEN** treize vers numérotés v1 à v13 et la forme « villanelle »
- **WHEN** le texte est traité
- **THEN** le texte résultant est v1 v2 v3 / v4 v5 v1 / v6 v7 v3 / v8 v9 v1 / v10 v11 v3 / v12 v13 v1 v3

### Requirement: Vers manquants ou en trop
The system SHALL stop the form after the last line the author's text can fill and SHALL say how many lines are missing; lines beyond those the form needs SHALL follow the form, in their own stanza, without refrains.

#### Scenario: Six vers en rondel
- **GIVEN** six vers et la forme « rondel »
- **WHEN** le texte est traité
- **THEN** le texte résultant s'arrête après la copie des vers 1 et 2 qui closent la deuxième strophe, et la page dit qu'il manque quatre vers

#### Scenario: Douze vers en rondel
- **GIVEN** douze vers et la forme « rondel »
- **WHEN** le texte est traité
- **THEN** les dix premiers forment le rondel, et les vers 11 et 12 suivent dans une strophe à part

### Requirement: Forme sans mètre
The system SHALL neither count nor impose the metre of a form: the syllable count of each line SHALL be shown as for any other line.

#### Scenario: Octosyllabes
- **GIVEN** un rondel dont les vers n'ont pas huit syllabes
- **WHEN** le texte est traité
- **THEN** la forme s'applique, et chaque vers montre son propre compte de syllabes

# Spec Delta

## MODIFIED Requirements

### Requirement: Décalage tiré au dé
The system SHALL let an S+n instance draw its offset with a die instead of a fixed offset: with « au dé », each targeted word SHALL get an offset from 1 to 6 derived only from an integer seed (1 to 9 999 999) and the word's position in the source text, whatever the earlier steps of the chain removed, split or merged, so that the same seed and text always give the same result. A lock on a word SHALL take precedence over the die. The instance title SHALL read « S+dé ».

#### Scenario: Même graine, même tirage
- **GIVEN** un texte de dix noms, un S+n au dé de graine 2461318
- **WHEN** le texte est traité deux fois, ou rouvert depuis le carnet
- **THEN** chaque nom reçoit le même décalage, compris entre 1 et 6, et le texte résultant est identique

#### Scenario: Relancer le dé
- **GIVEN** le même texte et une autre graine
- **WHEN** le texte est traité
- **THEN** au moins un nom reçoit un autre décalage

#### Scenario: Verrou prioritaire
- **GIVEN** un S+n au dé et un verrou S+3 sur un nom
- **WHEN** le texte est traité
- **THEN** ce nom prend le décalage 3

#### Scenario: Étape amont qui retire un mot
- **GIVEN** une chaîne « Tri par piste qui retire les adverbes » puis « S+n au dé », sur un texte où un adverbe précède plusieurs noms
- **WHEN** l'utilisateur coupe puis rallume le Tri par piste
- **THEN** chaque nom placé après l'adverbe reçoit le même décalage dans les deux cas

## ADDED Requirements

### Requirement: Mots bouchés signalés
The system SHALL give the reason « pas bouché » to every word the S+n leaves because its step is closed, whatever its track — noun, adjective or verb.

#### Scenario: Adjectif bouché
- **GIVEN** un S+n en mode réaccord sur les noms et les adjectifs, et le pas d'un adjectif bouché
- **WHEN** le texte est traité
- **THEN** l'adjectif reste tel quel et l'inspecteur donne la raison « pas bouché »

# Spec Delta

## ADDED Requirements

### Requirement: Décalage tiré au dé
The system SHALL let an S+n instance draw its offset with a die instead of a fixed offset: with « au dé », each targeted word SHALL get an offset from 1 to 6 derived only from an integer seed (1 to 9 999 999) and the word's position, so that the same seed and text always give the same result. A lock on a word SHALL take precedence over the die. The instance title SHALL read « S+dé ».

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

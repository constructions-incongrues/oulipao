## ADDED Requirements

### Requirement: Les formes d'une finale
The phonetics textbank SHALL give, for a sequence of one to three final phonemes and a category, every candidate form of that category whose pronunciation ends with that sequence, guessed and borrowed pronunciations included, without scanning the dictionary.

#### Scenario: Formes en /ɥi/
- **GIVEN** la textbank chargée
- **WHEN** on demande les noms qui finissent par /ɥi/
- **THEN** on obtient notamment « pluie » et « nuit », et aucun nom qui finit seulement par /i/, comme « ami »

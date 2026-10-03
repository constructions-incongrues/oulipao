# Spec Delta

## ADDED Requirements

### Requirement: Schémas des formes à refrain
The system SHALL add the schemes rondel and villanelle to the closed list of named rhyme schemes. They SHALL letter the author's lines before the form copies its refrains, in a single stanza: ABBAABABBA for the ten lines of a rondel, ABAABABABABAB for the thirteen lines of a villanelle; lines beyond these SHALL receive no letter.

#### Scenario: Dix vers en schéma rondel
- **GIVEN** une strophe de dix vers et le schéma « rondel »
- **WHEN** les lettres sont calculées
- **THEN** elles valent A B B A A B A B B A

#### Scenario: Villanelle sur deux rimes
- **GIVEN** treize vers, le schéma « villanelle » puis la forme « villanelle »
- **WHEN** le texte est traité
- **THEN** les dix-neuf vers de la villanelle ne portent que deux rimes, ou un vers sans voisin porte sa raison

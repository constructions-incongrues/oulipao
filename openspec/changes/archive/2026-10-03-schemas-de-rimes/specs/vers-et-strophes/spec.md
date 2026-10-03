# Spec Delta

## ADDED Requirements

### Requirement: Début de vers
The system SHALL mark as the start of its line the first word of each line that belongs to a noun, adjective, verb or adverb track, skipping function words and punctuation before it.

#### Scenario: Article initial
- **GIVEN** le vers « Le vieux chat dort sur la chaise. »
- **WHEN** son début est repéré
- **THEN** « vieux » est le début de vers, « Le » étant un mot-outil

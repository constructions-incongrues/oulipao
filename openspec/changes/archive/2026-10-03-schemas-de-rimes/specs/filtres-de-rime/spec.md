# Spec Delta

## MODIFIED Requirements

### Requirement: Monorime
The system SHALL offer a monorhyme constraint that replaces each targeted line end by the first word following it in dictionary order, within its category and with the same features, whose rhyme is the chosen one; the rhyme SHALL be chosen from a closed list of the most frequent rhymes of the lexicon, each shown in phonetic form with an example word. A gender setting (any, masculine, feminine, alternate) SHALL further restrict the accepted words; in alternate mode, the gender SHALL alternate line by line within a stanza, starting from the gender of the first line.

#### Scenario: Monorime en /ɔ̃/
- **GIVEN** un poème et un monorime réglé sur /ɔ̃/ (« maison »)
- **WHEN** le texte est traité
- **THEN** chaque fin de vers visée finit en /ɔ̃/, et une fin de vers qui rimait déjà en /ɔ̃/ ne change pas

#### Scenario: Sonnet monorime alterné
- **GIVEN** un quatrain et un monorime réglé sur /ɔ̃/, genre alterné
- **WHEN** le texte est traité
- **THEN** toutes les fins finissent en /ɔ̃/, et leur genre alterne de vers en vers, ou la fin qui n'a pas de candidat porte sa raison

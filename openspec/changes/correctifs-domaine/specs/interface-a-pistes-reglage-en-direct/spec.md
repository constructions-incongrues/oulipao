# Spec Delta

## ADDED Requirements

### Requirement: Découpage des mots composés
The system SHALL keep as one word a hyphenated compound whose second part looks like a pronoun when it belongs to a fixed list of lexicalised compounds (at least « rendez-vous », « on-dit », « chez-soi », « chez-moi », « m'as-tu-vu »), while still splitting a verb from its clitic pronoun (« dit-il », « donne-le »). It SHALL treat the modifier letter apostrophe (U+02BC) as an apostrophe, like « ' » and « ’ ».

#### Scenario: Nom composé
- **GIVEN** le texte « Le rendez-vous est pris. »
- **WHEN** il est mis en pistes
- **THEN** « rendez-vous » est un seul mot de la piste des noms

#### Scenario: Verbe et pronom
- **GIVEN** le texte « Viens, dit-il. »
- **WHEN** il est mis en pistes
- **THEN** « dit » et « il » sont deux mots

#### Scenario: Apostrophe modificative
- **GIVEN** le texte « lʼarbre » écrit avec l'apostrophe U+02BC
- **WHEN** il est mis en pistes
- **THEN** « l » et « arbre » sont découpés comme avec « l'arbre »

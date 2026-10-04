# alphabet-augmente Specification

## Purpose
Faire entrer dans le texte les « lettres » qu'Isou a ajoutées à l'alphabet, souffles, sifflements et claquements, en remplaçant selon une règle énoncée la ponctuation et certains sons des mots.

## Requirements

### Requirement: Alphabet augmenté dans la chaîne
The system SHALL offer an « Alphabet augmenté » engine that acts on the whole text, with a choice parameter « Remplace » among « la ponctuation », « les sons » and « les deux » (default « la ponctuation »). It SHALL be deterministic and SHALL provide a title, a label and a help text. It SHALL not load any textbank.

#### Scenario: Ajout
- **GIVEN** une chaîne vide
- **WHEN** l'utilisateur ajoute un Alphabet augmenté
- **THEN** la chaîne le montre avec « Tout le texte » et « Remplace : la ponctuation »

### Requirement: Ponctuation en corps
When its setting includes the punctuation, the system SHALL replace in the gaps between words a comma with a breath « pfou », a full stop with a click « clac », and « ! » or « ? » with a whistle « fuit », each as a separate word, and SHALL leave the words unchanged.

#### Scenario: Virgule et point
- **GIVEN** le texte « Le chat dort, la pluie tombe. »
- **WHEN** l'Alphabet augmenté agit sur la ponctuation
- **THEN** le texte devient « Le chat dort pfou la pluie tombe clac »

### Requirement: Sons en corps
When its setting includes the sounds, the system SHALL replace, inside each word, the letters that carry the sound /s/ with « tss », /f/ with « pf » and /k/ with « tk », joined to the other letters, using the French grapheme-to-phoneme rules that already guess pronunciations, which tell which letters carry which sound; the other letters SHALL stay. A closed step SHALL keep its word.

#### Scenario: Un /s/ écrit « ç »
- **GIVEN** le mot « garçon »
- **WHEN** l'Alphabet augmenté agit sur les sons
- **THEN** le mot devient « gartsson »

#### Scenario: Lettre muette
- **GIVEN** le mot « temps », dont le « s » final ne se prononce pas
- **WHEN** l'Alphabet augmenté agit sur les sons
- **THEN** le « s » reste écrit

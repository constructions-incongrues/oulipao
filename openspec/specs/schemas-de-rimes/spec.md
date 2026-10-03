# schemas-de-rimes Specification

## Purpose
Donner une forme rimée à un texte en vers : imposer un schéma de rimes nommé, l'alternance des genres, une rime en tête de vers ou une rime berrychonne, par une règle énoncée et accordée comme au S+n.

## Requirements

### Requirement: Genre de la rime
The system SHALL classify a rhyme as feminine when the word ends with a mute e (« -e », « -es », or « -ent » when the reading of a verb ends without a vowel) and as masculine otherwise.

#### Scenario: Rose et vert
- **GIVEN** les mots « rose », « roses » et « vert »
- **WHEN** leur genre de rime est calculé
- **THEN** « rose » et « roses » sont féminins et « vert » est masculin

#### Scenario: Verbe en -ent
- **GIVEN** « chantent » (verbe) et « souvent » (adverbe)
- **WHEN** leur genre de rime est calculé
- **THEN** « chantent » est féminin et « souvent » est masculin

### Requirement: Schéma de rimes nommé
The system SHALL offer a rhyme-scheme constraint whose scheme is chosen from a closed list (plates AABB, croisées ABAB, embrassées ABBA, étreinte, rime bisexuelle), with a richness and a gender setting (any or alternate). Within each stanza, the first line of a letter SHALL keep its end and fix the rhyme of that letter; each later line of the same letter SHALL take the first following word of its category and features that carries that rhyme; a line of another letter that rhymes with an already fixed letter SHALL take the first following word that does not.

#### Scenario: Rimes embrassées
- **GIVEN** un quatrain et un schéma « embrassées »
- **WHEN** le texte est traité
- **THEN** la fin du vers 4 rime avec celle du vers 1, la fin du vers 3 rime avec celle du vers 2, et les fins des vers 1 et 2 ne riment pas

#### Scenario: Aucun voisin qui rime
- **GIVEN** une fin de vers dont aucun mot de sa catégorie ne porte la rime de sa lettre
- **WHEN** le texte est traité
- **THEN** le mot reste tel quel et sa raison le dit

#### Scenario: Pas bouché
- **GIVEN** une fin de vers dont le pas est bouché
- **WHEN** le texte est traité
- **THEN** elle ne change pas, porte la raison « pas bouché », et fixe la rime de sa lettre si elle est la première de cette lettre

### Requirement: Étreinte en miroir
The system SHALL lay out the étreinte scheme as a mirror over the length of each stanza (ABCCBA for six lines), leaving the middle line of an odd stanza free: it receives no letter and is neither replaced nor compared.

#### Scenario: Strophe de cinq vers
- **GIVEN** une strophe de cinq vers et un schéma « étreinte »
- **WHEN** les lettres sont calculées
- **THEN** elles valent A B (libre) B A, et le vers 3 n'est contraint par aucun autre

### Requirement: Reprise du schéma
The system SHALL repeat a fixed-length scheme with new letters when a stanza is longer than the scheme, and SHALL apply only its first letters when a stanza is shorter.

#### Scenario: Six vers en rimes croisées
- **GIVEN** une strophe de six vers et un schéma « croisées »
- **WHEN** les lettres sont calculées
- **THEN** elles valent A B A B C D

### Requirement: Rime bisexuelle
The system SHALL treat the rime bisexuelle as a scheme of three rhyming lines per group, the second line taking the gender of the first and the third the other gender, whatever the gender setting.

#### Scenario: Tercet
- **GIVEN** un tercet et un schéma « rime bisexuelle »
- **WHEN** le texte est traité
- **THEN** les trois fins riment, et exactement une n'a pas le genre des deux autres, ou sa raison dit pourquoi

### Requirement: Alternance des genres
The system SHALL, when the gender setting is alternate, require line ends to alternate gender line by line within a stanza, starting from the gender of the first line.

#### Scenario: Quatrain alterné
- **GIVEN** un quatrain en rimes croisées, genre alterné, dont le vers 1 finit sur un mot masculin
- **WHEN** le texte est traité
- **THEN** les vers 1 et 3 finissent sur des mots masculins et les vers 2 et 4 sur des mots féminins

### Requirement: Antérime
The system SHALL offer an anterhyme constraint that makes the first full word of each line rhyme with the first full word of the neighbouring line, by pairs, leaving line ends unchanged.

#### Scenario: Distique
- **GIVEN** un distique et une antérime
- **WHEN** le texte est traité
- **THEN** le premier mot plein du vers 2 rime avec celui du vers 1, et les fins de vers ne changent pas

### Requirement: Rime berrychonne
The system SHALL offer a berrychonne constraint that replaces the end of every third line by the first following word whose rhyme combines the final consonant of one of the two previous rhymes with the vowel of the other, trying both combinations.

#### Scenario: Tercet en /aʁ/ et /ɔl/
- **GIVEN** un tercet dont les deux premières fins riment en /aʁ/ et /ɔl/
- **WHEN** le texte est traité
- **THEN** la troisième fin rime en /ɔʁ/ ou en /al/, ou reste avec sa raison

### Requirement: Schémas dans la chaîne
The system SHALL make the rhyme-scheme, anterhyme and berrychonne constraints instantiable, targetable and chainable like the other rhyme filters, honouring locks and muted steps, with replacements agreed as for S+n, and SHALL load no data beyond the phonetic textbank.

#### Scenario: Mise en vers puis embrassées
- **GIVEN** une prose, une mise en vers puis un schéma « embrassées »
- **WHEN** le texte est traité
- **THEN** le schéma s'applique aux vers produits par la mise en vers

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

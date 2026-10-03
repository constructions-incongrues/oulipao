# textbank-phonetique Specification

## Purpose
Donner aux filtres ce qu'un mot français fait entendre : sa prononciation, ses syllabes et sa rime, tirées d'un lexique libre et devinées par règles pour les mots qu'il ignore. La textbank n'est chargée que quand un filtre phonétique en a besoin.

## Requirements

### Requirement: Prononciations tirées d'un lexique libre
The system SHALL derive from the GLÀFF lexicon a file giving, for each French form and coarse category (noun, adjective, verb, adverb, other), its phonemes, its syllables and its rhyme, SHALL validate every line of that file when loading it, and SHALL refuse a non-conforming file.

#### Scenario: Prononciation de « chaise »
- **GIVEN** le fichier phonétique dérivé du lexique
- **WHEN** on demande les lectures de « chaise » comme nom
- **THEN** on obtient les phonèmes /ʃɛz/, une syllabe, et la rime /ɛz/

#### Scenario: Ligne non conforme
- **GIVEN** un fichier phonétique dont une ligne porte un phonème inconnu
- **WHEN** il est chargé
- **THEN** le chargement échoue et le message cite la ligne

### Requirement: Licence et attribution de la textbank
The system SHALL ship the derived phonetic file under the licence of its source (CC BY-SA 3.0), SHALL state that licence and the attribution to the GLÀFF authors in the file header and in the third-party licence notice, and SHALL keep that file separate from the code and from the other lexicon files.

#### Scenario: En-tête du fichier
- **GIVEN** le fichier phonétique publié
- **WHEN** on lit ses premières lignes
- **THEN** elles nomment la source, ses auteurs et la licence CC BY-SA 3.0

### Requirement: Rime et richesse
The system SHALL define the rhyme of a form as its last pronounced vowel and the phonemes that follow it, a final mute e not counting; and SHALL say that two forms rhyme at a given richness when they share, from the end, the last vowel (poor), the last vowel and one adjacent consonant (sufficient), or at least three phonemes (rich).

#### Scenario: Rime suffisante
- **GIVEN** « chaise » (/ʃɛz/) et « fraise » (/fʁɛz/)
- **WHEN** on teste la rime à la richesse suffisante
- **THEN** les deux formes riment

#### Scenario: Rime riche refusée
- **GIVEN** « chaise » (/ʃɛz/) et « braise » (/bʁɛz/)
- **WHEN** on teste la rime à la richesse riche
- **THEN** les deux formes ne riment pas, faute de trois phonèmes communs

#### Scenario: E muet final
- **GIVEN** « table » (/tabl/) et « fable » (/fabl/)
- **WHEN** on calcule leur rime
- **THEN** la rime est /abl/ pour les deux, le e final n'étant pas prononcé

### Requirement: Lecture selon la catégorie
The system SHALL, when a written form has several pronunciations, keep the one that matches the category given by the tagger.

#### Scenario: « couvent » nom et verbe
- **GIVEN** « les poules du couvent couvent »
- **WHEN** chaque « couvent » est phonétisé
- **THEN** le nom se lit /kuvɑ̃/ et le verbe /kuv/

### Requirement: Homophones
The system SHALL find, for a form and a category, the other forms of that category that share exactly its phonemes, in French dictionary order.

#### Scenario: Homophones de « verre »
- **GIVEN** la forme « verre » comme nom
- **WHEN** on cherche ses homophones parmi les noms
- **THEN** on obtient « vair », « ver », « vers » et le nom « vert », mais pas l'adjectif « vert »

### Requirement: Prononciation devinée
The system SHALL phonetize by rules a form that is absent from the file, SHALL mark it with the reason « prononciation devinée », and SHALL let filters use that pronunciation like any other.

#### Scenario: Mot inventé
- **GIVEN** la forme « glorbiture », absente du fichier
- **WHEN** on demande sa prononciation
- **THEN** on obtient une prononciation devinée, dont la rime est /yʁ/, et la marque « prononciation devinée »

### Requirement: Chargement à la demande de la textbank
The system SHALL load the phonetic textbank only when an enabled instance of the chain is a phonetic filter, SHALL leave the words that need it unchanged with a waiting reason while it loads, and SHALL recompute the result once it has arrived.

#### Scenario: Page sans filtre phonétique
- **GIVEN** une chaîne sans filtre phonétique
- **WHEN** la page s'ouvre et le texte est traité
- **THEN** aucune requête ne demande la textbank phonétique

#### Scenario: Premier R+n ajouté
- **GIVEN** une chaîne à laquelle on ajoute un R+n
- **WHEN** la textbank se charge
- **THEN** les mots visés restent tels quels avec la raison « prononciations en cours de chargement », puis le texte résultant se recalcule

### Requirement: Une prononciation pour chaque forme candidate
The derived phonetics file SHALL hold, for every form that a rhyme filter may pick in a category (the forms of the morphology and verb files), the pronunciation that the filters use for it: GLÀFF's for that category, else GLÀFF's for another category, else one guessed by rules. Each row SHALL state which of these three sources it comes from, and a guessed pronunciation SHALL keep the reason « prononciation devinée ».

#### Scenario: Forme absente de GLÀFF
- **GIVEN** une forme de nom connue de Grammalecte et absente de GLÀFF
- **WHEN** on dérive le fichier des prononciations
- **THEN** le fichier porte pour elle une prononciation devinée, marquée comme telle, et l'inspecteur dit « prononciation devinée »

#### Scenario: Prononciation empruntée à une autre catégorie
- **GIVEN** une forme dont GLÀFF ne donne la prononciation que comme verbe
- **WHEN** on dérive le fichier pour ses lectures de nom
- **THEN** le fichier porte pour le nom la prononciation du verbe, marquée comme empruntée

### Requirement: Les formes d'une rime
The phonetics textbank SHALL give, for a rhyme and a category, every candidate form of that category whose pronunciation has that rhyme, without scanning the dictionary. Homophones SHALL keep being found only among GLÀFF pronunciations of the category.

#### Scenario: Formes en /ɛz/
- **GIVEN** la textbank chargée
- **WHEN** on demande les noms dont la rime est /ɛz/
- **THEN** on obtient notamment « chaise », sans parcourir la liste des noms

#### Scenario: Homophones inchangés
- **GIVEN** une forme dont la prononciation est devinée
- **WHEN** on cherche les homophones d'un nom qui se prononce comme elle
- **THEN** elle n'en fait pas partie, comme avant l'index

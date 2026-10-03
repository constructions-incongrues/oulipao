# tautogramme-progressif Specification

## Purpose
Faire suivre aux initiales des mots d'un texte une liste de lettres choisie, en boucle, en remplaçant chaque mot par un voisin du dictionnaire : le Tautogramme progressif de l'Oulipo.

## Requirements

### Requirement: Paramètre « Lettres »
The system SHALL provide a Tautogramme progressif plugin, written against the internal plugin contract, plugged on the noun, adjective, verb and adverb tracks (all four by default), declaring a « Lettres » text parameter, « oulipo » by default. Only letters SHALL count in the input: spaces, punctuation and digits are ignored, and an accented letter or a ligature counts as its bare letters, as with the lipogram.

#### Scenario: Ouverture
- **GIVEN** la page à pistes
- **WHEN** un Tautogramme progressif est ajouté
- **THEN** sa liste de lettres est « oulipo »

#### Scenario: Nom saisi
- **GIVEN** la saisie « Hélène-Marie »
- **WHEN** le filtre lit sa liste
- **THEN** la liste est h, e, l, e, n, e, m, a, r, i, e

### Requirement: Cycle des lettres
The system SHALL give each word the filter reaches — a word of a targeted track whose step is not closed — the next letter of the list, in text order, starting again from the first letter after the last. Function words and words of non-targeted tracks SHALL NOT take a letter. A word SHALL take its letter even when it is left unchanged.

#### Scenario: Trois noms
- **GIVEN** la liste « ab », la piste des noms seule visée, et « le chat mange la souris près du chien »
- **WHEN** le filtre s'applique
- **THEN** « chat » prend « a », « souris » prend « b », « chien » prend « a »

#### Scenario: Aide
- **GIVEN** un Tautogramme progressif dans la chaîne
- **WHEN** son aide s'affiche
- **THEN** elle dit que les mots-outils ne comptent pas dans la suite des lettres

### Requirement: Remplacement par un voisin à l'initiale imposée
The system SHALL leave a word whose initial already is its letter, and SHALL replace any other word with the first word of the same category and the same features whose initial is its letter, searching the dictionary in order from the place of the word with its initial replaced by that letter (« maison » toward « p » starts from « paison »), and going round the dictionary once if needed; nouns and adjectives keep their gender and number, verbs keep their tense and person, and the auxiliaries « être » and « avoir » stay unchanged. The phrase SHALL be re-agreed as with the S+7, and elision SHALL follow the new word.

#### Scenario: Nom remplacé
- **GIVEN** le nom « table » qui prend la lettre « o »
- **WHEN** le filtre s'applique
- **THEN** il devient le premier nom féminin singulier en « o » qui ne précède pas « oable » dans le dictionnaire, et son déterminant est réaccordé

#### Scenario: Pas toujours le premier mot de la lettre
- **GIVEN** les noms « camion » et « village » qui prennent tous deux la lettre « h »
- **WHEN** le filtre s'applique
- **THEN** « camion » part de « hamion » et « village » part de « hillage » : ils ne deviennent pas forcément le même nom

#### Scenario: Déjà à la bonne lettre
- **GIVEN** le nom « oiseau » qui prend la lettre « o »
- **WHEN** le filtre s'applique
- **THEN** « oiseau » reste tel quel

#### Scenario: Verbe
- **GIVEN** « elle mangeait » où « mangeait » prend la lettre « p »
- **WHEN** le filtre s'applique
- **THEN** « mangeait » devient l'imparfait, troisième personne du singulier, du premier verbe en « p » qui ne précède pas « panger »

#### Scenario: Initiale accentuée
- **GIVEN** la lettre « e » et un voisin qui commence par « é »
- **WHEN** le filtre cherche le voisin
- **THEN** « é » compte pour « e »

#### Scenario: Aucun voisin
- **GIVEN** un mot dont aucun voisin de même catégorie et de mêmes traits ne commence par sa lettre
- **WHEN** le filtre s'applique
- **THEN** le mot reste tel quel avec la raison « aucun voisin à l'initiale x », où x est sa lettre, et le mot suivant prend la lettre d'après

### Requirement: Réglage, résumé et mention
The system SHALL update the result text without re-tagging when the letters, the targeted tracks or the chain order change, and SHALL name the filter in the summary and in the copied note as « tautogramme progressif en » followed by the letters as typed, with its target tracks as for every instance.

#### Scenario: Copie
- **GIVEN** un Tautogramme progressif en « oulipo », visant toutes ses pistes, seul dans la chaîne
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — tautogramme progressif en oulipo (Oulipao) »

# Spec Delta

## Purpose

Faire varier un paramètre verrouillable d'une instance mot par mot, selon une source qu'on énonce en une phrase (les lettres du mot, son rang, celles de son voisin…), comme un modulateur branché sur un bouton de synthétiseur.

## ADDED Requirements

### Requirement: Brancher une source
The system SHALL let the user, in the panel of an instance, set each lockable integer parameter either to a fixed value or to a modulator made of a source, the word it reads, a base and a depth; a parameter SHALL carry at most one modulator, and the system SHALL offer no modulator for a parameter that is not lockable. Changing a modulator SHALL update the result without tagging the text again.

#### Scenario: S+lettres
- **GIVEN** un S+n sur les noms et le texte « Le chat dort sur la chaise. »
- **WHEN** l'utilisateur branche la source « lettres » sur le décalage
- **THEN** « chat » avance de 4 noms et « chaise » de 6, et le texte se réécrit aussitôt

#### Scenario: Revenir à la valeur fixe
- **GIVEN** un décalage modulé par les lettres
- **WHEN** l'utilisateur choisit « fixe »
- **THEN** tous les noms reprennent le décalage de l'instance

#### Scenario: Paramètre non verrouillable
- **GIVEN** un lipogramme en marche
- **WHEN** son panneau s'affiche
- **THEN** il ne propose aucun modulateur

### Requirement: Sources du mot
The system SHALL offer four word sources, each a non-negative integer read on one word: `lettres` (letters, accented ones included, apostrophes and hyphens excluded), `syllabes` (syllables of its most common pronunciation, a guessed one when the dictionary has none), `voyelles` (vowel letters) and `lettre` (occurrences of one chosen letter, accents ignored).

#### Scenario: Lettres d'un mot composé
- **GIVEN** la source « lettres »
- **WHEN** elle lit « porte-clés »
- **THEN** elle vaut 9

#### Scenario: Occurrences d'une lettre
- **GIVEN** la source « lettre » réglée sur « e »
- **WHEN** elle lit « élève »
- **THEN** elle vaut 3

#### Scenario: Syllabes
- **GIVEN** la source « syllabes » et les prononciations chargées
- **WHEN** elle lit « cuisine »
- **THEN** elle vaut 2

### Requirement: Sources de position
The system SHALL offer four position sources: `rang` (1 for the first word the instance treats at its stage, 2 for the second…), `ligne` (the line number, from 1, of the word in the text the instance receives), `motif` (a list of integers entered by the user, repeated over the words the instance treats) and `rampe` (from a start value on the first treated word to an end value on the last, rounded to the nearest integer).

#### Scenario: Rang
- **GIVEN** un S+n dont le décalage est modulé par le rang, sur les noms de « Le chat dort sur la chaise de la cuisine. »
- **WHEN** le texte se réécrit
- **THEN** « chat » avance de 1, « chaise » de 2 et « cuisine » de 3

#### Scenario: Motif plus court que les mots
- **GIVEN** le motif « 7, 0 » et quatre noms traités
- **WHEN** le texte se réécrit
- **THEN** les noms reçoivent 7, 0, 7, 0

#### Scenario: Ligne après une mise en vers
- **GIVEN** une mise en vers placée avant un S+n modulé par la ligne
- **WHEN** le texte se réécrit
- **THEN** tous les noms du vers 3 avancent de 3

#### Scenario: Motif invalide
- **GIVEN** la source « motif »
- **WHEN** l'utilisateur saisit « 7, x »
- **THEN** le motif est refusé, un message le dit près du champ et le motif précédent reste

### Requirement: Mot lu
The system SHALL read a word source on the word as the instance receives it at its stage of the chain, so that an earlier constraint changes what a later modulator reads. The user SHALL be able to read instead on the word's neighbour: the nearest word of a chosen track, before or after it, without crossing a sentence end (`.`, `!`, `?`); a word without such a neighbour SHALL keep the instance's value.

#### Scenario: Rétroaction
- **GIVEN** deux S+n à la suite sur les noms, tous deux modulés par les lettres
- **WHEN** le premier remplace « chat » par un nom de 6 lettres
- **THEN** le second fait avancer ce nom de 6

#### Scenario: Voisin
- **GIVEN** un S+n sur les noms, modulé par les lettres de l'adjectif suivant, et « Le chat noir dort. »
- **WHEN** le texte se réécrit
- **THEN** « chat » avance de 4

#### Scenario: Pas de voisin
- **GIVEN** le même réglage et « Le chat dort. Il pleut sur la ville grise. »
- **WHEN** le texte se réécrit
- **THEN** « chat » garde le décalage de l'instance et l'inspecteur dit « pas de voisin »

### Requirement: Base, profondeur et repli
The system SHALL compute a modulated value as `base + depth × source`, base 0 and depth 1 by default. A value above the parameter's maximum SHALL fold back into `[1, max]` as `((v − 1) mod max) + 1`; any other value outside the parameter's bounds SHALL fold into `[min, max]` as `min + ((v − min) mod (max − min + 1))`. The rule statement SHALL say "modulo" when a value of the text was folded.

#### Scenario: Repli d'un mot long
- **GIVEN** une homophonie dont le rang (de 1 à 9) est modulé par les lettres
- **WHEN** elle lit un mot de 13 lettres
- **THEN** le rang vaut 4

#### Scenario: Repli positif sur une plage signée
- **GIVEN** un R+n (décalage de −20 à +20) modulé par les lettres
- **WHEN** il lit « anticonstitutionnellement » (25 lettres)
- **THEN** le décalage vaut 5

#### Scenario: Profondeur négative
- **GIVEN** un S+n modulé par les lettres avec une base de 7 et une profondeur de −1
- **WHEN** il lit « chat »
- **THEN** le décalage vaut 3

### Requirement: Porte
The system SHALL let the user give an instance one gate: a source with its word and a test among `pair`, `impair`, `au moins k`, `au plus k` and, on `rang` only, `euclide k sur n` (the word of rank *r* passes when the Euclidean rhythm E(k,n) strikes at step `((r − 1) mod n) + 1`). A word that fails the gate SHALL be left as it is, like a closed step, for this instance only. The `rang` read by a gate SHALL count every word of the instance's tracks at its stage that is neither closed nor removed.

#### Scenario: Seuls les noms pairs
- **GIVEN** un S+n sur les noms avec la porte « lettres paires », et « Le chat dort sur la chaise de la pluie. »
- **WHEN** le texte se réécrit
- **THEN** « chat » et « chaise » sont remplacés, et « pluie » (5 lettres) reste

#### Scenario: Euclide
- **GIVEN** une porte « rang, euclide 3 sur 8 » et huit noms
- **WHEN** le texte se réécrit
- **THEN** seuls les noms de rang 1, 4 et 7 sont traités

#### Scenario: Porte et autre instance
- **GIVEN** deux S+n sur les noms, une porte fermée sur « pluie » dans le premier seulement
- **WHEN** le texte se réécrit
- **THEN** le second S+n traite « pluie »

### Requirement: Priorités
The system SHALL apply, for each word and each instance, a manual lock before the modulator and the modulator before the instance's value; a closed step SHALL stay untouched by every instance; a word removed earlier in the chain SHALL receive no modulated value and SHALL not count in `rang`, `motif` or `rampe`.

#### Scenario: Verrou sur un mot modulé
- **GIVEN** un S+lettres et un verrou à 1 sur « chaise »
- **WHEN** le texte se réécrit
- **THEN** « chaise » avance de 1 et les autres noms de leur nombre de lettres

#### Scenario: Pas bouché
- **GIVEN** un S+lettres et le pas de « chat » bouché
- **WHEN** le texte se réécrit
- **THEN** « chat » reste « chat »

### Requirement: Prononciations à la demande
The system SHALL load pronunciations when a modulator or a gate reads `syllabes`, as it does for a phonetic constraint; until they are loaded, a word SHALL keep the instance's value and the inspector SHALL say the pronunciations are loading.

#### Scenario: Premier branchement des syllabes
- **GIVEN** aucune contrainte phonétique dans la chaîne
- **WHEN** l'utilisateur branche la source « syllabes »
- **THEN** les prononciations se chargent et le texte se réécrit dès qu'elles sont là

### Requirement: Valeur visible
The system SHALL show, in the inspector band of each modulated instance, under each word it treats, the value the word received and whether the gate let it through, styled apart from a manual lock; the step's accessible name SHALL mention the modulated value.

#### Scenario: Inspecteur d'un S+lettres
- **GIVEN** un S+lettres sur « Le chat dort sur la chaise. »
- **WHEN** l'inspecteur s'affiche
- **THEN** la bande du S+n porte « +4 » sous « chat » et « +6 » sous « chaise », dans un style distinct d'un verrou

### Requirement: Règle énoncée
The system SHALL state each modulator and each gate in one French sentence, in the chain summary and in the chain mention (thus in the notebook, its export and the copied text), without listing per-word values; the instance's label SHALL name the source of its main parameter (« S+lettres », « R+rang », « S+motif »).

#### Scenario: Mention d'un S+lettres
- **GIVEN** un S+n modulé par les lettres sur les noms
- **WHEN** l'utilisateur copie le texte
- **THEN** la mention contient « S+lettres » et la phrase « chaque nom avance d'autant de noms qu'il a de lettres »

#### Scenario: Mention d'une porte
- **GIVEN** une porte « lettres paires »
- **WHEN** la mention s'affiche
- **THEN** elle dit « seuls les noms d'un nombre pair de lettres sont traités »

### Requirement: Persistance
The system SHALL keep modulators and gates with the mixer state, in the notebook and in its export, without changing the export version; an entry or a saved state with an invalid modulator SHALL keep the instance with its fixed value instead of being rejected; an export written before this change SHALL be read without loss. Modulators SHALL survive setting changes, moved filters and muted tracks, and SHALL also survive tagging a new text, since they name no word.

#### Scenario: Rouvrir une entrée
- **GIVEN** une entrée du carnet gardée avec un S+lettres
- **WHEN** l'utilisateur la rouvre
- **THEN** le S+n est de nouveau modulé par les lettres et le résultat est identique

#### Scenario: Modulateur abîmé
- **GIVEN** un export dont un modulateur a une source inconnue
- **WHEN** l'utilisateur l'importe
- **THEN** l'entrée est lue, l'instance garde son décalage fixe et aucune entrée n'est rejetée

#### Scenario: Nouveau texte
- **GIVEN** un S+lettres et un verrou
- **WHEN** un autre texte est mis en pistes
- **THEN** le verrou disparaît et le S+n reste modulé par les lettres

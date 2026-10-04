# lipogramme Specification

## Purpose
Priver un texte d'une lettre en remplaçant chaque mot qui la contient par un voisin du dictionnaire, et combiner cette contrainte au S+7 sur la page à pistes.

## Requirements

### Requirement: Remplacement par un voisin sans la lettre
The system SHALL replace every noun, adjective, adverb or verb containing the forbidden letter with the first word that follows it in dictionary order, of the same category and the same features, that does not contain the letter; nouns and adjectives keep their gender and number, verbs keep their tense and person (their gender and number for a past participle); the auxiliaries « être » and « avoir » stay unchanged.

#### Scenario: Nom fautif
- **GIVEN** la lettre « e » interdite et un nom qui contient « e »
- **WHEN** le lipogramme s'applique
- **THEN** le nom est remplacé par le premier nom suivant, au même genre et au même nombre, qui ne contient pas « e »

#### Scenario: Lettre accentuée
- **GIVEN** la lettre « a » interdite et les mots « âtre », « à » et « cœur »
- **WHEN** le lipogramme s'applique
- **THEN** « âtre » et « à » contiennent la lettre, comme chez Perec : une lettre accentuée compte pour la lettre nue, une ligature (« œ », « æ ») pour ses deux lettres

#### Scenario: Verbe fautif
- **GIVEN** la lettre « e » interdite et « elle mangeait »
- **WHEN** le lipogramme s'applique
- **THEN** « mangeait » est remplacé par le premier verbe suivant dont l'imparfait, troisième personne du singulier, ne contient pas « e »

#### Scenario: Aucun verbe sans la lettre
- **GIVEN** un verbe fautif dont aucun verbe suivant n'a de forme sans la lettre à ce temps et à cette personne
- **WHEN** le lipogramme s'applique
- **THEN** le verbe reste tel quel avec la raison « aucun voisin sans la lettre »

### Requirement: Réaccord
The system SHALL re-agree determiners, adjectives, attributes and pronouns with a replaced noun, as the S+7 does.

#### Scenario: Déterminant
- **GIVEN** un nom féminin remplacé par un nom masculin
- **WHEN** le texte résultant s'affiche
- **THEN** son déterminant est au masculin

### Requirement: Élision de l'article
The system SHALL elide « le » or « la » into « l’ » before a new word that begins with a vowel or a mute h, and SHALL restore « l’ » into « le » or « la » before a new word that begins with a consonant, with the gender of the new word, else of the replaced word, else the masculine.

#### Scenario: Adjectif nouveau à initiale consonantique
- **GIVEN** le texte « L'enceinte maison. » et la lettre interdite « n »
- **WHEN** le lipogramme s'applique
- **THEN** le résultat est « La fermée ville. », et non « L'fermée ville. »

### Requirement: Mots-outils
The system SHALL replace a function word containing the forbidden letter with an equivalent of the same function from a table, and SHALL remove and count it when no equivalent exists; a removed word SHALL keep the line breaks and punctuation of the spacing before it, following the shared rule for removed words.

#### Scenario: Pas d'équivalent
- **GIVEN** un mot-outil fautif sans équivalent dans la table
- **WHEN** le lipogramme s'applique
- **THEN** le mot disparaît du texte résultant et le résumé le compte

#### Scenario: Mot-outil en tête de vers
- **GIVEN** un poème dont un vers commence par un mot-outil fautif sans équivalent
- **WHEN** le lipogramme s'applique
- **THEN** le mot disparaît et le vers reste sur sa propre ligne

### Requirement: Chaîne de plugins
The system SHALL apply installed plugins in order, each receiving the previous plugin's output, with the S+7 before the lipogram by default, and SHALL let the user change the order.

#### Scenario: S+7 puis lipogramme
- **GIVEN** le S+7 et le lipogramme en marche
- **WHEN** le texte résultant s'affiche
- **THEN** les noms sont ceux du S+7, privés de la lettre interdite

#### Scenario: Lipogrammes enchaînés
- **GIVEN** un lipogramme en a suivi d'un lipogramme en e
- **WHEN** le texte résultant s'affiche
- **THEN** le second cherche des voisins sans « a » ni « e » : un lipogramme ne réintroduit pas une lettre bannie par un lipogramme placé avant lui

#### Scenario: Lettres permises puis lettres interdites
- **GIVEN** un lipogramme en mode « permises » sur « lucie » suivi d'un lipogramme en mode « interdites » sur « u »
- **WHEN** le texte résultant s'affiche
- **THEN** le second cherche des voisins qui n'emploient que l, c, i et e : il cumule les lettres bannies par le premier et les siennes

### Requirement: Réglage en direct
The system SHALL update the result text without re-tagging when the lipogram is switched on or off, its letters or its mode change, or the chain order changes.

#### Scenario: Changer de lettre
- **GIVEN** un texte de 200 mots mis en pistes
- **WHEN** la saisie passe de « e » à « a »
- **THEN** le texte résultant change en moins d'une demi-seconde, sans nouvel étiquetage

#### Scenario: Changer de mode
- **GIVEN** un lipogramme sur « e »
- **WHEN** le mode passe de « interdites » à « permises »
- **THEN** le texte résultant n'emploie plus que la lettre « e » parmi les lettres de a à z, partout où un voisin existe

### Requirement: Résumé et mention de la chaîne
The system SHALL describe the whole active chain in the summary and in the note appended to the copied text, and SHALL count replaced words, removed words and words that keep a banned letter. A lipogram SHALL be named « lipogramme en » followed by its letters separated by commas in « interdites » mode, and « lipogramme seulement en » followed by its letters in « permises » mode.

#### Scenario: Copie
- **GIVEN** le S+7 et le lipogramme en « e » en marche
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — S+7, parmi tous les noms · lipogramme en e (Oulipao) »

#### Scenario: Plusieurs lettres
- **GIVEN** un lipogramme en mode « interdites » sur « ae », seul dans la chaîne
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — lipogramme en a, e (Oulipao) »

#### Scenario: Lettres permises
- **GIVEN** un lipogramme en mode « permises » sur « Lucie », seul dans la chaîne
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — lipogramme seulement en l, u, c, i, e (Oulipao) »

### Requirement: Emplacement « Toutes les pistes »
The system SHALL show a plugin slot for all tracks below the mixer's five tracks, where the lipogram is plugged.

#### Scenario: Table de mixage
- **GIVEN** la page à pistes
- **WHEN** la table de mixage s'affiche
- **THEN** un emplacement « Toutes les pistes » apparaît sous les cinq pistes et porte le lipogramme

### Requirement: Paramètres « Lettres » et « Mode »
The system SHALL declare two parameters for the Lipogram plugin: « Lettres », a text parameter, « e » by default, and « Mode », a choice between « interdites » (default) and « permises ». Only letters SHALL count in the input: spaces, punctuation and digits are ignored, and an accented letter or a ligature counts as its bare letters. In « interdites » mode the banned letters are those typed; in « permises » mode they are all the letters of a to z absent from the input.

#### Scenario: Ouverture
- **GIVEN** la page à pistes
- **WHEN** le lipogramme est mis en marche
- **THEN** le mode est « interdites » et la lettre interdite est « e »

#### Scenario: Plusieurs lettres interdites
- **GIVEN** le mode « interdites » et la saisie « a, e »
- **WHEN** le lipogramme s'applique
- **THEN** chaque mot qui contient « a » ou « e » est remplacé par le premier voisin sans aucune des deux

#### Scenario: Beau présent
- **GIVEN** le mode « permises » et la saisie « Lucie »
- **WHEN** le lipogramme s'applique
- **THEN** les lettres bannies sont toutes celles de a à z sauf l, u, c, i et e, et « é » passe puisque « e » est permise

#### Scenario: Aucune lettre permise
- **GIVEN** le mode « permises » et un champ vide
- **WHEN** le lipogramme s'applique
- **THEN** le lipogramme n'agit pas et son aide dit qu'aucune lettre n'est saisie

### Requirement: Mot inconnu signalé
The system SHALL leave a word containing the forbidden letter that is absent from the dictionary unchanged with the reason « absent du dictionnaire », distinct from the reason given when the dictionary has no neighbour without the letter.

#### Scenario: Mot absent du dictionnaire
- **GIVEN** la lettre « e » interdite et le nom « zerbinette », absent du dictionnaire
- **WHEN** le lipogramme s'applique
- **THEN** le mot reste tel quel avec la raison « absent du dictionnaire »

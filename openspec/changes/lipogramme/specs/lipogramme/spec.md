# Lipogramme

## Purpose
Priver un texte d'une lettre en remplaçant chaque mot qui la contient par un voisin du dictionnaire, et combiner cette contrainte au S+7 sur la page à pistes.

## ADDED Requirements

### Requirement: Paramètre « Lettre »
The system SHALL provide a Lipogram plugin, written against the internal plugin contract, declaring a single "Lettre" parameter whose values are the 26 letters a to z, "e" by default.

#### Scenario: Ouverture
- **GIVEN** la page à pistes
- **WHEN** le lipogramme est mis en marche
- **THEN** la lettre interdite est « e »

### Requirement: Remplacement par un voisin sans la lettre
The system SHALL replace every noun, adjective or adverb containing the forbidden letter with the first word that follows it in dictionary order, of the same category and the same features, that does not contain the letter; nouns and adjectives keep their gender and number.

#### Scenario: Nom fautif
- **GIVEN** la lettre « e » interdite et un nom qui contient « e »
- **WHEN** le lipogramme s'applique
- **THEN** le nom est remplacé par le premier nom suivant, au même genre et au même nombre, qui ne contient pas « e »

### Requirement: Réaccord
The system SHALL re-agree determiners, adjectives, attributes and pronouns with a replaced noun, as the S+7 does.

#### Scenario: Déterminant
- **GIVEN** un nom féminin remplacé par un nom masculin
- **WHEN** le texte résultant s'affiche
- **THEN** son déterminant est au masculin

### Requirement: Mots-outils
The system SHALL replace a function word containing the forbidden letter with an equivalent of the same function from a table, and SHALL remove and count it when no equivalent exists.

#### Scenario: Pas d'équivalent
- **GIVEN** un mot-outil fautif sans équivalent dans la table
- **WHEN** le lipogramme s'applique
- **THEN** le mot disparaît du texte résultant et le résumé le compte

### Requirement: Verbes laissés en v1
The system SHALL leave verbs containing the forbidden letter unchanged and SHALL count them in the summary.

#### Scenario: Verbe fautif
- **GIVEN** un verbe qui contient la lettre interdite
- **WHEN** le lipogramme s'applique
- **THEN** le verbe reste tel quel et le résumé le compte

### Requirement: Chaîne de plugins
The system SHALL apply installed plugins in order, each receiving the previous plugin's output, with the S+7 before the lipogram by default, and SHALL let the user change the order.

#### Scenario: S+7 puis lipogramme
- **GIVEN** le S+7 et le lipogramme en marche
- **WHEN** le texte résultant s'affiche
- **THEN** les noms sont ceux du S+7, privés de la lettre interdite

### Requirement: Réglage en direct
The system SHALL update the result text without re-tagging when the lipogram is switched on or off, its letter changes, or the chain order changes.

#### Scenario: Changer de lettre
- **GIVEN** un texte de 200 mots mis en pistes
- **WHEN** la lettre passe de « e » à « a »
- **THEN** le texte résultant change en moins d'une demi-seconde, sans nouvel étiquetage

### Requirement: Résumé et mention de la chaîne
The system SHALL describe the whole active chain in the summary and in the note appended to the copied text, and SHALL count replaced words, removed words and verbs that keep the letter.

#### Scenario: Copie
- **GIVEN** le S+7 et le lipogramme en « e » en marche
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — S+7, parmi tous les noms · lipogramme en e (Potao) »

### Requirement: Emplacement « Toutes les pistes »
The system SHALL show a plugin slot for all tracks below the mixer's five tracks, where the lipogram is plugged.

#### Scenario: Table de mixage
- **GIVEN** la page à pistes
- **WHEN** la table de mixage s'affiche
- **THEN** un emplacement « Toutes les pistes » apparaît sous les cinq pistes et porte le lipogramme

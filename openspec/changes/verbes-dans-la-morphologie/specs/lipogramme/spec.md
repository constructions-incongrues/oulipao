# Spec Delta

## MODIFIED Requirements

### Requirement: Remplacement par un voisin sans la lettre
The system SHALL replace every noun, adjective, adverb or verb containing the forbidden letter with the first word that follows it in dictionary order, of the same category and the same features, that does not contain the letter; nouns and adjectives keep their gender and number, verbs keep their tense and person (their gender and number for a past participle); the auxiliaries « être » and « avoir » stay unchanged.

#### Scenario: Nom fautif
- **GIVEN** la lettre « e » interdite et un nom qui contient « e »
- **WHEN** le lipogramme s'applique
- **THEN** le nom est remplacé par le premier nom suivant, au même genre et au même nombre, qui ne contient pas « e »

#### Scenario: Verbe fautif
- **GIVEN** la lettre « e » interdite et « elle mangeait »
- **WHEN** le lipogramme s'applique
- **THEN** « mangeait » est remplacé par le premier verbe suivant dont l'imparfait, troisième personne du singulier, ne contient pas « e »

#### Scenario: Aucun verbe sans la lettre
- **GIVEN** un verbe fautif dont aucun verbe suivant n'a de forme sans la lettre à ce temps et à cette personne
- **WHEN** le lipogramme s'applique
- **THEN** le verbe reste tel quel avec la raison « aucun voisin sans la lettre »

### Requirement: Résumé et mention de la chaîne
The system SHALL describe the whole active chain in the summary and in the note appended to the copied text, and SHALL count replaced words, removed words and words that keep the letter.

#### Scenario: Copie
- **GIVEN** le S+7 et le lipogramme en « e » en marche
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — S+7, parmi tous les noms · lipogramme en e (Oulipao) »

## REMOVED Requirements

### Requirement: Verbes laissés en v1
**Reason**: la morphologie connaît désormais les verbes ; le lipogramme les remplace comme les autres mots pleins.
**Migration**: les verbes fautifs sont remplacés par un voisin sans la lettre (exigence « Remplacement par un voisin sans la lettre ») ; ceux qui n'en ont pas restent avec une raison et sont comptés parmi les mots qui gardent la lettre.

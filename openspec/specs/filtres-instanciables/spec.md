# filtres-instanciables Specification

## Purpose
Brancher plusieurs exemplaires d'une même contrainte, chacun visant ses pistes, dans une seule chaîne en série.

## Requirements

### Requirement: Pistes déclarées par type
The system SHALL let each constraint type declare the tracks it can handle and its default target tracks: nouns and adjectives for S+n (nouns by default), all five tracks for the lipogram (all by default).

#### Scenario: Pistes du S+n
- **GIVEN** une instance de S+n
- **WHEN** on choisit ses pistes
- **THEN** seules les pistes des noms et des adjectifs sont proposées

### Requirement: Instances ordonnées
The system SHALL hold the mixer's constraints as an ordered list of instances, each with an identifier, a type, an enabled flag, its settings and its target tracks, validated by a schema.

#### Scenario: Deux S+n
- **GIVEN** la page à pistes
- **WHEN** on ajoute un second S+n réglé à 3
- **THEN** les deux S+n coexistent avec des réglages indépendants

### Requirement: Ajouter, dupliquer, retirer
The system SHALL let the user add an instance of a type, duplicate it or remove it; an added instance takes its type's default settings and targets and goes to the end of the chain.

#### Scenario: Dupliquer
- **GIVEN** une instance de lipogramme en « a »
- **WHEN** on la duplique
- **THEN** une seconde instance en « a » apparaît en fin de chaîne

### Requirement: Pistes visées
The system SHALL let the user choose an instance's target tracks among those its type handles, at least one.

#### Scenario: Lipogramme sur les noms
- **GIVEN** un lipogramme en « e » visant les seuls noms
- **WHEN** le texte résultant s'affiche
- **THEN** seuls les noms ont perdu la lettre

### Requirement: S+n sur les adjectifs
The system SHALL replace each targeted adjective with the n-th adjective that follows it in dictionary order, in the same gender and number, counting all adjectives (the « Parmi » setting applies to nouns only).

#### Scenario: S+3 sur les adjectifs
- **GIVEN** un S+3 visant les adjectifs
- **WHEN** le texte résultant s'affiche
- **THEN** chaque adjectif est remplacé et garde son genre et son nombre

### Requirement: Portée d'un filtre
The system SHALL let a filter touch only the words of its target tracks, except for the re-agreement caused by a replaced noun.

#### Scenario: S+n sur les noms seuls
- **GIVEN** un S+n visant les seuls noms
- **WHEN** il s'applique
- **THEN** les adjectifs ne changent que pour s'accorder au nouveau nom

### Requirement: Chaîne réordonnable
The system SHALL apply the instances in series in the displayed order, let the user move an instance, and update the result without re-tagging.

#### Scenario: Monter une instance
- **GIVEN** un S+7 puis un lipogramme
- **WHEN** on monte le lipogramme
- **THEN** le texte résultant suit le nouvel ordre

### Requirement: Rappel sur les tranches
The system SHALL show on each track strip the instances targeting that track.

#### Scenario: Tranche des adjectifs
- **GIVEN** un S+3 visant les adjectifs
- **WHEN** la table de mixage s'affiche
- **THEN** la tranche des adjectifs rappelle ce S+3

### Requirement: Résumé et mention par instance
The system SHALL describe each active instance in the summary and in the note appended to the copied text, naming its target tracks unless the instance targets every track its type can handle.

#### Scenario: Copie
- **GIVEN** un S+7 sur les noms, un S+3 sur les adjectifs et un lipogramme en e
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — S+7 sur les noms · S+3 sur les adjectifs · lipogramme en e (Oulipao) », le lipogramme visant toutes ses pistes

#### Scenario: Lipogramme ciblé dans la mention
- **GIVEN** un lipogramme en « e » visant les seuls noms
- **WHEN** le texte résultant est copié
- **THEN** la mention dit « lipogramme en e sur les noms »

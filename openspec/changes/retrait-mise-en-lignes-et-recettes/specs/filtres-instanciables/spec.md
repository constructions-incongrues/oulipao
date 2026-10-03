# Spec Delta

## MODIFIED Requirements

### Requirement: Pistes déclarées par type
The system SHALL let each constraint type declare the tracks it can handle and its default target tracks: nouns, adjectives and verbs for S+n (nouns by default), all five tracks for the lipogram (all by default), all five tracks for Tri par piste (nouns by default); a type MAY instead declare itself non-targetable, in which case its instances act on every track and offer no track choice.

#### Scenario: Pistes du S+n
- **GIVEN** une instance de S+n
- **WHEN** on choisit ses pistes
- **THEN** seules les pistes des noms, des adjectifs et des verbes sont proposées

#### Scenario: Type non ciblable
- **GIVEN** une instance de Bord
- **WHEN** la chaîne s'affiche
- **THEN** aucune piste n'est proposée et l'instance agit sur toutes

### Requirement: Ajouter, dupliquer, retirer
The system SHALL let the user add an instance of a type from the constraint browser, duplicate it or remove it; an added instance takes its type's default settings and targets and goes to the end of the chain.

#### Scenario: Dupliquer
- **GIVEN** une instance de lipogramme en « a »
- **WHEN** on la duplique
- **THEN** une seconde instance en « a » apparaît en fin de chaîne

### Requirement: Pistes visées
The system SHALL let the user choose a targetable instance's target tracks among those its type handles, at least one.

#### Scenario: Lipogramme sur les noms
- **GIVEN** un lipogramme en « e » visant les seuls noms
- **WHEN** le texte résultant s'affiche
- **THEN** seuls les noms ont perdu la lettre

### Requirement: Portée d'un filtre
The system SHALL let a filter touch only the words of its target tracks, except for the re-agreement caused by a replaced noun, for a Tri par piste in « ne garder que » mode, which removes the words outside its target tracks, and for non-targetable filters, which act on every word.

#### Scenario: S+n sur les noms seuls
- **GIVEN** un S+n visant les seuls noms
- **WHEN** il s'applique
- **THEN** les adjectifs ne changent que pour s'accorder au nouveau nom

#### Scenario: Ne garder que les noms
- **GIVEN** un Tri par piste en mode « ne garder que » visant les noms
- **WHEN** il s'applique
- **THEN** seuls les noms restent dans le texte résultant

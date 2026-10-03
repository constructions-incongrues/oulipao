# Spec Delta

## MODIFIED Requirements

### Requirement: Pistes déclarées par type
The system SHALL let each constraint type declare the tracks it can handle and its default target tracks: nouns, adjectives and verbs for S+n (nouns by default), all five tracks for the lipogram (all by default).

#### Scenario: Pistes du S+n
- **GIVEN** une instance de S+n
- **WHEN** on choisit ses pistes
- **THEN** seules les pistes des noms, des adjectifs et des verbes sont proposées

## ADDED Requirements

### Requirement: S+n sur les verbes
The system SHALL replace each targeted verb, auxiliaries excepted, with the n-th verb that follows it in dictionary order, at the same tense and person (same gender and number for a past participle), counting all verbs (the « Parmi » setting applies to nouns only); with n = 7 this is the Oulipo's V+7.

#### Scenario: S+7 sur les verbes
- **GIVEN** un S+7 visant les verbes et la phrase « nous mangions »
- **WHEN** le texte résultant s'affiche
- **THEN** « mangions » devient l'imparfait, première personne du pluriel, du septième verbe qui suit « manger »

#### Scenario: Mention
- **GIVEN** un S+7 sur les noms et un S+7 sur les verbes
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — S+7 sur les noms · S+7 sur les verbes (Oulipao) »

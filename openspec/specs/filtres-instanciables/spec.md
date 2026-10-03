# filtres-instanciables Specification

## Purpose
Brancher plusieurs exemplaires d'une même contrainte, chacun visant ses pistes, dans une seule chaîne en série.

## Requirements

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

### Requirement: Instances ordonnées
The system SHALL hold the mixer's constraints as an ordered list of instances, each with an identifier, a type, an enabled flag, its settings and its target tracks, validated by a schema.

#### Scenario: Deux S+n
- **GIVEN** la page à pistes
- **WHEN** on ajoute un second S+n réglé à 3
- **THEN** les deux S+n coexistent avec des réglages indépendants

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

### Requirement: S+n sur les adjectifs
The system SHALL replace each targeted adjective with the n-th adjective that follows it in dictionary order, in the same gender and number, counting all adjectives (the « Parmi » setting applies to nouns only).

#### Scenario: S+3 sur les adjectifs
- **GIVEN** un S+3 visant les adjectifs
- **WHEN** le texte résultant s'affiche
- **THEN** chaque adjectif est remplacé et garde son genre et son nombre

### Requirement: Portée d'un filtre
The system SHALL let a filter touch only the words of its target tracks whose steps are open, except for the re-agreement caused by a replaced noun, for a Tri par piste in « ne garder que » mode, which removes the words outside its target tracks, and for non-targetable filters, which act on every word but neither remove nor replace a word whose step is closed; it SHALL use for a word the value locked for that instance and that word when there is one.

#### Scenario: S+n sur les noms seuls
- **GIVEN** un S+n visant les seuls noms
- **WHEN** il s'applique
- **THEN** les adjectifs ne changent que pour s'accorder au nouveau nom

#### Scenario: Pas bouché
- **GIVEN** un S+7 sur les noms et le pas de « horloge » bouché
- **WHEN** il s'applique
- **THEN** « horloge » et son groupe nominal restent tels quels

#### Scenario: Ne garder que les noms
- **GIVEN** un Tri par piste en mode « ne garder que » visant les noms
- **WHEN** il s'applique
- **THEN** seuls les noms restent dans le texte résultant

### Requirement: Chaîne réordonnable
The system SHALL apply the instances in series in the displayed order, number them from 1 in that order, and let the user move an instance either by dragging its grip onto another position, a mark showing where it will land, or with move-up and move-down buttons usable by keyboard and touch; the result SHALL update without re-tagging.

#### Scenario: Monter une instance
- **GIVEN** un S+7 puis un lipogramme
- **WHEN** on monte le lipogramme avec son bouton ↑
- **THEN** le lipogramme porte le numéro 1 et le texte résultant suit le nouvel ordre

#### Scenario: Glisser une instance
- **GIVEN** trois filtres
- **WHEN** l'utilisateur glisse la poignée du troisième au-dessus du premier
- **THEN** un trait marque la place pendant le geste, puis le troisième devient le premier

#### Scenario: Bords de la chaîne
- **GIVEN** une chaîne de deux filtres
- **WHEN** elle s'affiche
- **THEN** le bouton ↑ du premier et le bouton ↓ du second sont désactivés

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

### Requirement: Lignes de la chaîne
The system SHALL show the chain above the step grid, one line per instance, all lines of the same width with the grip, number, name, settings, target tracks, on/off button and move, duplicate and remove buttons in aligned columns, followed by a line to add an instance of an installed type.

#### Scenario: Deux filtres
- **GIVEN** un S+7 et un lipogramme
- **WHEN** la chaîne s'affiche sur un écran de 1280 px
- **THEN** les deux lignes ont la même largeur et leurs pistes visées commencent à la même abscisse

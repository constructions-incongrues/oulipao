# ordres-du-s7 Specification

## Purpose
Ranger la liste que parcourt le S+n selon une échelle affective publiée (valence, intensité ou concrétude), pour faire glisser un texte du mineur au majeur par la même règle explicite que le S+7.

## Requirements

### Requirement: Paramètre d'ordre
The system SHALL offer on every S+n instance an « Ordre » choice among « alphabétique », « valence », « intensité » and « concrétude », « alphabétique » by default. The offset, its lock and modulation, the « Parmi » mode and the die draw SHALL apply unchanged to the chosen order. An instance saved without an order SHALL read back with the alphabetical order.

#### Scenario: Ordre par défaut
- **GIVEN** une nouvelle instance S+n
- **WHEN** elle est branchée
- **THEN** son ordre vaut « alphabétique » et elle transforme le texte comme avant ce changement

#### Scenario: Chaîne ancienne
- **GIVEN** une chaîne gardée au carnet avant ce changement
- **WHEN** elle est rouverte
- **THEN** ses instances S+n sont en ordre alphabétique et le texte résultant est identique

### Requirement: Échelle par catégorie
The system SHALL, for a non-alphabetical order, replace each targeted noun or adjective by the n-th lemma following it in the scale of its own category (nouns with nouns, adjectives with adjectives), sorted by increasing score: increasing valence (from the darkest to the lightest), increasing arousal (from the calmest to the most intense), or increasing concreteness (from the most abstract to the most concrete). A negative offset SHALL move toward the lower end. Agreement in gender and number, elision and re-agreement SHALL behave as with the alphabetical order. Moving past either end of a scale SHALL wrap around, as with the dictionary.

#### Scenario: Vers le majeur
- **GIVEN** une échelle de valence des noms où « dédain » est suivi de « avidité », « matons », « opium »
- **WHEN** un texte contenant « le dédain » est transformé par un S+n d'ordre « valence » et de décalage 3
- **THEN** le nom devient le troisième lemme suivant sur l'échelle, au même nombre, et son déterminant est réaccordé

#### Scenario: Vers le mineur
- **GIVEN** la même échelle
- **WHEN** le décalage vaut −3
- **THEN** le nom devient le troisième lemme précédent sur l'échelle

#### Scenario: Concrétude sans adjectifs
- **GIVEN** l'ordre « concrétude », qui n'a d'échelle que pour les noms
- **WHEN** l'instance vise aussi les adjectifs
- **THEN** les adjectifs restent tels quels, avec la raison « sans note »

### Requirement: Mots sans note immobiles
The system SHALL leave unchanged any targeted word whose lemma has no score on the chosen scale, and mark it with the reason « sans note ». A word with a score SHALL only be replaced by a lemma that also has a score on that scale.

#### Scenario: Seule la tierce bouge
- **GIVEN** la phrase « le deuil de la table » où seul « deuil » a une note de valence
- **WHEN** elle est transformée par un S+n d'ordre « valence »
- **THEN** « deuil » est remplacé, « table » reste et porte la raison « sans note »

### Requirement: Verbes hors des échelles
The system SHALL leave verbs untouched for a non-alphabetical order, and the instance help SHALL say that the order applies to nouns and adjectives only.

#### Scenario: Piste des verbes visée
- **GIVEN** un S+n d'ordre « valence » qui vise les noms et les verbes
- **WHEN** le texte est transformé
- **THEN** les noms notés sont remplacés et les verbes restent tels quels

### Requirement: Titre selon l'ordre
The system SHALL title an S+n instance « V », « I » or « C » followed by its signed offset for the valence, arousal and concreteness orders (for example « V+3 », « I−2 », « C+7 »), and « V+dé », « I+dé », « C+dé » with the die draw; the alphabetical order SHALL keep the existing titles. The help SHALL name the scale and say that it comes from published French affective norms.

#### Scenario: Titre en valence
- **GIVEN** une instance S+n d'ordre « valence » et de décalage 3 sur les noms
- **WHEN** la chaîne est affichée ou mentionnée au carnet
- **THEN** l'instance s'appelle « V+3 » et sa bande d'inspecteur « V+3 sur les noms »

### Requirement: Note dans l'inspecteur
The system SHALL show, in the inspector band of an S+n instance with a non-alphabetical order, for each replaced word, the score of the original lemma and of the new lemma on the chosen scale, as a whole number from 0 to 100.

#### Scenario: Deux notes
- **GIVEN** un mot remplacé par un V+3
- **WHEN** il est choisi dans l'inspecteur
- **THEN** sa bande « V+3 » montre la note de valence du mot d'origine et celle du mot nouveau, la seconde plus haute

### Requirement: Échelles chargées à la demande
The system SHALL load the scales only when an instance uses a non-alphabetical order, in the browser, without any server; while they load or if loading fails, the instance SHALL leave the text unchanged and the interface SHALL say so and offer to retry, as for the phonetics.

#### Scenario: Premier choix d'une échelle
- **GIVEN** une page où aucune échelle n'est chargée
- **WHEN** le fondateur choisit l'ordre « valence »
- **THEN** les échelles sont chargées, puis le texte est transformé

#### Scenario: Échec du chargement
- **GIVEN** un chargement des échelles qui échoue
- **WHEN** l'ordre « valence » est choisi
- **THEN** le texte reste inchangé par cette instance et un message propose de relancer

### Requirement: Provenance des échelles
The system SHALL derive the scales reproducibly from the French affective norms distributed by openlexicon under CC BY-SA 4.0 (Gobin et al. 2017; Bonin et al. 2018; Bonin et al. 2003; Gilet et al. 2012): each entry SHALL be reduced to a lemma and a category known to the morphology, each source SHALL be normalised by rank, and a lemma present in several sources SHALL get the mean of its normalised ranks. The derived data SHALL be distributed separately from the code under CC BY-SA 4.0 with the attribution of the four sources, and loaded data SHALL be validated before use.

#### Scenario: Reconstruction
- **GIVEN** les quatre tables sources et la morphologie
- **WHEN** la commande de construction des échelles est relancée
- **THEN** le fichier produit est identique à celui du dépôt

#### Scenario: Entrée hors morphologie
- **GIVEN** une entrée source qui n'est ni un nom ni un adjectif connu de la morphologie (« que »)
- **WHEN** les échelles sont construites
- **THEN** l'entrée n'apparaît dans aucune échelle et le script la compte parmi les entrées écartées

#### Scenario: Attribution
- **GIVEN** le fichier d'échelles livré
- **WHEN** on lit son en-tête et la liste des licences tierces
- **THEN** on y trouve la licence CC BY-SA 4.0 et les quatre références

# Moteur S+7 accordé sur les noms

## Purpose
Transformer un texte français par S+7 sur les noms en gardant des groupes nominaux grammaticalement corrects.

## Requirements

### Requirement: Substitution des noms par décalage
The system SHALL, given a text, its tagged words, an offset n and a mode, return the transformed text and the list of substitutions (original word, new word, position), replacing each common noun by the n-th following lemma in the alphabetically sorted noun dictionary.

#### Scenario: Décalage de 7
- **GIVEN** un texte dont les mots sont étiquetés et un dictionnaire de noms
- **WHEN** le moteur est appelé avec n = 7
- **THEN** chaque nom est remplacé par le septième lemme suivant et la liste des substitutions est rendue

### Requirement: Nom inconnu laissé et signalé
The system SHALL leave unchanged, and flag in the substitution list, any noun whose lemma is absent from the dictionary.

#### Scenario: Lemme absent du dictionnaire
- **GIVEN** un nom dont le lemme n'est pas dans le dictionnaire
- **WHEN** le texte est transformé
- **THEN** ce nom reste inchangé et apparaît comme signalé dans la liste

### Requirement: Conservation du nombre
The system SHALL keep the number of the original noun, and leave the noun unchanged and flagged when the new lemma has no form for that number.

#### Scenario: Nom au pluriel
- **GIVEN** un nom au pluriel
- **WHEN** il est remplacé
- **THEN** le nouveau nom est au pluriel

### Requirement: Mode même genre
The system SHALL, in same-gender mode, count only lemmas of the same gender as the replaced noun, an epicene noun keeping the gender it has in the sentence.

#### Scenario: Nom féminin en mode même genre
- **GIVEN** un nom féminin et le mode « même genre »
- **WHEN** il est remplacé avec n = 7
- **THEN** le nouveau nom est le septième lemme féminin suivant

### Requirement: Mode réaccord
The system SHALL, in re-agreement mode, give the gender of the new noun to its determiner, to the adjectives contiguous, coordinated or apposed to the noun, to the subject complement after a linking verb, to the participle after être, and to a subject pronoun whose only possible antecedent in the sentence is that noun.

#### Scenario: Changement de genre
- **GIVEN** un groupe « la vieille ferme » et un nouveau nom masculin
- **WHEN** le texte est transformé en mode « réaccord »
- **THEN** le déterminant et l'adjectif sont au masculin

#### Scenario: Déterminant variable
- **GIVEN** un groupe « Certaines choses » et un nouveau nom masculin
- **WHEN** le texte est transformé en mode « réaccord »
- **THEN** le déterminant devient « Certains »

#### Scenario: Attribut du sujet
- **GIVEN** la phrase « la maison paraissait plus grande » et un nouveau nom masculin
- **WHEN** le texte est transformé en mode « réaccord »
- **THEN** l'attribut devient « grand »

#### Scenario: Pronom de reprise sans ambiguïté
- **GIVEN** la phrase « Ma tante est triste, elle a été heureuse » et un nouveau nom masculin
- **WHEN** le texte est transformé en mode « réaccord »
- **THEN** le pronom devient « il » et son attribut « heureux »

#### Scenario: Pronom de reprise ambigu
- **GIVEN** un pronom sujet dont l'antécédent peut être un nom propre ou un nom d'une autre phrase
- **WHEN** le texte est transformé
- **THEN** le pronom est laissé tel quel

### Requirement: Élision et contraction
The system SHALL, in both modes, recompute elision and contraction from the initial of the new first word of the noun group, respecting aspirated h.

#### Scenario: Nouveau nom à initiale vocalique
- **GIVEN** un groupe « le village » et un nouveau nom commençant par une voyelle ou un h muet
- **WHEN** le texte est transformé
- **THEN** le déterminant est élidé

#### Scenario: Contraction défaite
- **GIVEN** un groupe « du village » et un nouveau nom féminin en mode « réaccord »
- **WHEN** le texte est transformé
- **THEN** « du » devient « de la »

### Requirement: Déterminisme
The system SHALL return the same output for the same inputs.

#### Scenario: Deux exécutions
- **GIVEN** un texte, un décalage et un mode
- **WHEN** le moteur est appelé deux fois
- **THEN** les deux sorties sont identiques

### Requirement: Casse et ponctuation conservées
The system SHALL preserve the case and punctuation of the original text.

#### Scenario: Nom en tête de phrase
- **GIVEN** un nom portant une majuscule en début de phrase
- **WHEN** il est remplacé
- **THEN** le nouveau nom porte la majuscule et la ponctuation est inchangée

### Requirement: Transformation dans le navigateur
The system SHALL perform the transformation entirely in the browser, with no network request containing the text, and without any generative model or random draw.

#### Scenario: Transformation observée dans l'onglet réseau
- **GIVEN** la page d'essai ouverte avec l'onglet réseau
- **WHEN** un texte est transformé
- **THEN** aucune requête ne contient le texte

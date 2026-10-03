# Essai technique : lexique libre et étiquetage dans le navigateur

## Purpose
Décider, chiffres à l'appui, si l'étiquetage grammatical du français dans le navigateur et un lexique libre permettent de construire l'interface à pistes de Potao.

## Requirements

### Requirement: Étiquetage d'un texte collé
The system SHALL accept a pasted text on the test page and display each word with its category among nom, verbe, adjectif, adverbe and autre.

#### Scenario: Texte de prose collé
- **GIVEN** la page d'essai ouverte dans un navigateur
- **WHEN** l'utilisateur colle un texte de 200 mots
- **THEN** chaque mot est affiché avec une des cinq catégories

### Requirement: Comparaison avec l'annotation manuelle
The system SHALL compare a tagger's output with a hand-annotated reference and report, per text, the number of correctly classified words out of the total and the list of errors.

#### Scenario: Comparaison sur un texte de référence
- **GIVEN** un texte de référence annoté à la main et la sortie d'un étiqueteur sur ce texte
- **WHEN** la comparaison est lancée
- **THEN** le nombre de mots bien classés, le total et la liste des erreurs sont produits

### Requirement: Recensement des lexiques
The results file SHALL state, for each lexicon examined, its exact licence, whether redistribution is allowed, its number of common nouns, and whether gender and number are present.

#### Scenario: Lexique examiné
- **GIVEN** un lexique candidat
- **WHEN** il a été examiné
- **THEN** le fichier de résultats indique sa licence, son droit de redistribution, son nombre de noms communs et la présence du genre et du nombre

### Requirement: Mesure de chaque approche d'étiquetage
The results file SHALL state, for each tagging approach tried, the accuracy per reference text and the downloaded weight.

#### Scenario: Approche mesurée
- **GIVEN** une approche d'étiquetage et les trois textes de référence
- **WHEN** l'approche a été mesurée
- **THEN** le fichier de résultats donne sa justesse par texte et son poids téléchargé

### Requirement: Décision écrite
The results file SHALL end with a one-line decision.

#### Scenario: Essai terminé
- **GIVEN** les mesures et le recensement terminés
- **WHEN** le fichier de résultats est finalisé
- **THEN** il se termine par « on continue », « on continue avec telle réserve » ou « on repose le pari »

### Requirement: Le texte reste dans le navigateur
The system SHALL process the pasted text entirely in the browser, with no network request containing the text, no account and no storage of the text.

#### Scenario: Étiquetage observé dans l'onglet réseau
- **GIVEN** la page d'essai ouverte avec l'onglet réseau du navigateur
- **WHEN** l'utilisateur colle un texte et lance l'étiquetage
- **THEN** aucune requête ne contient le texte collé

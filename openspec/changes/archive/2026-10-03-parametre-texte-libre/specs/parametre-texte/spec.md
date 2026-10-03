# Spec Delta

## Purpose

Régler un filtre par une saisie courte (un nom, une liste de lettres), en plus de l'entier borné et du choix dans une liste, pour les contraintes qui dépendent d'un mot.

## ADDED Requirements

### Requirement: Paramètre texte
The system SHALL let a constraint plugin declare a text parameter with a key, a label and a maximum length; its value SHALL be a string no longer than that length, validated by a schema, like the integer and choice parameters.

#### Scenario: Déclaration invalide
- **GIVEN** un plugin qui déclare un paramètre texte de longueur maximale nulle
- **WHEN** le plugin est installé
- **THEN** la validation du plugin échoue

#### Scenario: Saisie trop longue
- **GIVEN** un paramètre texte de longueur maximale 40
- **WHEN** une valeur de 41 caractères est réglée
- **THEN** la valeur est refusée et l'instance garde sa valeur précédente

### Requirement: Champ texte réglé en direct
The system SHALL render a text parameter as a labelled single-line text field limited to the parameter's maximum length, reachable by keyboard, and SHALL update the result text as the user types, without re-tagging.

#### Scenario: Saisie
- **GIVEN** un texte de 200 mots mis en pistes et un filtre réglé par un paramètre texte
- **WHEN** l'utilisateur tape une lettre de plus dans le champ
- **THEN** le texte résultant change en moins d'une demi-seconde, sans nouvel étiquetage

#### Scenario: Clavier
- **GIVEN** la chaîne avec un filtre réglé par un paramètre texte
- **WHEN** l'utilisateur parcourt la page au clavier
- **THEN** le champ texte reçoit le focus et porte le libellé du paramètre

### Requirement: Saisie sans effet
The system SHALL treat a text value from which the plugin can draw nothing (empty, or with no usable letter) as a setting under which the filter does not act: the rest of the chain SHALL still apply, and the filter's help SHALL say why it does nothing.

#### Scenario: Champ vidé
- **GIVEN** un S+7 suivi d'un lipogramme
- **WHEN** le champ des lettres du lipogramme est vidé
- **THEN** le texte résultant est celui du S+7 seul, et l'aide du lipogramme dit qu'aucune lettre n'est saisie

### Requirement: Saisie gardée dans le navigateur
The system SHALL keep text parameter values in the page, with no network request containing them.

#### Scenario: Onglet réseau
- **GIVEN** la page des pistes ouverte avec l'onglet réseau
- **WHEN** un nom est tapé dans un paramètre texte
- **THEN** aucune requête ne contient ce nom

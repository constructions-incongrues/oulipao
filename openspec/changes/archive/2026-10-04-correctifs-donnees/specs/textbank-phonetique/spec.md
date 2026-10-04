# Spec Delta

## ADDED Requirements

### Requirement: Empreinte mémoire bornée
The system SHALL hold the whole phonetic textbank, once loaded, in at most 250 MB of JavaScript heap measured after garbage collection under Node, and SHALL still reject every non-conforming line of the file as before (unknown phoneme, wrong rhyme, unknown source).

#### Scenario: Textbank réelle
- **GIVEN** le fichier publié des prononciations
- **WHEN** il est chargé en entier sous Node, puis le ramasse-miettes passe
- **THEN** le tas a grossi d'au plus 250 Mo, et les prononciations, homophones, rimes et finales rendues sont les mêmes qu'avant le changement

#### Scenario: Ligne fausse
- **GIVEN** un fichier de prononciations dont une ligne contient un symbole qui n'est pas un phonème du français
- **WHEN** il est chargé
- **THEN** le chargement échoue en nommant cette ligne

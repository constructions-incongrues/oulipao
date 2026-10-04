# Spec Delta

## MODIFIED Requirements

### Requirement: Lire le carnet
The system SHALL show the notebook as a collapsible panel, collapsed by default, whose header states the total number of entries and, when there is at least one entry, how long ago the most recent one was kept in calendar days (« dernier texte aujourd'hui », « hier », « il y a N jours »). Opened, it SHALL list every kept entry from most recent to oldest, each collapsed by default to one line showing its date, the first line of its resulting text and its chain rule. Unfolded, an entry SHALL show its resulting text (the retouched text when there is one, marked « retouché »), its chain mention starting with a capital letter, and its actions. An entry that has a lineage SHALL show, before its resulting text, the ancestor's text then the parent's text (its own source text), each labelled. An empty notebook SHALL say so.

#### Scenario: Trois textes gardés
- **GIVEN** trois textes gardés les 4, 6 et 9 octobre, et la page ouverte le 12 octobre
- **WHEN** l'utilisateur regarde l'en-tête du carnet
- **THEN** il lit « 3 textes gardés » et « dernier texte il y a 3 jours », sans déplier le panneau
- **AND** une fois le panneau déplié, les textes vont du 9 au 4 octobre, chacun replié sur une ligne avec sa date, ses premiers mots et sa règle

#### Scenario: Dernier texte du jour ou de la veille
- **GIVEN** un texte gardé le 12 octobre à 23 h 50
- **WHEN** la page est ouverte le 12, puis le 13 octobre à 0 h 10
- **THEN** l'en-tête dit « dernier texte aujourd'hui », puis « dernier texte hier »

#### Scenario: Carnet plein
- **GIVEN** huit textes gardés, chacun un poème de douze vers
- **WHEN** l'utilisateur déplie le carnet
- **THEN** le carnet tient sur environ un écran et la saisie reste juste en dessous

#### Scenario: Carnet vide
- **GIVEN** aucun texte gardé
- **WHEN** l'utilisateur ouvre la page des pistes
- **THEN** l'en-tête du carnet indique qu'aucun texte n'est encore gardé, sans nombre de jours

#### Scenario: Texte de deuxième génération
- **GIVEN** une entrée C itérée depuis B, elle-même itérée depuis A
- **WHEN** le panneau du carnet est déplié, puis l'entrée de C
- **THEN** l'entrée de C montre « Ancêtre » suivi du texte de A, « Parent » suivi du texte de B, puis le résultat de C et sa mention
- **AND** une entrée sans filiation ne montre ni ancêtre ni parent

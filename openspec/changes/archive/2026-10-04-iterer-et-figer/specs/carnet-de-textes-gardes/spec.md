# Spec Delta

## MODIFIED Requirements

### Requirement: Lire le carnet
The system SHALL show the notebook as a collapsible panel, collapsed by default, whose header states the total number of entries and, when there is at least one entry, how long ago the most recent one was kept in calendar days (« dernier texte aujourd'hui », « hier », « il y a N jours »). Opened, it SHALL list every kept entry from most recent to oldest, each with its date, its resulting text (the retouched text when there is one, marked « retouché ») and its chain mention. An entry that has a lineage SHALL show, before its resulting text, the ancestor's text then the parent's text (its own source text), each labelled. An empty notebook SHALL say so.

#### Scenario: Trois textes gardés
- **GIVEN** trois textes gardés les 4, 6 et 9 octobre, et la page ouverte le 12 octobre
- **WHEN** l'utilisateur regarde l'en-tête du carnet
- **THEN** il lit « 3 textes gardés » et « dernier texte il y a 3 jours », sans déplier le panneau
- **AND** une fois le panneau déplié, les textes vont du 9 au 4 octobre, chacun avec sa date et sa mention

#### Scenario: Dernier texte du jour ou de la veille
- **GIVEN** un texte gardé le 12 octobre à 23 h 50
- **WHEN** la page est ouverte le 12, puis le 13 octobre à 0 h 10
- **THEN** l'en-tête dit « dernier texte aujourd'hui », puis « dernier texte hier »

#### Scenario: Carnet vide
- **GIVEN** aucun texte gardé
- **WHEN** l'utilisateur ouvre la page des pistes
- **THEN** l'en-tête du carnet indique qu'aucun texte n'est encore gardé, sans nombre de jours

#### Scenario: Texte de deuxième génération
- **GIVEN** une entrée C itérée depuis B, elle-même itérée depuis A
- **WHEN** le panneau du carnet est déplié
- **THEN** l'entrée de C montre « Ancêtre » suivi du texte de A, « Parent » suivi du texte de B, puis le résultat de C et sa mention
- **AND** une entrée sans filiation ne montre ni ancêtre ni parent

### Requirement: Copier une entrée d'un bloc
The system SHALL let the user copy an entry in one block: the source text, a blank line, the result (retouched when there is one), then the chain mention as the copy control appends it. For an entry that has a lineage, the block SHALL start with the ancestor's text and a blank line, before the source text. A status message SHALL confirm the copy or report its failure.

#### Scenario: Copier pour un mail
- **GIVEN** une entrée dont l'original est « La ferme. », le résultat « L'oncle. » et la chaîne un S+7 sur les noms
- **WHEN** l'utilisateur actionne « Copier » sur cette entrée
- **THEN** le presse-papiers contient « La ferme. », une ligne vide, « L'oncle. », une ligne vide, puis « — S+7 sur les noms (Oulipao) »

#### Scenario: Copier une entrée retouchée
- **GIVEN** la même entrée retouchée en « L'oncle dort. »
- **WHEN** l'utilisateur la copie
- **THEN** le presse-papiers contient « L'oncle dort. » à la place de « L'oncle. »

#### Scenario: Copier une deuxième génération
- **GIVEN** une entrée d'ancêtre « La ferme. », de parent « L'oncle. » et de résultat « Le village. », itérée deux fois par un S+7 sur les noms
- **WHEN** l'utilisateur la copie
- **THEN** le presse-papiers contient « La ferme. », une ligne vide, « L'oncle. », une ligne vide, « Le village. », une ligne vide, puis « — S+7 sur les noms ×2 (Oulipao) »

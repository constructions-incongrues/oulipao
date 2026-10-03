# Spec Delta

## MODIFIED Requirements

### Requirement: Lire le carnet
The system SHALL show the notebook as a collapsible panel, collapsed by default, whose header states the total number of entries and, when there is at least one entry, how long ago the most recent one was kept in calendar days (« dernier texte aujourd'hui », « hier », « il y a N jours »). Opened, it SHALL list every kept entry from most recent to oldest, each with its date, its resulting text (the retouched text when there is one, marked « retouché ») and its chain mention. An empty notebook SHALL say so.

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

### Requirement: Rouvrir un texte gardé
The system SHALL let the user reopen an entry: the source text SHALL return to the input, the table SHALL take the kept state, and the resulting text SHALL be identical to the kept (unretouched) one, without tagging the text again. Reopening SHALL replace the current table state. When the current work is unsaved — a text is in tracks and it, or the table, changed since the last keep or reopen — the system SHALL ask for confirmation first; declining SHALL change nothing.

#### Scenario: Rouvrir une chaîne de deux filtres avec verrous
- **GIVEN** un texte gardé avec un S+7 sur les noms, un lipogramme en « e », un verrou S+3 sur un mot et un pas bouché
- **WHEN** l'utilisateur rouvre cette entrée
- **THEN** la saisie contient le texte d'origine, la chaîne montre les deux filtres avec leurs réglages, le verrou et le pas bouché sont en place
- **AND** le texte résultant est exactement le texte gardé

#### Scenario: Travail non gardé
- **GIVEN** un texte mis en pistes dont le réglage a changé depuis la dernière garde
- **WHEN** l'utilisateur rouvre une entrée puis renonce à la confirmation
- **THEN** la table, la saisie et le texte résultant sont inchangés

#### Scenario: Rien à perdre
- **GIVEN** un texte qui vient d'être gardé, sans geste depuis, ou aucun texte mis en pistes
- **WHEN** l'utilisateur rouvre une entrée
- **THEN** aucune confirmation n'est demandée

#### Scenario: Entrée qui ne se restaure plus
- **GIVEN** une entrée dont une instance vise une contrainte qui n'existe plus
- **WHEN** l'utilisateur tente de la rouvrir
- **THEN** un message dit qu'elle ne peut pas être rouverte, et son texte et sa mention restent lisibles dans le carnet

## ADDED Requirements

### Requirement: Copier une entrée d'un bloc
The system SHALL let the user copy an entry in one block: the source text, a blank line, the result (retouched when there is one), then the chain mention as the copy control appends it. A status message SHALL confirm the copy or report its failure.

#### Scenario: Copier pour un mail
- **GIVEN** une entrée dont l'original est « La ferme. », le résultat « L'oncle. » et la chaîne un S+7 sur les noms
- **WHEN** l'utilisateur actionne « Copier » sur cette entrée
- **THEN** le presse-papiers contient « La ferme. », une ligne vide, « L'oncle. », une ligne vide, puis « — S+7 sur les noms (Oulipao) »

#### Scenario: Copier une entrée retouchée
- **GIVEN** la même entrée retouchée en « L'oncle dort. »
- **WHEN** l'utilisateur la copie
- **THEN** le presse-papiers contient « L'oncle dort. » à la place de « L'oncle. »

### Requirement: Retoucher le résultat d'une entrée
The system SHALL let the user edit the result of an entry and save or cancel the edit. A saved edit SHALL be stored beside the produced result, persisted and exported with the entry; an edit equal to the produced result, or emptied, SHALL remove the retouch. Entries without a retouch, including those kept or exported before this change, SHALL remain valid.

#### Scenario: Retoucher puis recharger
- **GIVEN** une entrée au résultat « L'oncle. »
- **WHEN** l'utilisateur la retouche en « L'oncle dort. », enregistre, puis recharge la page
- **THEN** le carnet montre « L'oncle dort. » avec la mention « retouché »
- **AND** rouvrir l'entrée redonne « L'oncle. » comme texte résultant

#### Scenario: Annuler une retouche
- **GIVEN** une entrée en cours de retouche
- **WHEN** l'utilisateur annule
- **THEN** l'entrée est inchangée

#### Scenario: Revenir au résultat produit
- **GIVEN** une entrée retouchée
- **WHEN** l'utilisateur vide le champ, ou y remet le résultat produit, et enregistre
- **THEN** l'entrée n'est plus marquée « retouché »

#### Scenario: Ancien carnet
- **GIVEN** un fichier exporté avant ce changement, sans retouche
- **WHEN** l'utilisateur l'importe
- **THEN** toutes ses entrées sont ajoutées

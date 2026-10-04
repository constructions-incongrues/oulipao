# generations-de-textes Specification

## Purpose
Faire du texte résultant le texte d'origine d'une nouvelle génération, en gardant la chaîne (itérer, comme le S+7 itéré) ou sans elle (figer, comme le *bounce in place* d'un logiciel de musique), et garder la filiation de chaque génération.

## Requirements
### Requirement: Itérer
The system SHALL offer an « Itérer » control next to « Garder », enabled under the same conditions. Using it SHALL tag the resulting text as displayed (chain applied, cut tracks left out, form laid out) as a new source text and SHALL keep the table state: instances, settings, modulators, gates, muted and solo tracks, form. As with any tagging, closed steps SHALL reopen and locks SHALL drop.

#### Scenario: Deux passes de S+7
- **GIVEN** un texte A mis en pistes avec un S+7 sur les noms, dont le résultat est B
- **WHEN** l'utilisateur actionne « Itérer »
- **THEN** la saisie contient B, la chaîne contient toujours le S+7 sur les noms, et le texte résultant est le S+7 de B

#### Scenario: Forme posée
- **GIVEN** un texte mis en rondel
- **WHEN** l'utilisateur actionne « Itérer »
- **THEN** le nouveau texte d'origine contient les vers répétés du rondel, et la forme rondel reste posée

#### Scenario: Rien à itérer
- **GIVEN** toutes les pistes coupées, ou un texte saisi qui ne correspond plus à la mise en pistes
- **WHEN** l'utilisateur regarde « Itérer » et « Figer »
- **THEN** les deux sont désactivés, comme « Garder »

### Requirement: Figer
The system SHALL offer a « Figer » control next to « Itérer », enabled under the same conditions. Using it SHALL tag the resulting text as displayed as a new source text, remove every instance from the chain, clear the form and make every track audible.

#### Scenario: Matière neuve
- **GIVEN** un résultat produit par un S+7 et un lipogramme, en rondel, avec la piste des adjectifs muette
- **WHEN** l'utilisateur actionne « Figer »
- **THEN** la saisie contient ce résultat, la chaîne est vide, aucune forme n'est posée, toutes les pistes s'entendent, et le texte résultant est le nouveau texte d'origine

### Requirement: Garde automatique
Before replacing the current text, « Itérer » and « Figer » SHALL keep it in the notebook when it has not been kept since it was last tagged or reopened, or since the table last changed. Otherwise they SHALL reuse the entry kept last, without adding a duplicate. The kept entry SHALL become the parent of the new generation. If keeping fails, the gesture SHALL stop with the keep error message and leave the current text unchanged.

#### Scenario: Itérer sans avoir gardé
- **GIVEN** un texte transformé jamais gardé et un carnet de 2 entrées
- **WHEN** l'utilisateur actionne « Itérer »
- **THEN** le carnet compte 3 entrées, la plus récente est le texte d'avant le geste, et elle est le parent de la nouvelle génération

#### Scenario: Déjà gardé
- **GIVEN** un texte qui vient d'être gardé, sans geste depuis, et un carnet de 3 entrées
- **WHEN** l'utilisateur actionne « Figer »
- **THEN** le carnet compte toujours 3 entrées, et l'entrée gardée est le parent

#### Scenario: Stockage plein
- **GIVEN** un stockage plein
- **WHEN** l'utilisateur actionne « Itérer »
- **THEN** un message dit qu'il est impossible de garder, et la saisie, la chaîne et le texte résultant sont inchangés

### Requirement: Filiation
The system SHALL record on each entry kept after « Itérer » or « Figer » its lineage: the parent entry's identifier, the ancestor's text (the source text of the first generation) and the mentions of the previous passes, oldest first. The lineage SHALL stay with the current text until another text is tagged from the input or another entry without lineage is reopened. An entry or export without lineage SHALL be read as today, without changing the export version; an invalid lineage SHALL be dropped without rejecting its entry.

#### Scenario: Troisième génération
- **GIVEN** un texte A, itéré une fois en B puis une fois en C, chaque génération gardée
- **WHEN** l'utilisateur garde C
- **THEN** l'entrée de C a pour parent l'entrée de B, pour ancêtre le texte de A, et deux passes précédentes

#### Scenario: Nouveau texte collé
- **GIVEN** une génération en cours
- **WHEN** l'utilisateur colle un autre texte et le met en pistes, puis le garde
- **THEN** l'entrée n'a pas de filiation

#### Scenario: Ancien carnet
- **GIVEN** un export d'avant ce changement
- **WHEN** l'utilisateur l'importe
- **THEN** aucune entrée n'est rejetée et aucune n'a de filiation

### Requirement: Mention des passes
The chain mention SHALL state every pass since the ancestor, oldest first: consecutive passes whose rule label is the same SHALL merge into one with « ×n », and different passes SHALL be joined by « · puis ». The current chain counts as the last pass. « réglé en écoutant » SHALL stay at the end.

#### Scenario: Trois itérations
- **GIVEN** un S+7 sur les noms itéré deux fois
- **WHEN** la mention du troisième texte s'affiche
- **THEN** elle se lit « — S+7 sur les noms ×3 (Oulipao) »

#### Scenario: Figer puis une autre chaîne
- **GIVEN** un texte transformé par un S+7 sur les noms, figé, puis transformé par un lipogramme en e
- **WHEN** la mention s'affiche
- **THEN** elle se lit « — S+7 sur les noms · puis lipogramme en e (Oulipao) »

#### Scenario: Figer sans rien brancher ensuite
- **GIVEN** un texte transformé par un S+7, figé, sans contrainte branchée depuis
- **WHEN** la mention s'affiche
- **THEN** elle se lit « — S+7 sur les noms (Oulipao) »

### Requirement: Reprendre une filiation
Reopening an entry that has a lineage SHALL restore it as the current lineage, so that a following « Itérer » or « Figer » continues the same line with the reopened entry as parent.

#### Scenario: Rouvrir puis itérer
- **GIVEN** l'entrée de B (deuxième génération de A) rouverte
- **WHEN** l'utilisateur actionne « Itérer » puis garde le résultat
- **THEN** la nouvelle entrée a pour parent B, pour ancêtre A, et deux passes précédentes

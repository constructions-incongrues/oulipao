# Spec Delta

## MODIFIED Requirements

### Requirement: Persistance locale
The system SHALL keep the notebook in the browser across reloads and SHALL NOT send any kept text over the network. Stored data SHALL be validated when read; an invalid entry SHALL be left out of the list and reported, without hiding the valid entries, and SHALL be kept unchanged in storage at every later write. When the stored notebook cannot be read at all, the system SHALL copy it to a separate backup key before its first write. Every write SHALL first re-read the stored notebook and merge it with the change, so that an entry kept in another tab is never lost; another tab SHALL show the change without a reload. If storage is full, keeping SHALL fail with an error message and the resulting text SHALL stay on screen.

#### Scenario: Recharger la page
- **GIVEN** deux textes gardés
- **WHEN** la page est rechargée
- **THEN** le carnet montre toujours les deux textes

#### Scenario: Entrée abîmée
- **GIVEN** un stockage contenant deux entrées valides et une entrée sans date
- **WHEN** la page des pistes s'ouvre
- **THEN** le carnet montre les deux entrées valides et l'avis « 1 texte illisible par cette version, conservé : il reste dans l'export du carnet. »

#### Scenario: Entrée abîmée conservée
- **GIVEN** un stockage contenant deux entrées valides et une entrée sans date
- **WHEN** l'utilisateur garde un nouveau texte puis recharge la page
- **THEN** le stockage contient toujours l'entrée sans date, inchangée, et le carnet montre trois entrées valides

#### Scenario: Carnet illisible en entier
- **GIVEN** un stockage dont le carnet n'est pas du JSON valide
- **WHEN** la page s'ouvre puis l'utilisateur garde un texte
- **THEN** la page annonce « Le carnet est illisible. Copie de secours gardée dans le navigateur. », et le contenu d'origine se trouve intact sous la clé de secours

#### Scenario: Deux onglets
- **GIVEN** la page ouverte dans deux onglets A et B sur le même carnet
- **WHEN** l'utilisateur garde un texte dans A, puis un autre dans B
- **THEN** le stockage contient les deux textes, et l'onglet A montre le texte gardé dans B sans rechargement

#### Scenario: Onglet réseau
- **GIVEN** l'onglet réseau ouvert
- **WHEN** un texte est gardé, rouvert, supprimé, exporté puis importé
- **THEN** aucune requête ne contient ce texte

### Requirement: Rouvrir un texte gardé
The system SHALL let the user reopen an entry: the source text SHALL return to the input, the table SHALL take the kept state, and the resulting text SHALL be identical to the kept (unretouched) one, without tagging the text again. Reopening SHALL replace the current table state. When the current work is unsaved — a text is in tracks and it, or the table, changed since the last keep or reopen — the system SHALL ask for confirmation first; declining SHALL change nothing. Before restoring, the system SHALL check every instance's settings against its constraint, the kept tagging against the source text and every lock against the text; an entry that fails a check, or whose result cannot be rebuilt, SHALL not be restored, and the system SHALL show the reason as an error in the notebook while the current table stays unchanged.

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
- **THEN** un message d'erreur dit qu'elle ne peut pas être rouverte, et son texte et sa mention restent lisibles dans le carnet

#### Scenario: Réglage hors bornes
- **GIVEN** une entrée importée dont un S+n porte le décalage 500, hors de ses bornes
- **WHEN** l'utilisateur tente de la rouvrir
- **THEN** un message d'erreur « Ce texte ne peut pas être rouvert : » en donne la raison, et la table, la saisie et le texte résultant sont inchangés

#### Scenario: Étiquetage désaligné
- **GIVEN** une entrée dont l'étiquetage gardé compte moins de mots que son texte source
- **WHEN** l'utilisateur tente de la rouvrir
- **THEN** un message d'erreur le dit, et rien n'est restauré

### Requirement: Exporter et importer le carnet
The system SHALL export the whole notebook as a JSON file named `oulipao-carnet-AAAA-MM-JJ.json`, downloaded locally, including the entries this version cannot read, unchanged. It SHALL import such a file by validating it, adding entries whose identifier is not already present, ignoring duplicates, and reporting how many entries were added, already present, and rejected. A file that is not a notebook SHALL be refused with a message and SHALL leave the notebook unchanged.

#### Scenario: Aller-retour
- **GIVEN** un carnet de 4 entrées exporté, puis vidé
- **WHEN** l'utilisateur importe le fichier exporté
- **THEN** le carnet compte de nouveau 4 entrées, et chacune se rouvre à l'identique

#### Scenario: Export avec une entrée illisible
- **GIVEN** un carnet de 3 entrées valides et 1 entrée illisible par cette version
- **WHEN** l'utilisateur exporte le carnet
- **THEN** le fichier contient les 4 entrées, l'illisible telle qu'elle était stockée

#### Scenario: Import en double
- **GIVEN** un carnet de 4 entrées et un fichier contenant ces 4 entrées et 1 nouvelle
- **WHEN** l'utilisateur importe le fichier
- **THEN** le carnet compte 5 entrées et le message annonce 1 ajoutée, 4 déjà présentes

#### Scenario: Mauvais fichier
- **GIVEN** un fichier JSON qui n'est pas un carnet
- **WHEN** l'utilisateur l'importe
- **THEN** un message d'erreur le refuse et le carnet est inchangé

## ADDED Requirements

### Requirement: Stockage inaccessible
The system SHALL start normally when the browser refuses access to its storage. The notebook SHALL then live for the session only: « Garder » SHALL stay available and confirm « Gardé pour cette séance. Exportez le carnet pour le conserver. », export SHALL stay available, and a permanent notice at the top of the notebook SHALL say that the notebook will not be kept after the tab is closed.

#### Scenario: Stockage refusé
- **GIVEN** un navigateur qui refuse l'accès au stockage du site
- **WHEN** la page des pistes s'ouvre
- **THEN** la page fonctionne, et la tête du carnet dit que le carnet ne sera pas conservé après la fermeture de l'onglet

#### Scenario: Garder pour la séance
- **GIVEN** le stockage refusé et un texte mis en pistes
- **WHEN** l'utilisateur actionne « Garder »
- **THEN** le carnet compte une entrée de plus, la zone d'état annonce « Gardé pour cette séance. Exportez le carnet pour le conserver. », et l'export propose un fichier qui contient l'entrée

### Requirement: Messages du carnet
The system SHALL show notebook failures — reopening, keeping, deleting or importing that fails — as error messages announced to assistive technology, in the notebook section, and SHALL show notices — entries this version cannot read, storage unavailable — as quiet status text that does not interrupt.

#### Scenario: Échec annoncé
- **GIVEN** une entrée qui ne peut pas être rouverte
- **WHEN** l'utilisateur tente de la rouvrir
- **THEN** le message est présenté comme une erreur et annoncé immédiatement par un lecteur d'écran

#### Scenario: Avis discret
- **GIVEN** un carnet qui contient une entrée illisible
- **WHEN** la page s'ouvre
- **THEN** l'avis est présenté comme un état, sans la forme d'une erreur, et annoncé sans interrompre

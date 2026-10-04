# lien-partageable Specification

## Purpose
Faire voyager un texte gardé avec sa recette — l'original, la chaîne et ses réglages — dans une simple adresse, pour que le destinataire voie comment le texte a été fait et puisse le rejouer, sans compte ni serveur.

## Requirements

### Requirement: Partager une entrée du carnet
The system SHALL offer a « Partager » control on each notebook entry. It SHALL copy to the clipboard an address made of the site address and a fragment that carries the whole entry: source text and its tagging, mixer state, mention, result, retouch when there is one, and lineage when there is one. The entry's identifier and keeping date SHALL NOT be carried. A status message SHALL confirm the copy. When the clipboard is refused, the address SHALL be shown in a selectable field instead. When the address exceeds 8 000 characters, the status message SHALL warn that some messaging apps cut long links.

#### Scenario: Partager un texte gardé
- **GIVEN** une entrée dont l'original est « La ferme. », le résultat « L'oncle. » et la chaîne un S+7 sur les noms
- **WHEN** l'utilisateur actionne « Partager » sur cette entrée
- **THEN** le presse-papiers contient une adresse du site suivie d'un fragment `#v1.`
- **AND** un message confirme que le lien est copié

#### Scenario: Presse-papiers refusé
- **GIVEN** un navigateur qui refuse l'écriture dans le presse-papiers
- **WHEN** l'utilisateur actionne « Partager »
- **THEN** l'adresse s'affiche dans un champ sélectionnable, avec un message qui invite à la copier

#### Scenario: Lien très long
- **GIVEN** une entrée dont l'adresse dépasse 8 000 caractères
- **WHEN** l'utilisateur la partage
- **THEN** l'adresse est copiée et le message prévient que certaines messageries tronquent les liens longs

#### Scenario: Aucun envoi réseau
- **WHEN** l'utilisateur partage une entrée, ou qu'un destinataire ouvre le lien
- **THEN** aucune requête réseau ne transporte le texte : l'entrée ne voyage que dans le fragment de l'adresse

### Requirement: Vue d'arrivée
The system SHALL, when the page opens on an address whose fragment carries a valid entry, show an arrival view before anything else: first the text — the retouch when there is one, with the produced result beside it — then the source text, then the chain mention, and for an entry with a lineage, the ancestor's text before the source text. The arrival view SHALL NOT change the recipient's notebook nor the text in progress. The recipient SHALL be able to dismiss it and reach the normal tool.

#### Scenario: Ouvrir un lien reçu
- **GIVEN** un lien partagé depuis l'entrée « La ferme. » → « L'oncle. », S+7 sur les noms
- **WHEN** le destinataire ouvre ce lien
- **THEN** la page montre « L'oncle. », puis « La ferme. », puis « S+7 sur les noms »
- **AND** son carnet est inchangé

#### Scenario: Ouvrir un lien d'une entrée retouchée
- **GIVEN** un lien partagé depuis la même entrée retouchée en « L'oncle dort. »
- **WHEN** le destinataire ouvre ce lien
- **THEN** la page montre « L'oncle dort. » et, à côté, le résultat produit « L'oncle. »

#### Scenario: Ouvrir un lien d'une deuxième génération
- **GIVEN** un lien partagé depuis une entrée d'ancêtre « La ferme. », de parent « L'oncle. » et de résultat « Le village. »
- **WHEN** le destinataire ouvre ce lien
- **THEN** la page montre « Le village. », puis « La ferme. » avant « L'oncle. », et la mention de toutes les passes

#### Scenario: Quitter la vue d'arrivée
- **GIVEN** la vue d'arrivée affichée
- **WHEN** le destinataire la ferme
- **THEN** l'outil s'affiche tel qu'il l'aurait été sans le lien

### Requirement: Rejouer une entrée reçue
The system SHALL offer a « Rejouer » control in the arrival view. It SHALL load the received source text, its tagging and its mixer state into the tracks, without re-tagging, exactly as reopening a kept entry does, so that the chain recomputes the text. When a text in progress is not kept, it SHALL ask for confirmation first, as reopening does. Opening the arrival view SHALL NOT contact any third party: the tagging model and the lexicon SHALL be requested only when the recipient actions « Rejouer », as the first click. While they load, « Rejouer » SHALL be disabled and say so. When they fail to load, the arrival view SHALL stay open and readable, show the reason, and let the recipient try again.

#### Scenario: Rejouer la chaîne
- **GIVEN** la vue d'arrivée d'un lien « La ferme. » → « L'oncle. », S+7 sur les noms, graine 4
- **WHEN** le destinataire actionne « Rejouer »
- **THEN** les pistes montrent « La ferme. » avec un S+7 sur les noms, graine 4
- **AND** le texte résultant est « L'oncle. » tant que le lexique n'a pas changé

#### Scenario: Rejouer par-dessus un texte non gardé
- **GIVEN** un texte en pistes modifié depuis la dernière garde
- **WHEN** le destinataire actionne « Rejouer »
- **THEN** le système demande confirmation avant de remplacer le texte en cours

#### Scenario: Aucun tiers avant le clic
- **GIVEN** un lien ouvert sur une page qui n'a encore rien chargé
- **WHEN** la vue d'arrivée s'affiche
- **THEN** aucune requête n'est partie vers `cdn.jsdelivr.net`, `huggingface.co` ou `*.hf.co`

#### Scenario: Hors ligne
- **GIVEN** un lien ouvert alors que le lexique ne peut pas être chargé
- **WHEN** le destinataire actionne « Rejouer »
- **THEN** le texte, l'original et la chaîne restent lisibles, avec la raison de l'échec
- **AND** « Rejouer » permet de réessayer

#### Scenario: Entrée qui ne peut pas être rouverte
- **GIVEN** un lien dont la chaîne vise une contrainte inconnue de cette version
- **WHEN** le destinataire actionne « Rejouer »
- **THEN** le message « Ce texte ne peut pas être rouvert » s'affiche avec sa raison dans la vue d'arrivée, et la table reste inchangée

### Requirement: Lien illisible
The system SHALL treat any fragment as untrusted input and validate the decoded entry against the notebook entry schema. A fragment that cannot be decompressed, parsed or validated, or that carries an unknown version, SHALL show the message « Ce lien n'est pas lisible » and then the normal tool, with no partial state. A fragment that does not start with a known version prefix SHALL be ignored.

#### Scenario: Lien tronqué
- **GIVEN** un lien partagé dont la fin a été coupée par une messagerie
- **WHEN** le destinataire l'ouvre
- **THEN** le message « Ce lien n'est pas lisible » s'affiche et l'outil s'ouvre normalement

#### Scenario: Version inconnue
- **GIVEN** une adresse dont le fragment commence par `#v9.`
- **WHEN** la page s'ouvre
- **THEN** le message « Ce lien n'est pas lisible » s'affiche

#### Scenario: Fragment étranger
- **GIVEN** une adresse dont le fragment est `#haut`
- **WHEN** la page s'ouvre
- **THEN** la page s'ouvre normalement, sans message

### Requirement: Effacer le fragment une fois lu
The system SHALL remove the fragment from the address bar once it has been read, without reloading the page or adding a history entry, so that reloading the page shows the normal tool instead of the arrival view.

#### Scenario: Recharger après l'arrivée
- **GIVEN** un lien ouvert et rejoué
- **WHEN** le destinataire recharge la page
- **THEN** l'outil s'ouvre normalement, sans vue d'arrivée

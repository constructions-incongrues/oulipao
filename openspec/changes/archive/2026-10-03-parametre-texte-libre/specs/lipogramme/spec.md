# Spec Delta

## ADDED Requirements

### Requirement: Paramètres « Lettres » et « Mode »
The system SHALL declare two parameters for the Lipogram plugin: « Lettres », a text parameter, « e » by default, and « Mode », a choice between « interdites » (default) and « permises ». Only letters SHALL count in the input: spaces, punctuation and digits are ignored, and an accented letter or a ligature counts as its bare letters. In « interdites » mode the banned letters are those typed; in « permises » mode they are all the letters of a to z absent from the input.

#### Scenario: Ouverture
- **GIVEN** la page à pistes
- **WHEN** le lipogramme est mis en marche
- **THEN** le mode est « interdites » et la lettre interdite est « e »

#### Scenario: Plusieurs lettres interdites
- **GIVEN** le mode « interdites » et la saisie « a, e »
- **WHEN** le lipogramme s'applique
- **THEN** chaque mot qui contient « a » ou « e » est remplacé par le premier voisin sans aucune des deux

#### Scenario: Beau présent
- **GIVEN** le mode « permises » et la saisie « Lucie »
- **WHEN** le lipogramme s'applique
- **THEN** les lettres bannies sont toutes celles de a à z sauf l, u, c, i et e, et « é » passe puisque « e » est permise

#### Scenario: Aucune lettre permise
- **GIVEN** le mode « permises » et un champ vide
- **WHEN** le lipogramme s'applique
- **THEN** le lipogramme n'agit pas et son aide dit qu'aucune lettre n'est saisie

## REMOVED Requirements

### Requirement: Paramètre « Lettre »
**Reason**: Une seule lettre parmi a–z ne permet ni le Beau présent ni la Contrainte du prisonnier sans empiler des instances.
**Migration**: Le paramètre « Lettres » en mode « interdites » avec une seule lettre donne le même texte que l'ancien paramètre « Lettre » ; les recettes sont réécrites (voir recettes-de-contraintes).

## MODIFIED Requirements

### Requirement: Chaîne de plugins
The system SHALL apply installed plugins in order, each receiving the previous plugin's output, with the S+7 before the lipogram by default, and SHALL let the user change the order.

#### Scenario: S+7 puis lipogramme
- **GIVEN** le S+7 et le lipogramme en marche
- **WHEN** le texte résultant s'affiche
- **THEN** les noms sont ceux du S+7, privés de la lettre interdite

#### Scenario: Lipogrammes enchaînés
- **GIVEN** un lipogramme en a suivi d'un lipogramme en e
- **WHEN** le texte résultant s'affiche
- **THEN** le second cherche des voisins sans « a » ni « e » : un lipogramme ne réintroduit pas une lettre bannie par un lipogramme placé avant lui

#### Scenario: Lettres permises puis lettres interdites
- **GIVEN** un lipogramme en mode « permises » sur « lucie » suivi d'un lipogramme en mode « interdites » sur « u »
- **WHEN** le texte résultant s'affiche
- **THEN** le second cherche des voisins qui n'emploient que l, c, i et e : il cumule les lettres bannies par le premier et les siennes

### Requirement: Réglage en direct
The system SHALL update the result text without re-tagging when the lipogram is switched on or off, its letters or its mode change, or the chain order changes.

#### Scenario: Changer de lettre
- **GIVEN** un texte de 200 mots mis en pistes
- **WHEN** la saisie passe de « e » à « a »
- **THEN** le texte résultant change en moins d'une demi-seconde, sans nouvel étiquetage

#### Scenario: Changer de mode
- **GIVEN** un lipogramme sur « e »
- **WHEN** le mode passe de « interdites » à « permises »
- **THEN** le texte résultant n'emploie plus que la lettre « e » parmi les lettres de a à z, partout où un voisin existe

### Requirement: Résumé et mention de la chaîne
The system SHALL describe the whole active chain in the summary and in the note appended to the copied text, and SHALL count replaced words, removed words and words that keep a banned letter. A lipogram SHALL be named « lipogramme en » followed by its letters separated by commas in « interdites » mode, and « lipogramme seulement en » followed by its letters in « permises » mode.

#### Scenario: Copie
- **GIVEN** le S+7 et le lipogramme en « e » en marche
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — S+7, parmi tous les noms · lipogramme en e (Oulipao) »

#### Scenario: Plusieurs lettres
- **GIVEN** un lipogramme en mode « interdites » sur « ae », seul dans la chaîne
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — lipogramme en a, e (Oulipao) »

#### Scenario: Lettres permises
- **GIVEN** un lipogramme en mode « permises » sur « Lucie », seul dans la chaîne
- **WHEN** le texte résultant est copié
- **THEN** la mention est « — lipogramme seulement en l, u, c, i, e (Oulipao) »

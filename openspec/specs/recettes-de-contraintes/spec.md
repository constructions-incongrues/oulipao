# recettes-de-contraintes Specification

## Purpose
Brancher une contrainte de l'Oulipo par son nom, même quand elle se réduit à une ou plusieurs instances des moteurs existants, et parcourir ce qu'Oulipao sait faire depuis un navigateur sous la chaîne.

## Requirements

### Requirement: Recette
The system SHALL define a recipe as an Oulipo name, its rule in one sentence, the address of its oulipo.net page, and the list of instances it adds (type, settings, target tracks), with at most one choice asked when the recipe is added; recipes SHALL be validated by a schema.

#### Scenario: Recette invalide
- **GIVEN** une recette qui branche un type non installé
- **WHEN** la page se charge
- **THEN** la validation échoue et la recette n'est pas proposée

### Requirement: Brancher une recette
The system SHALL add a recipe's instances at the end of the chain, in the recipe's order, each with its own identifier, enabled, and SHALL update the result without re-tagging; the existing instances SHALL be kept.

#### Scenario: Monovocalisme en a
- **GIVEN** une chaîne qui contient un S+7
- **WHEN** on branche la recette Monovocalisme en gardant « a »
- **THEN** la chaîne contient le S+7 puis cinq lipogrammes, en e, i, o, u et y

### Requirement: Choix au branchement
The system SHALL, for a recipe that declares a choice, ask for it before adding the instances, offering only its listed options, and SHALL add nothing if the user cancels.

#### Scenario: Liponymie
- **GIVEN** la recette Liponymie
- **WHEN** on la branche en choisissant « Adjectifs »
- **THEN** un Tri par piste en mode « retirer » visant les adjectifs s'ajoute en fin de chaîne

### Requirement: Recettes fournies
The system SHALL provide these recipes:
- Monovocalisme : lipograms on every vowel of a, e, i, o, u, y but the chosen one;
- Bivocalisme : lipograms on every vowel but the chosen pair;
- Contrainte du prisonnier : lipograms on b, d, f, g, h, j, k, l, p, q, t, y;
- La rien que la toute la : Tri par piste removing nouns, adjectives and verbs;
- Liponymie : Tri par piste removing the chosen track;
- Inventaire : Tri par piste keeping only the chosen track, one word per line;
- Haï-kaïsation : Bord, « fins de vers », n = 1;
- Intérieur de poème : Bord, « intérieur », n = 1;
- Poème de bandit : Mise en vers, every 6 words;
- Juliennes : Mise en vers by the digits of the Julian day of the day the recipe is added.

Accented vowels are not covered by the vowel recipes, as with the lipogram; the rule of each such recipe SHALL say so.

#### Scenario: Juliennes le 3 octobre 2026
- **GIVEN** la date du 3 octobre 2026
- **WHEN** on branche la recette Juliennes
- **THEN** une Mise en vers « selon un nombre » réglée sur 2461317 s'ajoute

### Requirement: Navigateur de contraintes
The system SHALL replace the row of add buttons under the chain with a collapsible browser, closed by default, listing first the recipes by Oulipo name, each with its rule in one sentence and a link to its oulipo.net page, then a « Moteurs » section listing the installed constraint types; activating an entry SHALL add it at the end of the chain. The browser SHALL be operable with the keyboard and readable by a screen reader.

#### Scenario: Ajouter un moteur
- **GIVEN** le navigateur déplié
- **WHEN** on active « Bord » dans la section « Moteurs »
- **THEN** une instance de Bord aux réglages par défaut s'ajoute en fin de chaîne

#### Scenario: Lien vers la fiche
- **GIVEN** le navigateur déplié
- **WHEN** on suit le lien de la recette Haï-kaïsation
- **THEN** la fiche oulipo.net de la Haï-kaïsation s'ouvre dans un nouvel onglet

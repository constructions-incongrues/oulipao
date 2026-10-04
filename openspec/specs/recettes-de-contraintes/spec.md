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
- **THEN** la chaîne contient le S+7 puis un lipogramme en mode « interdites » sur e, i, o, u et y

### Requirement: Choix au branchement
The system SHALL, for a recipe that declares a choice, ask for it before adding the instances, offering only its listed options, and SHALL add nothing if the user cancels.

#### Scenario: Liponymie
- **GIVEN** la recette Liponymie
- **WHEN** on la branche en choisissant « Adjectifs »
- **THEN** un Tri par piste en mode « retirer » visant les adjectifs s'ajoute en fin de chaîne

### Requirement: Recettes fournies
The system SHALL provide these recipes:
- Monovocalisme : one lipogram, « interdites » mode, on every vowel of a, e, i, o, u, y but the chosen one;
- Bivocalisme : one lipogram, « interdites » mode, on every vowel but the chosen pair;
- Contrainte du prisonnier : one lipogram, « interdites » mode, on b, d, f, g, h, j, k, l, p, q, t, y;
- Beau présent : one lipogram, « permises » mode, with no letter typed; its rule SHALL say to type the recipient's name in the instance;
- La rien que la toute la : Tri par piste removing nouns, adjectives and verbs;
- Liponymie : Tri par piste removing the chosen track;
- Inventaire : Tri par piste keeping only the chosen track, one word per line;
- Haï-kaïsation : Bord, « fins de vers », n = 1;
- Intérieur de poème : Bord, « intérieur », n = 1;
- Poème de bandit : Mise en vers, every 6 words;
- Juliennes : Mise en vers by the digits of the Julian day of the day the recipe is added;
- Tautogramme : one Tautogramme progressif whose letters are the single letter chosen when the recipe is added (a to z);
- Abécédaire : one Tautogramme progressif on the letters a to z;
- Éclipse : one S+7 on nouns, and the éclipse form set on the result;
- S+dé : one S+n on nouns drawn with a die, seeded with the Julian day of the day the recipe is added.

A recipe that sets a form SHALL replace the current form.

The rule of Tautogramme and Abécédaire SHALL say that function words do not count and that « être » and « avoir » stay.

An accented vowel counts as its bare vowel in the vowel recipes, as with the lipogram; the rule of each such recipe SHALL say so.

#### Scenario: Juliennes le 3 octobre 2026
- **GIVEN** la date du 3 octobre 2026
- **WHEN** on branche la recette Juliennes
- **THEN** une Mise en vers « selon un nombre » réglée sur 2461317 s'ajoute

#### Scenario: Une instance au lieu de douze
- **GIVEN** un texte mis en pistes
- **WHEN** on branche la recette Contrainte du prisonnier
- **THEN** la chaîne gagne un seul lipogramme, et chaque mot remplacé l'est par son premier voisin sans aucune des douze lettres

#### Scenario: Beau présent
- **GIVEN** la recette Beau présent branchée
- **WHEN** on tape « Lucie » dans les lettres de son lipogramme
- **THEN** le texte résultant n'emploie que les lettres l, u, c, i et e, partout où un voisin existe

#### Scenario: Tautogramme en p
- **GIVEN** un texte mis en pistes
- **WHEN** on branche la recette Tautogramme avec la lettre « p »
- **THEN** la chaîne gagne un seul Tautogramme progressif réglé sur « p », sur les noms, adjectifs, verbes et adverbes

#### Scenario: Abécédaire
- **WHEN** on branche la recette Abécédaire
- **THEN** la chaîne gagne un seul Tautogramme progressif réglé sur « abcdefghijklmnopqrstuvwxyz »

#### Scenario: Éclipse
- **WHEN** on branche la recette Éclipse
- **THEN** la chaîne gagne un S+7 sur les noms et la forme devient « éclipse »

#### Scenario: S+dé le 4 octobre 2026
- **GIVEN** la date du 4 octobre 2026
- **WHEN** on branche la recette S+dé
- **THEN** la chaîne gagne un S+n au dé sur les noms, de graine 2461318

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

### Requirement: Nom de la recette sur ses instances
The system SHALL name each instance added by a recipe with the recipe's name followed by its choice in parentheses, when there is one, and SHALL use that name in the chain row (with the engine's name under it), the status sentence, the track strips' reminders, the inspector's band and the mention appended to a copy. The name SHALL be dropped once the instance's settings, targets, modulators or gate are changed; a duplicate SHALL keep it.

#### Scenario: Monovocalisme en a
- **GIVEN** un texte mis en pistes
- **WHEN** on branche la recette Monovocalisme en gardant « a »
- **THEN** la chaîne montre « Monovocalisme (a) » avec « Lipogramme » dessous, et la phrase d'état commence par « Monovocalisme (a) : »

#### Scenario: Réglée autrement
- **GIVEN** une instance branchée par Monovocalisme en « a »
- **WHEN** l'utilisateur change ses lettres
- **THEN** elle s'appelle de nouveau « Lipogramme » et se décrit par ses réglages

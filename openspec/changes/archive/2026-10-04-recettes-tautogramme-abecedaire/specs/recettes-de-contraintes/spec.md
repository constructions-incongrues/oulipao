# Spec Delta

## MODIFIED Requirements

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
- Abécédaire : one Tautogramme progressif on the letters a to z.

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

# Proposal

## Why

Un filtre ne se règle aujourd'hui qu'avec un entier borné ou un choix dans une liste fermée. Les contraintes qui dépendent d'un nom ou d'une liste de lettres sont donc hors d'atteinte, ou ne tiennent qu'en empilant des instances. La Contrainte du prisonnier est une recette de douze lipogrammes, et le Beau présent en demanderait une vingtaine. Le catalogue compte 7 contraintes de niveau B que ce seul paramètre débloque (évolution E1). Source : PRD `.nanopm/wiki/docs/prds/parametre-texte-libre.md`.

## What Changes

- Un troisième type de paramètre dans le contrat des plugins : `text`, une saisie courte validée par zod, que l'hôte rend comme un champ texte réglé en direct.
- Le lipogramme lit une **liste de lettres** au lieu d'une seule lettre, avec un mode **interdites** (le comportement actuel) ou **permises** (toutes les autres lettres sont bannies). **BREAKING** (contrat interne seulement) : le paramètre `letter` (choix a–z) devient `letters` (texte) et `mode` (choix). Aucun état n'est persisté ; seules les recettes en dépendent, et elles sont réécrites.
- Un nouveau filtre **Tautogramme progressif** : les mots des pistes visées prennent, dans l'ordre du texte, chacun la lettre suivante d'une liste saisie, en boucle. Chacun devient le premier voisin du dictionnaire qui commence par cette lettre. Les mots-outils ne comptent pas dans le cycle. Les verbes sont touchés comme au lipogramme.
- Les recettes Monovocalisme, Bivocalisme et Contrainte du prisonnier passent à **une** instance de lipogramme. Une recette **Beau présent** est ajoutée.

## Capabilities

### New Capabilities
- `parametre-texte` : le type de paramètre `text` du contrat, sa validation, et son champ dans l'hôte (réglage en direct, accessibilité, saisie vide ou invalide).
- `tautogramme-progressif` : le filtre qui impose une liste d'initiales en boucle aux mots des pistes visées.

### Modified Capabilities
- `lipogramme` : le paramètre « Lettre » devient « Lettres » (texte) et « Mode » (interdites ou permises), le cumul des lettres dans une chaîne porte sur des listes, et le titre nomme les lettres.
- `recettes-de-contraintes` : les recettes à lipogrammes empilés passent à une instance, et le Beau présent s'ajoute.

## Impact

- `src/domain/plugin.ts` : `TextParameterSchema` dans l'union `ParameterSchema`.
- `src/domain/lipogram/plugin.ts` : les paramètres, `inherit`, `title`, `label` et `help`.
- `src/domain/tautogram/` (nouveau) : le plugin et ses tests. Il réutilise `nthNoun`, `nthAdjective`, `nthAdverb` (`src/domain/neighbours.ts`), `nthVerb` et `rewriteVerbs` (`src/domain/verb.ts`), et `rewriteNouns` (`src/domain/s7/engine.ts`).
- `src/ui/tracks/components/control.ts` : le rendu d'un champ texte.
- `src/ui/tracks/mixer-state.ts` : l'installation du plugin tautogramme.
- `src/ui/tracks/recipes.ts` : les recettes.
- Aucune dépendance nouvelle, aucune donnée nouvelle. Le texte et la saisie restent dans le navigateur.

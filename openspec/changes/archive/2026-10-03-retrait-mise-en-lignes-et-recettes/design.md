# Design

## Context

Le contrat `ConstraintPlugin` (`src/domain/plugin.ts`) rend un élément par mot reçu : `{ index, output, gap }`. Le blanc qui précède un mot (`gap`) porte sa ponctuation et ses sauts de ligne. `runChain` (`src/domain/plugin-chain.ts`) relit la sortie de chaque étape comme un texte neuf. Elle ramène ensuite les mots aux mots d'origine (`fold`, qui recopie le `gap`), et elle compte les marques `replaced`, `removed` ou `kept`. Pour l'inspecteur, elle garde seulement `stages`, la sortie de chaque mot à chaque étape, sans les blancs.

Aujourd'hui, le lipogramme retire un mot en vidant à la fois `output` et `gap` ([lipogram/plugin.ts:125](../../../src/domain/lipogram/plugin.ts)). Ponctuation et sauts de ligne disparaissent avec lui.

Côté interface, `installedPlugins` ([mixer-state.ts](../../../src/ui/tracks/mixer-state.ts)) donne la rangée de boutons « + » du composant `Chain`. Chaque ligne de la chaîne affiche des puces de pistes, et le schéma `InstanceSchema` exige au moins une piste visée.

## Goals / Non-Goals

**Goals :**
- Trois contraintes du domaine, pures, testées avec la morphologie factice existante. Elles n'ont pas besoin de textbank.
- Une règle de retrait unique, que toutes les contraintes appellent, lipogramme compris.
- Des recettes déclaratives, validées par zod, dépliées par le réducteur en gestes existants.

**Non-Goals :**
- Toucher au rendu du mute et du solo (`mixSegments`). Une piste coupée garde son comportement actuel.
- Enregistrer des recettes (après le carnet), ou ajouter des réglages texte libres (E1).
- Déplacer ou dupliquer des mots (E3) : le Bord de poème complet reste hors du périmètre.

## Decisions

### 1. Règle de retrait partagée — domain

Nouveau module `src/domain/removal.ts`, pur, sans port. Il expose `removeWord(words, index)` et une fonction de fusion des blancs, `mergeGaps(removed, next)`.

- **Sauts de ligne** : on garde le plus grand nombre de sauts consécutifs des deux blancs.
- **Ponctuation** : on la réduit au signe le plus fort, selon l'ordre `. ! ? …` > `; :` > `,`. Les guillemets, parenthèses et tirets sont gardés tels quels.
- **Espaces** : on les recale à la française.
- **Tête de texte ou de ligne** : la ponctuation qui s'y retrouve est abandonnée.
- **Majuscule** : un mot retiré en tête de phrase lègue sa majuscule. On reprend le `matchCase` du lipogramme, déplacé dans ce module.
- **Fin de texte** : le dernier mot retiré fusionne avec `tail`.

*Alternative écartée :* appliquer la règle dans `runChain` après coup. La chaîne ne sait pas quel blanc appartenait à un mot retiré, et le lipogramme aurait perdu l'information avant elle.

### 2. Marque « remis en ligne » — domain

`WordMarkSchema` gagne `relaid: z.literal(true).optional()`, et `StepReport` gagne `relaid`. Une contrainte marque `relaid` sur un mot dont elle change seulement le blanc.

Au fil de la chaîne, un remplacement ou un retrait remplace la marque d'avant, comme aujourd'hui. Une remise en ligne n'écrase ni l'un ni l'autre, et `kept` n'écrase rien. Un mot remplacé puis remis en ligne reste donc « remplacé ».

`ChainResult.stages` passe de `string[][]` à `{ output: string; newline: boolean }[][]`. `newline` vaut vrai quand le blanc du mot, à cette étape, contient un saut de ligne absent à l'étape précédente. L'inspecteur s'en sert pour afficher « ↵ ».

*Alternative écartée :* un `stageGaps` parallèle. Deux tableaux à garder alignés, c'est une erreur qui attend son heure.

### 3. Type non ciblable — domain + ui

`ConstraintPlugin` gagne `targetable?: false`. `definePlugin` vérifie alors que `tracks` et `defaultTargets` valent les cinq pistes. Le schéma d'instance ne change pas : une instance non ciblable vise toujours les cinq pistes. Le réducteur refuse `set-targets` sur une telle instance, et `Chain` n'affiche pas ses puces.

Un type non ciblable reçoit `scope.skip` comme les autres. Il ne retire ni ne remplace un mot sauté, mais il le compte dans sa mesure.

### 4. Les trois contraintes — domain

| Module | Couche | Ports |
|---|---|---|
| `src/domain/track-sort/plugin.ts` | domain | aucun ; n'utilise pas `resources` |
| `src/domain/edge/plugin.ts` | domain | aucun |
| `src/domain/lineation/plugin.ts` | domain | aucun |

- **Lignes** : un utilitaire commun `linesOf(words)` découpe les mots en lignes, sur la présence de `\n` dans le blanc. Bord et Mise en vers s'en servent.
- **Coupes de Mise en vers** : elles remplacent le blanc par `\n` (ponctuation gardée devant). Les sauts de ligne qui existaient sont ramenés à une espace.
- **Disposition « un mot par ligne » du Tri** : met `\n` dans tous les blancs restants et retire leur ponctuation. C'est le seul cas où la ponctuation n'est pas gardée.
- **« Ne garder que »** : vise les mots *hors* des pistes visées. C'est l'exception de portée prévue par la spec.

### 5. Recettes — ui

Le module `src/ui/tracks/recipes.ts` porte un `RecipeSchema` zod et la liste `recipes`, validée au chargement contre `installedPlugins`. Une recette :

```
{ id, name, rule, url, choice?: { label, options: [{ value, label }] },
  build(choice?: string, today?: Date): { type, params, targets }[] }
```

Le dépliage reste pur et testable : `build` reçoit la date en argument, et seule la page passe `new Date()`.

Le nouveau geste `add-recipe { recipe, choice?, today }` est validé, puis déplié dans le réducteur en ajouts successifs. Chaque instance reçoit son identifiant par `nextId`. Le réducteur reste la seule porte d'entrée des changements d'état.

*Pourquoi l'UI et pas le domaine :* une recette compose des instances de la table, qui sont une notion de l'interface (`Instance` vit dans `src/ui/tracks/types.ts`).

### 6. Navigateur — ui

Le composant `ConstraintBrowser` est un `<details>` natif, fermé par défaut, sans bibliothèque. Il contient deux listes :
- **Recettes**, par ordre alphabétique : chaque entrée a un bouton « + Nom », sa règle et un lien `target="_blank" rel="noopener"` vers sa fiche oulipo.net ;
- **Moteurs** : un bouton par type installé.

Une recette avec un choix déplie en ligne un `<select>` et deux boutons, « Brancher » et « Annuler ». Pas de modale : focus et Échap se gèrent sans piège.

Les styles reprennent les classes `key` et `silk` existantes. **La maquette doit être validée par le fondateur avant d'être intégrée** (DESIGN.md).

## Risks / Trade-offs

- [La règle de fusion change la sortie du lipogramme sur les textes existants] → Les tests actuels du lipogramme fixent cette sortie. On les met à jour en vérifiant chaque différence, sans les réécrire en bloc.
- [Les recettes de voyelles rendent peu, car les voyelles accentuées passent] → Leur règle le dit, et les voyelles accentuées sont déjà au NEXT de la roadmap.
- [Contrainte du prisonnier = 12 instances, donc 12 relectures] → Mesurer avec l'exigence « mise à jour rapide » (200 mots, moins de 0,5 s). Au-delà, regrouper les lipogrammes enchaînés est une optimisation à faire plus tard.
- [`stages` change de forme] → Seuls la vue et l'inspecteur le consomment. On les adapte dans la même tâche.
- [Le navigateur peut s'écarter de DESIGN.md] → Une tâche de validation par le fondateur précède l'intégration.

## Open Questions

- Faut-il un ordre des recettes par famille plutôt qu'alphabétique quand il y en aura trente ? On l'ajustera à l'usage, sans changer la spec.

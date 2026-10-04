# Design

## Context

Voir `proposal.md` pour les motivations, et les deux specs pour le comportement attendu.

Ce qui existe et que le changement réutilise, tout dans `src/ui/tracks` :
- **`controller.run()`** met en pistes le texte saisi. Il étiquette, applique `reset-steps` (pas rouverts, verrous ôtés) et marque le travail `unsaved`.
- **`controller.keep()`** construit une `NotebookEntry` (résultat, mention, source, état de la table), l'ajoute et l'écrit. Il ne rend pas l'identifiant de l'entrée, et le contrôleur ne le retient pas.
- **`controller.reopen(id)`** restaure la source, la session et la table d'une entrée. Il demande une confirmation si `unsaved`.
- **La mention** est `withListening(ruleMention(mixer, audible, …), listened)`, sous la forme `\n\n— parties · … (Oulipao)`.
- **`entryClipboard`** compose la copie d'un bloc (source, résultat, mention), et `components/notebook.ts` affiche résultat et mention.

Le domaine n'est pas touché.

## Goals / Non-Goals

**Goals:**
- Deux gestes qui enchaînent garde, remplacement de la saisie et mise en pistes, en réutilisant `keep` et `run`.
- Une filiation tenue dans l'état du contrôleur, recopiée dans l'entrée gardée et restaurée à la réouverture.
- Une mention composée dans une fonction pure, testable sans contrôleur.

**Non-Goals:**
- Un index des entrées par parent, ou une vue en arbre.
- Une copie du texte complet de chaque génération dans l'entrée. Le parent est déjà la source de l'entrée ; seul l'ancêtre est recopié.

## Decisions

### 1. La filiation : `LineageSchema` dans `notebook.ts`

**Couche :** ui (le carnet est un adaptateur de stockage validé côté interface, comme aujourd'hui).

```ts
LineageSchema = z.object({
  parent: z.string().min(1),          // identifiant de l'entrée parente
  ancestor: z.string().min(1),        // texte d'origine de la première génération
  passes: z.array(z.string()).min(1), // corps des mentions précédentes, du plus ancien au plus récent
})
```

`NotebookEntrySchema` reçoit `lineage: LineageSchema.optional().catch(undefined)`. Une filiation illisible est oubliée sans rejeter l'entrée, comme les modulateurs. Le **parent** du texte n'est pas recopié : c'est `entry.source.text`.

*Alternative écartée :* retrouver l'ancêtre en remontant les parents. Une entrée supprimée couperait la chaîne, et l'écart avec l'ancêtre, qui est le cœur de la fonction, deviendrait illisible.

### 2. Le corps d'une passe

Une passe est enregistrée par le **corps** de sa mention, sans `\n\n— ` ni ` (Oulipao)`, et sans « réglé en écoutant ». Par exemple : `S+7 sur les noms · pistes coupées : adjectifs`. `ruleBody(mixer, audible, folded)` le produit à partir de `ruleMention`. Une table sans règle donne une chaîne vide.

### 3. La mention composée : `composeMention(passes, current)`, fonction pure dans `view-model.ts`

1. On ajoute `current` aux passes s'il n'est pas vide.
2. On fond les passes consécutives égales en `X ×n`.
3. On les joint par ` · puis `.
4. On enveloppe dans `\n\n— … (Oulipao)`. Une liste vide donne une chaîne vide, comme aujourd'hui.

`withListening` s'applique ensuite et place « réglé en écoutant » à la fin. Le contrôleur passe la filiation en cours à `mention(view)`.

### 4. L'état du contrôleur : `lineage` et `lastKept`

`TracksState` gagne :
- `lineage?: Lineage`, la filiation du texte en cours, sans `parent` tant qu'aucun geste n'a eu lieu ;
- une variable interne `lastKept?: string`, l'identifiant de la dernière entrée gardée ou rouverte.

Leur cycle de vie :
- `keep()` écrit `lineage` dans l'entrée quand il y en a une, fixe `lastKept` et **rend** l'identifiant, ou `undefined` en cas d'échec.
- `run()` lancé par l'utilisateur (le texte collé) efface `lineage` et `lastKept`.
- `reopen(id)` fixe `lastKept = id` et `lineage = entry.lineage`.

### 5. Les gestes : `iterate()` et `freeze()`, une même fonction `nextGeneration(mode)`

1. Si rien n'est à garder (pas de vue, vue vide ou texte périmé), rien ne se passe.
2. `parent = !state.unsaved && lastKept ? lastKept : keep()`. Si `keep()` échoue, le geste s'arrête : `copyMessage` porte déjà l'erreur.
3. `next = { parent, ancestor: lineage?.ancestor ?? session.text, passes: [...(lineage?.passes ?? []), ruleBody(...)] }`. Une passe vide (aucune règle) n'est pas ajoutée.
4. La nouvelle table :
   - en **itérer**, c'est la table actuelle ;
   - en **figer**, c'est `{ ...initialState, tracks: toutes audibles }`, donc chaîne vide, pas de forme, pas de pas bouché.
5. `setInput(view.result)`, puis `run({ lineage: next, mixer })`.

`run` reçoit des options internes : une mise en pistes déclenchée par un geste garde la filiation fournie au lieu de l'effacer, et part de la table fournie. Le reste de `run` ne change pas : préchargement, étiquetage, `reset-steps`, `unsaved: true`.

**Pas de confirmation** (choix A du PRD) : la garde automatique protège déjà le texte en cours.

### 6. L'affichage

- **`components/result.ts`** : deux touches `key iterate` et `key freeze`, après « Garder ». Elles sont désactivées dans les mêmes conditions et passent par des props `onIterate` et `onFreeze`, absentes en test comme `onKeep`.
- **`components/notebook.ts`** : pour une entrée avec `lineage`, avant le texte, deux paragraphes étiquetés en sérigraphie, « Ancêtre » et « Parent ». Le parent est `entry.source.text`.
- **`entryClipboard`** : avec une filiation, elle préfixe `${lineage.ancestor}\n\n`.

Le style suit `DESIGN.md` : touches à l'encre comme « Garder », étiquettes en Archivo condensé, textes en Spectral.

## Risks / Trade-offs

- **[Carnet encombré]** La garde automatique ajoute chaque génération intermédiaire. → C'est assumé (PRD), et l'on peut supprimer une entrée. La filiation de l'enfant garde l'ancêtre et le parent par leur texte.
- **[Étiquetage d'un texte transformé]** Le résultat peut contenir des mots rares que l'étiqueteur classe mal. → C'est le comportement voulu : le texte figé est étiqueté comme n'importe quel texte collé.
- **[Forme dans le texte]** Itérer un rondel recopie ses refrains dans le nouveau texte, puis repose la forme. → C'est le choix du fondateur (le texte affiché). Le résultat grossit à chaque passe, et c'est visible.
- **[Courses entre gestes]** Un second clic pendant l'étiquetage. → `run` ignore déjà les essais dépassés (`runs`). On désactive les deux touches pendant l'étiquetage, comme « Mettre en pistes ».

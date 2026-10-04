# Design

## Context

`src/ui/tracks/controller.ts` (528 lignes, 28 méthodes) porte à la fois la saisie, l'étiquetage, la table, le carnet, l'écoute, la pagination et l'inspecteur. Les jetons `runs` y écartent les résultats périmés, mais deux branches de sortie (`controller.ts:327` et `:465`) ne remettent pas `tagging` à faux. Le carnet est lu une fois au démarrage (`parseNotebook`, `controller.ts:199`). Ensuite, chaque écriture sérialise l'état en mémoire, qui ne contient que les entrées lisibles (`controller.ts:446`). `main.ts` lit le getter `localStorage` hors de tout `try` (`main.ts:36-38`). `fetchTextSource` appelle `fetch` sans signal. Le modèle passe par Transformers.js (`camembert-model.ts`), qui remonte une progression en octets. Voir proposal.md pour les raisons.

## Goals / Non-Goals

**Goals :**
- Une restructuration prouvée par des tests inchangés, avant tout correctif.
- Aucun texte gardé ne doit plus pouvoir disparaître en silence.
- Chaque attente et chaque échec doit avoir un message et une sortie.
- `tracks.html` doit suivre DESIGN.md.

**Non-Goals :**
- Changer le comportement de la barre d'espace sur une touche focalisée (spécifié par `monitoring-vocal`).
- Changer le format du carnet (`version: 1`).
- Revoir la densité de la grille sur ordinateur : seul le petit écran change.

## Decisions

### D1. Façade et deux contrôleurs (couche ui)

`createTracksController` garde sa signature et son état public. Il compose deux modules nouveaux, tous deux dans la couche **ui**.
- `src/ui/tracks/notebook-controller.ts` : garde, réouverture, suppression, import, export, messages du carnet. Il dépend du port `NotebookStorage` (`src/ports/notebook-storage.ts`) et des contraintes que la façade lui passe.
- `src/ui/tracks/listening-controller.ts` : lecture, tempo, voix, raccourci. Il dépend des ports `Speech` (`src/ports/speech.ts`) et `MonitoringPreferences` (`src/ports/monitoring-preferences.ts`).

`installedPlugins` part dans `src/domain/registry.ts`, un module pur de la couche **domain** qui n'importe que les plugins du domaine : c'est la mitigation prévue de RISK-05. `mixer-state.ts` et `app.ts` l'importent. Les recettes restent dans `src/ui/tracks/recipes.ts`, car elles dépendent des noms de piste de l'interface. *Alternative écartée :* la racine de composition `src/ui/composition.ts`. Le réducteur aurait alors dépendu des adaptateurs (CamemBERT, fetch). Les tests du contrôleur (`controller.test.ts`, `notebook-controller.test.ts`, `monitoring-controller.test.ts`) servent de contrat de non-régression : aucune assertion ne change, seuls les imports de `mixer-state.test.ts` et `recipes.test.ts` suivent le déplacement.
*Alternative écartée :* exposer les contrôleurs directement à `app.ts`. Les tests auraient changé en même temps que le code et ne prouveraient plus rien.

### D2. Carnet : brut conservé, relire avant d'écrire (couches ui et adapters)

`parseNotebook` rend aussi la liste des entrées rejetées, telles quelles (`unknown[]`). La sérialisation écrit `{ version: 1, entries: [...valides, ...rejetées] }`. Les versions précédentes, qui valident entrée par entrée, ignorent toujours les rejetées. Avant toute écriture, le contrôleur du carnet relit le stockage. Il fusionne par identifiant : l'ajout ou la retouche viennent de l'onglet courant, les entrées inconnues viennent du stockage, une suppression retire son identifiant. Il écrit ensuite. `main.ts` écoute l'événement `storage` sur la clé du carnet et rafraîchit l'état. Un carnet illisible en entier (JSON cassé ou mauvais fichier) est copié sous `oulipao.notebook.bak` au premier `write`, puis jamais écrasé tant que la clé de secours existe.
*Alternative écartée :* une clé par entrée. Ce serait un changement de format et une migration, pour un gain nul à cette échelle.

### D3. Stockage protégé (couche adapters, câblage dans ui)

`src/adapters/storage/` gagne une fonction `safeStorage(getter)`. Elle tente le getter dans un `try` et renvoie, en cas d'échec, un `Storage` en mémoire marqué `persistent: false`. La façade expose ce drapeau. La vue en tire l'avertissement en tête du carnet et le message « Gardé pour cette séance. Exportez le carnet pour le conserver. ».

### D4. Délai d'inactivité (couche adapters)

`fetchTextSource` lit le corps par flux (`response.body.getReader()`) et réarme un minuteur de 30 s à chaque morceau. Quand il expire, il annule via un `AbortController` et lève une `StalledError` qui porte le nom de la ressource. Le préchargement du modèle réarme le même minuteur à chaque rappel de progression de Transformers.js. Le contrôleur reconnaît `StalledError` et compose le message dédié : la tête et le détail, comme en D6.
*Alternative écartée :* `AbortSignal.timeout(60 000)`. Il couperait une connexion lente mais vivante, alors que le modèle pèse 141 Mo.

### D5. `tagging` remis à faux (couche ui)

`run` et `reopen` passent par un `try/finally`. Si `run === runs` à la sortie, l'essai le plus récent remet `tagging: false`, quelle qu'en soit l'issue.

### D6. Messages structurés (couche ui)

Une erreur affichable devient `{ lead: string; detail: string }`. Le composant `ErrorMessage` (dans `src/ui/tracks/components/`) rend un `<p role="alert" class="error">` : filet `border-top: var(--rule) solid var(--error)`, `<strong>` pour la tête, détail à l'encre, touche optionnelle à la suite. Les avis restent de simples chaînes rendues dans `.notebook-message[role=status]`.

### D7. NFC à l'entrée (couche ui)

`setInput` et la réouverture appliquent `text.normalize('NFC')`, avant de stocker la saisie et avant l'étiquetage. On ne le fait pas dans le tokenizer : les positions des mots seraient décalées par rapport au texte affiché.

### D8. Jetons (styles et DESIGN.md)

`styles/tokens.css` gagne `--size-value: 11px`, `--size-grid-word: 14px`, `--size-read-narrow: 19px` et `--size-mark-narrow: 34px`. Le front matter `typography` et l'« Échelle » de DESIGN.md disent la même chose, avec le seuil de 768 px, et une ligne s'ajoute au journal des décisions. Les quatre déclarations de style de touche de `tracks.html` sont regroupées en un seul sélecteur, avec `padding: var(--space-1) var(--space-2)`. Sous 768 px, les touches et les pas prennent `min-height: 44px`, et les pas `min-width: 44px`.

### D9. Finitions (ui et adapters)

- Paramètre texte : envoi différé d'environ 150 ms après la dernière frappe, sans changer la spec (moins d'une demi-seconde).
- Export : `URL.revokeObjectURL` différé par `setTimeout(…, 0)`.
- Lexique (`lexicon-lookup-tagger.ts`) : en cas d'échec, `#lexicon = undefined` puis la promesse rejette.
- `recipes.test.ts` : `recipes.length === RECIPES.length`.

## Risks / Trade-offs

- [La fusion avant écriture ressuscite une entrée supprimée dans un autre onglet resté ouvert sans recevoir l'événement] → l'écoute de `storage` met l'état à jour avant le prochain geste ; une suppression retire l'identifiant au moment d'écrire.
- [Le minuteur de 30 s se déclenche pendant l'analyse du fichier, qui ne reçoit plus d'octets] → le minuteur n'arme que pendant la lecture du flux, il est coupé avant l'analyse.
- [Les cibles de 44 px élargissent la grille à 375 px] → la pagination passe déjà à 4 pas sous 640 px ; vérifier l'absence de défilement horizontal à 375 px.
- [Un oubli de l'état `persistent: false` dans un test] → la fabrique de dépendances de test fournit les deux variantes.

## Migration Plan

1. PR `refactor:` (restructuration seule) : les trois fichiers de tests du contrôleur restent intacts.
2. PR `fix:` du carnet et du stockage.
3. PR `fix:` des chargements et de la saisie.
4. PR `feat:` du système de design (jetons, message d'erreur, cibles tactiles, raccourci signalé).

Chaque PR se défait seule par revert. Le format du carnet ne change pas, donc aucune migration de données.

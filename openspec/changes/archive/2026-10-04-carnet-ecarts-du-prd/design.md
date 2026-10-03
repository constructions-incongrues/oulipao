# Design

## Context

Le carnet de la PR #48 est décrit dans `openspec/specs/carnet-de-textes-gardes/spec.md`. Le module pur `src/ui/tracks/notebook.ts` porte les schémas et les fonctions (entrée, fusion, sérialisation). Le contrôleur fournit les gestes (`keep`, `reopen`, `remove`, l'export et l'import) avec les dépendances injectées `now`, `newId`, `confirm` et `download`. Le composant `components/notebook.ts` affiche une section en bas de page. La copie du texte résultant passe par la dépendance `copy` du contrôleur, et `ruleMention` produit la mention de la chaîne.

## Goals / Non-Goals

**Goals :**
- Un format de stockage et d'export inchangé dans sa version : la retouche est un champ facultatif.
- Toute la logique nouvelle reste dans des fonctions pures ou dans le contrôleur, testables sans navigateur.

**Non-Goals :**
- Rouvrir une entrée avec sa retouche : la retouche n'est pas une sortie de la chaîne, et la table ne sait pas la produire.
- Retenir d'une visite à l'autre si le panneau est ouvert ou replié.

## Decisions

### 1. La retouche est un champ `edited` facultatif de l'entrée

`NotebookEntrySchema` gagne `edited: z.string().optional()`. Le texte affiché et copié est `edited ?? result`. La fonction pure `editEntry(entries, id, text)` pose `edited` ; elle le retire quand le texte est vide (une fois les espaces retirés) ou égal à `result`. Les anciennes entrées, qui n'ont pas ce champ, restent valides, et `version` reste à 1.

*Alternative écartée :* remplacer `result`. On perdrait la trace de ce que la chaîne a produit, alors que la réouverture le redonne.

### 2. La copie d'une entrée réutilise la dépendance `copy`

La fonction pure `entryClipboard(entry)` renvoie `` `${entry.source.text}\n\n${entry.edited ?? entry.result}${entry.mention}` ``. La mention commence déjà par `\n\n— `, et elle est vide pour un texte d'origine sans chaîne. Le contrôleur ajoute `copyEntry(id)`, qui passe par `dependencies.copy` et annonce « Copié. » ou « Copie impossible : … » dans `notebookMessage`. Aucune nouvelle dépendance n'est nécessaire.

*La question ouverte du PRD, « reprendre le texte de l'inspecteur de chaîne ou un format plus court » :* on reprend la mention de la copie, plus courte et déjà lisible dans un mail. On reviendra à l'autre option si le fondateur la trouve trop sèche.

### 3. Un drapeau `unsaved` dans l'état du contrôleur

`TracksState.unsaved` passe à `true` chaque fois qu'une vue est (re)construite par un geste : `run`, `dispatch`, et le chargement des verbes ou des prononciations qui change le texte. Il repasse à `false` après `keep` et après `reopen`. `reopen` appelle `confirm('Le texte en cours n’est pas gardé. Rouvrir quand même ?')` seulement si `unsaved` vaut `true` ; un refus sort sans rien changer.

*Alternative écartée :* comparer la table et la session avec chaque entrée du carnet. C'est plus juste après un aller-retour de réglage, mais cela coûte une comparaison profonde à chaque rendu pour un cas rare. Le drapeau peut demander une confirmation de trop, jamais en oublier une.

Le chargement des verbes après une réouverture reconstruit la vue sans que l'utilisateur ait fait un geste. Ce chemin (`rebuild` appelé par les chargements) ne lève donc pas le drapeau : seul un geste le fait.

### 4. Les jours se comptent en jours de calendrier, localement

La fonction pure `daysSince(iso, today)` donne la différence entre les dates locales (minuit à minuit), et non entre des instants divisés par 24 h. Un texte gardé à 23 h 50 compte ainsi pour « hier » dès minuit. Le libellé vient de `lastKeptLabel(days)` : « aujourd'hui », « hier », « il y a N jours ». Le composant reçoit `today: Date` en prop. `App` le reçoit de `main.ts`, qui passe `new Date()` à chaque rendu. Les tests passent une date fixe.

### 5. Le panneau est un `<details>` natif, placé sous la bande de sortie

`<details class="notebook">`, replié par défaut. Son `<summary>` porte le titre « Carnet », le compte et les jours : il est accessible au clavier sans code. Ce qu'il contient ne change pas (export, import, liste), avec en plus « Copier » et « Retoucher » par entrée. Dans `App`, le carnet sort du bas de page et vient juste après `Result`, hors de la bande collée (`.result` reste seule en `position: sticky`). Replié, il tient sur une ligne, ce qui respecte la condition du PRD : ne pas prendre plus de place que la bande épinglée.

L'état ouvert ou replié est laissé au navigateur. Un nouveau rendu de Preact ne referme pas un `<details>` ouvert tant que l'attribut `open` n'est pas piloté.

### 6. La retouche dans le composant : un formulaire natif, sans état

Chaque entrée porte un `<details class="retouch">`. Son `<summary>` est la touche « Retoucher », et il contient un `<form>` : un `<textarea name="text">` prérempli par `defaultValue` (la retouche ou le résultat), puis « Enregistrer » (`submit`) et « Annuler » (`reset`). `onSubmit` lit le champ, appelle `onEdit(id, text)` et replie le panneau. `reset` rend le texte d'avant et replie aussi. `defaultValue` ne réécrase pas un brouillon en cours quand la page se redessine.

*Alternative écartée :* un état local (`useState`) qui limite la retouche à une entrée à la fois. Aucun composant de la page n'a d'état local, et les aides de test appellent les composants en dehors d'un rendu. Le formulaire natif fait le même travail sans code d'état. Plusieurs entrées peuvent donc être en retouche en même temps, chacune avec son propre formulaire.

## Risks / Trade-offs

- [Le drapeau `unsaved` demande une confirmation après un aller-retour de réglage qui revient à l'état gardé] → C'est accepté : la confirmation est un clic, une perte de travail serait pire.
- [Un `<details>` replié cache le carnet, et donc les textes gardés] → L'en-tête montre toujours le compte et les jours, ce qui est l'information de la garde. Après « Garder », le message « Gardé. » reste dans la bande de sortie.
- [La retouche n'est pas reproductible par la chaîne] → C'est assumé par le PRD : la retouche est le texte du fondateur, et le carnet le garde à côté du résultat produit.

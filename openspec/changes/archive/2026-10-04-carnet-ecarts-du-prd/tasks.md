# Tâches

Le plan de construction compte trois vagues :

- **Vague 0** (groupe 1) : les fonctions pures du carnet. Leurs signatures sont gelées à la fin du groupe.
- **Vague 1** (groupes 2 et 3), en parallèle : le contrôleur (`controller.ts` seulement) et le composant (`components/notebook.ts` seulement).
- **Vague 2** (groupe 4) : l'assemblage, les styles, la documentation et la recette.

L'ordre d'intérêt, si le temps manque : la copie d'une entrée (1.2, 2.1, 3.2), puis la confirmation avant de rouvrir (2.2), puis le panneau et les jours, puis la retouche.

## 1. Le carnet (vague 0)

- [x] 1.1 [ui] Ajouter `edited: z.string().optional()` à `NotebookEntrySchema`, et la fonction pure `editEntry(entries, id, text)`, qui pose la retouche, ou la retire si le texte est vide (espaces retirés) ou égal à `result`. Vérifier dans `test/ui/tracks/notebook.test.ts` :
  - une entrée sans `edited` reste valide ;
  - un aller-retour de sérialisation garde `edited` ;
  - `editEntry` pose la retouche, la retire si le texte est vide ou égal à `result`, et ignore un identifiant inconnu.
- [x] 1.2 [ui] Ajouter `entryClipboard(entry)` : l'original, une ligne vide, `edited ?? result`, puis la mention. Vérifier par les tests :
  - « La ferme.\n\nL'oncle.\n\n— S+7 sur les noms (Oulipao) » ;
  - avec une retouche ;
  - sans mention, le texte n'a pas de ligne vide finale.
- [x] 1.3 [ui] Ajouter `daysSince(iso, today)` (différence entre dates locales) et `lastKeptLabel(days)` (« aujourd'hui », « hier », « il y a N jours »). Vérifier par les tests :
  - un texte gardé le 12 à 23 h 50 donne 0 le 12 et 1 le 13 à 0 h 10 ;
  - un texte du 9 donne 3 le 12 ;
  - les trois libellés.

## 2. Le contrôleur (vague 1, en parallèle du groupe 3)

- [x] 2.1 [ui] Ajouter `copyEntry(id)` : `dependencies.copy(entryClipboard(entry))`, puis « Copié. » ou « Copie impossible : … » dans `notebookMessage` ; un identifiant inconnu ne fait rien. Vérifier dans `test/ui/tracks/notebook-controller.test.ts` : le texte copié, le message de succès et le message d'échec.
- [x] 2.2 [ui] Ajouter l'état `unsaved` :
  - `true` après `run` et après `dispatch` quand une vue existe ;
  - `false` après `keep` et après `reopen` ;
  - le rebuild déclenché par le chargement des verbes ou des prononciations ne le change pas.

  `reopen` demande `confirm` seulement si `unsaved` vaut `true`, et sort sans rien changer sur un refus. Vérifier par les tests :
  - après un réglage puis un refus, table, saisie et vue sont inchangées ;
  - juste après « Garder », aucune confirmation ;
  - sans vue, aucune confirmation ;
  - après une réouverture, aucune confirmation.
- [x] 2.3 [ui] Ajouter `editEntry(id, text)` : il applique la fonction pure, écrit le stockage, et signale un échec d'écriture dans `notebookMessage`. Vérifier par les tests :
  - la retouche est écrite et relue par un nouveau contrôleur ;
  - la réouverture d'une entrée retouchée redonne `result` ;
  - un échec d'écriture donne un message.

## 3. Le composant (vague 1, en parallèle du groupe 2)

- [x] 3.1 [ui] Faire de `Notebook` un `<details class="notebook">` replié :
  - le `<summary>` contient « Carnet », le compte et, s'il y a des entrées, « dernier texte … » calculé à partir de la prop `today` ;
  - le contenu actuel reste dans le panneau.

  Vérifier par `test/ui/tracks/notebook-component.test.ts` :
  - pas d'attribut `open` ;
  - le compte et « il y a 3 jours » dans le `summary` ;
  - un carnet vide n'affiche pas de jours.
- [x] 3.2 [ui] Ajouter à chaque entrée la touche « Copier » (`onCopy(id)`), avec un `aria-label` qui porte la date. Afficher `edited ?? result`, et la mention « retouché » quand il y a une retouche. Vérifier par les tests : le rappel, le texte retouché et sa mention.
- [x] 3.3 [ui] Ajouter « Retoucher », sans état local : un `<details class="retouch">` dont le `<summary>` est la touche, avec un `<form>` qui contient un `<textarea>` prérempli par `defaultValue`, « Enregistrer » (`submit`, qui appelle `onEdit(id, text)` et replie) et « Annuler » (`reset`, qui replie). Vérifier par les tests, en actionnant `onSubmit` et `onReset` : le brouillon est envoyé, l'envoi par défaut est empêché, le panneau se replie, et « Annuler » n'envoie rien.

## 4. Assemblage, styles, documentation, recette (vague 2)

- [x] 4.1 [ui] Dans `app.ts`, placer `Notebook` juste après `Result` et retirer le bloc du bas de page. Relier `onCopy` et `onEdit`, et passer `today`, une nouvelle prop d'`App` fournie par `main.ts` (`new Date()`). Vérifier dans `test/ui/tracks/app.test.ts` :
  - le carnet se trouve entre la bande de sortie et la saisie dans le HTML rendu ;
  - « Garder » met à jour le compte du `summary`.
- [x] 4.2 [ui] Dans `tracks.html`, styler le `summary` du carnet comme `.browser > summary`, le `<textarea>` de retouche en Spectral sur fond papier, et la mention « retouché » en encre secondaire, en suivant `DESIGN.md`. Vérifier : `npm run build` passe, et `test/pages.test.ts` passe sans changer la CSP.
- [x] 4.3 [docs] Mettre à jour la section « Carnet » de `docs/tracks.md` : sa place, la copie d'une entrée, la retouche, la confirmation et les jours. Vérifier que la page décrit le format copié.
- [x] 4.4 Lancer `npm test` et vérifier que la couverture reste au-dessus de 90 %.
- [x] 4.5 Faire la recette dans le navigateur (configuration `oulipao`). Vérifier :
  - le carnet est replié sous la bande, et seule la bande reste collée quand on défile ;
  - copier une entrée, puis coller le résultat dans un champ, donne le format attendu ;
  - une retouche survit au rechargement, et la réouverture redonne le résultat produit ;
  - rouvrir après un réglage demande confirmation, et un refus ne change rien ;
  - l'en-tête affiche les jours ;
  - à 375 px, pas de défilement horizontal.

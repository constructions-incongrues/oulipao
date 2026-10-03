# Tâches

Le plan de construction compte trois vagues :

- **Vague 0** (groupe 1) : le module du carnet, le port et l'adaptateur. Un seul constructeur s'en charge, puis on fusionne. Les signatures de `notebook.ts` sont **gelées** à la fin du groupe.
- **Vague 1** (groupes 2 et 3) : deux groupes en parallèle. Le groupe 2 ne touche que `controller.ts` et ses tests. Le groupe 3 ne touche que les composants, qui reçoivent tout par leurs props.
- **Vague 2** (groupe 4) : l'assemblage dans `app.ts` et `main.ts`, la documentation et la recette.

Si l'appétit S doit tenir, on livre d'abord 2.1, 2.2, 3.1, 3.2 et 4.1 (garder et lire). On fusionne, puis on fait le reste.

## 1. Le carnet et son stockage (vague 0)

- [x] 1.1 [ports] Créer `src/ports/notebook-storage.ts` avec `NotebookStorage { read(): string | null; write(data: string): void }`. Vérifier : `npm run typecheck` passe.
- [x] 1.2 [ui] Créer `src/ui/tracks/notebook.ts` :
  - `NotebookEntrySchema` : `id`, `keptAt` (date ISO), `result`, `mention`, `source: { text, tagged: TaggedWord[] }`, `mixer: MixerStateSchema` ;
  - `NotebookFileSchema` : `{ version: 1, entries }` ;
  - les fonctions pures `parseNotebook(raw)` (entrées valides, nombre rejeté, erreur d'enveloppe), `addEntry`, `removeEntry(id)`, `mergeEntries(current, incoming)` (ajoutées, déjà présentes, rejetées) et `serializeNotebook`.

  Vérifier par `test/ui/tracks/notebook.test.ts` :
  - un aller-retour `serializeNotebook` puis `parseNotebook` est identique ;
  - une entrée sans date est rejetée et comptée, les autres sont gardées ;
  - un JSON illisible et un JSON qui n'est pas un carnet donnent un carnet vide et une erreur ;
  - une fusion de 4 entrées présentes et 1 nouvelle annonce 1 ajoutée et 4 déjà présentes ;
  - la liste est triée du plus récent au plus ancien.
- [x] 1.3 [adapters] Créer `src/adapters/storage/local-storage-notebook.ts`, qui implémente `NotebookStorage` sur un `Storage` passé en paramètre, sous la clé `oulipao.notebook`. Vérifier par un test avec un faux `Storage` :
  - lecture et écriture ;
  - `null` quand la clé est absente ;
  - une erreur de quota remonte telle quelle.

## 2. Les gestes du contrôleur (vague 1, en parallèle du groupe 3)

- [x] 2.1 [ui] Ajouter à `TracksDependencies` `notebook`, `now`, `newId`, `confirm` et `download`. À la création du contrôleur, charger le carnet dans l'état (`notebook: NotebookEntry[]` et `notebookMessage`). Une entrée rejetée est signalée dans `notebookMessage`. Vérifier par `test/ui/tracks/controller.test.ts` avec un stockage factice : deux entrées valides et une abîmée donnent 2 entrées et un message.
- [x] 2.2 [ui] `keep()` : actif dans les mêmes conditions que `copy()`. Il range `result`, `mention` (`ruleMention`), la session et le `mixer`, écrit le stockage et annonce « Gardé. » dans `copyMessage`. Un échec d'écriture donne « Impossible de garder : … » et laisse le texte affiché. Vérifier par les tests :
  - garder après un S+7 ajoute une entrée datée par `now` ;
  - garder avec une vue périmée ou vide ne fait rien ;
  - `copy()` n'ajoute aucune entrée ;
  - une écriture qui lève l'exception affiche le message d'erreur.
- [x] 2.3 [ui] `reopen(id)` :
  - vérifier que chaque `instance.type` est connu, sinon afficher un message et laisser le carnet intact ;
  - sinon : `preload()`, puis remettre la session, `input = source.text`, `MixerStateSchema.parse(entry.mixer)`, `editing: false`, `stale: false`, et appeler `buildView` sans étiqueteur.

  Vérifier par les tests :
  - une chaîne S+7 et lipogramme, avec un verrou et un pas bouché, redonne `view.result === entry.result` ;
  - l'étiqueteur factice n'est jamais appelé ;
  - un type inconnu donne le message.
- [x] 2.4 [ui] `remove(id)` demande `confirm`, puis supprime et écrit ; un refus ne change rien. Vérifier par les tests dans les deux cas.
- [x] 2.5 [ui] `exportNotebook()` appelle `download('oulipao-carnet-AAAA-MM-JJ.json', serializeNotebook(...))`, avec la date de `now`. `importNotebook(text)` fusionne, écrit et annonce les comptes, ou refuse un mauvais fichier sans rien changer. Vérifier par les tests : nom du fichier, aller-retour vidage puis import (4 entrées), import en double, mauvais fichier.

## 3. Les composants (vague 1, en parallèle du groupe 2)

- [x] 3.1 [ui] Dans `components/result.ts`, ajouter la touche « Garder » juste après « Copier », avec les props `onKeep` et le même `disabled`. Vérifier par le test du composant : le bouton est présent, désactivé quand la vue est vide ou périmée, et appelle `onKeep`.
- [x] 3.2 [ui] Créer `components/notebook.ts`, la section « Carnet » :
  - un titre et le compte (« Aucun texte gardé », « 1 texte gardé », « 3 textes gardés ») ;
  - les entrées du plus récent au plus ancien, chacune avec sa date, son texte et sa mention ;
  - les touches « Rouvrir » et « Supprimer » ;
  - « Exporter » et « Importer » (`<input type="file" accept="application/json">` qui lit `File.text()` et appelle `onImport`) ;
  - la zone `aria-live` du carnet, et la ligne qui rappelle que le carnet vit dans ce navigateur.

  Styles selon `DESIGN.md`, avec les variables de `styles/tokens.css`. Vérifier par le test du composant : le compte au pluriel, l'ordre, les rappels `onReopen`, `onRemove`, `onExport` et `onImport`.

## 4. Assemblage, documentation, recette (vague 2)

- [x] 4.1 [ui] Dans `app.ts`, placer la section « Carnet » après l'inspecteur et relier les props aux gestes du contrôleur. Dans `main.ts`, brancher :
  - `createLocalStorageNotebook(localStorage)` ;
  - `() => new Date()` et `() => crypto.randomUUID()` ;
  - `(m) => window.confirm(m)` ;
  - un téléchargement par `Blob` et une ancre `download`.

  Vérifier : `npm run build` passe, et `test/pages.test.ts` passe sans changer la CSP.
- [x] 4.2 [docs] Décrire le carnet dans `docs/tracks.md` : garder, rouvrir, supprimer, exporter et importer, où vivent les textes, que faire avant de vider le navigateur. Vérifier que la page cite le format du fichier.
- [x] 4.3 Lancer `npm test` et vérifier que la couverture reste au-dessus de 90 %.
- [x] 4.4 Faire la recette dans le navigateur (configuration `oulipao` de `.claude/launch.json`). Vérifier :
  - garder un texte, recharger, le retrouver ;
  - rouvrir une chaîne à deux filtres avec verrou, et obtenir un texte identique ;
  - supprimer, puis renoncer ;
  - exporter, vider le stockage, importer, et retrouver les entrées ;
  - l'onglet réseau ne montre aucune requête contenant le texte ;
  - l'ordre de tabulation va jusqu'au carnet ;
  - à 375 px, pas de défilement horizontal.

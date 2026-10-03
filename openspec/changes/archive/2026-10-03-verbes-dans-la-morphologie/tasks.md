# Tâches

## 1. Données des verbes

- [x] 1.1 [domain] Créer `src/domain/verb.ts` avec `VerbFormSchema` et le type `VerbFeatures` : onze temps, personnes `1s…3p`, genre et nombre du participe passé. Vérifier par `test/domain/verb.test.ts`, qui couvre une forme valide par temps et le refus d'un temps inconnu.
- [x] 1.2 [ports] Créer `src/ports/verbs.ts` (`VerbRepository` : `infinitives`, `readings`, `forms`, `blocksElision`). Vérifier que `npx tsc --noEmit` passe.
- [x] 1.3 [adapters] Écrire `src/adapters/lexicon/grammalecte-verbs.ts`, qui fait trois choses :
  - éclater une ligne brute en une ligne par lecture ;
  - garder les auxiliaires `v0` (pour les reconnaître), exclure `1isg`, `1jsg` et les marques `!` ;
  - reprendre la note « pel ».

  Ajouter l'en-tête MPL. Vérifier par `test/adapters/verbs.test.ts`, sur des lignes brutes de *manger*, *être*, *haïr*, et un participe passé au féminin pluriel.
- [x] 1.4 [adapters] Ajouter `scripts/build-verbs.ts` et le script `build:verbs` dans `package.json`, puis produire `data/verbes-oulipao.tsv`. Vérifier que le script affiche le nombre de lignes et d'infinitifs (environ 8 400 sans *être* ni *avoir*). Mesurer aussi la taille compressée (`gzip -c | wc -c`) : au-delà de 4 Mo, revoir la décision 3 du design avant de poursuivre.
- [x] 1.5 [adapters] Écrire `src/adapters/morphology/in-memory-verbs.ts`, qui fait quatre choses :
  - lire et valider chaque ligne par un `z.tuple` et `VerbFormSchema`, et lever en citant la ligne fautive ;
  - indexer les formes par forme et par infinitif ;
  - trier les infinitifs avec `Intl.Collator('fr')` ;
  - exposer `loadVerbs(source)`.

  Vérifier par `test/adapters/verbs.test.ts` les scénarios « Formes de manger » et « Ligne non conforme ». Ajouter des verbes factices à `test/support/morphology.ts` pour les tests du domaine.

## 2. Moteur des verbes

- [x] 2.1 [domain] Rendre `elides` de `src/domain/s7/elision.ts` indépendant de la morphologie : il reçoit tout objet doté de `blocksElision` (morphologie, verbes, ou les deux). Ses appelants ne changent pas. Vérifier que `npm test` passe sans toucher aux tests existants.
- [x] 2.2 [domain] Implémenter `pickVerbReading` (heuristique du pronom, un mot de plus si un pronom réfléchi ou complément s'intercale, puis les préférences de temps et la troisième personne). Vérifier par `test/domain/verb.test.ts` les scénarios « mange après tu » et « Sujet nominal », plus *je me lave* et une forme à lecture unique.
- [x] 2.3 [domain] Implémenter `shiftVerb` (V+n strict sur `infinitives()`, mêmes traits, ou une raison si la forme manque) et le refus des auxiliaires. Vérifier par des tests qui couvrent :
  - un décalage positif et un décalage négatif ;
  - le tour du dictionnaire ;
  - le verbe défectif ;
  - *être* et *avoir* laissés avec la raison « auxiliaire ».
- [x] 2.4 [domain] Implémenter `neighbourVerb` (premier infinitif suivant qui a, aux mêmes traits, une forme sans la lettre) en réutilisant `after` et `containsLetter` de `neighbour.ts`. Vérifier par des tests qui couvrent le scénario « Verbe fautif » du lipogramme et le cas sans voisin.
- [x] 2.5 [domain] Implémenter l'élision du pronom devant le verbe nouveau (*je*, *me*, *te*, *se*, *ne*, *le*, *la*, et l'apostrophe du texte d'origine). Vérifier par les scénarios « Élision perdue » et « Élision gagnée », et par un verbe à h aspiré.

## 3. Filtres

- [x] 3.1 [domain] Ajouter `verbs?: VerbRepository` à `PluginResources` dans `src/domain/plugin.ts`. Vérifier que `npx tsc --noEmit` passe et que `test/domain/plugin.test.ts` reste vert.
- [x] 3.2 [domain] Étendre le S+n (`src/domain/s7/plugin.ts`) :
  - pistes `['noun', 'adjective', 'verb']`, `defaultTargets` inchangé ;
  - traitement des verbes visés après les adjectifs, en respectant les pas bouchés et les verrous ;
  - raison « conjugaisons en cours de chargement » quand `verbs` manque ;
  - `help` qui décrit les verbes.

  Vérifier par `test/domain/s7/plugin.test.ts` le scénario « S+7 sur les verbes », le verbe verrouillé à S+3, le pas bouché et l'absence de verbes.
- [x] 3.3 [domain] Remplacer dans `src/domain/lipogram/plugin.ts` le cas « verbe, laissé en v1 » par `neighbourVerb`, avec auxiliaire, chargement et absence de voisin comme raisons. Mettre à jour `test/domain/lipogram/plugin.test.ts` (le test qui attendait le verbe intact attend désormais son remplacement) et vérifier que `npm test` passe.
- [x] 3.4 [domain] Vérifier que la chaîne « S+7 sur les verbes puis lipogramme en e » donne un verbe sans « e » au bon temps, par un test de `test/domain/plugin-chain.test.ts`.

## 4. Chargement dans la page

- [x] 4.1 [ui] Ajouter `createVerbsLoader(base)` et `VERBS_VERSION` à `src/ui/composition.ts`, sur le modèle du chargeur de morphologie : un échec n'est pas gardé. Vérifier par `test/ui/composition.test.ts`.
- [x] 4.2 [ui] Dans `src/ui/tracks/controller.ts` :
  - ajouter la dépendance `loadVerbs` ;
  - après chaque geste et après `run`, charger les verbes une fois si une instance active vise `verb`, puis appeler `rebuild` ;
  - garder l'erreur et permettre de relancer.

  Passer `verbs` à `buildView`, puis à `runChain`. Câbler `loadVerbs` dans `src/ui/tracks/main.ts`. Vérifier par `test/ui/tracks/controller.test.ts` les scénarios « Page ouverte sans verbes visés » (le chargeur n'est jamais appelé), « Verbes visés » (raison, puis recalcul sans nouvel étiquetage) et l'échec suivi d'une relance.
- [x] 4.3 [ui] Vérifier dans `test/ui/tracks/view-model.test.ts` la mention « — S+7 sur les noms · S+7 sur les verbes (Oulipao) » et le résumé du lipogramme, qui compte les mots qui gardent la lettre et non plus les verbes à part.
- [x] 4.4 [ui] Recette dans le navigateur (aperçu de la page à pistes) :
  - le fichier des verbes n'est pas demandé à l'ouverture (onglet réseau) ;
  - viser les verbes avec un S+7 les fait changer après le chargement ;
  - un lipogramme en e remplace « mangeait ».

  Faire une capture à l'appui.

## 5. Documentation et clôture

- [x] 5.1 Mettre à jour `docs/lexiques.md` (fichier des verbes, colonnes, commande, poids mesuré), `docs/plugins.md` (`verbs` dans les ressources, chargement à la demande) et `docs/s7.md` (V+n, heuristique du pronom, limites : temps composés, subjonctif sans pronom). Vérifier que chaque fichier mentionne `verbes-oulipao.tsv` ou le V+n.
- [x] 5.2 Lancer `npm test`, vérifier que la couverture reste au-dessus de 90 % (lignes, branches, fonctions) et que `openspec validate verbes-dans-la-morphologie --strict` passe.

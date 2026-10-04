# Tasks

## 1. Données : les échelles

- [x] 1.1 (adapters) Écrire les fonctions pures de `src/adapters/lexicon/openlexicon-scales.ts` :
  - lecture des quatre TSV avec leurs colonnes de note (design, décision 5, étape 1) ;
  - réduction au lemme et à la catégorie par le port de morphologie ;
  - rang percentile par base, en traitant les ex aequo ;
  - moyenne des rangs par lemme, puis score de 0 à 100 ;
  - compte des entrées écartées.

  Vérifier par `test/adapters/openlexicon-scales.test.ts`, avec une morphologie factice : un doublon reçoit la moyenne de ses rangs, « que » et « battre » sont écartés, « matons » est ramené à « maton », et les ex aequo sont traités.
- [x] 1.2 (scripts) Télécharger les quatre TSV dans `data/brut/autres/openlexicon/`. Écrire `scripts/build-scales.ts` et la commande `npm run build:scales`, qui produisent `data/echelles-oulipao.tsv` avec un en-tête `#` portant la licence CC BY-SA 4.0 et les quatre références. Vérifier deux choses : relancer la commande donne un fichier identique (`git diff --exit-code data/echelles-oulipao.tsv`), et le script affiche, par ordre et par catégorie, le nombre de lemmes gardés et d'entrées écartées. Noter ces chiffres dans la PR.
- [x] 1.3 (docs) Ajouter la provenance dans `THIRD_PARTY_LICENSES.md`, sous « Embarqués dans le site » (licence, les quatre références, lien vers le README d'openlexicon), et dans `docs/lexiques.md` (URL des sources, date, commande de reconstruction). Vérifier en relisant la ligne d'openlexicon à côté de celle du GLÀFF.

## 2. Port et chargement des échelles

- [x] 2.1 (domain) Ajouter `S7OrderSchema` (`alphabetical | valence | arousal | concreteness`) et le type `ScaleOrder` dans `src/domain/s7/types.ts`. (ports) Créer `src/ports/scales.ts` avec l'interface `ScaleRepository` (`scale`, `score`), et ajouter `scales?: ScaleRepository` à `PluginResources`. Vérifier par `npm run typecheck`.
- [x] 2.2 (adapters) Écrire `loadScales` dans `src/adapters/morphology/in-memory-scales.ts` : il valide chaque ligne par zod, trie chaque échelle par score croissant puis par ordre alphabétique, et donne la note par lemme. Vérifier par `test/adapters/scales.test.ts` : une ligne invalide est rejetée avec un message clair, l'ordre est stable, et un lemme absent a une note `undefined`.

## 3. Le S+n ordonné

- [x] 3.1 (domain) Écrire `rankedMorphology(morphology, scales, order)` dans `src/domain/s7/ranked-morphology.ts`. Pour les noms et les adjectifs, il renvoie les listes de l'échelle, la même instance de liste à chaque appel, et délègue tout le reste. Vérifier par `test/domain/s7/ranked-morphology.test.ts`, avec des ports factices : deux appels renvoient la même liste, et une échelle absente (la concrétude des adjectifs) donne une liste vide.
- [x] 3.2 (domain) Dans `src/domain/s7/plugin.ts` :
  - ajouter le paramètre `order`, avec sa valeur par défaut, et le choix « Ordre » placé avant « Parmi » ;
  - passer la vue ordonnée aux noms et aux adjectifs ;
  - sauter les verbes quand l'ordre n'est pas alphabétique ;
  - remplacer les raisons par « sans note » ;
  - laisser le texte tel quel avec la raison « échelles en chargement » quand `scales` manque.

  Vérifier par `test/domain/s7/plugin.test.ts`, en reprenant les scénarios de `specs/ordres-du-s7` : vers le majeur, vers le mineur, seule la tierce bouge, concrétude sans adjectifs, verbes visés, ordre par défaut, chaîne ancienne sans `order`, et verrou ou dé sur une échelle.
- [x] 3.3 (domain) Adapter les titres, les noms et l'aide : V+3, I−2, C+7, V+dé, l'échelle nommée avec sa source, et une mention qui dit que les mots sans note et les verbes restent (l'aide n'a pas accès aux données, elle ne compte pas les mots). Vérifier par `plugin.test.ts` ; le libellé de bande « V+3 sur les noms » se vérifie en 4.2.
- [x] 3.4 (domain) Ajouter `detail: z.string().optional()` à `WordMarkSchema`. Le S+n ordonné y écrit « valence 12 → 31 » pour chaque mot remplacé. Vérifier par `plugin.test.ts` (la marque d'un mot remplacé porte ses deux notes) et en relançant toute la suite : les marques existantes restent valides.

## 4. Interface

- [x] 4.1 (ui) Ajouter `createScalesLoader` et `SCALES_VERSION` dans `src/ui/composition.ts`, sur le modèle de la phonétique. Ajouter l'état `scales: Loading` dans `src/ui/tracks/controller.ts`, lancer le chargement dès qu'une instance S+n active a un ordre autre qu'alphabétique, transmettre `scales` à `buildView` et aux ressources, et afficher l'erreur avec « Relancer » dans `app.ts`. Vérifier par les tests du contrôleur : le chargement est lancé une seule fois, un échec laisse le texte inchangé et affiche « Relancer », et une relance qui réussit transforme le texte.
- [x] 4.2 (ui) Afficher `detail` dans la bande de l'inspecteur (`src/ui/tracks/view-model.ts` et le rendu), avec le même style que `reason`, selon `DESIGN.md`, et lisible par un lecteur d'écran. Vérifier par un test du modèle de vue (la bande V+3 porte « valence 12 → 31 ») et dans l'aperçu du navigateur. La note passe à la ligne sous le mot pour ne pas élargir la colonne.

## 5. Vérification d'ensemble

- [x] 5.1 Lancer `npm test` (couverture au-dessus de 90 %), `npm run typecheck` et `npm run build`.
- [x] 5.2 Dans l'aperçu du navigateur, faire une tierce picarde de bout en bout :
  - coller un texte triste et brancher un S+n d'ordre « valence » sur les noms et les adjectifs ;
  - moduler le décalage par la rampe de position, de 0 à +5 ;
  - vérifier que le texte s'éclaire vers la fin, que les mots sans note restent, que l'inspecteur montre les deux notes et que le titre affiche V+n ;
  - garder le texte au carnet et vérifier que la mention dit V+n.

  Joindre une capture d'écran à la PR.

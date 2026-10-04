# Tasks

## 1. Mesure

- [x] 1.1 ui : sur la prévisualisation, avec l'exemple de 533 mots, mesurer la plus longue tâche du fil principal pendant une mise en pistes (`PerformanceObserver` sur `longtask`). Noter la valeur et la branche retenue (A ≤ 200 ms, B > 200 ms) sous « Decisions › 0 » dans `design.md`. Vérifier : la valeur et la branche y sont écrites.

## 2. Non-régression et point fixe (domain)

- [x] 2.0 domain + ui : écrire d'abord le contrat de non-régression (revue d'ingénierie, D3). Comportements préservés à l'identique :
  - mettre en pistes : nouvel étiquetage, pas rouverts, verrous tombés, essai le plus récent qui l'emporte ;
  - « Itérer » et « Figer » : garde sans doublon, filiation, un échec de garde laisse tout en place ;
  - `reread` : « du » relu en « de la » garde le mot d'origine, un mot absorbé ne donne aucun mot relu.

  Ajouter trois cas : `test/ui/tracks/controller.test.ts` (deux mises en pistes, la plus récente l'emporte), `test/ui/tracks/generations.test.ts` (« Garder » puis « Itérer » : aucun doublon) et le test de la chaîne (contraction et mot absorbé). Vérifier : ces cas passent avant les tâches 2.3, 3.1 et 3.2, puis après, sans qu'aucun test existant change.

  *Fait le 2026-10-04 :* les trois cas existaient déjà. Ce sont `controller.test.ts:164` (« deux lancements : seul le plus récent compte »), `generations.test.ts:148` (« pas de doublon ») et `plugin-chain.test.ts:82-94` (« du » relu en « de la », mot retiré vide). Ils sont désignés ici comme contrat de non-régression, sans être dupliqués (49 tests verts avant la refonte).

- [x] 2.1 domain : ajouter `src/domain/loop.ts` avec `findRepeat(texts)`, qui compare le dernier texte aux textes d'indice ≥ 1, caractère pour caractère. Vérifier par des tests : point fixe (`length` 1), cycle de 2, aucune répétition, un tour 0 identique ignoré, une suite de moins de 3 textes.

- [x] 2.3 domain : extraire de `reread` (`src/domain/plugin-chain.ts:94-104`) l'attribution mot à mot en `ownersOf(spans, tokens)`, exportée, sans changer `reread` (revue d'ingénierie, D1). Dans `src/domain/loop.ts`, `alignTour(segments, tagged)` s'appuie sur `ownersOf` pour relier chaque mot d'origine du tour k−1 au premier mot de la source du tour k qui en descend, ou à rien s'il a été retiré. Vérifier par des tests : un remplacement simple, un remplacement en deux mots, un mot retiré, une élision (« l'arbre »), un trait d'union, un mot répété dans le texte.

## 3. Tour sans effet de bord (ui)

- [x] 3.1 ui : ajouter `src/ui/tracks/loop.ts` avec `computeTour(previous, mixer, deps)` (étiquetage, `reset-steps`, `buildView`), puis réécrire `tagAs` dans `controller.ts` pour qu'il passe par la même suite. Vérifier : les tests existants d'« Itérer », de « Figer » et de la mise en pistes passent sans changement, et un test avec un étiqueteur factice montre que `computeTour` ne modifie pas l'état du contrôleur.
- [x] 3.2 ui : dans `controller.ts`, extraire de `nextGeneration` la garde (`ensureKept()`, qui garde le texte en cours ou reprend `lastKept`). Vérifier : les scénarios de « Garde automatique » passent toujours.

## 4. La boucle dans le contrôleur (ui)

- [x] 4.1 ui : dans `controller.ts`, ajouter l'état `loop`, le réglage `tours` (2 à 12, 4 par défaut) et `loop()`. Ce geste garde le tour 1 avec `ensureKept()`, puis enchaîne `computeTour` jusqu'au compte demandé, s'arrête sur `findRepeat`, et laisse l'écoute en marche. Vérifier par des tests avec un étiqueteur factice : « Quatre tours de S+7 » (carnet + 1), « Rien à boucler », « Deux boucles identiques », « Lipogramme bouclé », « Oscillation », un stockage plein qui arrête le geste.
- [x] 4.2 ui : dans `controller.ts`, ajouter l'avancement (tour en cours sur le compte demandé, publié dès le clic ; avant chaque tour, attendre une image puis rendre la main avec `setTimeout(0)`, pour que l'avancement se peigne avant l'étiquetage qui bloque), `stopLoop()` consulté entre deux tours, l'état « arrêtée au tour k sur n » avec reprise au tour suivant, et l'échec d'étiquetage qui garde les tours faits avec son message. Suivre la branche notée en 1.1. Branche A : chaque tour est publié dès qu'il est prêt. Branche B : les tours sont publiés à la fin ou à l'arrêt. Vérifier par les tests « Arrêter au troisième tour », « Reprendre une boucle arrêtée » et « Échec au cinquième tour ».
- [x] 4.3 ui : dans `controller.ts`, abandonner la boucle dans `rebuild` (où passent tous les gestes de la table via `dispatch`, `controller.ts:287` et `:493`), dans `tagAs`, `reopen` et `nextGeneration` (avec un numéro d'essai, et le message « Boucle abandonnée : … Le tour 1 est au carnet. ») quand la saisie change, quand la table change, à une nouvelle mise en pistes, à la réouverture, et sur « Itérer » ou « Figer ». Vérifier par le test « Toucher la table », et par un test où un calcul abandonné en cours ne publie rien.
- [x] 4.4 ui : dans `controller.ts`, ajouter `showTour(k)`. Faire en sorte que `keep()` (défini dans `notebook-controller.ts:145`, délégué par `controller.ts`) garde le tour montré : comportement actuel au tour 1, une seule entrée au tour k ≥ 2 (source k−1, résultat k, parent `firstKept`, ancêtre, passes + k−1 fois la passe), désactivé au tour 0. Ajouter à `NotebookEntrySchema` (`notebook.ts`) le champ optionnel `loop: { tours, shown }` (zod, `.optional().catch(undefined)`, export version 1 inchangée), écrit par la garde d'un tour k ≥ 2 (revue de portée, D6). Faire suivre au curseur le dernier tour tant qu'on ne l'a pas touché. Copier copie le tour montré. Un tour vide arrête le calcul (« tout retiré au tour k »). Vérifier par les tests « Garder le tour 5 » (mention « ×5 »), « Rouvrir un tour gardé puis itérer », « Le curseur suit les tours » et « Tout retiré ».

- [x] 4.6 ui : dans `loop.ts`, composer les `alignTour` de chaque tour pour tenir la lignée de chaque mot du tour 0 (« — » s'il est retiré, « ? » si le descendant est introuvable) et, pour chaque tour k ≥ 2, les segments des mots changés : ce sont les `marks` de la vue du tour k, sans alignement (D1). Vérifier par les tests « Suivre livre », « Un mot retiré » et « La dérive soulignée » avec un étiqueteur factice.
- [x] 4.7 ui : dans `listening-controller.ts`, lire le tour montré quand il n'est pas le tour 1 (`tokenize` du texte du tour, indice de mot gardé au changement de tour, ramené à 0 au-delà de la fin, aucun pas marqué, mot dit marqué sur le papier avec la classe `spoken`, `listened` levé). Vérifier par les tests « Changer de tour en écoutant » et « Garder après avoir écouté » avec une voix factice.

- [x] 4.8 ui : dans `listening-controller.ts`, faire lire au tour 1 tout le texte : la grille suit la page du pas joué, la lecture reprend au début après le dernier mot, et une page choisie à la main la fait repartir de son premier pas (delta `monitoring-vocal`, retour du fondateur du 2026-10-04). Vérifier par les tests « la tête lit tout le texte » et « une page choisie à la main » de `monitoring-controller.test.ts`.

## 5. Interface (ui)

- [x] 5.1 ui : dans `components/result.ts`, ajouter « Boucler » après « Itérer », désactivé comme elle, et la rangée BOUCLE sous le texte : le curseur, « tour k / n », l'annonce (`role=status`, ou message d'erreur selon `DESIGN.md`), « Arrêter la boucle » pendant le calcul, puis, à droite, le champ « tours » (`Control` entier, de 2 à 12). « Garder » devient « Garder le tour k » hors du tour 1, et il est désactivé au tour 0 avec sa raison. Brancher le tout dans `app.ts`. Vérifier par les tests de rendu : l'ordre de la rangée, l'avancement dès le clic, « Arrêter la boucle » seulement pendant le calcul, les libellés de « Garder ».
- [x] 5.2 ui : ajouter `components/tour-cursor.ts`, la rangée de trous décrite dans « Interface › Le curseur de tours » de `design.md`. Elle porte un trou par tour (à venir, calculé, montré), les numéros en `--size-value` (gras tous les 4), le trait sous les tours d'un point fixe ou d'un cycle, `role=slider` avec flèches, Début et Fin, le clic et le glissé, et le focus d'encre décalé. Sur le papier, souligner les mots changés d'un tour k ≥ 2 et afficher « Plus aucun mot au tour k. » pour un tour vide. Jouer l'éclat de 300 ms une fois le curseur posé depuis 150 ms, et pas avec `prefers-reduced-motion`. Afficher « la grille montre le tour 1 » dans la phrase d'état de la grille. Les styles vont dans `tracks.html`, avec les jetons de `styles/tokens.css` et sans valeur en dur. Vérifier par les tests de rendu : le curseur absent sans boucle, les états des trous, `aria-valuetext`, les flèches, les mots soulignés, la phrase de la grille.
- [x] 5.3 ui : dans `components/inspector.ts`, ajouter la ligne LIGNÉE (`aria-live="polite"`) sous la prononciation. Dans `components/result.ts`, ouvrir un mot du tour 0 dans l'inspecteur par un seul gestionnaire de clic sur `result-text`, sans arrêt de tabulation par mot. Dans la bande collée, ne garder que le curseur et « tour k / n ». Sous 768 px, donner aux trous 44 × 44 px et faire défiler le curseur dans sa rangée. Vérifier par les tests de rendu : la lignée « livre → livrée → livret » dans l'inspecteur, la bande collée réduite au curseur.

## 6. Vérification d'ensemble

- [x] 6.1 Lancer `npm test` et vérifier que tout passe et que la couverture reste au-dessus de 90 %.
- [x] 6.2 Vérifier dans le navigateur, avec la prévisualisation, sur l'exemple :
  - un S+7 bouclé sur 6 tours ajoute une seule entrée (le tour 1) ;
  - le curseur va du tour 0 au tour 6, et chaque tour s'affiche sans attente ;
  - garder le tour 5 donne « ×5 » au carnet ;
  - un lipogramme bouclé annonce un point fixe ;
  - « Arrêter » coupe le calcul ;
  - toucher la table fait disparaître le curseur ;
  - au tour 0, survoler un nom montre sa lignée ;
  - l'écoute lancée au tour 2 continue dans le tour 4 quand on y mène le curseur ;
  - en branche A, le curseur répond pendant le calcul ;
  - à 375 px, la page ne défile pas de côté, et la rangée de trous défile dans elle-même ;
  - à 768 px, l'en-tête de la bande tient ou passe à la ligne comme prévu dans `design.md` ;
  - avec la réduction des animations activée, aucun éclat ne joue.

  *Fait le 2026-10-04 dans la prévisualisation*, sur l'exemple de Proust (118 mots) avec un S+7 :
  - 4 tours, puis 6 : la boucle a repris sans recalcul ;
  - « Garder le tour 5 » ajoute une entrée, avec la mention « ×5 », le marqueur `loop` et le tour 1 pour parent ;
  - avec une chaîne vide, l'annonce est « point fixe au tour 1 » ;
  - « Arrêter la boucle » donne « arrêtée au tour 4 sur 12 » ;
  - toucher la table affiche le message d'abandon ;
  - la lignée « heure → heurt → hexacontaèdre → hexagramme → hexogène » s'affiche dans l'inspecteur ;
  - à 375 px, la bande collée garde le curseur, les trous font 44 px, et la page ne défile pas de côté (`scrollWidth` 375) ;
  - à 768 px, l'en-tête tient sur une ligne ;
  - la console ne montre aucune erreur.

  **Non vérifié dans le navigateur, mais couvert par les tests :**
  - l'écoute d'un autre tour (voix réelle) ;
  - la réduction des animations, assurée par la règle CSS existante `.changed { animation: none }`.

  **Correctif trouvé pendant la vérification :** onglet caché, `requestAnimationFrame` s'arrête et la boucle se figeait. Un délai de secours de 50 ms la fait avancer quand même.
- [x] 6.3 Ajouter au journal des décisions de `DESIGN.md` la ligne du 2026-10-04 « Rangée BOUCLE : curseur de tours en trous perforés, réglages dans la rangée, lignée dans l'inspecteur » (revue de design de la boucle). Vérifier : la ligne est dans le tableau.

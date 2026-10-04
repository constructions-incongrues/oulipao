# Tasks

## 1. Le codec du lien

- [x] 1.1 (ui) Écrire `src/ui/tracks/share-link.ts` (design, décisions 1 à 3). Le module définit `SharedEntrySchema` (l'entrée du carnet sans `id` ni `keptAt`) et deux fonctions :
  - `encodeEntry`, qui produit `v1.` + base64url(deflate-raw(JSON)) avec `CompressionStream` ;
  - `decodeFragment`, qui rend `undefined` pour un fragment sans préfixe connu, `'unreadable'` pour toute erreur (base64, décompression, JSON, zod, version inconnue, plus de 1 Mo une fois décompressé), et l'entrée validée sinon.

  Vérifier par `test/ui/share-link.test.ts` :
  - aller-retour d'une entrée simple, d'une entrée retouchée et d'une entrée avec filiation ;
  - `#haut` ignoré ;
  - `v9.` illisible ;
  - lien tronqué illisible ;
  - JSON valide mais hors schéma illisible ;
  - une entrée de 30 vers sous 8 000 caractères.

## 2. Partager depuis le carnet

- [x] 2.1 (ui) Ajouter `shareBase` aux dépendances du contrôleur, `sharedLink?` à `TracksState`, et `shareEntry(id)` à `notebook-controller.ts` (design, décision 7). Le message est « Lien copié. », ou l'avertissement au-delà de 8 000 caractères. Si la copie échoue, `sharedLink` est posé. Vérifier par les tests du contrôleur du carnet, en reprenant les scénarios de `specs/lien-partageable` « Partager un texte gardé », « Presse-papiers refusé » et « Lien très long » avec un `copy` factice.
- [x] 2.2 (ui) Ajouter le bouton « Partager » à côté de « Copier » dans `components/notebook.ts`, avec un libellé accessible (« Partager le texte du {date} »), et le champ en lecture seule présélectionné quand `sharedLink` est posé. Le style suit `DESIGN.md`. Vérifier par un test du composant : bouton présent sur chaque entrée, et champ affiché avec `sharedLink`.

## 3. Arriver par un lien

- [x] 3.1 (ui) Ajouter à `TracksState` les champs `arrival?`, `arrivalMessage` et `arrivalError?`, et aux dépendances du contrôleur la promesse `arrival?`. Le contrôleur ouvre la vue d'arrivée quand la promesse rend une entrée, pose « Ce lien n'est pas lisible » sur `'unreadable'`, ne fait rien sur `undefined`, et ne charge rien à l'ouverture. Ajouter `closeArrival()` et `replayArrival()` (design, décisions 4 à 6) :
  - confirmation si `unsaved` ;
  - `preload()`, et un échec qui laisse la vue ouverte ;
  - `reopenProblem`, puis `arrivalError` en cas de refus ;
  - `restore` sur l'entrée reçue, sans que `lastKept` désigne une entrée du carnet.

  Vérifier par les tests du contrôleur, en reprenant les scénarios « Ouvrir un lien reçu » (carnet inchangé), « Aucun tiers avant le clic » (le préchargement factice n'est pas appelé), « Hors ligne » (côté contrôleur), « Rejouer la chaîne » (graine conservée, texte résultant identique), « Rejouer par-dessus un texte non gardé », « Entrée qui ne peut pas être rouverte », « Lien tronqué », « Fragment étranger » et « Quitter la vue d'arrivée ».
- [x] 3.2 (ui) Écrire `src/ui/tracks/components/arrival.ts` (design, décision 8). Le composant affiche le texte, avec la retouche à côté du résultat produit, puis l'ancêtre, l'original, la mention, et les boutons « Rejouer » et « Fermer ». « Rejouer » est désactivé avec « Chargement… » pendant le chargement ; après un échec, la raison s'affiche et le bouton reste actif pour réessayer ; `arrivalError` s'affiche aussi. Le focus passe sur le titre à l'ouverture. L'afficher depuis `app.ts` quand `arrival` est posé, et `arrivalMessage` là où s'affichent les messages de la page. Le style suit `DESIGN.md`. Vérifier par un test du composant, en reprenant les scénarios « Ouvrir un lien d'une entrée retouchée », « Ouvrir un lien d'une deuxième génération » et « Hors ligne ».
- [x] 3.3 (ui) Dans `main.ts` :
  - passer `shareBase` (`location.origin + location.pathname`) ;
  - lire `location.hash` et l'effacer aussitôt par `history.replaceState` ;
  - passer `decodeFragment(hash)` comme `arrival`.

  Vérifier dans l'aperçu du navigateur : après l'ouverture d'un lien, la barre d'adresse n'a plus de fragment, et un rechargement montre l'outil normal (scénario « Recharger après l'arrivée »).

## 4. Documents

- [x] 4.1 (docs) Réécrire le non-objectif « partage en un clic » dans `.nanopm/wiki/docs/strategy.md`, `objectives.md` et `roadmap.md` : le partage du texte seul reste refusé, le partage d'une entrée avec sa chaîne est permis parce qu'il sert KR3 et KR4 et la contrainte explicite. Retirer l'item de LATER dans la roadmap. Vérifier par `grep -n "partage" .nanopm/wiki/docs/{strategy,objectives,roadmap}.md` : les trois documents disent la même chose.

## 5. Vérification d'ensemble

- [x] 5.1 Lancer `npm test` (couverture au-dessus de 90 %), `npm run typecheck` et `npm run build`.
- [ ] 5.2 Dans l'aperçu du navigateur, faire le trajet de bout en bout :
  - garder au carnet un texte passé par un S+7 au dé, puis le retoucher ;
  - actionner « Partager » et vérifier le message ;
  - ouvrir l'adresse copiée dans un nouvel onglet en navigation privée (carnet vide) ;
  - vérifier la vue d'arrivée (retouche, résultat, original, mention), puis actionner « Rejouer » et vérifier que les pistes et le texte résultant sont les mêmes ;
  - vérifier dans les requêtes réseau que rien ne part vers jsDelivr ni Hugging Face avant « Rejouer » ;
  - couper le réseau, rouvrir le lien, actionner « Rejouer » et vérifier que la raison s'affiche et que le bouton permet de réessayer.

  Joindre une capture de la vue d'arrivée à la PR.

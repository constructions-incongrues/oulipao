# Tasks

## 1. L'exemple joue (ui)

- [x] 1.1 ui : dans `controller.ts`, faire brancher à `example()` un S+7 (`add-instance`, `s7`) quand aucune instance n'est en marche, avant `run()`. Vérifier par des tests du contrôleur :
  - premier exemple, chaîne vide : un S+7 en marche et des noms remplacés ;
  - un lipogramme en marche : pas de S+7 ajouté ;
  - un S+7 coupé : un deuxième S+7, en marche, s'ajoute en fin de chaîne.

  Mettre à jour les tests existants de la rotation (`examples.test.ts`) qui supposent une chaîne vide.

## 2. L'invite dans la bande (ui)

- [x] 2.1 ui : dans `components/browser.ts`, ajouter `openBrowser(from)`. Elle ouvre `details.browser`, le fait défiler (`block: 'center'`, instantané sous `prefers-reduced-motion`) et met le focus sur sa première touche. Vérifier par un test sur un faux document : `open` vrai, `scrollIntoView` appelé avec le bon `behavior`, focus sur la première touche.
- [x] 2.2 ui : dans `components/result.ts`, ajouter `onBranch`, qui affiche sous le texte « Aucune contrainte en marche : le texte est rendu tel quel. » et la touche « Brancher une contrainte ». La brancher dans `app.ts` (seulement si aucune instance n'est en marche, avec `openBrowser`), et ajouter le style `.idle` dans `tracks.html` selon `DESIGN.md`. Vérifier par des tests de rendu :
  - l'invite est présente avec une chaîne vide ou entièrement coupée ;
  - elle est absente dès qu'une contrainte est en marche ;
  - un clic appelle `onBranch`.

## 3. Vérification

- [x] 3.1 Lancer `npm test` et vérifier que tout passe et que la couverture reste au-dessus de 90 %.
- [x] 3.2 Vérifier dans la prévisualisation :
  - un texte collé sans contrainte : l'invite s'affiche et l'écran ne bouge pas ;
  - « Brancher une contrainte » ouvre le catalogue, y fait défiler l'écran et y met le focus ;
  - après l'ajout d'un S+7, l'invite disparaît ;
  - « Essayer avec un exemple » arrive avec un S+7 et des noms remplacés ;
  - à 375 px, la bande collée garde l'invite.

  *Fait le 2026-10-04 dans la prévisualisation :*
  - un texte collé sans contrainte : l'invite s'affiche, `scrollY` reste à 0 ;
  - « Brancher une contrainte » ouvre le catalogue et met le focus sur « + Abécédaire », visible sous la bande ;
  - après « + S+7 », l'invite disparaît et 4 noms sont remplacés ;
  - l'exemple arrive avec un S+7, 19 noms remplacés ;
  - à 375 px, la bande collée garde le texte, l'invite et sa touche de 44 px, sans défilement latéral.

  **Correctif trouvé pendant la vérification :** centrer le catalogue ouvert, plus haut que l'écran, cachait sa première touche. C'est désormais cette touche qu'on centre (design, décision 2).

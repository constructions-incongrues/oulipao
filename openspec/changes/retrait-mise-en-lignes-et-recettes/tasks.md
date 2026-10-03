# Tasks

## 1. Contrat et règle de retrait

- [x] 1.1 [domain] Créer `src/domain/removal.ts` : `removeWord`, fusion des blancs (sauts gardés, ponctuation réduite au signe le plus fort, espaces à la française, ponctuation abandonnée en tête de texte ou de ligne, majuscule léguée, fusion avec `tail`) ; y déplacer `matchCase`. Vérifier par `test/domain/removal.test.ts`, qui couvre les scénarios « Ponctuation gardée », « Majuscule léguée » et « Vers gardés ».
- [x] 1.2 [domain] Faire passer le lipogramme par `removeWord` ; mettre à jour ses tests en vérifiant chaque sortie qui change, et ajouter le scénario « Mot-outil en tête de vers ». Vérification : `npm test`.
- [x] 1.3 [domain] Contrat : marque `relaid` dans `WordMarkSchema`, compte `relaid` dans `StepReport`, drapeau `targetable: false` vérifié par `definePlugin` (cinq pistes obligatoires). Vérifier par des tests de `definePlugin` et de `runChain`.
- [x] 1.4 [domain] `runChain` : une remise en ligne n'écrase ni un remplacement ni un retrait ; `stages` passe à `{ output, newline }[][]`. Vérifier par un test de `runChain` qui enchaîne un remplacement puis une remise en ligne.

## 2. Les trois contraintes

- [x] 2.1 [domain] Utilitaire `linesOf(words)`, partagé par Bord et Mise en vers. Vérifier par un test unitaire sur un poème de trois vers.
- [x] 2.2 [domain] Contrainte Tri par piste (`src/domain/track-sort/plugin.ts`) : modes « retirer » et « ne garder que », dispositions « telle quelle » et « un mot par ligne ». Vérifier par des tests qui reprennent les scénarios « Retirer noms, adjectifs et verbes » et « Inventaire des noms ».
- [x] 2.3 [domain] Contrainte Bord (`src/domain/edge/plugin.ts`), non ciblable : modes « fins de vers », « tête-à-queue » et « intérieur », n de 1 à 9, mots sautés gardés. Vérifier par les tests « Haï-kaïsation », « Intérieur de poème » et « Pas bouché sous un Bord ».
- [x] 2.4 [domain] Contrainte Mise en vers (`src/domain/lineation/plugin.ts`), non ciblable : coupes « tous les n mots », « aux ponctuations » et « selon un nombre » (zéros sautés, cycle), marques `relaid`. Vérifier par les tests « Poème de bandit », « Juliennes » et « Compte ».
- [x] 2.5 [ui] Installer les trois types dans `installedPlugins` ; le réducteur refuse `set-targets` sur un type non ciblable. Vérifier par `test/ui/tracks/mixer-state.test.ts`.

## 3. Affichage des nouvelles marques

- [x] 3.1 [ui] Vue et résumé : compter les mots remis en ligne (« Mise en vers : 12 mots remis en ligne ») et adapter la vue au nouveau `stages`. Vérifier par `test/ui/tracks/view-model.test.ts`.
- [x] 3.2 [ui] Inspecteur : « ↵ » devant un mot remis en ligne, annoncé « à la ligne » au lecteur d'écran. Vérifier par `test/ui/tracks/components.test.ts`, qui reprend le scénario « Mise en vers » de l'inspecteur.
- [x] 3.3 [ui] `Chain` : pas de puces de pistes pour une instance non ciblable. Vérifier par le test de composant « Pas de puces ».

## 4. Recettes

- [x] 4.1 [ui] `src/ui/tracks/recipes.ts` : `RecipeSchema`, les dix recettes, et une validation au chargement contre les types installés. `build` reçoit le choix et la date. Vérifier par `test/ui/tracks/recipes.test.ts` : chaque recette, Juliennes du 3 octobre 2026 qui donne 2461317, et le rejet d'une recette vers un type inconnu.
- [x] 4.2 [ui] Geste `add-recipe { recipe, choice?, today }` dans le réducteur : ajout en fin de chaîne, identifiants libres, choix hors liste refusé. Vérifier par les tests « Monovocalisme en a » et « Liponymie ».

## 5. Navigateur de contraintes

- [x] 5.1 [ui] Maquette du navigateur (recettes, règle en une ligne, lien, section « Moteurs », choix au branchement), à faire valider par le fondateur au regard de DESIGN.md avant d'intégrer. La validation est écrite dans ce fichier.
  - Validée par le fondateur le 2026-10-03 : touche « Ajouter une contrainte » qui déplie ; section Recettes (touche « + Nom », règle en encre secondaire, lien « fiche ↗ », choix déplié en ligne avec Brancher / Annuler) ; section Moteurs (une touche par type) ; filets de 1 px, sérigraphie, pas d'accent ; sur téléphone, la règle passe sous la touche.
- [x] 5.2 [ui] Composant `ConstraintBrowser` (`<details>` natif) à la place de la rangée « + » : recettes puis moteurs, choix déplié en ligne avec « Brancher » et « Annuler », liens en nouvel onglet. Vérifier par des tests de composant (« Ajouter un moteur », « Lien vers la fiche », annulation qui n'ajoute rien) et par `npm test` sur l'app.
- [x] 5.3 [ui] Recette en direct dans le Browser pane : brancher Haï-kaïsation puis Inventaire sur le texte d'exemple, vérifier le clavier (Tab, Entrée, Échap), le lecteur d'écran (arbre d'accessibilité) et la largeur de 375 px sans défilement horizontal. Fournir des captures d'écran comme preuve.
  - Vérifié le 2026-10-03 dans le Browser pane : Haï-kaïsation (Entrée) puis Inventaire sur les noms (Entrée, Échap qui replie sans rien ajouter et rend le focus, Entrée, Tab, Entrée) ; résumé « inventaire, un mot par ligne, sur les noms : 31 mots retirés, 12 remis en ligne. » ; liens de fiche nommés « fiche, <nom> sur oulipo.net, nouvel onglet », flèche masquée aux lecteurs d'écran ; à 375 px, la règle passe sous la touche, sans défilement horizontal. Défaut trouvé et corrigé : un Tri sans retrait annonçait « 0 nom remplacé sur 13 ».

## 6. Performance et documentation

- [x] 6.1 [domain] Mesurer la Contrainte du prisonnier (12 lipogrammes) sur le texte de référence de 200 mots ; elle doit tenir sous 0,5 s. Vérifier par un test chronométré ou une mesure consignée dans ce fichier.
  - Mesure du 2026-10-03 (Mac du fondateur, Node 22, lexique réel, texte 1 de référence, 200 mots, `buildView` complet) : Contrainte du prisonnier, 12 instances, médiane 344 ms (max 355 ms) ; Monovocalisme, 5 instances, médiane 246 ms. Sous la demi-seconde, sans marge large : à remesurer dans le navigateur.
- [x] 6.2 Documentation : `docs/plugins.md` (drapeau non ciblable, marque `relaid`, règle de retrait), `docs/tracks.md` (navigateur, recettes) et le catalogue du wiki (contraintes couvertes ; Éclipse documentée sans recette). Vérifier par relecture.
- [x] 6.3 Contrôle final : `npm test` vert, couverture au-dessus de 90 %, `npx tsc --noEmit` propre, `openspec validate retrait-mise-en-lignes-et-recettes --strict` sans erreur.

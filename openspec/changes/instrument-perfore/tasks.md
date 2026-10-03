# Tâches : l'instrument perforé

## 1. Palette vérifiée (domain, scripts)

- [x] 1.1 domain : écrire `src/domain/palette.ts` (contraste WCAG, simulation de Machado 2009 en deutéranopie, protanopie et tritanopie à sévérité 1, ΔE CIELAB 76 minimal entre pistes), avec des tests dans `test/domain/palette.test.ts` sur des valeurs connues (noir sur blanc = 21:1 ; deux couleurs identiques = ΔE 0) ; vérifié par `npm test`, couverture au-dessus de 90 %.
- [x] 1.2 scripts : écrire `scripts/check-palette.ts`, qui lit les couleurs du front matter de `DESIGN.md` et échoue en nommant la paire fautive, et ajouter `npm run check:palette` ; vérifié en le lançant sur `DESIGN.md` et sur une copie où une piste est rendue trop proche d'une autre (il doit échouer).
- [x] 1.3 Lancer `npm run check:palette` sur la palette de `DESIGN.md`. Si le ΔE ou un contraste est insuffisant, ajuster la luminosité de la teinte dans `DESIGN.md` (et noter l'ajustement dans son journal des décisions) jusqu'à ce que la commande passe.

## 2. Jetons et polices (ui, ressources)

- [x] 2.1 Copier dans `fonts/` les woff2 du sous-ensemble latin de `@fontsource/spectral` (400, 600, 400 italique), `@fontsource-variable/archivo` (axe wdth), `@fontsource-variable/martian-mono` (axe wdth) et `@fontsource-variable/big-shoulders-stencil-display` (5.3.0), avec leurs licences OFL ; retirer Source Serif 4 et IBM Plex ; vérifié par `ls fonts/` et par la présence de chaque fichier de licence.
- [x] 2.2 ui : réécrire `styles/tokens.css` à partir du front matter de `DESIGN.md` (couleurs clair et sombre sous `prefers-color-scheme` et `[data-theme]`, polices, espacements, rayon 2 px), et retirer toute couleur ou police en dur de `tracks.html` et `index.html` ; vérifié par une recherche des `#` hexadécimaux hors de `tokens.css` (aucun résultat) et en ouvrant les deux pages.
- [x] 2.3 ui : ajouter le bouton « Clair / sombre », qui pose `data-theme` sur `<html>`, avec un test de composant dans `test/ui/tracks/components.test.ts` ; vérifié par `npm test`.
- [x] 2.4 Vérifier dans l'onglet réseau que les deux pages ne chargent aucune police d'un autre domaine (scénario « Onglet réseau » de `systeme-de-design`).

## 3. Portée par mot dans la chaîne (domain)

- [x] 3.1 domain : ajouter `WordScopeSchema` à `src/domain/plugin.ts` et l'argument facultatif `scope` à `ConstraintPlugin.apply` ; vérifié par `npm run typecheck` et par les tests existants inchangés.
- [x] 3.2 domain : dans `src/domain/plugin-chain.ts`, ajouter `closed` et `locks` à `ChainStep` et les traduire en positions relues par `origin[k]` (y compris un mot d'origine qui donne deux mots relus) ; tests dans `test/domain/plugin-chain.test.ts` avec des plugins factices qui enregistrent la portée reçue ; vérifié par `npm test`.
- [x] 3.3 domain : faire passer la position à `choose(word, hints, index)` dans `rewriteNouns` et remplacer le décalage unique de `shiftAdjectives` par `offsetAt(index)` qui saute les positions de `skip` ; tests S+7 pour un nom sauté (groupe nominal intact) et pour un nom verrouillé en S+3 ; vérifié par `npm test`.
- [x] 3.4 domain : faire respecter `scope.skip` et `scope.overrides` par le S+n (`src/domain/s7/plugin.ts`, verrou validé par `parse`) et `scope.skip` par le lipogramme (noms et deuxième passe) ; tests dans `test/domain/s7` et `test/domain/lipogram`, dont un verrou refusé qui lève ; vérifié par `npm test`, couverture au-dessus de 90 %.

## 4. État de la table (ui)

- [x] 4.1 ui : ajouter `closed` à `MixerStateSchema` et `locks` à `InstanceSchema` (`src/ui/tracks/types.ts`), et les gestes `toggle-step`, `set-lock` et `clear-lock` à `MixerActionSchema` ; vérifié par `npm run typecheck`.
- [x] 4.2 ui : traiter ces gestes dans `reduce` (`mixer-state.ts`) : verrou validé par le `parse` du plugin, `duplicate-instance` qui copie les verrous, `remove-instance` qui les emporte ; tests dans `test/ui/tracks/mixer-state.test.ts` pour chaque scénario de `verrous-de-parametres` ; vérifié par `npm test`.
- [x] 4.3 ui : dans le contrôleur, remettre à zéro `closed` et les verrous à chaque nouvel étiquetage ; tests « Nouveau texte » de `grille-de-pas` et de `verrous-de-parametres` dans `controller.test.ts` ; vérifié par `npm test`.
- [x] 4.4 ui : dans `view-model.ts`, faire construire par `activeSteps` les `closed` et `locks` de chaque `ChainStep`, et calculer l'état de chaque pas (percé, contour, bouché, verrou) et les pages ; tests dans `view-model.test.ts` (« Boucher un nom », « Aucun filtre sur la piste », « Pas verrouillé ») ; vérifié par `npm test`.

## 5. Page à pistes (ui)

- [x] 5.1 ui : réordonner `app.ts` dans l'ordre bande de sortie, saisie, chaîne, grille, inspecteur ; test « Ordre de la page » (ordre des sections dans le rendu) dans `app.test.ts` ; vérifié par `npm test`.
- [x] 5.2 ui : la bande de sortie collée et compacte dans `components/result.ts` (sentinelle et `IntersectionObserver`, classe `stuck`, 4 lignes ou 3 sous 768 px, copie toujours atteignable) ; test de composant pour la classe et vérification à 1280 × 900 et 375 px en faisant défiler la page ; vérifié par `npm test` et par des captures.
- [x] 5.3 ui : `components/chain.ts` remplace `rack.ts` : lignes de même largeur en colonnes fixes, numéros, touches ↑ et ↓ désactivées aux bords, Dupliquer, Retirer, ligne « Ajouter », glisser-déposer par la poignée avec le trait d'encre ; tests de composant (↑ envoie `move-instance`, bords désactivés, drop avant et après) ; vérifié par `npm test` et en glissant une ligne dans le navigateur.
- [x] 5.4 ui : `components/step-grid.ts` remplace `strip.ts` : tranches (poinçon, nom, compte, Muet, Seul, rappel des filtres), en-tête des pas (temps forts, mot vers l'inspecteur), pas (`toggle-step`, nom accessible), pagination 16/8/4 par `ResizeObserver` et flèches au-delà de six pages ; symboles SVG des poinçons dans `tracks.html` ; tests de composant pour chaque scénario de `grille-de-pas` ; vérifié par `npm test`.
- [x] 5.5 ui : dans `components/inspector.ts`, ajouter les champs de verrou par paramètre entier, la légende « S+3 sur ce mot » et l'état du pas, et l'ouverture depuis l'en-tête de la grille ; tests « Mot verrouillé » et « Depuis la grille » ; vérifié par `npm test`.
- [x] 5.6 ui : la tête de lecture (300 ms, déclenchée par le changement de génération) et le passage de l'éclat aux nouveaux jetons, sans aucun mouvement sous `prefers-reduced-motion` ; vérifié dans le navigateur avec et sans réduction des animations.

## 6. Vérification d'ensemble

- [x] 6.1 Lancer `npm run typecheck`, `npm test` (couverture au-dessus de 90 %) et `npm run check:palette` ; les trois passent.
- [x] 6.2 Construire (`npm run build`), ouvrir `tracks.html` et comparer à la référence `finalized.html` à 375, 768 et 1440 px, en clair et en sombre, avec un vrai texte : pas de défilement horizontal, chaîne au-dessus des pistes, bande collée, grille paginée ; captures jointes au compte rendu.
- [x] 6.3 Parcourir la page au clavier (Tab, Entrée, Espace, flèches de l'inspecteur, Échap) et vérifier que chaque contrôle a un libellé (scénario « Navigation au clavier »).
- [x] 6.4 Mettre à jour `DESIGN.md` (sections Layout et Components : chaîne au-dessus des pistes, bande collée compacte, pages de pas, verrous) et retirer de son journal la ligne « `styles/tokens.css` et `fonts/` pas encore alignés ».

## 7. Raccourcis clavier (retour du fondateur, 2026-10-03)

- [x] 7.1 ui : les flèches et Échap passent par `controller.shortcut`, appelé depuis un écouteur sur le document (`main.ts`) : ils répondent où que soit le focus, sauf dans un champ ; inspecteur fermé, une flèche l'ouvre sur le premier mot de la page affichée ; vérifié par les tests du contrôleur et de la page.
- [x] 7.2 ui : passer au mot voisin amène la grille sur la page de ce mot ; vérifié par le test « la grille suit la page ».

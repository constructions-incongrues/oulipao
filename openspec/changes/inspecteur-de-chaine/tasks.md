# Tasks

Source : `.nanopm/wiki/docs/prds/inspecteur-de-chaine.md`. Contraintes du projet : voir `openspec/config.yaml`.

## 1. Étapes de la chaîne

- [x] 1.1 (domain) `runChain` rend `stages`, un tableau de mots par étape, aligné sur les mots d'origine (design, décision 1) ; vérifier par `test/domain/plugin-chain.test.ts` : deux étapes, un mot retiré à la seconde donne une chaîne vide à sa position, une contraction reste dans sa position d'origine.

## 2. La page sans partition

- [x] 2.1 (ui) Supprimer la partition : `score-layout.ts`, `components/score.ts`, `layout` de `buildView`, `width`, `scoreOpen`, `setWidth`, `toggleScore`, le bouton « Voir la partition », l'observateur de redimensionnement et la sonde de `main.ts`, les styles de la partition dans `tracks.html`, et leurs tests ; vérifier que `npm test` passe au-dessus de 90 % et qu'aucun fichier ne cite plus `layoutScore` ni `systemWidth`.
- [x] 2.2 (ui) `buildView` rend `stages` (« Origine » puis chaque filtre actif, libellé par `describeInstance`) et `inspectorWindow(view, index, radius)` rend les colonnes de la fenêtre (position, mot de chaque bande, distance) ; vérifier par `test/ui/tracks/view-model.test.ts` : trois filtres donnent quatre bandes, un filtre coupé n'a pas de bande, la fenêtre est bornée au début et à la fin du texte, un mot retiré vaut « · ».
- [x] 2.3 (ui) Contrôleur : `selected`, `select(index)`, `step(delta)` borné au texte, `closeInspector()` ; `run()` remet le choix à vide, `dispatch` le garde ; vérifier par `test/ui/tracks/controller.test.ts`.

## 3. Inspecteur et texte résultant

- [x] 3.1 (ui) `components/inspector.ts` : tableau, une ligne par étape avec `<th scope="row">`, colonne choisie en `aria-current`, colonnes lointaines en `far`, légende annonçant le mot ; flèches gauche et droite, Échap ; vérifier par `test/ui/tracks/components.test.ts`.
- [x] 3.2 (ui) `components/result.ts` : chaque mot ouvre l'inspecteur au clic ; un mot changé porte la classe de sa piste, `tabindex="0"`, Entrée l'ouvre, et une infobulle « Noms : cuisine → cuistrerie » ; vérifier par `test/ui/tracks/components.test.ts`.
- [x] 3.3 (ui) `app.ts`, `tracks.html` : inspecteur sous le texte résultant, fermé avec la phrase d'invitation tant que rien n'est choisi, focus déplacé sur l'inspecteur à l'ouverture ; colonnes `far` masquées sous 768 px ; texte résultant dans la colonne de droite ; vérifier par `test/ui/tracks/app.test.ts` : clic sur un mot, quatre bandes, flèche droite, Échap, un filtre monté garde le mot choisi.

## 4. Vérification

- [x] 4.1 Dans le navigateur, texte 1 de référence, cinq filtres : cliquer « cuistrerie » puis suivre trois mots aux flèches ; mesurer la mise à jour inspecteur ouvert (moins d'une demi-seconde) ; à 375 px, aucun défilement horizontal ; consigner dans `RESULTATS.md` (section « Inspecteur de chaîne ») avec une capture dans `resultats/inspecteur/`, et mettre à jour `docs/tracks.md` (vocabulaire sans partition, système ni bloc).

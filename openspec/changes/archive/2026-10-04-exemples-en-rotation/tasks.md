# Tâches

## 1. Les textes d'exemple

- [x] 1.1 (ui) Créer `src/ui/tracks/examples.ts` avec `EXAMPLES` dans l'ordre de la spec : Proust (1913), La Fontaine (1668), Rimbaud (1870), Verlaine (1866), Hugo (1856). Recopier chaque texte depuis Wikisource, noter la page source en commentaire, un vers par ligne, une ligne vide entre les strophes, Proust coupé à une fin de phrase. Ajouter `exampleOf(input)`. Vérification : un test (`test/ui/tracks/examples.test.ts`) contrôle 5 textes, au plus 150 mots chacun, chaque texte égal à sa forme NFC, et `exampleOf` qui reconnaît un texte exact et rejette un texte retouché d'un caractère.

## 2. La rotation dans le contrôleur

- [x] 2.1 (ui) Dans `src/ui/tracks/controller.ts`, retirer `EXAMPLE_TEXT`, ajouter `examplesShown` à `TracksState` et faire avancer `example()` dans `EXAMPLES` en boucle. Vérification : dans `test/ui/tracks/controller.test.ts`, six clics donnent Proust, La Fontaine, Rimbaud, Verlaine, Hugo, puis Proust ; une chaîne réglée avant « Autre exemple » est toujours là après.
- [x] 2.2 (ui) Remplacer les usages d'`EXAMPLE_TEXT` dans `test/ui/tracks/controller.test.ts`, `monitoring-controller.test.ts` et `transport.test.ts` par `EXAMPLES[0].text`. Vérification : `npm test` passe.

## 3. Le bouton et la mention

- [x] 3.1 (ui) Dans `src/ui/tracks/components/source.ts`, remplacer `started` par `exampleLabel` et `example`. Afficher le bouton avec son libellé quand `exampleLabel` est fourni, la ligne `example-source` sous la saisie, et la source dans la saisie repliée. Vérification : le test « Source » de `test/ui/tracks/components.test.ts` couvre le bouton caché, les deux libellés, la mention dépliée et la mention repliée.
- [x] 3.2 (ui) Dans `src/ui/tracks/app.ts`, calculer `exampleLabel` (saisie vide ou `exampleOf(input)` défini, libellé selon `examplesShown`) et `example`. Ajouter `.example-source` à la règle commune des messages de `tracks.html`. Vérification : `test/ui/tracks/app.test.ts` montre « Autre exemple » après un premier exemple et aucun bouton quand la saisie contient un texte collé.

## 4. Compte des syllabes

- [x] 4.0 (domain) Dans `src/domain/phonetics/lookup.ts`, compter le e de « -es » et « -ent » devant voyelle dans `lineSyllables`. Vérification : `test/domain/phonetics/phonetics.test.ts` donne 3 pour « voiles au », 4 pour « chantent encore », 3 pour « rêve voiles » ; les 12 vers de *Demain, dès l'aube* comptent 12 avec le lexique réel.

## 5. Vérification d'ensemble

- [x] 5.1 `npm test` passe et la couverture reste au-dessus de 90 %.
- [x] 5.2 Dans le navigateur, mettre en pistes les cinq exemples l'un après l'autre avec un filtre phonétique branché. Contrôler que les vers et les strophes s'affichent ligne à ligne, que le compte de syllabes de *Demain, dès l'aube* donne 12 sur ses alexandrins, que la mention suit chaque texte, et qu'en thème sombre comme à 375 px de large la mention reste lisible et ne déborde pas.

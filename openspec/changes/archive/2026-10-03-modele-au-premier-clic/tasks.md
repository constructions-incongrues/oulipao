# Tasks

## 1. Contrôleur (ui)

- [x] 1.1 `start()` ne précharge plus ; retirer `saveData` de `TracksDependencies`. Vérifier par `test/ui/tracks/controller.test.ts` : après `start()`, le modèle est en `waiting` et `preload` n'a pas été appelé ; `preload()` puis `run()` chargent et mettent en pistes.
- [x] 1.2 `run()` et `example()` depuis l'état `waiting` chargent puis mettent en pistes en un seul appel. Vérifier par un test du contrôleur.

## 2. Saisie et notice (ui)

- [x] 2.1 Dans `components/source.ts`, « Mettre en pistes » actif en `waiting`, `ready` et `error`, désactivé pendant le chargement et l'étiquetage. Vérifier par `test/ui/tracks/components.test.ts`.
- [x] 2.2 Remplacer le texte d'économie de données par la notice qui nomme jsDelivr et Hugging Face. Vérifier par `test/ui/tracks/components.test.ts` (rendu en texte).
- [x] 2.3 Retirer la lecture de `navigator.connection` dans `src/ui/tracks/main.ts`, et adapter `test/ui/tracks/app.test.ts`. Vérifier par `npm run typecheck`.

## 3. Vérification

- [x] 3.1 `npm test` passe avec une couverture d'au moins 90 %, et `npm run typecheck` passe.
- [x] 3.2 Dans le navigateur, page à pistes servie en local : aucune requête vers jsDelivr ni Hugging Face avant un clic ; un clic sur « Mettre en pistes » charge puis met en pistes.

## 4. Documentation

- [x] 4.1 Mettre à jour arc42 (sections 2.5, 6.1, 7.1, 10 QS-08, 11) : le préchargement à l'ouverture n'existe plus. Vérifier qu'aucune section ne parle encore de préchargement à l'ouverture (`grep`).

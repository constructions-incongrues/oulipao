# Tasks

## 1. Politique (pages)

- [x] 1.1 Ajouter la balise `<meta http-equiv="Content-Security-Policy">` en tête de `tracks.html` et de `index.html`, avec la politique du design. Vérifier par `npm run build:site` que `_site/index.html` et `_site/essai.html` la portent.
- [x] 1.2 Ajouter un test (`test/pages.test.ts`) qui lit les deux pages et vérifie que chacune déclare la politique, la même, avec `connect-src` limité aux quatre hôtes. Vérifier par `npm test` (couverture toujours au-dessus de 90 %).

## 2. Vérification dans le navigateur

- [x] 2.1 Site assemblé servi en local, cache vidé : charger le modèle, mettre en pistes, ajouter une contrainte qui vise les verbes, copier. Aucune violation dans la console ; si une violation montre qu'il faut `blob:` (ou `worker-src`), l'ajouter aux deux pages et au test, puis refaire l'essai.
- [x] 2.2 Dans la même page, tenter `fetch('https://example.com')` depuis la console du script : la requête est refusée et la violation signalée.
- [x] 2.3 Page d'essai : étiqueter un texte avec les trois étiqueteurs et appliquer le S+7, sans violation.

## 3. Documentation

- [x] 3.1 Mettre à jour arc42 : 7.1 (réseau et sécurité), 8.2, 10 (QS-02 tenu pour les hôtes non autorisés ; 10.3), 11 (RISK-02 : CSP en place, SRI toujours absente, risque résiduel sur les hôtes autorisés). Vérifier qu'aucune section ne dit encore « ni SRI ni CSP » (`grep`).

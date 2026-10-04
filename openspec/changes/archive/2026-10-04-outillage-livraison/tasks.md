# Tasks

## 1. Contrôles en CI (PR `ci:`)

- [x] 1.1 Ajouter à `.github/workflows/ci.yml`, après `npm test`, les étapes `npm run check:palette` puis `npm run build:references && git diff --exit-code -- reference/` ; vérifier en local que les deux commandes réussissent sur `main`
- [x] 1.2 Ajouter les mêmes étapes, dans le même ordre, à `.github/workflows/release.yml` avant `build:site` ; vérifier que le diff des deux workflows ne diffère que par leurs étapes propres
- [x] 1.3 Vérifier que le contrôle de dérive échoue : modifier localement une ligne de `reference/texte-2.annote.txt` sans régénérer, constater l'échec de `git diff --exit-code`, puis annuler la modification

## 2. Version de Node et assemblage (PR `ci:`, même lot)

- [x] 2.1 Créer `.nvmrc` (`22`) et ajouter `"engines": { "node": ">=22.18" }` à `package.json` ; `actions/setup-node` lit `node-version-file: .nvmrc` dans les deux workflows ; la CI de la PR passe
- [x] 2.2 Ajouter `--minify` au script `build` ; `npm run build:site` réussit et les pages `index.html` et `tracks.html` fonctionnent dans l'aperçu local (mise en pistes d'un exemple) ; noter dans la PR la taille de `dist/tracks.js` avant et après

## 3. Vérification d'ensemble

- [x] 3.1 La CI de chaque PR passe, avec les nouvelles étapes visibles dans le journal de la vérification

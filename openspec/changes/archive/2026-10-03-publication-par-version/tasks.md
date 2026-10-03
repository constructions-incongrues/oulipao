# Tâches

## 1. Version et configuration release-please (outillage)

- [x] 1.1 Ajouter `"version": "0.1.0"` à `package.json` ; vérifier que `npm pkg get version` renvoie `"0.1.0"`.
- [x] 1.2 Créer `release-please-config.json` (manifeste, `release-type: node`, `bump-minor-pre-major`, `include-v-in-tag`, `bootstrap-sha` sur le `main` courant, `changelog-sections` en français, types non visibles masqués) et `.release-please-manifest.json` (`{ ".": "0.1.0" }`). Vérifier que les deux fichiers se lisent avec `node -e "JSON.parse(require('fs').readFileSync(...))"`.

## 2. Publication à chaque version (outillage CI)

- [x] 2.1 Remplacer `.github/workflows/pages.yml` par `.github/workflows/release.yml` : un job `release` (release-please-action v4) puis un job `deploy` conditionné par `release_created` ou `workflow_dispatch`, qui reprend les étapes de test, de build et de déploiement de l'ancien fichier. Permissions déclarées job par job, `concurrency: pages` gardée. Commentaires en français. Vérifier avec `actionlint`, ou à défaut en relisant le YAML contre le design.

## 3. Version affichée (ui)

- [x] 3.1 ui : ajouter une fonction pure qui produit le libellé (`v0.1.0`) et le lien du journal (`…/blob/main/CHANGELOG.md`), avec son test dans `test/ui/` ; `npm test` passe, couverture ≥ 90 %.
- [x] 3.2 Outillage : ajouter au script `build` le `--define:__OULIPAO_VERSION__` alimenté par `$npm_package_version`, et la déclaration `declare const` dans un `.d.ts` de `src/ui/` ; `npm run typecheck` et `npm run build` passent, et `grep 0.1.0 dist/tracks.js` trouve la version.
- [x] 3.3 ui : lire `DESIGN.md`, puis ajouter une prop `version` à `App` (`src/ui/tracks/app.ts`) et afficher le lien de version dans la barre de marque, à côté de « Code source » ; `main.ts` passe `__OULIPAO_VERSION__`. Étendre le test de rendu de la barre de marque ; `npm test` passe, couverture ≥ 90 %.
- [x] 3.4 ui : afficher la version et son lien dans l'introduction de la page d'essai (`index.html` + `src/ui/page.ts`) ; `test/pages.test.ts` vérifie la présence de l'emplacement de la version ; `npm test` passe.
- [x] 3.5 Vérifier dans le navigateur (`npm run build:site`, aperçu local) : la version apparaît sur les deux pages, son lien s'atteint au clavier, aucune violation de la politique de sécurité du contenu dans la console, et pas de défilement horizontal à 375 px.

## 4. Convention et documentation

- [x] 4.1 Ajouter à `CLAUDE.md` la règle : PR fusionnées en squash, titre au format Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…) suivi d'une description en français, et les types qui apparaissent au journal. Vérifier que la règle figure dans la section des contraintes.
- [x] 4.2 Réécrire `docs/guides/publier-le-site.md` : la PR de version, sa fusion, la publication à la main et ses limites. Mettre à jour `docs/arc42/07-vue-de-deploiement.md` et les mentions de « poussée sur main » dans `docs/arc42/04`, `05` et `12`. Vérifier avec `grep -rn "pages.yml\|chaque poussée" docs README.md`, qui ne doit plus rien renvoyer de faux.

## 5. Mise en service

- [x] 5.1 Régler le dépôt avec `gh` : squash-merge seul (titre de PR comme titre du commit, description comme corps) et GitHub Actions autorisé à créer des PR. Vérifié avec `gh api repos/constructions-incongrues/oulipao` et `…/actions/permissions/workflow`.
- [x] 5.2 Fusionner ce changement en squash sous le titre `ci: publication par version` ; vérifier que le workflow `release.yml` réussit sans ouvrir de PR de version ni déployer.
- [ ] 5.3 À la première PR `feat:` ou `fix:` fusionnée ensuite, vérifier que release-please ouvre une PR de version avec un `CHANGELOG.md` en français et le bon numéro. Après la fusion de cette PR de version, vérifier le tag `v0.x.y`, la release GitHub et la version affichée sur `https://oulipao.incongru.org`.

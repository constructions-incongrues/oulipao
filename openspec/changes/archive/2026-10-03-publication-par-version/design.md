# Design

## Contexte

Aujourd'hui, `.github/workflows/pages.yml` lance les tests, puis `npm run build:site`, puis le déploiement sur GitHub Pages, à chaque poussée sur `main`. `package.json` n'a pas de champ `version` et le dépôt n'a aucun tag. Les PR sont fusionnées par commit de fusion, et leurs commits sont rédigés en français libre. La barre de marque de la page à pistes (`src/ui/tracks/app.ts`) porte déjà le lien « Code source ». La page d'essai (`index.html`) cite ce lien dans son introduction.

## Objectifs / Hors-objectifs

**Objectifs :**
- release-please seul décide quand une version existe ; le déploiement suit la version.
- La version affichée vient du build, pas d'un appel réseau.

**Hors-objectifs :**
- Lancer les tests sur chaque PR (un `ci.yml` sur `pull_request`). C'est utile, mais ce sera un changement séparé.
- Un linter de titres de PR. La règle tient dans `CLAUDE.md` : les PR sont surtout écrites par des agents.
- Publier `CHANGELOG.md` sur le site. Le lien de version mène au fichier sur GitHub.

## Décisions

### Un seul workflow, deux jobs
`.github/workflows/release.yml` remplace `pages.yml` :
1. Job `release` : `googleapis/release-please-action@v4`, configuré par manifeste. Il expose `release_created`.
2. Job `deploy` : `needs: release`, `if: needs.release.outputs.release_created == 'true' || github.event_name == 'workflow_dispatch'`. Il reprend tel quel le contenu de l'actuel `pages.yml` : tests, `build:site`, puis upload et `deploy-pages`.

*Pourquoi pas un workflow `on: release` séparé* : une release créée avec le `GITHUB_TOKEN` ne déclenche aucun autre workflow. Il faudrait alors un PAT ou une GitHub App, c'est-à-dire un secret de plus à gérer.

Les permissions sont `contents: write` et `pull-requests: write` pour release-please, `pages: write` et `id-token: write` pour le déploiement. Elles sont déclarées job par job. La `concurrency: pages` est conservée sur le job `deploy`.

### Configuration par manifeste
- `release-please-config.json` : `release-type: node`, `bump-minor-pre-major: true`, `bump-patch-for-minor-pre-major: false`, `include-v-in-tag: true`, `bootstrap-sha` sur le commit de `main` au moment de la fusion de ce changement, et `changelog-sections` :
  - `feat` → « Nouveautés »
  - `fix` → « Corrections »
  - `perf` → « Performances »
  - `revert` → « Retours en arrière »
  - `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `style` → `hidden: true`
- `.release-please-manifest.json` : `{ ".": "0.1.0" }`.
- `package.json` : `"version": "0.1.0"`.

*Alternative écartée* : le mode simple (`release-type` passé à l'action, sans manifeste). Il ne permet ni `bootstrap-sha` ni des sections renommées.

### Squash-merge et titre de PR
release-please lit les commits de `main`. Avec le squash, chaque PR donne un seul commit dont le message est le titre de la PR. Seul ce titre doit donc être conventionnel. Les commits de branche (archives openspec, sections arc42) ne sont jamais lus. Le dépôt est réglé ainsi : squash seulement, titre de la PR comme titre du commit, description comme corps du commit. GitHub Actions peut créer des PR, ce qu'exige release-please. Les permissions par défaut des workflows restent en lecture.

La dernière section de `CHANGELOG.md` porte un titre en anglais (« ⚠ BREAKING CHANGES ») fixé par release-please. On l'accepte tel quel.

### Version injectée au build (couche ui)
- Le script `build` d'esbuild reçoit `--define:__OULIPAO_VERSION__=…`. La valeur est lue dans `package.json` par npm : `"$npm_package_version"`, entre guillemets JSON.
- `src/ui/tracks/main.ts` (exclu de la couverture) lit `__OULIPAO_VERSION__` et le passe à `App` par une nouvelle prop `version`. `app.ts` reste testable sans globale : le test passe une version factice.
- `src/ui/page.ts` (exclu de la couverture) remplit un élément de la page d'essai. Une petite fonction pure de `src/ui/` (par exemple `versionLabel(version)` → `{ text: 'v0.1.0', href }`) est partagée et testée.
- Une déclaration `declare const __OULIPAO_VERSION__: string` est ajoutée dans un fichier `.d.ts` de `src/ui/`.
- Le lien mène à `https://github.com/constructions-incongrues/oulipao/blob/main/CHANGELOG.md`. C'est une navigation et non une requête : la politique de sécurité du contenu n'est pas touchée.

Aucun nouveau module de domaine ni de port : tout se passe dans la couche ui et dans l'outillage.

*Alternative écartée* : lire `package.json` à l'exécution. Cela ajoute une requête et sert un fichier de plus.

### Apparence
Dans la barre de marque, la version reprend le style de touche du lien « Code source » (`.key`), dans une variante discrète. `DESIGN.md` est à lire avant l'implémentation. S'il n'offre pas de variante adaptée, il faut demander au fondateur.

## Risques / Compromis

- [Un titre de PR non conventionnel passe] → La PR est absente du journal et ne déclenche pas de version. Mitigation : règle dans `CLAUDE.md`. Au besoin, release-please permet de corriger après coup avec un `Release-As:` ou en éditant la PR de version.
- [Corrections en attente : un correctif urgent n'est pas en ligne tant que la PR de version n'est pas fusionnée] → C'est voulu. Pour un correctif, il suffit de fusionner la PR de version juste après, ou de lancer la publication à la main.
- [La publication à la main publie `main`, y compris des changements pas encore versionnés] → La version affichée est alors celle du dernier `package.json`. C'est acceptable pour un usage de dépannage, et c'est documenté dans le guide de publication.
- [`bootstrap-sha` mal posé] → release-please relit tout l'historique non conventionnel. Le résultat est sans danger (les commits sont ignorés), seulement bruyant. Mitigation : vérifier la première PR de version avant de la fusionner.

## Plan de migration

1. Le dépôt est déjà réglé (fait le 2026-10-03 avec `gh`) : squash-merge seul, titre de PR comme titre du commit, description de PR comme corps du commit, et GitHub Actions autorisé à créer des PR.
2. Fusionner ce changement en squash, sous le titre `ci: publication par version`. Le type `ci` le tient hors du journal. Le nouveau workflow tourne, mais `bootstrap-sha` désigne le commit précédent et le seul commit lu est masqué : aucune PR de version n'est encore proposée.
3. La première PR `feat:` ou `fix:` fusionnée ensuite ouvre la PR de version. Sa fusion donne le tag, la release, puis le déploiement.

Retour arrière : restaurer `pages.yml` depuis l'historique et supprimer `release.yml`. Les tags et le changelog peuvent rester.
